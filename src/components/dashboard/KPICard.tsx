import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: LucideIcon;
  variant?: "default" | "brand" | "success" | "warning" | "error";
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: "bg-secondary",
    iconColor: "text-foreground",
  },
  brand: {
    iconBg: "gradient-brand",
    iconColor: "text-primary-foreground",
  },
  success: {
    iconBg: "bg-success/15",
    iconColor: "text-success",
  },
  warning: {
    iconBg: "bg-warning/15",
    iconColor: "text-warning",
  },
  error: {
    iconBg: "bg-error/15",
    iconColor: "text-error",
  },
};

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = "default",
  className,
}: KPICardProps) {
  const isPositive = change >= 0;
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            styles.iconBg
          )}
        >
          <Icon className={cn("w-6 h-6", styles.iconColor)} />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            isPositive
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error"
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground mt-3">{changeLabel}</p>
    </div>
  );
}
