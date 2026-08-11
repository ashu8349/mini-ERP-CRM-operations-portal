import type { UserRole } from "@prisma/client";
import { prisma } from "../prisma";
import { ApiError } from "../utils/ApiError";
import { hashPassword } from "./auth.service";

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { customers: true, challans: true, stockMovements: true } },
    },
  });
  return users;
}

export async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { customers: true, challans: true, stockMovements: true, followUps: true } },
    },
  });
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user;
}

export async function updateUserRole(userId: string, role: UserRole, actorId: string) {
  if (userId === actorId) {
    throw ApiError.badRequest("You cannot change your own role");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
}

export async function updateUserStatus(userId: string, isActive: boolean, actorId: string) {
  if (userId === actorId) {
    throw ApiError.badRequest("You cannot deactivate your own account");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
}

export async function resetUserPassword(userId: string, newPassword: string, actorId: string) {
  if (userId === actorId) {
    throw ApiError.badRequest("You cannot reset your own password here. Use Change Password instead.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const passwordHash = await hashPassword(newPassword);
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
}