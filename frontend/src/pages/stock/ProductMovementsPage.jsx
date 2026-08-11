import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Activity } from "lucide-react";
import { stockService } from "@/services/stock.service";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/utils/format";

const PAGE_SIZE = 15;

export function ProductMovementsPage() {
  const { id = "" } = useParams();
  const { showToast } = useToast();
  const [movements, setMovements] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    stockService
      .productHistory(id, { page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setMovements(res.items);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        showToast("error", err instanceof Error ? err.message : "Failed to load stock history");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, page, showToast]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Movement History"
        description="All stock changes for this product."
        actions={
          <Button variant="secondary" onClick={() => window.history.back()}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        }
      />

      <Card>
        {loading ? (
          <PageLoader />
        ) : movements.length === 0 ? (
          <EmptyState title="No stock movements yet" description="Stock changes for this product will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
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
                      <span className="flex items-center gap-2">
                        <Activity
                          className={
                            m.movementType === "IN" ? "size-4 text-emerald-600" : "size-4 text-rose-600"
                          }
                        />
                        <Badge
                          className={
                            m.movementType === "IN"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-rose-50 text-rose-700 ring-rose-200"
                          }
                        >
                          {m.movementType === "IN" ? "IN" : "OUT"}
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
    </div>
  );
}