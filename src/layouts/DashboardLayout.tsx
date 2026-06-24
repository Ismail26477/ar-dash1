import { ReactNode, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 lg:hidden transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <DashboardSidebar />
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
