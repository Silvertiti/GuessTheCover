import React, { useState, useEffect } from "react";
import PixelatedImage from "../components/PixelatedImage";

function Game({ socket, room, pseudo, players, imageUrl, roundInfo }) {
  const [pixelStep, setPixelStep] = useState(0);
  const [guess, setGuess] = useState("");
  const [foundArtist, setFoundArtist] = useState(false);
  const [foundAlbum, setFoundAlbum] = useState(false);
  const [artistBy, setArtistBy] = useState("");
  const [albumBy, setAlbumBy] = useState("");
  const [timer, setTimer] = useState(10);
  const MAX_STEP = 7;
  const [notifiedServer, setNotifiedServer] = useState(false);

  useEffect(() => {
    setPixelStep(0);
    setTimer(20);
    setFoundArtist(false);
    setFoundAlbum(false);
    setArtistBy("");
    setAlbumBy("");
    setNotifiedServer(false);
  }, [imageUrl]);

  // Pixelation progressive
  useEffect(() => {
    if (imageUrl && pixelStep < MAX_STEP && (!foundArtist || !foundAlbum)) {
      const interval = setInterval(() => {
        setPixelStep((prev) => {
          const nextStep = prev + 1;
          if (nextStep === MAX_STEP && !notifiedServer) {
            socket.emit("imageFullyRevealed", { room });
            setNotifiedServer(true);
          }
          return nextStep;
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [
    imageUrl,
    pixelStep,
    foundArtist,
    foundAlbum,
    notifiedServer,
    room,
    socket,
  ]);

  // Timer visuel
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [imageUrl]);

  // Mise à jour des réponses trouvées
  useEffect(() => {
    socket.on(
      "answerUpdate",
      ({ foundArtist, foundAlbum, artistBy, albumBy }) => {
        setFoundArtist(foundArtist);
        setFoundAlbum(foundAlbum);
        setArtistBy(artistBy);
        setAlbumBy(albumBy);
      }
    );

    return () => {
      socket.off("answerUpdate");
    };
  }, [socket]);

  const sendGuess = () => {
    if (guess.trim()) {
      socket.emit("guess", { room, pseudo, answer: guess });
      setGuess("");
    }
  };

  return (
    <div className="text-white text-center mt-10 text-3xl">
      <p>
        🎮 Manche {roundInfo.round} / {roundInfo.totalRounds}
      </p>
      <div className="text-xl text-yellow-400 mb-4">
        ⏱ Temps restant : {timer}s
      </div>

      {imageUrl && (
        <div className="flex flex-col items-center gap-4">
          <PixelatedImage src={imageUrl} step={pixelStep} />

          <div className="w-[256px] h-2 bg-gray-700 mt-2 rounded overflow-hidden">
            <div
              className="bg-green-400 h-full transition-all"
              style={{ width: `${(pixelStep / MAX_STEP) * 100}%` }}
            ></div>
          </div>

          <div className="text-xl mt-4">
            <p>
              Artiste :{" "}
              <span className={foundArtist ? "text-green-400" : "text-red-400"}>
                {foundArtist ? `Trouvé par ${artistBy}` : "Non trouvé"}
              </span>
            </p>
            <p>
              Album :{" "}
              <span className={foundAlbum ? "text-green-400" : "text-red-400"}>
                {foundAlbum ? `Trouvé par ${albumBy}` : "Non trouvé"}
              </span>
            </p>
          </div>

          <input
            type="text"
            placeholder="Devine artiste ou album"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            className="px-4 py-2 text-black rounded"
            disabled={foundArtist && foundAlbum}
          />
          <button
            onClick={sendGuess}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            disabled={foundArtist && foundAlbum}
          >
            Valider
          </button>
        </div>
      )}
    </div>
  );
}

export default Game;
