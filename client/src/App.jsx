import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import RoundRecap from "./pages/RoundRecap";
import Scoreboard from "./pages/Scoreboard";

const socket = io("http://localhost:3001");

function App() {
  const [pseudo, setPseudo] = useState("");
  const [room, setRoom] = useState("");
  const [players, setPlayers] = useState([]);
  const [view, setView] = useState("home");

  const [imageUrl, setImageUrl] = useState("");
  const [roundInfo, setRoundInfo] = useState({ round: 0, totalRounds: 5 });
  const [scores, setScores] = useState({});
  const [recapData, setRecapData] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 Connecté au serveur", socket.id);
    });

    socket.on("playersInRoom", (list) => setPlayers(list));

    socket.on("startGame", () => {
      setView("game");
    });

    socket.on("gameImage", ({ imageUrl }) => {
      setImageUrl(imageUrl);
    });

    socket.on("answerUpdate", (data) => {
      // géré dans Game.jsx
    });

    socket.on("roundFinished", (data) => {
      setRecapData({ ...data, imageUrl });
      setView("recap");
    });

    socket.on("roundInfo", (info) => {
      setRoundInfo(info);
    });

    socket.on("scoreboard", (allScores) => {
      setScores(allScores);
    });

    socket.on("goToLobby", () => {
      setScores({});
      setView("lobby");
    });

    socket.on("gameOver", () => {
      setView("scoreboard");
    });

    return () => {
      socket.off("connect");
      socket.off("playersInRoom");
      socket.off("startGame");
      socket.off("gameImage");
      socket.off("answerUpdate");
      socket.off("roundFinished");
      socket.off("roundInfo");
      socket.off("scoreboard");
      socket.off("goToLobby");
      socket.off("gameOver");
    };
  }, [imageUrl]);

  const handleJoin = ({ pseudo, room }) => {
    setPseudo(pseudo);
    setRoom(room);
    setView("lobby");
    socket.emit("joinRoom", { pseudo, room });
  };

  const handleReplay = () => {
    setView("lobby");
    socket.emit("replay", { room });
  };

  const handleNextRound = () => {
    setRecapData(null);
    socket.emit("nextRound", { room });
  };

  // --- RENDU DES VUES ---
  if (view === "home") return <Home onJoin={handleJoin} />;

  if (view === "lobby")
    return (
      <Lobby
        socket={socket}
        players={players}
        room={room}
        pseudo={pseudo}
        scoreboard={scores}
        roundInfo={roundInfo}
      />
    );

  if (view === "game")
    return (
      <Game
        socket={socket}
        room={room}
        pseudo={pseudo}
        players={players}
        imageUrl={imageUrl}
        roundInfo={roundInfo}
      />
    );

  if (view === "recap" && recapData)
    return <RoundRecap data={recapData} onNext={handleNextRound} />;

  if (view === "scoreboard")
    return (
      <Scoreboard scores={scores} players={players} onReplay={handleReplay} />
    );

  return <div className="text-white text-center mt-10">Chargement...</div>;
}

export default App;
