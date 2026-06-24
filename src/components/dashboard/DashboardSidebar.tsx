import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  MessageSquare,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Monitor,
  TrendingUp,
  Truck,
  Star,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
  { icon: Package, label: "Products", path: "/admin/products" },
  { icon: Users, label: "Customers", path: "/admin/customers" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: TrendingUp, label: "Marketing", path: "/admin/marketing" },
  { icon: CreditCard, label: "Payments", path: "/admin/payments" },
  { icon: Truck, label: "Fulfillment", path: "/admin/fulfillment" },
  { icon: Star, label: "Reviews", path: "/admin/reviews" },
  { icon: Tag, label: "Discounts", path: "/admin/discounts" },
];

const bottomItems = [
  { icon: MessageSquare, label: "Support", path: "/admin/support" },
  { icon: Bell, label: "Notifications", path: "/admin/notifications" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
  { icon: HelpCircle, label: "Help", path: "/admin/help" },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center shadow-glow">
            <Monitor className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-sidebar-accent-foreground">
              AR Computers
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-sidebar-primary-foreground" : ""
                )}
              />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
