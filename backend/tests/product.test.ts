import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, auth, loginFor } from "./helpers";

let seq = 0;
const suffix = () => `P${Date.now() % 100000}-${seq++}`;

describe("Products", () => {
  it("creates a product (ADMIN)", async () => {
    const { token } = await loginFor("admin");
    const res = await request(app)
      .post("/api/products")
      .set(auth(token))
      .send({
        productName: `Widget ${suffix()}`,
        sku: `TEST-W-${suffix()}`,
        category: "Test Gear",
        unitPrice: 250.5,
        currentStock: 10,
        minimumStock: 2,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.unitPrice).toBe(250.5);
    expect(res.body.data.currentStock).toBe(10);
  });

  it("rejects a duplicate SKU with 409", async () => {
    const { token } = await loginFor("admin");
    const sku = `TEST-DUP-${suffix()}`;
    await request(app)
      .post("/api/products")
      .set(auth(token))
      .send({ productName: "First", sku, category: "X", unitPrice: 10 });
    const res = await request(app)
      .post("/api/products")
      .set(auth(token))
      .send({ productName: "Second", sku, category: "X", unitPrice: 10 });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists|Duplicate/i);
  });

  it("rejects a negative price (400)", async () => {
    const { token } = await loginFor("admin");
    const res = await request(app)
      .post("/api/products")
      .set(auth(token))
      .send({ productName: "Neg", sku: `TEST-NEG-${suffix()}`, category: "X", unitPrice: -5 });
    expect(res.status).toBe(400);
  });

  it("rejects a negative initial stock (400)", async () => {
    const { token } = await loginFor("admin");
    const res = await request(app)
      .post("/api/products")
      .set(auth(token))
      .send({ productName: "Neg", sku: `TEST-NEG-${suffix()}`, category: "X", unitPrice: 5, currentStock: -1 });
    expect(res.status).toBe(400);
  });

  it("edits a product and preserves the SKU rule (400 on duplicate)", async () => {
    const { token } = await loginFor("admin");
    const a = await request(app)
      .post("/api/products")
      .set(auth(token))
      .send({ productName: "A", sku: `TEST-A-${suffix()}`, category: "X", unitPrice: 10 });
    const b = await request(app)
      .post("/api/products")
      .set(auth(token))
      .send({ productName: "B", sku: `TEST-B-${suffix()}`, category: "X", unitPrice: 10 });

    const edit = await request(app)
      .put(`/api/products/${a.body.data.id}`)
      .set(auth(token))
      .send({ unitPrice: 99, minimumStock: 7 });
    expect(edit.status).toBe(200);
    expect(edit.body.data.unitPrice).toBe(99);
    expect(edit.body.data.minimumStock).toBe(7);

    const dup = await request(app)
      .put(`/api/products/${b.body.data.id}`)
      .set(auth(token))
      .send({ sku: a.body.data.sku });
    expect(dup.status).toBe(409);
  });

  it("lists products with low-stock filter", async () => {
    const { token } = await loginFor("admin");
    await request(app)
      .post("/api/products")
      .set(auth(token))
      .send({ productName: "Low", sku: `TEST-LOW-${suffix()}`, category: "X", unitPrice: 5, currentStock: 5, minimumStock: 10 });

    const res = await request(app)
      .get("/api/products?lowStock=true&page=1&limit=50")
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.some((p: { sku: string }) => p.sku.startsWith("TEST-LOW-"))).toBe(true);
  });

  it("shows product details including recent stock movements", async () => {
    const { token } = await loginFor("admin");
    const created = await request(app)
      .post("/api/products")
      .set(auth(token))
      .send({ productName: "Hist", sku: `TEST-H-${suffix()}`, category: "X", unitPrice: 10, currentStock: 25 });
    const res = await request(app).get(`/api/products/${created.body.data.id}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.stockMovements).toHaveLength(1);
    expect(res.body.data.stockMovements[0].movementType).toBe("IN");
  });
});

describe("Stock movements", () => {
  it("records an IN adjustment and updates stock", async () => {
    const admin = await loginFor("admin");
    const { token } = await loginFor("warehouse");
    const created = await request(app)
      .post("/api/products")
      .set(auth(admin.token))
      .send({ productName: "Restock", sku: `TEST-RE-${suffix()}`, category: "X", unitPrice: 10, currentStock: 0 });
    const productId = created.body.data.id;

    const res = await request(app)
      .post("/api/stock-movements")
      .set(auth(token))
      .send({ productId, quantity: 50, movementType: "IN", reason: "TEST Purchase receipt" });
    expect(res.status).toBe(201);

    const product = await request(app).get(`/api/products/${productId}`).set(auth(token));
    expect(product.body.data.currentStock).toBe(50);
    const movements = await request(app)
      .get(`/api/products/${productId}/stock-movements`)
      .set(auth(token));
    expect(movements.body.data).toHaveLength(2);
  });

  it("never allows stock to go negative (400)", async () => {
    const admin = await loginFor("admin");
    const { token } = await loginFor("warehouse");
    const created = await request(app)
      .post("/api/products")
      .set(auth(admin.token))
      .send({ productName: "Few", sku: `TEST-FW-${suffix()}`, category: "X", unitPrice: 10, currentStock: 3 });

    const res = await request(app)
      .post("/api/stock-movements")
      .set(auth(token))
      .send({ productId: created.body.data.id, quantity: 4, movementType: "OUT", reason: "TEST adjustment" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient stock/i);

    const product = await request(app).get(`/api/products/${created.body.data.id}`).set(auth(token));
    expect(product.body.data.currentStock).toBe(3);
  });

  it("rejects an OUT that exactly empties stock? (no - it should succeed)", async () => {
    const admin = await loginFor("admin");
    const { token } = await loginFor("warehouse");
    const created = await request(app)
      .post("/api/products")
      .set(auth(admin.token))
      .send({ productName: "Zero", sku: `TEST-ZR-${suffix()}`, category: "X", unitPrice: 10, currentStock: 7 });
    const res = await request(app)
      .post("/api/stock-movements")
      .set(auth(token))
      .send({ productId: created.body.data.id, quantity: 7, movementType: "OUT", reason: "TEST adjustment" });
    expect(res.status).toBe(201);
    const product = await request(app).get(`/api/products/${created.body.data.id}`).set(auth(token));
    expect(product.body.data.currentStock).toBe(0);
  });

  it("paginates stock movement history", async () => {
    const admin = await loginFor("admin");
    const { token } = await loginFor("warehouse");
    const created = await request(app)
      .post("/api/products")
      .set(auth(admin.token))
      .send({ productName: "Page", sku: `TEST-PG-${suffix()}`, category: "X", unitPrice: 10, currentStock: 0 });
    const productId = created.body.data.id;
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/stock-movements")
        .set(auth(token))
        .send({ productId, quantity: 1, movementType: "IN", reason: "TEST receipt" });
    }
    const res = await request(app)
      .get(`/api/products/${productId}/stock-movements?page=1&limit=2`)
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(4); // 1 initial + 3 IN
    expect(res.body.pagination.totalPages).toBe(2);
  });
});