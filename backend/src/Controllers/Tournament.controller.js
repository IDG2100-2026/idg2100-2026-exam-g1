import Tournament from "../Models/Tournament.model.js";
import AppError from "../Utils/AppError.js";
import User from "../Models/User.model.js";
import { body } from "express-validator";

//---------------CREATE TOURNAMENT RULES---------------------
export const createTournamentRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 50 })
    .withMessage("Title cannot exceed 50 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("totalRounds")
    .notEmpty()
    .withMessage("Total rounds is required")
    .isInt({ min: 1 })
    .withMessage("Total rounds must be at least 1"),
  body("variant")
    .notEmpty()
    .withMessage("Variant is required")
    .isIn(["standard", "straights"])
    .withMessage("Variant must be standard or straight"),
  body("timeControl")
    .notEmpty()
    .withMessage("Time control is required")
    .isIn([10, 30, 90])
    .withMessage("Time control must be 10, 30 or 90 seconds"),
  body("buyIn")
    .notEmpty()
    .withMessage("Buy in is required")
    .isIn([1, 10, 50])
    .withMessage("Buy in must be 1, 10 or 50"),
  body("maxPlayers")
    .notEmpty()
    .withMessage("Max players is required")
    .isInt({ min: 2 })
    .withMessage("Max players must be at least 2"),
];

//----------------------GET TOURNAMENTS----------------------
//supports: ?sort=date|title|player, ?search=string, ?status=upcoming|ongoing|finished
export const getAllTournaments = async (req, res, next) => {
  const { sort, search, status } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};

  //Filter by status
  if (status) filter.status = status;

  //Search by title - min 3 characters
  if (search && search.length >= 3) {
    filter.title = { $regex: search, $options: "i" };
  }

  const total = await Tournament.countDocuments(filter);
  const results = {};

  //Add next object if its not the last page
  if (skip + limit < total) {
    results.next = { page: page + 1, limit };
  }
  //Adds previous object if its not the first page
  if (skip > 0) {
    results.previous = { page: page - 1, limit };
  }

  let tournaments = await Tournament.find(filter).skip(skip).limit(limit);

  //Sort results
  if (sort === "title") {
    tournaments.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "players") {
    tournaments.sort((a, b) => b.players.length - a.players.length);
  } else {
    //Default sort by start date
    tournaments.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }
  results.results = tournaments;
  res.status(200).json(results);
};

//----------------------GET ONE TOURNAMENT----------------------
export const getTournament = async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate("owner", "username")
    .populate("players.user", "username profilePicture")
    .populate("winner", "username");

  if (!tournament) return next(new AppError("Tournament not found", 404));

  //Calculate standings for ongoing tournaments
  const standings = [...tournament.players]
    .sort((a, b) => b.points - a.points)
    .map((player, index) => ({
      position: index + 1,
      user: player.user,
      points: player.points,
    }));

  res.status(200).json({ ...tournament.toObject(), standings });
};

//----------------------CREATE TOURNAMENT----------------------
export const createTournament = async (req, res, next) => {
  const tournament = await Tournament.create({
    title: req.body.title,
    description: req.body.description,
    startDate: req.body.startDate,
    totalRounds: req.body.totalRounds,
    variant: req.body.variant,
    timeControl: req.body.timeControl,
    buyIn: req.body.buyIn,
    maxPlayers: req.body.maxPlayers,
    //Optional fields
    minElo: req.body.minElo || 0,
    maxElo: req.body.maxElo || 9999,
    trophyDescription: req.body.trophyDescription,
    owner: req.user._id,
    trophyImage: req.file ? `/uploads/trophies/${req.file.filename}` : null,
  });

  res.status(201).json(tournament);
};

//----------------------TROPHY PICTURE----------------------
export const updateTrophy = async (req, res, next) => {
  if (!req.file) return next(new AppError("No image uploaded", 400));

  const trophyImage = `/uploads/trophies/${req.file.filename}`;

  const tournament = await Tournament.findByIdAndUpdate(
    req.params.id,
    { trophyImage },
    { new: true },
  );
  if (!tournament) return next(new AppError("Tournament not found", 404));
  res.status(200).json(tournament);
};

//----------------------JOIN TOURNAMENT----------------------
export const joinTournament = async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return next(new AppError("Tournament not found", 404));

  //Can only join upcoming tournaments
  if (tournament.status !== "upcoming") {
    return next(
      new AppError(`Cannot join a ${tournament.status} tournament`, 400),
    );
  }

  //Check if already joined
  const alreadyJoined = tournament.players.some(
    (p) => p.user.toString() === req.user._id.toString(),
  );
  if (alreadyJoined)
    return next(new AppError("Already joined this tournament", 400));

  //Check if full
  if (tournament.players.length >= tournament.maxPlayers) {
    return next(new AppError("Tournament is full", 400));
  }

  //Check elo range
  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError("User not found", 404));
  let userElo;
  if (tournament.timeControl === 10) userElo = user.elo.short;
  if (tournament.timeControl === 30) userElo = user.elo.medium;
  if (tournament.timeControl === 90) userElo = user.elo.long;
  if (userElo < tournament.minElo || userElo > tournament.maxElo) {
    return next(
      new AppError("Your Elo rating does not meet the requirements", 400),
    );
  }

  //Check if user has enough points for buy in
  if (user.points < tournament.buyIn) {
    return next(new AppError("Not enough points for buy-in", 400));
  }

  //Deduct points
  user.points -= tournament.buyIn;
  await user.save();

  //Add player
  tournament.players.push({ user: req.user._id, points: 0 });
  await tournament.save();
  res.status(200).json(tournament);
};

//----------------------LEAVE TOURNAMENT----------------------
export const leaveTournament = async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return next(new AppError("Tournament not found", 404));

  //Check if in tournament
  const isInTournament = tournament.players.some(
    (p) => p.user.toString() === req.user._id.toString(),
  );
  if (!isInTournament)
    return next(new AppError("You are not in this tournament", 400));

  //Return points
  const user = await User.findById(req.user._id);
  user.points += tournament.buyIn;
  await user.save();

  //Remove player
  tournament.players = tournament.players.filter(
    (p) => p.user.toString() !== req.user._id.toString(),
  );
  await tournament.save();
  res.status(200).json({ message: "Left tournament successfully" });
};

//----------------------DELETE TOURNAMENT----------------------
export const deleteTournament = async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return next(new AppError("Tournament not found", 404));

  await Tournament.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Tournament deleted" });
};

//----------------------UPDATE TOURNAMENT----------------------
export const updateTournament = async (req, res, next) => {
  const tournament = await Tournament.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      description: req.body.description,
      startDate: req.body.startDate,
      totalRounds: req.body.totalRounds,
      variant: req.body.variant,
      timeControl: req.body.timeControl,
      buyIn: req.body.buyIn,
      maxPlayers: req.body.maxPlayers,
      minElo: req.body.minElo,
      maxElo: req.body.maxElo,
      trophyDescription: req.body.trophyDescription,
    },
    { new: true, runValidators: true },
  );
  if (!tournament) return next(new AppError("Tournament not found", 404));
  res.status(200).json(tournament);
};

//----------------------CANCEL TOURNAMENT----------------------
export const cancelTournament = async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return next(new AppError("Tournament not found", 404));

  //Can only cancel upcoming or ongoing tournaments
  if (tournament.status === "finished" || tournament.status === "cancelled") {
    return next(
      new AppError("Tournament is already finished or cancelled", 400),
    );
  }

  tournament.status = "cancelled";
  await tournament.save();
  res.status(200).json(tournament);
};
