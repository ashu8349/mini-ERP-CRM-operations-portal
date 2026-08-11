import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// ---------------------------------------------------------------------------
// Runs in EVERY test worker before test modules are imported.
// Points DATABASE_URL at the <db>_test database created by global-setup.
// ---------------------------------------------------------------------------

function getTestDbUrl(): string {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const dbName = url.pathname.replace(/^\//, "");
  if (!dbName.endsWith("_test")) {
    url.pathname = `/${dbName}_test`;
  }
  return url.toString();
}

process.env.DATABASE_URL = getTestDbUrl();

export const prisma = new PrismaClient();

export const TEST_USERS = {
  admin: { email: "admin@example.com", password: "Admin@123" },
  sales: { email: "sales@example.com", password: "Sales@123" },
  warehouse: { email: "warehouse@example.com", password: "Warehouse@123" },
  accounts: { email: "accounts@example.com", password: "Accounts@123" },
} as const;

export async function cleanup() {
  await prisma.$executeRawUnsafe(
    `DELETE FROM "sales_challans" WHERE "customerId" IN (SELECT id FROM "customers" WHERE "mobileNumber" LIKE '99999%')`
  );
  await prisma.$executeRawUnsafe(`DELETE FROM "customer_follow_ups" WHERE note LIKE 'TEST %'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "customers" WHERE "mobileNumber" LIKE '99999%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "stock_movements" WHERE reason LIKE 'TEST %'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "products" WHERE "sku" LIKE 'TEST-%'`);
}

beforeAll(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});