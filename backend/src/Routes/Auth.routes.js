import { Router } from "express";
import * as authController from "../Controllers/Auth.controller.js";
import { validateRequest } from "../Middleware/Validate.js";

const router = Router();

//Create user
router.post(
  "/register",
  authController.registerRules,
  validateRequest,
  authController.register,
);
//Login
router.post("/login", authController.login);
//Logout
router.post("/logout", authController.logout);
//Refresh token
router.post("/refresh", authController.refresh);
//verify email
router.get("/verify/:code", authController.verifyEmail);
//Resend verification email
router.post("/resend-verification", authController.resendVerification);
//Forgot password
router.post("/forgot-password", authController.forgotPassword);
//Reset password
router.post("/reset-password/:code", authController.resetPassword);

export default router;
