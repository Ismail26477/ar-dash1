import { DashboardLayout } from "@/layouts/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { InventoryAlerts } from "@/components/dashboard/InventoryAlerts";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { useAdminAnalytics, useSupabaseStatus } from "@/hooks/useSupabase";
import {
  IndianRupee,
  ShoppingBag,
  Users,
  TrendingUp,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

function formatRevenue(amount: number) {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

const Index = () => {
  const { data: analytics } = useAdminAnalytics();
  const { data: dbStatus } = useSupabaseStatus();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with AR Computers today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {dbStatus?.success && (
              <Badge variant="outline" className="gap-2 py-1.5">
                <Database className="w-3 h-3" />
                <span className="text-xs">Supabase Connected</span>
              </Badge>
            )}
            <div className="text-sm text-muted-foreground">
              Last updated: <span className="font-medium">Just now</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <QuickStats />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Revenue"
            value={analytics ? formatRevenue(analytics.totalRevenue) : "₹0"}
            change={12.5}
            changeLabel="vs last month"
            icon={IndianRupee}
            variant="brand"
            className="stagger-1"
          />
          <KPICard
            title="Total Orders"
            value={analytics?.totalOrders?.toLocaleString() || "0"}
            change={8.2}
            changeLabel="vs last month"
            icon={ShoppingBag}
            variant="success"
            className="stagger-2"
          />
          <KPICard
            title="New Customers"
            value={analytics?.newCustomers?.toString() || "0"}
            change={-2.4}
            changeLabel="vs last month"
            icon={Users}
            variant="warning"
            className="stagger-3"
          />
          <KPICard
            title="Avg Order Value"
            value={analytics ? formatRevenue(analytics.avgOrderValue) : "₹0"}
            change={5.7}
            changeLabel="vs last month"
            icon={TrendingUp}
            variant="default"
            className="stagger-4"
          />
        </div>

        {/* Main Charts & Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SalesChart />
          </div>
          <div className="xl:col-span-1">
            <InventoryAlerts />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders />
          <TopProducts />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
