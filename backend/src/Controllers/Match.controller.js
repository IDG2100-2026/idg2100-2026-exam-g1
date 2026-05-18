import Match from "../Models/Match.model.js";
import AppError from "../Utils/AppError.js";

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

//Delete match, needs ownership check
export const deleteMatch = async (req, res, next) => {
  const match = await Match.findByIdAndDelete(req.params.id);
  if (!match) return next(new AppError("Match not found", 404));
  res.status(200).json({ message: "Match deleted" });
};
