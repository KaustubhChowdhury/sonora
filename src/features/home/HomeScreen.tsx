import React from "react";
import { Play, Sparkles, Disc3, ShieldCheck, HardDrive, ArrowRight } from "lucide-react";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { AlbumCard } from "../../components/shared/AlbumCard";
import { TrackRow } from "../../components/shared/TrackRow";

export const HomeScreen: React.FC = () => {
  const { tracks, albums, history } = useLibraryStore();
  const { playTrack } = usePlayerStore();
  const { navigate } = useUiStore();

  const losslessTracks = tracks.filter(
    (t) =>
      ["FLAC", "WAV", "ALAC"].includes(t.codec?.toUpperCase() || "") ||
      (t.bitDepth && t.bitDepth > 16)
  );

  const heroAlbum = albums[0];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 select-none">
      {/* Editorial Hero Banner */}
      {heroAlbum ? (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/80 via-surface-elevated/90 to-surface-muted/60 border border-white/[0.08] p-8 shadow-2xl flex items-center justify-between">
          {heroAlbum.artworkUrl && (
            <div
              style={{ backgroundImage: `url(${heroAlbum.artworkUrl})` }}
              className="absolute inset-0 bg-cover bg-center opacity-15 blur-2xl scale-110 pointer-events-none"
            />
          )}

          <div className="relative z-10 max-w-xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lossless Highlight</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
              {heroAlbum.title}
            </h1>
            <p className="text-sm text-zinc-300">
              By <span className="font-semibold text-white">{heroAlbum.artist}</span> • {heroAlbum.trackCount} tracks • Master Studio Quality
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  const albumTracks = tracks.filter((t) => t.album === heroAlbum.title);
                  if (albumTracks.length > 0) {
                    playTrack(albumTracks[0], albumTracks);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play Album</span>
              </button>

              <button
                onClick={() => navigate("album-detail", { albumId: heroAlbum.id })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition-colors"
              >
                <span>View Tracks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {heroAlbum.artworkUrl && (
            <div className="relative z-10 hidden md:block w-48 h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
              <img
                src={heroAlbum.artworkUrl}
                alt={heroAlbum.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-surface-muted/50 border border-white/[0.06] p-8 text-center space-y-3">
          <HardDrive className="w-10 h-10 text-purple-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Welcome to Sonora</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Your local-first audiophile music environment. Select a folder to import your lossless collection, or browse Creative Commons music in Explore.
          </p>
          <button
            onClick={() => navigate("settings")}
            className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            Add Music Folder
          </button>
        </div>
      )}

      {/* Featured Albums Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-purple-400" />
            <h2 className="text-base font-bold text-zinc-100">Featured Albums</h2>
          </div>
          <button
            onClick={() => {
              useLibraryStore.getState().setActiveView("albums");
              navigate("library");
            }}
            className="text-xs text-zinc-400 hover:text-purple-300 font-medium transition-colors"
          >
            View all ({albums.length}) →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.slice(0, 5).map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>

      {/* Lossless Master Vault Highlights */}
      {losslessTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-zinc-100">
                Lossless Master Vault (FLAC / 24-bit)
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {losslessTracks.length} lossless tracks
            </span>
          </div>

          <div className="bg-surface-muted/30 rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
            {losslessTracks.slice(0, 5).map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                playlistContext={losslessTracks}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently Played / History */}
      {history.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-100">Recently Played</h2>
            <button
              onClick={() => {
                useLibraryStore.getState().setActiveView("history");
                navigate("library");
              }}
              className="text-xs text-zinc-400 hover:text-purple-300 font-medium transition-colors"
            >
              Full History →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {history.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  const match = tracks.find((t) => t.id === item.trackId);
                  if (match) playTrack(match);
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-muted/40 hover:bg-surface-elevated/80 border border-white/[0.04] cursor-pointer transition-colors"
              >
                {item.artworkUrl ? (
                  <img
                    src={item.artworkUrl}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover bg-zinc-800 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center font-mono text-zinc-600 text-xs">
                    ♪
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-100 truncate">{item.title}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{item.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
