import { Router } from "express";
import * as matchController from "../Controllers/Match.controller.js";
import auth from "../Middleware/Auth.js";
import { validateRequest } from "../Middleware/Validate.js";

const router = Router();

router.get("/", matchController.getAllMatches); //Get all matches - public lobby
router.get("/activity", matchController.getPlatformActivity); //get platform activity last week
router.get("/:id", matchController.getMatch); //Get one match - public anyone can spectate
//Create match - auth reqired
router.post(
  "/",
  auth,
  matchController.createMatchRules,
  validateRequest,
  matchController.createMatch,
);
router.post("/:id/join", auth, matchController.joinMatch); //Join match - auth required
router.delete("/:id", auth, matchController.deleteMatch); //Delete match - auth required
router.post("/:id/leave", auth, matchController.leaveMatch); //Leave match - auth reqired

export default router;
