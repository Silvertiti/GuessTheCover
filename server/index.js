const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
const mysql = require("mysql2/promise");

const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // ton mot de passe WAMP (souvent vide par défaut)
  database: "GuessTheCover",
});

const rooms = {}; // { roomName: [ { id, pseudo, ready } ] }

io.on("connection", (socket) => {
  console.log("🧩 Nouveau joueur :", socket.id);

  socket.on("joinRoom", ({ pseudo, room }) => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push({ id: socket.id, pseudo, ready: false });

    io.to(room).emit("playersInRoom", rooms[room]);
  });

  socket.on("playerReady", ({ room, id }) => {
    const player = rooms[room]?.find((p) => p.id === id);
    if (player) player.ready = true;

    const allReady =
      rooms[room]?.length > 0 && rooms[room].every((p) => p.ready);
    if (allReady) {
      io.to(room).emit("startGame");

      // 👇 Envoie l’image à tous les joueurs
      io.to(room).emit("gameImage", {
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg", // change selon ton jeu
        answer: "Nirvana", // réponse attendue
      });
    }
  });

  socket.on("guess", ({ room, pseudo, answer }) => {
    console.log(`${pseudo} a proposé : ${answer}`);
    if (answer.toLowerCase() === "nirvana") {
      io.to(room).emit("correctGuess", pseudo);
    }
  });

  socket.on("disconnect", () => {
    for (const room in rooms) {
      rooms[room] = rooms[room].filter((p) => p.id !== socket.id);
      io.to(room).emit("playersInRoom", rooms[room]);
    }
  });
});

server.listen(3001, () => {
  console.log("🚀 Serveur en ligne sur http://localhost:3001");
});
