import React from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { Album } from "../../types/music";
import { useUiStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { SourceBadge } from "./SourceBadge";
import { SPRING_TACTILE } from "../../animations/transitions";

interface AlbumCardProps {
  album: Album;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  const { navigate } = useUiStore();
  const { playTrack } = usePlayerStore();
  const { tracks } = useLibraryStore();

  const handleOpenAlbum = () => {
    navigate("album-detail", { albumId: album.id });
  };

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const albumTracks = tracks.filter((t) => t.album === album.title);
    if (albumTracks.length > 0) {
      playTrack(albumTracks[0], albumTracks);
    }
  };

  return (
    <motion.article
      onClick={handleOpenAlbum}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={SPRING_TACTILE}
      className="group flex flex-col p-3 rounded-2xl bg-[#141821]/70 hover:bg-[#1b2230]/90 border border-white/[0.05] hover:border-white/10 transition-colors duration-150 cursor-pointer shadow-sm hover:shadow-xl select-none"
    >
      {/* Artwork container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#1b2230] mb-3 shadow-md">
        {album.artworkUrl ? (
          <motion.img
            src={album.artworkUrl}
            alt={`${album.title} cover`}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-900">
            <span className="text-3xl font-mono">♪</span>
          </div>
        )}

        {/* Ambient overlay & Quick Play Action */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-3">
          <SourceBadge sourceKind={album.sourceKind} className="shadow-sm" />

          <button
            type="button"
            onClick={handleQuickPlay}
            aria-label={`Play album ${album.title}`}
            className="w-10 h-10 rounded-full bg-[#9b7bff] hover:bg-[#a78bfa] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
        </div>
      </div>

      {/* Album Info */}
      <div className="min-w-0">
        <h3 className="font-semibold text-sm text-zinc-100 truncate group-hover:text-purple-300 transition-colors">
          {album.title}
        </h3>
        <p className="text-xs text-zinc-400 truncate mt-0.5">{album.artist}</p>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-500 font-mono">
          {album.year && <span>{album.year}</span>}
          {album.year && <span>•</span>}
          <span>
            {album.trackCount} {album.trackCount === 1 ? "track" : "tracks"}
          </span>
        </div>
      </div>
    </motion.article>
  );
};
