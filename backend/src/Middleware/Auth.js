import jwt from "jsonwebtoken";
import AppError from "../Utils/AppError.js";

const auth = (req, res, next) => {
  //Check for SKIP_AUTH in .env and attach fake user if true
  if (process.env.SKIP_AUTH === "true") {
    req.user = { _id: "507f1f77bcf86cd799439011", role: "admin" };
    return next();
  }

  //Get authorization header from request
  const authHeader = req.headers.authorization;

  //Reject request if no authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No token provided", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    //Verify token with secret
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    //Attach to request
    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Token expired", 401));
    }

    return next(new AppError("Invalid token", 401));
  }
};

//Admin only routes
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new AppError("Admin access required", 403));
  }
  next();
};

export default auth;
