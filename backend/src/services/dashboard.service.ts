import { prisma } from "../prisma";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export async function getDashboardStats() {
  const [
    totalCustomers,
    activeCustomers,
    leadCustomers,
    totalProducts,
    lowStockProducts,
    totalStockUnits,
    draftChallans,
    confirmedChallans,
    cancelledChallans,
    recentCustomers,
    recentChallans,
    recentStockMovements,
    lowStockItems,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: "Active" } }),
    prisma.customer.count({ where: { status: "Lead" } }),
    prisma.product.count(),
    prisma.product.count({ where: { currentStock: { lte: prisma.product.fields.minimumStock } } }),
    prisma.product.aggregate({ _sum: { currentStock: true } }),
    prisma.salesChallan.count({ where: { status: "DRAFT" } }),
    prisma.salesChallan.count({ where: { status: "CONFIRMED" } }),
    prisma.salesChallan.count({ where: { status: "CANCELLED" } }),
    prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.salesChallan.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { id: true, customerName: true } } },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        product: { select: { id: true, productName: true, sku: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.product.findMany({
      where: { currentStock: { lte: prisma.product.fields.minimumStock } },
      orderBy: { currentStock: "asc" },
      take: 5,
    }),
  ]);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTHS[d.getMonth()] };
  }).reverse();

  const monthStart = last6Months[0].key + "-01";
  const monthEnd = last6Months[last6Months.length - 1].key + "-31";

  const movementsThisPeriod = await prisma.stockMovement.groupBy({
    by: ["movementType", "createdAt"],
    where: { createdAt: { gte: new Date(monthStart), lte: new Date(`${monthEnd}T23:59:59.999Z`) } },
    _count: { id: true },
    _sum: { quantity: true },
  });

  const byMonth = new Map<string, { IN: number; OUT: number }>();
  for (const row of movementsThisPeriod) {
    const key = row.createdAt.toISOString().slice(0, 7);
    const entry = byMonth.get(key) ?? { IN: 0, OUT: 0 };
    entry[row.movementType] += row._sum.quantity ?? 0;
    byMonth.set(key, entry);
  }

  const stockMovementSeries = last6Months.map(({ key, label }) => ({
    label,
    ...(byMonth.get(key) ?? { IN: 0, OUT: 0 }),
  }));

  return {
    cards: {
      totalCustomers,
      activeCustomers,
      leadCustomers,
      totalProducts,
      lowStockProducts,
      totalStockUnits: totalStockUnits._sum.currentStock ?? 0,
      draftChallans,
      confirmedChallans,
      cancelledChallans,
    },
    charts: {
      challansByStatus: [
        { name: "Draft", value: draftChallans },
        { name: "Confirmed", value: confirmedChallans },
        { name: "Cancelled", value: cancelledChallans },
      ],
      customerStatusDistribution: [
        { name: "Lead", value: leadCustomers },
        { name: "Active", value: activeCustomers },
        { name: "Inactive", value: totalCustomers - leadCustomers - activeCustomers },
      ],
      stockMovementSeries,
    },
    recent: {
      customers: recentCustomers,
      challans: recentChallans,
      stockMovements: recentStockMovements,
      lowStockItems,
    },
  };
}