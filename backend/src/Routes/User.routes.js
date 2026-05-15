import { Router } from "express";
import * as userController from "../Controllers/User.controller.js";
import auth from "../Middleware/Auth.js";

const router = Router();

router.get("/", auth, userController.getAllUsers);

export default router;
