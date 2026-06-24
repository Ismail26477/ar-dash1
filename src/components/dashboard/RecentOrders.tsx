import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Package, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecentOrders } from "@/hooks/useAdminData";

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  placed: { bg: "bg-warning/10", text: "text-warning", label: "Placed" },
  confirmed: { bg: "bg-info/10", text: "text-info", label: "Confirmed" },
  processing: { bg: "bg-info/10", text: "text-info", label: "Processing" },
  packed: { bg: "bg-primary/10", text: "text-primary", label: "Packed" },
  shipped: { bg: "bg-primary/10", text: "text-primary", label: "Shipped" },
  out_for_delivery: { bg: "bg-primary/10", text: "text-primary", label: "Out for Delivery" },
  delivered: { bg: "bg-success/10", text: "text-success", label: "Delivered" },
  cancelled: { bg: "bg-destructive/10", text: "text-destructive", label: "Cancelled" },
  refunded: { bg: "bg-destructive/10", text: "text-destructive", label: "Refunded" },
};

const fallbackStatus = { bg: "bg-muted", text: "text-muted-foreground", label: "Unknown" };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function RecentOrders() {
  const { data: orders, isLoading, error } = useRecentOrders(5);

  return (
    <Card className="animate-fade-in stagger-3">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        <Button asChild variant="ghost" size="sm" className="text-primary gap-1">
          <Link to="/admin/orders">
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load orders
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No orders yet
              </div>
            )}
            {orders?.map((order) => {
              const status = statusStyles[order.status] || fallbackStatus;
              return (
                <Link
                  to={`/admin/orders`}
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        #{order.orderNumber} • {order.product}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-sm">{formatCurrency(order.amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(order.createdAt)}</p>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs font-medium",
                        status.bg,
                        status.text,
                        "border-0"
                      )}
                    >
                      {status.label}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
