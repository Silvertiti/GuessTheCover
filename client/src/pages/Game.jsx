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

  useEffect(() => {
    setPixelStep(0);
    setTimer(10);
    setFoundArtist(false);
    setFoundAlbum(false);
    setArtistBy("");
    setAlbumBy("");
  }, [imageUrl]);

  useEffect(() => {
    if (imageUrl && pixelStep < 7 && (!foundArtist || !foundAlbum)) {
      const interval = setInterval(() => {
        setPixelStep((prev) => prev + 1);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [imageUrl, pixelStep, foundArtist, foundAlbum]);

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
  }, []);

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
