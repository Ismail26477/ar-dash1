import { useMemo } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useSupabase";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/integrations/supabase/types";
import {
  Bell,
  ShoppingCart,
  Package,
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  Check,
  Clock,
  Loader2,
} from "lucide-react";

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

type Group = "order" | "alert" | "success" | "info";

function groupForType(type: string): Group {
  if (type.startsWith("order")) return "order";
  if (type.includes("payment")) return "success";
  if (type.includes("stock") || type.includes("alert") || type.includes("fail")) return "alert";
  return "info";
}

function getTypeIcon(group: Group) {
  switch (group) {
    case "order":
      return <ShoppingCart className="h-5 w-5 text-blue-500" />;
    case "alert":
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground" />;
  }
}

const Notifications = () => {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications(user?.id);
  const markRead = useMarkNotificationRead();
  const queryClient = useQueryClient();

  const list = useMemo(() => (notifications || []) as Notification[], [notifications]);

  const unreadCount = list.filter((n) => !n.is_read).length;
  const counts = useMemo(() => {
    const c = { order: 0, alert: 0, system: 0 };
    for (const n of list) {
      const g = groupForType(n.type);
      if (g === "order") c.order++;
      else if (g === "alert") c.alert++;
      else c.system++;
    }
    return c;
  }, [list]);

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const renderItem = (notification: Notification) => {
    const group = groupForType(notification.type);
    return (
      <div
        key={notification.id}
        className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
          notification.is_read ? "bg-background" : "bg-primary/5 border border-primary/10"
        }`}
      >
        <div className="p-2 rounded-full bg-muted">{getTypeIcon(group)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium">{notification.title}</p>
            {!notification.is_read && (
              <Badge variant="default" className="text-xs">
                New
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(notification.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => markRead.mutate(notification.id)}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => deleteNotification(notification.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const filtered = (predicate: (n: Notification) => boolean) => list.filter(predicate);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">Stay updated with your store activity</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.order}</div>
              <p className="text-xs text-muted-foreground mt-1">Order updates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.alert}</div>
              <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{list.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All notifications</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              All
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Notifications</CardTitle>
                <CardDescription>Your recent activity and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : list.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  list.map(renderItem)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardContent className="space-y-2 pt-6">
                {filtered((n) => groupForType(n.type) === "order").map(renderItem)}
                {counts.order === 0 && (
                  <p className="py-8 text-center text-muted-foreground">No order notifications</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardContent className="space-y-2 pt-6">
                {filtered((n) => groupForType(n.type) === "alert").map(renderItem)}
                {counts.alert === 0 && (
                  <p className="py-8 text-center text-muted-foreground">No alerts</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardContent className="space-y-2 pt-6">
                {filtered((n) => {
                  const g = groupForType(n.type);
                  return g === "info" || g === "success";
                }).map(renderItem)}
                {counts.system === 0 && (
                  <p className="py-8 text-center text-muted-foreground">No system notifications</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
