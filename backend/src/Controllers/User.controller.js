import User from "../Models/User.model.js";
import AppError from "../Utils/AppError.js";
import { body } from "express-validator";
import bcrypt from "bcrypt";

//------------------UPDATE USER RULES-------------------
export const updateUserRules = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be 3-20 characters")
    .isAlphanumeric()
    .withMessage("Username can only contain letters and numbers"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Must be a valid email"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),
];

//---------------UPDATE PASSWORD RULES-------------------
export const updatePasswordRules = [
  body("oldPassword").notEmpty().withMessage("Old password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be atleast 6 characters")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter"),
];

//Get all users
//Should be limited to admins
export const getAllUsers = async (req, res, next) => {
  const users = await User.find();

  res.status(200).json(users);
};

//Get one user
export const getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json(user);
};

//Update user
export const updateUser = async (req, res, next) => {
  if (req.user._id.toString() !== req.params.id && req.user.role !== "admin") {
    return next(new AppError("Not allowed", 403));
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      username: req.body.username,
      email: req.body.email,
      bio: req.body.bio,
    },
    { new: true, runValidators: true },
  );
  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json(user);
};

//Update password
export const updatePassword = async (req, res, next) => {
  //Only owner can change password
  if (req.user._id.toString() !== req.params.id) {
    return next(new AppError("Not allowed", 403));
  }

  //Get user with password included
  const user = await User.findById(req.params.id).select("+password");
  if (!user) return next(new AppError("User not found", 404));

  //Verify old password
  const isCorrect = await bcrypt.compare(req.body.oldPassword, user.password);
  if (!isCorrect) return next(new AppError("Incorrect password", 401));

  //Hash and save new password
  user.password = await bcrypt.hash(req.body.newPassword, 10);
  await user.save();
  res.status(200).json({ message: "Password updated" });
};

//Update user profile picture
export const updateAvatar = async (req, res, next) => {
  if (req.user._id.toString() !== req.params.id && req.user.role !== "admin") {
    return next(new AppError("Not allowed", 403));
  }
  if (!req.file) return next(new AppError("No image uploaded", 400));

  const profilePicture = `/uploads/profiles/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { profilePicture },
    { new: true },
  );

  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json(user);
};

//Delete user
export const deleteUser = async (req, res, next) => {
  if (req.user._id.toString() !== req.params.id && req.user.role !== "admin") {
    return next(new AppError("Not allowed", 403));
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json({ message: "User deleted" });
};
