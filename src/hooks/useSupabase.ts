import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Product, Category, CartItem, Order, OrderItem,
  Address, Profile, Review, Discount, Notification,
  OrderStatusHistory, OrderStatus, PaymentMethod
} from "@/integrations/supabase/types";
import { toast } from "sonner";

// ============================================
// CATEGORIES
// ============================================
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 60000,
  });
}

// ============================================
// PRODUCTS
// ============================================
export function useProducts(options?: { featured?: boolean; category?: string; search?: string; limit?: number }) {
  return useQuery({
    queryKey: ["products", options],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, category:categories(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (options?.featured) query = query.eq("is_featured", true);
      if (options?.category) query = query.eq("category_id", options.category);
      if (options?.search) query = query.ilike("name", `%${options.search}%`);
      if (options?.limit) query = query.limit(options.limit);

      const { data, error } = await query;
      if (error) throw error;
      return data as (Product & { category: Category | null })[];
    },
    staleTime: 30000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(*)")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as Product & { category: Category | null };
    },
    enabled: !!slug,
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Product & { category: Category | null })[];
    },
    staleTime: 30000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      sku: string; name: string; slug: string; description?: string;
      category_id?: string; price: number; stock: number; reorder_point?: number;
      image_url?: string; specifications?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product created successfully");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create product"),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update product"),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete product"),
  });
}

// ============================================
// CART
// ============================================
export function useCart(userId?: string) {
  return useQuery({
    queryKey: ["cart", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, product:products(*)")
        .eq("user_id", userId!);
      if (error) throw error;
      return data as (CartItem & { product: Product | null })[];
    },
    enabled: !!userId,
    staleTime: 5000,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, productId, quantity = 1 }: { userId: string; productId: string; quantity?: number }) => {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: userId, product_id: productId, quantity });
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["cart", variables.userId] });
      toast.success("Added to cart");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add to cart"),
  });
}

export function useUpdateCartQuantity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity, userId }: { itemId: string; quantity: number; userId: string }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["cart", variables.userId] });
    },
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, userId }: { itemId: string; userId: string }) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["cart", variables.userId] });
      toast.success("Removed from cart");
    },
  });
}

export function useClearCart(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart", userId] });
    },
  });
}

// ============================================
// ADDRESSES
// ============================================
export function useAddresses(userId?: string) {
  return useQuery({
    queryKey: ["addresses", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId!)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!userId,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (address: {
      user_id: string; full_name: string; phone: string;
      street: string; city: string; state: string; pincode: string;
      is_default?: boolean;
    }) => {
      if (address.is_default) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", address.user_id);
      }
      const { data, error } = await supabase.from("addresses").insert(address).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address added");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add address"),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from("addresses").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address updated");
    },
  });
}

// ============================================
// ORDERS
// ============================================
export function useOrders(userId?: string) {
  return useQuery({
    queryKey: ["orders", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Order & { order_items: OrderItem[] })[];
    },
    enabled: !!userId,
    staleTime: 10000,
  });
}

export function useAdminAllOrders() {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), user:profiles(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 10000,
  });
}

export function useOrder(id?: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Order & { order_items: OrderItem[] };
    },
    enabled: !!id,
  });
}

export function useOrderByNumber(orderNumber?: string) {
  return useQuery({
    queryKey: ["order-by-number", orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_number", orderNumber!)
        .single();
      if (error) throw error;
      return data as Order & { order_items: OrderItem[] };
    },
    enabled: !!orderNumber,
  });
}

export function useOrderStatusHistory(orderId?: string) {
  return useQuery({
    queryKey: ["order-history", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as OrderStatusHistory[];
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: {
      user_id: string; shipping_address: Record<string, unknown>;
      subtotal: number; tax: number; shipping_cost: number; discount: number;
      total: number; payment_method: PaymentMethod; discount_code?: string;
      items: { product_id: string; product_name: string; product_sku: string; product_image?: string; quantity: number; price: number; total: number }[];
    }) => {
      // Atomic server-side placement: creates order + items, decrements
      // stock, applies discount usage and clears the cart in one transaction.
      // Order is bound to auth.uid() inside the RPC (never trusts the client).
      const { data, error } = await supabase.rpc("place_order", {
        p_shipping_address: order.shipping_address,
        p_subtotal: order.subtotal,
        p_tax: order.tax,
        p_shipping_cost: order.shipping_cost,
        p_discount: order.discount,
        p_total: order.total,
        p_payment_method: order.payment_method,
        p_items: order.items,
        p_discount_code: order.discount_code ?? null,
      });
      if (error) throw error;

      // RPC returns a single-row table: { id, order_number }
      const row = Array.isArray(data) ? data[0] : data;
      return row as { id: string; order_number: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Order placed successfully!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create order"),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus; note?: string }) => {
      // The order_status_history row + customer notification are inserted by
      // DB triggers (create_order_status_history / notify_order_updated), so we
      // only update the order here to avoid duplicate history entries.
      const { error } = await supabase
        .from("orders")
        .update({ order_status: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["order-history"] });
      toast.success("Order status updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update order"),
  });
}

// ============================================
// PROFILE
// ============================================
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update profile"),
  });
}

