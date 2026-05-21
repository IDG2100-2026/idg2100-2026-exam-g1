import User from "../Models/User.model.js";
import Match from "../Models/Match.model.js";
import AuditLog from "../Models/AuditLog.model.js";
import Tournament from "../Models/Tournament.model.js";

//------------------ADMIN DASHBOARD------------------------
export const getDashboard = async (req, res, next) => {
  const now = new Date();

  //"Today" means from midnight
  const startOfday = new Date(now);
  startOfday.setHours(0, 0, 0, 0);

  //One week ago in milliseconds
  const oneWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);

  //30 days ago in milliseconds
  const oneMonth = new Date(now - 30 * 24 * 60 * 60 * 1000);

  //New profile overview
  const newProfiles = {
    today: await User.countDocuments({ createdAt: { $gte: startOfday } }),
    lastWeek: await User.countDocuments({ createdAt: { $gte: oneWeek } }),
    lastMonth: await User.countDocuments({ createdAt: { $gte: oneMonth } }),
    allTime: await User.countDocuments(),
  };

  //Count players in ongoing matches
  const ongoingMatches = await Match.find({ status: "ongoing" });
  const activePlayers = ongoingMatches.reduce(
    (total, match) => total + match.players.length,
    0,
  );

  //Games played overview
  const gamesPlayed = {
    today: await Match.countDocuments({
      status: "finished",
      updatedAt: { $gte: startOfday },
    }),

    lastWeek: await Match.countDocuments({
      status: "finished",
      updatedAt: { $gte: oneWeek },
    }),

    lastMonth: await Match.countDocuments({
      status: "finished",
      updatedAt: { $gte: oneMonth },
    }),

    allTime: await Match.countDocuments({ status: "finished" }),
  };

  const tournaments = {
    upcoming: await Tournament.countDocuments({ status: "upcoming" }),
    ongoing: await Tournament.countDocuments({ status: "ongoing" }),
    finished: await Tournament.countDocuments({ status: "finished" }),
    cancelled: await Tournament.countDocuments({ status: "cancelled" }),
    allTime: await Tournament.countDocuments(),
  };

  //Available games right now
  const availableGames = await Match.countDocuments({ status: "waiting" });

  //Security incidents, recent 50
  const incidents = await AuditLog.find().sort({ createdAt: -1 }).limit(50);

  res.status(200).json({
    newProfiles,
    activePlayers,
    gamesPlayed,
    tournaments,
    availableGames,
    incidents,
  });
};
