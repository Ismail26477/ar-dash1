import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAdminAnalytics } from "@/hooks/useSupabase";
import { Loader2 } from "lucide-react";

const timeRanges = ["7D", "30D", "90D", "12M"];

export function SalesChart() {
  const [activeRange, setActiveRange] = useState("12M");
  const { data: analytics, isLoading } = useAdminAnalytics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const chartData = analytics?.monthlyRevenue || [];

  return (
    <Card className="animate-fade-in stagger-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg">
          {timeRanges.map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-3 text-xs font-medium",
                activeRange === range
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 100%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210, 100%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
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
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 91%)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  labelStyle={{ color: "hsl(0, 0%, 13%)", fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(210, 100%, 40%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
