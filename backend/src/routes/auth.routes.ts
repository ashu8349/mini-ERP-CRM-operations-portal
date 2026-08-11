import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/error";
import { loginSchema, changePasswordSchema } from "../validators/auth.validator";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/change-password", requireAuth, validate(changePasswordSchema), authController.changePassword);

export default router;