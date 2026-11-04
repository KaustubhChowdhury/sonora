import React, { useState, useRef, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  ListMusic,
  Zap,
  Music,
  Minus,
  Square,
  X,
  Sliders,
} from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";
import { useAudioStudioStore } from "../../stores/audioStudioStore";
import { useUiStore } from "../../stores/uiStore";
import { TauriBridge, isTauri } from "../../services/tauriBridge";

export const TopMusicBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTimeMs,
    durationMs,
    volume,
    isMuted,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
  } = usePlayerStore();

  const { boosterSettings, toggleBooster, setBoosterModalOpen } = useAudioStudioStore();
  const { toggleInspector, setFullPlayerOpen } = useUiStore();

  const [isMaximized, setIsMaximized] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTauri()) {
      const appWindow = getCurrentWindow();
      appWindow.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => {
    if (isTauri()) getCurrentWindow().minimize();
  };

  const handleMaximizeToggle = async () => {
    if (isTauri()) {
      const appWindow = getCurrentWindow();
      const max = await appWindow.isMaximized();
      if (max) {
        await appWindow.unmaximize();
        setIsMaximized(false);
      } else {
        await appWindow.maximize();
        setIsMaximized(true);
      }
    }
  };

  const handleClose = () => {
    if (isTauri()) getCurrentWindow().close();
  };

  const formatTime = (ms: number) => {
    if (!ms || isNaN(ms)) return "0:00";
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    seek(newTime);
    TauriBridge.seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    TauriBridge.setVolume(newVol);
  };

  // Close volume popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (volumeContainerRef.current && !volumeContainerRef.current.contains(e.target as Node)) {
        setShowVolumeSlider(false);
      }
    };
    if (showVolumeSlider) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showVolumeSlider]);

  return (
    <header
      data-tauri-drag-region
      className="h-14 w-full bg-[#0d0f15]/95 backdrop-blur-2xl border-b border-white/[0.08] flex items-center justify-between px-3.5 select-none z-50 shrink-0 shadow-lg shadow-black/40"
    >
      {/* LEFT: Track Info (Now Playing) */}
      <div
        data-tauri-drag-region
        className="flex items-center gap-3 min-w-[220px] max-w-[320px] cursor-pointer group"
        onClick={() => setFullPlayerOpen(true)}
      >
        <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0 shadow-sm">
          {currentTrack?.artworkUrl ? (
            <img
              src={currentTrack.artworkUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-850 text-zinc-500">
              <Music className="w-4 h-4" />
            </div>
          )}
          {isPlaying && (
            <div className="absolute inset-0 bg-[#b4ff39]/10 pointer-events-none ring-1 ring-inset ring-[#b4ff39]/40" />
          )}
        </div>

        <div className="overflow-hidden space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-white truncate group-hover:text-[#b4ff39] transition-colors leading-tight">
              {currentTrack?.title || "Sonora Audio Master"}
            </h4>
            {currentTrack?.providerId === "jiosaavn" && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 shrink-0">
                320K
              </span>
            )}
            {currentTrack?.providerId === "youtube" && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-red-950/80 text-red-300 border border-red-500/30 shrink-0">
                YT
              </span>
            )}
            {currentTrack?.sourceKind === "local" && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shrink-0">
                {currentTrack.codec || "LOSSLESS"}
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 truncate">
            {currentTrack?.artists ? currentTrack.artists.join(", ") : "Ready to play studio sound"}
          </p>
        </div>
      </div>

      {/* CENTER: Music Transport & Timeline Scrubber */}
      <div className="flex items-center gap-4 flex-1 max-w-xl justify-center px-4">
        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevTrack}
            title="Previous Track"
            className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={togglePlayPause}
            title={isPlaying ? "Pause" : "Play"}
            className="w-8 h-8 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            title="Next Track"
            className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <span className="text-[10px] font-mono text-zinc-400 w-8 text-right shrink-0">
            {formatTime(currentTimeMs)}
          </span>

          <div className="relative flex items-center w-full group py-1">
            <input
              type="range"
              min={0}
              max={durationMs || 100}
              value={currentTimeMs}
              onChange={handleSeekChange}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#b4ff39] group-hover:h-2 transition-all"
            />
          </div>

          <span className="text-[10px] font-mono text-zinc-500 w-8 shrink-0">
            {formatTime(durationMs)}
          </span>
        </div>
      </div>

      {/* RIGHT: Super Audio Booster + Volume + Queue + Window Controls */}
      <div className="flex items-center gap-2">
        {/* Super Audio Booster Button */}
        <button
          onClick={() => setBoosterModalOpen(true)}
          title="Super Audio Booster (Loudness Preamp, Sub-Bass Punch & Zero-Clip Limiter)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold transition-all ${
            boosterSettings.enabled
              ? "bg-[#b4ff39] text-[#111216] shadow-md shadow-[#b4ff39]/40 hover:scale-105 active:scale-95 border border-[#b4ff39]"
              : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.08]"
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${boosterSettings.enabled ? "fill-current" : ""}`} />
          <span>
            {boosterSettings.enabled
              ? `BOOST +${boosterSettings.preampBoostDb.toFixed(0)}dB`
              : "BOOST"}
          </span>
        </button>

        {/* Volume Popover */}
        <div className="relative" ref={volumeContainerRef}>
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            title="Volume Control"
            className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.08]"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <AnimatePresence>
            {showVolumeSlider && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                className="absolute top-full mt-2 right-0 p-3 rounded-2xl bg-[#141821]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl flex items-center gap-2 w-40 z-50"
              >
                <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#b4ff39]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Queue Toggle */}
        <button
          onClick={() => toggleInspector("queue")}
          title="Playback Queue"
          className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.08]"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Full Player Expander */}
        <button
          onClick={() => setFullPlayerOpen(true)}
          title="Full Player"
          className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.08]"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Hairline Divider */}
        <div className="w-[1px] h-5 bg-white/10 mx-1" />

        {/* Native Windows Caption Buttons */}
        <div className="flex items-center">
          <button
            onClick={handleMinimize}
            title="Minimize"
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors rounded"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximizeToggle}
            title={isMaximized ? "Restore Down" : "Maximize"}
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors rounded"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            title="Close"
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-rose-600 transition-colors rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
