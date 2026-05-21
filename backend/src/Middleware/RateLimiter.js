import rateLimit from "express-rate-limit";
import AuditLog from "../Models/AuditLog.model.js";

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, //1 minute
  max: 100, //Max 100 request
  handler: async (req, res) => {
    await AuditLog.create({
      type: "rate_limit",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(429).json({
      statusCode: 429,
      message: "Too many request, slow down",
    });
  },
});
