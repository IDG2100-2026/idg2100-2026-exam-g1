import express from "express";
import cookieParser from "cookie-parser";
import AppError from "./src/Utils/AppError.js";
import authRoutes from "./src/Routes/Auth.routes.js";
import userRoutes from "./src/Routes/User.routes.js";
import matchRoutes from "./src/Routes/Match.routes.js";
import commentRoutes from "./src/Routes/Comment.routes.js";
import tournamentRoutes from "./src/Routes/Tournament.routes.js";
import adminRoutes from "./src/Routes/Admin.routes.js";
import { rateLimiter } from "./src/Middleware/RateLimiter.js";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(rateLimiter);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/matches", matchRoutes);
app.use("/comments", commentRoutes);
app.use("/tournaments", tournamentRoutes);
app.use("/admin", adminRoutes);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.url} on this server`, 404));
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (err.name === "CastError") {
    return res.status(400).json({ statusCode: 400, message: "Invalid ID" });
  }

  const message =
    process.env.NODE_ENV === "production" && err.statusCode === 500
      ? "Something went wrong"
      : err.message;

  res.status(err.statusCode).json({
    statusCode: err.statusCode,
    message,
  });
});

export default app;
