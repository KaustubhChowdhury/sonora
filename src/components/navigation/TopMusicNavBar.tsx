import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Search,
  Music,
  Sliders,
  LayoutGrid,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  ListMusic,
  Compass,
  Zap,
} from "lucide-react";
import { YoutubeIcon } from "../shared/ProviderIcons";
import { useUiStore, AppRoute } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useAudioStudioStore } from "../../stores/audioStudioStore";
import { TauriBridge } from "../../services/tauriBridge";

interface NavItemDef {
  id: AppRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "jiosaavn", label: "JioSaavn", icon: Music, accentColor: "#06b6d4" },
  { id: "youtube", label: "YouTube", icon: YoutubeIcon, accentColor: "#ef4444" },
  { id: "audio-studio", label: "Studio", icon: Sliders, accentColor: "#a855f7" },
  { id: "explore", label: "Explore", icon: Compass, accentColor: "#f59e0b" },
];

export const TopMusicNavBar: React.FC = () => {
  const { activeRoute, navigate, sidebarOpen, toggleSidebar, toggleInspector, setFullPlayerOpen } = useUiStore();
  const { boosterSettings, setBoosterModalOpen } = useAudioStudioStore();
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

  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeContainerRef = useRef<HTMLDivElement>(null);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;

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
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-6xl pointer-events-none select-none">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="pointer-events-auto flex items-center justify-between p-1.5 rounded-full bg-[#111216]/90 backdrop-blur-2xl border border-white/[0.14] shadow-[0_15px_40px_rgba(0,0,0,0.7)] transition-all"
      >
        {/* LEFT: Sixfold Navigation Capsule Bar (with Neon Lime #b4ff39 Active Pill) */}
        <div className="flex items-center gap-1.5 relative">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            const isHovered = hoveredNav === item.id;

            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredNav(item.id)}
                onMouseLeave={() => setHoveredNav(null)}
              >
                {/* Floating Tooltip with Neon-Lime Arrow (mirroring the reference) */}
                <AnimatePresence>
                  {isHovered && !isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.9 }}
                      transition={{ duration: 0.12 }}
                      className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-[#e2e4e9] text-[#111216] text-[10px] font-bold shadow-lg pointer-events-none flex flex-col items-center"
                    >
                      <span>{item.label}</span>
                      {/* Neon lime caret pointer */}
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#b4ff39] absolute -bottom-1" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => navigate(item.id)}
                  className={`relative flex items-center gap-1.5 transition-all text-xs ${
                    isActive
                      ? "px-4 py-2 rounded-full bg-[#b4ff39] text-[#111216] font-bold shadow-md shadow-[#b4ff39]/30"
                      : "w-9 h-9 rounded-full bg-[#1a1c22]/80 hover:bg-[#252830] text-zinc-400 hover:text-white justify-center border border-white/[0.06]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {isActive && (
                    <span className="font-extrabold tracking-tight truncate max-w-[80px]">
                      {item.label}
                    </span>
                  )}
                </button>
              </div>
            );
          })}

          {/* Library / Vault Drawer Toggle Button */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredNav("drawer")}
            onMouseLeave={() => setHoveredNav(null)}
          >
            <AnimatePresence>
              {hoveredNav === "drawer" && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.9 }}
                  className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-[#e2e4e9] text-[#111216] text-[10px] font-bold shadow-lg pointer-events-none flex flex-col items-center whitespace-nowrap"
                >
                  <span>{sidebarOpen ? "Hide Library" : "Open Library"}</span>
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#b4ff39] absolute -bottom-1" />
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={toggleSidebar}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                sidebarOpen
                  ? "bg-white/[0.2] border-white/30 text-white"
                  : "bg-[#1a1c22]/80 hover:bg-[#252830] border-white/[0.06] text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CENTER / RIGHT: Integrated Top Music Player Bar */}
        <div className="flex items-center gap-3 pr-1">
          {/* Hairline Divider */}
          <div className="w-[1px] h-6 bg-white/15 mx-1 hidden sm:block" />

          {/* Track Info (Click to open FullPlayer) */}
          <div
            onClick={() => setFullPlayerOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer max-w-[200px] md:max-w-[260px] overflow-hidden group"
          >
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
              {currentTrack?.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                  <Music className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white truncate group-hover:text-[#b4ff39] transition-colors leading-tight">
                {currentTrack?.title || "No track playing"}
              </h4>
              <p className="text-[10px] text-zinc-400 truncate">
                {currentTrack?.artists ? currentTrack.artists.join(", ") : "Select a song to play"}
              </p>
            </div>

            {/* Quality Badge */}
            {currentTrack?.bitrate && (
              <span
                className={`hidden lg:inline text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
                  currentTrack.providerId === "jiosaavn"
                    ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/40"
                    : currentTrack.providerId === "youtube"
                    ? "bg-red-950/80 text-red-300 border-red-500/40"
                    : "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                }`}
              >
                {currentTrack.providerId === "jiosaavn"
                  ? "320K"
                  : currentTrack.providerId === "youtube"
                  ? "YT"
                  : `${currentTrack.bitrate}k`}
              </span>
            )}
          </div>

          {/* Transport Controls (Prev, Play/Pause, Next) */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevTrack}
              title="Previous Track"
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-3.5 h-3.5 fill-current" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              title={isPlaying ? "Pause" : "Play"}
              className="w-8 h-8 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              title="Next Track"
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          {/* Scrubber & Duration */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400 w-8 text-right">
              {formatTime(currentTimeMs)}
            </span>

            <div className="relative flex items-center w-24 lg:w-36 group">
              <input
                type="range"
                min={0}
                max={durationMs || 100}
                value={currentTimeMs}
                onChange={handleSeekChange}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#b4ff39] group-hover:h-2 transition-all"
              />
            </div>

            <span className="text-[10px] font-mono text-zinc-500 w-8">
              {formatTime(durationMs)}
            </span>
          </div>

          {/* Audio Booster Button */}
          <button
            onClick={() => setBoosterModalOpen(true)}
            title="Super Audio Booster (Volume, Bass Punch, Clarity)"
            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all ${
              boosterSettings.enabled
                ? "bg-[#b4ff39] text-[#111216] shadow-md shadow-[#b4ff39]/40 hover:scale-105 active:scale-95"
                : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.08]"
            }`}
          >
            <Zap className={`w-3 h-3 ${boosterSettings.enabled ? "fill-current" : ""}`} />
            <span>{boosterSettings.enabled ? `BOOST +${boosterSettings.preampBoostDb.toFixed(0)}dB` : "BOOST"}</span>
          </button>

          {/* Volume Control Popover */}
          <div className="relative" ref={volumeContainerRef}>
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              title="Volume"
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
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute top-full mt-2 right-0 p-3 rounded-2xl bg-[#141821]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl flex items-center gap-2 w-36"
                >
                  <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#b4ff39]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Queue Inspector Toggle */}
          <button
            onClick={() => toggleInspector("queue")}
            title="Queue"
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
        </div>
      </motion.div>
    </div>
  );
};