import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, FileText, Pencil, UserRound, XCircle } from "lucide-react";
import { challanService } from "@/services/challan.service";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageLoader } from "@/components/ui/Spinner";
import { CHALLAN_STATUS_LABELS, CHALLAN_STATUS_STYLES } from "@/utils/constants";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function ChallanDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [acting, setActing] = useState(false);

  const canManage = hasRole("SALES", "ADMIN");

  const load = useCallback(() => {
    challanService
      .get(id)
      .then((c) => {
        setChallan(c);
        setLoading(false);
      })
      .catch((err) => {
        showToast("error", err instanceof Error ? err.message : "Failed to load challan");
        navigate("/challans");
      });
  }, [id, showToast, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async () => {
    setActing(true);
    try {
      const updated = await challanService.confirm(id);
      setChallan(updated);
      setConfirmOpen(false);
      showToast("success", "Challan confirmed. Stock has been deducted.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to confirm challan");
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    setActing(true);
    try {
      const updated = await challanService.cancel(id);
      setChallan(updated);
      setCancelOpen(false);
      showToast("success", "Challan cancelled");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to cancel challan");
    } finally {
      setActing(false);
    }
  };

  if (loading) return <PageLoader label="Loading challan…" />;
  if (!challan) return null;

  const totalAmount = challan.items.reduce((sum, it) => sum + Number(it.lineTotal), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title={challan.challanNumber}
        description={`Created ${formatDateTime(challan.createdAt)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/challans")}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {canManage && challan.status === "DRAFT" && (
              <>
                <Button variant="secondary" onClick={() => navigate(`/challans/${challan.id}/edit`)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button variant="success" onClick={() => setConfirmOpen(true)}>
                  <ArrowRight className="size-4" />
                  Confirm Challan
                </Button>
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  <XCircle className="size-4" />
                  Cancel
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Challan details" subtitle="Summary information" />
          <CardBody>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <FileText className="size-4" />
                  Number
                </dt>
                <dd className="font-mono font-medium text-slate-800">{challan.challanNumber}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="size-4" />
                  Date
                </dt>
                <dd className="font-medium text-slate-800">{formatDateTime(challan.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <UserRound className="size-4" />
                  Created by
                </dt>
                <dd className="font-medium text-slate-800">{challan.createdBy?.name ?? "Unknown"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <Badge className={CHALLAN_STATUS_STYLES[challan.status]}>
                    {CHALLAN_STATUS_LABELS[challan.status]}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <dt className="text-slate-500">Total quantity</dt>
                <dd className="text-lg font-semibold text-slate-900">{challan.totalQuantity}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Total amount</dt>
                <dd className="text-lg font-semibold text-slate-900">{formatCurrency(totalAmount)}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Customer"
            subtitle="Challan recipient"
            action={
              <Link to={`/customers/${challan.customer.id}`} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                View customer
              </Link>
            }
          />
          <CardBody className="space-y-1 text-sm">
            <p className="font-semibold text-slate-900">{challan.customer.customerName}</p>
            <p className="text-slate-600">{challan.customer.businessName}</p>
            <p className="text-slate-500">{challan.customer.mobileNumber}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Items" subtitle="Product prices snapshot at creation time" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Unit Price</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 text-right font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challan.items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{item.productNameSnapshot}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{item.skuSnapshot}</td>
                  <td className="px-5 py-3 text-slate-700">{formatCurrency(Number(item.unitPriceSnapshot))}</td>
                  <td className="px-5 py-3 text-slate-700">{item.quantity}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-800">
                    {formatCurrency(Number(item.lineTotal))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 text-sm">
                <td colSpan={3} className="px-5 py-3 font-medium text-slate-600">
                  Totals
                </td>
                <td className="px-5 py-3 font-semibold text-slate-900">{challan.totalQuantity}</td>
                <td className="px-5 py-3 text-right font-semibold text-slate-900">
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm challan"
        message="Confirming this challan will reduce inventory and create OUT stock movements. Continue?"
        confirmLabel="Yes, Confirm"
        variant="primary"
        loading={acting}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel challan"
        message="Are you sure you want to cancel this draft challan? It will not affect stock."
        confirmLabel="Cancel Challan"
        loading={acting}
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}