import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Comment from "../Models/Comment.model.js";
import * as gameLogic from "./gameLogic.js";

const initWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("joinMatch", (matchId) => {
      socket.join(matchId);
      console.log(`${socket.id} joined match ${matchId}`);

      const playerCount = io.sockets.adapter.rooms.get(matchId)?.size;
      console.log(`Players in match ${matchId}: ${playerCount}`);

      io.to(matchId).emit("playedJoined", {
        userId: socket.user._id,
        playerCount,
      });
    });

    socket.on("rollDice", (data) => {
      gameLogic.handleRoll(socket, data, io);
    });

    socket.on("doneRolling", (data) => {
      gameLogic.handleDoneRolling(socket, data, io);
    });

    socket.on("playerAction", (data) => {
      gameLogic.handlePlayerAction(socket, data, io);
    });
    socket.on("fold", (data) => {
      gameLogic.handleFold(socket, data, io);
    });
    socket.on("newComment", async (data) => {
      if (!data.content?.trim()) return;
      if (!["match", "tournament"].includes(data.targetType)) return;
      if (!data.targetId) return;

      try {
        const comment = await Comment.create({
          content: data.content,
          author: socket.user._id,
          targetType: data.targetType,
          targetId: data.targetId,
        });
        await comment.populate("author", "username");

        io.to(data.targetId).emit("commentReceived", comment);
      } catch (err) {
        console.error("Comment error:", err);
        socket.emit("error", { message: "Failed to save comment" });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);
    });
  });

  return io;
};

export default initWebSocket;
