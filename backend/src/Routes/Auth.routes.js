import { Router } from "express";
import * as authController from "../Controllers/Auth.controller.js";
import { validateRequest } from "../Middleware/Validate.js";

const router = Router();

router.post(
  "/register",
  authController.registerRules,
  validateRequest,
  authController.register,
);
router.post(
  "/login",
  authController.loginRules,
  validateRequest,
  authController.login,
);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.get("/verify/:code", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:code", authController.resetPassword);

export default router;
