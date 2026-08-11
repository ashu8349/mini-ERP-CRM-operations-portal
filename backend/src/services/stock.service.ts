import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ApiError } from "../utils/ApiError";
import { paginationParams } from "../utils/helpers";

type StockMovementInput = {
  productId: string;
  quantity: number;
  movementType: "IN" | "OUT";
  reason: string;
};

type StockQuery = {
  page?: number;
  limit?: number;
  productId?: string;
  movementType?: string;
  search?: string;
};

export async function listStockMovements(query: StockQuery) {
  const { page, limit, skip } = paginationParams(query);

  const where: Prisma.StockMovementWhereInput = {};
  if (query.productId) where.productId = query.productId;
  if (query.movementType) where.movementType = query.movementType as "IN" | "OUT";
  if (query.search) {
    where.product = {
      OR: [
        { productName: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
      ],
    };
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        product: { select: { id: true, productName: true, sku: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { movements, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

/**
 * Adjust stock for a product. Runs INSIDE a transaction. Updates the product's
 * currentStock and creates a StockMovement record atomically.
 *
 * For OUT movements, throws 400 if the resulting stock would be negative.
 * Returns the created StockMovement record.
 */
export async function applyStockMovement(
  tx: Prisma.TransactionClient,
  input: StockMovementInput,
  createdById: string
) {
  const product = await tx.product.findUnique({ where: { id: input.productId } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  if (input.movementType === "OUT" && input.quantity > product.currentStock) {
    throw ApiError.badRequest(
      `Insufficient stock for product ${product.sku} (SKU). Available: ${product.currentStock}, requested: ${input.quantity}`
    );
  }

  const newStock =
    input.movementType === "IN" ? product.currentStock + input.quantity : product.currentStock - input.quantity;

  await tx.product.update({
    where: { id: input.productId },
    data: { currentStock: newStock },
  });
  return tx.stockMovement.create({
    data: {
      productId: input.productId,
      quantity: input.quantity,
      movementType: input.movementType,
      reason: input.reason,
      createdById,
    },
  });
}

/**
 * Manual stock adjustment endpoint - creates stock movement + updates product
 * in a single transaction.
 */
export async function createStockMovement(input: StockMovementInput, createdById: string) {
  let movement: Awaited<ReturnType<typeof prisma.stockMovement.create>> | null = null;
  await prisma.$transaction(async (tx) => {
    movement = await applyStockMovement(tx, input, createdById);
  });
  return movement;
}

export async function productStockHistory(productId: string, query: { page?: number; limit?: number }) {
  const { page, limit, skip } = paginationParams(query);
  const where = { productId };
  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    prisma.stockMovement.count({ where }),
  ]);
  return { movements, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}