import React from "react";
import { Track } from "../../types/music";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { Artwork, PlayButton } from "../ui/primitives";
import { cn } from "../../lib/cn";

/**
 * Square artwork with two lines underneath. The play button appears on hover;
 * clicking the tile itself runs `onOpen` (or plays, when there's nothing to open).
 */
export const MediaTile: React.FC<{
  title: string;
  subtitle?: React.ReactNode;
  artworkUrl?: string;
  round?: boolean;
  onOpen?: () => void;
  onPlay?: () => void;
  isCurrent?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
}> = ({ title, subtitle, artworkUrl, round, onOpen, onPlay, isCurrent, onContextMenu, className }) => {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  return (
    <div
      className={cn("group relative flex flex-col gap-2.5 min-w-0 cursor-pointer", className)}
      onClick={onOpen ?? onPlay}
      onContextMenu={onContextMenu}
    >
      <div className="relative">
        <Artwork
          src={artworkUrl}
          alt=""
          className="w-full aspect-square"
          rounded={round ? "rounded-full" : "rounded-lg"}
        />
        {onPlay && (
          <div
            className={cn(
              "absolute right-2 bottom-2 transition-all duration-150",
              isCurrent && isPlaying ? "opacity-100" : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
            )}
          >
            <PlayButton
              size="md"
              playing={isCurrent && isPlaying}
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="shadow-lg shadow-black/40"
            />
          </div>
        )}
      </div>
      <div className="min-w-0 px-0.5">
        <p className={cn("text-[13px] font-semibold truncate", isCurrent ? "text-signal" : "text-ink")}>{title}</p>
        {subtitle && <p className="text-[12px] text-ink-2 truncate mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

/** A tile for a single track: plays it within `context`. */
export const TrackTile: React.FC<{ track: Track; context: Track[] }> = ({ track, context }) => {
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const { openContextMenu } = useUiStore();
  const isCurrent = currentId === track.id;
  const play = () => {
    const p = usePlayerStore.getState();
    if (isCurrent) p.togglePlayPause();
    else p.playTrack(track, context);
  };
  return (
    <MediaTile
      title={track.title}
      subtitle={track.artists.join(", ")}
      artworkUrl={track.artworkUrl}
      isCurrent={isCurrent}
      onPlay={play}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, track);
      }}
    />
  );
};

export const TileGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("grid gap-x-5 gap-y-6 grid-cols-[repeat(auto-fill,minmax(156px,1fr))]", className)}>{children}</div>
);
