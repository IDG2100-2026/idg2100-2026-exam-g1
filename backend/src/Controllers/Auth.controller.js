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

//-----------------REGISTRATION RULES----------------
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

//------------------REGISTER-----------------------
export const register = async (req, res, next) => {
  //Get required fields
  const { username, email, password } = req.body;

  //Check if a user with this email or username already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError("Email already in use", 400));
    }
    if (existingUser.username === username) {
      return next(new AppError("Username already taken", 400));
    }
  }

  //Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  //Generate email verification code
  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date(Date.now() + 3600000);

  //Create user
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    verificationCode,
    verificationCodeExpiry,
  });

  //Send verification mail
  await transporter.sendMail({
    from: "noreply@spanishdicepoker.com",
    to: email,
    subject: "Verify your email",
    html: `
    <h2>Welcome to Spanish Dice Poker</h2>
    <p>Your verification code is: <strong>${verificationCode}</strong></p>
    <p>This code expires in <strong>1 hour</strong></p>
    <p>Or click here: <a href="${process.env.CLIENT_URL}/verify/${verificationCode}">Verify email</a></p>`,
  });

  res.status(201).json({
    message:
      "User created successfully. Please check your email to verify your account",
  });
};

//------------------VERIFY EMAIL--------------------
export const verifyEmail = async (req, res, next) => {
  //Reads verification code from url
  const { code } = req.params;

  //Find matching user
  const user = await User.findOne({
    verificationCode: code,
    verificationCodeExpiry: { $gt: new Date() },
  }).select("+verificationCode +verificationCodeExpiry");

  if (!user) return next(new AppError("Invalid or expired code", 400));

  //Mark as verified and clear code
  user.verifiedEmail = true;
  user.verificationCode = undefined;
  user.verificationCodeExpiry = undefined;
  await user.save();
  res.status(200).json({ message: "Email verified. You can now login" });
};

//-----------------RESEND VERIFICATION------------------
export const resendVerification = async (req, res, next) => {
  const { email } = req.body;
  //Find user by email
  const user = await User.findOne({ email });
  if (!user) return next(new AppError("No account with that email", 404));

  //If verified no need to resend
  if (user.verifiedEmail) {
    return next(new AppError("Email already verified", 400));
  }

  //Generate new code
  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date(Date.now() + 3600000);

  user.verificationCode = verificationCode;
  user.verificationCodeExpiry = verificationCodeExpiry;
  await user.save();

  //Send mail
  await transporter.sendMail({
    from: "noreply@spanishdicepoker.com",
    to: email,
    subject: "Verify your email",
    html: `
    <h2>Welcome to Spanish Dice Poker</h2>
    <p>Your new verification code is: <strong>${verificationCode}</strong></p>
    <p>This code expires in <strong>1 hour</strong></p>
    <p>Or click here: <a href="${process.env.CLIENT_URL}/verify/${verificationCode}">Verify email</a></p>`,
  });

  res.status(200).json({ message: "Verification email sent" });
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

  //Ban check
  if (user.isBanned) {
    return next(new AppError("Your account has been banned", 403));
  }

  //Compare password
  const matchingPassword = await bcrypt.compare(password, user.password);

  //If password wrong
  if (!matchingPassword) {
    return next(new AppError("Invalid email or password", 401));
  }

  //Check if verified
  if (!user.verifiedEmail) {
    return next(
      new AppError("Please verify your email before logging in", 401),
    );
  }

  //Generate tokens
  const { accessToken, refreshToken } = generateTokens(
    user._id,
    user.role,
    req.ip,
  );

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
    const { accessToken } = generateTokens(user._id, user.role, req.ip);

    res.status(200).json({ accessToken });
  } catch (err) {
    return next(new AppError("Invalid refresh token, please login again", 401));
  }
};

//------------------FORGOT PASSWORD------------------
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(200)
      .json({ message: "If the email exists you will recieve a reset code" });
  }

  //Generate code
  const resetCode = generateVerificationCode();
  const resetExpiry = new Date(Date.now() + 3600000); //1 hour

  user.resetPasswordCode = resetCode;
  user.resetPasswordExpiry = resetExpiry;
  await user.save();

  //Send email
  await transporter.sendMail({
    from: "noreply@spanishdicepoker.com",
    to: email,
    subject: "Reset your password",
    html: `<h2>Spanish Dice Poker - Password Reset</h2>
    <p> Your reset code is: <strong>${resetCode}</strong></p>
    <p>This code expires in <strong>1 hour</strong></p>
    <p>Or click <a href="${process.env.CLIENT_URL}/reset-password/${resetCode}">here</a></p>`,
  });
  res
    .status(200)
    .json({ message: "If the email exists you will recieve a reset code" });
};

//------------------RESET PASSWORD------------------
export const resetPassword = async (req, res, next) => {
  const { code } = req.params;
  const { password } = req.body;

  //find user
  const user = await User.findOne({
    resetPasswordCode: code,
    resetPasswordExpiry: { $gt: new Date() },
  }).select("+resetPasswordCode +resetPasswordExpiry");

  if (!user) return next(new AppError("Invalid or expired reset code", 400));

  //Hash and save new password
  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordCode = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  res
    .status(200)
    .json({ message: "Password reset successfully. You can now login" });
};
