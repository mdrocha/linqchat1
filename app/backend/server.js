import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import { registerSocket } from "./services/whatsappService.js";
import { createWhatsAppClient } from "./bots/whatsappClient.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// socket (não criar outro Server aqui)
registerSocket(io);

// WhatsApp (apenas aqui)
createWhatsAppClient("defaultClient", io);

// middlewares
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

// rotas
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend na porta ${PORT}`);
});
