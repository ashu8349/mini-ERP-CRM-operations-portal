import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().min(1).max(64),
});

export const createChallanSchema = z.object({
  customerId: z.string().min(1, "Customer is required").max(64),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z
          .number()
          .int("Quantity must be a whole number")
          .positive("Quantity must be greater than zero")
          .max(1_000_000, "Quantity is too large"),
      })
    )
    .min(1, "At least one product is required")
    .max(200, "Too many line items"),
});

export const updateChallanSchema = createChallanSchema.partial().refine(
  (v) => v.customerId !== undefined || v.items !== undefined,
  { message: "Nothing to update" }
);

export const challanQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().max(160).optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
  customerId: z.string().max(64).optional(),
  sortBy: z.enum(["createdAt", "challanNumber"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});