import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

/**
 * Builds a test database URL from DATABASE_URL by replacing the database name
 * with <name>_test (e.g. opsflow -> opsflow_test).
 */
export function getTestDbUrl(): string {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const dbName = url.pathname.replace(/^\//, "");
  url.pathname = `/${dbName}_test`;
  return url.toString();
}

export function getAdminUrl(): string {
  const url = new URL(getTestDbUrl());
  url.pathname = "/postgres";
  return url.toString();
}

export default async function globalSetup() {
  const testUrl = getTestDbUrl();
  const dbName = new URL(testUrl).pathname.replace(/^\//, "");

  // 1. Create the test database if it does not exist
  const admin = new PrismaClient({ datasources: { db: { url: getAdminUrl() } } });
  try {
    await admin.$executeRawUnsafe(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`).catch(() => undefined);
  } finally {
    await admin.$disconnect();
  }

  // 2. Apply migrations
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: "pipe",
  });

  // 3. Seed demo data (users, customers, products, challans)
  execSync("npx tsx prisma/seed.ts", {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: "pipe",
  });

  process.env.TEST_DATABASE_URL = testUrl;
  process.env.DATABASE_URL = testUrl;
}