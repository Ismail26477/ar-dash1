-- ============================================================
-- AR COMPUTERS — COMPLETE ONE-SHOT SETUP (admin dashboard backend)
-- Run this entire file ONCE in the Supabase SQL Editor.
-- Safe clean reset: drops & recreates the app tables, then seeds
-- data, wires functions/RLS/triggers/storage, backfills profiles
-- from auth.users, and promotes the admin account.
--
-- >>> Change ADMIN_EMAIL below if needed. <<<
-- ============================================================

-- ----- 0. EXTENSIONS FIRST (this was the bug: gin_trgm_ops needs pg_trgm) -----
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----- 1. DROP (clean reset, FK-safe order) -----
DROP TABLE IF EXISTS public.ticket_replies CASCADE;
DROP TABLE IF EXISTS public.order_status_history CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.payment_method CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.shipment_status CASCADE;
DROP TYPE IF EXISTS public.ticket_status CASCADE;
DROP TYPE IF EXISTS public.ticket_priority CASCADE;

-- ----- 2. ENUMS -----
CREATE TYPE public.user_role AS ENUM ('customer', 'seller', 'admin');
CREATE TYPE public.order_status AS ENUM ('placed','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','refunded');
CREATE TYPE public.payment_method AS ENUM ('razorpay', 'cod');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high');

-- ----- 3. TABLES -----
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL, phone TEXT NOT NULL, street TEXT NOT NULL,
  city TEXT NOT NULL, state TEXT NOT NULL, pincode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India', is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE,
  description TEXT, image_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  description TEXT, category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  compare_price DECIMAL(10,2) CHECK (compare_price >= 0),
  cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reorder_point INTEGER NOT NULL DEFAULT 10,
  image_url TEXT, images TEXT[] DEFAULT '{}', specifications JSONB DEFAULT '{}',
  sales INTEGER NOT NULL DEFAULT 0, revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true, is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_products_name ON public.products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_sku ON public.products(sku);

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
CREATE INDEX idx_cart_user ON public.cart_items(user_id);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  shipping_address JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  tax DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  discount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  razorpay_order_id TEXT, razorpay_payment_id TEXT,
  order_status order_status NOT NULL DEFAULT 'placed',
  tracking_number TEXT, carrier TEXT, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(order_status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL, product_sku TEXT NOT NULL, product_image TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT, content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false, helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);

CREATE TABLE public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, type TEXT NOT NULL CHECK (type IN ('percentage','fixed')),
  value DECIMAL(10,2) NOT NULL CHECK (value > 0), min_order DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2), usage_limit INTEGER, usage_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL,
  data JSONB DEFAULT '{}', is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL, message TEXT NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tickets_user ON public.support_tickets(user_id);

CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status order_status NOT NULL, note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_status_history_order ON public.order_status_history(order_id);

-- ----- 4. HELPER FUNCTIONS (defined BEFORE policies that use them) -----
CREATE OR REPLACE FUNCTION public.has_role(_uid UUID, _roles user_role[])
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = ANY(_roles));
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT public.has_role(_uid, ARRAY['admin']::user_role[]);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT public.has_role(_uid, ARRAY['admin','seller']::user_role[]);
$$;

-- ----- 5. RLS -----
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all addresses" ON public.addresses FOR SELECT USING (public.is_admin());

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL USING (public.is_admin());

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View active or staff" ON public.products FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "Staff insert products" ON public.products FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff update products" ON public.products FOR UPDATE USING (public.is_staff());
CREATE POLICY "Staff delete products" ON public.products FOR DELETE USING (public.is_staff());

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE USING (public.is_admin());

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));
CREATE POLICY "Admins view all order items" ON public.order_items FOR SELECT USING (public.is_admin());
CREATE POLICY "Users create order items" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View approved/own/admin reviews" ON public.reviews FOR SELECT
  USING (is_approved = true OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin manage reviews" ON public.reviews FOR ALL USING (public.is_admin());

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active discounts" ON public.discounts FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage discounts" ON public.discounts FOR ALL USING (public.is_admin());

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin create notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_admin());

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin view all tickets" ON public.support_tickets FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin update all tickets" ON public.support_tickets FOR UPDATE USING (public.is_admin());

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order history" ON public.order_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));
CREATE POLICY "Admins view all order history" ON public.order_status_history FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin insert order history" ON public.order_status_history FOR INSERT WITH CHECK (public.is_admin());

