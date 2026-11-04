import React, { useEffect } from "react";
import { AppTitlebar } from "../shell/AppTitlebar";
import { Sidebar } from "./Sidebar";
import { MiniPlayer } from "./MiniPlayer";
import { Inspector } from "./Inspector";
import { FullPlayer } from "./FullPlayer";
import { ContextMenu } from "../shared/ContextMenu";
import { YouTubeHost } from "../player/YouTubeHost";
import { FloatingIslandNav } from "../navigation/FloatingIslandNav";
import { AnimatedPage } from "../../animations/AnimatedPage";
import { useUiStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
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
import { TauriBridge } from "../../services/tauriBridge";

export const AppLayout: React.FC = () => {
  const { activeRoute, toastMessage, toggleInspector, navigate, sidebarOpen } = useUiStore();
  const {
    isPlaying,
    currentTimeMs,
    volume,
    togglePlayPause,
    seek,
    setVolume,
  } = usePlayerStore();

  // Global keyboard shortcuts (matching Section 13)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
        if (!isPlaying) TauriBridge.resume();
        else TauriBridge.pause();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        const nextTime = currentTimeMs + 5000;
        seek(nextTime);
        TauriBridge.seek(nextTime);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        const prevTime = Math.max(0, currentTimeMs - 5000);
        seek(prevTime);
        TauriBridge.seek(prevTime);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        const newVol = Math.min(1, volume + 0.05);
        setVolume(newVol);
        TauriBridge.setVolume(newVol);
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        const newVol = Math.max(0, volume - 0.05);
        setVolume(newVol);
        TauriBridge.setVolume(newVol);
      } else if (e.ctrlKey && e.code === "KeyK") {
        e.preventDefault();
        navigate("search");
      } else if (e.ctrlKey && e.code === "KeyQ") {
        e.preventDefault();
        toggleInspector("queue");
      } else if (e.ctrlKey && e.code === "KeyL") {
        e.preventDefault();
        toggleInspector("lyrics");
      } else if (e.ctrlKey && e.code === "KeyE") {
        e.preventDefault();
        navigate("audio-studio");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, currentTimeMs, volume, togglePlayPause, seek, setVolume, toggleInspector, navigate]);

  const renderActiveScreen = () => {
    switch (activeRoute) {
      case "home":
        return <HomeScreen />;
      case "jiosaavn":
        return <JioSaavnScreen />;
      case "youtube":
        return <YouTubeScreen />;
      case "library":
        return <LibraryScreen />;
      case "album-detail":
        return <AlbumDetailView />;
      case "artist-detail":
        return <ArtistDetailView />;
      case "search":
        return <SearchScreen />;
      case "playlists":
        return <PlaylistsScreen />;
      case "audio-studio":
        return <AudioStudioScreen />;
      case "explore":
        return <ExploreScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0d12] text-zinc-100 font-sans">
      {/* Custom Windows Titlebar */}
      <AppTitlebar />

      {/* Upper Area: Sidebar + Main Workspace + Inspector */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#141821]/30">
          <AnimatedPage pageKey={activeRoute}>
            {renderActiveScreen()}
          </AnimatedPage>
        </main>
        <Inspector />
      </div>

      {/* Floating Island Navigation Dock (CollectUI Pill Design) */}
      <FloatingIslandNav />

      {/* Persistent Mini-Player Bottom Bar */}
      <MiniPlayer />

      {/* Expanded Full-Screen Player Modal */}
      <FullPlayer />

      {/* Embedded YouTube Picture-in-Picture / Audio Host */}
      <YouTubeHost />

      {/* Floating Context Menu */}
      <ContextMenu />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#1b2230]/95 border border-purple-500/30 text-white text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
