import Match from "../Models/Match.model.js";
import User from "../Models/User.model.js";
import Tournament from "../Models/Tournament.model.js";

const DICE_FACES = [
  "RA",
  "RK",
  "RQ",
  "RJ",
  "R8",
  "R7",
  "BA",
  "BK",
  "BQ",
  "BJ",
  "B8",
  "B7",
];

function rollDice() {
  return Array.from(
    { length: 5 },
    () => DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)], 
  );
}

const getActiveMatch = async (matchId, phase) => {
  const match = await Match.findById(matchId);
  if (!match) return null;
  if (match.status !== "ongoing") return null;
  if (match.gameState.phase !== phase) return null;
  return match;
};

const isCurrentPlayer = (gs, userId) => {
  const currentPlayerState = gs.playerStates[gs.currentPlayerIndex];
  return currentPlayerState.user.toString() === userId.toString();
};

function getFace(face) {
  if (face.includes("A")) return 6;
  if (face.includes("K")) return 5;
  if (face.includes("Q")) return 4;
  if (face.includes("J")) return 3;
  if (face.includes("8")) return 2;
  if (face.includes("7")) return 1;
}

function countFrequency(ranks) {
  const frequency = {};
  for (let i = 0; i < ranks.length; i++) {
    const value = ranks[i];
    if (frequency[value]) {
      frequency[value] = frequency[value] + 1;
    } else {
      frequency[value] = 1;
    }
  }
  return frequency;
}

function sortFrequency(frequency) {
  const sorted = [];
  for (const key in frequency) {
    sorted.push([key, frequency[key]]);
  }
  sorted.sort((a, b) => b[1] - a[1]);
  return sorted;
}

function frequencyPattern(sortedFrequency) {
  return sortedFrequency.map((item) => item[1]);
}

function isStraight(ranks) {
  const sorted = [...ranks].sort((a, b) => a - b);
  if (
    sorted[0] === 1 &&
    sorted[1] === 2 &&
    sorted[2] === 3 &&
    sorted[3] === 4 &&
    sorted[4] === 5
  )
    return true;
  if (
    sorted[0] === 2 &&
    sorted[1] === 3 &&
    sorted[2] === 4 &&
    sorted[3] === 5 &&
    sorted[4] === 6
  )
    return true;
  return false;
}

function handType(pattern, ranks) {
  if (pattern[0] === 5) return 7; 
  if (pattern[0] === 4) return 6; 
  if (pattern[0] === 3 && pattern[1] === 2) return 5;
  if (pattern[0] === 1 && pattern.length === 5) {
    return isStraight(ranks) ? 4 : 0;
  }
  if (pattern[0] === 3) return 3; 
  if (pattern[0] === 2 && pattern[1] === 2) return 2; 
  if (pattern[0] === 2) return 1;
  return 0; 
}

function handName(rank) {
  if (rank === 7) return "Repóker";
  if (rank === 6) return "Póker";
  if (rank === 5) return "Full";
  if (rank === 4) return "Escalera";
  if (rank === 3) return "Trío";
  if (rank === 2) return "Doble Pareja";
  if (rank === 1) return "Pareja";
  return "Carta Alta";
}

function evaluateHand(dice) {
  const ranks = dice.map((face) => getFace(face));
  const frequency = countFrequency(ranks);
  const sorted = sortFrequency(frequency);
  const pattern = frequencyPattern(sorted);
  const rank = handType(pattern, ranks);
  return { handRank: rank, ranks, handLabel: handName(rank) };
}

function compareHands(hand1, hand2) {
  if (hand1.handRank !== hand2.handRank) {
    return hand1.handRank > hand2.handRank ? 1 : -1;
  }
  const sorted1 = [...hand1.ranks].sort((a, b) => b - a);
  const sorted2 = [...hand2.ranks].sort((a, b) => b - a);
  for (let i = 0; i < 5; i++) {
    if (sorted1[i] > sorted2[i]) return 1;
    if (sorted2[i] > sorted1[i]) return -1;
  }
  return 0; 
}

