import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CreditCard, 
  IndianRupee, 
  TrendingUp, 
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Download,
  Filter,
  Wallet,
  Building,
  RefreshCcw
} from "lucide-react";
import { useAdminPayments } from "@/hooks/useAdminData";

const formatTxnDate = (value: string) => {
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
};

const Payments = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useAdminPayments();
  const transactions = data?.transactions ?? [];
  const refunds = data?.refunds ?? [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
      processed: "default",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "UPI":
        return <Wallet className="h-4 w-4" />;
      case "Card":
        return <CreditCard className="h-4 w-4" />;
      case "Net Banking":
        return <Building className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalRevenue = transactions.filter(t => t.status === "completed").reduce((sum, t) => sum + t.amount, 0);
  const pendingAmount = transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0);
  const refundedAmount = refunds.filter(r => r.status === "processed").reduce((sum, r) => sum + r.amount, 0);
  const successRate = transactions.length > 0 
    ? Math.round((transactions.filter(t => t.status === "completed").length / transactions.length) * 100 * 10) / 10
    : 0;

  const filteredTransactions = transactions.filter(
    (t) =>
      t.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const header = ["Transaction ID", "Order", "Customer", "Method", "Amount", "Status", "Date"];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.orderId,
      t.customer,
      t.method,
      String(t.amount),
      t.status,
      formatTxnDate(t.date),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground mt-1">
              Manage transactions, refunds, and payment settings
            </p>
          </div>
          <Button onClick={handleExport} disabled={filteredTransactions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+12.5%</span> from last month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <RefreshCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transactions.filter(t => t.status === "pending").length} transactions pending
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Refunded</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(refundedAmount)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {refunds.filter(r => r.status === "processed").length} refunds processed
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{successRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Payment success rate
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="refunds">Refunds</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>All Transactions</CardTitle>
                    <CardDescription>View and manage all payment transactions</CardDescription>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search transactions..."
                        className="pl-9 w-full sm:w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                        <TableCell className="font-medium">{transaction.orderId}</TableCell>
                        <TableCell>{transaction.customer}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(transaction.method)}
                            {transaction.method}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatTxnDate(transaction.date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refunds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Refund Requests</CardTitle>
                <CardDescription>Manage customer refund requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Refund ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell className="font-mono text-sm">{refund.id}</TableCell>
                        <TableCell className="font-medium">{refund.orderId}</TableCell>
                        <TableCell>{refund.customer}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{refund.reason}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(refund.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(refund.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatTxnDate(refund.date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payouts</CardTitle>
                <CardDescription>Your payout history and upcoming settlements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Bank Account Connected</h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Your payouts are processed automatically every Tuesday and Friday.
                    Next payout scheduled for January 12, 2024.
                  </p>
                  <div className="mt-6 p-4 bg-muted rounded-lg max-w-sm mx-auto">
                    <p className="text-sm text-muted-foreground">Available for Payout</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalRevenue - refundedAmount)}</p>
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

export default Payments;
