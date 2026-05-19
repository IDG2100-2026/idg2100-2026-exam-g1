import Match from "../Models/Match.model.js";
import AppError from "../Utils/AppError.js";
import { body } from "express-validator";

//---------------CREATE MATCH RULES----------------
export const createMatchRules = [
  body("variant")
    .notEmpty()
    .withMessage("Variant is required")
    .isIn(["standard", "straights"])
    .withMessage("Variant must be standard or straight"),
  body("rounds")
    .notEmpty()
    .withMessage("Rounds is required")
    .isIn([3, 5, 7])
    .withMessage("Rounds must be 3, 5 or 7"),
  body("timeControl")
    .notEmpty()
    .withMessage("Time control is required")
    .isIn([10, 30, 90])
    .withMessage("Time control must be 10, 30 or 90 seconds"),
  body("maxPlayers")
    .notEmpty()
    .withMessage("Max players is required")
    .isIn([2, 3, 5])
    .withMessage("Max players must be 2, 3 or 5"),
  body("buyIn")
    .notEmpty()
    .withMessage("Buy in is required")
    .isIn([1, 10, 50])
    .withMessage("Buy in must be 1, 10 or 50"),
];

//Get all matches
export const getAllMatches = async (req, res, next) => {
  const matches = await Match.find();
  res.status(200).json(matches);
};

//Get one match
export const getMatch = async (req, res, next) => {
  const match = await Match.findById(req.params.id);
  if (!match) return next(new AppError("Match not found", 404));
  res.status(200).json(match);
};

//Create match
//Need to figure out buy in
export const createMatch = async (req, res, next) => {
  const match = await Match.create({
    variant: req.body.variant,
    rounds: req.body.rounds,
    timeControl: req.body.timeControl,
    maxPlayers: req.body.maxPlayers,
    buyIn: req.body.buyIn,
    owner: req.user._id,
    players: [{ user: req.user._id, points: req.body.buyIn }],
  });
  res.status(201).json(match);
};

//Join match
//need to figure out buy in
export const joinMatch = async (req, res, next) => {
  const match = await Match.findById(req.params.id);
  if (!match) return next(new AppError("Match not found", 404));

  //Only waiting matches can be joined
  if (match.status !== "waiting") {
    return next(new AppError("Match already started", 400));
  }

  //Check if already joined
  const alreadyJoined = match.players.some(
    (p) => p.user.toString() === req.user._id.toString(),
  );
  if (alreadyJoined) return next(new AppError("Already in this match", 400));

  //Check if full
  if (match.players.length >= match.maxPlayers) {
    return next(new AppError("Match is full", 400));
  }

  //push players to match
  match.players.push({ user: req.user._id, points: match.buyIn });
  await match.save();
  res.status(200).json(match);
};

//Delete match
export const deleteMatch = async (req, res, next) => {
  const match = await Match.findById(req.params.id);
  if (!match) return next(new AppError("Match not found", 404));

  //Check ownership
  if (
    match.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("Not allowed", 403));
  }

  await Match.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Match deleted" });
};
