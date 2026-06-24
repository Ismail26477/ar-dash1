import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Order, OrderItem, Product, Profile } from "@/integrations/supabase/types";

// ============================================================
// Shared admin order fetch (orders + items + customer profile)
// ============================================================
type AdminOrder = Order & {
  order_items: OrderItem[];
  user: Pick<Profile, "full_name" | "email" | "phone"> | null;
};

async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), user:profiles(full_name, email, phone)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as AdminOrder[];
}

function customerName(o: AdminOrder): string {
  const addr = (o.shipping_address || {}) as Record<string, string>;
  return o.user?.full_name || addr.full_name || "Guest";
}

function customerEmail(o: AdminOrder): string {
  return o.user?.email || "";
}

function orderSummaryProduct(o: AdminOrder): string {
  const items = o.order_items || [];
  if (items.length === 0) return "—";
  if (items.length === 1) return items[0].product_name;
  return `${items[0].product_name} +${items.length - 1} more`;
}

// ============================================================
// RECENT ORDERS (dashboard) — normalized lightweight shape
// ============================================================
export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  product: string;
  amount: number;
  status: Order["order_status"];
  createdAt: string;
}

export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ["admin", "recent-orders", limit],
    queryFn: async (): Promise<RecentOrder[]> => {
      const orders = await fetchAdminOrders();
      return orders.slice(0, limit).map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerName: customerName(o),
        product: orderSummaryProduct(o),
        amount: Number(o.total),
        status: o.order_status,
        createdAt: o.created_at,
      }));
    },
    staleTime: 30000,
  });
}

// ============================================================
// TOP PRODUCTS (by units sold)
// ============================================================
export function useTopProducts(limit = 5) {
  return useQuery({
    queryKey: ["admin", "top-products", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sales", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as Product[];
    },
    staleTime: 30000,
  });
}

// ============================================================
// INVENTORY ALERTS (stock at or below reorder point)
// ============================================================
export function useInventoryAlerts() {
  return useQuery({
    queryKey: ["admin", "inventory-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("stock", { ascending: true });
      if (error) throw error;
      return ((data || []) as Product[]).filter((p) => p.stock <= p.reorder_point);
    },
    staleTime: 30000,
  });
}

// ============================================================
// CUSTOMERS (profiles aggregated with order stats)
// ============================================================
export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
}

export function useAdminCustomers() {
  return useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async (): Promise<AdminCustomer[]> => {
      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id, total, payment_status"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (ordersRes.error) throw ordersRes.error;

      const profiles = (profilesRes.data || []) as Profile[];
      const orders = (ordersRes.data || []) as Pick<Order, "user_id" | "total" | "payment_status">[];

      const stats = new Map<string, { count: number; spent: number }>();
      for (const o of orders) {
        const cur = stats.get(o.user_id) || { count: 0, spent: 0 };
        cur.count += 1;
        if (o.payment_status === "paid") cur.spent += Number(o.total);
        stats.set(o.user_id, cur);
      }

      return profiles.map((p) => {
        const s = stats.get(p.id) || { count: 0, spent: 0 };
        return {
          id: p.id,
          name: p.full_name || p.email.split("@")[0],
          email: p.email,
          phone: p.phone || "—",
          avatarUrl: p.avatar_url,
          role: p.role,
          joinedAt: p.created_at,
          totalOrders: s.count,
          totalSpent: s.spent,
        };
      });
    },
    staleTime: 30000,
  });
}

