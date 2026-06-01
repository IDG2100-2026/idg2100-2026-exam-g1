import { Router } from "express";
import * as tournamentController from "../Controllers/Tournament.controller.js";
import auth, { requireAdmin } from "../Middleware/Auth.js";
import { uploadTrophy } from "../Middleware/Upload.js";
import { validateRequest } from "../Middleware/Validate.js";

const router = Router();

router.get("/", tournamentController.getAllTournaments); 
router.get("/:id", tournamentController.getTournament); 

router.post("/:id/join", auth, tournamentController.joinTournament); 
router.post("/:id/leave", auth, tournamentController.leaveTournament); 

router.post(
  "/",
  auth,
  requireAdmin,
  uploadTrophy.single("trophyImage"),
  tournamentController.createTournamentRules,
  validateRequest,
  tournamentController.createTournament,
);

router.post(
  "/:id/start",
  auth,
  requireAdmin,
  tournamentController.startTournament,
);

router.put(
  "/:id",
  auth,
  requireAdmin,
  tournamentController.createTournamentRules,
  validateRequest,
  tournamentController.updateTournament,
);
router.put(
  "/:id/trophy",
  auth,
  requireAdmin,
  uploadTrophy.single("trophyImage"),
  tournamentController.updateTrophy,
);
router.put(
  "/:id/cancel",
  auth,
  requireAdmin,
  tournamentController.cancelTournament,
);
router.delete(
  "/:id",
  auth,
  requireAdmin,
  tournamentController.deleteTournament,
);

export default router;
