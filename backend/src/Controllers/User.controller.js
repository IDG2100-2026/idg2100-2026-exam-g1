import User from "../Models/User.model.js";
import AppError from "../Utils/AppError.js";

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

//Update user (should be limited to admin or owner)
//Role and password should be updated elsewhere
export const updateUser = async (req, res, next) => {
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

//Delete user (Should be limited to admin or owner)
export const deleteUser = async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json({ message: "User deleted" });
};
