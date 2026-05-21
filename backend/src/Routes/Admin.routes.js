import { Router } from "express";
import * as adminController from "../Controllers/Admin.controller.js";
import auth, { requireAdmin } from "../Middleware/Auth.js";

const router = Router();
router.use(auth, requireAdmin);

//Dashboard
router.get("/dashboard", adminController.getDashboard);

//Admin actions
router.put("/users/:id/ban", adminController.banUser); //Ban user
router.put("/users/:id/unban", adminController.unbanUser); //Unban user
router.put("/users/:id/role", adminController.setRole); //Set user role
router.get("/comments", adminController.getRecentComments); //Get recent comments

export default router;
