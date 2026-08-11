import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { customerService } from "@/services/customer.service";
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
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_STYLES,
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_TYPE_STYLES,
} from "@/utils/constants";
import { formatDate } from "@/utils/format";

const PAGE_SIZE = 10;

export function CustomersPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = hasRole("ADMIN", "SALES");
  const canDelete = hasRole("ADMIN");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [search, typeFilter, statusFilter, page, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    customerService
      .list({ page, limit: PAGE_SIZE, search, customerType: typeFilter, status: statusFilter })
      .then((res) => {
        if (cancelled) return;
        setCustomers(res.items);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        showToast("error", err instanceof Error ? err.message : "Failed to load customers");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, typeFilter, statusFilter, showToast]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await customerService.remove(deleteTarget.id);
      showToast("success", "Customer deleted successfully");
      setDeleteTarget(null);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (customers.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        description="Manage your customer base and follow-ups."
        actions={
          canManage ? (
            <Button onClick={() => navigate("/customers/new")}>
              <Plus className="size-4" />
              Add Customer
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by name, business, mobile or email…"
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
          <div className="flex gap-3">
            <Select
              placeholder="All types"
              value={typeFilter}
              onChange={(e) => {
                setPage(1);
                setTypeFilter(e.target.value);
              }}
              className="w-40"
              options={[
                { value: "Retail", label: "Retail" },
                { value: "Wholesale", label: "Wholesale" },
                { value: "Distributor", label: "Distributor" },
              ]}
            />
            <Select
              placeholder="All statuses"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="w-40"
              options={[
                { value: "Lead", label: "Lead" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={
              search || typeFilter || statusFilter
                ? "Try adjusting your search or filters."
                : "Add your first customer to get started."
            }
            action={
              canManage ? (
                <Button onClick={() => navigate("/customers/new")}>
                  <Plus className="size-4" />
                  Add Customer
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">Mobile</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Follow-up</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-800">{c.customerName}</span>
                      {c.email && <span className="block text-xs text-slate-500">{c.email}</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{c.businessName}</td>
                    <td className="px-5 py-3 text-slate-700">{c.mobileNumber}</td>
                    <td className="px-5 py-3">
                      <Badge className={CUSTOMER_TYPE_STYLES[c.customerType]}>
                        {CUSTOMER_TYPE_LABELS[c.customerType]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={CUSTOMER_STATUS_STYLES[c.status]}>
                        {CUSTOMER_STATUS_LABELS[c.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{formatDate(c.followUpDate)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/customers/${c.id}`)}
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          title="View details"
                        >
                          <Eye className="size-4" />
                        </button>
                        {canManage && (
                          <button
                            onClick={() => navigate(`/customers/${c.id}/edit`)}
                            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
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

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete customer"
          message={
            <>
              Are you sure you want to delete <strong>{deleteTarget.customerName}</strong>? This
              action cannot be undone.
            </>
          }
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}