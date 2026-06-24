import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Box,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { useAdminFulfillment } from "@/hooks/useAdminData";
import { useUpdateOrderStatus } from "@/hooks/useSupabase";

const Fulfillment = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useAdminFulfillment();
  const updateStatus = useUpdateOrderStatus();
  const shipments = data?.shipments ?? [];
  const pendingOrders = data?.pending ?? [];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      processing: { variant: "secondary", label: "Processing" },
      in_transit: { variant: "default", label: "In Transit" },
      out_for_delivery: { variant: "default", label: "Out for Delivery" },
      delivered: { variant: "outline", label: "Delivered" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const config = statusConfig[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Box className="h-4 w-4 text-yellow-500" />;
      case "in_transit":
        return <Truck className="h-4 w-4 text-blue-500" />;
      case "out_for_delivery":
        return <MapPin className="h-4 w-4 text-purple-500" />;
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const inTransitCount = shipments.filter(s => s.status === "in_transit").length;
  const deliveredCount = shipments.filter(s => s.status === "delivered").length;
  const failedCount = shipments.filter(s => s.status === "failed").length;
  const deliveryRate = shipments.length > 0 ? Math.round((deliveredCount / shipments.length) * 100) : 0;

  const filteredShipments = shipments.filter(
    (s) =>
      s.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.trackingId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fulfillment</h1>
            <p className="text-muted-foreground mt-1">
              Manage shipping, tracking, and deliveries
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Fulfillment</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{pendingOrders.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Orders awaiting shipment
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{inTransitCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active shipments
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{deliveredCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successful deliveries
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{deliveryRate}%</div>
                  <Progress value={deliveryRate} className="mt-2" />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alert for failed deliveries */}
        {failedCount > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Attention Required</p>
                <p className="text-sm text-muted-foreground">
                  {failedCount} shipment(s) failed delivery and need action
                </p>
              </div>
              <Button variant="destructive" size="sm">
                View Failed
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="shipments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="shipments">All Shipments</TabsTrigger>
            <TabsTrigger value="pending">Pending Orders</TabsTrigger>
            <TabsTrigger value="carriers">Carriers</TabsTrigger>
          </TabsList>

          <TabsContent value="shipments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Shipment Tracking</CardTitle>
                    <CardDescription>Track and manage all shipments</CardDescription>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search shipments..."
                        className="pl-9 w-full sm:w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipment</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Est. Delivery</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(shipment.status)}
                            <span className="font-mono text-sm">{shipment.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{shipment.orderId}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{shipment.customer}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {shipment.address}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{shipment.carrier}</TableCell>
                        <TableCell className="font-mono text-xs">{shipment.trackingId}</TableCell>
                        <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{shipment.estimatedDelivery}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders Awaiting Fulfillment</CardTitle>
                <CardDescription>These orders need to be packed and shipped</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">All Caught Up!</h3>
                    <p className="text-muted-foreground mt-2">
                      No orders pending fulfillment right now.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingOrders.map((order) => (
                        <TableRow key={order.orderId}>
                          <TableCell className="font-medium">{order.orderId}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell>{order.product}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => updateStatus.mutate({ id: order.orderDbId, status: "shipped" })}
                              disabled={updateStatus.isPending}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Mark Shipped
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carriers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Delhivery</CardTitle>
                  <CardDescription>Primary carrier for North India</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Shipments</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg. Delivery Time</span>
                      <span className="font-medium">2.5 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium text-green-600">96%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>BlueDart</CardTitle>
                  <CardDescription>Premium express delivery</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Shipments</span>
                      <span className="font-medium">8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg. Delivery Time</span>
                      <span className="font-medium">1.8 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium text-green-600">98%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>DTDC</CardTitle>
                  <CardDescription>Budget-friendly option</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Shipments</span>
                      <span className="font-medium">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg. Delivery Time</span>
                      <span className="font-medium">3.2 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium text-green-600">92%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Fulfillment;
