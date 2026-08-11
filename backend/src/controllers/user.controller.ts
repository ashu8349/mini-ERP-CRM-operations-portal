import type { Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import * as userService from "../services/user.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const index = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.listUsers();
  sendSuccess(res, 200, "Users retrieved", users);
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserStats(req.params.id);
  sendSuccess(res, 200, "User retrieved", user);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body as { role: UserRole };
  const user = await userService.updateUserRole(req.params.id, role, req.user!.userId);
  sendSuccess(res, 200, "User role updated", user);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };
  const user = await userService.updateUserStatus(req.params.id, isActive, req.user!.userId);
  sendSuccess(res, 200, isActive ? "User activated" : "User deactivated", user);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { newPassword } = req.body as { newPassword: string };
  const user = await userService.resetUserPassword(req.params.id, newPassword, req.user!.userId);
  sendSuccess(res, 200, "Password reset successfully", user);
});