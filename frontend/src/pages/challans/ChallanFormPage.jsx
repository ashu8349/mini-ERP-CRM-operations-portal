import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { challanService } from "@/services/challan.service";
import { customerService } from "@/services/customer.service";
import { productService } from "@/services/product.service";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageLoader } from "@/components/ui/Spinner";
import { formatCurrency } from "@/utils/format";

const itemSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.coerce
    .number({ message: "Enter quantity" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than zero"),
});

const challanSchema = z
  .object({
    customerId: z.string().min(1, "Select a customer"),
    items: z.array(itemSchema).min(1, "Add at least one product"),
  })
  .superRefine((data, ctx) => {
    const seen = new Set();
    data.items.forEach((item, i) => {
      if (seen.has(item.productId)) {
        ctx.addIssue({
          code: "custom",
          path: [`items`, i, `productId`],
          message: "Product already added",
        });
      }
      seen.add(item.productId);
    });
  });

export function ChallanFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingChallan, setLoadingChallan] = useState(isEdit);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mode, setMode] = useState("draft");

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(challanSchema),
    defaultValues: { customerId: "", items: [{ productId: "", quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = watch("items");
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  useEffect(() => {
    Promise.all([
      customerService.list({ limit: 200 }),
      productService.list({ limit: 200 }),
    ])
      .then(([custs, prods]) => {
        setCustomers(custs.items);
        setProducts(prods.items);
        setLoadingData(false);
      })
      .catch((err) => {
        showToast("error", err instanceof Error ? err.message : "Failed to load data");
        navigate("/challans");
      });
  }, [showToast, navigate]);

  useEffect(() => {
    if (!id) return;
    challanService
      .get(id)
      .then((challan) => {
        reset({
          customerId: challan.customer.id,
          items: challan.items.map((it) => ({
            productId: it.product?.id ?? "",
            quantity: it.quantity,
          })),
        });
        setLoadingChallan(false);
      })
      .catch((err) => {
        showToast("error", err instanceof Error ? err.message : "Failed to load challan");
        navigate("/challans");
      });
  }, [id, reset, showToast, navigate]);

  const totals = useMemo(() => {
    return (watchedItems ?? []).reduce(
      (acc, item) => {
        const product = productMap.get(item.productId);
        const qty = Number(item.quantity) || 0;
        return {
          totalQuantity: acc.totalQuantity + qty,
          totalAmount: acc.totalAmount + (product ? Number(product.unitPrice) * qty : 0),
        };
      },
      { totalQuantity: 0, totalAmount: 0 }
    );
  }, [watchedItems, productMap]);

  const validateAvailableStock = (confirming) => {
    if (!confirming) return true;
    const items = getValues("items");
    for (const item of items) {
      if (!item.productId) continue;
      const product = productMap.get(item.productId);
      if (product && Number(item.quantity) > product.currentStock) {
        showToast(
          "error",
          `Insufficient stock for ${product.productName} (${product.sku}). Available: ${product.currentStock}, requested: ${item.quantity}`
        );
        return false;
      }
    }
    return true;
  };

  const saveChallan = async (confirming) => {
    if (!validateAvailableStock(confirming)) return;
    const values = getValues();
    const payload = {
      customerId: values.customerId,
      items: values.items.map((it) => ({ productId: it.productId, quantity: Number(it.quantity) })),
    };
    try {
      if (isEdit) {
        await challanService.update(id, payload);
        const saved = confirming ? await challanService.confirm(id) : null;
        showToast("success", confirming ? "Challan confirmed. Stock has been deducted." : "Challan updated successfully");
        navigate(`/challans/${saved?.id ?? id}`);
      } else {
        const created = await challanService.create(payload);
        const saved = confirming ? await challanService.confirm(created.id) : created;
        showToast("success", confirming ? "Challan confirmed. Stock has been deducted." : "Challan saved as draft");
        navigate(`/challans/${saved.id}`);
      }
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to save challan");
    }
  };

  const onSubmit = handleSubmit((_values) => {
    setMode("draft");
    saveChallan(false);
  });

  const onConfirmClick = handleSubmit(() => {
    setMode("confirm");
    setConfirmOpen(true);
  });

  if (loadingData || loadingChallan) return <PageLoader label="Loading challan form…" />;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title={isEdit ? "Edit Challan" : "New Sales Challan"}
        description={isEdit ? "Edit this draft challan." : "Select a customer, add products and save or confirm."}
        actions={
          <Button variant="secondary" onClick={() => navigate(isEdit ? `/challans/${id}` : "/challans")}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        }
      />

      <form onSubmit={onSubmit} noValidate>
        <Card>
          <CardHeader title="Step 1 — Customer" subtitle="Select the customer this challan is for." />
          <CardBody>
            <Select
              label="Customer *"
              placeholder="Select a customer"
              error={errors.customerId?.message}
              options={customers.map((c) => ({
                value: c.id,
                label: `${c.customerName} (${c.businessName})`,
              }))}
              {...register("customerId")}
            />
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader
            title="Step 2 — Products"
            subtitle="Add products, set quantities and review line totals."
            action={
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => append({ productId: "", quantity: 1 })}
                disabled={fields.length >= 50}
              >
                <Plus className="size-4" />
                Add row
              </Button>
            }
          />

          {errors.items?.root?.message && (
            <p className="px-5 pb-2 text-xs text-rose-600">{errors.items.root.message}</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Available</th>
                  <th className="px-5 py-3 font-medium">Unit Price</th>
                  <th className="px-5 py-3 font-medium">Quantity</th>
                  <th className="px-5 py-3 font-medium">Line Total</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fields.map((field, index) => {
                  const product = productMap.get(watchedItems?.[index]?.productId ?? "");
                  const qty = Number(watchedItems?.[index]?.quantity) || 0;
                  const overStock = product !== undefined && qty > product.currentStock;
                  return (
                    <tr key={field.id} className="align-top">
                      <td className="px-5 py-3">
                        <Select
                          placeholder="Select product"
                          error={errors.items?.[index]?.productId?.message}
                          options={products.map((p) => ({
                            value: p.id,
                            label: `${p.productName}`,
                          }))}
                          {...register(`items.${index}.productId`)}
                        />
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">
                        {product?.sku ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={overStock ? "font-medium text-rose-600" : "text-slate-700"}>
                          {product?.currentStock ?? "—"}
                        </span>
                        {overStock && (
                          <span className="block text-xs text-rose-600">Exceeds stock</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {product ? formatCurrency(Number(product.unitPrice)) : "—"}
                      </td>
                      <td className="px-5 py-3 w-28">
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          error={errors.items?.[index]?.quantity?.message}
                          {...register(`items.${index}.quantity`)}
                        />
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {product ? formatCurrency(Number(product.unitPrice) * qty) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          title="Remove row"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-x-10 gap-y-2 border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm">
            <div>
              <span className="text-slate-500">Total quantity:</span>{" "}
              <span className="font-semibold text-slate-900">{totals.totalQuantity}</span>
            </div>
            <div>
              <span className="text-slate-500">Total amount:</span>{" "}
              <span className="font-semibold text-slate-900">{formatCurrency(totals.totalAmount)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => navigate(isEdit ? `/challans/${id}` : "/challans")}>
                Cancel
              </Button>
              <Button variant="secondary" type="submit" loading={isSubmitting && mode === "draft"}>
                Save Draft
              </Button>
              <Button
                variant="success"
                type="button"
                onClick={onConfirmClick}
                loading={isSubmitting && mode === "confirm"}
              >
                Confirm Challan
              </Button>
            </div>
          </div>
        </Card>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm challan"
        message="Confirming this challan will reduce inventory by the quantities listed above and record OUT stock movements. Continue?"
        confirmLabel="Yes, Confirm"
        variant="primary"
        loading={isSubmitting}
        onConfirm={() => {
          setConfirmOpen(false);
          saveChallan(true);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}