import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Package, Clock, Target, Loader2 } from "lucide-react";
import { useAdminAnalytics } from "@/hooks/useSupabase";

export function QuickStats() {
  const { data: analytics, isLoading } = useAdminAnalytics();

  const stats = [
    {
      label: "Total Products",
      value: analytics?.totalProducts?.toString() || "0",
      icon: Package,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      label: "Pending Orders",
      value: analytics?.pendingOrders?.toString() || "0",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Orders This Month",
      value: analytics?.todayOrders?.toString() || "0",
      icon: ShoppingCart,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Conversion Rate",
      value: analytics ? `${analytics.conversionRate}%` : "0%",
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
              >
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
