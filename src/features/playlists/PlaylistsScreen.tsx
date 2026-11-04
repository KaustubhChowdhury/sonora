import React from "react";
import { Plus, ListMusic, Play, Trash2, Clock, Sparkles } from "lucide-react";
import { useLibraryStore } from "../../stores/libraryStore";
import { useUiStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { TrackRow } from "../../components/shared/TrackRow";

export const PlaylistsScreen: React.FC = () => {
  const { playlists, tracks, addPlaylist, deletePlaylist } = useLibraryStore();
  const { selectedPlaylistId, navigate, showToast } = useUiStore();
  const { playTrack } = usePlayerStore();

  const activePlaylist =
    playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  const handleCreateNew = () => {
    const name = prompt("Enter playlist name:");
    if (name && name.trim()) {
      const pl = addPlaylist(name.trim());
      navigate("playlists", { playlistId: pl.id });
      showToast(`Created playlist "${name}"`);
    }
  };

  // Determine tracks for smart playlists or user playlists
  let playlistTracks = tracks;
  if (activePlaylist?.id === "playlist-smart-lossless") {
    playlistTracks = tracks.filter(
      (t) =>
        ["FLAC", "WAV", "ALAC"].includes(t.codec?.toUpperCase() || "") ||
        (t.bitDepth && t.bitDepth > 16)
    );
  } else if (activePlaylist?.id === "playlist-smart-recent") {
    playlistTracks = tracks.slice(0, 10);
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden select-none">
      {/* Playlists Left Drawer */}
      <div className="w-64 border-r border-white/[0.06] p-4 flex flex-col space-y-3 bg-surface/40">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <h2 className="text-xs uppercase font-semibold text-zinc-400 tracking-wider">
            Your Playlists
          </h2>
          <button
            onClick={handleCreateNew}
            title="Create playlist"
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => navigate("playlists", { playlistId: pl.id })}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                activePlaylist?.id === pl.id
                  ? "bg-purple-600/25 text-purple-200 font-semibold border border-purple-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
              }`}
            >
              <ListMusic className="w-4 h-4 shrink-0 text-zinc-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate">{pl.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {pl.isSmart ? "Smart Rules" : `${pl.trackCount} tracks`}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Playlist Content View */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-48">
        {activePlaylist ? (
          <>
            {/* Header */}
            <div className="flex items-end justify-between pb-6 border-b border-white/[0.06]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase font-semibold text-purple-400 tracking-wider">
                    {activePlaylist.isSmart ? "Dynamic Smart Vault" : "User Playlist"}
                  </span>
                  {activePlaylist.isSmart && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                      Auto-Curated
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {activePlaylist.name}
                </h1>
                <p className="text-xs text-zinc-400 max-w-lg">
                  {activePlaylist.description || "Custom user playlist"}
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (playlistTracks.length > 0) {
                        playTrack(playlistTracks[0], playlistTracks);
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Play All ({playlistTracks.length})</span>
                  </button>

                  {!activePlaylist.isSmart && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete playlist "${activePlaylist.name}"?`)) {
                          deletePlaylist(activePlaylist.id);
                          showToast(`Deleted playlist "${activePlaylist.name}"`);
                        }
                      }}
                      className="p-2.5 rounded-full bg-white/10 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Delete playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tracks */}
            <div className="space-y-1">
              <div className="grid grid-cols-[36px_1fr_1fr_120px_140px_70px] items-center px-3 pb-2 text-[11px] font-mono uppercase font-semibold text-zinc-500 border-b border-white/[0.05]">
                <span className="text-center">#</span>
                <span>Title</span>
                <span>Album</span>
                <span>Source</span>
                <span>Format Spec</span>
                <span className="text-right">Duration</span>
              </div>

              {playlistTracks.length === 0 ? (
                <div className="py-20 text-center text-xs text-zinc-500">
                  No tracks in this playlist yet. Add tracks from your library.
                </div>
              ) : (
                playlistTracks.map((track, idx) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={idx}
                    playlistContext={playlistTracks}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="py-24 text-center text-xs text-zinc-500">
            Select or create a playlist.
          </div>
        )}
      </div>
    </div>
  );
};
