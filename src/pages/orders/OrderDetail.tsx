import { useParams, Link } from "react-router-dom";
import { useOrderByNumber, useOrderStatusHistory } from "@/hooks/useSupabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, ArrowLeft, IndianRupee, CheckCircle2, Clock, Truck, MapPin, XCircle } from "lucide-react";

const statusIcons: Record<string, React.ReactNode> = {
  placed: <Clock className="w-5 h-5 text-amber-500" />,
  confirmed: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
  processing: <Package className="w-5 h-5 text-blue-500" />,
  packed: <Package className="w-5 h-5 text-purple-500" />,
  shipped: <Truck className="w-5 h-5 text-purple-500" />,
  out_for_delivery: <Truck className="w-5 h-5 text-orange-500" />,
  delivered: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  cancelled: <XCircle className="w-5 h-5 text-red-500" />,
  refunded: <IndianRupee className="w-5 h-5 text-red-500" />,
};

const statusLabels: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const statusOrder = ["placed", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"];

export default function OrderDetail() {
  const { orderNumber } = useParams();
  const { data: order, isLoading } = useOrderByNumber(orderNumber);
  const { data: history } = useOrderStatusHistory(order?.id);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
  );

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-lg">Order not found</p>
        <Link to="/admin/orders"><Button variant="link">Back to Orders</Button></Link>
      </div>
    </div>
  );

  const currentStatusIndex = statusOrder.indexOf(order.order_status);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/admin/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>
          <h1 className="text-lg font-semibold">Order {order.order_number}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm text-muted-foreground font-mono">{order.order_number}</p>
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="capitalize">{statusLabels[order.order_status] || order.order_status}</Badge>
            </div>

            {order.order_status !== "cancelled" && order.order_status !== "refunded" && (
              <div className="mb-8">
                <div className="flex justify-between">
                  {statusOrder.map((status, i) => (
                    <div key={status} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        i <= currentStatusIndex ? "border-primary bg-primary/10" : "border-muted-foreground/30"
                      }`}>
                        {statusIcons[status]}
                      </div>
                      <p className={`text-xs mt-1 ${i <= currentStatusIndex ? "text-primary font-medium" : "text-muted-foreground"}`}>
                        {statusLabels[status]}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="relative mt-2">
                  <div className="absolute top-0 left-0 h-1 bg-muted w-full rounded" />
                  <div
                    className="absolute top-0 left-0 h-1 bg-primary rounded transition-all"
                    style={{ width: `${(currentStatusIndex / (statusOrder.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 m-3 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.product_sku} x{item.quantity}</p>
                  </div>
                  <p className="font-medium">₹{Number(item.total).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
              <CardContent>
                <p className="font-medium">{(order.shipping_address as Record<string, string>)?.full_name}</p>
                <p className="text-sm text-muted-foreground">{(order.shipping_address as Record<string, string>)?.phone}</p>
                <p className="text-sm text-muted-foreground">
                  {(order.shipping_address as Record<string, string>)?.street},
                  {(order.shipping_address as Record<string, string>)?.city},
                  {(order.shipping_address as Record<string, string>)?.state} -
                  {(order.shipping_address as Record<string, string>)?.pincode}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(order.subtotal).toLocaleString("en-IN")}</span></div>
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{Number(order.discount).toLocaleString("en-IN")}</span></div>
                  )}
                  <div className="flex justify-between"><span>Tax</span><span>₹{Number(order.tax).toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>{Number(order.shipping_cost) === 0 ? "Free" : `₹${Number(order.shipping_cost)}`}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span><span>₹{Number(order.total).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Method</span><span className="capitalize">{order.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment</span>
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"} className="capitalize">{order.payment_status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.tracking_number && (
              <Card>
                <CardHeader><CardTitle>Tracking</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm"><span className="text-muted-foreground">Carrier:</span> {order.carrier}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Tracking:</span> {order.tracking_number}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {history && history.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center gap-3">
                    {statusIcons[h.status] || <Clock className="w-4 h-4" />}
                    <div>
                      <p className="text-sm font-medium">{statusLabels[h.status] || h.status}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
