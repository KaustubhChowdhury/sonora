import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Search,
  Radio,
  Music,
  Sliders,
  LayoutGrid,
  Play,
  Pause,
  ChevronDown,
  Sparkles,
  Settings,
  X,
  Compass,
} from "lucide-react";
import { YoutubeIcon } from "../shared/ProviderIcons";
import { useUiStore, AppRoute } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";

export const FloatingIslandNav: React.FC = () => {
  const { activeRoute, navigate, sidebarOpen, toggleSidebar, setFullPlayerOpen, isFullPlayerOpen } = useUiStore();
  const { isPlaying, togglePlayPause, currentTrack } = usePlayerStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const isHomeActive = activeRoute === "home";
  const isSearchActive = activeRoute === "search";
  const isJioActive = activeRoute === "jiosaavn";
  const isYtActive = activeRoute === "youtube";
  const isStudioActive = activeRoute === "audio-studio";

  return (
    <div className="fixed bottom-[104px] left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none">
      {/* Outer Floating Pill Island Dock */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-full bg-[#121620]/80 backdrop-blur-2xl border border-white/[0.14] shadow-[0_20px_50px_rgba(0,0,0,0.65)] hover:border-white/[0.22] transition-colors"
      >
        {/* SEGMENT 1: Segmented Pill (Home + Hairline Divider + Search) */}
        <div className="flex items-center bg-[#1c2331]/80 hover:bg-[#222b3d]/90 border border-white/[0.08] rounded-full p-1 pl-3.5 pr-3.5 gap-2.5 transition-colors">
          {/* Home Button */}
          <button
            onClick={() => navigate("home")}
            title="Home Streaming Hub"
            className={`flex items-center gap-1.5 p-1 rounded-full transition-colors relative ${
              isHomeActive ? "text-purple-300 font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Home className="w-4 h-4" />
            {isHomeActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
            )}
          </button>

          {/* Hairline vertical divider */}
          <div className="w-[1px] h-4 bg-white/15" />

          {/* Search Button */}
          <button
            onClick={() => navigate("search")}
            title="Standalone Search Engine"
            className={`flex items-center gap-1.5 p-1 rounded-full transition-colors relative ${
              isSearchActive ? "text-cyan-300 font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Search className="w-4 h-4" />
            {isSearchActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
            )}
          </button>
        </div>

        {/* SEGMENT 2: Streaming Hub Switcher Pill (with Dropdown Chevron) */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Switch Streaming Source (JioSaavn / YouTube Music)"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all ${
              isJioActive
                ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
                : isYtActive
                ? "bg-red-950/60 border-red-500/40 text-red-300"
                : "bg-[#1c2331]/80 hover:bg-[#222b3d]/90 border-white/[0.08] text-zinc-300 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isJioActive ? (
                <>
                  <Music className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold">JioSaavn</span>
                </>
              ) : isYtActive ? (
                <>
                  <YoutubeIcon className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold">YouTube</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium">Streams</span>
                </>
              )}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 text-zinc-400 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Micro-Dropdown Popover */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-52 p-1.5 rounded-2xl bg-[#141923]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl space-y-1"
              >
                <button
                  onClick={() => {
                    navigate("jiosaavn");
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isJioActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                      : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-cyan-400" />
                    <span>JioSaavn Music</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                    320K
                  </span>
                </button>

                <button
                  onClick={() => {
                    navigate("youtube");
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isYtActive
                      ? "bg-red-500/20 text-red-300 border border-red-500/30 font-semibold"
                      : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <YoutubeIcon className="w-4 h-4 text-red-500" />
                    <span>YouTube Music</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 border border-red-500/40 text-red-300">
                    LIVE
                  </span>
                </button>

                <button
                  onClick={() => {
                    navigate("explore");
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <Compass className="w-4 h-4 text-purple-400" />
                  <span>Explore & CC Radio</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SEGMENT 3: Circular Button (Audio Studio & DSP) */}
        <button
          onClick={() => navigate("audio-studio")}
          title="Audio Studio & Parametric Equalizer"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border ${
            isStudioActive
              ? "bg-purple-600/30 border-purple-500 text-purple-300 shadow-md shadow-purple-950/40"
              : "bg-[#1c2331]/80 hover:bg-[#222b3d]/90 border-white/[0.08] text-zinc-300 hover:text-white"
          }`}
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* SEGMENT 4: Circular Button (Sidebar / Library Toggle) */}
        <button
          onClick={toggleSidebar}
          title={sidebarOpen ? "Hide Sidebar" : "Show Library & Vault Sidebar"}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border ${
            sidebarOpen
              ? "bg-white/[0.18] border-white/30 text-white"
              : "bg-[#1c2331]/80 hover:bg-[#222b3d]/90 border-white/[0.08] text-zinc-300 hover:text-white"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        {/* SEGMENT 5: Signature Coral / Red Circular Button (End Cap) */}
        <button
          onClick={togglePlayPause}
          title={isPlaying ? "Pause Playback" : "Resume Playback"}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f43f5e] via-[#fb7185] to-[#f43f5e] hover:from-[#e11d48] hover:to-[#f43f5e] text-white flex items-center justify-center shadow-lg shadow-rose-500/40 hover:scale-105 active:scale-95 transition-all"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>
      </motion.nav>
    </div>
  );
};