import { Router } from "express";
import * as userController from "../Controllers/User.controller.js";
import auth, { requireAdmin } from "../Middleware/Auth.js";
import { uploadProfile } from "../Middleware/Upload.js";
import { validateRequest } from "../Middleware/Validate.js";

const router = Router();

router.get("/", auth, requireAdmin, userController.getAllUsers); //Get all users - admin only
router.get("/:id", userController.getUser); //Get one user
router.put(
  "/:id",
  auth,
  userController.updateUserRules,
  validateRequest,
  userController.updateUser,
); //Update user
//Update profile pic
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
router.delete("/:id", auth, userController.deleteUser); //Delete user

export default router;
