import { z } from "zod";

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"], { message: "Role is required" }),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({ message: "Status is required" }),
});

export const resetUserPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128)
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});