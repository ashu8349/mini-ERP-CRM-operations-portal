import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, auth, createTestCustomer, loginFor } from "./helpers";

let seq = 0;
const suffix = () => `C${Date.now() % 100000}-${seq++}`;

describe("Customers", () => {
  it("creates a customer (SALES)", async () => {
    const { token } = await loginFor("sales");
    const res = await request(app)
      .post("/api/customers")
      .set(auth(token))
      .send({
        customerName: "Alpha Traders",
        mobileNumber: "99999123456",
        businessName: "Alpha Biz",
        customerType: "Wholesale",
        status: "Active",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.customerName).toBe("Alpha Traders");
    expect(res.body.data.createdById).toBeTruthy();
  });

  it("rejects a customer without a name (400 with errors)", async () => {
    const { token } = await loginFor("sales");
    const res = await request(app)
      .post("/api/customers")
      .set(auth(token))
      .send({ mobileNumber: "99999111111", businessName: "X", customerType: "Retail", status: "Lead" });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it("rejects an invalid email (400)", async () => {
    const { token } = await loginFor("sales");
    const res = await request(app)
      .post("/api/customers")
      .set(auth(token))
      .send({
        customerName: "Bad Email",
        mobileNumber: "99999222222",
        businessName: "X",
        email: "not-an-email",
        customerType: "Retail",
        status: "Lead",
      });
    expect(res.status).toBe(400);
  });

  it("lists customers with search, filter and pagination", async () => {
    const { token } = await loginFor("admin");
    const res = await request(app)
      .get("/api/customers?page=1&limit=2&search=Mehta&status=Active")
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 2 });
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it("gets customer details with follow-ups and challans", async () => {
    const { token } = await loginFor("sales");
    const customer = await createTestCustomer(token, suffix());

    const fu = await request(app)
      .post(`/api/customers/${customer.id}/followups`)
      .set(auth(token))
      .send({ note: "TEST follow-up call", followUpDate: new Date().toISOString() });
    expect(fu.status).toBe(201);

    const res = await request(app).get(`/api/customers/${customer.id}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.followUps).toHaveLength(1);
    expect(res.body.data.followUps[0].note).toBe("TEST follow-up call");
    expect(res.body.data.followUps[0].createdBy.name).toBeTruthy();
    expect(Array.isArray(res.body.data.challans)).toBe(true);
  });

  it("updates a customer", async () => {
    const { token } = await loginFor("sales");
    const customer = await createTestCustomer(token, suffix());
    const res = await request(app)
      .put(`/api/customers/${customer.id}`)
      .set(auth(token))
      .send({ status: "Inactive", notes: "Moved to inactive" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("Inactive");
  });

  it("deletes a customer (ADMIN only)", async () => {
    const { token } = await loginFor("admin");
    const customer = await createTestCustomer(token, suffix());
    const res = await request(app).delete(`/api/customers/${customer.id}`).set(auth(token));
    expect(res.status).toBe(200);

    const missing = await request(app).get(`/api/customers/${customer.id}`).set(auth(token));
    expect(missing.status).toBe(404);
    expect(missing.body.message).toBe("Customer not found");
  });

  it("returns 404 for a missing customer", async () => {
    const { token } = await loginFor("sales");
    const res = await request(app).get("/api/customers/does-not-exist").set(auth(token));
    expect(res.status).toBe(404);
  });
});