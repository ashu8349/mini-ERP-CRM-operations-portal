import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, FileText, Pencil, Plus, Search } from "lucide-react";
import { challanService } from "@/services/challan.service";
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
import { CHALLAN_STATUS_LABELS, CHALLAN_STATUS_STYLES } from "@/utils/constants";
import { formatDate } from "@/utils/format";

const PAGE_SIZE = 10;

export function ChallansPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [challans, setChallans] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");

  const canManage = hasRole("SALES", "ADMIN");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [search, statusFilter, page, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    challanService
      .list({ page, limit: PAGE_SIZE, search, status: statusFilter })
      .then((res) => {
        if (cancelled) return;
        setChallans(res.items);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        showToast("error", err instanceof Error ? err.message : "Failed to load challans");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, statusFilter, showToast]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sales Challans"
        description="Create, confirm and track sales challans."
        actions={
          canManage ? (
            <Button onClick={() => navigate("/challans/new")}>
              <Plus className="size-4" />
              New Challan
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by challan number or customer…"
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
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="w-44"
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "CONFIRMED", label: "Confirmed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
        </div>

        {loading ? (
          <PageLoader />
        ) : challans.length === 0 ? (
          <EmptyState
            title="No challans found"
            description={search || statusFilter ? "Try adjusting your filters." : "Create your first sales challan to get started."}
            action={
              canManage ? (
                <Button onClick={() => navigate("/challans/new")}>
                  <Plus className="size-4" />
                  New Challan
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Challan No.</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Total Qty</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {challans.map((ch) => (
                  <tr key={ch.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 font-mono text-sm font-medium text-slate-800">
                        <FileText className="size-4 shrink-0 text-slate-400" />
                        {ch.challanNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-800">{ch.customer.customerName}</span>
                      <span className="block text-xs text-slate-500">{ch.customer.businessName}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{ch.items.length}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{ch.totalQuantity}</td>
                    <td className="px-5 py-3">
                      <Badge className={CHALLAN_STATUS_STYLES[ch.status]}>
                        {CHALLAN_STATUS_LABELS[ch.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(ch.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/challans/${ch.id}`)}
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          title="View details"
                        >
                          <Eye className="size-4" />
                        </button>
                        {canManage && ch.status === "DRAFT" && (
                          <button
                            onClick={() => navigate(`/challans/${ch.id}/edit`)}
                            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                            title="Edit draft"
                          >
                            <Pencil className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
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