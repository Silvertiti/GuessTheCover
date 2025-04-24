const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
app.use(cors());
app.use("/images", express.static(path.join(__dirname, "public/images")));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let db;
(async () => {
  db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "GuessTheCover",
  });
  console.log("📦 Connecté à MySQL");
})();

const rooms = {};
const scores = {};
const rounds = {};
const currentAnswers = {};
const endTimers = {};

io.on("connection", (socket) => {
  console.log("🧩 Connexion :", socket.id);

  socket.on("joinRoom", ({ pseudo, room, avatar }) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = [];
    if (!scores[room]) scores[room] = {};
    if (!scores[room][pseudo]) scores[room][pseudo] = 0;

    rooms[room].push({ id: socket.id, pseudo, avatar, ready: false });

    io.to(room).emit("playersInRoom", rooms[room]);
  });

  socket.on("setRounds", ({ room, rounds: total }) => {
    rounds[room] = { round: 0, totalRounds: total };
  });

  socket.on("playerReady", async ({ room, id }) => {
    const player = rooms[room]?.find((p) => p.id === id);
    if (player) player.ready = true;

    const allReady = rooms[room]?.every((p) => p.ready);
    if (allReady && db) {
      if (!rounds[room]) rounds[room] = { round: 0, totalRounds: 5 };
      startNextRound(room);
    }
  });

  socket.on("guess", ({ room, pseudo, answer }) => {
    const state = currentAnswers[room];
    if (!state || !answer) return;

    const input = answer.toLowerCase().trim();
    let updated = false;

    if (!state.foundArtist && input === state.artist) {
      state.foundArtist = true;
      state.artistBy = pseudo;
      scores[room][pseudo] += 1;
      updated = true;
    }

    if (!state.foundAlbum && input === state.album) {
      state.foundAlbum = true;
      state.albumBy = pseudo;
      scores[room][pseudo] += 2;
      updated = true;
    }

    if (updated) {
      io.to(room).emit("answerUpdate", {
        foundArtist: state.foundArtist,
        foundAlbum: state.foundAlbum,
        artistBy: state.artistBy,
        albumBy: state.albumBy,
      });

      // Si tout est trouvé, terminer le round immédiatement
      if (state.foundArtist && state.foundAlbum) {
        clearTimeout(endTimers[room]);
        endRound(room);
      }
    }
  });

  socket.on("nextRound", () => {
    startNextRound(socket.rooms.values().next().value);
  });

  socket.on("replay", ({ room }) => {
    scores[room] = {};
    rooms[room]?.forEach((p) => {
      if (p.pseudo) scores[room][p.pseudo] = 0;
      p.ready = false;
    });
    rounds[room] = { round: 0, totalRounds: 5 };
    io.to(room).emit("scoreboard", scores[room]);
    io.to(room).emit("goToLobby");
  });

  socket.on("imageFullyRevealed", ({ room }) => {
    const state = currentAnswers[room];
    if (!state) return;

    if (!state.foundArtist || !state.foundAlbum) {
      console.log(
        `⏳ Lancement du timer 10 sec après pixelStep 7 pour ${room}`
      );
      endTimers[room] = setTimeout(() => {
        endRound(room);
      }, 10000);
    }
  });

  socket.on("disconnect", () => {
    for (const room in rooms) {
      rooms[room] = rooms[room].filter((p) => p.id !== socket.id);
      io.to(room).emit("playersInRoom", rooms[room]);
    }
  });
});

async function startNextRound(room) {
  if (!rounds[room]) rounds[room] = { round: 0, totalRounds: 5 };
  rounds[room].round += 1;

  if (rounds[room].round > rounds[room].totalRounds) {
    io.to(room).emit("scoreboard", scores[room]);
    io.to(room).emit("gameOver");
    return;
  }

  const [rows] = await db.execute(
    "SELECT * FROM covers ORDER BY RAND() LIMIT 1"
  );
  const cover = rows[0];
  if (!cover) return;

  console.log(
    `🎵 [${room}] Round ${rounds[room].round} - ${cover.artist} / ${cover.album}`
  );

  currentAnswers[room] = {
    artist: cover.answer_artist.toLowerCase(),
    album: cover.answer_album.toLowerCase(),
    foundArtist: false,
    foundAlbum: false,
    artistBy: "",
    albumBy: "",
  };

  io.to(room).emit("roundInfo", rounds[room]);
  io.to(room).emit("startGame");
  io.to(room).emit("gameImage", {
    imageUrl: `http://localhost:3001/images/${cover.filename}`,
  });
}

function endRound(room) {
  const data = currentAnswers[room];
  if (!data) return;

  console.log(`⛔ Fin du round ${rounds[room].round} pour ${room}`);
  io.to(room).emit("roundFinished", {
    artist: data.artist,
    album: data.album,
    artistBy: data.artistBy,
    albumBy: data.albumBy,
  });

  io.to(room).emit("scoreboard", scores[room]);

  delete currentAnswers[room];

  setTimeout(() => {
    startNextRound(room);
  }, 10000);
}

server.listen(3001, () => {
  console.log("🚀 Serveur en ligne sur http://localhost:3001");
});
