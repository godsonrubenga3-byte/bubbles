import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./api/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Attach io to app so routes can use it
app.set("io", io);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their notification room`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Import express dynamically for static serving in production if needed locally
    const express = (await import("express")).default;
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();