export const startGame = async (matchId, io) => {
  try {
    const match = await Match.findById(matchId);

    const playerStates = match.players.map((p) => {
      let startingChips = 1500;
      if (match.tournament) {
        startingChips = p.chips ?? 1500;
      }
      return {
        user: p.user,
        chips: startingChips,
        dice: rollDice(),
        heldDice: [false, false, false, false, false],
        rollsUsed: 1,
        bet: 0,
        folded: false,
        doneRolling: false,
      };
    });
    match.gameState = {
      currentRound: 1,
      phase: "rolling",
      currentPlayerIndex: 0,
      playerStates,
      pot: 0,
      currentBet: 0,
    };
    match.status = "ongoing";
    await match.save();

    const room = io.sockets.adapter.rooms.get(matchId);
    if (!room) return;

    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (!socket) continue;

      const playerState = playerStates.find(
        (p) => p.user.toString() === socket.user._id.toString(),
      );
      if (!playerState) continue;

      socket.emit("gameStarted", {
        currentRound: 1,
        phase: "rolling",
        currentPlayerIndex: 0,
        myDice: playerState.dice,
        myHeld: playerState.heldDice,
        rollsUsed: 1,
        pot: 0,
        currentBet: 0,
        players: playerStates.map((p) => ({
          user: p.user,
          chips: p.chips,
          folded: p.folded,
          doneRolling: p.doneRolling,
          bet: p.bet,
        })),
      });
    }
  } catch (err) {
    console.error("startGame error:", err);
  }
};

export const handleRoll = async (socket, data, io) => {
  try {
    const match = await getActiveMatch(data.matchId, "rolling");
    if (!match) return;

    if (!isCurrentPlayer(match.gameState, socket.user._id)) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    const gs = match.gameState;
    const currentPlayerState = gs.playerStates[gs.currentPlayerIndex];

    if (currentPlayerState.rollsUsed >= 3) {
      socket.emit("error", { message: "No rolls remaining" });
      return;
    }

    const newDice = currentPlayerState.dice.map((face, index) => {
      if (data.heldDice[index]) {
        return face;
      } else {
        return DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
      }
    });

    currentPlayerState.dice = newDice;
    currentPlayerState.heldDice = data.heldDice;
    currentPlayerState.rollsUsed += 1;
    match.markModified("gameState");
    await match.save();

    socket.emit("diceRolled", {
      myDice: newDice,
      myHeld: data.heldDice,
      rollsUsed: currentPlayerState.rollsUsed,
    });

    socket.to(data.matchId).emit("opponentRolled", {
      userId: socket.user._id,
      rollsUsed: currentPlayerState.rollsUsed,
    });
  } catch (err) {
    console.error("handleRoll error:", err);
  }
};

export const handleDoneRolling = async (socket, data, io) => {
  try {
    const match = await getActiveMatch(data.matchId, "rolling");
    if (!match) return;

    if (!isCurrentPlayer(match.gameState, socket.user._id)) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    const gs = match.gameState;
    const currentPlayerState = gs.playerStates[gs.currentPlayerIndex];
    currentPlayerState.doneRolling = true;

    const nextPlayerIndex = gs.playerStates.findIndex(
      (p) => !p.doneRolling && !p.folded,
    );
    if (nextPlayerIndex !== -1) {
      gs.currentPlayerIndex = nextPlayerIndex;
      match.markModified("gameState");
      await match.save();

      io.to(data.matchId).emit("nextTurn", {
        currentPlayerIndex: nextPlayerIndex,
        phase: "rolling",
      });
    } else {
      gs.phase = "betting";
      gs.currentPlayerIndex = 0;
      gs.currentBet = 0;
      match.markModified("gameState");
      await match.save();

      io.to(data.matchId).emit("bettingPhase", {
        currentPlayerIndex: 0,
        pot: gs.pot,
        currentBet: 0,
      });
    }
  } catch (err) {
    console.error("handleDoneRolling error:", err);
  }
};

