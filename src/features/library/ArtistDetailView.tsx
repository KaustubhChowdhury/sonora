import React, { useEffect, useState } from "react";
import { useUiStore } from "../../stores/uiStore";
import { useLibraryStore, albumIdFor } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { CollectionHeader } from "../../components/shared/CollectionHeader";
import { TrackList } from "../../components/shared/TrackRow";
import { MediaTile, TileGrid } from "../../components/shared/MediaTile";
import { Section } from "../../components/ui/primitives";
import { TauriBridge } from "../../services/tauriBridge";
import { Track } from "../../types/music";
import { plural } from "../../lib/format";

const streamCache = new Map<string, Track[]>();

/**
 * Artist page. Songs from your library come first; songs from JioSaavn and YouTube
 * are fetched by name underneath, so artists you only stream still get a page.
 */
export const ArtistDetailView: React.FC = () => {
  const { selectedArtistId, navigate } = useUiStore();
  const { artists, albums, tracks } = useLibraryStore();
  const name = selectedArtistId?.replace(/^artist-/, "") ?? "";
  const artist = artists.find((a) => a.id === selectedArtistId);
  const [streamed, setStreamed] = useState<Track[]>(streamCache.get(name) ?? []);
  const [loading, setLoading] = useState(!streamCache.has(name));

  useEffect(() => {
    if (!name || streamCache.has(name)) return;
    let alive = true;
    Promise.allSettled([TauriBridge.searchJioSaavn(name, 20), TauriBridge.searchYouTube(name, 12)]).then(([s, y]) => {
      const lower = name.toLowerCase();
      const all = [...(s.status === "fulfilled" ? s.value : []), ...(y.status === "fulfilled" ? y.value : [])];
      // Keep results that actually credit this artist
      const matching = all.filter((t) => t.artists.some((a) => a.toLowerCase().includes(lower)));
      streamCache.set(name, matching);
      if (alive) {
        setStreamed(matching);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [name]);

  const own = tracks.filter((t) => t.artists.includes(name));
  const ownAlbums = albums.filter((a) => a.artist === name);
  const everything = [...own, ...streamed];
  const art = artist?.artworkUrl || streamed[0]?.artworkUrl;

  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <CollectionHeader
        kind="Artist"
        title={name || "Unknown artist"}
        artworkUrl={art}
        roundArt
        meta={
          own.length
            ? `${plural(own.length, "song")} in your library${ownAlbums.length ? `, ${plural(ownAlbums.length, "album")}` : ""}`
            : loading
            ? "Looking for songs…"
            : streamed.length
            ? `${plural(streamed.length, "song")} on JioSaavn and YouTube`
            : "No songs found"
        }
        tracks={everything}
      />

      {own.length > 0 && (
        <div className="px-6">
          <h2 className="px-2 mb-2 text-[18px] font-bold">In your library</h2>
          <TrackList tracks={own} />
        </div>
      )}

      {ownAlbums.length > 0 && (
        <div className="px-8">
          <Section title="Albums" className="mt-10">
            <TileGrid>
              {ownAlbums.map((a) => {
                const at = tracks.filter((t) => albumIdFor(t) === a.id);
                return (
                  <MediaTile
                    key={a.id}
                    title={a.title}
                    subtitle={a.year ? String(a.year) : plural(a.trackCount, "song")}
                    artworkUrl={a.artworkUrl}
                    onOpen={() => navigate("album-detail", { albumId: a.id })}
                    onPlay={at.length ? () => usePlayerStore.getState().playTrack(at[0], at) : undefined}
                  />
                );
              })}
            </TileGrid>
          </Section>
        </div>
      )}

      {streamed.length > 0 && (
        <div className="px-6 mt-10">
          <h2 className="px-2 mb-2 text-[18px] font-bold">Streaming</h2>
          <TrackList tracks={streamed} />
        </div>
      )}
    </div>
  );
};
