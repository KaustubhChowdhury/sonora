import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Heart, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { Artwork, IconButton } from "../ui/primitives";
import { Scrubber } from "../player/Scrubber";
import { LyricsBody } from "./Inspector";
import { useLyrics } from "../../hooks/useLyrics";
import { formatTime, formatSpec, sourceLabel } from "../../lib/format";
import { cn } from "../../lib/cn";

export const FullPlayer: React.FC = () => {
  const { isFullPlayerOpen, setFullPlayerOpen } = useUiStore();
  const p = usePlayerStore();
  const liked = useLibraryStore((s) => !!p.currentTrack && s.favourites.some((f) => f.id === p.currentTrack!.id));
  const toggleLike = useLibraryStore((s) => s.toggleTrackFavourite);
  const { data: lyrics } = useLyrics();
  const [scrub, setScrub] = useState<number | null>(null);

  useEffect(() => {
    if (!isFullPlayerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullPlayerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullPlayerOpen, setFullPlayerOpen]);

  const t = p.currentTrack;
  const hasLyrics = !!lyrics && lyrics.source !== "none" && !!(lyrics.syncedLines?.length || lyrics.plainText);

  return (
    <AnimatePresence>
      {isFullPlayerOpen && t && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          className="fixed inset-0 z-[60] flex flex-col bg-bg overflow-hidden"
        >
          <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "rgb(var(--ambient) / 0.38)" }} />
          {t.artworkUrl && (
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-cover bg-center opacity-30 blur-[90px] scale-125"
              style={{ backgroundImage: `url("${t.artworkUrl}")` }}
            />
          )}
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />

          <div data-tauri-drag-region className="h-14 shrink-0 flex items-center px-5">
            <IconButton label="Close player (Esc)" onClick={() => setFullPlayerOpen(false)}>
              <ChevronDown className="w-5 h-5" />
            </IconButton>
          </div>

          <div
            className={cn(
              "flex-1 min-h-0 grid items-center gap-16 px-16 max-w-[1500px] w-full mx-auto",
              hasLyrics ? "grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" : "grid-cols-1 justify-items-center"
            )}
          >
            <div className={cn("flex flex-col min-w-0", hasLyrics ? "items-start" : "items-center text-center")}>
              <Artwork
                src={t.artworkUrl}
                className="w-full max-w-[min(440px,48vh)] aspect-square shadow-2xl shadow-black/50"
                rounded="rounded-xl"
              />
              <div className="mt-8 w-full max-w-[440px] min-w-0">
                <h2 className="text-[30px] leading-tight font-bold tracking-[-0.02em] truncate">{t.title}</h2>
                <p className="text-[17px] text-ink-2 mt-1 truncate">{t.artists.join(", ")}</p>
                <p className="text-[12px] text-ink-3 mt-2 tnum">
                  {[t.album, sourceLabel(t.providerId, t.sourceKind), formatSpec(t)].filter(Boolean).join("  ·  ")}
                </p>
              </div>
            </div>
            {hasLyrics && (
              <div className="h-full min-h-0 flex flex-col [mask-image:linear-gradient(transparent,black_18%,black_82%,transparent)]">
                <LyricsBody large />
              </div>
            )}
          </div>

          <div className="shrink-0 px-16 pb-10 pt-6 max-w-[1100px] w-full mx-auto">
            <div className="flex items-center gap-3">
              <span className="w-12 text-right text-[12px] text-ink-2 tnum">{formatTime(scrub ?? p.currentTimeMs)}</span>
              <Scrubber label="Seek" value={p.currentTimeMs} max={p.durationMs} step={250} onScrub={setScrub} onCommit={p.seek} />
              <span className="w-12 text-[12px] text-ink-2 tnum">{formatTime(p.durationMs)}</span>
            </div>
            <div className="mt-5 flex items-center justify-center gap-4">
              <IconButton label={liked ? "Remove from liked songs" : "Add to liked songs"} active={liked} onClick={() => toggleLike(t)}>
                <Heart className={cn("w-5 h-5", liked && "fill-current")} />
              </IconButton>
              <IconButton label="Shuffle" active={p.isShuffle} onClick={p.toggleShuffle}>
                <Shuffle className="w-5 h-5" />
              </IconButton>
              <IconButton label="Previous" onClick={p.prevTrack}>
                <SkipBack className="w-6 h-6 fill-current" />
              </IconButton>
              <button
                onClick={p.togglePlayPause}
                aria-label={p.isPlaying ? "Pause" : "Play"}
                className="w-16 h-16 rounded-full bg-ink text-bg flex items-center justify-center transition-transform hover:scale-[1.04] active:scale-95"
              >
                {p.isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current translate-x-[2px]" />}
              </button>
              <IconButton label="Next" onClick={p.nextTrack}>
                <SkipForward className="w-6 h-6 fill-current" />
              </IconButton>
              <IconButton label="Repeat" active={p.repeatMode !== "off"} onClick={p.toggleRepeat}>
                {p.repeatMode === "one" ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </IconButton>
              <span className="w-8" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
