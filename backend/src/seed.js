import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import connectDB from "./Config/Database.js";
import User from "./Models/User.model.js";
import Match from "./Models/Match.model.js";
import Tournament from "./Models/Tournament.model.js";
import Comment from "./Models/Comment.model.js";

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Match.deleteMany({});
  await Tournament.deleteMany({});
  await Comment.deleteMany({});
  console.log("Cleared existing data");

  // Create users
  const hashedPassword = await bcrypt.hash("Password1", 10);

  const users = await User.insertMany([
    {
      username: "admin",
      email: "admin@test.com",
      password: hashedPassword,
      verifiedEmail: true,
      role: "admin",
      points: 500,
      elo: { short: 1200, medium: 1150, long: 1100 },
      totalGames: 20,
      wins: 12,
      losses: 8,
      bio: "Platform administrator",
    },
    {
      username: "alice",
      email: "alice@test.com",
      password: hashedPassword,
      verifiedEmail: true,
      points: 300,
      elo: { short: 1050, medium: 1100, long: 950 },
      totalGames: 15,
      wins: 8,
      losses: 7,
      bio: "I love poker dice!",
    },
    {
      username: "bob",
      email: "bob@test.com",
      password: hashedPassword,
      verifiedEmail: true,
      points: 200,
      elo: { short: 900, medium: 950, long: 1000 },
      totalGames: 10,
      wins: 4,
      losses: 6,
      bio: "Learning the game",
    },
    {
      username: "carlos",
      email: "carlos@test.com",
      password: hashedPassword,
      verifiedEmail: true,
      points: 400,
      elo: { short: 1150, medium: 1200, long: 1050 },
      totalGames: 25,
      wins: 15,
      losses: 10,
      bio: "Escalera or bust",
    },
    {
      username: "diana",
      email: "diana@test.com",
      password: hashedPassword,
      verifiedEmail: true,
      points: 150,
      elo: { short: 850, medium: 900, long: 850 },
      totalGames: 5,
      wins: 2,
      losses: 3,
      bio: "New to this",
    },
  ]);
  console.log("Created users");

  // Create matches
  const matches = await Match.insertMany([
    // Waiting matches — joinable from lobby
    {
      variant: "standard",
      rounds: 5,
      timeControl: 30,
      maxPlayers: 2,
      buyIn: 10,
      status: "waiting",
      owner: users[1]._id,
      players: [{ user: users[1]._id, points: 10 }],
    },
    {
      variant: "straights",
      rounds: 3,
      timeControl: 10,
      maxPlayers: 3,
      buyIn: 1,
      status: "waiting",
      owner: users[2]._id,
      players: [{ user: users[2]._id, points: 1 }],
    },
    {
      variant: "standard",
      rounds: 7,
      timeControl: 90,
      maxPlayers: 2,
      buyIn: 50,
      status: "waiting",
      owner: users[3]._id,
      players: [{ user: users[3]._id, points: 50 }],
    },
    // Finished match
    {
      variant: "standard",
      rounds: 5,
      timeControl: 30,
      maxPlayers: 2,
      buyIn: 10,
      status: "finished",
      owner: users[1]._id,
      players: [
        { user: users[1]._id, points: 10 },
        { user: users[2]._id, points: 10 },
      ],
      winner: users[1]._id,
    },
  ]);
  console.log("Created matches");

  // Create comments on the first match
  await Comment.insertMany([
    {
      content: "Good luck everyone!",
      author: users[1]._id,
      targetType: "match",
      targetId: matches[0]._id,
    },
    {
      content: "This is going to be intense",
      author: users[2]._id,
      targetType: "match",
      targetId: matches[0]._id,
    },
  ]);
  console.log("Created comments");

  // Create tournaments
  const now = new Date();
  await Tournament.insertMany([
    {
      title: "Weekend Championship",
      description:
        "Join us for the biggest tournament of the week. All skill levels welcome.",
      status: "upcoming",
      owner: users[0]._id,
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      totalRounds: 3,
      variant: "standard",
      timeControl: 30,
      buyIn: 10,
      maxPlayers: 8,
      players: [{ user: users[1]._id }, { user: users[2]._id }],
      trophyDescription: "Golden Dice Trophy",
    },
    {
      title: "Speed Demon Cup",
      description: "Fast paced 10 second rounds. Only the quickest survive.",
      status: "upcoming",
      owner: users[0]._id,
      startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      totalRounds: 2,
      variant: "standard",
      timeControl: 10,
      buyIn: 1,
      maxPlayers: 4,
      players: [],
      trophyDescription: "Lightning Bolt Trophy",
    },
    {
      title: "Straights Masters",
      description: "Straights variant only. For experienced players.",
      status: "upcoming",
      owner: users[0]._id,
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      totalRounds: 4,
      variant: "straights",
      timeControl: 90,
      buyIn: 50,
      maxPlayers: 6,
      minElo: 1000,
      players: [{ user: users[3]._id }],
      trophyDescription: "Silver Straight Trophy",
    },
    {
      title: "Beginners Cup",
      description: "Perfect for new players learning the ropes.",
      status: "finished",
      owner: users[0]._id,
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      totalRounds: 2,
      variant: "standard",
      timeControl: 30,
      buyIn: 1,
      maxPlayers: 4,
      players: [{ user: users[1]._id }, { user: users[4]._id }],
      winner: users[1]._id,
      trophyDescription: "Wooden Spoon Trophy",
    },
    {
      title: "High Rollers Invitational",
      description: "Big buy-in, big rewards. Not for the faint hearted.",
      status: "upcoming",
      owner: users[0]._id,
      startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      totalRounds: 5,
      variant: "standard",
      timeControl: 90,
      buyIn: 50,
      maxPlayers: 5,
      players: [{ user: users[3]._id }],
      trophyDescription: "Diamond Crown Trophy",
    },
  ]);
  console.log("Created tournaments");

  console.log("\nSeeding complete!");
  console.log("All users have password: Password1");
  console.log("Admin login: admin@test.com / Password1");

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
