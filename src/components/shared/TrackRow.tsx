import React from "react";
import { Heart, MoreHorizontal, Play, Pause } from "lucide-react";
import { Track } from "../../types/music";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { Artwork, EqBars } from "../ui/primitives";
import { formatTime, formatSpec, sourceLabel } from "../../lib/format";
import { cn } from "../../lib/cn";

/**
 * Track list. Columns: # · title/artist · album · source/format · like · duration · more.
 * Double-click (or Enter) plays; single click selects nothing — there's no multi-select yet.
 */

const GRID = "grid grid-cols-[32px_minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_32px_48px_32px] items-center gap-3";

export const TrackListHeader: React.FC<{ showAlbum?: boolean }> = ({ showAlbum = true }) => (
  <div className={cn(GRID, "h-8 px-3 border-b border-line text-[12px] text-ink-3 sticky top-0 bg-surface z-10")}>
    <span className="text-right">#</span>
    <span>Title</span>
    <span>{showAlbum ? "Album" : ""}</span>
    <span>Source</span>
    <span />
    <span className="text-right">Time</span>
    <span />
  </div>
);

interface TrackRowProps {
  track: Track;
  index: number;
  playlistContext?: Track[];
  showAlbum?: boolean;
  /** Extra items for the row's "more" menu, e.g. "Remove from playlist" */
  onRemove?: () => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, index, playlistContext, showAlbum = true }) => {
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { playTrack, togglePlayPause } = usePlayerStore.getState();
  const { openContextMenu, navigate } = useUiStore();
  const liked = useLibraryStore((s) => s.favourites.some((f) => f.id === track.id));
  const toggleLike = useLibraryStore((s) => s.toggleTrackFavourite);

  const isCurrent = currentId === track.id;
  const play = () => (isCurrent ? togglePlayPause() : playTrack(track, playlistContext));
  const spec = formatSpec(track);

  return (
    <div
      role="row"
      tabIndex={0}
      onDoubleClick={play}
      onKeyDown={(e) => e.key === "Enter" && play()}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, track);
      }}
      className={cn(
        GRID,
        "group h-14 px-3 rounded-md text-[13px] select-none focus:outline-none focus-visible:bg-white/[0.06]",
        isCurrent ? "bg-white/[0.05]" : "hover:bg-white/[0.04]"
      )}
    >
      <div className="flex justify-end items-center">
        <span className={cn("tnum text-ink-3 group-hover:hidden", isCurrent && "hidden")}>{index + 1}</span>
        {isCurrent && <span className="group-hover:hidden"><EqBars playing={isPlaying} /></span>}
        <button
          onClick={(e) => {
            e.stopPropagation();
            play();
          }}
          aria-label={isCurrent && isPlaying ? "Pause" : `Play ${track.title}`}
          className="hidden group-hover:flex w-6 h-6 items-center justify-center text-ink"
        >
          {isCurrent && isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
        </button>
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <Artwork src={track.artworkUrl} className="w-10 h-10" rounded="rounded" />
        <div className="min-w-0">
          <p className={cn("truncate font-medium", isCurrent ? "text-signal" : "text-ink")}>{track.title}</p>
          <p className="truncate text-[12px] text-ink-2">
            {track.artists.map((a, i) => (
              <React.Fragment key={a}>
                {i > 0 && ", "}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("artist-detail", { artistId: `artist-${a}` });
                  }}
                  className="hover:text-ink hover:underline underline-offset-2"
                >
                  {a}
                </button>
              </React.Fragment>
            ))}
          </p>
        </div>
      </div>

      <div className="truncate text-ink-2">
        {showAlbum && track.album ? (
          track.albumId ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("album-detail", { albumId: track.albumId });
              }}
              className="truncate max-w-full text-left hover:text-ink hover:underline underline-offset-2"
            >
              {track.album}
            </button>
          ) : (
            track.album
          )
        ) : null}
      </div>

      <div className="truncate text-[12px] text-ink-3" title={track.attribution}>
        {sourceLabel(track.providerId, track.sourceKind)}
        {spec && <span className="tnum text-ink-3/80">{`  ${spec}`}</span>}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleLike(track);
        }}
        aria-label={liked ? "Remove from liked songs" : "Add to liked songs"}
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-full transition-opacity",
          liked ? "text-signal" : "text-ink-3 hover:text-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <Heart className={cn("w-4 h-4", liked && "fill-current")} />
      </button>

      <span className="text-right tnum text-ink-3">{formatTime(track.durationMs)}</span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          openContextMenu(r.left, r.bottom + 4, track);
        }}
        aria-label="More options"
        className="w-8 h-8 flex items-center justify-center rounded-full text-ink-3 hover:text-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
};

export const TrackList: React.FC<{ tracks: Track[]; showAlbum?: boolean; className?: string }> = ({
  tracks,
  showAlbum = true,
  className,
}) => (
  <div role="table" className={className}>
    <TrackListHeader showAlbum={showAlbum} />
    <div className="pt-1">
      {tracks.map((t, i) => (
        <TrackRow key={`${t.id}-${i}`} track={t} index={i} playlistContext={tracks} showAlbum={showAlbum} />
      ))}
    </div>
  </div>
);
