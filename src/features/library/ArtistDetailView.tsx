import React from "react";
import { ArrowLeft, Play, Disc3 } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { AlbumCard } from "../../components/shared/AlbumCard";
import { TrackRow } from "../../components/shared/TrackRow";

export const ArtistDetailView: React.FC = () => {
  const { selectedArtistId, navigate } = useUiStore();
  const { artists, albums, tracks } = useLibraryStore();
  const { playTrack } = usePlayerStore();

  const artist = artists.find((a) => a.id === selectedArtistId);

  if (!artist) {
    return (
      <div className="flex-1 p-8 text-center text-xs text-zinc-500">
        Artist not found.
        <button
          onClick={() => navigate("library")}
          className="block mx-auto mt-2 text-purple-400 hover:underline"
        >
          Return to Library
        </button>
      </div>
    );
  }

  const artistTracks = tracks.filter((t) => t.artists.includes(artist.name));
  const artistAlbums = albums.filter((al) => al.artist === artist.name);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 space-y-8 select-none pb-48">
      {/* Back button */}
      <button
        onClick={() => navigate("library")}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Artists</span>
      </button>

      {/* Artist Header Banner */}
      <div className="flex items-center gap-6 pb-6 border-b border-white/[0.06]">
        <div className="w-36 h-36 rounded-full overflow-hidden bg-surface-elevated shrink-0 shadow-2xl border border-white/10">
          {artist.artworkUrl ? (
            <img
              src={artist.artworkUrl}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900 text-4xl">
              👤
            </div>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-semibold tracking-wider text-purple-400 font-mono">
            Artist Discography
          </span>
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
            {artist.name}
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            {artistAlbums.length} {artistAlbums.length === 1 ? "album" : "albums"} • {artistTracks.length} tracks
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                if (artistTracks.length > 0) playTrack(artistTracks[0], artistTracks);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Discography Albums */}
      {artistAlbums.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Albums & Releases
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {artistAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      {/* Tracks */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Top Tracks
        </h2>
        <div className="space-y-1">
          {artistTracks.map((track, idx) => (
            <TrackRow
              key={track.id}
              track={track}
              index={idx}
              playlistContext={artistTracks}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