export const handlePlayerAction = async (socket, data, io) => {
  try {
    const match = await getActiveMatch(data.matchId, "betting");
    if (!match) return;

    if (!isCurrentPlayer(match.gameState, socket.user._id)) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    const gs = match.gameState;
    const currentPlayerState = gs.playerStates[gs.currentPlayerIndex];

    if (data.action === "check") {
      if (gs.currentBet > 0) {
        socket.emit("error", { message: "Cannot bet, use raise instead" });
        return;
      }

    } else if (data.action === "bet") {
      if (!data.amount || data.amount < 1) {
        socket.emit("error", { message: "Bet amount must be at least 1" });
        return;
      }

      if (data.amount > currentPlayerState.chips) {
        socket.emit("error", { message: "not enough chips" });
        return;
      }

      currentPlayerState.chips -= data.amount;
      currentPlayerState.bet += data.amount;
      gs.pot += data.amount;
      gs.currentBet = data.amount;

    } else if (data.action === "call") {
      if (gs.currentBet === 0) {
        socket.emit("error", { message: "Nothing to call, use check instead" });
        return;
      }

      const amountToCall = gs.currentBet - currentPlayerState.bet;
      if (amountToCall > currentPlayerState.chips) {
        socket.emit("error", { message: "Not enough chips to call" });
        return;
      }
      currentPlayerState.chips -= amountToCall;
      currentPlayerState.bet += amountToCall;
      gs.pot += amountToCall;

    } else if (data.action === "raise") {
      if (gs.currentBet === 0) {
        socket.emit("error", { message: "Nothing to raise, use bet instead" });
        return;
      }

      const amountToAdd = data.amount - currentPlayerState.bet;
      if (amountToAdd > currentPlayerState.chips) {
        socket.emit("error", { message: "Not enough chips" });
        return;
      }

      const isAllIn = amountToAdd === currentPlayerState.chips;

      if (!isAllIn && data.amount < gs.currentBet * 2) {
        socket.emit("error", {
          message: "Raise must be at least double the current bet",
        });
        return;
      }
      currentPlayerState.chips -= amountToAdd;
      currentPlayerState.bet += amountToAdd;
      gs.pot += amountToAdd;
      gs.currentBet = data.amount;
    }

    const nextPlayerIndex = gs.playerStates.findIndex(
      (p, index) => index !== gs.currentPlayerIndex && !p.folded,
    );

    const activePlayers = gs.playerStates.filter((p) => !p.folded);
    const bettingDone = activePlayers.every((p) => p.bet === gs.currentBet);

    if (bettingDone) {
      await handleShowdown(match, io);
    } else {
      gs.currentPlayerIndex = nextPlayerIndex;
      match.markModified("gameState");
      await match.save();

      io.to(data.matchId).emit("playerActed", {
        userId: socket.user._id,
        action: data.action,
        amount: data.amount ?? 0,
        pot: gs.pot,
        currentBet: gs.currentBet,
        currentPlayerIndex: nextPlayerIndex,
        players: gs.playerStates.map((p) => ({
          user: p.user,
          chips: p.chips,
          bet: p.bet,
          folded: p.folded,
        })),
      });
    }
  } catch (err) {
    console.error("handlePlayerAction error:", err);
  }
};

export const handleFold = async (socket, data, io) => {
  try {
    const match = await getActiveMatch(data.matchId, "betting");
    if (!match) return;

    if (!isCurrentPlayer(match.gameState, socket.user._id)) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    const gs = match.gameState;
    const currentPlayerState = gs.playerStates[gs.currentPlayerIndex];

    currentPlayerState.folded = true;

    const activePlayers = gs.playerStates.filter((p) => !p.folded);
    if (activePlayers.length === 1) {
      await handleShowdown(match, io);
      return;
    }

    const nextPlayerIndex = gs.playerStates.findIndex(
      (p, index) => index !== gs.currentPlayerIndex && !p.folded,
    );
    gs.currentPlayerIndex = nextPlayerIndex;

    const bettingDone = activePlayers.every((p) => p.bet === gs.currentBet);
    if (bettingDone) {
      await handleShowdown(match, io);
    } else {
      match.markModified("gameState");
      await match.save();

      io.to(data.matchId).emit("playerFolded", {
        userId: socket.user._id,
        currentPlayerIndex: nextPlayerIndex,
        players: gs.playerStates.map((p) => ({
          user: p.user,
          chips: p.chips,
          bet: p.bet,
          folded: p.folded,
        })),
      });
    }
  } catch (err) {
    console.error("handleFold error:", err);
  }
};

