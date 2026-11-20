import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useLibraryStore, topTracks } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { Track } from "../../types/music";
import { TauriBridge, SaavnCollection, SaavnHome, isTauri } from "../../services/tauriBridge";
import { CURATED_JIOSAAVN_HITS, CURATED_YOUTUBE_HITS } from "../../data/curated";
import { Button, EmptyState } from "../../components/ui/primitives";
import { MediaTile, TrackTile } from "../../components/shared/MediaTile";
import { Shelf, ShelfItem, QuickPicksGrid, MixTile } from "../../components/shared/Shelf";
import { quickPicks, artistMixes, mixTracks, similarTo, dedupe, isSong, songKey, ArtistMix, hasHistory } from "../../services/recommend";
import { collectionSongs } from "../collection/CollectionScreen";
import { greeting, plural } from "../../lib/format";
import { cn } from "../../lib/cn";

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

interface Feed {
  at: number;
  saavn: SaavnHome | null;
  quick: Track[];
  quickPersonal: boolean;
  because: { seed: Track; tracks: Track[] } | null;
  yt: Track[];
}

const FEED_KEY = "sonora-home-feed";
const FRESH_MS = 20 * 60_000;
let memFeed: Feed | null = null;

const loadSnapshot = (): Feed | null => {
  try {
    return JSON.parse(localStorage.getItem(FEED_KEY) || "null");
  } catch {
    return null;
  }
};

async function buildFeed(): Promise<Feed> {
  const { recentlyPlayed } = useLibraryStore.getState();
  const becauseSeed = recentlyPlayed[0];

  const [saavn, picks, because, yt] = await Promise.all([
    TauriBridge.jiosaavnHome(),
    quickPicks(24).catch(() => [] as Track[]),
    becauseSeed ? similarTo(becauseSeed, 16).catch(() => [] as Track[]) : Promise.resolve([] as Track[]),
    TauriBridge.searchYouTube("top songs this week official audio", 16),
  ]);

  // No history yet: Quick picks come from the top chart instead.
  let quick = picks;
  let quickPersonal = picks.length > 0;
  if (!quick.length && saavn?.charts[0]) quick = (await collectionSongs(saavn.charts[0])).slice(0, 24);
  if (!quick.length) {
    quick = [...CURATED_JIOSAAVN_HITS, ...CURATED_YOUTUBE_HITS];
    quickPersonal = false;
  }

  return {
    at: Date.now(),
    saavn,
    quick,
    quickPersonal,
    because: becauseSeed && because.length ? { seed: becauseSeed, tracks: because } : null,
    yt: yt.filter(isSong).length ? yt.filter(isSong) : CURATED_YOUTUBE_HITS,
  };
}

