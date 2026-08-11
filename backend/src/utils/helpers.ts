import type { UserRole } from "@prisma/client";
import { CustomerStatus, CustomerType } from "@prisma/client";

export const USER_ROLES: UserRole[] = ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"];
export const CUSTOMER_TYPES = [CustomerType.Retail, CustomerType.Wholesale, CustomerType.Distributor];
export const CUSTOMER_STATUSES = [CustomerStatus.Lead, CustomerStatus.Active, CustomerStatus.Inactive];

export function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function paginationParams(query: Record<string, unknown>) {
  const page = Math.max(toNumber(query.page, 1), 1);
  const limit = Math.min(Math.max(toNumber(query.limit, 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}