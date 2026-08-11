import type { Prisma } from "@prisma/client";
import { ChallanStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { ApiError } from "../utils/ApiError";
import { paginationParams } from "../utils/helpers";
import { applyStockMovement } from "./stock.service";

type ChallanItemInput = {
  productId: string;
  quantity: number;
};

type ChallanInput = {
  customerId: string;
  items: ChallanItemInput[];
};

type ChallanQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerId?: string;
  sortBy?: string;
  sortOrder?: string;
};

const CHALLAN_INCLUDE = {
  customer: {
    select: { id: true, customerName: true, businessName: true, mobileNumber: true },
  },
  createdBy: { select: { id: true, name: true, role: true } },
  items: {
    orderBy: { id: "asc" as const },
    include: { product: { select: { id: true, productName: true, sku: true, currentStock: true } } },
  },
} satisfies Prisma.SalesChallanInclude;

export async function listChallans(query: ChallanQuery) {
  const { page, limit, skip } = paginationParams(query);

  const where: Prisma.SalesChallanWhereInput = {
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.status ? { status: query.status as ChallanStatus } : {}),
    ...(query.search
      ? {
          OR: [
            { challanNumber: { contains: query.search, mode: "insensitive" } },
            { customer: { customerName: { contains: query.search, mode: "insensitive" } } },
            { customer: { businessName: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const sortCol = query.sortBy === "challanNumber" ? "challanNumber" : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const [challans, total] = await Promise.all([
    prisma.salesChallan.findMany({
      where,
      orderBy: { [sortCol]: sortOrder },
      skip,
      take: limit,
      include: CHALLAN_INCLUDE,
    }),
    prisma.salesChallan.count({ where }),
  ]);

  return { challans, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getChallan(id: string) {
  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: CHALLAN_INCLUDE,
  });
  if (!challan) {
    throw ApiError.notFound("Challan not found");
  }
  return challan;
}

export async function getChallanOrThrow(id: string) {
  const challan = await prisma.salesChallan.findUnique({ where: { id } });
  if (!challan) {
    throw ApiError.notFound("Challan not found");
  }
  return challan;
}

/** Generates the next challan number e.g. CH-2026-000007 inside a transaction. */
async function nextChallanNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;
  const last = await tx.salesChallan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: "desc" },
    select: { challanNumber: true },
  });

  const lastSeq = last ? Number(last.challanNumber.slice(prefix.length)) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(6, "0")}`;
}

async function loadProductsForItems(
  items: ChallanItemInput[]
): Promise<Map<string, Prisma.ProductGetPayload<{}>>> {
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const map = new Map(products.map((p) => [p.id, p]));
  return map;
}

function computeTotals(items: ChallanItemInput[], products: Map<string, Prisma.ProductGetPayload<{}>>) {
  return items.map((item) => {
    const product = products.get(item.productId);
    if (!product) {
      throw ApiError.badRequest(`One of the selected products no longer exists`);
    }
    return {
      product,
      quantity: item.quantity,
      lineTotal: Number(product.unitPrice) * item.quantity,
    };
  });
}

export async function createChallan(input: ChallanInput, createdById: string) {
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) {
    throw ApiError.notFound("Customer not found");
  }

  const products = await loadProductsForItems(input.items);
  const rows = computeTotals(input.items, products);
  const totalQuantity = rows.reduce((sum, r) => sum + r.quantity, 0);

  let retries = 3;
  while (retries > 0) {
    try {
      return await prisma.$transaction(async (tx) => {
        const challanNumber = await nextChallanNumber(tx);
        return tx.salesChallan.create({
          data: {
            challanNumber,
            customerId: input.customerId,
            totalQuantity,
            status: ChallanStatus.DRAFT,
            createdById,
            items: {
              create: rows.map((r) => ({
                productId: r.product.id,
                productNameSnapshot: r.product.productName,
                skuSnapshot: r.product.sku,
                unitPriceSnapshot: r.product.unitPrice,
                quantity: r.quantity,
                lineTotal: r.lineTotal,
              })),
            },
          },
          include: CHALLAN_INCLUDE,
        });
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002" && retries > 1) {
        retries -= 1;
        continue;
      }
      throw err;
    }
  }
  throw ApiError.conflict("Could not generate a unique challan number. Please retry.");
}

export async function updateChallan(id: string, input: Partial<ChallanInput>) {
  const existing = await getChallanOrThrow(id);
  if (existing.status !== ChallanStatus.DRAFT) {
    throw ApiError.badRequest(`Only DRAFT challans can be edited. Current status: ${existing.status}`);
  }

  const data: {
    customerId?: string;
    items?: Prisma.SalesChallanItemUncheckedCreateWithoutChallanInput[];
    totalQuantity: number;
  } = {
    totalQuantity: existing.totalQuantity,
  };

  if (input.customerId !== undefined) {
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) {
      throw ApiError.notFound("Customer not found");
    }
    data.customerId = input.customerId;
  }

  if (input.items !== undefined && input.items.length > 0) {
    const products = await loadProductsForItems(input.items);
    const rows = computeTotals(input.items, products);
    data.totalQuantity = rows.reduce((sum, r) => sum + r.quantity, 0);
    data.items = rows.map((r) => ({
      productId: r.product.id,
      productNameSnapshot: r.product.productName,
      skuSnapshot: r.product.sku,
      unitPriceSnapshot: r.product.unitPrice,
      quantity: r.quantity,
      lineTotal: r.lineTotal,
    }));
  }

  return prisma.$transaction(async (tx) => {
    if (data.items) {
      await tx.salesChallanItem.deleteMany({ where: { challanId: id } });
    }
    return tx.salesChallan.update({
      where: { id },
      data: {
        customerId: data.customerId,
        totalQuantity: data.totalQuantity,
        items: data.items ? { create: data.items } : undefined,
      },
      include: CHALLAN_INCLUDE,
    });
  });
}

/**
 * Confirm a challan. Everything happens in ONE transaction:
 * 1. Validate stock for every item (rolls back if any product is short)
 * 2. Deduct stock + create OUT stock movements
 * 3. Flip status to CONFIRMED
 */
export async function confirmChallan(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!challan) {
      throw ApiError.notFound("Challan not found");
    }
    if (challan.status === ChallanStatus.CONFIRMED) {
      throw ApiError.badRequest("Challan is already confirmed");
    }
    if (challan.status === ChallanStatus.CANCELLED) {
      throw ApiError.badRequest("A cancelled challan cannot be confirmed");
    }

    for (const item of challan.items) {
      await applyStockMovement(
        tx,
        { productId: item.productId, quantity: item.quantity, movementType: "OUT", reason: "Sales Challan" },
        userId
      );
    }

    return tx.salesChallan.update({
      where: { id },
      data: { status: ChallanStatus.CONFIRMED },
      include: CHALLAN_INCLUDE,
    });
  });
}

export async function cancelChallan(id: string) {
  const challan = await getChallanOrThrow(id);
  if (challan.status === ChallanStatus.CANCELLED) {
    throw ApiError.badRequest("Challan is already cancelled");
  }
  if (challan.status === ChallanStatus.CONFIRMED) {
    throw ApiError.badRequest("A confirmed challan cannot be cancelled. Stock has already been deducted.");
  }

  return prisma.salesChallan.update({
    where: { id },
    data: { status: ChallanStatus.CANCELLED },
    include: CHALLAN_INCLUDE,
  });
}