import React from "react";
import { Play, Pause, MoreHorizontal, Star } from "lucide-react";
import { Track } from "../../types/music";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { SourceBadge } from "./SourceBadge";
import { AudioFormatBadge } from "./AudioFormatBadge";
import { TauriBridge } from "../../services/tauriBridge";

interface TrackRowProps {
  track: Track;
  index: number;
  playlistContext?: Track[];
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  playlistContext,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayerStore();
  const { openContextMenu, showToast } = useUiStore();
  const { toggleTrackFavourite } = useLibraryStore();

  const isCurrent = currentTrack?.id === track.id;
  const isRowPlaying = isCurrent && isPlaying;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(track, playlistContext);
    }
  };

  const handleFavourite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTrackFavourite(track.id);
    TauriBridge.toggleFavourite(track.id, !track.isFavourite);
    showToast(
      track.isFavourite
        ? `Removed "${track.title}" from favourites`
        : `Added "${track.title}" to favourites`
    );
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, track);
  };

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      onDoubleClick={handlePlayToggle}
      onContextMenu={handleContextMenu}
      className={`group grid grid-cols-[36px_1fr_1fr_120px_140px_70px] items-center px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer select-none ${
        isCurrent
          ? "bg-purple-500/10 hover:bg-purple-500/15 text-white"
          : "hover:bg-white/[0.04] text-zinc-300 hover:text-white"
      }`}
    >
      {/* Index or Play Button */}
      <div className="flex items-center justify-center">
        {isRowPlaying ? (
          <div className="flex items-end gap-[2px] h-3.5 w-3.5 cursor-pointer" onClick={handlePlayToggle}>
            <span className="w-1 bg-purple-400 animate-pulse h-full rounded-sm" />
            <span className="w-1 bg-purple-400 animate-pulse delay-75 h-2 rounded-sm" />
            <span className="w-1 bg-purple-400 animate-pulse delay-150 h-3 rounded-sm" />
          </div>
        ) : (
          <>
            <span className="group-hover:hidden text-xs font-mono text-zinc-500">
              {index + 1}
            </span>
            <button
              onClick={handlePlayToggle}
              className="hidden group-hover:flex items-center justify-center w-6 h-6 rounded-full bg-white text-zinc-950 shadow hover:scale-105 transition-transform"
            >
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </button>
          </>
        )}
      </div>

      {/* Title & Artists */}
      <div className="flex items-center gap-3 min-w-0 pr-4">
        {track.artworkUrl ? (
          <img
            src={track.artworkUrl}
            alt={track.title}
            className="w-10 h-10 rounded-lg object-cover bg-zinc-800 shrink-0 shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-600 font-mono text-xs">
            ♪
          </div>
        )}
        <div className="min-w-0">
          <p
            className={`font-medium truncate ${
              isCurrent ? "text-purple-300 font-semibold" : "text-zinc-100"
            }`}
          >
            {track.title}
          </p>
          <p className="text-xs text-zinc-400 truncate">
            {track.artists.join(", ")}
          </p>
        </div>
      </div>

      {/* Album */}
      <div className="text-xs text-zinc-400 truncate pr-4">
        {track.album || "—"}
      </div>

      {/* Source Badge */}
      <div className="flex items-center">
        <SourceBadge
          sourceKind={track.sourceKind}
          providerId={track.providerId}
          attribution={track.attribution}
        />
      </div>

      {/* Audio Format Spec */}
      <div className="flex items-center">
        <AudioFormatBadge
          compact
          codec={track.codec}
          sampleRate={track.sampleRate}
          bitDepth={track.bitDepth}
        />
      </div>

      {/* Duration & Actions */}
      <div className="flex items-center justify-end gap-2 text-xs font-mono text-zinc-400">
        <button
          onClick={handleFavourite}
          className={`p-1 rounded hover:text-amber-400 transition-colors ${
            track.isFavourite
              ? "text-amber-400"
              : "opacity-0 group-hover:opacity-100 text-zinc-500"
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${track.isFavourite ? "fill-current" : ""}`} />
        </button>

        <span>{formatDuration(track.durationMs)}</span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            openContextMenu(e.clientX, e.clientY, track);
          }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-all"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
