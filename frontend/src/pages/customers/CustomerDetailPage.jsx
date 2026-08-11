import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2, Calendar, Mail, MapPin, Pencil, Phone, StickyNote } from "lucide-react";
import { customerService } from "@/services/customer.service";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  CHALLAN_STATUS_LABELS,
  CHALLAN_STATUS_STYLES,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_STYLES,
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_TYPE_STYLES,
} from "@/utils/constants";
import { formatDate, formatDateTime } from "@/utils/format";

const followUpSchema = z.object({
  note: z.string().trim().min(1, "Note is required").max(2000),
  followUpDate: z.string().min(1, "Follow-up date is required"),
});

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
      <div>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="font-medium text-slate-800">{value ?? "—"}</dd>
      </div>
    </div>
  );
}

export function CustomerDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const canManage = hasRole("ADMIN", "SALES");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(followUpSchema),
    defaultValues: { note: "", followUpDate: "" },
  });

  useEffect(() => {
    customerService
      .get(id)
      .then((c) => {
        setCustomer(c);
        setLoading(false);
      })
      .catch((err) => {
        showToast("error", err instanceof Error ? err.message : "Failed to load customer");
        navigate("/customers");
      });
  }, [id, showToast, navigate]);

  const onAddFollowUp = handleSubmit(async (values) => {
    try {
      await customerService.addFollowUp(id, values.note, new Date(values.followUpDate).toISOString());
      setCustomer(await customerService.get(id));
      setFollowUpOpen(false);
      reset({ note: "", followUpDate: "" });
      showToast("success", "Follow-up added successfully");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to add follow-up");
    }
  });

  if (loading) return <PageLoader label="Loading customer…" />;
  if (!customer) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        title={customer.customerName}
        description={`Customer since ${formatDate(customer.createdAt)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/customers")}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {canManage && (
              <Button onClick={() => navigate(`/customers/${customer.id}/edit`)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Customer information" subtitle="Profile and contact details" />
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={CUSTOMER_STATUS_STYLES[customer.status]}>
                {CUSTOMER_STATUS_LABELS[customer.status]}
              </Badge>
              <Badge className={CUSTOMER_TYPE_STYLES[customer.customerType]}>
                {CUSTOMER_TYPE_LABELS[customer.customerType]}
              </Badge>
            </div>

            <dl className="space-y-3 text-sm">
              <InfoRow icon={<Building2 className="size-4" />} label="Business" value={customer.businessName} />
              <InfoRow icon={<Phone className="size-4" />} label="Mobile" value={customer.mobileNumber} />
              <InfoRow icon={<Mail className="size-4" />} label="Email" value={customer.email} />
              <InfoRow icon={<StickyNote className="size-4" />} label="GST Number" value={customer.gstNumber} />
              <InfoRow icon={<MapPin className="size-4" />} label="Address" value={customer.address} />
              <InfoRow icon={<Calendar className="size-4" />} label="Next follow-up" value={formatDate(customer.followUpDate)} />
            </dl>

            {customer.notes && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{customer.notes}</p>
              </div>
            )}

            {canManage && (
              <Button className="w-full" onClick={() => setFollowUpOpen(true)}>
                Add Follow-up
              </Button>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Follow-up history" subtitle="All recorded follow-ups" />
            {customer.followUps.length === 0 ? (
              <EmptyState title="No follow-ups yet" description="Add a follow-up to start tracking this customer." />
            ) : (
              <div className="divide-y divide-slate-100">
                {customer.followUps.map((f) => (
                  <div key={f.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        {f.createdBy?.name ?? "Unknown"} · {formatDateTime(f.createdAt)}
                      </p>
                      <Badge className="bg-amber-50 text-amber-700 ring-amber-200">
                        <Calendar className="size-3" />
                        {formatDate(f.followUpDate)}
                      </Badge>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{f.note}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Sales challans" subtitle="Challans created for this customer" />
            {customer.challans.length === 0 ? (
              <EmptyState title="No challans yet" description="Challans for this customer will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3 font-medium">Challan No.</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Total Qty</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.challans.map((ch) => (
                      <tr key={ch.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <Link to={`/challans/${ch.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                            {ch.challanNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-slate-700">{formatDate(ch.createdAt)}</td>
                        <td className="px-5 py-3 text-slate-700">{ch.totalQuantity}</td>
                        <td className="px-5 py-3">
                          <Badge className={CHALLAN_STATUS_STYLES[ch.status]}>
                            {CHALLAN_STATUS_LABELS[ch.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={followUpOpen} title="Add Follow-up" onClose={() => setFollowUpOpen(false)} size="md">
        <form onSubmit={onAddFollowUp} className="space-y-4">
          <Input
            label="Follow-up date *"
            type="date"
            error={errors.followUpDate?.message}
            {...register("followUpDate")}
          />
          <Textarea
            label="Note *"
            rows={5}
            placeholder="What was discussed and what are the next steps?"
            error={errors.note?.message}
            {...register("note")}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setFollowUpOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save Follow-up
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}