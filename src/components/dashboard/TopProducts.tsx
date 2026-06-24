import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTopProducts } from "@/hooks/useAdminData";

function formatRevenue(amount: number) {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function TopProducts() {
  const { data: products, isLoading, error } = useTopProducts();

  // Calculate progress based on highest revenue
  const maxRevenue = products ? Math.max(...products.map(p => p.revenue)) : 0;

  return (
    <Card className="animate-fade-in stagger-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary gap-1">
          View All
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load products
          </div>
        ) : (
          <div className="space-y-5">
            {products?.map((product, index) => {
              const progress = maxRevenue ? (product.revenue / maxRevenue) * 100 : 0;
              // Simulate trend (in real app, this would come from historical data)
              const trend = ((product.sales % 20) - 5);
              
              return (
                <div key={product.sku} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sales} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatRevenue(product.revenue)}</p>
                      <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-success' : 'text-error'}`}>
                        <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                        <span>{Math.abs(trend).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
