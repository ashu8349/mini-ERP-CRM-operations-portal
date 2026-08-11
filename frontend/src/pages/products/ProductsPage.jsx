import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Package, Pencil, Plus, Search } from "lucide-react";
import { productService } from "@/services/product.service";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/utils/format";

const PAGE_SIZE = 10;

export function ProductsPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [lowStock, setLowStock] = useState((searchParams.get("lowStock") ?? "") === "true");

  const isAdmin = hasRole("ADMIN");

  useEffect(() => {
    productService.categories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (lowStock) params.set("lowStock", "true");
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [search, category, lowStock, page, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productService
      .list({ page, limit: PAGE_SIZE, search, category, lowStock })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.items);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        showToast("error", err instanceof Error ? err.message : "Failed to load products");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, category, lowStock, showToast]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description="Product catalog and stock levels."
        actions={
          isAdmin ? (
            <Button onClick={() => navigate("/products/new")}>
              <Plus className="size-4" />
              Add Product
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by name, SKU or category…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setSearch(searchInput.trim());
                }
              }}
              rightElement={<Search className="size-4 text-slate-400" />}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              placeholder="All categories"
              value={category}
              onChange={(e) => {
                setPage(1);
                setCategory(e.target.value);
              }}
              className="w-44"
              options={categories.map((c) => ({ value: c, label: c }))}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={lowStock}
                onChange={(e) => {
                  setPage(1);
                  setLowStock(e.target.checked);
                }}
                className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Low stock only
            </label>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description={search || category || lowStock ? "Try adjusting your filters." : "Add your first product to get started."}
            action={
              isAdmin ? (
                <Button onClick={() => navigate("/products/new")}>
                  <Plus className="size-4" />
                  Add Product
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Current Stock</th>
                  <th className="px-5 py-3 font-medium">Min Stock</th>
                  <th className="px-5 py-3 font-medium">Warehouse</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isLow = p.currentStock <= p.minimumStock;
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 font-medium text-slate-800">
                          <Package className="size-4 shrink-0 text-slate-400" />
                          {p.productName}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{p.sku}</td>
                      <td className="px-5 py-3 text-slate-700">{p.category}</td>
                      <td className="px-5 py-3 text-slate-700">{formatCurrency(Number(p.unitPrice))}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{p.currentStock}</td>
                      <td className="px-5 py-3 text-slate-500">{p.minimumStock}</td>
                      <td className="px-5 py-3 text-slate-700">{p.warehouseLocation ?? "—"}</td>
                      <td className="px-5 py-3">
                        {isLow ? (
                          <Badge className="bg-rose-50 text-rose-700 ring-rose-200">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">In Stock</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/products/${p.id}`)}
                            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            title="View details"
                          >
                            <Eye className="size-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => navigate(`/products/${p.id}/edit`)}
                              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                              title="Edit"
                            >
                              <Pencil className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </Card>
    </div>
  );
}