const handleShowdown = async (match, io) => {
  try {
    const gs = match.gameState;
    const matchId = match._id.toString();

    const activePlayers = gs.playerStates.filter((p) => !p.folded);

    const evaluated = activePlayers.map((p) => ({
      playerState: p,
      hand: evaluateHand(p.dice),
    }));

    evaluated.sort((a, b) => compareHands(b.hand, a.hand));

    const isTie =
      evaluated.length > 1 &&
      compareHands(evaluated[0].hand, evaluated[1].hand) === 0;

    if (isTie) {
      const tiedPlayers = evaluated.filter(
        (e) => compareHands(e.hand, evaluated[0].hand) === 0,
      );
      const share = Math.floor(gs.pot / tiedPlayers.length);
      tiedPlayers.forEach((e) => {
        e.playerState.chips += share;
      });
    } else {
      evaluated[0].playerState.chips += gs.pot;
    }

    const gameOver = gs.currentRound >= match.rounds;

    if (gameOver) {
      const sortByChips = [...gs.playerStates].sort(
        (a, b) => b.chips - a.chips,
      );
      const overallWinner = sortByChips[0];

      match.status = "finished";
      match.winner = overallWinner.user;

      const eloField =
        match.timeControl === 10
          ? "elo.short"
          : match.timeControl === 30
            ? "elo.medium"
            : "elo.long";

      const totalPot = match.buyIn * match.players.length;
      await User.findByIdAndUpdate(overallWinner.user, {
        $inc: { points: totalPot, wins: 1, totalGames: 1, [eloField]: 7 },
      });

      for (const p of gs.playerStates) {
        if (p.user.toString() !== overallWinner.user.toString()) {
          await User.findByIdAndUpdate(p.user, {
            $inc: { losses: 1, totalGames: 1, [eloField]: -7 },
          });
        }
      }
      match.markModified("gameState");
      await match.save();

      if (match.tournament) {
        const tournament = await Tournament.findById(match.tournament);
        if (tournament) {
          for (const p of gs.playerStates) {
            const tp = tournament.players.find(
              (t) => t.user.toString() === p.user.toString(),
            );

            if (!tp) continue;
            tp.chips = p.chips; 

            if (p.chips === 0) {
              tp.eliminated = true;
              const activeTournamentPlayers = tournament.players.filter(
                (t) => !t.eliminated,
              );
              tp.placement = activeTournamentPlayers.length + 1;
            }
          }

          const unfinishedMatches = await Match.find({
            tournament: match.tournament,
            status: { $ne: "finished" },
          });

          if (unfinishedMatches.length === 0) {
            if (tournament.currentRound >= tournament.totalRounds) {
              const finalStandings = [...tournament.players]
                .filter((p) => !p.eliminated)
                .sort((a, b) => b.chips - a.chips);

              finalStandings.forEach((p, index) => {
                p.placement = index + 1;
              });

              const prizePool = tournament.buyIn * tournament.players.length;
              tournament.status = "finished";
              tournament.winner = finalStandings[0].user;

              await User.findByIdAndUpdate(finalStandings[0].user, {
                $inc: { points: Math.floor(prizePool * 0.5) },
              });

              if (finalStandings[1]) {
                await User.findByIdAndUpdate(finalStandings[1].user, {
                  $inc: { points: Math.floor(prizePool * 0.3) },
                });
              }

              if (finalStandings[2]) {
                await User.findByIdAndUpdate(finalStandings[2].user, {
                  $inc: { points: Math.floor(prizePool * 0.2) },
                });
              }
            } else {
              tournament.currentRound += 1;
            }
          }

          tournament.markModified("players");
          await tournament.save();
        }
      }

      io.to(matchId).emit("gameOver", {
        winner: overallWinner.user,
        players: gs.playerStates.map((p) => ({
          user: p.user,
          chips: p.chips,
          dice: p.dice,
          hand: evaluateHand(p.dice),
          folded: p.folded,
        })),
      });
    } else {
      gs.currentRound += 1;
      gs.phase = "rolling";
      gs.currentPlayerIndex = 0;
      gs.pot = 0;
      gs.currentBet = 0;

      const finalPlayers = gs.playerStates.map((p) => ({
        user: p.user,
        chips: p.chips,
        dice: p.dice,
        hand: evaluateHand(p.dice),
        folded: p.folded,
      }));

      const finalPot = gs.pot;

      gs.playerStates.forEach((p) => {
        p.dice = rollDice();
        p.heldDice = [false, false, false, false, false];
        p.rollsUsed = 1;
        p.bet = 0;
        p.folded = false;
        p.doneRolling = false;
      });

      match.markModified("gameState");
      await match.save();

      io.to(matchId).emit("roundOver", {
        winner: isTie ? null : evaluated[0].playerState.user,
        isTie,
        pot: finalPot,
        players: finalPlayers,
      });

      const room = io.sockets.adapter.rooms.get(matchId);
      if (!room) return;

      for (const socketId of room) {
        const socket = io.sockets.sockets.get(socketId);
        if (!socket) continue;

        const playerState = gs.playerStates.find(
          (p) => p.user.toString() === socket.user._id.toString(),
        );
        if (!playerState) continue;

        socket.emit("newRound", {
          currentRound: gs.currentRound,
          myDice: playerState.dice,
          myHeld: playerState.heldDice,
          rollsUsed: 1,
          currentPlayerIndex: 0,
          players: gs.playerStates.map((p) => ({
            user: p.user,
            chips: p.chips,
            folded: p.folded,
            doneRolling: p.doneRolling,
            bet: p.bet,
          })),
        });
      }
    }
  } catch (err) {
    console.error("handleShowdown error:", err);
  }
};
