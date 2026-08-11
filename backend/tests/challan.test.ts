import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, auth, loginFor, createTestCustomer, createTestProduct } from "./helpers";

let seq = 0;
const suffix = () => `C${Date.now() % 100000}-${seq++}`;

async function stockOf(token: string, productId: string) {
  const res = await request(app).get(`/api/products/${productId}`).set(auth(token));
  return res.body.data.currentStock;
}

describe("Sales Challans", () => {
  it("creates a DRAFT challan with an auto-generated number and does not touch stock", async () => {
    const sales = await loginFor("sales");
    const admin = await loginFor("admin");
    const customer = await createTestCustomer(admin.token, suffix());
    const product = await createTestProduct(admin.token, suffix(), 100);

    const res = await request(app)
      .post("/api/challans")
      .set(auth(sales.token))
      .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 20 }] });

    expect(res.status).toBe(201);
    const challan = res.body.data;
    expect(challan.status).toBe("DRAFT");
    expect(challan.challanNumber).toMatch(/^CH-\d{4}-\d{6}$/);
    expect(challan.totalQuantity).toBe(20);
    expect(challan.items).toHaveLength(1);
    expect(await stockOf(admin.token, product.id)).toBe(100);
  });

  it("stores product snapshots on challan items", async () => {
    const sales = await loginFor("sales");
    const admin = await loginFor("admin");
    const customer = await createTestCustomer(admin.token, suffix());
    const product = await createTestProduct(admin.token, suffix(), 50);

    const res = await request(app)
      .post("/api/challans")
      .set(auth(sales.token))
      .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 5 }] });

    expect(res.status).toBe(201);
    const item = res.body.data.items[0];
    expect(item.productNameSnapshot).toBe(product.productName);
    expect(item.skuSnapshot).toBe(product.sku);
    expect(item.unitPriceSnapshot).toBe(product.unitPrice);
    expect(item.lineTotal).toBe(product.unitPrice * 5);
  });

  it("confirms a challan: reduces stock and creates OUT movements", async () => {
    const sales = await loginFor("sales");
    const admin = await loginFor("admin");
    const customer = await createTestCustomer(admin.token, suffix());
    const product = await createTestProduct(admin.token, suffix(), 20);

    const draft = await request(app)
      .post("/api/challans")
      .set(auth(sales.token))
      .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 5 }] });

    const confirm = await request(app)
      .post(`/api/challans/${draft.body.data.id}/confirm`)
      .set(auth(sales.token));
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.status).toBe("CONFIRMED");
    expect(await stockOf(admin.token, product.id)).toBe(15);

    const movements = await request(app)
      .get(`/api/products/${product.id}/stock-movements`)
      .set(auth(admin.token));
    const outMovement = movements.body.data.find(
      (m: { movementType: string; reason: string }) =>
        m.movementType === "OUT" && m.reason === "Sales Challan"
    );
    expect(outMovement).toBeTruthy();
    expect(outMovement.quantity).toBe(5);
  });

  it("rejects confirmation with insufficient stock and rolls back ALL products", async () => {
    const sales = await loginFor("sales");
    const admin = await loginFor("admin");
    const customer = await createTestCustomer(admin.token, suffix());
    const enough = await createTestProduct(admin.token, suffix(), 100);
    const short = await createTestProduct(admin.token, suffix(), 5);

    const draft = await request(app)
      .post("/api/challans")
      .set(auth(sales.token))
      .send({
        customerId: customer.id,
        items: [
          { productId: enough.id, quantity: 30 },
          { productId: short.id, quantity: 10 },
        ],
      });
    expect(draft.status).toBe(201);

    const confirm = await request(app)
      .post(`/api/challans/${draft.body.data.id}/confirm`)
      .set(auth(sales.token));

    expect(confirm.status).toBe(400);
    expect(confirm.body.message).toMatch(/Insufficient stock/i);

    // NO product should have been reduced - the whole transaction must roll back.
    expect(await stockOf(admin.token, enough.id)).toBe(100);
    expect(await stockOf(admin.token, short.id)).toBe(5);

    const detail = await request(app)
      .get(`/api/challans/${draft.body.data.id}`)
      .set(auth(sales.token));
    expect(detail.body.data.status).toBe("DRAFT");
  });

  it("rejects out-of-stock quantities on confirm (400)", async () => {
    const sales = await loginFor("sales");
    const admin = await loginFor("admin");
    const customer = await createTestCustomer(admin.token, suffix());
    const product = await createTestProduct(admin.token, suffix(), 3);

    const draft = await request(app)
      .post("/api/challans")
      .set(auth(sales.token))
      .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 4 }] });
    expect(draft.status).toBe(201);

    const confirm = await request(app)
      .post(`/api/challans/${draft.body.data.id}/confirm`)
      .set(auth(sales.token));
    expect(confirm.status).toBe(400);
    expect(confirm.body.message).toMatch(/Insufficient stock/i);
  });

  it("edits a DRAFT challan (customer, items, totals)", async () => {
    const sales = await loginFor("sales");
    const admin = await loginFor("admin");
    const customerA = await createTestCustomer(admin.token, suffix());
    const customerB = await createTestCustomer(admin.token, suffix());
    const product = await createTestProduct(admin.token, suffix(), 50);

    const draft = await request(app)
      .post("/api/challans")
      .set(auth(sales.token))
      .send({ customerId: customerA.id, items: [{ productId: product.id, quantity: 10 }] });

    const edit = await request(app)
      .put(`/api/challans/${draft.body.data.id}`)
      .set(auth(sales.token))
      .send({ customerId: customerB.id, items: [{ productId: product.id, quantity: 7 }] });

    expect(edit.status).toBe(200);
    expect(edit.body.data.customerId).toBe(customerB.id);
    expect(edit.body.data.totalQuantity).toBe(7);
    expect(edit.body.data.items).toHaveLength(1);
    expect(await stockOf(admin.token, product.id)).toBe(50);
  });

  it("rejects editing a CONFIRMED challan", async () => {
    const sales = await loginFor("sales");
    const admin = await loginFor("admin");
    const customer = await createTestCustomer(admin.token, suffix());
    const product = await createTestProduct(admin.token, suffix(), 50);

    const draft = await request(app)
      .post("/api/challans")
      .set(auth(sales.token))
      .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 5 }] });
    await request(app)
      .post(`/api/challans/${draft.body.data.id}/confirm`)
      .set(auth(sales.token));

    const edit = await request(app)
      .put(`/api/challans/${draft.body.data.id}`)
      .set(auth(sales.token))
      .send({ items: [{ productId: product.id, quantity: 1 }] });
    expect(edit.status).toBe(400);
    expect(edit.body.message).toMatch(/DRAFT/i);
  });

  it("rejects cancelling a CONFIRMED challan", async () => {
    const sales = await loginFor("sales");
    const admin = await loginFor("admin");
    const customer = await createTestCustomer(admin.token, suffix());
    const product = await createTestProduct(admin.token, suffix(), 10);

    const draft = await request(app)
      .post("/api/challans")
      .set(auth(sales.token))
      .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 2 }] });
    await request(app)
      .post(`/api/challans/${draft.body.data.id}/confirm`)
      .set(auth(sales.token));

    const cancel = await request(app)
      .post(`/api/challans/${draft.body.data.id}/cancel`)
      .set(auth(sales.token));
    expect(cancel.status).toBe(400);
    expect(cancel.body.message).toMatch(/confirmed/i);
  });

  it("cancels a DRAFT challan without touching stock", async () => {
    const sales = await loginFor("sales");
    const admin = await loginFor("admin");
    const customer = await createTestCustomer(admin.token, suffix());
    const product = await createTestProduct(admin.token, suffix(), 40);

    const draft = await request(app)
      .post("/api/challans")
      .set(auth(sales.token))
      .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 8 }] });

    const cancel = await request(app)
      .post(`/api/challans/${draft.body.data.id}/cancel`)
      .set(auth(sales.token));
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe("CANCELLED");
    expect(await stockOf(admin.token, product.id)).toBe(40);
  });

  it("generates unique, sequential challan numbers", async () => {
    const sales = await loginFor("sales");
    const admin = await loginFor("admin");
    const customer = await createTestCustomer(admin.token, suffix());
    const product = await createTestProduct(admin.token, suffix(), 200);

    const numbers = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post("/api/challans")
        .set(auth(sales.token))
        .send({ customerId: customer.id, items: [{ productId: product.id, quantity: 1 }] });
      expect(res.status).toBe(201);
      numbers.add(res.body.data.challanNumber);
    }
    expect(numbers.size).toBe(3);
  });

  it("rejects a challan with no items (400)", async () => {
    const sales = await loginFor("sales");
    const admin = await loginFor("admin");
    const customer = await createTestCustomer(admin.token, suffix());
    const res = await request(app)
      .post("/api/challans")
      .set(auth(sales.token))
      .send({ customerId: customer.id, items: [] });
    expect(res.status).toBe(400);
  });
});