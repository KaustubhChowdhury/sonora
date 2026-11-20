import React from "react";
import { useUiStore } from "../../stores/uiStore";
import { useLibraryStore, albumIdFor } from "../../stores/libraryStore";
import { CollectionHeader } from "../../components/shared/CollectionHeader";
import { TrackList } from "../../components/shared/TrackRow";
import { Button, EmptyState } from "../../components/ui/primitives";
import { formatLongDuration, plural } from "../../lib/format";

export const AlbumDetailView: React.FC = () => {
  const { selectedAlbumId, navigate } = useUiStore();
  const { albums, tracks } = useLibraryStore();
  const album = albums.find((a) => a.id === selectedAlbumId);

  if (!album) {
    return (
      <div className="px-8">
        <EmptyState
          title="This album isn't in your library"
          body="Albums come from the folders you've added."
          action={
            <Button
              onClick={() => {
                useLibraryStore.getState().setActiveView("albums");
                navigate("library");
              }}
            >
              See all albums
            </Button>
          }
        />
      </div>
    );
  }

  const albumTracks = tracks
    .filter((t) => albumIdFor(t) === album.id)
    .sort((a, b) => (a.discNumber || 1) - (b.discNumber || 1) || (a.trackNumber || 0) - (b.trackNumber || 0));
  const total = albumTracks.reduce((s, t) => s + t.durationMs, 0);

  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <CollectionHeader
        kind="Album"
        title={album.title}
        artworkUrl={album.artworkUrl}
        meta={
          <>
            <button
              className="text-ink font-semibold hover:underline underline-offset-2"
              onClick={() => navigate("artist-detail", { artistId: `artist-${album.artist}` })}
            >
              {album.artist}
            </button>
            {album.year ? `  ·  ${album.year}` : ""}
            {`  ·  ${plural(albumTracks.length, "song")}, ${formatLongDuration(total)}`}
          </>
        }
        tracks={albumTracks}
      />
      <div className="px-6">
        <TrackList tracks={albumTracks} showAlbum={false} />
      </div>
    </div>
  );
};
