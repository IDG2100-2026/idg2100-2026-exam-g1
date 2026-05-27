import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Comment from "../Models/Comment.model.js";
import { startGame, handleRoll } from "./gameLogic.js";

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
      //verify access token
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    //Join match room
    socket.on("joinMatch", (matchId) => {
      socket.join(matchId);
      console.log(`${socket.id} joined match ${matchId}`);

      //playercount
      const playerCount = io.sockets.adapter.rooms.get(matchId)?.size;
      console.log(`Players in match ${matchId}: ${playerCount}`);

      io.to(matchId).emit("playedJoined", {
        userId: socket.user._id,
        playerCount,
      });
    });

    //Player rolls dice
    socket.on("rollDice", (data) => {
      handleRoll(socket, data, io);
    });

    //New comment
    socket.on("newComment", async (data) => {
      //validation
      if (!data.content?.trim()) return;
      if (!["match", "tournament"].includes(data.targetType)) return;
      if (!data.targetId) return;

      try {
        //Save to database
        const comment = await Comment.create({
          content: data.content,
          author: socket.user._id,
          targetType: data.targetType,
          targetId: data.targetId,
        });
        await comment.populate("author", "username");

        //Broadcast
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
