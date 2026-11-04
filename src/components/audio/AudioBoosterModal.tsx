import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Volume2,
  X,
  Sparkles,
  ShieldCheck,
  Flame,
  Radio,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { useAudioStudioStore, BOOSTER_PRESETS } from "../../stores/audioStudioStore";
import { AudioEngine } from "../../services/audioEngine";

export const AudioBoosterModal: React.FC = () => {
  const {
    boosterSettings,
    isBoosterModalOpen,
    setBoosterModalOpen,
    toggleBooster,
    setBoosterPreamp,
    setBoosterBass,
    setBoosterClarity,
    applyBoosterPreset,
  } = useAudioStudioStore();

  // Sync to AudioEngine whenever booster settings change
  useEffect(() => {
    AudioEngine.updateBooster(
      boosterSettings.enabled,
      boosterSettings.preampBoostDb,
      boosterSettings.bassBoostDb,
      boosterSettings.clarityBoostDb
    );
  }, [
    boosterSettings.enabled,
    boosterSettings.preampBoostDb,
    boosterSettings.bassBoostDb,
    boosterSettings.clarityBoostDb,
  ]);

  if (!isBoosterModalOpen) return null;

  const volumeMultiplier = Math.round(Math.pow(10, boosterSettings.preampBoostDb / 20) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="relative w-full max-w-lg p-6 rounded-3xl bg-[#12141a]/95 border border-white/[0.14] shadow-[0_25px_60px_rgba(0,0,0,0.85)] space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  boosterSettings.enabled
                    ? "bg-[#b4ff39] text-[#111216] shadow-lg shadow-[#b4ff39]/30"
                    : "bg-white/[0.06] text-zinc-400"
                }`}
              >
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Super Audio Booster
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                      boosterSettings.enabled
                        ? "bg-[#b4ff39]/20 text-[#b4ff39] border-[#b4ff39]/40"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700"
                    }`}
                  >
                    {boosterSettings.enabled ? "ACTIVE" : "BYPASSED"}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Preamp volume boost, sub-bass blast & zero-clip limiter
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setBoosterModalOpen(false)}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Master Power Toggle Button */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-zinc-200">Booster Power</span>
              <p className="text-[11px] text-zinc-400">
                Enhance volume up to 400% without sound clipping
              </p>
            </div>
            <button
              onClick={toggleBooster}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                boosterSettings.enabled
                  ? "bg-[#b4ff39] hover:bg-[#a3e635] text-[#111216] shadow-md shadow-[#b4ff39]/40"
                  : "bg-white/[0.08] hover:bg-white/[0.15] text-zinc-300"
              }`}
            >
              {boosterSettings.enabled ? "BOOST ON" : "BOOST OFF"}
            </button>
          </div>

          {/* 1. Preamp Volume Multiplier Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#b4ff39]" />
                Volume Loudness Multiplier
              </span>
              <span className="font-mono font-extrabold text-[#b4ff39] text-sm">
                {volumeMultiplier}% ({boosterSettings.preampBoostDb > 0 ? `+${boosterSettings.preampBoostDb.toFixed(1)} dB` : "0 dB"})
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={14}
              step={0.5}
              value={boosterSettings.preampBoostDb}
              disabled={!boosterSettings.enabled}
              onChange={(e) => setBoosterPreamp(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#b4ff39] disabled:opacity-40"
            />

            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>100% (Normal)</span>
              <span>200% (+6dB)</span>
              <span>300% (+9.5dB)</span>
              <span>400% (+12dB Max)</span>
            </div>
          </div>

          {/* 2. Sub-Bass & Punch Booster */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-cyan-400" />
                Sub-Bass Blast Punch (40Hz - 90Hz)
              </span>
              <span className="font-mono font-bold text-cyan-400">
                +{boosterSettings.bassBoostDb.toFixed(1)} dB
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={boosterSettings.bassBoostDb}
              disabled={!boosterSettings.enabled}
              onChange={(e) => setBoosterBass(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
            />
          </div>

          {/* 3. Vocal Clarity & Treble Shine */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Vocal Clarity & Treble Air
              </span>
              <span className="font-mono font-bold text-purple-400">
                +{boosterSettings.clarityBoostDb.toFixed(1)} dB
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={boosterSettings.clarityBoostDb}
              disabled={!boosterSettings.enabled}
              onChange={(e) => setBoosterClarity(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-400 disabled:opacity-40"
            />
          </div>

          {/* One-Click Presets Grid */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Booster Presets
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.keys(BOOSTER_PRESETS).map((presetName) => {
                const isSelected = boosterSettings.activePreset === presetName;
                return (
                  <button
                    key={presetName}
                    onClick={() => {
                      if (!boosterSettings.enabled) toggleBooster();
                      applyBoosterPreset(presetName);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs font-medium truncate ${
                      isSelected && boosterSettings.enabled
                        ? "bg-[#b4ff39]/20 border-[#b4ff39]/50 text-white font-bold"
                        : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-zinc-300"
                    }`}
                  >
                    {presetName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anti-Clip Limiter Shield Indicator */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-[11px]">Hardware Soft-Limiter Anti-Clip Shield</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400">ACTIVE</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};