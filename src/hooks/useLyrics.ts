import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../stores/playerStore";
import { TauriBridge } from "../services/tauriBridge";
import { LyricsData } from "../types/music";

const cache = new Map<string, LyricsData>();

/** Lyrics for the current track, fetched once per track and shared between views. */
export function useLyrics() {
  const track = usePlayerStore((s) => s.currentTrack);
  const [data, setData] = useState<LyricsData | null>(track ? cache.get(track.id) ?? null : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!track) {
      setData(null);
      return;
    }
    const hit = cache.get(track.id);
    if (hit) {
      setData(hit);
      return;
    }
    let alive = true;
    setLoading(true);
    setData(null);
    TauriBridge.fetchLyrics(track.path, track.title, track.artists[0], track.album, Math.floor(track.durationMs / 1000))
      .then((d) => {
        cache.set(track.id, d);
        if (alive) setData(d);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [track?.id]);

  return { data, loading, track };
}

/** Index of the synced line for the current position (-1 before the first line). */
export function useActiveLyricIndex(data: LyricsData | null) {
  const time = usePlayerStore((s) => s.currentTimeMs);
  const lines = data?.isSynced ? data.syncedLines ?? [] : [];
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].timeMs <= time) idx = i;
    else break;
  }
  return idx;
}

/** Keeps the active line centred inside its scroll container (not the whole window). */
export function useScrollActiveLine(index: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = containerRef.current;
    const el = c?.querySelector<HTMLElement>(`[data-line="${index}"]`);
    if (!c || !el) return;
    c.scrollTo({ top: el.offsetTop - c.clientHeight / 2 + el.clientHeight / 2, behavior: "smooth" });
  }, [index]);
  return containerRef;
}
