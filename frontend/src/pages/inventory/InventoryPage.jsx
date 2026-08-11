import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeftRight, Boxes, Package, Search } from "lucide-react";
import { productService } from "@/services/product.service";
import { dashboardService } from "@/services/dashboard.service";
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
import { formatNumber } from "@/utils/format";

const PAGE_SIZE = 15;

export function InventoryPage() {
  const navigate = useNavigate();
  const showToast = useToast().showToast;
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [stockUnits, setStockUnits] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    dashboardService
      .stats()
      .then((s) => {
        setStockUnits(s.cards.totalStockUnits);
        setLowStockCount(s.cards.lowStockProducts);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    productService.categories().then(setCategories).catch(() => undefined);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    productService
      .list({ page, limit: PAGE_SIZE, search, category, lowStock: lowStockOnly || undefined })
      .then((res) => {
        setProducts(res.items);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        showToast("error", err instanceof Error ? err.message : "Failed to load inventory");
        setLoading(false);
      });
  }, [page, search, category, lowStockOnly, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inventory"
        description="Current stock levels across all products."
        actions={<Link to="/stock-movements" className="inline-flex">
          <Button><ArrowLeftRight className="size-4" />Stock Movements</Button>
        </Link>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Products</p>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600"><Package className="size-4" /></span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(total)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total stock units</p>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><Boxes className="size-4" /></span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(stockUnits)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Low stock items</p>
            <span className="rounded-lg bg-rose-50 p-2 text-rose-600"><AlertTriangle className="size-4" /></span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(lowStockCount)}</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search products…"
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
                checked={lowStockOnly}
                onChange={(e) => {
                  setPage(1);
                  setLowStockOnly(e.target.checked);
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
          <EmptyState title="No inventory found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Current stock</th>
                  <th className="px-5 py-3 font-medium">Minimum</th>
                  <th className="px-5 py-3 font-medium">Warehouse</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isLow = p.currentStock <= p.minimumStock;
                  const pct = p.minimumStock > 0 ? Math.min(100, (p.currentStock / p.minimumStock) * 100) : 100;
                  return (
                    <tr
                      key={p.id}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${isLow ? "bg-rose-50/50" : ""}`}
                      onClick={() => navigate(`/products/${p.id}`)}
                    >
                      <td className="px-5 py-3 font-medium text-slate-800">{p.productName}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{p.sku}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isLow ? "text-rose-600" : "text-slate-800"}`}>
                            {p.currentStock}
                          </span>
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                            <span
                              className={`block h-full rounded-full ${isLow ? "bg-rose-500" : "bg-emerald-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{p.minimumStock}</td>
                      <td className="px-5 py-3 text-slate-700">{p.warehouseLocation ?? "—"}</td>
                      <td className="px-5 py-3">
                        {isLow ? (
                          <Badge className="bg-rose-50 text-rose-700 ring-rose-200">
                            <AlertTriangle className="size-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">In Stock</Badge>
                        )}
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