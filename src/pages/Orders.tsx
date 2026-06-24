import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useAdminAllOrders, useUpdateOrderStatus } from "@/hooks/useSupabase";
import type { Order, OrderItem, OrderStatus, Profile } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Loader2,
  Package,
  Mail,
  Calendar,
  IndianRupee,
  Eye,
  Filter,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notifyByEmail } from "@/lib/email";

type AdminOrder = Order & {
  order_items: OrderItem[];
  user: Pick<Profile, "full_name" | "email"> | null;
};

const ORDER_STATUSES: OrderStatus[] = [
  "placed",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
];

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  placed: { bg: "bg-amber-500/10", text: "text-amber-500", label: "Placed" },
  confirmed: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Confirmed" },
  processing: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Processing" },
  packed: { bg: "bg-indigo-500/10", text: "text-indigo-500", label: "Packed" },
  shipped: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Shipped" },
  out_for_delivery: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Out for Delivery" },
  delivered: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Delivered" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-500", label: "Cancelled" },
  refunded: { bg: "bg-red-500/10", text: "text-red-500", label: "Refunded" },
};

function styleFor(status: string) {
  return statusStyles[status] || { bg: "bg-muted", text: "text-muted-foreground", label: status };
}

function formatAmount(amount: number) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

function orderProductSummary(order: AdminOrder) {
  const items = order.order_items || [];
  if (items.length === 0) return "—";
  if (items.length === 1) return items[0].product_name;
  return `${items[0].product_name} +${items.length - 1} more`;
}

export default function Orders() {
  const { data: orders, isLoading, error } = useAdminAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const typedOrders = useMemo(() => (orders || []) as unknown as AdminOrder[], [orders]);

  const filteredOrders = useMemo(() => {
    return typedOrders.filter((order) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        order.order_number.toLowerCase().includes(searchLower) ||
        (order.user?.full_name || "").toLowerCase().includes(searchLower) ||
        (order.user?.email || "").toLowerCase().includes(searchLower) ||
        orderProductSummary(order).toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "all" || order.order_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [typedOrders, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: typedOrders.length };
    for (const s of ORDER_STATUSES) {
      counts[s] = typedOrders.filter((o) => o.order_status === s).length;
    }
    return counts;
  }, [typedOrders]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all";

  const handleStatusChange = (id: string, status: OrderStatus) => {
    const order = typedOrders.find((o) => o.id === id);
    updateStatus.mutate({ id, status });
    setSelectedOrder((prev) => (prev && prev.id === id ? { ...prev, order_status: status } : prev));

    // Email integration point: shipped / delivered.
    if ((status === "shipped" || status === "delivered") && order?.user?.email) {
      notifyByEmail({
        event: status,
        to: order.user.email,
        orderNumber: order.order_number,
        customerName: order.user.full_name,
        total: Number(order.total),
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground">
              Manage and track all your customer orders
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2 py-1.5">
              <Package className="w-3 h-3" />
              <span className="text-xs">{typedOrders.length} Total Orders</span>
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order #, customer, or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {styleFor(s).label} ({statusCounts[s]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2">
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {hasActiveFilters
                ? `Filtered Orders (${filteredOrders.length})`
                : "All Orders"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mb-4 opacity-50" />
                <p>Failed to load orders</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mb-4 opacity-50" />
                <p>No orders found</p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const status = styleFor(order.order_status);
                      return (
                        <TableRow key={order.id} className="group">
                          <TableCell className="font-mono font-medium">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.user?.full_name || "Guest"}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.user?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {orderProductSummary(order)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatAmount(order.total)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(status.bg, status.text, "border-0")}
                            >
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatShortDate(order.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Details
              </DialogTitle>
              <DialogDescription>{selectedOrder?.order_number}</DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Status control */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Update Status</span>
                  <Select
                    value={selectedOrder.order_status}
                    onValueChange={(v) => handleStatusChange(selectedOrder.id, v as OrderStatus)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {styleFor(s).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Items */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <h4 className="font-medium mb-2">Items</h4>
                  {(selectedOrder.order_items || []).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="truncate max-w-[260px]">
                        {item.product_name} × {item.quantity}
                      </span>
                      <span className="font-medium">{formatAmount(item.total)}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 pt-2 mt-2 border-t text-lg font-bold text-primary">
                    <IndianRupee className="w-4 h-4" />
                    {Number(selectedOrder.total).toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-3">
                  <h4 className="font-medium">Customer Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {(selectedOrder.user?.full_name || "G").charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{selectedOrder.user?.full_name || "Guest"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{selectedOrder.user?.email}</span>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="capitalize">
                    {selectedOrder.payment_method} · {selectedOrder.payment_status}
                  </span>
                </div>

                {/* Order Date */}
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground border-t pt-4">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedOrder.created_at)}
                  </span>
                  <Link
                    to={`/admin/orders`}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    Full view <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
