import mongoose, { Schema } from "mongoose";

const matchSchema = new Schema(
  {
    //Settings
    variant: {
      type: String,
      enum: ["standard", "straights"],
      required: true,
    },

    rounds: {
      type: Number,
      enum: [3, 5, 7],
      required: true,
    },

    timeControl: {
      type: Number,
      enum: [10, 30, 90],
      required: true,
    },

    maxPlayers: {
      type: Number,
      enum: [2, 3, 5],
      required: true,
    },

    buyIn: {
      type: Number,
      enum: [1, 10, 50],
      required: true,
    },

    //match state
    status: {
      type: String,
      enum: ["waiting", "ongoing", "finished"],
      default: "waiting",
    },

    //Players
    players: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        points: Number,
      },
    ],

    winner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    //Owner of the match
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const Match = mongoose.model("Match", matchSchema);
export default Match;
