import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ApiError } from "../utils/ApiError";
import { paginationParams } from "../utils/helpers";

type CustomerInput = {
  customerName: string;
  mobileNumber: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  customerType: "Retail" | "Wholesale" | "Distributor";
  address?: string;
  status: "Lead" | "Active" | "Inactive";
  followUpDate?: Date | null;
  notes?: string;
};

type CustomerQuery = {
  page?: number;
  limit?: number;
  search?: string;
  customerType?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
};

function normalize(input: CustomerInput): CustomerInput {
  return {
    ...input,
    email: input.email?.trim() ? input.email : undefined,
    gstNumber: input.gstNumber?.trim() ? input.gstNumber : undefined,
    address: input.address?.trim() ? input.address : undefined,
    notes: input.notes?.trim() ? input.notes : undefined,
    followUpDate: input.followUpDate ?? null,
  };
}

export async function listCustomers(query: CustomerQuery) {
  const { page, limit, skip } = paginationParams(query);

  const where: Prisma.CustomerWhereInput = {
    ...(query.search
      ? {
          OR: [
            { customerName: { contains: query.search, mode: "insensitive" } },
            { businessName: { contains: query.search, mode: "insensitive" } },
            { mobileNumber: { contains: query.search } },
            { email: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.customerType ? { customerType: query.customerType as never } : {}),
    ...(query.status ? { status: query.status as never } : {}),
  };

  const sortCol = ["customerName", "followUpDate", "createdAt"].includes(query.sortBy ?? "")
    ? (query.sortBy as string)
    : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: {
        ...(sortCol === "followUpDate" ? { followUpDate: { sort: sortOrder, nulls: "last" } } : { [sortCol]: sortOrder }),
      },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      followUps: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { id: true, name: true } } },
      },
      challans: {
        orderBy: { createdAt: "desc" },
        include: { items: true, createdBy: { select: { id: true, name: true } } },
      },
    },
  });
  if (!customer) {
    throw ApiError.notFound("Customer not found");
  }
  return customer;
}

export async function createCustomer(input: CustomerInput, createdById: string) {
  const data = normalize(input);
  return prisma.customer.create({
    data: { ...data, createdById },
  });
}

export async function updateCustomer(id: string, input: Partial<CustomerInput>) {
  await getCustomerOrThrow(id);
  const data = normalize(input as CustomerInput);
  return prisma.customer.update({ where: { id }, data });
}

export async function deleteCustomer(id: string) {
  await getCustomerOrThrow(id);
  await prisma.customer.delete({ where: { id } });
}

export async function getCustomerOrThrow(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    throw ApiError.notFound("Customer not found");
  }
  return customer;
}

export async function getCustomerFollowUps(customerId: string, query: { page?: number; limit?: number }) {
  await getCustomerOrThrow(customerId);
  const { page, limit, skip } = paginationParams(query);
  const where = { customerId };
  const [followUps, total] = await Promise.all([
    prisma.customerFollowUp.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    prisma.customerFollowUp.count({ where }),
  ]);
  return { followUps, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createFollowUp(customerId: string, note: string, followUpDate: Date, createdById: string) {
  await getCustomerOrThrow(customerId);
  const followUp = await prisma.customerFollowUp.create({
    data: { customerId, note, followUpDate, createdById },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  await prisma.customer.update({
    where: { id: customerId },
    data: { followUpDate },
  });
  return followUp;
}