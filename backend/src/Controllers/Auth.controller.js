import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../Models/User.model.js";
import AppError from "../Utils/AppError.js";
import { body } from "express-validator";
import generateTokens from "../Utils/GenerateToken.js";
import { TOKEN_EXPIRY } from "../Config/Constants.js";

//-----------------REGISTRATION RULES----------------
export const registerRules = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .isAlphanumeric()
    .withMessage("Username can only contain letters and numbers"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter"),
];

//------------------REGISTER-----------------------
export const register = async (req, res, next) => {
  //Get required fields
  const { username, email, password } = req.body;

  //Check if a user with this email already exists
  const existingUser = await User.findOne({ email });
  //Pass error if they do
  if (existingUser) {
    return next(new AppError("Email already in use", 400));
  }

  //Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  //Create user
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  res.status(201).json({ message: "User created successfully" });
};

//-------------------LOGIN RULES-----------------------
export const loginRules = [
  body("login").trim().notEmpty().withMessage("Email or username is required"),
  body("password").notEmpty().withMessage("password is required"),
];
//-------------------LOGIN--------------------------
export const login = async (req, res, next) => {
  //Get email and password
  const { login, password } = req.body;

  //Find user by email or username
  const user = await User.findOne({
    $or: [{ email: login }, { username: login }],
  }).select("+password");

  //If user not found
  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  //Compare password
  const matchingPassword = await bcrypt.compare(password, user.password);

  //If password wrong
  if (!matchingPassword) {
    return next(new AppError("Invalid email or password", 401));
  }

  //Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  //Send refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    maxAge: TOKEN_EXPIRY.REFRESH_MS,
  });

  res.status(200).json({ accessToken });
};

//------------------LOGOUT--------------------

export const logout = (req, res, next) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
};

//----------------REFRESH TOKEN------------------
export const refresh = async (req, res, next) => {
  //Get refresh token from cookie
  const token = req.cookies.refreshToken;

  //If no cookie
  if (!token) {
    return next(new AppError("No refresh token", 401));
  }

  try {
    //Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    //Look up user to get role
    const user = await User.findById(decoded._id);
    if (!user) return next(new AppError("User not found", 401));

    //Generate new acess token
    const { accessToken } = generateTokens(user._id, user.role);

    res.status(200).json({ accessToken });
  } catch (err) {
    return next(new AppError("Invalid refresh token, please login again", 401));
  }
};
