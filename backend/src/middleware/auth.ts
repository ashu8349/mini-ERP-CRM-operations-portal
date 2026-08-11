import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { verifyToken } from "../utils/token";
import { prisma } from "../prisma";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Authentication required. Please log in.");
    }

    const token = header.slice(7);
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid or expired token. Please log in again.");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      throw ApiError.unauthorized("User account no longer exists.");
    }

    if (!user.isActive) {
      throw ApiError.unauthorized("Your account has been deactivated. Please contact an administrator.");
    }

    req.user = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  }
);

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized("Authentication required.");
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Access denied. Required role(s): ${roles.join(", ")}.`
      );
    }
    next();
  };
}