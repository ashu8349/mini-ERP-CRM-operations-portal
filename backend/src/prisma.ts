import { Prisma, PrismaClient } from "@prisma/client";

// Prisma Decimal serializes as a string by default (e.g. "250.5"). For a
// pricing/ERP app, serializing money as a JSON number keeps the API simple
// for clients. Applied once, globally, for all API responses.
// Prisma Decimal serializes as a string by default (e.g. "250.5"). For a
// pricing/ERP app, serializing money as a JSON number keeps the API simple
// for clients. Applied once, globally, for all API responses.
(Prisma.Decimal.prototype as unknown as { toJSON(): unknown }).toJSON = function toJSON(): number {
  return Number(this.toString());
};

export const prisma = new PrismaClient();