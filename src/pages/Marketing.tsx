import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Mail, 
  MessageSquare, 
  Users, 
  Target,
  BarChart3,
  Send,
  Eye,
  MousePointer,
  Plus
} from "lucide-react";

const campaigns = [
  { 
    id: 1, 
    name: "New Year Sale 2024", 
    type: "Email", 
    status: "active", 
    sent: 5420, 
    opened: 2340, 
    clicked: 567,
    startDate: "2024-01-01"
  },
  { 
    id: 2, 
    name: "GPU Launch Announcement", 
    type: "Email", 
    status: "completed", 
    sent: 8500, 
    opened: 4250, 
    clicked: 1200,
    startDate: "2023-12-20"
  },
  { 
    id: 3, 
    name: "Flash Sale - SSDs", 
    type: "SMS", 
    status: "scheduled", 
    sent: 0, 
    opened: 0, 
    clicked: 0,
    startDate: "2024-01-15"
  },
  { 
    id: 4, 
    name: "Re-engagement Campaign", 
    type: "Email", 
    status: "draft", 
    sent: 0, 
    opened: 0, 
    clicked: 0,
    startDate: "-"
  },
];

const Marketing = () => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      completed: "outline",
      scheduled: "secondary",
      draft: "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Marketing</h1>
            <p className="text-muted-foreground mt-1">
              Create campaigns and track performance
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,543</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+234</span> this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">13,920</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48.2%</div>
              <Progress value={48.2} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.8%</div>
              <Progress value={12.8} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {campaign.type === "Email" ? (
                            <Mail className="h-5 w-5 text-primary" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{campaign.name}</h3>
                            {getStatusBadge(campaign.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {campaign.type} Campaign • Started {campaign.startDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{campaign.sent.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{campaign.opened.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Opened</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{campaign.clicked.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Clicked</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Manage your email templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors">
                    <h4 className="font-medium">Welcome Email</h4>
                    <p className="text-sm text-muted-foreground mt-1">Sent to new subscribers</p>
                    <p className="text-xs text-muted-foreground mt-2">Last edited: 2 days ago</p>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors">
                    <h4 className="font-medium">Order Confirmation</h4>
                    <p className="text-sm text-muted-foreground mt-1">Transactional email</p>
                    <p className="text-xs text-muted-foreground mt-2">Last edited: 5 days ago</p>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors">
                    <h4 className="font-medium">Newsletter</h4>
                    <p className="text-sm text-muted-foreground mt-1">Weekly updates</p>
                    <p className="text-xs text-muted-foreground mt-2">Last edited: 1 week ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SMS Campaigns</CardTitle>
                <CardDescription>Send promotional SMS to customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">SMS Marketing Ready</h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Create targeted SMS campaigns to reach your customers directly.
                    SMS credits available: 10,000
                  </p>
                  <Button className="mt-4">
                    Create SMS Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audience" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audience Segments</CardTitle>
                <CardDescription>Manage your customer segments for targeted marketing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Target className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">High-Value Customers</h4>
                        <p className="text-sm text-muted-foreground">Customers with orders &gt; ₹50,000</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">1,234</p>
                      <p className="text-xs text-muted-foreground">subscribers</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Target className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Recent Buyers</h4>
                        <p className="text-sm text-muted-foreground">Purchased in last 30 days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">2,456</p>
                      <p className="text-xs text-muted-foreground">subscribers</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Target className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Inactive Customers</h4>
                        <p className="text-sm text-muted-foreground">No orders in 90+ days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">3,890</p>
                      <p className="text-xs text-muted-foreground">subscribers</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Marketing;
