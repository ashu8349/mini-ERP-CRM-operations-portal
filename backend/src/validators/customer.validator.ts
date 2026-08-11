import { z } from "zod";
import { CustomerStatus, CustomerType } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().email("Valid email is required").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

export const createCustomerSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required").max(120),
  mobileNumber: z
    .string()
    .trim()
    .min(10, "Mobile number should be at least 10 digits")
    .max(15, "Mobile number is too long")
    .regex(/^[0-9+\-\s()]+$/, "Invalid mobile number format"),
  email: z.string().trim().email("Valid email is required").max(255).optional().or(z.literal("")),
  businessName: z.string().trim().min(1, "Business name is required").max(160),
  gstNumber: z.string().trim().max(30).optional().or(z.literal("")),
  customerType: z.nativeEnum(CustomerType, { message: "Invalid customer type" }),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.nativeEnum(CustomerStatus, { message: "Invalid customer status" }).default("Lead"),
  followUpDate: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  note: z.string().trim().min(1, "Note is required").max(2000),
  followUpDate: z.coerce.date(),
});

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().max(160).optional(),
  customerType: z.nativeEnum(CustomerType).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  sortBy: z.enum(["createdAt", "customerName", "followUpDate"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const idParamSchema = z.object({
  id: z.string().min(1).max(64),
});