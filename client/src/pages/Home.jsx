import avatars from "../assets/avatars";
import { useState } from "react";
import "../App.css";

function Home({ onJoin }) {
  const [pseudo, setPseudo] = useState("");
  const [room, setRoom] = useState("");
  const [avatarIndex, setAvatarIndex] = useState(0);

  const handleSubmit = () => {
    if (pseudo && room) {
      onJoin({ pseudo, room, avatar: avatars[avatarIndex] });
    }
  };

  const nextAvatar = () => {
    setAvatarIndex((prev) => (prev + 1) % avatars.length);
  };

  const prevAvatar = () => {
    setAvatarIndex((prev) => (prev - 1 + avatars.length) % avatars.length);
  };

  return (
    <div
      className="text-white text-center flex flex-col items-center"
      style={{ marginTop: "4rem" }}
    >
      <div style={{ marginBottom: "3rem" }}>
        <h1 className="text-5xl font-bold">🎵 Guess the Cover</h1>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p className="text-xl mb-4">Choisis ton avatar :</p>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={prevAvatar}
            className="text-4xl hover:text-yellow-300"
          >
            ⬅️
          </button>
          <img
            src={avatars[avatarIndex]}
            alt="avatar"
            className="avatar-circle"
          />
          <button
            onClick={nextAvatar}
            className="text-4xl hover:text-yellow-300"
          >
            ➡️
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "2.5rem" }}>
        <div className="flex justify-center gap-4">
          <input
            type="text"
            placeholder="Ton pseudo"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            className="px-4 py-2 text-black rounded"
          />
        </div>
      </div>

      <div style={{ marginBottom: "2.5rem" }}>
        <div className="flex justify-center gap-4">
          <input
            type="text"
            placeholder="Nom de la room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="px-4 py-2 text-black rounded"
          />
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
        >
          Rejoindre
        </button>
      </div>
    </div>
  );
}

export default Home;
