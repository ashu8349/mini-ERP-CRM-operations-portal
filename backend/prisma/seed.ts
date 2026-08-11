import { PrismaClient, CustomerStatus, CustomerType, ChallanStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_USERS = [
  { name: "Admin User", email: "admin@example.com", password: "Admin@123", role: "ADMIN" },
  { name: "Sales User", email: "sales@example.com", password: "Sales@123", role: "SALES" },
  { name: "Warehouse User", email: "warehouse@example.com", password: "Warehouse@123", role: "WAREHOUSE" },
  { name: "Accounts User", email: "accounts@example.com", password: "Accounts@123", role: "ACCOUNTS" },
] as const;

const CUSTOMERS: Array<{
  name: string;
  mobile: string;
  email?: string;
  business: string;
  gst?: string;
  type: CustomerType;
  status: CustomerStatus;
  address?: string;
  note?: string;
}> = [
  { name: "Rajesh Kumar", mobile: "9821012345", email: "rajesh@srkenterprises.in", business: "SRK Enterprises", gst: "27AABCU9603R1ZM", type: CustomerType.Wholesale, status: CustomerStatus.Active, address: "12, Ambawadi, Ahmedabad, Gujarat", note: "Bulk buyer - 200+ units monthly" },
  { name: "Priya Sharma", mobile: "9876543210", email: "priya@mehtastores.com", business: "Mehta Grocery Stores", gst: "07AAECM1234F1Z5", type: CustomerType.Retail, status: CustomerStatus.Active, address: "45, Sadar Bazaar, Delhi" },
  { name: "Amit Patel", mobile: "9898989898", email: "amit@pateltraders.co", business: "Patel Traders", gst: "24AADCP5561G1Z7", type: CustomerType.Distributor, status: CustomerStatus.Active, address: "Plot 9, GIDC, Vatva, Ahmedabad" },
  { name: "Sneha Desai", mobile: "9765432109", email: "sneha.desai@gmail.com", business: "Desai SuperMart", type: CustomerType.Retail, status: CustomerStatus.Active, address: "3, FC Road, Pune", note: "Prefers delivery on Tuesdays" },
  { name: "Vikram Singh", mobile: "9988776655", email: "vikram@singhwolesale.in", business: "Singh Wholesale Suppliers", gst: "19AAECS1234N1ZX", type: CustomerType.Wholesale, status: CustomerStatus.Lead, address: "88, Sadar Bazaar, Kanpur", note: "Asked for catalog and rate list - follow up" },
  { name: "Kavita Iyer", mobile: "9696969696", email: "kavita@iyergroups.com", business: "Iyer Distributors", gst: "33AAECI5678K1Z2", type: CustomerType.Distributor, status: CustomerStatus.Active, address: "21, Anna Salai, Chennai" },
  { name: "Mohammed Rafiq", mobile: "9890909090", email: "rafiq@bazaarhouse.in", business: "Bazaar House", type: CustomerType.Retail, status: CustomerStatus.Inactive, address: "5, MG Road, Hyderabad", note: "No orders since 3 months - reactivation plan needed" },
  { name: "Sunita Agarwal", mobile: "9955443322", email: "sunita@agarwaltrading.com", business: "Agarwal Trading Co.", gst: "23AADFA7890P1Z8", type: CustomerType.Wholesale, status: CustomerStatus.Active, address: "17, G.T. Road, Howrah, Kolkata" },
  { name: "Rahul Verma", mobile: "9012345678", email: "rahul.verma@vermafruits.in", business: "Verma Fresh Fruits", type: CustomerType.Retail, status: CustomerStatus.Active, address: "56, Market Road, Lucknow" },
  { name: "Neha Joshi", mobile: "9856743210", email: "neha@joshistores.com", business: "Joshi Kirana Store", type: CustomerType.Retail, status: CustomerStatus.Lead, address: "34, Bajaj Nagar, Nagpur", note: "Interested in wholesale pricing - call back" },
];

const PRODUCTS: Array<{
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  min: number;
  location: string;
}> = [
  { name: "Basmati Rice 5kg", sku: "GRN-RICE-BAS5", category: "Grains", price: 575, stock: 150, min: 40, location: "A-01-01" },
  { name: "Toor Dal 1kg", sku: "PLSE-TOOR-1", category: "Pulses", price: 185, stock: 200, min: 50, location: "A-02-01" },
  { name: "Sunflower Oil 1L", sku: "OIL-SUN-1L", category: "Oils", price: 145, stock: 80, min: 30, location: "B-01-01" },
  { name: "Refined Sugar 1kg", sku: "SUGR-REF-1", category: "Staples", price: 47, stock: 500, min: 100, location: "B-02-01" },
  { name: "Wheat Flour (Atta) 10kg", sku: "GRN-ATTA-10", category: "Grains", price: 520, stock: 90, min: 35, location: "A-01-02" },
  { name: "Toothpaste 200g", sku: "PERS-HG-TP200", category: "Personal Care", price: 95, stock: 25, min: 30, location: "C-01-01" },
  { name: "Washing Powder 1kg", sku: "HOME-SURF-1", category: "Household", price: 165, stock: 45, min: 25, location: "C-02-01" },
  { name: "Tea Classic 250g", sku: "BEV-TEA-250", category: "Beverages", price: 165, stock: 120, min: 40, location: "D-01-01" },
  { name: "Coffee Powder 100g", sku: "BEV-COFF-100", category: "Beverages", price: 220, stock: 60, min: 20, location: "D-01-02" },
  { name: "Biscuits Family Pack 1kg", sku: "SNK-BISC-1", category: "Snacks", price: 150, stock: 18, min: 30, location: "E-01-01" },
  { name: "Namkeen Mixture 500g", sku: "SNK-MIX-500", category: "Snacks", price: 110, stock: 75, min: 25, location: "E-01-02" },
  { name: "Dishwash Liquid 500ml", sku: "HOME-DSH-500", category: "Household", price: 125, stock: 55, min: 20, location: "C-02-02" },
  { name: "Black Pepper Powder 100g", sku: "SPC-PEP-100", category: "Spices", price: 185, stock: 40, min: 15, location: "A-03-01" },
  { name: "Turmeric Powder 500g", sku: "SPC-TURM-500", category: "Spices", price: 145, stock: 35, min: 15, location: "A-03-02" },
  { name: "Mustard Oil 1L", sku: "OIL-MUST-1L", category: "Oils", price: 175, stock: 65, min: 25, location: "B-01-02" },
];

async function main() {
  console.log("Seeding OpsFlow ERP database...");

  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // --- Users --------------------------------------------------------------
  const users: Record<string, { id: string }> = {};
  for (const u of DEMO_USERS) {
    const created = await prisma.user.create({
      data: { name: u.name, email: u.email, passwordHash: await bcrypt.hash(u.password, 10), role: u.role },
    });
    users[u.role] = { id: created.id };
  }
  console.log("Users created (4)");

  // --- Customers -----------------------------------------------------------
  const customerIds: string[] = [];
  for (const c of CUSTOMERS) {
    const created = await prisma.customer.create({
      data: {
        customerName: c.name,
        mobileNumber: c.mobile,
        email: c.email,
        businessName: c.business,
        gstNumber: c.gst,
        customerType: c.type,
        status: c.status,
        address: c.address,
        notes: c.note,
        createdById: users.ADMIN.id,
      },
    });
    customerIds.push(created.id);
  }
  console.log("Customers created (10)");

  // Follow-up history for a few customers
  await prisma.customerFollowUp.create({
    data: {
      customerId: customerIds[4],
      note: "Shared the latest product catalog and wholesale rate list by email.",
      followUpDate: new Date(Date.now() + 3 * 86400000),
      createdById: users.SALES.id,
    },
  });
  await prisma.customerFollowUp.create({
    data: {
      customerId: customerIds[4],
      note: "Initial tele-call: very interested in bulk rice and oil pricing.",
      followUpDate: new Date(Date.now() - 2 * 86400000),
      createdById: users.SALES.id,
    },
  });
  await prisma.customerFollowUp.create({
    data: {
      customerId: customerIds[6],
      note: "Called regarding reactivation - customer is currently stocking with competitor.",
      followUpDate: new Date(Date.now() + 7 * 86400000),
      createdById: users.SALES.id,
    },
  });

  // --- Products + initial stock ---------------------------------------------
  const productIds: string[] = [];
  for (const p of PRODUCTS) {
    const created = await prisma.product.create({
      data: {
        productName: p.name,
        sku: p.sku,
        category: p.category,
        unitPrice: p.price,
        currentStock: p.stock,
        minimumStock: p.min,
        warehouseLocation: p.location,
      },
    });
    productIds.push(created.id);
    await prisma.stockMovement.create({
      data: {
        productId: created.id,
        quantity: p.stock,
        movementType: "IN",
        reason: "Initial Stock",
        createdById: users.WAREHOUSE.id,
      },
    });
  }
  console.log("Products created (15)");

  // --- Sample challans -------------------------------------------------------
  const createChallan = async (
    customerIdx: number,
    status: ChallanStatus,
    items: Array<{ productIdx: number; qty: number }>,
    daysAgo: number
  ) => {
    const year = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 900000) + 100000;
    const challan = await prisma.salesChallan.create({
      data: {
        challanNumber: `CH-${year}-${String(seq).padStart(6, "0")}`,
        customerId: customerIds[customerIdx],
        status,
        totalQuantity: items.reduce((s, i) => s + i.qty, 0),
        createdById: status === ChallanStatus.CONFIRMED ? users.SALES.id : users.SALES.id,
        createdAt: new Date(Date.now() - daysAgo * 86400000),
      },
    });

    for (const it of items) {
      const p = PRODUCTS[it.productIdx];
      await prisma.salesChallanItem.create({
        data: {
          challanId: challan.id,
          productId: productIds[it.productIdx],
          productNameSnapshot: p.name,
          skuSnapshot: p.sku,
          unitPriceSnapshot: p.price,
          quantity: it.qty,
          lineTotal: p.price * it.qty,
        },
      });
      if (status === ChallanStatus.CONFIRMED) {
        await prisma.product.update({
          where: { id: productIds[it.productIdx] },
          data: { currentStock: { decrement: it.qty } },
        });
        await prisma.stockMovement.create({
          data: {
            productId: productIds[it.productIdx],
            quantity: it.qty,
            movementType: "OUT",
            reason: "Sales Challan",
            createdById: users.SALES.id,
            createdAt: new Date(Date.now() - daysAgo * 86400000),
          },
        });
      }
    }
  };

  await createChallan(
    0,
    ChallanStatus.CONFIRMED,
    [
      { productIdx: 0, qty: 10 },
      { productIdx: 3, qty: 50 },
    ],
    2
  );
  await createChallan(
    3,
    ChallanStatus.CONFIRMED,
    [
      { productIdx: 2, qty: 5 },
      { productIdx: 7, qty: 20 },
    ],
    1
  );
  await createChallan(
    1,
    ChallanStatus.DRAFT,
    [
      { productIdx: 1, qty: 12 },
      { productIdx: 9, qty: 10 },
    ],
    0
  );

  console.log("Challans created (3)");
  console.log("\nSeed completed.");
  console.log("Demo users:");
  DEMO_USERS.forEach((u) => console.log(`  ${u.email}  /  ${u.password}`));
  console.log("\nIMPORTANT: Change these demo passwords before any production use!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });