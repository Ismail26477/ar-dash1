-- ============================================================
-- CRITICAL FIXES: stock function, RLS recursion, server-side
-- notifications, discount usage. Idempotent / re-runnable.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ROLE HELPER (SECURITY DEFINER) — breaks RLS recursion
--    A policy on `profiles` that SELECTs `profiles` recurses.
--    A SECURITY DEFINER function bypasses RLS, so policies can
--    safely call it.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_uid UUID, _roles user_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _uid AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.has_role(_uid, ARRAY['admin']::user_role[]);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.has_role(_uid, ARRAY['admin','seller']::user_role[]);
$$;

-- ------------------------------------------------------------
-- 2. REPLACE RECURSIVE / SELF-REFERENCING POLICIES with helper
-- ------------------------------------------------------------
-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.is_admin());

-- addresses
DROP POLICY IF EXISTS "Admins can view all addresses" ON public.addresses;
CREATE POLICY "Admins can view all addresses"
ON public.addresses FOR SELECT
USING (public.is_admin());

-- products
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true OR public.is_staff());

DROP POLICY IF EXISTS "Admin and seller can insert products" ON public.products;
CREATE POLICY "Admin and seller can insert products"
ON public.products FOR INSERT
WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Admin and seller can update products" ON public.products;
CREATE POLICY "Admin and seller can update products"
ON public.products FOR UPDATE
USING (public.is_staff());

DROP POLICY IF EXISTS "Admin and seller can delete products" ON public.products;
CREATE POLICY "Admin and seller can delete products"
ON public.products FOR DELETE
USING (public.is_staff());

-- orders
DROP POLICY IF EXISTS "Admins view all orders" ON public.orders;
CREATE POLICY "Admins view all orders"
ON public.orders FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders"
ON public.orders FOR UPDATE
USING (public.is_admin());

-- order_items
DROP POLICY IF EXISTS "Admins view all order items" ON public.order_items;
CREATE POLICY "Admins view all order items"
ON public.order_items FOR SELECT
USING (public.is_admin());

-- categories
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
CREATE POLICY "Admin can manage categories"
ON public.categories FOR ALL
USING (public.is_admin());

-- reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews FOR SELECT
USING (is_approved = true OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin can manage all reviews" ON public.reviews;
CREATE POLICY "Admin can manage all reviews"
ON public.reviews FOR ALL
USING (public.is_admin());

-- discounts
DROP POLICY IF EXISTS "Admin can manage discounts" ON public.discounts;
CREATE POLICY "Admin can manage discounts"
ON public.discounts FOR ALL
USING (public.is_admin());

-- notifications
DROP POLICY IF EXISTS "Admin can create notifications" ON public.notifications;
CREATE POLICY "Admin can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (public.is_admin());

-- support tickets
DROP POLICY IF EXISTS "Admin can view all tickets" ON public.support_tickets;
CREATE POLICY "Admin can view all tickets"
ON public.support_tickets FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update all tickets" ON public.support_tickets;
CREATE POLICY "Admin can update all tickets"
ON public.support_tickets FOR UPDATE
USING (public.is_admin());

-- order status history
DROP POLICY IF EXISTS "Admins view all order history" ON public.order_status_history;
CREATE POLICY "Admins view all order history"
ON public.order_status_history FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can insert order history" ON public.order_status_history;
CREATE POLICY "Admin can insert order history"
ON public.order_status_history FOR INSERT
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 3. ATOMIC STOCK DECREMENT (was called by the app but never
--    defined → stock never decremented). Guards against
--    overselling.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  UPDATE public.products
  SET stock = stock - p_quantity,
      sales = sales + p_quantity
  WHERE id = p_product_id
    AND stock >= p_quantity;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

-- Restore stock (used on cancel / refund / failed payment cleanup)
CREATE OR REPLACE FUNCTION public.increment_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = stock + p_quantity,
      sales = GREATEST(sales - p_quantity, 0)
  WHERE id = p_product_id;
END;
$$;

-- ------------------------------------------------------------
-- 4. ATOMIC ORDER PLACEMENT — creates order + items, decrements
--    stock, and clears cart in ONE transaction. Prevents partial
--    orders and order-number races. Returns the created order id
--    and number.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_order(
  p_shipping_address JSONB,
  p_subtotal NUMERIC,
  p_tax NUMERIC,
  p_shipping_cost NUMERIC,
  p_discount NUMERIC,
  p_total NUMERIC,
  p_payment_method payment_method,
  p_items JSONB,
  p_discount_code TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_order_number TEXT;
  v_order_id UUID;
  v_item JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order has no items';
  END IF;

  v_order_number := public.generate_order_number();

  INSERT INTO public.orders (
    order_number, user_id, shipping_address, subtotal, tax, shipping_cost,
    discount, total, payment_method, payment_status, order_status
  ) VALUES (
    v_order_number, v_uid, p_shipping_address, p_subtotal, p_tax, p_shipping_cost,
    p_discount, p_total, p_payment_method, 'pending', 'placed'
  )
  RETURNING orders.id INTO v_order_id;

  -- items + stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    PERFORM public.decrement_stock(
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER
    );

    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_sku, product_image, quantity, price, total
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      v_item->>'product_sku',
      NULLIF(v_item->>'product_image', ''),
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC,
      (v_item->>'total')::NUMERIC
    );
  END LOOP;

  -- discount usage
  IF p_discount_code IS NOT NULL THEN
    UPDATE public.discounts
    SET usage_count = usage_count + 1
    WHERE code = UPPER(p_discount_code) AND is_active = true;
  END IF;

  -- clear cart
  DELETE FROM public.cart_items WHERE user_id = v_uid;

  RETURN QUERY SELECT v_order_id, v_order_number;
END;
$$;

-- ------------------------------------------------------------
-- 5. SERVER-DRIVEN NOTIFICATIONS (no client write / RLS issues)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_order_placed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'order_placed',
    'Order placed',
    'Your order ' || NEW.order_number || ' has been placed successfully.',
    jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_placed ON public.orders;
CREATE TRIGGER on_order_placed
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_placed();

CREATE OR REPLACE FUNCTION public.notify_order_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- payment status change
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NEW.payment_status = 'paid' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (NEW.user_id, 'payment_success', 'Payment received',
            'We received your payment for order ' || NEW.order_number || '.',
            jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number));
  END IF;

  -- order status change
  IF NEW.order_status IS DISTINCT FROM OLD.order_status THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (NEW.user_id, 'order_status',
            'Order ' || REPLACE(NEW.order_status::TEXT, '_', ' '),
            'Your order ' || NEW.order_number || ' is now ' || REPLACE(NEW.order_status::TEXT, '_', ' ') || '.',
            jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'status', NEW.order_status));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_updated ON public.orders;
CREATE TRIGGER on_order_updated
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_updated();

-- ------------------------------------------------------------
-- 6. updated_at triggers for tables that were missing them
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
