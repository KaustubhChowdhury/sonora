import React from "react";
import {
  Home,
  Search,
  Music2,
  Disc3,
  Users2,
  FolderTree,
  Star,
  History,
  Compass,
  Sliders,
  Settings,
  Plus,
  ListMusic,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useUiStore, AppRoute } from "../../stores/uiStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { useAudioStudioStore } from "../../stores/audioStudioStore";
import { usePlayerStore } from "../../stores/playerStore";

export const Sidebar: React.FC = () => {
  const { activeRoute, navigate } = useUiStore();
  const { playlists, addPlaylist, activeView, setActiveView } = useLibraryStore();
  const { outputMode } = useAudioStudioStore();
  const { outputStatus } = usePlayerStore();

  const handleCreatePlaylist = () => {
    const name = prompt("Enter new playlist name:");
    if (name && name.trim()) {
      addPlaylist(name.trim());
    }
  };

  const navItem = (
    label: string,
    icon: React.ReactNode,
    targetRoute: AppRoute,
    subView?: "songs" | "albums" | "artists" | "folders" | "favourites" | "history"
  ) => {
    const isRouteActive = activeRoute === targetRoute;
    const isViewActive = subView ? isRouteActive && activeView === subView : isRouteActive;

    return (
      <button
        onClick={() => {
          if (subView) {
            setActiveView(subView);
          }
          navigate(targetRoute);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left select-none ${
          isViewActive
            ? "bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/20"
            : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
        }`}
      >
        <span className={isViewActive ? "text-purple-400" : "text-zinc-500"}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <aside className="w-[235px] shrink-0 h-full flex flex-col bg-surface/90 border-r border-white/[0.06] p-3 text-zinc-300 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3 py-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-purple-950/40">
            <span className="font-bold text-sm tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-zinc-100 uppercase">
              Sonora
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-tight -mt-0.5">
              Local-First Studio
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="space-y-1 mb-4">
        {navItem("Home", <Home className="w-4 h-4" />, "home")}
        {navItem("Search", <Search className="w-4 h-4" />, "search")}
        {navItem("Explore & Radio", <Compass className="w-4 h-4" />, "explore")}
      </div>

      {/* Library Section */}
      <div className="mb-4">
        <div className="px-3 pb-1 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
          Library
        </div>
        <div className="space-y-0.5">
          {navItem("Tracks", <Music2 className="w-4 h-4" />, "library", "songs")}
          {navItem("Albums", <Disc3 className="w-4 h-4" />, "library", "albums")}
          {navItem("Artists", <Users2 className="w-4 h-4" />, "library", "artists")}
          {navItem("Folders", <FolderTree className="w-4 h-4" />, "library", "folders")}
          {navItem("Favourites", <Star className="w-4 h-4" />, "library", "favourites")}
          {navItem("History", <History className="w-4 h-4" />, "library", "history")}
        </div>
      </div>

      {/* Playlists Section */}
      <div className="flex-1 min-h-0 flex flex-col mb-4">
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
            Playlists
          </span>
          <button
            onClick={handleCreatePlaylist}
            title="Create new playlist"
            className="p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 text-xs">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => navigate("playlists", { playlistId: pl.id })}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs truncate transition-colors text-left ${
                activeRoute === "playlists"
                  ? "bg-white/[0.06] text-zinc-100 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
              }`}
            >
              <ListMusic className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{pl.name}</span>
              {pl.isSmart && (
                <span className="ml-auto text-[9px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  auto
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Area: Audio Studio & Settings */}
      <div className="pt-2 border-t border-white/[0.06] space-y-1">
        <button
          onClick={() => navigate("audio-studio")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeRoute === "audio-studio"
              ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Audio Studio</span>
          </div>
          {outputMode === "exclusive" || outputStatus.isBitPerfect ? (
            <span
              title="Exclusive Bit-Perfect Direct Output active"
              className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30"
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>DIRECT</span>
            </span>
          ) : (
            <span
              title="Shared mode Windows mixer"
              className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
            >
              <Zap className="w-2.5 h-2.5 text-zinc-500" />
              <span>SHARED</span>
            </span>
          )}
        </button>

        {navItem("Settings", <Settings className="w-4 h-4" />, "settings")}
      </div>
    </aside>
  );
};
