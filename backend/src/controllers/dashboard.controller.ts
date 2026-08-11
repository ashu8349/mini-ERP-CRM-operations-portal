import type { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await dashboardService.getDashboardStats();
  sendSuccess(res, 200, "Dashboard stats retrieved", stats);
});