import type { Request, Response } from "express";
import * as customerService from "../services/customer.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const index = asyncHandler(async (req: Request, res: Response) => {
  const { customers, pagination } = await customerService.listCustomers(req.query as never);
  sendSuccess(res, 200, "Customers retrieved", customers, pagination);
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomer(req.params.id);
  sendSuccess(res, 200, "Customer retrieved", customer);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.createCustomer(req.body, req.user!.userId);
  sendSuccess(res, 201, "Customer created successfully", customer);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  sendSuccess(res, 200, "Customer updated successfully", customer);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await customerService.deleteCustomer(req.params.id);
  sendSuccess(res, 200, "Customer deleted successfully", null);
});

export const followUps = asyncHandler(async (req: Request, res: Response) => {
  const { followUps, pagination } = await customerService.getCustomerFollowUps(
    req.params.id,
    req.query as never
  );
  sendSuccess(res, 200, "Follow-ups retrieved", followUps, pagination);
});

export const addFollowUp = asyncHandler(async (req: Request, res: Response) => {
  const { note, followUpDate } = req.body as { note: string; followUpDate: Date };
  const followUp = await customerService.createFollowUp(
    req.params.id,
    note,
    followUpDate,
    req.user!.userId
  );
  sendSuccess(res, 201, "Follow-up added successfully", followUp);
});