import { useState, useMemo } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import {
  useAdminProducts,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useSupabase";
import type { Product, Category } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Search,
  Loader2,
  Package,
  Plus,
  Pencil,
  Trash2,
  Filter,
  X,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  Layers,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ProductWithCategory = Product & { category: Category | null };

function formatAmount(amount: number) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

function slugify(name: string, sku: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "product"}-${sku.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function getStockStatus(stock: number, reorderPoint: number) {
  if (stock === 0) return { label: "Out of Stock", class: "bg-red-500/10 text-red-500" };
  if (stock <= reorderPoint) return { label: "Low Stock", class: "bg-amber-500/10 text-amber-500" };
  return { label: "In Stock", class: "bg-emerald-500/10 text-emerald-500" };
}

interface ProductFormState {
  sku: string;
  name: string;
  category_id: string;
  price: number;
  stock: number;
  reorder_point: number;
  image_url?: string;
}

const emptyForm: ProductFormState = {
  sku: "",
  name: "",
  category_id: "",
  price: 0,
  stock: 0,
  reorder_point: 10,
  image_url: undefined,
};

export default function Products() {
  const { data: products, isLoading, error } = useAdminProducts();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductWithCategory | null>(null);

  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const typedProducts = useMemo(() => (products || []) as ProductWithCategory[], [products]);
  const categoryList = (categories || []) as Category[];

  const filteredProducts = useMemo(() => {
    return typedProducts.filter((product) => {
      const searchLower = searchQuery.toLowerCase();
      const categoryName = product.category?.name || "";
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        categoryName.toLowerCase().includes(searchLower);

      const matchesCategory =
        categoryFilter === "all" || product.category_id === categoryFilter;

      let matchesStock = true;
      if (stockFilter === "in-stock") matchesStock = product.stock > product.reorder_point;
      else if (stockFilter === "low-stock")
        matchesStock = product.stock <= product.reorder_point && product.stock > 0;
      else if (stockFilter === "out-of-stock") matchesStock = product.stock === 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [typedProducts, searchQuery, categoryFilter, stockFilter]);

  const stockCounts = useMemo(
    () => ({
      all: typedProducts.length,
      inStock: typedProducts.filter((p) => p.stock > p.reorder_point).length,
      lowStock: typedProducts.filter((p) => p.stock <= p.reorder_point && p.stock > 0).length,
      outOfStock: typedProducts.filter((p) => p.stock === 0).length,
    }),
    [typedProducts]
  );

  const totalStats = useMemo(
    () => ({
      totalValue: typedProducts.reduce((sum, p) => sum + Number(p.price) * p.stock, 0),
      totalSales: typedProducts.reduce((sum, p) => sum + p.sales, 0),
      totalRevenue: typedProducts.reduce((sum, p) => sum + Number(p.revenue), 0),
    }),
    [typedProducts]
  );

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStockFilter("all");
  };

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || stockFilter !== "all";

  const openEditModal = (product: ProductWithCategory) => {
    setSelectedProduct(product);
    setForm({
      sku: product.sku,
      name: product.name,
      category_id: product.category_id || "",
      price: Number(product.price),
      stock: product.stock,
      reorder_point: product.reorder_point,
      image_url: product.image_url || undefined,
    });
    setIsEditMode(true);
  };

  const openViewModal = (product: ProductWithCategory) => {
    setSelectedProduct(product);
    setIsEditMode(false);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;
    try {
      await updateProduct.mutateAsync({
        id: selectedProduct.id,
        name: form.name,
        category_id: form.category_id || null,
        price: form.price,
        stock: form.stock,
        reorder_point: form.reorder_point,
        image_url: form.image_url || null,
      });
      closeModal();
    } catch {
      /* handled by hook toast */
    }
  };

  const handleAddProduct = async () => {
    if (!form.sku || !form.name || !form.category_id) {
      toast.error("Please fill in name, SKU and category");
      return;
    }
    try {
      await createProduct.mutateAsync({
        sku: form.sku,
        name: form.name,
        slug: slugify(form.name, form.sku),
        category_id: form.category_id,
        price: form.price,
        stock: form.stock,
        reorder_point: form.reorder_point,
        image_url: form.image_url,
      });
      setForm(emptyForm);
      setIsAddModalOpen(false);
    } catch {
      /* handled by hook toast */
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteProduct.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage your inventory and product catalog</p>
          </div>
          <Button
            onClick={() => {
              setForm(emptyForm);
              setIsAddModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{typedProducts.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inventory Value</p>
                  <p className="text-2xl font-bold">{formatAmount(totalStats.totalValue)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">{totalStats.totalSales.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {stockCounts.lowStock + stockCounts.outOfStock}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Layers className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryList.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Stock status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock ({stockCounts.all})</SelectItem>
                  <SelectItem value="in-stock">In Stock ({stockCounts.inStock})</SelectItem>
                  <SelectItem value="low-stock">Low Stock ({stockCounts.lowStock})</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock ({stockCounts.outOfStock})</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2">
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {hasActiveFilters ? `Filtered Products (${filteredProducts.length})` : "All Products"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mb-4 opacity-50" />
                <p>Failed to load products</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mb-4 opacity-50" />
                <p>No products found</p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock, product.reorder_point);
                      return (
                        <TableRow
                          key={product.id}
                          className="group cursor-pointer"
                          onClick={() => openViewModal(product)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <span className="font-medium max-w-[200px] truncate">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {product.sku}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category?.name || "—"}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{formatAmount(Number(product.price))}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-medium",
                                  product.stock <= product.reorder_point && "text-amber-500",
                                  product.stock === 0 && "text-red-500"
                                )}
                              >
                                {product.stock}
                              </span>
                              <Badge
                                variant="secondary"
                                className={cn(stockStatus.class, "border-0 text-xs")}
                              >
                                {stockStatus.label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3 text-muted-foreground" />
                              <span>{product.sales}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-emerald-600">
                            {formatAmount(Number(product.revenue))}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(product);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(product);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View / Edit Modal */}
        <Dialog open={!!selectedProduct} onOpenChange={closeModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {isEditMode ? "Edit Product" : "Product Details"}
              </DialogTitle>
              <DialogDescription>{selectedProduct?.sku}</DialogDescription>
            </DialogHeader>

            {selectedProduct && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {isEditMode ? (
                  <>
                    <div className="space-y-2">
                      <Label>Product Image</Label>
                      <ImageUpload
                        value={form.image_url}
                        onChange={(url) => setForm((p) => ({ ...p, image_url: url }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Product Name</Label>
                      <Input
                        id="edit-name"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-price">Price (₹)</Label>
                        <Input
                          id="edit-price"
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-stock">Stock</Label>
                        <Input
                          id="edit-stock"
                          type="number"
                          value={form.stock}
                          onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-category">Category</Label>
                        <Select
                          value={form.category_id}
                          onValueChange={(v) => setForm((p) => ({ ...p, category_id: v }))}
                        >
                          <SelectTrigger id="edit-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryList.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-reorder">Reorder Point</Label>
                        <Input
                          id="edit-reorder"
                          type="number"
                          value={form.reorder_point}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, reorder_point: Number(e.target.value) }))
                          }
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {selectedProduct.image_url && (
                      <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={selectedProduct.image_url}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium text-lg">{selectedProduct.name}</h4>
                      <Badge variant="outline" className="mt-2">
                        {selectedProduct.category?.name || "—"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-lg font-bold">{formatAmount(Number(selectedProduct.price))}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">Stock</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold">{selectedProduct.stock}</p>
                          <Badge
                            variant="secondary"
                            className={cn(
                              getStockStatus(selectedProduct.stock, selectedProduct.reorder_point).class,
                              "border-0 text-xs"
                            )}
                          >
                            {getStockStatus(selectedProduct.stock, selectedProduct.reorder_point).label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="text-lg font-bold">{selectedProduct.sales.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-lg font-bold text-emerald-600">
                          {formatAmount(Number(selectedProduct.revenue))}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <p className="text-sm">
                          Reorder when stock falls below{" "}
                          <strong>{selectedProduct.reorder_point}</strong> units
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <DialogFooter>
              {isEditMode ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditMode(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={updateProduct.isPending}>
                    {updateProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => selectedProduct && openEditModal(selectedProduct)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Product
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Product
              </DialogTitle>
              <DialogDescription>Add a new product to your inventory</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Product Image</Label>
                <ImageUpload
                  value={form.image_url}
                  onChange={(url) => setForm((p) => ({ ...p, image_url: url }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-name">Product Name *</Label>
                <Input
                  id="new-name"
                  placeholder="Enter product name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-sku">SKU *</Label>
                  <Input
                    id="new-sku"
                    placeholder="e.g., PROD-001"
                    value={form.sku}
                    onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category">Category *</Label>
                  <Select
                    value={form.category_id}
                    onValueChange={(v) => setForm((p) => ({ ...p, category_id: v }))}
                  >
                    <SelectTrigger id="new-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryList.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-price">Price (₹)</Label>
                  <Input
                    id="new-price"
                    type="number"
                    placeholder="0"
                    value={form.price || ""}
                    onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-stock">Initial Stock</Label>
                  <Input
                    id="new-stock"
                    type="number"
                    placeholder="0"
                    value={form.stock || ""}
                    onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-reorder">Reorder Point</Label>
                <Input
                  id="new-reorder"
                  type="number"
                  placeholder="10"
                  value={form.reorder_point || ""}
                  onChange={(e) => setForm((p) => ({ ...p, reorder_point: Number(e.target.value) }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProduct} disabled={createProduct.isPending}>
                {createProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete product?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <strong>{deleteTarget?.name}</strong> from your catalog.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