// Per-customer order history (admin)
export function useAdminCustomerOrders(userId?: string) {
  return useQuery({
    queryKey: ["admin", "customer-orders", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as (Order & { order_items: OrderItem[] })[];
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

// ============================================================
// PAYMENTS (transactions + refunds derived from orders)
// ============================================================
export interface AdminTransaction {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  method: string;
  status: "completed" | "pending" | "failed" | "refunded";
  date: string;
}

export interface AdminRefund {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  reason: string;
  status: "processed" | "pending";
  date: string;
}

const PAYMENT_STATUS_MAP: Record<string, AdminTransaction["status"]> = {
  paid: "completed",
  pending: "pending",
  failed: "failed",
  refunded: "refunded",
};

const METHOD_LABEL: Record<string, string> = {
  razorpay: "Online",
  cod: "Cash on Delivery",
};

export function useAdminPayments() {
  return useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      const orders = await fetchAdminOrders();

      const transactions: AdminTransaction[] = orders.map((o) => ({
        id: o.razorpay_payment_id || o.order_number,
        orderId: o.order_number,
        customer: customerName(o),
        amount: Number(o.total),
        method: METHOD_LABEL[o.payment_method] || o.payment_method,
        status: PAYMENT_STATUS_MAP[o.payment_status] || "pending",
        date: o.created_at,
      }));

      const refunds: AdminRefund[] = orders
        .filter((o) => o.payment_status === "refunded" || o.order_status === "refunded")
        .map((o) => ({
          id: `RFND-${o.order_number}`,
          orderId: o.order_number,
          customer: customerName(o),
          amount: Number(o.total),
          reason: o.notes || "Customer refund",
          status: o.payment_status === "refunded" ? "processed" : "pending",
          date: o.updated_at,
        }));

      return { transactions, refunds };
    },
    staleTime: 30000,
  });
}

// ============================================================
// FULFILLMENT (shipments + pending orders derived from orders)
// ============================================================
export interface AdminShipment {
  id: string;
  orderDbId: string;
  orderId: string;
  customer: string;
  address: string;
  items: number;
  carrier: string;
  trackingId: string;
  status: "processing" | "in_transit" | "out_for_delivery" | "delivered" | "failed";
  estimatedDelivery: string;
}

export interface PendingFulfillmentOrder {
  id: string;
  orderDbId: string;
  orderId: string;
  customer: string;
  product: string;
  amount: number;
  status: Order["order_status"];
}

const SHIPMENT_STATUS_MAP: Record<string, AdminShipment["status"]> = {
  packed: "processing",
  shipped: "in_transit",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  cancelled: "failed",
};

function formatAddress(o: AdminOrder): string {
  const a = (o.shipping_address || {}) as Record<string, string>;
  return [a.street, a.city, a.state, a.pincode].filter(Boolean).join(", ");
}

export function useAdminFulfillment() {
  return useQuery({
    queryKey: ["admin", "fulfillment"],
    queryFn: async () => {
      const orders = await fetchAdminOrders();

      const shipments: AdminShipment[] = orders
        .filter((o) => o.order_status in SHIPMENT_STATUS_MAP)
        .map((o) => ({
          id: o.tracking_number || `SHIP-${o.order_number}`,
          orderDbId: o.id,
          orderId: o.order_number,
          customer: customerName(o),
          address: formatAddress(o),
          items: (o.order_items || []).reduce((s, it) => s + it.quantity, 0),
          carrier: o.carrier || "Unassigned",
          trackingId: o.tracking_number || "—",
          status: SHIPMENT_STATUS_MAP[o.order_status],
          estimatedDelivery: "—",
        }));

      const pending: PendingFulfillmentOrder[] = orders
        .filter((o) => ["placed", "confirmed", "processing"].includes(o.order_status))
        .map((o) => ({
          id: o.id,
          orderDbId: o.id,
          orderId: o.order_number,
          customer: customerName(o),
          product: orderSummaryProduct(o),
          amount: Number(o.total),
          status: o.order_status,
        }));

      return { shipments, pending };
    },
    staleTime: 30000,
  });
}

// ============================================================
// SUPPORT TICKETS (admin)
// ============================================================
export function useAdminSupportTickets() {
  return useQuery({
    queryKey: ["admin", "support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, user:profiles(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });
}

// ============================================================
// DISCOUNTS — create / delete (admin)
// ============================================================
export interface NewDiscount {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order: number;
  usage_limit: number | null;
  ends_at: string | null;
}

export function useCreateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: NewDiscount) => {
      const { error } = await supabase.from("discounts").insert({
        code: d.code.toUpperCase().trim(),
        type: d.type,
        value: d.value,
        min_order: d.min_order,
        usage_limit: d.usage_limit,
        ends_at: d.ends_at,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-discounts"] });
      toast.success("Discount created");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create discount"),
  });
}

export function useDeleteDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-discounts"] });
      toast.success("Discount deleted");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete discount"),
  });
}

export { customerName, customerEmail };
