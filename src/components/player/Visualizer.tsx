import React, { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { useReducedMotion } from "motion/react";

export type VisualizerMode = "bars" | "waveform" | "radial" | "off";

interface VisualizerProps {
  mode?: VisualizerMode;
  className?: string;
  accentColor?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  mode = "bars",
  className = "",
  accentColor = "#9b7bff",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, currentTimeMs } = usePlayerStore();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (mode === "off") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    // Synthetic audio spectrum simulation driven by playback time and musical frequencies
    const binCount = 36;
    const bins = new Float32Array(binCount);

    const render = () => {
      // Pause drawing if playback stopped to eliminate idle CPU/GPU work
      if (!isPlaying) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      phase += 0.04;
      const timeSec = currentTimeMs / 1000;

      // Generate reactive frequency bins
      for (let i = 0; i < binCount; i++) {
        const freqOffset = i * 0.25;
        const wave1 = Math.sin(phase * 1.5 + freqOffset);
        const wave2 = Math.cos(timeSec * 2.2 - freqOffset * 0.8);
        const bassBoost = i < 6 ? 1.3 : 1.0;
        let val = Math.max(0.08, (Math.sin(wave1 + wave2) * 0.45 + 0.5) * bassBoost);
        if (shouldReduceMotion) val *= 0.4;
        bins[i] = val;
      }

      if (mode === "bars") {
        const barWidth = Math.max(3, (width - (binCount - 1) * 3) / binCount);
        for (let i = 0; i < binCount; i++) {
          const barHeight = bins[i] * height * 0.85;
          const x = i * (barWidth + 3);
          const y = height - barHeight;

          const gradient = ctx.createLinearGradient(0, height, 0, y);
          gradient.addColorStop(0, "rgba(155, 123, 255, 0.15)");
          gradient.addColorStop(1, accentColor);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();
        }
      } else if (mode === "waveform") {
        ctx.beginPath();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = shouldReduceMotion ? 0 : 8;

        const sliceWidth = width / binCount;
        let x = 0;

        for (let i = 0; i < binCount; i++) {
          const v = bins[i];
          const y = height / 2 + (v - 0.5) * height * 0.7;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (mode === "radial") {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.28;

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;

        for (let i = 0; i < binCount; i++) {
          const angle = (i / binCount) * Math.PI * 2;
          const barLen = bins[i] * radius * 0.6;
          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + barLen);
          const y2 = centerY + Math.sin(angle) * (radius + barLen);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, isPlaying, currentTimeMs, accentColor, shouldReduceMotion]);

  if (mode === "off") return null;

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={100}
      className={`pointer-events-none w-full ${className}`}
    />
  );
};
