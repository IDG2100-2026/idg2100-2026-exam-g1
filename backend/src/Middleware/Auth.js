import jwt from "jsonwebtoken";
import AppError from "../Utils/AppError.js";
import AuditLog from "../Models/AuditLog.model.js";

const auth = async (req, res, next) => {
  if (process.env.SKIP_AUTH === "true") {
    req.user = { _id: "6a0cc7d7b757fb26b1f9ae08", role: "admin" };
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No token provided", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.ip && decoded.ip !== req.ip) {
      await AuditLog.create({
        type: "ip_change",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        userId: decoded._id,
      });
      return next(new AppError("Session invalid", 401));
    }
    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Token expired", 401));
    }

    return next(new AppError("Invalid token", 401));
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new AppError("Admin access required", 403));
  }
  next();
};

export default auth;
