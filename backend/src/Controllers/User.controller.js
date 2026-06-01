import User from "../Models/User.model.js";
import AppError from "../Utils/AppError.js";
import { body } from "express-validator";
import bcrypt from "bcrypt";
import Match from "../Models/Match.model.js";

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

export const getAllUsers = async (req, res, next) => {
  const { search, role, isBanned } = req.query;
  const filter = {};

  if (search) filter.username = { $regex: search, $options: "i" };
  if (role) filter.role = role;
  if (isBanned) filter.isBanned = isBanned === "true";

  const users = await User.find(filter);
  res.status(200).json({ results: users });
};

export const getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json(user);
};

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

export const updatePassword = async (req, res, next) => {
  if (req.user._id.toString() !== req.params.id) {
    return next(new AppError("Not allowed", 403));
  }

  const user = await User.findById(req.params.id).select("+password");
  if (!user) return next(new AppError("User not found", 404));

  const isCorrect = await bcrypt.compare(req.body.oldPassword, user.password);
  if (!isCorrect) return next(new AppError("Incorrect password", 401));

  user.password = await bcrypt.hash(req.body.newPassword, 10);
  await user.save();
  res.status(200).json({ message: "Password updated" });
};

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

export const deleteUser = async (req, res, next) => {
  if (req.user._id.toString() !== req.params.id && req.user.role !== "admin") {
    return next(new AppError("Not allowed", 403));
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json({ message: "User deleted" });
};

export const getUserGames = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { "players.user": req.params.id };

  const total = await Match.countDocuments(filter);
  const results = {};

  if (skip + limit < total) {
    results.next = { page: page + 1, limit };
  }

  if (skip > 0) {
    results.previous = { page: page - 1, limit };
  }

  results.results = await Match.find(filter)
    .populate("players.user", "username elo profilePicture")
    .populate("owner", "username")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.status(200).json(results);
};
