import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minLength: 3,
      maxLength: 24,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    points: {
      type: Number,
      default: 100,
    },

    elo: {
      short: { type: Number, default: 1000 }, //10 seconds
      medium: { type: Number, default: 1000 }, //30 seconds
      long: { type: Number, default: 1000 }, //90 seconds
    },

    totalGames: {
      type: Number,
      default: 0,
    },

    wins: {
      type: Number,
      default: 0,
    },

    losses: {
      type: Number,
      default: 0,
    },

    recentGames: [
      {
        gameId: mongoose.Schema.Types.ObjectId,
        result: String,
        pointsChanged: Number,
        playedAt: Date,
      },
    ],

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
