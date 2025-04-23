import { useState } from "react";

export default function Home({ onJoin }) {
  const [pseudo, setPseudo] = useState("");

  const handleJoin = () => {
    if (pseudo.trim()) {
      onJoin(pseudo);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">🎵 Guess The Cover</h1>
      <input
        type="text"
        placeholder="Entre ton pseudo"
        className="px-4 py-2 text-black rounded"
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
      />
      <button
        onClick={handleJoin}
        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white"
      >
        Rejoindre la partie
      </button>
    </div>
  );
}
