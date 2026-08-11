import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Activity, Plus, Search } from "lucide-react";
import { stockService } from "@/services/stock.service";
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
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/utils/format";

const PAGE_SIZE = 15;

const movementSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  movementType: z.enum(["IN", "OUT"], { message: "Select a movement type" }),
  quantity: z.coerce
    .number({ message: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than zero")
    .max(1_000_000, "Quantity is too large"),
  reason: z.string().trim().min(1, "Reason is required").max(200),
});

export function StockMovementsPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canAdjust = hasRole("ADMIN", "WAREHOUSE");

  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(movementSchema),
    defaultValues: { productId: "", movementType: "IN", quantity: 1, reason: "" },
  });

  const watchedProductId = watch("productId");
  const selectedProduct = products.find((p) => p.id === watchedProductId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    stockService
      .list({ page, limit: PAGE_SIZE, search, movementType: typeFilter || undefined })
      .then((res) => {
        if (cancelled) return;
        setMovements(res.items);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        showToast("error", err instanceof Error ? err.message : "Failed to load stock movements");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, typeFilter, showToast]);

  useEffect(() => {
    if (modalOpen) {
      productService
        .list({ limit: 100 })
        .then((res) => setProducts(res.items))
        .catch(() => undefined);
    }
  }, [modalOpen]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await stockService.create({
        productId: values.productId,
        quantity: values.quantity,
        movementType: values.movementType,
        reason: values.reason,
      });
      showToast("success", `Stock movement recorded (${values.movementType})`);
      setModalOpen(false);
      reset({ productId: "", movementType: "IN", quantity: 1, reason: "" });
      setPage(1);
      setSearch("");
      setTypeFilter("");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to record stock movement");
    }
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Movements"
        description="Every stock change is recorded with the product, reason and user."
        actions={
          canAdjust ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="size-4" />
              Record Movement
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by product name or SKU…"
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
          <Select
            placeholder="All types"
            value={typeFilter}
            onChange={(e) => {
              setPage(1);
              setTypeFilter(e.target.value);
            }}
            className="w-44"
            options={[
              { value: "IN", label: "Stock In (IN)" },
              { value: "OUT", label: "Stock Out (OUT)" },
            ]}
          />
        </div>

        {loading ? (
          <PageLoader />
        ) : movements.length === 0 ? (
          <EmptyState
            title="No stock movements found"
            description={search || typeFilter ? "Try adjusting your filters." : "Stock changes will appear here."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Quantity</th>
                  <th className="px-5 py-3 font-medium">Reason</th>
                  <th className="px-5 py-3 font-medium">Created by</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-800">{m.product?.productName ?? "Unknown"}</span>
                      <span className="block font-mono text-xs text-slate-400">{m.product?.sku}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5">
                        <Activity className={m.movementType === "IN" ? "size-4 text-emerald-600" : "size-4 text-rose-600"} />
                        <Badge
                          className={
                            m.movementType === "IN"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-rose-50 text-rose-700 ring-rose-200"
                          }
                        >
                          {m.movementType}
                        </Badge>
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {m.movementType === "IN" ? "+" : "−"}
                      {m.quantity}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{m.reason}</td>
                    <td className="px-5 py-3 text-slate-700">{m.createdBy?.name ?? "Unknown"}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDateTime(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </Card>

      <Modal
        open={modalOpen}
        title="Record Stock Movement"
        subtitle="This will update the product stock and create a movement record."
        onClose={() => setModalOpen(false)}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" onClick={onSubmit} loading={isSubmitting}>
              Record Movement
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4" id="movement-form">
          <Select
            label="Product *"
            placeholder="Select a product"
            error={errors.productId?.message}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.productName} (${p.sku})`,
            }))}
            {...register("productId")}
          />
          {selectedProduct && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Current stock: <span className="font-semibold text-slate-800">{selectedProduct.currentStock}</span>{" "}
              · Min: {selectedProduct.minimumStock} · Price: ₹{Number(selectedProduct.unitPrice).toFixed(2)}
            </p>
          )}
          <Select
            label="Movement type *"
            error={errors.movementType?.message}
            options={[
              { value: "IN", label: "Stock In (IN) — adds stock" },
              { value: "OUT", label: "Stock Out (OUT) — removes stock" },
            ]}
            {...register("movementType")}
          />
          <Input
            label="Quantity *"
            type="number"
            min={1}
            step={1}
            error={errors.quantity?.message}
            {...register("quantity")}
          />
          <Input
            label="Reason *"
            placeholder="e.g. Purchase, Stock Adjustment"
            error={errors.reason?.message}
            {...register("reason")}
          />
        </form>
      </Modal>
    </div>
  );
}