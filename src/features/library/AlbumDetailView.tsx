import React from "react";
import { ArrowLeft, Play, Shuffle, Plus, Clock, Disc3 } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { TrackRow } from "../../components/shared/TrackRow";
import { SourceBadge } from "../../components/shared/SourceBadge";

export const AlbumDetailView: React.FC = () => {
  const { selectedAlbumId, navigate } = useUiStore();
  const { albums, tracks } = useLibraryStore();
  const { playTrack, addToQueue } = usePlayerStore();

  const album = albums.find((a) => a.id === selectedAlbumId);

  if (!album) {
    return (
      <div className="flex-1 p-8 text-center text-xs text-zinc-500">
        Album not found.
        <button
          onClick={() => navigate("library")}
          className="block mx-auto mt-2 text-purple-400 hover:underline"
        >
          Return to Library
        </button>
      </div>
    );
  }

  const albumTracks = tracks.filter((t) => t.album === album.title);

  const formatTotalTime = (ms: number) => {
    const totalMin = Math.floor(ms / 60000);
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hrs > 0) return `${hrs} hr ${mins} min`;
    return `${mins} min`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 space-y-6 select-none">
      {/* Back button */}
      <button
        onClick={() => navigate("library")}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Library</span>
      </button>

      {/* Album Header Banner */}
      <div className="flex items-end gap-6 pb-6 border-b border-white/[0.06]">
        <div className="w-48 h-48 rounded-2xl overflow-hidden bg-surface-elevated shrink-0 shadow-2xl border border-white/10">
          {album.artworkUrl ? (
            <img
              src={album.artworkUrl}
              alt={album.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900 text-5xl">
              <Disc3 className="w-16 h-16" />
            </div>
          )}
        </div>

        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-purple-400 font-mono">
              Album Release
            </span>
            <SourceBadge sourceKind={album.sourceKind} />
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight truncate">
            {album.title}
          </h1>

          <p className="text-base text-zinc-300">
            By <span className="font-semibold text-white">{album.artist}</span>
          </p>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            {album.year && <span>{album.year}</span>}
            {album.year && <span>•</span>}
            <span>{albumTracks.length} {albumTracks.length === 1 ? "track" : "tracks"}</span>
            <span>•</span>
            <span>{formatTotalTime(album.totalDurationMs)}</span>
            {album.genre && (
              <>
                <span>•</span>
                <span className="text-zinc-500 font-sans">{album.genre}</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                if (albumTracks.length > 0) playTrack(albumTracks[0], albumTracks);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play</span>
            </button>

            <button
              onClick={() => {
                if (albumTracks.length > 0) {
                  const shuffled = [...albumTracks].sort(() => Math.random() - 0.5);
                  playTrack(shuffled[0], shuffled);
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>

            <button
              onClick={() => addToQueue(albumTracks)}
              title="Add entire album to queue"
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1">
        <div className="grid grid-cols-[36px_1fr_1fr_120px_140px_70px] items-center px-3 pb-2 text-[11px] font-mono uppercase font-semibold text-zinc-500 border-b border-white/[0.05]">
          <span className="text-center">#</span>
          <span>Title</span>
          <span>Artist</span>
          <span>Source</span>
          <span>Format Spec</span>
          <span className="text-right">Duration</span>
        </div>

        {albumTracks.map((track, idx) => (
          <TrackRow
            key={track.id}
            track={track}
            index={idx}
            playlistContext={albumTracks}
          />
        ))}
      </div>
    </div>
  );
};
