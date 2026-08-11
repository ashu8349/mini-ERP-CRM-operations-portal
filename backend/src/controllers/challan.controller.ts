import type { Request, Response } from "express";
import * as challanService from "../services/challan.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const index = asyncHandler(async (req: Request, res: Response) => {
  const { challans, pagination } = await challanService.listChallans(req.query as never);
  sendSuccess(res, 200, "Challans retrieved", challans, pagination);
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.getChallan(req.params.id);
  sendSuccess(res, 200, "Challan retrieved", challan);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.createChallan(req.body, req.user!.userId);
  sendSuccess(res, 201, "Challan saved", challan);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.updateChallan(req.params.id, req.body);
  sendSuccess(res, 200, "Challan updated successfully", challan);
});

export const confirm = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.confirmChallan(req.params.id, req.user!.userId);
  sendSuccess(res, 200, "Challan confirmed. Stock has been deducted.", challan);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.cancelChallan(req.params.id);
  sendSuccess(res, 200, "Challan cancelled", challan);
});