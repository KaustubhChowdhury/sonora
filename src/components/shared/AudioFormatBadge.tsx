import React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

interface AudioFormatBadgeProps {
  codec?: string;
  sampleRate?: number;
  bitDepth?: number;
  isBitPerfect?: boolean;
  className?: string;
  compact?: boolean;
}

export const AudioFormatBadge: React.FC<AudioFormatBadgeProps> = ({
  codec = "FLAC",
  sampleRate = 44100,
  bitDepth = 16,
  isBitPerfect = false,
  className = "",
  compact = false,
}) => {
  const isLossless = ["FLAC", "WAV", "ALAC", "AIFF"].includes(codec.toUpperCase());
  const isHiRes = sampleRate > 48000 || (bitDepth && bitDepth > 16);
  const sampleRateKhz = (sampleRate / 1000).toFixed(sampleRate % 1000 === 0 ? 0 : 1);

  if (compact) {
    return (
      <span
        title={`Source: ${codec} ${sampleRate}Hz ${bitDepth}-bit ${isBitPerfect ? "• Bit-Perfect Output" : ""}`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight font-medium ${
          isBitPerfect
            ? "bg-purple-900/40 text-purple-300 border border-purple-500/30"
            : isHiRes
            ? "bg-amber-950/40 text-amber-300 border border-amber-500/30"
            : isLossless
            ? "bg-zinc-800 text-zinc-300 border border-zinc-700/60"
            : "bg-zinc-900 text-zinc-400 border border-zinc-800"
        } ${className}`}
      >
        {isBitPerfect && <ShieldCheck className="w-2.5 h-2.5 text-purple-400" />}
        {isHiRes && !isBitPerfect && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
        <span>{codec}</span>
        <span className="text-zinc-500">•</span>
        <span>{sampleRateKhz}k</span>
      </span>
    );
  }

  return (
    <div
      title={`Source: ${codec} ${sampleRate}Hz ${bitDepth}-bit | ${
        isBitPerfect
          ? "Delivered sample-for-sample via WASAPI Exclusive mode (DSP Bypassed)"
          : "Windows Shared Mode Audio (Shared Mixer)"
      }`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono tracking-tight ${
        isBitPerfect
          ? "bg-purple-950/50 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-950/20"
          : isHiRes
          ? "bg-amber-950/40 text-amber-200 border border-amber-500/40"
          : "bg-zinc-800/90 text-zinc-300 border border-zinc-700/60"
      } ${className}`}
    >
      {isBitPerfect ? (
        <>
          <ShieldCheck className="w-3 h-3 text-purple-400" />
          <span className="font-semibold text-purple-300">BIT-PERFECT</span>
          <span className="text-purple-400/50">/</span>
          <span>{codec}</span>
          <span className="text-zinc-400">{sampleRateKhz}kHz/{bitDepth}b</span>
        </>
      ) : isHiRes ? (
        <>
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="font-semibold text-amber-300">HI-RES</span>
          <span className="text-amber-400/50">/</span>
          <span>{codec}</span>
          <span className="text-zinc-400">{sampleRateKhz}kHz/{bitDepth}b</span>
        </>
      ) : (
        <>
          <span className="font-medium text-zinc-300">{codec}</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">{sampleRateKhz}kHz/{bitDepth}b</span>
        </>
      )}
    </div>
  );
};