-- ----- 6. CORE FUNCTIONS + TRIGGERS -----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
          COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer'));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE TRIGGER t_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER t_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER t_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER t_addresses_updated BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER t_cart_updated BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER t_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER t_tickets_updated BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.create_order_status_history()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.order_status IS DISTINCT FROM OLD.order_status THEN
    INSERT INTO public.order_status_history (order_id, status, note, created_by)
    VALUES (NEW.id, NEW.order_status, 'Status updated', auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_order_status_change AFTER UPDATE OF order_status ON public.orders
  FOR EACH ROW WHEN (NEW.order_status IS DISTINCT FROM OLD.order_status)
  EXECUTE FUNCTION public.create_order_status_history();

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1000;
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'ARC-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(NEXTVAL('public.order_number_seq')::TEXT, 5, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_updated INTEGER;
BEGIN
  IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;
  UPDATE public.products SET stock = stock - p_quantity, sales = sales + p_quantity
   WHERE id = p_product_id AND stock >= p_quantity;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN RAISE EXCEPTION 'Insufficient stock for product %', p_product_id; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.increment_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products SET stock = stock + p_quantity, sales = GREATEST(sales - p_quantity, 0)
   WHERE id = p_product_id;
END; $$;

CREATE OR REPLACE FUNCTION public.place_order(
  p_shipping_address JSONB, p_subtotal NUMERIC, p_tax NUMERIC, p_shipping_cost NUMERIC,
  p_discount NUMERIC, p_total NUMERIC, p_payment_method payment_method,
  p_items JSONB, p_discount_code TEXT DEFAULT NULL)
RETURNS TABLE (id UUID, order_number TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_order_number TEXT; v_order_id UUID; v_item JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Order has no items'; END IF;
  v_order_number := public.generate_order_number();
  INSERT INTO public.orders (order_number,user_id,shipping_address,subtotal,tax,shipping_cost,discount,total,payment_method,payment_status,order_status)
  VALUES (v_order_number,v_uid,p_shipping_address,p_subtotal,p_tax,p_shipping_cost,p_discount,p_total,p_payment_method,'pending','placed')
  RETURNING orders.id INTO v_order_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    PERFORM public.decrement_stock((v_item->>'product_id')::UUID,(v_item->>'quantity')::INTEGER);
    INSERT INTO public.order_items (order_id,product_id,product_name,product_sku,product_image,quantity,price,total)
    VALUES (v_order_id,(v_item->>'product_id')::UUID,v_item->>'product_name',v_item->>'product_sku',
            NULLIF(v_item->>'product_image',''),(v_item->>'quantity')::INTEGER,(v_item->>'price')::NUMERIC,(v_item->>'total')::NUMERIC);
  END LOOP;
  IF p_discount_code IS NOT NULL THEN
    UPDATE public.discounts SET usage_count = usage_count + 1 WHERE code = UPPER(p_discount_code) AND is_active = true;
  END IF;
  DELETE FROM public.cart_items WHERE user_id = v_uid;
  RETURN QUERY SELECT v_order_id, v_order_number;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_order_placed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id,type,title,message,data)
  VALUES (NEW.user_id,'order_placed','Order placed',
          'Your order ' || NEW.order_number || ' has been placed successfully.',
          jsonb_build_object('order_id',NEW.id,'order_number',NEW.order_number));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_order_placed ON public.orders;
CREATE TRIGGER on_order_placed AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_order_placed();

CREATE OR REPLACE FUNCTION public.notify_order_updated()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NEW.payment_status = 'paid' THEN
    INSERT INTO public.notifications (user_id,type,title,message,data)
    VALUES (NEW.user_id,'payment_success','Payment received',
            'We received your payment for order ' || NEW.order_number || '.',
            jsonb_build_object('order_id',NEW.id,'order_number',NEW.order_number));
  END IF;
  IF NEW.order_status IS DISTINCT FROM OLD.order_status THEN
    INSERT INTO public.notifications (user_id,type,title,message,data)
    VALUES (NEW.user_id,'order_status','Order ' || REPLACE(NEW.order_status::TEXT,'_',' '),
            'Your order ' || NEW.order_number || ' is now ' || REPLACE(NEW.order_status::TEXT,'_',' ') || '.',
            jsonb_build_object('order_id',NEW.id,'order_number',NEW.order_number,'status',NEW.order_status));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_order_updated ON public.orders;
CREATE TRIGGER on_order_updated AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_order_updated();

-- ----- 7. STORAGE BUCKETS + POLICIES -----
INSERT INTO storage.buckets (id,name,public) VALUES ('product-images','product-images',true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id,name,public) VALUES ('avatars','avatars',true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id,name,public) VALUES ('category-images','category-images',true) ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;
CREATE POLICY "Product images public read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Staff upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_staff());
CREATE POLICY "Staff update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.is_staff());
CREATE POLICY "Staff delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.is_staff());

CREATE POLICY "Avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Category images public read" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');
CREATE POLICY "Admin upload category images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-images' AND public.is_admin());

-- ----- 8. SEED DATA -----
INSERT INTO public.categories (name, slug, description) VALUES
  ('Graphics Cards','graphics-cards','NVIDIA and AMD graphics cards'),
  ('Processors','processors','Intel and AMD processors'),
  ('Laptops','laptops','Gaming laptops and workstations'),
  ('Monitors','monitors','Gaming and professional displays'),
  ('Memory','memory','DDR4 and DDR5 RAM kits'),
  ('Storage','storage','SSDs, HDDs, and NVMe drives'),
  ('Motherboards','motherboards','Intel and AMD motherboards'),
  ('Power Supplies','power-supplies','PSUs for all builds'),
  ('Cooling','cooling','CPU coolers and fans'),
  ('Peripherals','peripherals','Keyboards, mice, headsets')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.products (sku,name,slug,description,category_id,price,stock,reorder_point,sales,revenue,is_featured)
SELECT 'GPU-4090-24G','NVIDIA RTX 4090','nvidia-rtx-4090','RTX 4090 24GB GDDR6X',id,189999,2,10,127,24128873,true FROM public.categories WHERE slug='graphics-cards';
INSERT INTO public.products (sku,name,slug,description,category_id,price,stock,reorder_point,sales,revenue,is_featured)
SELECT 'CPU-I9-14900K','Intel Core i9-14900K','intel-core-i9-14900k','14th Gen Desktop Processor',id,62499,5,15,234,14624766,true FROM public.categories WHERE slug='processors';
INSERT INTO public.products (sku,name,slug,description,category_id,price,stock,reorder_point,sales,revenue,is_featured)
SELECT 'LAP-ROG-G16','ASUS ROG Strix G16','asus-rog-strix-g16','ROG Strix G16 Gaming Laptop',id,145000,12,8,89,12905000,true FROM public.categories WHERE slug='laptops';
INSERT INTO public.products (sku,name,slug,description,category_id,price,stock,reorder_point,sales,revenue,is_featured)
SELECT 'MON-SAM-49','Samsung 49" Odyssey','samsung-49-odyssey','Odyssey G9 Gaming Monitor',id,112999,8,5,56,6327944,true FROM public.categories WHERE slug='monitors';
INSERT INTO public.products (sku,name,slug,description,category_id,price,stock,reorder_point,sales,revenue)
SELECT 'RAM-DDR5-64G','Corsair DDR5 64GB Kit','corsair-ddr5-64gb-kit','Vengeance DDR5 64GB',id,28999,45,20,312,9047688 FROM public.categories WHERE slug='memory';
INSERT INTO public.products (sku,name,slug,description,category_id,price,stock,reorder_point,sales,revenue)
SELECT 'SSD-990P-2TB','Samsung 990 Pro 2TB','samsung-990-pro-2tb','990 Pro 2TB NVMe SSD',id,18999,3,12,189,3590811 FROM public.categories WHERE slug='storage';
INSERT INTO public.products (sku,name,slug,description,category_id,price,stock,reorder_point,sales,revenue,is_featured)
SELECT 'GPU-4080-16G','NVIDIA RTX 4080 Super','nvidia-rtx-4080-super','RTX 4080 Super 16GB',id,109999,15,10,98,10779902,true FROM public.categories WHERE slug='graphics-cards';

-- ----- 9. BACKFILL PROFILES FOR EXISTING AUTH USERS -----
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email,'@',1)), 'customer'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ----- 10. PROMOTE ADMIN  (change the email if needed) -----
UPDATE public.profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'shubhamkhanzode4@gmail.com');

-- Done. Verify:
SELECT email, role FROM public.profiles ORDER BY role;
