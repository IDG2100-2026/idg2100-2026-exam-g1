import mongoose, { Schema } from "mongoose";

const matchSchema = new Schema(
  {
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
      enum: [0, 1, 10, 50],
      required: true,
    },

    status: {
      type: String,
      enum: ["waiting", "ongoing", "finished"],
      default: "waiting",
    },

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

    gameState: {
      currentRound: {
        type: Number,
        default: 0,
      },

      phase: {
        type: String,
        enum: ["rolling", "betting"],
        default: "rolling",
      },

      currentPlayerIndex: {
        type: Number,
        default: 0,
      },

      playerStates: [
        {
          user: { type: Schema.Types.ObjectId, ref: "User" },
          chips: { type: Number },
          dice: [String],
          heldDice: [Boolean],
          rollsUsed: { type: Number, default: 0 },
          bet: { type: Number, default: 0 },
          folded: { type: Boolean, default: false },
          doneRolling: { type: Boolean, default: false },
        },
      ],

      pot: {
        type: Number,
        default: 0,
      },

      currentBet: {
        type: Number,
        default: 0,
      },
    },

    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      default: null,
    },

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
