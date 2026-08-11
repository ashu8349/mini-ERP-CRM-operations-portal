import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ApiError } from "../utils/ApiError";
import { paginationParams } from "../utils/helpers";

type ProductInput = {
  productName: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock?: number;
  minimumStock?: number;
  warehouseLocation?: string;
};

type ProductQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: string;
  sortBy?: string;
  sortOrder?: string;
};

function normalize(input: ProductInput): ProductInput {
  return {
    ...input,
    sku: input.sku.trim().toUpperCase(),
    warehouseLocation: input.warehouseLocation?.trim() ? input.warehouseLocation : undefined,
    currentStock: input.currentStock ?? 0,
    minimumStock: input.minimumStock ?? 0,
  };
}

export async function listProducts(query: ProductQuery) {
  const { page, limit, skip } = paginationParams(query);

  const where: Prisma.ProductWhereInput = {
    ...(query.search
      ? {
          OR: [
            { productName: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
            { category: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.lowStock === "true" ? { currentStock: { lte: prisma.product.fields.minimumStock } } : {}),
  };

  const sortCol = ["productName", "currentStock", "unitPrice", "createdAt"].includes(query.sortBy ?? "")
    ? (query.sortBy as string)
    : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sortCol]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { createdBy: { select: { id: true, name: true } } },
      },
    },
  });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }
  return product;
}

export async function getProductOrThrow(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }
  return product;
}

export async function createProduct(input: ProductInput, createdById: string) {
  const cleaned = normalize(input);
  const initialStock = cleaned.currentStock ?? 0;
  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data: cleaned });
      // Initial stock is a stock change too - always record a movement so the
      // stock movement history is complete.
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          quantity: initialStock,
          movementType: "IN",
          reason: "Initial Stock",
          createdById,
        },
      });
      return product;
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw ApiError.conflict(`SKU "${cleaned.sku}" already exists`);
    }
    throw err;
  }
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  await getProductOrThrow(id);
  const cleaned = normalize({
    productName: input.productName ?? "",
    sku: input.sku ?? "",
    category: input.category ?? "",
    unitPrice: input.unitPrice ?? 0,
    currentStock: input.currentStock,
    minimumStock: input.minimumStock,
    warehouseLocation: input.warehouseLocation,
  });
  const data: Prisma.ProductUpdateInput = {};
  if (input.productName !== undefined) data.productName = cleaned.productName;
  if (input.sku !== undefined) data.sku = cleaned.sku;
  if (input.category !== undefined) data.category = cleaned.category;
  if (input.unitPrice !== undefined) data.unitPrice = cleaned.unitPrice;
  if (input.currentStock !== undefined) data.currentStock = cleaned.currentStock;
  if (input.minimumStock !== undefined) data.minimumStock = cleaned.minimumStock;
  if (input.warehouseLocation !== undefined) data.warehouseLocation = cleaned.warehouseLocation;

  try {
    return await prisma.product.update({ where: { id }, data });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw ApiError.conflict(`SKU "${cleaned.sku}" already exists`);
    }
    throw err;
  }
}

export async function listCategories() {
  const rows = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}

export function isLowStock(product: { currentStock: number; minimumStock: number }): boolean {
  return product.currentStock <= product.minimumStock;
}