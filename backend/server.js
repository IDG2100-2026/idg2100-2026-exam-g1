import "dotenv/config";
import connectDB from "./src/Config/Database.js";
import app from "./app.js";
import { createServer } from "http";

const server = createServer(app);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port: ${process.env.PORT || 5000}`);
    });
  } catch (err) {
    console.log("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
