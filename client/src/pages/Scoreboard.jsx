import React from "react";

function Scoreboard({ scores, players, onReplay }) {
  return (
    <div className="text-white text-center mt-10 text-3xl">
      <h2 className="mb-4 text-4xl">🏆 Score final</h2>
      <ul className="text-xl mb-6">
        {players
          .map((p) => ({ name: p.pseudo, score: scores[p.pseudo] || 0 }))
          .sort((a, b) => b.score - a.score)
          .map(({ name, score }) => (
            <li key={name} className="text-yellow-400">
              {name} : {score} pts
            </li>
          ))}
      </ul>
      <button
        onClick={onReplay}
        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
      >
        🔁 Rejouer
      </button>
    </div>
  );
}

export default Scoreboard;
