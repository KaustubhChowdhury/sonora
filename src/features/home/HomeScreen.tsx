import React, { useEffect, useState } from "react";
import { Heart, ListMusic, Plus, Search } from "lucide-react";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { Track } from "../../types/music";
import { TauriBridge } from "../../services/tauriBridge";
import { CURATED_JIOSAAVN_HITS, CURATED_YOUTUBE_HITS } from "../../data/curated";
import { Artwork, Button, EqBars, Section } from "../../components/ui/primitives";
import { MediaTile, TileGrid, TrackTile } from "../../components/shared/MediaTile";
import { greeting, plural } from "../../lib/format";
import { cn } from "../../lib/cn";

// Live feeds are fetched once per session; navigating back to Home shouldn't refetch.
let liveCache: { saavn: Track[]; yt: Track[] } | null = null;

export const HomeScreen: React.FC = () => {
  const { recentlyPlayed, customPlaylists, favourites, tracks } = useLibraryStore();
  const { navigate, openNewPlaylist, setGlobalSearchQuery } = useUiStore();
  const [saavn, setSaavn] = useState<Track[]>(liveCache?.saavn ?? CURATED_JIOSAAVN_HITS);
  const [yt, setYt] = useState<Track[]>(liveCache?.yt ?? CURATED_YOUTUBE_HITS);

  useEffect(() => {
    if (liveCache) return;
    let alive = true;
    Promise.allSettled([
      TauriBridge.searchJioSaavn("trending hindi hits", 12),
      TauriBridge.searchYouTube("top music hits this week", 12),
    ]).then(([s, y]) => {
      const sv = s.status === "fulfilled" && s.value.length ? s.value : CURATED_JIOSAAVN_HITS;
      const yv = y.status === "fulfilled" && y.value.length ? y.value : CURATED_YOUTUBE_HITS;
      liveCache = { saavn: sv, yt: yv };
      if (alive) {
        setSaavn(sv);
        setYt(yv);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const isNew = recentlyPlayed.length === 0 && customPlaylists.length === 0 && favourites.length === 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="ambient-wash">
        <div className="px-8 pt-10 pb-2 max-w-[1400px]">
          <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.02em]">{greeting()}</h1>
          {isNew ? (
            <p className="mt-2 text-[14px] text-ink-2 max-w-[56ch]">
              Search JioSaavn and YouTube from the bar above, or add a music folder to play your own files.
            </p>
          ) : null}

          {recentlyPlayed.length > 0 && <RecentGrid tracks={recentlyPlayed.slice(0, 8)} />}

          {isNew && (
            <div className="flex flex-wrap gap-2 mt-6">
              <Button
                variant="primary"
                onClick={() => {
                  setGlobalSearchQuery("");
                  navigate("search");
                }}
              >
                <Search className="w-4 h-4" /> Find something to play
              </Button>
              <Button
                onClick={() => {
                  useLibraryStore.getState().setActiveView("folders");
                  navigate("library");
                }}
              >
                Add a music folder
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-8 pb-16 pt-8 max-w-[1400px]">
        {(customPlaylists.length > 0 || favourites.length > 0) && (
          <Section
            title="Your playlists"
            action={
              <Button variant="ghost" size="sm" onClick={() => openNewPlaylist()}>
                <Plus className="w-3.5 h-3.5" /> New playlist
              </Button>
            }
          >
            <TileGrid>
              {favourites.length > 0 && (
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
              )}
              {customPlaylists.slice(0, 11).map((pl) => (
                <MediaTile
                  key={pl.id}
                  title={pl.name}
                  subtitle={pl.tracks.length ? plural(pl.tracks.length, "song") : "Empty"}
                  artworkUrl={pl.tracks.find((t) => t.artworkUrl)?.artworkUrl}
                  onOpen={() => navigate("playlists", { playlistId: pl.id })}
                  onPlay={pl.tracks.length ? () => usePlayerStore.getState().playTrack(pl.tracks[0], pl.tracks) : undefined}
                />
              ))}
            </TileGrid>
          </Section>
        )}

        {tracks.length > 0 && (
          <Section
            title="From your library"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  useLibraryStore.getState().setActiveView("songs");
                  navigate("library");
                }}
              >
                Show all
              </Button>
            }
          >
            <TileGrid>
              {tracks.slice(0, 6).map((t) => (
                <TrackTile key={t.id} track={t} context={tracks} />
              ))}
            </TileGrid>
          </Section>
        )}

        <Section
          title="Trending on JioSaavn"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("jiosaavn")}>
              Show all
            </Button>
          }
        >
          <TileGrid>
            {saavn.slice(0, 12).map((t) => (
              <TrackTile key={t.id} track={t} context={saavn} />
            ))}
          </TileGrid>
        </Section>

        <Section
          title="Popular on YouTube"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("youtube")}>
              Show all
            </Button>
          }
        >
          <TileGrid>
            {yt.slice(0, 12).map((t) => (
              <TrackTile key={t.id} track={t} context={yt} />
            ))}
          </TileGrid>
        </Section>

        {customPlaylists.length === 0 && favourites.length === 0 && !isNew && (
          <Section title="Playlists">
            <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-line-strong max-w-lg">
              <ListMusic className="w-5 h-5 text-ink-3 shrink-0" />
              <p className="text-[13px] text-ink-2 flex-1">
                Right-click any song to add it to a playlist or to <Heart className="inline w-3.5 h-3.5 -mt-0.5" /> Liked songs.
              </p>
              <Button size="sm" onClick={() => openNewPlaylist()}>
                New playlist
              </Button>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

/** Two-row grid of recently played tracks: compact horizontal cards, the fastest way back in. */
const RecentGrid: React.FC<{ tracks: Track[] }> = ({ tracks }) => {
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { openContextMenu } = useUiStore();
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2 mt-6">
      {tracks.map((t) => {
        const current = t.id === currentId;
        return (
          <button
            key={t.id}
            onClick={() => {
              const p = usePlayerStore.getState();
              current ? p.togglePlayPause() : p.playTrack(t, tracks);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              openContextMenu(e.clientX, e.clientY, t);
            }}
            className={cn(
              "group flex items-center gap-3 h-14 pr-3 rounded-md overflow-hidden text-left transition-colors",
              "bg-white/[0.06] hover:bg-white/[0.11]"
            )}
          >
            <Artwork src={t.artworkUrl} className="w-14 h-14" rounded="rounded-none" />
            <div className="min-w-0 flex-1">
              <p className={cn("text-[13px] font-semibold truncate", current ? "text-signal" : "text-ink")}>{t.title}</p>
              <p className="text-[12px] text-ink-2 truncate">{t.artists.join(", ")}</p>
            </div>
            {current && <EqBars playing={isPlaying} />}
          </button>
        );
      })}
    </div>
  );
};
