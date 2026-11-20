import React, { useEffect, useState } from "react";
import { useUiStore } from "../../stores/uiStore";
import { TauriBridge, SaavnCollection } from "../../services/tauriBridge";
import { Track } from "../../types/music";
import { CollectionHeader } from "../../components/shared/CollectionHeader";
import { TrackList } from "../../components/shared/TrackRow";
import { EmptyState } from "../../components/ui/primitives";
import { formatLongDuration, plural } from "../../lib/format";

const cache = new Map<string, Track[]>();

export function collectionSongs(c: SaavnCollection): Promise<Track[]> {
  const key = `${c.kind}:${c.id}`;
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  return TauriBridge.jiosaavnCollection(c.kind, c.id, 100).then((t) => {
    if (t.length) cache.set(key, t);
    return t;
  });
}

/** A JioSaavn chart, playlist or album opened from Home. */
export const CollectionScreen: React.FC = () => {
  const c = useUiStore((s) => s.selectedCollection);
  const [tracks, setTracks] = useState<Track[] | null>(null);

  useEffect(() => {
    if (!c) return;
    let alive = true;
    setTracks(null);
    collectionSongs(c).then((t) => alive && setTracks(t));
    return () => {
      alive = false;
    };
  }, [c?.id]);

  if (!c) return <div className="px-8"><EmptyState title="Nothing selected" /></div>;

  const total = tracks?.reduce((s, t) => s + t.durationMs, 0) ?? 0;
  const kind = c.kind === "album" ? "Album" : c.kind === "song" ? "Single" : "Playlist";

  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <CollectionHeader
        kind={`${kind} · JioSaavn`}
        title={c.title}
        description={c.subtitle || undefined}
        artworkUrl={c.image}
        meta={tracks ? (tracks.length ? `${plural(tracks.length, "song")}, ${formatLongDuration(total)}` : undefined) : "Loading…"}
        tracks={tracks ?? []}
      />
      <div className="px-6">
        {tracks === null ? null : tracks.length ? (
          <TrackList tracks={tracks} showAlbum={c.kind !== "album"} />
        ) : (
          <EmptyState className="px-2" title="Couldn't load these songs" body="Check your internet connection and try again." />
        )}
      </div>
    </div>
  );
};
