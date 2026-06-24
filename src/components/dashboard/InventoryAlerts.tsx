import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInventoryAlerts } from "@/hooks/useAdminData";

const statusConfig = {
  critical: {
    bg: "bg-error/10",
    border: "border-error/30",
    text: "text-error",
    icon: "text-error",
  },
  low: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
    icon: "text-warning",
  },
};

export function InventoryAlerts() {
  const { data: alerts, isLoading, error } = useInventoryAlerts();

  return (
    <Card className="animate-fade-in stagger-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold">Inventory Alerts</CardTitle>
          <span className="px-2 py-0.5 text-xs font-medium bg-error/10 text-error rounded-full">
            {alerts?.length || 0}
          </span>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-3 h-3" />
          Reorder All
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load inventory alerts
          </div>
        ) : (
          <div className="space-y-3">
            {alerts?.map((alert) => {
              const isCritical = alert.stock <= alert.reorder_point / 2;
              const config = statusConfig[isCritical ? "critical" : "low"];
              
              return (
                <div
                  key={alert.sku}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    config.bg,
                    config.border
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                      <AlertTriangle className={cn("w-4 h-4", config.icon)} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{alert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {alert.sku}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-bold text-lg", config.text)}>
                      {alert.stock}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reorder at {alert.reorder_point}
                    </p>
                  </div>
                </div>
              );
            })}
            {(!alerts || alerts.length === 0) && (
              <div className="text-center py-4 text-muted-foreground">
                No inventory alerts
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
