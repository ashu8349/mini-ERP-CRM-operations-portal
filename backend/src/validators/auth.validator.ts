import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Valid email is required").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .max(128)
      .regex(/[A-Za-z]/, "New password must contain at least one letter")
      .regex(/[0-9]/, "New password must contain at least one number"),
  });