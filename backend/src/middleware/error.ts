import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { ApiError } from "../utils/ApiError";
import { sendError } from "../utils/ApiResponse";
import { isProduction } from "../config";

export function validate(schema: ZodType, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      throw ApiError.badRequest("Validation failed", issues);
    }
    req[source] = result.data;
    next();
  };
}

export function notFoundHandler(_req: Request, res: Response) {
  sendError(res, 404, "Route not found");
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return sendError(res, 400, "Validation failed", issues);
  }

  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.message, err.errors);
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  ) {
    const target = (err as { meta?: { target?: string[] } }).meta?.target?.join(", ");
    return sendError(res, 409, `Duplicate value detected for: ${target ?? "unique field"}`);
  }

  console.error("[UnhandledError]", err);
  return sendError(
    res,
    500,
    isProduction ? "Internal server error" : (err as Error)?.message ?? "Internal server error"
  );
}