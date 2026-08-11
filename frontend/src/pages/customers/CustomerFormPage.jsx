import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { customerService } from "@/services/customer.service";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PageLoader } from "@/components/ui/Spinner";
import { toDateInputValue } from "@/utils/format";

const customerSchema = z
  .object({
    customerName: z.string().trim().min(1, "Customer name is required").max(120),
    mobileNumber: z
      .string()
      .trim()
      .min(10, "Mobile number should be at least 10 digits")
      .max(15, "Mobile number is too long")
      .regex(/^[0-9+\-\s()]+$/, "Invalid mobile number format"),
    email: z.union([z.literal(""), z.string().trim().email("Valid email is required")]).optional(),
    businessName: z.string().trim().min(1, "Business name is required").max(160),
    gstNumber: z.string().trim().max(30).optional(),
    customerType: z.enum(["Retail", "Wholesale", "Distributor"], {
      message: "Customer type is required",
    }),
    address: z.string().trim().max(500).optional(),
    status: z.enum(["Lead", "Active", "Inactive"]),
    followUpDate: z.string().optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.followUpDate && Number.isNaN(new Date(data.followUpDate).getTime())) {
      ctx.addIssue({ code: "custom", path: ["followUpDate"], message: "Invalid follow-up date" });
    }
  });

export function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(isEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerName: "",
      mobileNumber: "",
      email: "",
      businessName: "",
      gstNumber: "",
      customerType: "Retail",
      address: "",
      status: "Lead",
      followUpDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!id) return;
    customerService
      .get(id)
      .then((c) => {
        reset({
          customerName: c.customerName,
          mobileNumber: c.mobileNumber,
          email: c.email ?? "",
          businessName: c.businessName,
          gstNumber: c.gstNumber ?? "",
          customerType: c.customerType,
          address: c.address ?? "",
          status: c.status,
          followUpDate: toDateInputValue(c.followUpDate),
          notes: c.notes ?? "",
        });
        setLoading(false);
      })
      .catch((err) => {
        showToast("error", err instanceof Error ? err.message : "Failed to load customer");
        navigate("/customers");
      });
  }, [id, reset, showToast, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      ...values,
      email: values.email?.trim() || undefined,
      gstNumber: values.gstNumber?.trim() || undefined,
      address: values.address?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
      followUpDate: values.followUpDate ? new Date(values.followUpDate).toISOString() : null,
    };
    try {
      const saved = isEdit
        ? await customerService.update(id, payload)
        : await customerService.create(payload);
      showToast("success", isEdit ? "Customer updated successfully" : "Customer created successfully");
      navigate(`/customers/${saved.id}`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to save customer");
    }
  });

  if (loading) return <PageLoader label="Loading customer…" />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title={isEdit ? "Edit Customer" : "Add Customer"}
        description={isEdit ? "Update customer details below." : "Create a new customer record."}
        actions={
          <Button variant="secondary" onClick={() => navigate(isEdit ? `/customers/${id}` : "/customers")}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Customer name *"
                placeholder="e.g. Rajesh Sharma"
                error={errors.customerName?.message}
                {...register("customerName")}
              />
              <Input
                label="Mobile number *"
                placeholder="e.g. 9876543210"
                error={errors.mobileNumber?.message}
                {...register("mobileNumber")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Business name *"
                placeholder="e.g. Sharma Trading Co."
                error={errors.businessName?.message}
                {...register("businessName")}
              />
              <Input
                label="Email"
                type="email"
                placeholder="optional"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="GST number"
                placeholder="optional"
                error={errors.gstNumber?.message}
                {...register("gstNumber")}
              />
              <Select
                label="Customer type *"
                error={errors.customerType?.message}
                options={[
                  { value: "Retail", label: "Retail" },
                  { value: "Wholesale", label: "Wholesale" },
                  { value: "Distributor", label: "Distributor" },
                ]}
                {...register("customerType")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Status *"
                error={errors.status?.message}
                options={[
                  { value: "Lead", label: "Lead" },
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ]}
                {...register("status")}
              />
              <Input
                label="Follow-up date"
                type="date"
                error={errors.followUpDate?.message}
                {...register("followUpDate")}
              />
            </div>

            <Textarea
              label="Address"
              rows={3}
              placeholder="Street, city, state…"
              error={errors.address?.message}
              {...register("address")}
            />

            <Textarea
              label="Notes"
              rows={3}
              placeholder="Any additional notes about this customer…"
              error={errors.notes?.message}
              {...register("notes")}
            />

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(isEdit ? `/customers/${id}` : "/customers")}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {isEdit ? "Save Changes" : "Create Customer"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}