/** Home feed: shows the last snapshot instantly, refreshes in the background when stale. */
function useHomeFeed() {
  const [feed, setFeed] = useState<Feed | null>(() => memFeed ?? loadSnapshot());
  const [loading, setLoading] = useState(false);
  const historyKey = useLibraryStore((s) => s.recentlyPlayed[0]?.id ?? "");

  const refresh = () => {
    setLoading(true);
    buildFeed()
      .then((f) => {
        memFeed = f;
        setFeed(f);
        try {
          localStorage.setItem(FEED_KEY, JSON.stringify(f));
        } catch {
          /* storage full or unavailable */
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const stale = !feed || Date.now() - feed.at > FRESH_MS;
    // Rebuild when you've played something new since the feed was made, so it follows your listening.
    const outdated = feed && historyKey && feed.because?.seed.id !== historyKey;
    if (stale || outdated) refresh();
    // Only on arrival: rebuilding while you're looking would shuffle the shelves under you.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { feed, loading, refresh };
}

const MOODS: { id: string; label: string; saavn: string; yt: string }[] = [
  { id: "energize", label: "Energize", saavn: "energetic hindi songs", yt: "upbeat pop hits official audio" },
  { id: "relax", label: "Relax", saavn: "relaxing hindi songs", yt: "chill relaxing songs official audio" },
  { id: "workout", label: "Workout", saavn: "workout gym songs", yt: "workout music hits official audio" },
  { id: "romance", label: "Romance", saavn: "romantic hindi songs", yt: "romantic love songs official audio" },
  { id: "party", label: "Party", saavn: "party hits hindi", yt: "party songs hits official audio" },
  { id: "focus", label: "Focus", saavn: "instrumental lofi focus", yt: "lofi focus music official audio" },
  { id: "sad", label: "Sad", saavn: "sad hindi songs", yt: "sad songs official audio" },
  { id: "punjabi", label: "Punjabi", saavn: "punjabi hits", yt: "punjabi songs latest official audio" },
  { id: "90s", label: "90s", saavn: "90s bollywood hits", yt: "90s hits official audio" },
];

/* ------------------------------------------------------------------ */
/* Screen                                                               */
/* ------------------------------------------------------------------ */

export const HomeScreen: React.FC = () => {
  const [mood, setMood] = useState<string | null>(null);
  const { feed, loading } = useHomeFeed();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="ambient-wash">
        <div className="px-8 pt-8 pb-2 max-w-[1500px]">
          <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.02em]">{greeting()}</h1>
          <div className="flex gap-2 mt-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(mood === m.id ? null : m.id)}
                aria-pressed={mood === m.id}
                className={cn(
                  "h-8 px-4 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors",
                  mood === m.id ? "bg-ink text-bg" : "bg-white/[0.07] text-ink hover:bg-white/[0.12]"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 pb-20 pt-6 max-w-[1500px]">
        {mood ? (
          <MoodView mood={MOODS.find((m) => m.id === mood)!} />
        ) : !feed ? (
          <p className="text-[13px] text-ink-3 py-10">{loading ? "Loading your home…" : ""}</p>
        ) : (
          <Feed feed={feed} />
        )}
      </div>
    </div>
  );
};

const Feed: React.FC<{ feed: Feed }> = ({ feed }) => {
  const { stats, recentlyPlayed, customPlaylists, favourites } = useLibraryStore();
  const { navigate, openNewPlaylist, setGlobalSearchQuery } = useUiStore();
  const listenAgain = useMemo(() => dedupe([...recentlyPlayed.slice(0, 6), ...topTracks(stats, 12)]).slice(0, 12), [stats, recentlyPlayed]);
  const mixes = useMemo(() => artistMixes(6), [stats]);
  const s = feed.saavn;

  return (
    <>
      {!hasHistory() && (
        <div className="mb-10 flex flex-wrap items-center gap-3 p-4 rounded-lg border border-line max-w-3xl">
          <p className="text-[13px] text-ink-2 flex-1 min-w-[260px]">
            Play a few songs and Home fills in with picks, mixes and radios based on what you listen to.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setGlobalSearchQuery("");
              navigate("search");
            }}
          >
            <Search className="w-3.5 h-3.5" /> Search
          </Button>
        </div>
      )}

      {listenAgain.length > 0 && (
        <Shelf title="Listen again">
          {listenAgain.map((t) => (
            <ShelfItem key={t.id}>
              <TrackTile track={t} context={listenAgain} />
            </ShelfItem>
          ))}
        </Shelf>
      )}

      <Shelf
        title="Quick picks"
        kicker={feed.quickPersonal ? "Based on what you play" : "Popular right now"}
      >
        <QuickPicksGrid tracks={feed.quick} />
      </Shelf>

      {mixes.length > 0 && (
        <Shelf title="Mixed for you">
          {mixes.map((m) => (
            <ShelfItem key={m.artist}>
              <MixPlayer mix={m} />
            </ShelfItem>
          ))}
        </Shelf>
      )}

      {feed.because && (
        <Shelf title={feed.because.seed.title} kicker="Because you listened to" thumb={feed.because.seed.artworkUrl}>
          {feed.because.tracks.map((t) => (
            <ShelfItem key={t.id}>
              <TrackTile track={t} context={feed.because!.tracks} />
            </ShelfItem>
          ))}
        </Shelf>
      )}

      {s && s.newReleases.length > 0 && <CollectionShelf title="New releases" items={s.newReleases} />}
      {s && s.charts.length > 0 && <CollectionShelf title="Charts" items={s.charts} />}

      {(customPlaylists.length > 0 || favourites.length > 0) && (
        <Shelf
          title="Your playlists"
          action={
            <Button variant="ghost" size="sm" onClick={() => openNewPlaylist()} className="mr-1">
              <Plus className="w-3.5 h-3.5" /> New
            </Button>
          }
        >
          {favourites.length > 0 && (
            <ShelfItem>
              <MediaTile
                title="Liked songs"
                subtitle={plural(favourites.length, "song")}
                artworkUrl={favourites[0]?.artworkUrl}
                onOpen={() => {
                  useLibraryStore.getState().setActiveView("favourites");
                  navigate("library");
                }}
                onPlay={() => usePlayerStore.getState().playTrack(favourites[0], favourites)}
              />
            </ShelfItem>
          )}
          {customPlaylists.map((pl) => (
            <ShelfItem key={pl.id}>
              <MediaTile
                title={pl.name}
                subtitle={pl.tracks.length ? plural(pl.tracks.length, "song") : "Empty"}
                artworkUrl={pl.tracks.find((t) => t.artworkUrl)?.artworkUrl}
                onOpen={() => navigate("playlists", { playlistId: pl.id })}
                onPlay={pl.tracks.length ? () => usePlayerStore.getState().playTrack(pl.tracks[0], pl.tracks) : undefined}
              />
            </ShelfItem>
          ))}
        </Shelf>
      )}

      {s && s.topPlaylists.length > 0 && <CollectionShelf title="Popular playlists" items={s.topPlaylists} />}

      {feed.yt.length > 0 && (
        <Shelf title="Trending on YouTube">
          {feed.yt.map((t) => (
            <ShelfItem key={t.id} wide>
              <TrackTile track={t} context={feed.yt} />
            </ShelfItem>
          ))}
        </Shelf>
      )}

      {s && s.trending.length > 0 && <CollectionShelf title="Trending now" items={s.trending} />}

      {!isTauri() && (
        <p className="mt-12 text-[12px] text-ink-3">
          Browser preview: charts, mixes and recommendations load in the desktop app.
        </p>
      )}
    </>
  );
};

/** Plays an artist mix; fetches its songs on first click. */
const MixPlayer: React.FC<{ mix: ArtistMix }> = ({ mix }) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useUiStore();
  const play = async () => {
    setLoading(true);
    const tracks = await mixTracks(mix).catch(() => [mix.seed]);
    setLoading(false);
    usePlayerStore.getState().playTrack(tracks[0], tracks);
    showToast(`Playing ${mix.artist} mix`);
  };
  return <MixTile artist={mix.artist} cover={mix.cover} subtitle={`${mix.artist} and similar artists`} onPlay={play} loading={loading} />;
};

const CollectionShelf: React.FC<{ title: string; items: SaavnCollection[] }> = ({ title, items }) => {
  const { navigate, showToast } = useUiStore();
  return (
    <Shelf title={title}>
      {items.map((c) => (
        <ShelfItem key={`${c.kind}-${c.id}`}>
          <MediaTile
            title={c.title}
            subtitle={c.subtitle || (c.kind === "album" ? "Album" : c.kind === "song" ? "Single" : "Playlist")}
            artworkUrl={c.image}
            onOpen={() => navigate("collection", { collection: c })}
            onPlay={async () => {
              const tracks = await collectionSongs(c);
              if (tracks.length) usePlayerStore.getState().playTrack(tracks[0], tracks);
              else showToast(`Couldn't load “${c.title}”`);
            }}
          />
        </ShelfItem>
      ))}
    </Shelf>
  );
};

/* ------------------------------------------------------------------ */
/* Mood                                                                 */
/* ------------------------------------------------------------------ */

const moodCache = new Map<string, Track[]>(); // per session

const MoodView: React.FC<{ mood: (typeof MOODS)[number] }> = ({ mood }) => {
  const [tracks, setTracks] = useState<Track[] | null>(moodCache.get(mood.id) ?? null);

  useEffect(() => {
    if (moodCache.has(mood.id)) {
      setTracks(moodCache.get(mood.id)!);
      return;
    }
    let alive = true;
    setTracks(null);
    Promise.all([TauriBridge.searchJioSaavn(mood.saavn, 30), TauriBridge.searchYouTube(mood.yt, 12)]).then(([a, b]) => {
      // JioSaavn has clean song metadata; YouTube adds a few official-audio picks every third slot.
      const songs = b.filter(isSong).slice(0, 8);
      const interleaved = dedupe(a.flatMap((t, i) => (i % 3 === 2 && songs[(i - 2) / 3] ? [t, songs[(i - 2) / 3]] : [t])).concat(a.length < 12 ? songs : []));
      // The same hit often comes from both sources with different credits; keep the first by title.
      const titles = new Set<string>();
      const mixed = interleaved.filter((t) => {
        const k = songKey(t).split("|")[0];
        if (titles.has(k)) return false;
        titles.add(k);
        return true;
      });
      moodCache.set(mood.id, mixed);
      if (alive) setTracks(mixed);
    });
    return () => {
      alive = false;
    };
  }, [mood.id]);

  if (tracks === null) return <p className="text-[13px] text-ink-3 py-10">Loading {mood.label.toLowerCase()} songs…</p>;
  if (!tracks.length)
    return (
      <EmptyState
        title={`Couldn't load ${mood.label.toLowerCase()} songs`}
        body={isTauri() ? "Check your internet connection." : "Moods load in the desktop app."}
      />
    );

  return (
    <>
      <Shelf title={mood.label} kicker="Songs for the mood">
        <QuickPicksGrid tracks={tracks.slice(0, 20)} />
      </Shelf>
      {tracks.length > 20 && (
        <Shelf title="More to try">
          {tracks.slice(20).map((t) => (
            <ShelfItem key={t.id}>
              <TrackTile track={t} context={tracks} />
            </ShelfItem>
          ))}
        </Shelf>
      )}
    </>
  );
};
