import { Router } from "express";
import * as userController from "../Controllers/User.controller.js";
import auth, { requireAdmin } from "../Middleware/Auth.js";
import { uploadProfile } from "../Middleware/Upload.js";
import { validateRequest } from "../Middleware/Validate.js";

const router = Router();

router.get("/", auth, requireAdmin, userController.getAllUsers); 
router.get("/:id", userController.getUser); 
router.put(
  "/:id",
  auth,
  userController.updateUserRules,
  validateRequest,
  userController.updateUser,
);
router.put(
  "/:id/profilepic",
  auth,
  uploadProfile.single("profilePicture"),
  userController.updateAvatar,
);
router.put(
  "/:id/password",
  auth,
  userController.updatePasswordRules,
  validateRequest,
  userController.updatePassword,
);
router.delete("/:id", auth, userController.deleteUser);
router.get("/:id/games", userController.getUserGames);

export default router;
