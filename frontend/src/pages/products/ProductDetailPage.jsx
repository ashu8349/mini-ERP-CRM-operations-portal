import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Activity, AlertTriangle, ArrowLeft, ArrowRight, MapPin, Package, Pencil } from "lucide-react";
import { productService } from "@/services/product.service";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function ProductDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = hasRole("ADMIN");
  const isLow = product !== null && product.currentStock <= product.minimumStock;

  useEffect(() => {
    productService
      .get(id)
      .then((p) => {
        setProduct(p);
        setLoading(false);
      })
      .catch((err) => {
        showToast("error", err instanceof Error ? err.message : "Failed to load product");
        navigate("/products");
      });
  }, [id, showToast, navigate]);

  if (loading) return <PageLoader label="Loading product…" />;
  if (!product) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        title={product.productName}
        description={`SKU: ${product.sku}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/products")}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {isAdmin && (
              <Button onClick={() => navigate(`/products/${product.id}/edit`)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
          </>
        }
      />

      {isLow && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="size-5 shrink-0" />
          <div>
            <p className="font-medium">Low stock warning</p>
            <p className="text-xs">
              Current stock ({product.currentStock}) is at or below the minimum stock level (
              {product.minimumStock}).
            </p>
          </div>
          <Link to="/stock-movements" className="ml-auto shrink-0 text-xs font-medium underline">
            Add stock
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Product details" subtitle="Catalog information" />
          <CardBody>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">SKU</dt>
                <dd className="font-mono font-medium text-slate-800">{product.sku}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-medium text-slate-800">{product.category}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Unit price</dt>
                <dd className="font-medium text-slate-800">{formatCurrency(Number(product.unitPrice))}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="size-3.5" />
                  Warehouse
                </dt>
                <dd className="font-medium text-slate-800">{product.warehouseLocation ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <dt className="text-slate-500">Current stock</dt>
                <dd className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-900">{product.currentStock}</span>
                  {isLow && <Badge className="bg-rose-50 text-rose-700 ring-rose-200">Low</Badge>}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Minimum stock</dt>
                <dd className="font-medium text-slate-800">{product.minimumStock}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent stock movements"
            subtitle="Latest 10 changes for this product"
            action={
              <Link
                to={`/products/${product.id}/stock-movements`}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all <ArrowRight className="size-3" />
              </Link>
            }
          />
          {product.stockMovements.length === 0 ? (
            <EmptyState
              title="No stock movements yet"
              description="Stock changes for this product will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {product.stockMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        m.movementType === "IN"
                          ? "rounded-full bg-emerald-50 p-1.5 text-emerald-600"
                          : "rounded-full bg-rose-50 p-1.5 text-rose-600"
                      }
                    >
                      <Activity className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {m.reason}
                        <span className="ml-1.5 text-xs text-slate-400">
                          by {m.createdBy?.name ?? "Unknown"}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">{formatDateTime(m.createdAt)}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      m.movementType === "IN"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-rose-50 text-rose-700 ring-rose-200"
                    }
                  >
                    {m.movementType === "IN" ? "+" : "−"}
                    {m.quantity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Referenced in challans"
          subtitle="Challan items that snapshot this product"
          action={
            <Package className="size-4 text-slate-300" />
          }
        />
        <CardBody className="text-sm text-slate-500">
          Historical challans store a snapshot of the product name, SKU and price at the time of
          sale. Changes to this product will not alter previously confirmed challans.
        </CardBody>
      </Card>
    </div>
  );
}