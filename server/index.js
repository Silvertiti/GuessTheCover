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

const rooms = {}; // { roomName: [ { id, pseudo } ] }

io.on("connection", (socket) => {
  console.log("🧩 Nouveau joueur connecté :", socket.id);

  socket.on("joinRoom", ({ pseudo, room }) => {
    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = [];
    }

    // Évite les doublons si même socket reconnecté
    const alreadyInRoom = rooms[room].some((p) => p.id === socket.id);
    if (!alreadyInRoom) {
      rooms[room].push({ id: socket.id, pseudo });
    }

    console.log(`✅ ${pseudo} a rejoint la room ${room}`);
    console.log("🧑‍🤝‍🧑 Joueurs dans la room :", rooms[room]);

    // Envoie la liste des joueurs à tout le monde (y compris le nouveau)
    io.to(room).emit("playersInRoom", rooms[room]);
  });

  socket.on("disconnect", () => {
    for (const room in rooms) {
      rooms[room] = rooms[room].filter((player) => player.id !== socket.id);

      // Met à jour la liste pour ceux qui restent
      io.to(room).emit("playersInRoom", rooms[room]);
    }
  });
});

server.listen(3001, () => {
  console.log("🚀 Serveur lancé sur http://localhost:3001");
});
