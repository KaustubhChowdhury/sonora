import React, { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Search, Minus, Square, X, ShieldCheck, Zap, PanelLeft } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useAudioStudioStore } from "../../stores/audioStudioStore";
import { isTauri } from "../../services/tauriBridge";

export const AppTitlebar: React.FC = () => {
  const { navigate, setInspectorTab, toggleSidebar, sidebarOpen } = useUiStore();
  const { outputStatus } = usePlayerStore();
  const { outputMode } = useAudioStudioStore();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isTauri()) {
      const appWindow = getCurrentWindow();
      appWindow.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => {
    if (isTauri()) {
      getCurrentWindow().minimize();
    }
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
    if (isTauri()) {
      getCurrentWindow().close();
    }
  };

  return (
    <header
      data-tauri-drag-region
      className="h-10 w-full bg-[#0b0d12]/95 border-b border-white/[0.06] flex items-center justify-between px-3 select-none z-50 shrink-0"
    >
      {/* Left: Sonora Brand Mark & Drag Zone */}
      <div data-tauri-drag-region className="flex items-center gap-2.5">
        <button
          onClick={toggleSidebar}
          title={sidebarOpen ? "Hide Left Sidebar" : "Show Left Sidebar"}
          className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#9b7bff] to-[#6366f1] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
          S
        </div>
        <span className="text-xs font-bold tracking-wider text-zinc-200 uppercase font-sans">
          Sonora
        </span>
        <span className="text-[10px] text-cyan-400 font-mono hidden sm:inline font-semibold">
          Streaming Studio
        </span>
      </div>

      {/* Center: Global Quick Search Pill (Ctrl+K) */}
      <div
        onClick={() => navigate("search")}
        className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors max-w-sm w-full mx-4 justify-between"
      >
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px]">Quick search tracks, albums, artists...</span>
        </div>
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono border border-white/[0.05]">
          Ctrl+K
        </kbd>
      </div>

      {/* Right: Audio Status Pill & Native Window Controls */}
      <div className="flex items-center gap-2">
        {/* Output Mode Quick Pill */}
        <button
          onClick={() => navigate("audio-studio")}
          title="Open Audio Studio"
          className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors"
        >
          {outputMode === "exclusive" || outputStatus.isBitPerfect ? (
            <span className="flex items-center gap-1 text-purple-300 font-semibold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>BIT-PERFECT</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/5">
              <Zap className="w-2.5 h-2.5 text-zinc-400" />
              <span>SHARED</span>
            </span>
          )}
        </button>

        {/* Windows Caption Buttons */}
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
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 transition-colors rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
