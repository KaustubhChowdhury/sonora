import React, { useEffect, useRef } from "react";
import {
  Play,
  ListPlus,
  Radio,
  Star,
  ExternalLink,
  Sliders,
  FileText,
  Copy,
  FolderOpen,
} from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { TauriBridge } from "../../services/tauriBridge";

export const ContextMenu: React.FC = () => {
  const { contextMenu, closeContextMenu, showToast, toggleInspector, navigate } = useUiStore();
  const { playTrack, addToQueue } = usePlayerStore();
  const { toggleTrackFavourite } = useLibraryStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    if (contextMenu.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu.isOpen, closeContextMenu]);

  if (!contextMenu.isOpen || !contextMenu.track) return null;

  const track = contextMenu.track;

  const handlePlayNow = () => {
    playTrack(track);
    closeContextMenu();
  };

  const handlePlayNext = () => {
    addToQueue(track, true);
    showToast(`Added "${track.title}" to play next`);
    closeContextMenu();
  };

  const handleAddToQueue = () => {
    addToQueue(track, false);
    showToast(`Added "${track.title}" to queue`);
    closeContextMenu();
  };

  const handleToggleFavourite = () => {
    toggleTrackFavourite(track.id);
    TauriBridge.toggleFavourite(track.id, !track.isFavourite);
    showToast(
      track.isFavourite
        ? `Removed "${track.title}" from favourites`
        : `Added "${track.title}" to favourites`
    );
    closeContextMenu();
  };

  const handleInspectAudio = () => {
    toggleInspector("track-info");
    closeContextMenu();
  };

  const handleInspectLyrics = () => {
    toggleInspector("lyrics");
    closeContextMenu();
  };

  const handleHandoff = (provider: "youtube" | "spotify" | "jiosaavn") => {
    const q = encodeURIComponent(`${track.title} ${track.artists.join(" ")}`);
    let url = "";
    if (provider === "youtube") {
      url = `https://music.youtube.com/search?q=${q}`;
    } else if (provider === "spotify") {
      url = `https://open.spotify.com/search/${q}`;
    } else if (provider === "jiosaavn") {
      url = `https://www.jiosaavn.com/search/${q}`;
    }
    TauriBridge.openExternal(url);
    showToast(`Opening "${track.title}" in ${provider.toUpperCase()}`);
    closeContextMenu();
  };

  const handleCopySpecs = () => {
    const specs = `${track.title} - ${track.artists.join(", ")} [${track.album || ""}]\nFormat: ${
      track.codec || "Audio"
    } ${track.sampleRate || 44100}Hz / ${track.bitDepth || 16}-bit\nSource: ${track.sourceKind}`;
    navigator.clipboard?.writeText(specs);
    showToast("Technical audio specs copied to clipboard");
    closeContextMenu();
  };

  return (
    <div
      ref={menuRef}
      style={{
        top: Math.min(contextMenu.y, window.innerHeight - 340),
        left: Math.min(contextMenu.x, window.innerWidth - 240),
      }}
      className="fixed z-50 w-56 bg-surface-elevated/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-1.5 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 border-b border-white/5 mb-1">
        <p className="font-semibold text-zinc-100 truncate">{track.title}</p>
        <p className="text-[11px] text-zinc-400 truncate">{track.artists.join(", ")}</p>
      </div>

      <button
        onClick={handlePlayNow}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
      >
        <Play className="w-3.5 h-3.5 text-zinc-300" />
        <span>Play Now</span>
      </button>

      <button
        onClick={handlePlayNext}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
      >
        <Radio className="w-3.5 h-3.5 text-zinc-300" />
        <span>Play Next</span>
      </button>

      <button
        onClick={handleAddToQueue}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
      >
        <ListPlus className="w-3.5 h-3.5 text-zinc-300" />
        <span>Add to Queue</span>
      </button>

      <button
        onClick={handleToggleFavourite}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
      >
        <Star
          className={`w-3.5 h-3.5 ${
            track.isFavourite ? "text-amber-400 fill-amber-400" : "text-zinc-300"
          }`}
        />
        <span>{track.isFavourite ? "Remove Favourite" : "Add to Favourites"}</span>
      </button>

      <div className="my-1 border-t border-white/5" />

      <button
        onClick={handleInspectAudio}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
      >
        <Sliders className="w-3.5 h-3.5 text-zinc-300" />
        <span>Track Info & Diagnostics</span>
      </button>

      <button
        onClick={handleInspectLyrics}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
      >
        <FileText className="w-3.5 h-3.5 text-zinc-300" />
        <span>View Lyrics</span>
      </button>

      <button
        onClick={handleCopySpecs}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
      >
        <Copy className="w-3.5 h-3.5 text-zinc-300" />
        <span>Copy Audio Specs</span>
      </button>

      <div className="my-1 border-t border-white/5" />

      {/* Official Provider Handoff (YouTube Music / Spotify / JioSaavn) */}
      <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
        Open in Provider
      </div>
      <div className="flex items-center gap-1 px-1">
        <button
          onClick={() => handleHandoff("youtube")}
          title="Open in YouTube Music"
          className="flex-1 py-1 rounded hover:bg-red-950/40 text-[11px] text-zinc-300 hover:text-red-400 border border-white/5 text-center transition-colors"
        >
          YouTube
        </button>
        <button
          onClick={() => handleHandoff("spotify")}
          title="Open in Spotify"
          className="flex-1 py-1 rounded hover:bg-emerald-950/40 text-[11px] text-zinc-300 hover:text-emerald-400 border border-white/5 text-center transition-colors"
        >
          Spotify
        </button>
        <button
          onClick={() => handleHandoff("jiosaavn")}
          title="Open in JioSaavn"
          className="flex-1 py-1 rounded hover:bg-cyan-950/40 text-[11px] text-zinc-300 hover:text-cyan-400 border border-white/5 text-center transition-colors"
        >
          JioSaavn
        </button>
      </div>
    </div>
  );
};
