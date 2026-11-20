import React, { useEffect, useMemo, useRef, useState } from "react";
import { Clock, X } from "lucide-react";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { TauriBridge, isTauri } from "../../services/tauriBridge";
import { Track } from "../../types/music";
import { Artwork, EmptyState, PlayButton, Tabs } from "../../components/ui/primitives";
import { TrackList, TrackRow } from "../../components/shared/TrackRow";
import { sourceLabel } from "../../lib/format";
import { useProviderStore } from "../../stores/providerStore";

const RECENTS_KEY = "sonora-recent-searches";
const BROWSE = ["Arijit Singh", "Lo-fi", "Punjabi hits", "90s Bollywood", "The Weeknd", "Coke Studio", "Indie", "Workout", "Jazz", "Tamil hits"];

const loadRecents = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  } catch {
    return [];
  }
};

function rank(items: Track[], q: string) {
  const s = q.toLowerCase().trim();
  const score = (t: Track) => {
    const title = t.title.toLowerCase();
    const artist = t.artists.join(" ").toLowerCase();
    if (title === s) return 0;
    if (title.startsWith(s)) return 1;
    if (artist === s) return 2;
    if (title.includes(s)) return 3;
    if (artist.includes(s)) return 4;
    return 5;
  };
  return items
    .map((t, i) => ({ t, i, s: score(t) }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map((x) => x.t);
}

type Tab = "all" | "jiosaavn" | "youtube" | "server" | "local";

export const SearchScreen: React.FC = () => {
  const { tracks } = useLibraryStore();
  const { globalSearchQuery: query, setGlobalSearchQuery } = useUiStore();
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(false);
  const [saavn, setSaavn] = useState<Track[]>([]);
  const [yt, setYt] = useState<Track[]>([]);
  const [srv, setSrv] = useState<Track[]>([]);
  const subsonic = useProviderStore((s) => s.subsonic);
  const [recents, setRecents] = useState<string[]>(loadRecents);
  const reqId = useRef(0);

  const q = query.trim();

  const local = useMemo(() => {
    if (q.length < 2) return [];
    const s = q.toLowerCase();
    return rank(
      tracks.filter(
        (t) => t.title.toLowerCase().includes(s) || t.artists.some((a) => a.toLowerCase().includes(s)) || t.album?.toLowerCase().includes(s)
      ),
      q
    );
  }, [q, tracks]);

  useEffect(() => {
    if (q.length < 2) {
      setSaavn([]);
      setYt([]);
      setSrv([]);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const [s, y, v] = await Promise.allSettled([
        TauriBridge.searchJioSaavn(q, 30),
        TauriBridge.searchYouTube(q, 30),
        subsonic.isConnected ? TauriBridge.searchSubsonic(subsonic, q) : Promise.resolve([]),
      ]);
      if (id !== reqId.current) return; // a newer search has started
      setSaavn(s.status === "fulfilled" ? rank(s.value, q) : []);
      setYt(y.status === "fulfilled" ? rank(y.value, q) : []);
      setSrv(v.status === "fulfilled" ? rank(v.value, q) : []);
      setLoading(false);
      const next = [q, ...loadRecents().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 8);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      setRecents(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [q, subsonic.isConnected]);

  if (q.length < 2) {
    return (
      <div className="flex-1 overflow-y-auto px-8 pb-16">
        <h1 className="pt-8 pb-6 text-[32px] font-bold tracking-[-0.02em]">Search</h1>
        {recents.length > 0 && (
          <section className="mb-10 max-w-xl">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-[15px] font-semibold">Recent searches</h2>
              <button
                className="text-[12px] text-ink-3 hover:text-ink"
                onClick={() => {
                  localStorage.removeItem(RECENTS_KEY);
                  setRecents([]);
                }}
              >
                Clear
              </button>
            </div>
            {recents.map((r) => (
              <div key={r} className="group flex items-center gap-3 h-9 px-2 -mx-2 rounded-md hover:bg-white/[0.04]">
                <Clock className="w-4 h-4 text-ink-3" />
                <button className="flex-1 text-left text-[13px] text-ink" onClick={() => setGlobalSearchQuery(r)}>
                  {r}
                </button>
                <button
                  aria-label={`Remove ${r}`}
                  className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-ink"
                  onClick={() => {
                    const next = recents.filter((x) => x !== r);
                    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
                    setRecents(next);
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </section>
        )}
        <section>
          <h2 className="text-[15px] font-semibold mb-3">Try searching for</h2>
          <div className="flex flex-wrap gap-2 max-w-3xl">
            {BROWSE.map((b) => (
              <button
                key={b}
                onClick={() => setGlobalSearchQuery(b)}
                className="h-9 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.11] text-[13px] text-ink transition-colors"
              >
                {b}
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const all = rank([...local, ...srv, ...saavn, ...yt], q);
  const lists: Record<Tab, Track[]> = { all, jiosaavn: saavn, youtube: yt, server: srv, local };
  const shown = lists[tab];
  const nothing = !loading && all.length === 0;

  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <div className="px-8 pt-6 pb-4 flex items-center justify-between gap-4 sticky top-0 bg-surface z-20">
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          items={[
            { value: "all", label: "All" },
            { value: "jiosaavn", label: "JioSaavn", count: loading ? undefined : saavn.length },
            { value: "youtube", label: "YouTube", count: loading ? undefined : yt.length },
            ...(subsonic.isConnected ? [{ value: "server", label: "Your server", count: loading ? undefined : srv.length }] : []),
            { value: "local", label: "Your library", count: local.length },
          ]}
        />
        {loading && <span className="text-[12px] text-ink-3">Searching…</span>}
      </div>

      {nothing ? (
        <div className="px-8">
          <EmptyState
            title={`No results for “${q}”`}
            body={
              isTauri()
                ? "Check the spelling, or try an artist name instead of a song title."
                : "JioSaavn and YouTube search run in the desktop app. In the browser preview only your library is searched."
            }
          />
        </div>
      ) : tab === "all" && all.length > 0 ? (
        <div className="px-8 grid grid-cols-[minmax(280px,380px)_minmax(0,1fr)] gap-8">
          <section>
            <h2 className="text-[18px] font-bold mb-3">Top result</h2>
            <TopResult track={all[0]} context={all} />
          </section>
          <section className="min-w-0">
            <h2 className="text-[18px] font-bold mb-3">Songs</h2>
            {all.slice(0, 5).map((t, i) => (
              <TrackRow key={`${t.id}-${i}`} track={t} index={i} playlistContext={all} showAlbum={false} />
            ))}
          </section>
          {all.length > 5 && (
            <section className="col-span-2 -mx-2">
              <h2 className="text-[18px] font-bold mb-3 px-2">More results</h2>
              <TrackList tracks={all.slice(5)} />
            </section>
          )}
        </div>
      ) : shown.length > 0 ? (
        <div className="px-6">
          <TrackList tracks={shown} />
        </div>
      ) : (
        !loading && (
          <div className="px-8">
            <EmptyState
              title={tab === "local" ? "No matches in your library" : `No ${tab === "jiosaavn" ? "JioSaavn" : tab === "server" ? "server" : "YouTube"} results`}
              body={tab === "local" ? "Add a music folder from Folders to search your own files." : undefined}
            />
          </div>
        )
      )}
    </div>
  );
};

const TopResult: React.FC<{ track: Track; context: Track[] }> = ({ track, context }) => {
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { openContextMenu } = useUiStore();
  const current = currentId === track.id;
  const play = () => {
    const p = usePlayerStore.getState();
    current ? p.togglePlayPause() : p.playTrack(track, context);
  };
  return (
    <div
      onDoubleClick={play}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, track);
      }}
      className="group relative p-5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
    >
      <Artwork src={track.artworkUrl} className="w-24 h-24 shadow-lg shadow-black/30" />
      <p className={`mt-5 text-[26px] font-bold tracking-[-0.02em] leading-tight line-clamp-2 ${current ? "text-signal" : ""}`}>
        {track.title}
      </p>
      <p className="mt-1.5 text-[13px] text-ink-2 truncate">
        {track.artists.join(", ")}
        <span className="text-ink-3">{`  ·  ${sourceLabel(track.providerId, track.sourceKind)}`}</span>
      </p>
      <div className="absolute right-5 bottom-5">
        <PlayButton size="lg" playing={current && isPlaying} onClick={play} className="shadow-xl shadow-black/40" />
      </div>
    </div>
  );
};
