import request from "supertest";
import { createApp } from "../src/app";
import { TEST_USERS } from "./setup/test-env";

export const app = createApp();

export async function loginFor(
  role: keyof typeof TEST_USERS
): Promise<{ token: string; userId: string }> {
  const creds = TEST_USERS[role];
  const res = await request(app).post("/api/auth/login").send({
    email: creds.email,
    password: creds.password,
  });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${role}: ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.data.token, userId: res.body.data.user.id };
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function createTestCustomer(token: string, suffix: string) {
  const res = await request(app)
    .post("/api/customers")
    .set(auth(token))
    .send({
      customerName: `Test Customer ${suffix}`,
      mobileNumber: `99999${Math.floor(100000 + Math.random() * 899999)}`,
      businessName: `Test Business ${suffix}`,
      customerType: "Wholesale",
      status: "Active",
    });
  if (res.status !== 201) {
    throw new Error(`createTestCustomer failed: ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

export async function createTestProduct(token: string, suffix: string, stock = 100) {
  const res = await request(app)
    .post("/api/products")
    .set(auth(token))
    .send({
      productName: `Test Product ${suffix}`,
      sku: `TEST-${suffix.toUpperCase().replace(/\s+/g, "-")}`,
      category: "Test",
      unitPrice: 100,
      currentStock: stock,
      minimumStock: 5,
      warehouseLocation: "T-01",
    });
  if (res.status !== 201) {
    throw new Error(`createTestProduct failed: ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}