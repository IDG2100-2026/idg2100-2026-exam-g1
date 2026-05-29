import { Router } from "express";
import * as tournamentController from "../Controllers/Tournament.controller.js";
import auth, { requireAdmin } from "../Middleware/Auth.js";
import { uploadTrophy } from "../Middleware/Upload.js";
import { validateRequest } from "../Middleware/Validate.js";

const router = Router();

//public
router.get("/", tournamentController.getAllTournaments); //Get all tournaments
router.get("/:id", tournamentController.getTournament); //Get single tournament

//Auth required
router.post("/:id/join", auth, tournamentController.joinTournament); //Join tournament
router.post("/:id/leave", auth, tournamentController.leaveTournament); //Leave tournament

//Admin only
//Create tournament
router.post(
  "/",
  auth,
  requireAdmin,
  uploadTrophy.single("trophyImage"),
  tournamentController.createTournamentRules,
  validateRequest,
  tournamentController.createTournament,
);

//Start tournament
router.post(
  "/:id/start",
  auth,
  requireAdmin,
  tournamentController.startTournament,
);

//Update tournament
router.put(
  "/:id",
  auth,
  requireAdmin,
  tournamentController.createTournamentRules,
  validateRequest,
  tournamentController.updateTournament,
);
//Update trophy
router.put(
  "/:id/trophy",
  auth,
  requireAdmin,
  uploadTrophy.single("trophyImage"),
  tournamentController.updateTrophy,
);
//Cancel tournament
router.put(
  "/:id/cancel",
  auth,
  requireAdmin,
  tournamentController.cancelTournament,
);
//Delete tournament
router.delete(
  "/:id",
  auth,
  requireAdmin,
  tournamentController.deleteTournament,
);

export default router;
