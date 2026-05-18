import { Router } from "express";
import * as matchController from "../Controllers/Match.controller.js";
import auth from "../Middleware/Auth.js";

const router = Router();

router.get("/", matchController.getAllMatches); //Get all matches
router.get("/:id", matchController.getMatch); //Get one match
router.post("/", auth, matchController.createMatch); //Create match
router.post("/:id/join", auth, matchController.joinMatch); //Join match
router.delete("/:id", auth, matchController.deleteMatch); //Delete match

export default router;
