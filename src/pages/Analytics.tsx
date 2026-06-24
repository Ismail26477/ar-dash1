import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";
import {
  useAdminAnalytics,
  useAdminAllOrders,
  useAdminProducts,
} from "@/hooks/useSupabase";
import { useAdminCustomers } from "@/hooks/useAdminData";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  Calendar,
  Download,
  ArrowUpRight,
  BarChart3,
  PieChartIcon,
  Activity,
  Target,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(210, 100%, 40%)",
  "hsl(144, 100%, 33%)",
  "hsl(36, 100%, 50%)",
  "hsl(355, 85%, 57%)",
  "hsl(192, 100%, 50%)",
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
}

function MetricCard({ title, value, change, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <div className="flex items-center gap-1">
              {trend === "up" ? (
                <TrendingUp className="w-3 h-3 text-success" />
              ) : trend === "down" ? (
                <TrendingDown className="w-3 h-3 text-destructive" />
              ) : null}
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up"
                    ? "text-success"
                    : trend === "down"
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const Analytics = () => {
  const [dateRange, setDateRange] = useState("12M");
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics();
  const { data: orders, isLoading: ordersLoading } = useAdminAllOrders();
  const { data: products, isLoading: productsLoading } = useAdminProducts();
  const { data: customers, isLoading: customersLoading } = useAdminCustomers();

  const isLoading =
    analyticsLoading || ordersLoading || productsLoading || customersLoading;

  const orderList = (orders || []) as Array<{ order_status: string }>;
  const productList = (products || []) as Array<{
    sku: string;
    name: string;
    sales: number;
    revenue: number;
    stock: number;
    reorder_point: number;
    category: { name: string } | null;
  }>;

  // Process orders by status for pie chart
  const ordersByStatus = [
    { name: "Placed", value: orderList.filter((o) => ["placed", "confirmed"].includes(o.order_status)).length },
    { name: "Processing", value: orderList.filter((o) => ["processing", "packed"].includes(o.order_status)).length },
    { name: "Shipped", value: orderList.filter((o) => ["shipped", "out_for_delivery"].includes(o.order_status)).length },
    { name: "Delivered", value: orderList.filter((o) => o.order_status === "delivered").length },
    { name: "Cancelled", value: orderList.filter((o) => ["cancelled", "refunded"].includes(o.order_status)).length },
  ];

  const categoryName = (p: { category: { name: string } | null }) => p.category?.name || "Uncategorized";

  // Process products by category for bar chart
  const productsByCategory = Object.entries(
    productList.reduce((acc, p) => {
      const c = categoryName(p);
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, count]) => ({ category, count }));

  // Revenue by category
  const revenueByCategory = Object.entries(
    productList.reduce((acc, p) => {
      const c = categoryName(p);
      acc[c] = (acc[c] || 0) + Number(p.revenue);
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Top 5 customers by spending
  const topCustomers = customers
    ? [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5)
    : [];

  // Monthly data with orders overlay
  const monthlyData = analytics?.monthlyRevenue || [];

  // Customer acquisition over time
  const customerGrowth = customers
    ? (() => {
        const months: Record<string, number> = {};
        customers.forEach((c) => {
          const month = new Date(c.joinedAt).toLocaleDateString("en-US", {
            month: "short",
          });
          months[month] = (months[month] || 0) + 1;
        });
        return Object.entries(months).map(([month, count]) => ({
          month,
          customers: count,
        }));
      })()
    : [];

  // Calculate key metrics
  const totalRevenue = analytics?.totalRevenue || 0;
  const totalOrders = analytics?.totalOrders || 0;
  const avgOrderValue = analytics?.avgOrderValue || 0;
  const totalProducts = productList.length;
  const totalCustomers = customers?.length || 0;
  const lowStockProducts = productList.filter((p) => p.stock <= p.reorder_point).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7D">Last 7 days</SelectItem>
                <SelectItem value="30D">Last 30 days</SelectItem>
                <SelectItem value="90D">Last 90 days</SelectItem>
                <SelectItem value="12M">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(totalRevenue)}
                change={12.5}
                icon={IndianRupee}
                trend="up"
              />
              <MetricCard
                title="Total Orders"
                value={formatNumber(totalOrders)}
                change={8.2}
                icon={ShoppingBag}
                trend="up"
              />
              <MetricCard
                title="Total Customers"
                value={formatNumber(totalCustomers)}
                change={15.3}
                icon={Users}
                trend="up"
              />
              <MetricCard
                title="Avg. Order Value"
                value={formatCurrency(avgOrderValue)}
                change={-2.4}
                icon={Target}
                trend="down"
              />
            </div>

            {/* Charts Tabs */}
            <Tabs defaultValue="revenue" className="space-y-4">
              <TabsList className="bg-secondary">
                <TabsTrigger value="revenue" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Revenue
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2">
                  <Activity className="w-4 h-4" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-2">
                  <Package className="w-4 h-4" />
                  Products
                </TabsTrigger>
                <TabsTrigger value="customers" className="gap-2">
                  <Users className="w-4 h-4" />
                  Customers
                </TabsTrigger>
              </TabsList>

              {/* Revenue Tab */}
              <TabsContent value="revenue" className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Revenue Trend */}
                  <Card className="xl:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={monthlyData}>
                            <defs>
                              <linearGradient
                                id="colorRevenue"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="hsl(210, 100%, 40%)"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="hsl(210, 100%, 40%)"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="hsl(220, 13%, 91%)"
                            />
                            <XAxis
                              dataKey="month"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                            />
                            <YAxis
                              yAxisId="left"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                              tickFormatter={formatCurrency}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(0, 0%, 100%)",
                                border: "1px solid hsl(220, 13%, 91%)",
                                borderRadius: "12px",
                              }}
                              formatter={(value: number, name: string) => [
                                name === "revenue"
                                  ? formatCurrency(value)
                                  : value,
                                name === "revenue" ? "Revenue" : "Orders",
                              ]}
                            />
                            <Legend />
                            <Area
                              yAxisId="left"
                              type="monotone"
                              dataKey="revenue"
                              stroke="hsl(210, 100%, 40%)"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorRevenue)"
                              name="Revenue"
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="orders"
                              stroke="hsl(144, 100%, 33%)"
                              strokeWidth={2}
                              dot={{ fill: "hsl(144, 100%, 33%)", strokeWidth: 2 }}
                              name="Orders"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Revenue by Category */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Revenue by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={revenueByCategory}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="revenue"
                              nameKey="category"
                            >
                              {revenueByCategory.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Categories Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Category Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                              Category
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                              Revenue
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                              Products
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                              Share
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueByCategory.map((cat, i) => {
                            const categoryProducts =
                              productsByCategory.find(
                                (p) => p.category === cat.category
                              )?.count || 0;
                            const share = (cat.revenue / totalRevenue) * 100;
                            return (
                              <tr
                                key={cat.category}
                                className="border-b border-border/50 hover:bg-muted/50"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor:
                                          COLORS[i % COLORS.length],
                                      }}
                                    />
                                    <span className="font-medium">
                                      {cat.category}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right font-medium">
                                  {formatCurrency(cat.revenue)}
                                </td>
                                <td className="py-3 px-4 text-right text-muted-foreground">
                                  {categoryProducts}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Badge variant="secondary">
                                    {share.toFixed(1)}%
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Orders by Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Orders by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={ordersByStatus}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {ordersByStatus.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Volume Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="hsl(220, 13%, 91%)"
                            />
                            <XAxis
                              dataKey="month"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(0, 0%, 100%)",
                                border: "1px solid hsl(220, 13%, 91%)",
                                borderRadius: "12px",
                              }}
                            />
                            <Bar
                              dataKey="orders"
                              fill="hsl(144, 100%, 33%)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Pending</p>
                          <p className="text-2xl font-bold text-warning">
                            {orderList.filter((o) => ["placed", "confirmed"].includes(o.order_status)).length}
                          </p>
                        </div>
                        <Badge className="bg-warning/10 text-warning border-warning/20">
                          Needs Action
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Processing</p>
                          <p className="text-2xl font-bold text-primary">
                            {orderList.filter((o) => ["processing", "packed"].includes(o.order_status)).length}
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          In Progress
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Shipped</p>
                          <p className="text-2xl font-bold text-info">
                            {orderList.filter((o) => ["shipped", "out_for_delivery"].includes(o.order_status)).length}
                          </p>
                        </div>
                        <Badge className="bg-info/10 text-info border-info/20">
                          On The Way
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Delivered</p>
                          <p className="text-2xl font-bold text-success">
                            {orderList.filter((o) => o.order_status === "delivered").length}
                          </p>
                        </div>
                        <Badge className="bg-success/10 text-success border-success/20">
                          Completed
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Products by Category */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Products by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={productsByCategory} layout="vertical">
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="hsl(220, 13%, 91%)"
                            />
                            <XAxis
                              type="number"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                            />
                            <YAxis
                              type="category"
                              dataKey="category"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                              width={100}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(0, 0%, 100%)",
                                border: "1px solid hsl(220, 13%, 91%)",
                                borderRadius: "12px",
                              }}
                            />
                            <Bar
                              dataKey="count"
                              fill="hsl(210, 100%, 40%)"
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Inventory Health */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Inventory Health</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                          <p className="text-sm text-muted-foreground">Healthy Stock</p>
                          <p className="text-2xl font-bold text-success">
                            {totalProducts - lowStockProducts}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                          <p className="text-sm text-muted-foreground">Low Stock</p>
                          <p className="text-2xl font-bold text-destructive">
                            {lowStockProducts}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {productList
                          .filter((p) => p.stock <= p.reorder_point)
                          .slice(0, 5)
                          .map((product) => (
                            <div
                              key={product.sku}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                              <div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {product.sku}
                                </p>
                              </div>
                              <Badge variant="destructive">
                                {product.stock} left
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Selling Products */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Selling Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[...productList]
                            .sort((a, b) => b.sales - a.sales)
                            .slice(0, 10)}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(220, 13%, 91%)"
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(0, 0%, 100%)",
                              border: "1px solid hsl(220, 13%, 91%)",
                              borderRadius: "12px",
                            }}
                          />
                          <Bar
                            dataKey="sales"
                            fill="hsl(36, 100%, 50%)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Customers Tab */}
              <TabsContent value="customers" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Growth */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Acquisition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={customerGrowth}>
                            <defs>
                              <linearGradient
                                id="colorCustomers"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="hsl(192, 100%, 50%)"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="hsl(192, 100%, 50%)"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="hsl(220, 13%, 91%)"
                            />
                            <XAxis
                              dataKey="month"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(0, 0%, 100%)",
                                border: "1px solid hsl(220, 13%, 91%)",
                                borderRadius: "12px",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="customers"
                              stroke="hsl(192, 100%, 50%)"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorCustomers)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Customers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {topCustomers.map((customer, i) => (
                          <div
                            key={customer.email}
                            className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {customer.name}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {customer.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">
                                {formatCurrency(customer.totalSpent)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {customer.totalOrders} orders
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Customers
                          </p>
                          <p className="text-2xl font-bold">{totalCustomers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-success/10">
                          <ArrowUpRight className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Avg. Lifetime Value
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(
                              customers
                                ? customers.reduce((acc, c) => acc + c.totalSpent, 0) /
                                    customers.length
                                : 0
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-warning/10">
                          <ShoppingBag className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Avg. Orders/Customer
                          </p>
                          <p className="text-2xl font-bold">
                            {customers
                              ? (
                                  customers.reduce((acc, c) => acc + c.totalOrders, 0) /
                                  customers.length
                                ).toFixed(1)
                              : 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
