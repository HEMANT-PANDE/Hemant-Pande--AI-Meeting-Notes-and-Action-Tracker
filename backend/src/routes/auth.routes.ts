import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { loginSchema, registerSchema } from "../validators/auth.validators";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", requireAuth, authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
