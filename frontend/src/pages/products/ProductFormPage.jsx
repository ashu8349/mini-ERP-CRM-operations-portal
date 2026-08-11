import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { productService } from "@/services/product.service";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";

const productSchema = z
  .object({
    productName: z.string().trim().min(1, "Product name is required").max(160),
    sku: z
      .string()
      .trim()
      .min(1, "SKU is required")
      .max(60)
      .regex(/^[A-Za-z0-9._-]+$/, "SKU may contain only letters, numbers, dots, underscores and dashes"),
    category: z.string().trim().min(1, "Category is required").max(80),
    unitPrice: z.coerce
      .number({ message: "Unit price must be a number" })
      .nonnegative("Unit price must be >= 0")
      .max(1_000_000_000, "Price is too large"),
    currentStock: z.coerce
      .number({ message: "Stock must be a number" })
      .int("Stock must be a whole number")
      .nonnegative("Stock must be >= 0"),
    minimumStock: z.coerce
      .number({ message: "Minimum stock must be a number" })
      .int("Minimum stock must be a whole number")
      .nonnegative("Minimum stock must be >= 0"),
    warehouseLocation: z.string().trim().max(120).optional(),
  })
  .superRefine((data, ctx) => {
    const min = data.minimumStock ?? 0;
    if ((data.currentStock ?? 0) < min) {
      ctx.addIssue({ code: "custom", path: ["currentStock"], message: "Current stock should not be below minimum stock" });
    }
  });

export function ProductFormPage() {
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
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      sku: "",
      category: "",
      unitPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      warehouseLocation: "",
    },
  });

  useEffect(() => {
    if (!id) return;
    productService
      .get(id)
      .then((p) => {
        reset({
          productName: p.productName,
          sku: p.sku,
          category: p.category,
          unitPrice: Number(p.unitPrice),
          currentStock: p.currentStock,
          minimumStock: p.minimumStock,
          warehouseLocation: p.warehouseLocation ?? "",
        });
        setLoading(false);
      })
      .catch((err) => {
        showToast("error", err instanceof Error ? err.message : "Failed to load product");
        navigate("/products");
      });
  }, [id, reset, showToast, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      productName: values.productName,
      sku: values.sku,
      category: values.category,
      unitPrice: values.unitPrice,
      currentStock: values.currentStock,
      minimumStock: values.minimumStock,
      warehouseLocation: values.warehouseLocation?.trim() || undefined,
    };
    try {
      const saved = isEdit
        ? await productService.update(id, payload)
        : await productService.create(payload);
      showToast("success", isEdit ? "Product updated successfully" : "Product created successfully");
      navigate(`/products/${saved.id}`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to save product");
    }
  });

  if (loading) return <PageLoader label="Loading product…" />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title={isEdit ? "Edit Product" : "Add Product"}
        description={isEdit ? "Update product details below." : "Create a new product record."}
        actions={
          <Button variant="secondary" onClick={() => navigate(isEdit ? `/products/${id}` : "/products")}>
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
                label="Product name *"
                placeholder="e.g. Steel Pipe 2 inch"
                error={errors.productName?.message}
                {...register("productName")}
              />
              <Input
                label="SKU *"
                placeholder="e.g. PIPE-2001"
                hint="Letters, numbers, dots, dashes and underscores only"
                error={errors.sku?.message}
                {...register("sku")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Category *"
                placeholder="e.g. Plumbing"
                error={errors.category?.message}
                {...register("category")}
              />
              <Input
                label="Unit price (₹) *"
                type="number"
                min={0}
                step="0.01"
                error={errors.unitPrice?.message}
                {...register("unitPrice")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isEdit ? (
                <div className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-700">Current stock: {errors.currentStock?.message ?? ""}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Adjust stock from the Inventory page — edits create a stock movement record.
                  </p>
                </div>
              ) : (
                <Input
                  label="Initial stock *"
                  type="number"
                  min={0}
                  step={1}
                  hint="Creates an IN stock movement automatically"
                  error={errors.currentStock?.message}
                  {...register("currentStock")}
                />
              )}
              <Input
                label="Minimum stock *"
                type="number"
                min={0}
                step={1}
                hint="Low-stock warning threshold"
                error={errors.minimumStock?.message}
                {...register("minimumStock")}
              />
            </div>

            <Input
              label="Warehouse location"
              placeholder="e.g. Rack A, Bay 3"
              error={errors.warehouseLocation?.message}
              {...register("warehouseLocation")}
            />

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="secondary" type="button" onClick={() => navigate(isEdit ? `/products/${id}` : "/products")}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {isEdit ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}