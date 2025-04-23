import { useState, useEffect } from "react";
import Home from "./pages/Home";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001"); // Ton serveur backend

function App() {
  const [pseudo, setPseudo] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 Connecté au serveur avec ID :", socket.id);
    });
  }, []);

  const handleJoin = (name) => {
    setPseudo(name);
    socket.emit("join", name); // on envoie le pseudo au serveur
  };

  return (
    <>
      {!pseudo ? (
        <Home onJoin={handleJoin} />
      ) : (
        <div className="text-white text-center mt-20 text-3xl">
          Bienvenue, {pseudo} !
        </div>
      )}
    </>
  );
}

export default App;
