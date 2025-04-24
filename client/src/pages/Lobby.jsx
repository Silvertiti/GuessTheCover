import React, { useEffect, useState } from "react";

function Lobby({ socket, players, room, pseudo, scoreboard, roundInfo }) {
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const isHost = players.length > 0 && players[0].id === socket.id;

  const handleReady = () => {
    socket.emit("playerReady", { room, id: socket.id });
    setIsReady(true);
  };

  const handleSetRounds = (e) => {
    const rounds = parseInt(e.target.value);
    socket.emit("setRounds", { room, rounds });
  };

  useEffect(() => {
    if (roundInfo.round > 0 && roundInfo.round < roundInfo.totalRounds) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [roundInfo]);

  return (
    <div className="text-white text-center mt-10">
      <p className="text-xl">
        🎮 Salle d'attente : <span className="text-purple-400">{room}</span>
      </p>

      <div className="text-xl mt-6">
        <p className="text-2xl font-bold text-white mb-2">
          👥 Joueurs dans la room :
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          {players.map((p) => (
            <div
              key={p.id}
              className="player-card flex flex-col items-center p-4"
            >
              <div className="avatar-circle">
                <img
                  src={p.avatar}
                  alt={p.pseudo}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="mt-2">{p.pseudo}</p>
            </div>
          ))}
        </div>
      </div>

      {isHost && !isReady && (
        <div className="text-xl mt-6">
          <label>
            Nombre de manches :
            <select
              className="ml-2 px-2 py-1 text-black rounded"
              onChange={handleSetRounds}
              defaultValue={roundInfo.totalRounds || 5}
            >
              {[1, 3, 5, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <button
        onClick={handleReady}
        disabled={isReady}
        className="mt-6 px-6 py-2 bg-green-500 hover:bg-green-600 rounded disabled:opacity-50 text-white text-lg"
      >
        {isReady ? "En attente des autres..." : "✅ Je suis prêt"}
      </button>

      {countdown !== null && (
        <div className="mt-4 text-xl text-yellow-400">
          Prochaine manche dans... {countdown} sec
        </div>
      )}

      {Object.keys(scoreboard).length > 0 && (
        <div className="mt-6 text-xl">
          <h2 className="mb-2">🏆 Scores :</h2>
          <ul>
            {players.map((p) => (
              <li key={p.id}>
                {p.pseudo} :{" "}
                <span className="text-yellow-400">
                  {scoreboard[p.pseudo] || 0} pt
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-400 mt-2">
            Round {roundInfo.round} / {roundInfo.totalRounds}
          </p>
        </div>
      )}
    </div>
  );
}

export default Lobby;
