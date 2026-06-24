import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useSupabase";
import {
  User,
  Bell,
  Store,
  Shield,
  Palette,
  Globe,
  Mail,
  Smartphone,
  CreditCard,
  Truck,
  Save
} from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const [loading, setLoading] = useState(false);

  // User Preferences (profile fields are backed by the `profiles` table)
  const [userSettings, setUserSettings] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    language: "en",
    timezone: "Asia/Kolkata",
    theme: "light",
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailMarketing: false,
    emailReports: true,
    pushOrders: true,
    pushLowStock: true,
    pushReviews: false,
    smsOrders: false,
    smsDelivery: true,
  });

  // Store Configuration
  const [storeSettings, setStoreSettings] = useState({
    storeName: "AR Computers",
    storeEmail: "contact@arcomputers.com",
    storePhone: "+91 9876543210",
    address: "123 Tech Street, Electronics Hub, Bangalore - 560001",
    currency: "INR",
    taxRate: "18",
    lowStockThreshold: "10",
    orderPrefix: "ARC",
  });

  const handleSave = async (section: string) => {
    // Profile is the only section backed by a table; persist it for real.
    if (section === "Profile") {
      if (!user) return;
      setLoading(true);
      try {
        await updateProfile.mutateAsync({
          id: user.id,
          full_name: userSettings.name,
          phone: userSettings.phone,
        });
        await refreshProfile();
      } finally {
        setLoading(false);
      }
      return;
    }

    // Other sections have no backing store yet — local preferences only.
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Preferences updated",
        description: `${section} preferences saved for this session.`,
      });
    }, 400);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and store preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={userSettings.name}
                      onChange={(e) => setUserSettings({ ...userSettings, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userSettings.email}
                      readOnly
                      disabled
                      className="opacity-70"
                    />
                    <p className="text-xs text-muted-foreground">Managed by your login account</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={userSettings.phone}
                      onChange={(e) => setUserSettings({ ...userSettings, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={userSettings.language}
                      onValueChange={(value) => setUserSettings({ ...userSettings, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="ta">Tamil</SelectItem>
                        <SelectItem value="te">Telugu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => handleSave("Profile")} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how the dashboard looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={userSettings.theme}
                      onValueChange={(value) => setUserSettings({ ...userSettings, theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={userSettings.timezone}
                      onValueChange={(value) => setUserSettings({ ...userSettings, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Configure which emails you'd like to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Order Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails for new orders and status changes
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailOrders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailOrders: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive promotional emails and offers
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailMarketing}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailMarketing: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Get weekly sales and performance reports
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailReports}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailReports: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>
                  Configure browser and app push notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Orders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified instantly when new orders come in
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushOrders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushOrders: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when products are running low
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushLowStock}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushLowStock: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Reviews</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when customers leave reviews
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushReviews}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushReviews: checked })}
                  />
                </div>
                <Button onClick={() => handleSave("Notification")} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  SMS Notifications
                </CardTitle>
                <CardDescription>
                  Configure SMS alerts for important updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Order Confirmations</Label>
                    <p className="text-sm text-muted-foreground">
                      Send SMS when orders are placed
                    </p>
                  </div>
                  <Switch
                    checked={notifications.smsOrders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, smsOrders: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Delivery Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Send SMS for shipping and delivery updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.smsDelivery}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, smsDelivery: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store Settings */}
          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Information
                </CardTitle>
                <CardDescription>
                  Basic information about your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={storeSettings.storeName}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Store Email</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={storeSettings.storeEmail}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Store Phone</Label>
                    <Input
                      id="storePhone"
                      value={storeSettings.storePhone}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orderPrefix">Order Prefix</Label>
                    <Input
                      id="orderPrefix"
                      value={storeSettings.orderPrefix}
                      onChange={(e) => setStoreSettings({ ...storeSettings, orderPrefix: e.target.value })}
                      placeholder="e.g., ARC"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Store Address</Label>
                  <Textarea
                    id="address"
                    value={storeSettings.address}
                    onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button onClick={() => handleSave("Store")} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Store Info
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment & Tax
                </CardTitle>
                <CardDescription>
                  Configure payment and tax settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={storeSettings.currency}
                      onValueChange={(value) => setStoreSettings({ ...storeSettings, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={storeSettings.taxRate}
                      onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Inventory Settings
                </CardTitle>
                <CardDescription>
                  Configure inventory management preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={storeSettings.lowStockThreshold}
                    onChange={(e) => setStoreSettings({ ...storeSettings, lowStockThreshold: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Products with stock below this number will trigger low stock alerts
                  </p>
                </div>
                <Button onClick={() => handleSave("Inventory")} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Inventory Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button onClick={() => handleSave("Password")} disabled={loading}>
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable 2FA</Label>
                    <p className="text-sm text-muted-foreground">
                      Require a verification code when signing in
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage devices where you're currently logged in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      Chrome on Windows • Bangalore, India
                    </p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Active</span>
                </div>
                <Button variant="outline" className="w-full">
                  Sign Out All Other Sessions
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
