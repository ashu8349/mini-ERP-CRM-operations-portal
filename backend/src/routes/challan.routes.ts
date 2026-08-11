import { Router } from "express";
import * as challanController from "../controllers/challan.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/error";
import {
  challanQuerySchema,
  createChallanSchema,
  idParamSchema,
  updateChallanSchema,
} from "../validators/challan.validator";

const router = Router();

router.use(requireAuth);

// Everyone can view challans (role-appropriate view filtering is done at UI level).
router.get("/", validate(challanQuerySchema, "query"), challanController.index);
router.get("/:id", validate(idParamSchema, "params"), challanController.show);

// Sales + Admin manage challans.
router.post(
  "/",
  requireRole("SALES", "ADMIN"),
  validate(createChallanSchema),
  challanController.create
);
router.put(
  "/:id",
  requireRole("SALES", "ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateChallanSchema),
  challanController.update
);
router.post(
  "/:id/confirm",
  requireRole("SALES", "ADMIN"),
  validate(idParamSchema, "params"),
  challanController.confirm
);
router.post(
  "/:id/cancel",
  requireRole("SALES", "ADMIN"),
  validate(idParamSchema, "params"),
  challanController.cancel
);

export default router;