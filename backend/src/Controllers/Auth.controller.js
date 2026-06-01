import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../Models/User.model.js";
import AppError from "../Utils/AppError.js";
import { body } from "express-validator";
import generateTokens, {
  generateVerificationCode,
} from "../Utils/GenerateToken.js";
import { TOKEN_EXPIRY } from "../Config/Constants.js";
import transporter from "../Config/Email.js";

export const registerRules = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9æøåÆØÅ]+$/)
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
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
];

export const register = async (req, res, next) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError("Email already in use", 400));
    }
    if (existingUser.username === username) {
      return next(new AppError("Username already taken", 400));
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date(Date.now() + 3600000);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    verificationCode,
    verificationCodeExpiry,
  });

  await transporter.sendMail({
    from: "noreply@spanishdicepoker.com",
    to: email,
    subject: "Verify your email",
    html: `
    <h2>Welcome to Spanish Dice Poker</h2>
    <p>Click <a href="${process.env.CLIENT_URL}/verify/${verificationCode}">here</a> to verify email</p>
    <p>This code expires in <strong>1 hour</strong></p>`,
  });

  res.status(201).json({
    message:
      "User created successfully. Please check your email to verify your account",
  });
};

export const verifyEmail = async (req, res, next) => {
  const { code } = req.params;

  const user = await User.findOne({
    verificationCode: code,
    verificationCodeExpiry: { $gt: new Date() },
  }).select("+verificationCode +verificationCodeExpiry");

  if (!user) return next(new AppError("Invalid or expired code", 400));

  user.verifiedEmail = true;
  user.verificationCode = undefined;
  user.verificationCodeExpiry = undefined;
  await user.save();
  res.status(200).json({ message: "Email verified. You can now login" });
};

export const resendVerification = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new AppError("No account with that email", 404));

  if (user.verifiedEmail) {
    return next(new AppError("Email already verified", 400));
  }

  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date(Date.now() + 3600000);

  user.verificationCode = verificationCode;
  user.verificationCodeExpiry = verificationCodeExpiry;
  await user.save();

  await transporter.sendMail({
    from: "noreply@spanishdicepoker.com",
    to: email,
    subject: "Verify your email",
    html: `
    <h2>Welcome to Spanish Dice Poker</h2>
    <p>Click <a href="${process.env.CLIENT_URL}/verify/${verificationCode}">here</a> to verify your email</p>
    <p>This code expires in <strong>1 hour</strong></p>`,
  });

  res.status(200).json({ message: "Verification email sent" });
};

export const loginRules = [
  body("login").trim().notEmpty().withMessage("Email or username is required"),
  body("password").notEmpty().withMessage("password is required"),
];

export const login = async (req, res, next) => {
  const { login, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: login }, { username: login }],
  }).select("+password");

  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  if (user.isBanned) {
    return next(new AppError("Your account has been banned", 403));
  }

  const matchingPassword = await bcrypt.compare(password, user.password);

  if (!matchingPassword) {
    return next(new AppError("Invalid email or password", 401));
  }

  if (!user.verifiedEmail) {
    return next(
      new AppError("Please verify your email before logging in", 401),
    );
  }

  const { accessToken, refreshToken } = generateTokens(
    user._id,
    user.role,
    req.ip,
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    maxAge: TOKEN_EXPIRY.REFRESH_MS,
  });

  res.status(200).json({
    accessToken,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      bio: user.bio,
      elo: user.elo,
      points: user.points,
      totalGames: user.totalGames,
      wins: user.wins,
      losses: user.losses,
      verifiedEmail: user.verifiedEmail,
      isBanned: user.isBanned,
    },
  });
};


export const logout = (req, res, next) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
};

export const refresh = async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return next(new AppError("No refresh token", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded._id);
    if (!user) return next(new AppError("User not found", 401));

    const { accessToken } = generateTokens(user._id, user.role, req.ip);

    res.status(200).json({ accessToken });
  } catch (err) {
    return next(new AppError("Invalid refresh token, please login again", 401));
  }
};

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(200)
      .json({ message: "If the email exists you will recieve a reset code" });
  }

  const resetCode = generateVerificationCode();
  const resetExpiry = new Date(Date.now() + 3600000);

  user.resetPasswordCode = resetCode;
  user.resetPasswordExpiry = resetExpiry;
  await user.save();

  await transporter.sendMail({
    from: "noreply@spanishdicepoker.com",
    to: email,
    subject: "Reset your password",
    html: `<h2>Spanish Dice Poker - Password Reset</h2>
    <p>Click <a href="${process.env.CLIENT_URL}/reset-password/${resetCode}">here</a> to reset your password</p>
    <p>This code expires in <strong>1 hour</strong></p>`,
  });
  res
    .status(200)
    .json({ message: "If the email exists you will recieve a reset code" });
};

export const resetPassword = async (req, res, next) => {
  const { code } = req.params;
  const { password } = req.body;

  //find user
  const user = await User.findOne({
    resetPasswordCode: code,
    resetPasswordExpiry: { $gt: new Date() },
  }).select("+resetPasswordCode +resetPasswordExpiry");

  if (!user) return next(new AppError("Invalid or expired reset code", 400));

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordCode = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  res
    .status(200)
    .json({ message: "Password reset successfully. You can now login" });
};
