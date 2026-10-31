import React from "react";
import { Play } from "lucide-react";
import { Artist } from "../../types/music";
import { useUiStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";

interface ArtistCardProps {
  artist: Artist;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const { navigate } = useUiStore();
  const { playTrack } = usePlayerStore();
  const { tracks } = useLibraryStore();

  const handleOpenArtist = () => {
    navigate("artist-detail", { artistId: artist.id });
  };

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const artistTracks = tracks.filter((t) => t.artists.includes(artist.name));
    if (artistTracks.length > 0) {
      playTrack(artistTracks[0], artistTracks);
    }
  };

  return (
    <div
      onClick={handleOpenArtist}
      className="group flex flex-col items-center text-center p-4 rounded-2xl bg-surface-muted/40 hover:bg-surface-elevated/70 border border-white/[0.04] hover:border-white/10 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-surface-elevated mb-3 shadow-md">
        {artist.artworkUrl ? (
          <img
            src={artist.artworkUrl}
            alt={artist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900 text-2xl font-mono">
            👤
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={handleQuickPlay}
            className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-sm text-zinc-100 truncate w-full group-hover:text-purple-300 transition-colors">
        {artist.name}
      </h3>
      <p className="text-xs text-zinc-500 mt-1 font-mono">
        {artist.albumCount} {artist.albumCount === 1 ? "album" : "albums"} • {artist.trackCount} tracks
      </p>
    </div>
  );
};
