import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Tag,
  Plus,
  Search,
  Filter,
  Copy,
  Trash2,
  Percent,
  IndianRupee,
  Calendar,
  Loader2,
} from "lucide-react";
import { useAdminDiscounts } from "@/hooks/useSupabase";
import { useCreateDiscount, useDeleteDiscount, type NewDiscount } from "@/hooks/useAdminData";
import type { Discount } from "@/integrations/supabase/types";

interface DiscountRow {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  usageLimit: number | null;
  usageCount: number;
  startDate: string | null;
  endDate: string | null;
  status: "active" | "scheduled" | "expired" | "disabled";
}

function deriveStatus(d: Discount): DiscountRow["status"] {
  const now = Date.now();
  if (!d.is_active) return "disabled";
  if (d.ends_at && new Date(d.ends_at).getTime() < now) return "expired";
  if (d.starts_at && new Date(d.starts_at).getTime() > now) return "scheduled";
  return "active";
}

const fmtDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : null;

const emptyDiscount: NewDiscount = {
  code: "",
  type: "percentage",
  value: 0,
  min_order: 0,
  usage_limit: null,
  ends_at: null,
};

const Discounts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: rawDiscounts } = useAdminDiscounts();
  const createDiscount = useCreateDiscount();
  const deleteDiscount = useDeleteDiscount();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<NewDiscount>(emptyDiscount);

  const handleCreate = async () => {
    if (!form.code.trim() || form.value <= 0) return;
    await createDiscount.mutateAsync(form);
    setForm(emptyDiscount);
    setIsCreateOpen(false);
  };

  const discounts: DiscountRow[] = ((rawDiscounts || []) as Discount[]).map((d) => ({
    id: d.id,
    code: d.code,
    type: d.type,
    value: Number(d.value),
    minOrder: Number(d.min_order),
    usageLimit: d.usage_limit,
    usageCount: d.usage_count,
    startDate: fmtDate(d.starts_at),
    endDate: fmtDate(d.ends_at),
    status: deriveStatus(d),
  }));

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      scheduled: "secondary",
      expired: "outline",
      disabled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const activeDiscounts = discounts.filter(d => d.status === "active");
  const totalRedemptions = discounts.reduce((sum, d) => sum + d.usageCount, 0);
  const avgUsageRate = discounts.length
    ? Math.round(
        discounts.reduce(
          (sum, d) => sum + (d.usageLimit ? (d.usageCount / d.usageLimit) * 100 : 0),
          0
        ) / discounts.length
      )
    : 0;

  const filteredDiscounts = discounts.filter(
    (d) =>
      d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Discounts</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage discount codes and promotions
            </p>
          </div>
          <Button onClick={() => { setForm(emptyDiscount); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Discount
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Discounts</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDiscounts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRedemptions}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{discounts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All discount codes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Usage Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgUsageRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Of limit used</p>
            </CardContent>
          </Card>
        </div>

        {/* Discounts Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>All Discounts</CardTitle>
                <CardDescription>Manage your discount codes</CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search codes..."
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
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min. Order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                          {discount.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => navigator.clipboard.writeText(discount.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {discount.type === "percentage" ? (
                          <>
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{discount.value}%</span>
                          </>
                        ) : (
                          <>
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{discount.value}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(discount.minOrder)}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{discount.usageCount}</span>
                        <span className="text-muted-foreground">
                          {discount.usageLimit ? ` / ${discount.usageLimit}` : " (unlimited)"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {discount.startDate} - {discount.endDate || "No end"}
                    </TableCell>
                    <TableCell>{getStatusBadge(discount.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteDiscount.mutate(discount.id)}
                          disabled={deleteDiscount.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Percentage Discount</h3>
                <p className="text-sm text-muted-foreground">e.g., 15% off entire order</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <IndianRupee className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Fixed Amount</h3>
                <p className="text-sm text-muted-foreground">e.g., ₹500 off</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">Waive shipping charges</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Discount Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" /> Create Discount
              </DialogTitle>
              <DialogDescription>Add a new discount code customers can apply at checkout.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="d-code">Code *</Label>
                <Input
                  id="d-code"
                  placeholder="e.g. NEWYEAR24"
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((p) => ({ ...p, type: v as "percentage" | "fixed" }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d-value">Value *</Label>
                  <Input
                    id="d-value"
                    type="number"
                    value={form.value || ""}
                    onChange={(e) => setForm((p) => ({ ...p, value: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="d-min">Min. Order (₹)</Label>
                  <Input
                    id="d-min"
                    type="number"
                    value={form.min_order || ""}
                    onChange={(e) => setForm((p) => ({ ...p, min_order: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d-limit">Usage Limit</Label>
                  <Input
                    id="d-limit"
                    type="number"
                    placeholder="Unlimited"
                    value={form.usage_limit ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, usage_limit: e.target.value ? Number(e.target.value) : null }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-end">Expiry Date</Label>
                <Input
                  id="d-end"
                  type="date"
                  value={form.ends_at ? form.ends_at.slice(0, 10) : ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createDiscount.isPending}>
                {createDiscount.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Discounts;
