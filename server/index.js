const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
app.use(cors());

// Servir les images locales
app.use("/images", express.static(path.join(__dirname, "public/images")));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Connexion MySQL (async)
let db;
(async () => {
  db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // remplace si nécessaire
    database: "GuessTheCover",
  });
  console.log("📦 Connecté à MySQL");
})();

const rooms = {}; // { roomName: [ { id, pseudo, ready } ] }
const currentAnswers = {
  // roomName: {
  //   artist: 'nirvana',
  //   album: 'nevermind',
  //   foundArtist: false,
  //   foundAlbum: false,
  //   artistBy: '',
  //   albumBy: ''
  // }
};
io.on("connection", (socket) => {
  console.log("🧩 Nouveau joueur :", socket.id);

  socket.on("joinRoom", ({ pseudo, room }) => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push({ id: socket.id, pseudo, ready: false });

    io.to(room).emit("playersInRoom", rooms[room]);
  });

  socket.on("playerReady", async ({ room, id }) => {
    const player = rooms[room]?.find((p) => p.id === id);
    if (player) player.ready = true;

    const allReady =
      rooms[room]?.length > 0 && rooms[room].every((p) => p.ready);

    if (allReady && db) {
      const [rows] = await db.execute(
        "SELECT * FROM covers ORDER BY RAND() LIMIT 1"
      );
      const cover = rows[0];

      if (!cover) {
        console.error("❌ Aucun cover disponible en base !");
        io.to(room).emit(
          "error",
          "Aucune image disponible. Merci d'ajouter des covers."
        );
        return;
      }
      console.log(`🎵 Manche lancée pour la room ${room} :`);
      console.log(`  - Artiste : ${cover.artist}`);
      console.log(`  - Album   : ${cover.album}`);
      console.log(`  - Image   : ${cover.filename}`);

      io.to(room).emit("startGame");

      io.to(room).emit("gameImage", {
        imageUrl: `http://localhost:3001/images/${cover.filename}`,
      });

      currentAnswers[room] = {
        artist: cover.answer_artist.toLowerCase(),
        album: cover.answer_album.toLowerCase(),
        foundArtist: false,
        foundAlbum: false,
        artistBy: "",
        albumBy: "",
      };
    }
  });

  socket.on("guess", ({ room, pseudo, answer }) => {
    const state = currentAnswers[room];
    if (!state) return;

    const input = answer.toLowerCase().trim();

    let found = false;

    if (!state.foundArtist && input === state.artist) {
      state.foundArtist = true;
      state.artistBy = pseudo;
      found = true;
    }

    if (!state.foundAlbum && input === state.album) {
      state.foundAlbum = true;
      state.albumBy = pseudo;
      found = true;
    }

    if (found) {
      io.to(room).emit("answerUpdate", {
        foundArtist: state.foundArtist,
        foundAlbum: state.foundAlbum,
        artistBy: state.artistBy,
        albumBy: state.albumBy,
      });

      // Si les deux sont trouvés, on peut finir la manche
      if (state.foundArtist && state.foundAlbum) {
        io.to(room).emit("roundFinished", {
          artist: state.artist,
          album: state.album,
          artistBy: state.artistBy,
          albumBy: state.albumBy,
        });
        delete currentAnswers[room];
      }
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
