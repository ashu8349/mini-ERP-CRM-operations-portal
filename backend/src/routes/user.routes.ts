import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/error";
import { idParamSchema } from "../validators/challan.validator";
import {
  updateUserRoleSchema,
  updateUserStatusSchema,
  resetUserPasswordSchema,
} from "../validators/user.validator";

const router = Router();

router.use(requireAuth);

router.get("/", requireRole("ADMIN"), userController.index);
router.get("/:id", requireRole("ADMIN"), validate(idParamSchema, "params"), userController.show);
router.patch(
  "/:id/role",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateUserRoleSchema),
  userController.updateRole
);
router.patch(
  "/:id/status",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateUserStatusSchema),
  userController.updateStatus
);
router.post(
  "/:id/reset-password",
  requireRole("ADMIN"),
  validate(idParamSchema, "params"),
  validate(resetUserPasswordSchema),
  userController.resetPassword
);

export default router;