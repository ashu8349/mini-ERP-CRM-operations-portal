import { Router } from "express";
import { z } from "zod";
import * as productController from "../controllers/product.controller";
import * as stockController from "../controllers/stock.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/error";
import {
  createProductSchema,
  idParamSchema as productIdSchema,
  productQuerySchema,
  stockMovementSchema,
  updateProductSchema,
} from "../validators/product.validator";

const router = Router();

router.use(requireAuth);

// Anyone authenticated can view products and stock.
router.get("/", validate(productQuerySchema, "query"), productController.index);
router.get("/categories", productController.categories);
router.get("/:id", validate(productIdSchema, "params"), productController.show);
router.get(
  "/:id/stock-movements",
  validate(productIdSchema, "params"),
  stockController.productHistory
);

// Only Admin manages product masters.
router.post("/", requireRole("ADMIN"), validate(createProductSchema), productController.create);
router.put(
  "/:id",
  requireRole("ADMIN"),
  validate(productIdSchema, "params"),
  validate(updateProductSchema),
  productController.update
);

// Warehouse + Admin can record stock movements for a specific product (IN/OUT adjustments).
const productScopedMovementSchema = stockMovementSchema.omit({ productId: true }).extend({
  productId: z.string().optional(),
});
router.post(
  "/:id/stock-movements",
  requireRole("ADMIN", "WAREHOUSE"),
  validate(productIdSchema, "params"),
  validate(productScopedMovementSchema),
  stockController.create
);

export default router;