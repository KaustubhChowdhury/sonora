import React from "react";
import { Shuffle } from "lucide-react";
import { Track } from "../../types/music";
import { usePlayerStore } from "../../stores/playerStore";
import { Artwork, IconButton, PlayButton } from "../ui/primitives";
import { cn } from "../../lib/cn";

/**
 * Header for any list of songs (playlist, album, artist, liked songs).
 * Art on the left, kind + title + meta on the right, then play/shuffle and extra actions.
 */
export const CollectionHeader: React.FC<{
  kind: string;
  title: string;
  meta?: React.ReactNode;
  description?: React.ReactNode;
  artworkUrl?: string;
  artwork?: React.ReactNode;
  roundArt?: boolean;
  tracks: Track[];
  actions?: React.ReactNode;
}> = ({ kind, title, meta, description, artworkUrl, artwork, roundArt, tracks, actions }) => {
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playingHere = !!currentId && tracks.some((t) => t.id === currentId);

  const play = () => {
    const p = usePlayerStore.getState();
    if (playingHere) p.togglePlayPause();
    else if (tracks.length) p.playTrack(tracks[0], tracks);
  };
  const shuffle = () => {
    if (!tracks.length) return;
    const p = usePlayerStore.getState();
    if (!p.isShuffle) p.toggleShuffle();
    const start = tracks[Math.floor(Math.random() * tracks.length)];
    p.playTrack(start, tracks);
  };

  return (
    <div className="ambient-wash">
      <div className="flex items-end gap-7 px-8 pt-10 pb-6">
        {artwork ?? (
          <Artwork
            src={artworkUrl}
            className="w-[184px] h-[184px] shadow-xl shadow-black/40"
            rounded={roundArt ? "rounded-full" : "rounded-lg"}
            iconSize="w-12 h-12"
          />
        )}
        <div className="min-w-0 pb-1">
          <p className="text-[13px] font-medium text-ink-2">{kind}</p>
          <h1
            className={cn(
              "font-bold tracking-[-0.025em] leading-[1.05] mt-1 break-words",
              title.length > 28 ? "text-[34px]" : "text-[48px]"
            )}
          >
            {title}
          </h1>
          {description && <p className="mt-3 text-[13px] text-ink-2 max-w-[60ch]">{description}</p>}
          {meta && <p className="mt-2 text-[13px] text-ink-2 tnum">{meta}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 px-8 pb-4">
        <PlayButton size="lg" playing={playingHere && isPlaying} onClick={play} label={playingHere && isPlaying ? "Pause" : "Play all"} />
        <IconButton label="Shuffle play" onClick={shuffle} disabled={!tracks.length} className="w-10 h-10 ml-1">
          <Shuffle className="w-5 h-5" />
        </IconButton>
        {actions}
      </div>
    </div>
  );
};

/** 2×2 mosaic of the first four distinct covers, for playlists. */
export const Mosaic: React.FC<{ tracks: Track[]; className?: string }> = ({ tracks, className }) => {
  const covers = Array.from(new Set(tracks.map((t) => t.artworkUrl).filter(Boolean))).slice(0, 4) as string[];
  if (covers.length < 4) return <Artwork src={covers[0]} className={className} rounded="rounded-lg" iconSize="w-12 h-12" />;
  return (
    <div className={cn("grid grid-cols-2 grid-rows-2 overflow-hidden rounded-lg shadow-xl shadow-black/40", className)}>
      {covers.map((c) => (
        <img key={c} src={c} alt="" className="w-full h-full object-cover" />
      ))}
    </div>
  );
};
