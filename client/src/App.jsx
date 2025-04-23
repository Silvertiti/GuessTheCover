import { useState, useEffect } from "react";
import Home from "./pages/Home";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

function App() {
  const [pseudo, setPseudo] = useState("");
  const [room, setRoom] = useState("");
  const [players, setPlayers] = useState([]);

  // Connexion socket initiale
  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 Connecté au serveur avec ID :", socket.id);
    });

    socket.on("playersInRoom", (playersList) => {
      console.log("✅ Liste des joueurs reçue :", playersList);
      setPlayers(playersList);
    });

    // Nettoyage des événements
    return () => {
      socket.off("connect");
      socket.off("playersInRoom");
    };
  }, []);

  const handleJoin = ({ pseudo, room }) => {
    setPseudo(pseudo);
    setRoom(room);
    socket.emit("joinRoom", { pseudo, room });
  };

  return (
    <>
      {!pseudo ? (
        <Home onJoin={handleJoin} />
      ) : (
        <div className="text-white text-center mt-10 text-3xl">
          Bienvenue <span className="text-green-400">{pseudo}</span> dans la
          room <span className="text-blue-400">{room}</span> 🎉
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
        </div>
      )}
    </>
  );
}

export default App;
