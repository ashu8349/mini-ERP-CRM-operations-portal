import type { Request, Response } from "express";
import * as stockService from "../services/stock.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const index = asyncHandler(async (req: Request, res: Response) => {
  const { movements, pagination } = await stockService.listStockMovements(req.query as never);
  sendSuccess(res, 200, "Stock movements retrieved", movements, pagination);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { productId: bodyProductId, quantity, movementType, reason } = req.body as {
    productId?: string;
    quantity: number;
    movementType: "IN" | "OUT";
    reason: string;
  };
  const productId = bodyProductId ?? req.params.id;
  const movement = await stockService.createStockMovement(
    { productId, quantity, movementType, reason },
    req.user!.userId
  );
  sendSuccess(res, 201, "Stock movement recorded successfully", movement);
});

export const productHistory = asyncHandler(async (req: Request, res: Response) => {
  const { movements, pagination } = await stockService.productStockHistory(
    req.params.id,
    req.query as never
  );
  sendSuccess(res, 200, "Stock movement history retrieved", movements, pagination);
});