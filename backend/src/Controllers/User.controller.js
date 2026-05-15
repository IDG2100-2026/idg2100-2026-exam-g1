import User from "../Models/User.model.js";
import AppError from "../Utils/AppError.js";

//Get all users
export const getAllUsers = async (req, res, next) => {
  const users = await User.find();

  res.status(200).json(users);
};
