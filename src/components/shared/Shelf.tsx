import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { Track } from "../../types/music";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { Artwork, EqBars, IconButton, PlayButton } from "../ui/primitives";
import { cn } from "../../lib/cn";

/**
 * A titled horizontal row that scrolls sideways, with arrow buttons like YouTube Music.
 * `kicker` is a small line above the title for context ("Because you listened to").
 */
export const Shelf: React.FC<{
  title: string;
  kicker?: React.ReactNode;
  thumb?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, kicker, thumb, action, children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <section className={cn("mt-12 first:mt-0", className)}>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {thumb && <Artwork src={thumb} className="w-11 h-11" rounded="rounded-full" />}
          <div className="min-w-0">
            {kicker && <p className="text-[13px] text-ink-2 truncate">{kicker}</p>}
            <h2 className="text-[22px] leading-tight font-bold tracking-[-0.015em] truncate">{title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {action}
          <IconButton label="Scroll left" onClick={() => page(-1)} disabled={edges.start} className="border border-line">
            <ChevronLeft className="w-4 h-4" />
          </IconButton>
          <IconButton label="Scroll right" onClick={() => page(1)} disabled={edges.end} className="border border-line">
            <ChevronRight className="w-4 h-4" />
          </IconButton>
        </div>
      </div>
      <div
        ref={ref}
        onScroll={update}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-px-1 pb-2 -mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </section>
  );
};

/** Fixed-width slot inside a Shelf. */
export const ShelfItem: React.FC<{ children: React.ReactNode; wide?: boolean }> = ({ children, wide }) => (
  <div className={cn("snap-start shrink-0", wide ? "w-[232px]" : "w-[176px]")}>{children}</div>
);

/** YouTube Music's "Quick picks": songs in columns of four rows, scrolling sideways. */
export const QuickPicksGrid: React.FC<{ tracks: Track[] }> = ({ tracks }) => {
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { openContextMenu } = useUiStore();
  const cols: Track[][] = [];
  for (let i = 0; i < tracks.length; i += 4) cols.push(tracks.slice(i, i + 4));

  return (
    <>
      {cols.map((col, ci) => (
        <div key={ci} className="snap-start shrink-0 w-[min(380px,42vw)] flex flex-col gap-1">
          {col.map((t) => {
            const current = t.id === currentId;
            const play = () => {
              const p = usePlayerStore.getState();
              current ? p.togglePlayPause() : p.playTrack(t, tracks);
            };
            return (
              <div
                key={t.id}
                onDoubleClick={play}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openContextMenu(e.clientX, e.clientY, t);
                }}
                className="group flex items-center gap-3 h-14 pr-1 rounded-md hover:bg-white/[0.05]"
              >
                <button onClick={play} aria-label={current && isPlaying ? "Pause" : `Play ${t.title}`} className="relative shrink-0 rounded overflow-hidden">
                  <Artwork src={t.artworkUrl} className="w-12 h-12" rounded="rounded" />
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity",
                      current ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {current ? <EqBars playing={isPlaying} /> : <PlayGlyph />}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[14px] font-medium truncate", current ? "text-signal" : "text-ink")}>{t.title}</p>
                  <p className="text-[12px] text-ink-2 truncate">{t.artists.join(", ")}</p>
                </div>
                <IconButton
                  label="More options"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    openContextMenu(r.left, r.bottom + 4, t);
                  }}
                >
                  <MoreVertical className="w-4 h-4" />
                </IconButton>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
};

const PlayGlyph = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4 text-white" fill="currentColor">
    <path d="M4 2.5v11l9-5.5z" />
  </svg>
);

/**
 * An artist mix: the cover is your favourite song by them, with the artist's name set large
 * across the bottom like a sleeve sticker.
 */
export const MixTile: React.FC<{ artist: string; cover?: string; subtitle?: string; onPlay: () => void; loading?: boolean }> = ({
  artist,
  cover,
  subtitle,
  onPlay,
  loading,
}) => (
  <div className="group flex flex-col gap-2.5 cursor-pointer" onClick={onPlay}>
    <div className="relative aspect-square rounded-lg overflow-hidden">
      <Artwork src={cover} className="absolute inset-0 w-full h-full" rounded="rounded-none" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      <div className="absolute left-3 right-3 bottom-3">
        <p className="text-[11px] font-semibold text-white/75">Mix</p>
        <p className="text-[20px] leading-[1.05] font-bold tracking-[-0.02em] text-white line-clamp-2">{artist}</p>
      </div>
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <PlayButton
          size="md"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          label={loading ? "Loading mix" : `Play ${artist} mix`}
          className="shadow-lg shadow-black/40"
        />
      </div>
    </div>
    {subtitle && <p className="text-[12px] text-ink-2 line-clamp-2 px-0.5">{subtitle}</p>}
  </div>
);
