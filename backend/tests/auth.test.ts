import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, auth } from "./helpers";

describe("Authentication", () => {
  it("logs in with valid credentials and returns a JWT", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "Admin@123",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe("admin@example.com");
    expect(res.body.data.user.role).toBe("ADMIN");
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects invalid credentials with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "wrong-password",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns the current user for /api/auth/me", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "sales@example.com",
      password: "Sales@123",
    });
    const me = await request(app)
      .get("/api/auth/me")
      .set(auth(login.body.data.token));
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe("sales@example.com");
  });

  it("rejects requests without a token (401)", async () => {
    const res = await request(app).get("/api/customers");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects requests with a garbage token (401)", async () => {
    const res = await request(app).get("/api/customers").set(auth("not-a-token"));
    expect(res.status).toBe(401);
  });
});

describe("Role-based authorization", () => {
  it("blocks SALES from creating products (403)", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "sales@example.com",
      password: "Sales@123",
    });
    const res = await request(app)
      .post("/api/products")
      .set(auth(login.body.data.token))
      .send({ productName: "Nope", sku: "NOPE-1", category: "X", unitPrice: 1 });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Access denied/i);
  });

  it("allows ACCOUNTS to view customers but not edit them", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "accounts@example.com",
      password: "Accounts@123",
    });
    const list = await request(app).get("/api/customers").set(auth(login.body.data.token));
    expect(list.status).toBe(200);

    const create = await request(app)
      .post("/api/customers")
      .set(auth(login.body.data.token))
      .send({
        customerName: "Should Fail",
        mobileNumber: "99999111111",
        businessName: "X",
        customerType: "Retail",
        status: "Lead",
      });
    expect(create.status).toBe(403);
  });

  it("blocks WAREHOUSE from creating customers and challans", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "warehouse@example.com",
      password: "Warehouse@123",
    });
    const challan = await request(app)
      .post("/api/challans")
      .set(auth(login.body.data.token))
      .send({ customerId: "x", items: [{ productId: "x", quantity: 1 }] });
    expect(challan.status).toBe(403);
  });

  it("blocks non-admin users from listing users (403)", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "sales@example.com",
      password: "Sales@123",
    });
    const res = await request(app).get("/api/users").set(auth(login.body.data.token));
    expect(res.status).toBe(403);
  });

  it("allows admin to list users (200)", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "Admin@123",
    });
    const res = await request(app).get("/api/users").set(auth(login.body.data.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
    expect(res.body.data[0].passwordHash).toBeUndefined();
  });
});