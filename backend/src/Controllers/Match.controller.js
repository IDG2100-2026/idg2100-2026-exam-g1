import Match from "../Models/Match.model.js";
import AppError from "../Utils/AppError.js";
import { body } from "express-validator";
import User from "../Models/User.model.js";

//---------------CREATE MATCH RULES----------------
export const createMatchRules = [
  body("variant")
    .notEmpty()
    .withMessage("Variant is required")
    .isIn(["standard", "straights"])
    .withMessage("Variant must be standard or straights"),
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

//----------------GET ALL MATCHES----------------
//mostly from https://www.youtube.com/watch?v=ZX3qt0UWifc
export const getAllMatches = async (req, res, next) => {
  const { variant, rounds, status, timeControl } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  //Filter
  const filter = {};
  if (variant) filter.variant = variant;
  if (rounds) filter.rounds = parseInt(rounds);
  if (timeControl) filter.timeControl = parseInt(timeControl);
  if (status) filter.status = status;

  const total = await Match.countDocuments(filter);
  const results = {};

  //Add next object if its not the last page
  if (skip + limit < total) {
    results.next = { page: page + 1, limit };
  }

  //Adds previous object if its not the first page
  if (skip > 0) {
    results.previous = { page: page - 1, limit };
  }
  results.results = await Match.find(filter)
    .skip(skip)
    .limit(limit)
    .populate("players.user", "username elo profilePicture");
  res.status(200).json(results);
};

//----------------GET ONE MATCH----------------
export const getMatch = async (req, res, next) => {
  const match = await Match.findById(req.params.id)
    .populate("players.user", "username elo profilePicture")
    .populate("owner", "username");
  if (!match) return next(new AppError("Match not found", 404));
  res.status(200).json(match);
};

//----------------CREATE MATCH----------------
export const createMatch = async (req, res, next) => {
  //Check if user has enough points
  const user = await User.findById(req.user._id);
  if (user.points < req.body.buyIn) {
    return next(new AppError("Not enough points for buy-in", 400));
  }

  //Deduct points
  user.points -= req.body.buyIn;
  await user.save();

  //Create match
  const match = await Match.create({
    variant: req.body.variant,
    rounds: req.body.rounds,
    timeControl: req.body.timeControl,
    maxPlayers: req.body.maxPlayers,
    buyIn: req.body.buyIn,
    owner: req.user._id,
    players: [{ user: req.user._id, points: req.body.buyIn }],
  });
  await match.populate("players.user", "username elo profilePicture");
  await match.populate("owner", "username");
  res.status(201).json(match);
};

//----------------JOIN MATCH----------------
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

  //check points for buy in
  const user = await User.findById(req.user._id);
  if (user.points < match.buyIn) {
    return next(new AppError("Not enough points for buy-in", 400));
  }

  //Deduct points
  user.points -= match.buyIn;
  await user.save();

  //push players to match
  match.players.push({ user: req.user._id, points: match.buyIn });
  await match.save();

  const io = req.app.get("io");

  io.to(match._id.toString()).emit("playerJoined", {
    userId: req.user._id,
    playerCount: match.players.length,
  });

  //Start game if enough players joined
  if (match.players.length === match.maxPlayers) {
    io.to(match._id.toString()).emit("gameStart", {
      matchId: match._id,
      players: match.players,
    });
    //update match status in DB
    match.status = "ongoing";
    await match.save();
  }
  res.status(200).json(match);
};

//----------------LEAVE MATCH----------------
export const leaveMatch = async (req, res, next) => {
  const match = await Match.findById(req.params.id);
  if (!match) return next(new AppError("Match not found", 404));

  //Can only leave if match is waiting
  if (match.status !== "waiting") {
    return next(new AppError("Cannot leave a match that already started", 400));
  }

  //Check if player is in match
  const isInMatch = match.players.some(
    (p) => p.user.toString() === req.user._id.toString(),
  );
  if (!isInMatch) return next(new AppError("You are not in this match", 400));

  //return points
  const user = await User.findById(req.user._id);
  user.points += match.buyIn;
  await user.save();

  //Remove from match
  match.players = match.players.filter(
    (p) => p.user.toString() !== req.user._id.toString(),
  );

  const io = req.app.get("io");
  io.to(match._id.toString()).emit("playerLeft", {
    userId: req.user._id,
    playerCount: match.players.length,
  });
  await match.save();
  res.status(200).json({ message: "Left match successfully" });
};

//----------------DELETE MATCH----------------
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
