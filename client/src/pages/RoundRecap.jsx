import React, { useEffect, useState } from "react";
import PixelatedImage from "../components/PixelatedImage";

function RoundRecap({ data, onNext }) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          onNext();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onNext]);

  return (
    <div className="text-white text-center mt-10 text-2xl">
      <h2 className="text-3xl mb-4">🕹️ Résultat du round</h2>
      <PixelatedImage src={data.imageUrl} step={7} />

      <div className="mt-4">
        <p>
          🎤 Artiste : <span className="text-green-400">{data.artist}</span>{" "}
          {data.artistBy ? `(trouvé par ${data.artistBy})` : "(non trouvé)"}
        </p>
        <p>
          💿 Album : <span className="text-blue-400">{data.album}</span>{" "}
          {data.albumBy ? `(trouvé par ${data.albumBy})` : "(non trouvé)"}
        </p>
      </div>

      <div className="mt-6 text-yellow-300 text-xl">
        ⏱️ Prochain round dans {countdown} secondes...
      </div>
    </div>
  );
}

export default RoundRecap;
