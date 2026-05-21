import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const initWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    console.log("auth:", socket.handshake.auth);
    console.log("query:", socket.handshake.query);
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

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);
    });
  });

  return io;
};

export default initWebSocket;
