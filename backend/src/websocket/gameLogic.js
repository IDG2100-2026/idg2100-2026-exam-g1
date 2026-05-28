import Match from "../Models/Match.model.js";

//Dice faces, RA = red ace, BK=black king etc
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
//--------------------------HELPERS--------------------------
//Roll 5 random random dice
function rollDice() {
  return Array.from(
    { length: 5 },
    () => DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)], //https://stackoverflow.com/questions/5915096/get-a-random-item-from-a-javascript-array
  );
}

//Load match and check basic conditions
const getActiveMatch = async (matchId, phase) => {
  const match = await Match.findById(matchId);
  if (!match) return null;
  if (match.status !== "ongoing") return null;
  if (match.gameState.phase !== phase) return null;
  return match;
};

//check if current player
const isCurrentPlayer = (gs, userId) => {
  const currentPlayerState = gs.playerStates[gs.currentPlayerIndex];
  return currentPlayerState.user.toString() === userId.toString();
};

//--------------------------HAND EVALUATION--------------------------
//Ported from oblig1 Jørgen dice-poker-board.js

//Convert face string to numeric rank
function getFace(face) {
  if (face.includes("A")) return 6;
  if (face.includes("K")) return 5;
  if (face.includes("Q")) return 4;
  if (face.includes("J")) return 3;
  if (face.includes("8")) return 2;
  if (face.includes("7")) return 1;
}

//Count how many times each rank appears
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

// Sort frequency by count descending
function sortFrequency(frequency) {
  const sorted = [];
  for (const key in frequency) {
    sorted.push([key, frequency[key]]);
  }
  sorted.sort((a, b) => b[1] - a[1]);
  return sorted;
}

//Exctract just the counts
function frequencyPattern(sortedFrequency) {
  return sortedFrequency.map((item) => item[1]);
}

//Check for straight
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

//Return numeric hand rank (higher = better)
function handType(pattern, ranks) {
  if (pattern[0] === 5) return 7; //five of a kind
  if (pattern[0] === 4) return 6; //four of a kind
  if (pattern[0] === 3 && pattern[1] === 2) return 5; //full house
  if (pattern[0] === 1 && pattern.length === 5) {
    return isStraight(ranks) ? 4 : 0;
  }
  if (pattern[0] === 3) return 3; //three of a kind
  if (pattern[0] === 2 && pattern[1] === 2) return 2; //two pairs
  if (pattern[0] === 2) return 1; //one pair
  return 0; //high card
}

//Human readable hand name
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

//Evaluate a full hand of 5 dice, returns { handRank, ranks, handName }
function evaluateHand(dice) {
  const ranks = dice.map((face) => getFace(face));
  const frequency = countFrequency(ranks);
  const sorted = sortFrequency(frequency);
  const pattern = frequencyPattern(sorted);
  const rank = handType(pattern, ranks);
  return { handRank: rank, ranks, handLabel: handName(rank) };
}

//Compare two hands, returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie
function compareHands(hand1, hand2) {
  if (hand1.handRank !== hand2.handRank) {
    return hand1.handRank > hand2.handRank ? 1 : -1;
  }
  //Same hand rank, tiebreak by highest card
  const sorted1 = [...hand1.ranks].sort((a, b) => b - a);
  const sorted2 = [...hand2.ranks].sort((a, b) => b - a);
  for (let i = 0; i < 5; i++) {
    if (sorted1[i] > sorted2[i]) return 1;
    if (sorted2[i] > sorted1[i]) return -1;
  }
  return 0; //true tie
}

