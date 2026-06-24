import { useState, useMemo } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import {
  useAdminCustomers,
  useAdminCustomerOrders,
  type AdminCustomer,
} from "@/hooks/useAdminData";
import type { Order, OrderItem } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";
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
  Users,
  Mail,
  Phone,
  Calendar,
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  X,
  Filter,
  Eye,
  Package,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatAmount(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-500", label: "Pending" },
  processing: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Processing" },
  shipped: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Shipped" },
  delivered: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Delivered" },
};

function getCustomerTier(totalSpent: number) {
  if (totalSpent >= 1000000) {
    return { label: "Platinum", class: "bg-violet-500/10 text-violet-500" };
  }
  if (totalSpent >= 500000) {
    return { label: "Gold", class: "bg-amber-500/10 text-amber-500" };
  }
  if (totalSpent >= 200000) {
    return { label: "Silver", class: "bg-slate-400/10 text-slate-400" };
  }
  return { label: "Bronze", class: "bg-orange-600/10 text-orange-600" };
}

export default function Customers() {
  const { data: customers, isLoading, error } = useAdminCustomers();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);

  const { data: customerOrders, isLoading: ordersLoading } = useAdminCustomerOrders(
    selectedCustomer?.id
  );

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];

    return customers.filter((customer) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.includes(searchQuery);

      let matchesTier = true;
      if (tierFilter !== "all") {
        const tier = getCustomerTier(customer.totalSpent);
        matchesTier = tier.label.toLowerCase() === tierFilter;
      }

      return matchesSearch && matchesTier;
    });
  }, [customers, searchQuery, tierFilter]);

  const tierCounts = useMemo(() => {
    if (!customers) return { all: 0, platinum: 0, gold: 0, silver: 0, bronze: 0 };

    return {
      all: customers.length,
      platinum: customers.filter((c) => c.totalSpent >= 1000000).length,
      gold: customers.filter((c) => c.totalSpent >= 500000 && c.totalSpent < 1000000).length,
      silver: customers.filter((c) => c.totalSpent >= 200000 && c.totalSpent < 500000).length,
      bronze: customers.filter((c) => c.totalSpent < 200000).length,
    };
  }, [customers]);

  const totalStats = useMemo(() => {
    if (!customers) return { totalCustomers: 0, totalRevenue: 0, avgOrderValue: 0 };

    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);

    return {
      totalCustomers: customers.length,
      totalRevenue,
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    };
  }, [customers]);

  const clearFilters = () => {
    setSearchQuery("");
    setTierFilter("all");
  };

  const hasActiveFilters = searchQuery || tierFilter !== "all";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">
              View and manage your customer base
            </p>
          </div>
          <Badge variant="outline" className="gap-2 py-1.5">
            <Users className="w-3 h-3" />
            <span className="text-xs">{customers?.length || 0} Total Customers</span>
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{totalStats.totalCustomers}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatAmount(totalStats.totalRevenue)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold">{formatAmount(totalStats.avgOrderValue)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">VIP Customers</p>
                  <p className="text-2xl font-bold text-violet-500">
                    {tierCounts.platinum + tierCounts.gold}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Customer tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers ({tierCounts.all})</SelectItem>
                  <SelectItem value="platinum">Platinum ({tierCounts.platinum})</SelectItem>
                  <SelectItem value="gold">Gold ({tierCounts.gold})</SelectItem>
                  <SelectItem value="silver">Silver ({tierCounts.silver})</SelectItem>
                  <SelectItem value="bronze">Bronze ({tierCounts.bronze})</SelectItem>
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

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {hasActiveFilters
                ? `Filtered Customers (${filteredCustomers.length})`
                : "All Customers"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mb-4 opacity-50" />
                <p>Failed to load customers</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mb-4 opacity-50" />
                <p>No customers found</p>
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
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => {
                      const tier = getCustomerTier(customer.totalSpent);
                      return (
                        <TableRow key={customer.email} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-medium">
                                  {customer.name.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium">{customer.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                <span>{customer.email}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span>{customer.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(tier.class, "border-0")}
                            >
                              {tier.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                              <span>{customer.totalOrders}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-emerald-600">
                            {formatAmount(customer.totalSpent)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(customer.joinedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
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

        {/* Customer Details Modal */}
        <Dialog
          open={!!selectedCustomer}
          onOpenChange={() => setSelectedCustomer(null)}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Details
              </DialogTitle>
              <DialogDescription>{selectedCustomer?.email}</DialogDescription>
            </DialogHeader>

            {selectedCustomer && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-xl font-bold">
                      {selectedCustomer.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{selectedCustomer.name}</h3>
                      <Badge
                        variant="secondary"
                        className={cn(
                          getCustomerTier(selectedCustomer.totalSpent).class,
                          "border-0"
                        )}
                      >
                        {getCustomerTier(selectedCustomer.totalSpent).label}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Customer since {formatDate(selectedCustomer.joinedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{selectedCustomer.totalOrders}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatAmount(selectedCustomer.totalSpent)}
                    </p>
                  </div>
                </div>

                {/* Order History */}
                <div>
                  <h4 className="font-medium mb-3">Order History</h4>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : customerOrders && customerOrders.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {customerOrders.map((order: Order & { order_items: OrderItem[] }) => {
                        const status = statusStyles[order.order_status] || {
                          bg: "bg-muted",
                          text: "text-muted-foreground",
                          label: order.order_status,
                        };
                        const items = order.order_items || [];
                        const productLabel =
                          items.length === 0
                            ? "Order"
                            : items.length === 1
                            ? items[0].product_name
                            : `${items[0].product_name} +${items.length - 1} more`;
                        return (
                          <Link
                            to={`/admin/orders`}
                            key={order.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{productLabel}</p>
                                <p className="text-xs text-muted-foreground">
                                  {order.order_number} • {formatDate(order.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="secondary"
                                className={cn(status.bg, status.text, "border-0")}
                              >
                                {status.label}
                              </Badge>
                              <span className="font-medium">
                                {formatAmount(Number(order.total))}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <ShoppingCart className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No orders found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
