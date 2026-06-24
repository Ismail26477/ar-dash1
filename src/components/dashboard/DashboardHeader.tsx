import { Bell, Search, User, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useSupabase";
import { Link } from "react-router-dom";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const { data: notifications } = useNotifications(user?.id);

  const notifList = notifications || [];
  const unreadCount = notifList.filter((n) => !n.is_read).length;

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Mobile Menu & Search */}
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="hidden sm:flex relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, products, customers..."
            className="pl-10 bg-secondary/50 border-border focus:bg-card"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Live Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-full">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-success">Live</span>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px] bg-error border-0">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifList.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              notifList.slice(0, 5).map((n) => (
                <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-3">
                  <span className="font-medium">{n.title}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{n.message}</span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/notifications" className="justify-center text-sm text-primary">
                View all
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">
                {user?.full_name || user?.email || "Admin"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/settings">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-error cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
