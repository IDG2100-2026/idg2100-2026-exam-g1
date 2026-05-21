import { Router } from "express";
import * as adminController from "../Controllers/Admin.controller.js";
import auth, { requireAdmin } from "../Middleware/Auth.js";

const router = Router();
router.use(auth, requireAdmin);

router.get("/dashboard", adminController.getDashboard);

export default router;
