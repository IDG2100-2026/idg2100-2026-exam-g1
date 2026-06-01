import { Router } from "express";
import * as matchController from "../Controllers/Match.controller.js";
import auth from "../Middleware/Auth.js";
import { validateRequest } from "../Middleware/Validate.js";

const router = Router();

router.get("/", matchController.getAllMatches);
router.get("/activity", matchController.getPlatformActivity);
router.get("/:id", matchController.getMatch);
router.post(
  "/",
  auth,
  matchController.createMatchRules,
  validateRequest,
  matchController.createMatch,
);
router.post("/:id/join", auth, matchController.joinMatch);
router.delete("/:id", auth, matchController.deleteMatch);
router.post("/:id/leave", auth, matchController.leaveMatch);

export default router;
