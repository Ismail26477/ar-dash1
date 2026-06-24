import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { useAdminSupportTickets } from "@/hooks/useAdminData";

interface TicketRow {
  id: string;
  subject: string;
  customer: string;
  email: string;
  priority: string;
  status: string;
  created: string;
  lastReply: string;
}

const Support = () => {
  const { data: rawTickets, isLoading } = useAdminSupportTickets();

  const tickets: TicketRow[] = ((rawTickets || []) as Array<Record<string, unknown>>).map((t) => ({
    id: (t.ticket_number as string) || (t.id as string),
    subject: t.subject as string,
    customer:
      ((t.user as { full_name?: string; email?: string } | null)?.full_name) ||
      ((t.user as { email?: string } | null)?.email) ||
      "Customer",
    email: (t.user as { email?: string } | null)?.email || "",
    priority: t.priority as string,
    status: t.status as string,
    created: new Date(t.created_at as string).toLocaleString("en-IN"),
    lastReply: new Date((t.updated_at as string) || (t.created_at as string)).toLocaleDateString("en-IN"),
  }));

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    };
    return <Badge variant={variants[priority] || "default"}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      open: { variant: "default", label: "Open" },
      in_progress: { variant: "secondary", label: "In Progress" },
      resolved: { variant: "outline", label: "Resolved" },
    };
    const { variant, label } = config[status] || config.open;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const openTickets = tickets.filter(t => t.status === "open").length;
  const inProgressTickets = tickets.filter(t => t.status === "in_progress").length;
  const resolvedTickets = tickets.filter(t => t.status === "resolved").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Support</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer support tickets and inquiries
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">Being handled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">Tickets closed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Tickets</TabsTrigger>
            <TabsTrigger value="open">Open ({openTickets})</TabsTrigger>
            <TabsTrigger value="progress">In Progress ({inProgressTickets})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Support Tickets</CardTitle>
                    <CardDescription>View and manage all support requests</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tickets..." className="pl-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isLoading && tickets.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">No support tickets</div>
                )}
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border rounded-lg p-4 hover:border-primary/50 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-muted-foreground">
                              {ticket.id}
                            </span>
                            {getPriorityBadge(ticket.priority)}
                            {getStatusBadge(ticket.status)}
                          </div>
                          <p className="font-medium mt-1">{ticket.subject}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Last reply: {ticket.lastReply}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {ticket.customer}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {ticket.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {ticket.created}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="open">
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {openTickets} open tickets requiring attention
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {inProgressTickets} tickets currently being handled
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resolved">
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {tickets.filter(t => t.status === "resolved").length} resolved tickets
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact Options */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Phone Support</h3>
                <p className="text-sm text-muted-foreground">+91 1800-XXX-XXXX</p>
                <p className="text-xs text-muted-foreground">Mon-Sat 9AM-6PM</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Email Support</h3>
                <p className="text-sm text-muted-foreground">support@arcomputers.com</p>
                <p className="text-xs text-muted-foreground">24-48h response</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Instant support</p>
                <p className="text-xs text-muted-foreground">Available now</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support;
