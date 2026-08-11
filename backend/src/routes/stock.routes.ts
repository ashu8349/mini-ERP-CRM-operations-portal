import { Router } from "express";
import * as stockController from "../controllers/stock.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/error";
import { stockMovementSchema, stockQuerySchema } from "../validators/product.validator";

const router = Router();

router.use(requireAuth);

router.get("/", validate(stockQuerySchema, "query"), stockController.index);
router.post(
  "/",
  requireRole("ADMIN", "WAREHOUSE"),
  validate(stockMovementSchema),
  stockController.create
);

export default router;