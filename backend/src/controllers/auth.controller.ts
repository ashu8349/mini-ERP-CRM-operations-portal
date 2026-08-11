import type { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await authService.login(email, password);
  sendSuccess(res, 200, "Login successful", result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  sendSuccess(res, 200, "User profile retrieved", user);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };
  await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  sendSuccess(res, 200, "Password changed successfully", null);
});