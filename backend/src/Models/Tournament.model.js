import mongoose, { Schema } from "mongoose";

const tournamentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 50,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500,
    },

    status: {
      type: String,
      enum: ["upcoming", "ongoing", "finished", "cancelled"],
      default: "upcoming",
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    totalRounds: {
      type: Number,
      required: true,
      min: 1,
    },

    currentRound: {
      type: Number,
      default: 0,
    },

    variant: {
      type: String,
      enum: ["standard", "straights"],
      required: true,
    },

    timeControl: {
      type: Number,
      enum: [10, 30, 90],
      required: true,
    },

    minElo: {
      type: Number,
      default: 0,
    },

    maxElo: {
      type: Number,
      default: 9999,
    },

    buyIn: {
      type: Number,
      enum: [1, 10, 50],
      required: true,
    },

    maxPlayers: {
      type: Number,
      required: true,
      min: 2,
    },

    players: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        points: { type: Number, default: 0 },
      },
    ],

    winner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    trophyDescription: {
      type: String,
      trim: true,
      maxLength: 300,
    },

    trophyImage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const Tournament = mongoose.model("Tournament", tournamentSchema);
export default Tournament;
