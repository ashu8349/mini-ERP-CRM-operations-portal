import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
  pagination?: { page: number; limit: number; total: number; totalPages: number }
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(pagination ? { pagination } : {}),
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors: unknown[] = []
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}