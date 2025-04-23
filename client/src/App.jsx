import { useState, useEffect } from "react";
import Home from "./pages/Home";
import { io } from "socket.io-client";
import PixelatedImage from "./components/PixelatedImage";

const socket = io("http://localhost:3001");

function App() {
  const [pseudo, setPseudo] = useState("");
  const [room, setRoom] = useState("");
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [pixelStep, setPixelStep] = useState(0); // step = 0 → 2x2
  const MAX_STEP = 7;
  const [guess, setGuess] = useState("");
  const [winner, setWinner] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 Connecté au serveur :", socket.id);
    });

    socket.on("playersInRoom", (list) => setPlayers(list));
    socket.on("startGame", () => {
      console.log("🚀 Partie lancée");
    });

    socket.on("gameImage", ({ imageUrl }) => {
      setImageUrl(imageUrl);
      setPixelStep(0); // ← on démarre pixelisé
    });

    socket.on("correctGuess", (pseudoGagnant) => {
      setWinner(pseudoGagnant);
    });

    return () => {
      socket.off("connect");
      socket.off("playersInRoom");
      socket.off("startGame");
      socket.off("gameImage");
      socket.off("correctGuess");
    };
  }, []);

  useEffect(() => {
    if (imageUrl && pixelStep < MAX_STEP && !winner) {
      const interval = setInterval(() => {
        setPixelStep((prev) => prev + 1);
      }, 5000); // ⏱️
      return () => clearInterval(interval);
    }
  }, [imageUrl, pixelStep, winner]);
  const handleJoin = ({ pseudo, room }) => {
    setPseudo(pseudo);
    setRoom(room);
    socket.emit("joinRoom", { pseudo, room });
  };

  const handleReady = () => {
    socket.emit("playerReady", { room, id: socket.id });
    setIsReady(true);
  };

  const sendGuess = () => {
    if (guess.trim()) {
      socket.emit("guess", { room, pseudo, answer: guess });
      setGuess("");
    }
  };

  if (!pseudo) return <Home onJoin={handleJoin} />;

  if (winner) {
    return (
      <div className="text-white text-center mt-20 text-3xl">
        🎉 {winner} a gagné la manche !
      </div>
    );
  }

  return (
    <div className="text-white text-center mt-10 text-3xl">
      Bienvenue <span className="text-green-400">{pseudo}</span> dans la room{" "}
      <span className="text-blue-400">{room}</span> 🎉
      {!imageUrl && (
        <>
          <div className="mt-6 text-xl text-white">
            Joueurs dans la room :
            <ul className="mt-2">
              {players.map((player) => (
                <li key={player.id} className="text-green-400">
                  {player.pseudo}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={handleReady}
            disabled={isReady}
            className="mt-6 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
          >
            {isReady ? "En attente des autres..." : "✅ Je suis prêt"}
          </button>
        </>
      )}
      {imageUrl && (
        <div className="mt-10 flex flex-col items-center gap-4">
          <PixelatedImage src={imageUrl} step={pixelStep} />
          <input
            type="text"
            placeholder="Devine l'album"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            className="px-4 py-2 text-black rounded"
          />
          <button
            onClick={sendGuess}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Valider
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
