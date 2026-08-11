import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().min(1).max(64),
});

const gteZero = z.number().int().nonnegative("Must be a non-negative integer");
const price = z
  .number()
  .nonnegative("Unit price must be >= 0")
  .max(1_000_000_000, "Price is too large");

export const createProductSchema = z.object({
  productName: z.string().trim().min(1, "Product name is required").max(160),
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required")
    .max(60)
    .regex(/^[A-Za-z0-9._-]+$/, "SKU may contain only letters, numbers, dots, underscores and dashes"),
  category: z.string().trim().min(1, "Category is required").max(80),
  unitPrice: price,
  currentStock: gteZero.optional(),
  minimumStock: gteZero.optional(),
  warehouseLocation: z.string().trim().max(120).optional().or(z.literal("")),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().max(160).optional(),
  category: z.string().trim().max(80).optional(),
  lowStock: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["createdAt", "productName", "currentStock", "unitPrice"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const stockMovementSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().positive("Quantity must be greater than zero").max(1_000_000),
  movementType: z.enum(["IN", "OUT"], { message: "Invalid movement type" }),
  reason: z.string().trim().min(1, "Reason is required").max(200),
});

export const stockQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  productId: z.string().max(64).optional(),
  movementType: z.enum(["IN", "OUT"]).optional(),
  search: z.string().trim().max(160).optional(),
});

export const productCategoriesSchema = z.object({});