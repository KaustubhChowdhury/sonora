import React, { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sidebar } from "./Sidebar";
import { Inspector } from "./Inspector";
import { FullPlayer } from "./FullPlayer";
import { ContextMenu } from "../shared/ContextMenu";
import { YouTubeHost } from "../player/YouTubeHost";
import { TitleBar } from "../navigation/TitleBar";
import { NowPlayingBar } from "../player/NowPlayingBar";
import { AudioBoosterModal } from "../audio/AudioBoosterModal";
import { NameDialog } from "../ui/primitives";
import { useUiStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { HomeScreen } from "../../features/home/HomeScreen";
import { JioSaavnScreen } from "../../features/jiosaavn/JioSaavnScreen";
import { YouTubeScreen } from "../../features/youtube/YouTubeScreen";
import { LibraryScreen } from "../../features/library/LibraryScreen";
import { AlbumDetailView } from "../../features/library/AlbumDetailView";
import { ArtistDetailView } from "../../features/library/ArtistDetailView";
import { SearchScreen } from "../../features/search/SearchScreen";
import { PlaylistsScreen } from "../../features/playlists/PlaylistsScreen";
import { AudioStudioScreen } from "../../features/audioStudio/AudioStudioScreen";
import { ExploreScreen } from "../../features/explore/ExploreScreen";
import { SettingsScreen } from "../../features/settings/SettingsScreen";

const SCREENS: Record<string, React.FC> = {
  home: HomeScreen,
  jiosaavn: JioSaavnScreen,
  youtube: YouTubeScreen,
  library: LibraryScreen,
  "album-detail": AlbumDetailView,
  "artist-detail": ArtistDetailView,
  search: SearchScreen,
  playlists: PlaylistsScreen,
  "playlist-detail": PlaylistsScreen,
  "audio-studio": AudioStudioScreen,
  explore: ExploreScreen,
  settings: SettingsScreen,
};

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement || (t as HTMLElement)?.isContentEditable;

export const AppLayout: React.FC = () => {
  const { activeRoute, selectedAlbumId, selectedArtistId, selectedPlaylistId, toastMessage, toggleInspector, navigate, newPlaylist, closeNewPlaylist, showToast } =
    useUiStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const p = usePlayerStore.getState();
      if (e.code === "Space") {
        e.preventDefault();
        p.togglePlayPause();
      } else if (e.code === "ArrowRight" && (e.ctrlKey || e.shiftKey)) {
        e.preventDefault();
        if (e.ctrlKey) p.nextTrack();
        else p.seek(p.currentTimeMs + 5000);
      } else if (e.code === "ArrowLeft" && (e.ctrlKey || e.shiftKey)) {
        e.preventDefault();
        if (e.ctrlKey) p.prevTrack();
        else p.seek(p.currentTimeMs - 5000);
      } else if (e.ctrlKey && e.code === "ArrowUp") {
        e.preventDefault();
        p.setVolume(p.volume + 0.05);
      } else if (e.ctrlKey && e.code === "ArrowDown") {
        e.preventDefault();
        p.setVolume(p.volume - 0.05);
      } else if (e.ctrlKey && e.code === "KeyQ") {
        e.preventDefault();
        toggleInspector("queue");
      } else if (e.ctrlKey && e.code === "KeyL") {
        e.preventDefault();
        toggleInspector("lyrics");
      } else if (e.code === "KeyM" && !e.ctrlKey) {
        p.toggleMute();
      } else if (e.altKey && e.code === "ArrowLeft") {
        useUiStore.getState().goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleInspector]);

  const Screen = SCREENS[activeRoute] ?? HomeScreen;
  const pageKey = `${activeRoute}:${selectedAlbumId ?? ""}:${selectedArtistId ?? ""}:${selectedPlaylistId ?? ""}`;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg text-ink">
      <TitleBar />

      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col rounded-tl-xl bg-surface border-t border-l border-line overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pageKey}
              className="flex-1 min-h-0 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <Screen />
            </motion.div>
          </AnimatePresence>
        </main>
        <Inspector />
      </div>

      <NowPlayingBar />

      <FullPlayer />
      <YouTubeHost />
      <AudioBoosterModal />
      <ContextMenu />

      <NameDialog
        open={newPlaylist.open}
        title={newPlaylist.tracks.length ? `New playlist with ${newPlaylist.tracks.length === 1 ? "this song" : `${newPlaylist.tracks.length} songs`}` : "New playlist"}
        confirmLabel="Create"
        placeholder="Playlist name"
        onClose={closeNewPlaylist}
        onConfirm={(name) => {
          const lib = useLibraryStore.getState();
          const pl = lib.createCustomPlaylist(name);
          if (newPlaylist.tracks.length) lib.addTrackToCustomPlaylist(pl.id, newPlaylist.tracks);
          showToast(`Created “${name}”`);
          navigate("playlists", { playlistId: pl.id });
        }}
      />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[90] max-w-[480px] px-4 py-2.5 rounded-lg bg-ink text-bg text-[13px] font-medium shadow-xl shadow-black/40"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