// ============================================
// REVIEWS
// ============================================
export function useProductReviews(productId?: string) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, user:profiles(full_name, avatar_url)")
        .eq("product_id", productId!)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useAdminAllReviews() {
  return useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, user:profiles(full_name, email), product:products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (review: { product_id: string; user_id: string; rating: number; title?: string; content: string }) => {
      const { error } = await supabase.from("reviews").insert(review);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review submitted for approval");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to submit review"),
  });
}

export function useApproveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").update({ is_approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review approved");
    },
  });
}

// ============================================
// DISCOUNTS
// ============================================
export function useAdminDiscounts() {
  return useQuery({
    queryKey: ["admin-discounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("discounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Discount[];
    },
  });
}

export function useValidateDiscount() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .single();
      if (error) throw new Error("Invalid discount code");
      const discount = data as Discount;
      if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
        throw new Error("Discount code has reached its usage limit");
      }
      return discount;
    },
  });
}

// ============================================
// NOTIFICATIONS
// ============================================
export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ============================================
// ANALYTICS
// ============================================
export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [ordersRes, productsRes, customersRes] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("products").select("*"),
        supabase.from("profiles").select("id, created_at"),
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const customers = customersRes.data || [];

      const totalRevenue = orders.reduce((sum: number, o: Order) => sum + Number(o.total), 0);
      const totalOrders = orders.length;
      const paidOrders = orders.filter((o: Order) => o.payment_status === "paid");
      const totalPaidRevenue = paidOrders.reduce((sum: number, o: Order) => sum + Number(o.total), 0);
      const avgOrderValue = totalOrders > 0 ? totalPaidRevenue / totalOrders : 0;
      const totalCustomers = customers.length;
      const lowStockItems = products.filter((p: Product) => p.stock <= p.reorder_point).length;
      const outOfStock = products.filter((p: Product) => p.stock === 0).length;

      const pendingOrders = orders.filter((o: Order) =>
        ["placed", "confirmed", "processing"].includes(o.order_status)
      ).length;

      const todayOrders = orders.filter((o: Order) =>
        new Date(o.created_at) >= firstOfMonth
      ).length;

      const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(today.getFullYear(), i, 1);
        const monthOrders = orders.filter((o: Order) => {
          const d = new Date(o.created_at);
          return d.getMonth() === i && d.getFullYear() === today.getFullYear();
        });
        return {
          month: month.toLocaleDateString("en-US", { month: "short" }),
          revenue: monthOrders.reduce((s: number, o: Order) => s + Number(o.total), 0),
          orders: monthOrders.length,
        };
      });

      return {
        totalRevenue,
        totalOrders,
        totalPaidRevenue,
        newCustomers: customers.filter((c: Profile) => new Date(c.created_at) >= firstOfMonth).length,
        avgOrderValue,
        conversionRate: totalOrders > 0 ? Number(((totalOrders / Math.max(totalCustomers, 1)) * 100).toFixed(1)) : 0,
        liveVisitors: 0,
        pendingOrders,
        todayOrders,
        monthlyRevenue,
        totalProducts: products.length,
        totalCustomers,
        lowStockItems,
        outOfStock,
        topProducts: products.sort((a: Product, b: Product) => b.sales - a.sales).slice(0, 5),
      };
    },
    staleTime: 30000,
  });
}

// ============================================
// DASHBOARD STATUS
// ============================================
export function useSupabaseStatus() {
  return useQuery({
    queryKey: ["supabase-status"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id").limit(1);
      return { success: true, connected: true };
    },
    staleTime: 60000,
  });
}