//-----------------------START GAME--------------------------
export const startGame = async (matchId, io) => {
  try {
    const match = await Match.findById(matchId);
    //Build playerState for each player
    const playerStates = match.players.map((p) => ({
      user: p.user,
      chips: 1500,
      dice: rollDice(),
      heldDice: [false, false, false, false, false],
      rollsUsed: 1,
      bet: 0,
      folded: false,
      doneRolling: false,
    }));

    //Save game state to DB
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

    //Send each player their own dice privately
    const room = io.sockets.adapter.rooms.get(matchId);
    if (!room) return;

    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (!socket) continue;

      //Find sockets playerstate
      const playerState = playerStates.find(
        (p) => p.user.toString() === socket.user._id.toString(),
      );
      if (!playerState) continue;

      //Send player their dice
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

//--------------------------HANDLE ROLL--------------------------
export const handleRoll = async (socket, data, io) => {
  try {
    //Check if match exists
    const match = await getActiveMatch(data.matchId, "rolling");
    if (!match) return;

    //Check if players turn
    if (!isCurrentPlayer(match.gameState, socket.user._id)) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    const gs = match.gameState;
    const currentPlayerState = gs.playerStates[gs.currentPlayerIndex];

    //Check if they have rolls left (max set to 3)
    if (currentPlayerState.rollsUsed >= 3) {
      socket.emit("error", { message: "No rolls remaining" });
      return;
    }

    //Reroll dice thats not held
    const newDice = currentPlayerState.dice.map((face, index) => {
      if (data.heldDice[index]) {
        //this is held
        return face;
      } else {
        //this is not held
        return DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
      }
    });

    //Save new dice and held state to DB
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

//--------------------------HANDLE DONE ROLLING--------------------------
export const handleDoneRolling = async (socket, data, io) => {
  try {
    //Check if match exists
    const match = await getActiveMatch(data.matchId, "rolling");
    if (!match) return;

    //Check if players turn
    if (!isCurrentPlayer(match.gameState, socket.user._id)) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    const gs = match.gameState;
    const currentPlayerState = gs.playerStates[gs.currentPlayerIndex];
    //Mark player as done
    currentPlayerState.doneRolling = true;

    //Find next player who hasnt rolled yet
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
      //If everyone is done rolling, move to betting phase
      gs.phase = "betting";
      gs.currentPlayerIndex = 0;
      gs.currentBet = 0;
      match.markModified("gameState");
      await match.save();

      //Tell everyone betting has started
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

//--------------------------HANDLE PLAYER ACTION--------------------------
export const handlePlayerAction = async (socket, data, io) => {
  try {
    const match = await getActiveMatch(data.matchId, "betting");
    if (!match) return;

    //Check if player turn
    if (!isCurrentPlayer(match.gameState, socket.user._id)) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    const gs = match.gameState;
    const currentPlayerState = gs.playerStates[gs.currentPlayerIndex];

    //CHECK
    if (data.action === "check") {
      //Can only check if no one has bet
      if (gs.currentBet > 0) {
        socket.emit("error", { message: "Cannot bet, use raise instead" });
        return;
      }

      //BET
    } else if (data.action === "bet") {
      //Must bet atleast 1 chip
      if (!data.amount || data.amount < 1) {
        socket.emit("error", { message: "Bet amount must be at least 1" });
        return;
      }

      //Must have enough chips
      if (data.amount > currentPlayerState.chips) {
        socket.emit("error", { message: "not enough chips" });
        return;
      }

      //deduct chips and add to pot
      currentPlayerState.chips -= data.amount;
      currentPlayerState.bet += data.amount;
      gs.pot += data.amount;
      gs.currentBet = data.amount;

      //CALL
    } else if (data.action === "call") {
      //Can only call if there is a bet
      if (gs.currentBet === 0) {
        socket.emit("error", { message: "Nothing to call, use check instead" });
        return;
      }

      //Check how much the player has to put in
      const amountToCall = gs.currentBet - currentPlayerState.bet;
      if (amountToCall > currentPlayerState.chips) {
        socket.emit("error", { message: "Not enough chips to call" });
        return;
      }
      currentPlayerState.chips -= amountToCall;
      currentPlayerState.bet += amountToCall;
      gs.pot += amountToCall;

      //RAISE
    } else if (data.action === "raise") {
      //Check if theres been an raise
      if (gs.currentBet === 0) {
        socket.emit("error", { message: "Nothing to raise, use bet instead" });
        return;
      }

      const amountToAdd = data.amount - currentPlayerState.bet;
      //Check if player has enough chips
      if (amountToAdd > currentPlayerState.chips) {
        socket.emit("error", { message: "Not enough chips" });
        return;
      }

      //Allow all in even if it dosn't meet minimum raise
      const isAllIn = amountToAdd === currentPlayerState.chips;

      //If not all in, enforuce min raise (2)
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

    //Move to next player
    const nextPlayerIndex = gs.playerStates.findIndex(
      (p, index) => index !== gs.currentPlayerIndex && !p.folded,
    );

    //Check if betting is over
    //Betting is over when all players have bet the same amount
    const activePlayers = gs.playerStates.filter((p) => !p.folded);
    const bettingDone = activePlayers.every((p) => p.bet === gs.currentBet);

    if (bettingDone) {
      //move to showdown
      await handleShowdown(match, io);
    } else {
      gs.currentPlayerIndex = nextPlayerIndex;
      match.markModified("gameState");
      await match.save();

      //Tell everyone what action was taken and whose turn it is next
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

//--------------------------HANDLE FOLD--------------------------
export const handleFold = async (socket, data, io) => {
  try {
    const match = await getActiveMatch(data.matchId, "betting");
    if (!match) return;

    //check if players turn
    if (!isCurrentPlayer(match.gameState, socket.user._id)) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    const gs = match.gameState;
    const currentPlayerState = gs.playerStates[gs.currentPlayerIndex];

    //Mark player as folded
    currentPlayerState.folded = true;

    //Check if only one player left
    const activePlayers = gs.playerStates.filter((p) => !p.folded);
    if (activePlayers.length === 1) {
      await handleShowdown(match, io);
      return;
    }

    //Move to next player if not
    const nextPlayerIndex = gs.playerStates.findIndex(
      (p, index) => index !== gs.currentPlayerIndex && !p.folded,
    );
    gs.currentPlayerIndex = nextPlayerIndex;

    //Check if betting is done
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

//--------------------------HANDLE SHOWDOWN--------------------------
const handleShowdown = async (match, io) => {
  try {
    const gs = match.gameState;
    const matchId = match._id.toString();

    //Only evaluate non folded players
    const activePlayers = gs.playerStates.filter((p) => !p.folded);

    //Evaluate each players hand
    const evaluated = activePlayers.map((p) => ({
      playerState: p,
      hand: evaluateHand(p.dice),
    }));

    //Sort by hand strength
    evaluated.sort((a, b) => compareHands(b.hand, a.hand));

    //Check for tie
    const isTie =
      evaluated.length > 1 &&
      compareHands(evaluated[0].hand, evaluated[1].hand) === 0;

    if (isTie) {
      //Split pot
      const tiedPlayers = evaluated.filter(
        (e) => compareHands(e.hand, evaluated[0].hand) === 0,
      );
      const share = Math.floor(gs.pot / tiedPlayers.length);
      tiedPlayers.forEach((e) => {
        e.playerState.chips += share;
      });
    } else {
      //winner takes all
      evaluated[0].playerState.chips += gs.pot;
    }

    //Check if game is finished
    const gameOver = gs.currentRound >= match.rounds;

    if (gameOver) {
      //Find overall winner, most chips wins
      const sortByChips = [...gs.playerStates].sort(
        (a, b) => b.chips - a.chips,
      );
      const overallWinner = sortByChips[0];

      match.status = "finished";
      match.winner = overallWinner.user;
      match.markModified("gameState");
      await match.save();

      //Tell everyone game is over
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
      //Start next round - reset round state
      gs.currentRound += 1;
      gs.phase = "rolling";
      gs.currentPlayerIndex = 0;
      gs.pot = 0;
      gs.currentBet = 0;

      // Capture final hands before resetting
      const finalPlayers = gs.playerStates.map((p) => ({
        user: p.user,
        chips: p.chips,
        dice: p.dice,
        hand: evaluateHand(p.dice),
        folded: p.folded,
      }));

      const finalPot = gs.pot;

      //Reset player state
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

      //Tell everyone round result
      io.to(matchId).emit("roundOver", {
        winner: isTie ? null : evaluated[0].playerState.user,
        isTie,
        pot: finalPot,
        players: finalPlayers,
      });

      //Deal new dice
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
