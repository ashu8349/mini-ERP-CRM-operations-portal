import type { Request, Response } from "express";
import * as productService from "../services/product.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const index = asyncHandler(async (req: Request, res: Response) => {
  const { products, pagination } = await productService.listProducts(req.query as never);
  sendSuccess(res, 200, "Products retrieved", products, pagination);
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProduct(req.params.id);
  sendSuccess(res, 200, "Product retrieved", product);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body, req.user!.userId);
  sendSuccess(res, 201, "Product created successfully", product);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  sendSuccess(res, 200, "Product updated successfully", product);
});

export const categories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await productService.listCategories();
  sendSuccess(res, 200, "Categories retrieved", categories);
});