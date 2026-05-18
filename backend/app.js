import express from "express";
import cookieParser from "cookie-parser";
import AppError from "./src/Utils/AppError.js";
import authRoutes from "./src/Routes/Auth.routes.js";
import userRoutes from "./src/Routes/User.routes.js";
import matchRoutes from "./src/Routes/Match.routes.js";

const app = express();

app.use(cookieParser());
app.use(express.json());

//Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/matches", matchRoutes);

//Catch any route that don't exist
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.url} on this server`, 404));
});

//Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

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
