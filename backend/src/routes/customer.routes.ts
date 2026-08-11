import { Router } from "express";
import * as customerController from "../controllers/customer.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/error";
import {
  createCustomerSchema,
  createFollowUpSchema,
  customerQuerySchema,
  idParamSchema,
  updateCustomerSchema,
} from "../validators/customer.validator";

const router = Router();

router.use(requireAuth);

// Sales + Admin can create and edit customers. Everyone else can only view.
router.get("/", validate(customerQuerySchema, "query"), customerController.index);
router.get("/:id", validate(idParamSchema, "params"), customerController.show);
router.post(
  "/",
  requireRole("ADMIN", "SALES"),
  validate(createCustomerSchema),
  customerController.create
);
router.put(
  "/:id",
  requireRole("ADMIN", "SALES"),
  validate(idParamSchema, "params"),
  validate(updateCustomerSchema),
  customerController.update
);
router.delete(
  "/:id",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  customerController.remove
);
router.get(
  "/:id/followups",
  validate(idParamSchema, "params"),
  customerController.followUps
);
router.post(
  "/:id/followups",
  requireRole("ADMIN", "SALES"),
  validate(idParamSchema, "params"),
  validate(createFollowUpSchema),
  customerController.addFollowUp
);

export default router;