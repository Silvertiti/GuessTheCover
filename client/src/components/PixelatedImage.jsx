import { useRef, useEffect } from "react";

export default function PixelatedImage({ src, step }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const displaySize = 256;

      const clampedStep = Math.min(Math.max(step, 0), 7); // sécurité
      const resolution = Math.pow(2, clampedStep + 1); // 2^1=2 ... 2^8=256

      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");

      tempCanvas.width = resolution;
      tempCanvas.height = resolution;
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.drawImage(img, 0, 0, resolution, resolution);

      canvas.width = displaySize;
      canvas.height = displaySize;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, displaySize, displaySize);
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        resolution,
        resolution,
        0,
        0,
        displaySize,
        displaySize
      );
    };

    img.onerror = () => {
      console.error("❌ Erreur chargement image :", src);
    };
  }, [src, step]);

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={256}
      className="rounded-lg border border-white"
      style={{ width: "256px", height: "256px" }}
    />
  );
}
