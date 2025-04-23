const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// 🧠 C’est ici que tu peux maintenant utiliser io.on()
io.on("connection", (socket) => {
  console.log("🧩 Un joueur connecté :", socket.id);

  socket.on("join", (pseudo) => {
    console.log(`✅ ${pseudo} a rejoint la partie`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Déconnecté :", socket.id);
  });
});

server.listen(3001, () => {
  console.log("🚀 Serveur en ligne sur http://localhost:3001");
});
