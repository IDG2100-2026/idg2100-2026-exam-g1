import { Router } from "express";
import * as adminController from "../Controllers/Admin.controller.js";
import auth, { requireAdmin } from "../Middleware/Auth.js";

const router = Router();
router.use(auth, requireAdmin);

router.get("/dashboard", adminController.getDashboard);

router.put("/users/:id/ban", adminController.banUser);
router.put("/users/:id/unban", adminController.unbanUser);
router.put("/users/:id/role", adminController.setRole);
router.get("/comments", adminController.getRecentComments);

export default router;
