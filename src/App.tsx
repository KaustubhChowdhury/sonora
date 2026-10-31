import React, { useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { useLibraryStore } from "./stores/libraryStore";
import { useAudioStudioStore } from "./stores/audioStudioStore";
import { usePlayerStore } from "./stores/playerStore";
import { TauriBridge } from "./services/tauriBridge";

export const App: React.FC = () => {
  const { setTracks, setFolders } = useLibraryStore();
  const { setDevices } = useAudioStudioStore();
  const { currentTrack, playTrack, isPlaying, setCurrentTime } = usePlayerStore();

  // Initial startup initialization
  useEffect(() => {
    // Load tracks from local SQLite database or default catalogue
    TauriBridge.getLibraryTracks().then((tracks) => {
      setTracks(tracks);
      // If no track currently loaded, set first track into queue
      if (!usePlayerStore.getState().currentTrack && tracks.length > 0) {
        usePlayerStore.getState().addToQueue(tracks);
        usePlayerStore.setState({ currentTrack: tracks[0], queueIndex: 0, durationMs: tracks[0].durationMs });
      }
    });

    // Load library folder roots
    TauriBridge.getLibraryFolders().then((f) => setFolders(f));

    // Enumerate audio endpoints (WASAPI)
    TauriBridge.getAudioDevices().then((devs) => {
      if (devs.length > 0) {
        setDevices(devs);
      }
    });
  }, [setTracks, setFolders, setDevices]);

  // Audio playback position polling / state sync
  useEffect(() => {
    const timer = setInterval(async () => {
      const state = usePlayerStore.getState();
      if (state.isPlaying) {
        // Query native audio engine status
        const status = await TauriBridge.getPlaybackStatus();
        if (status) {
          usePlayerStore.getState().setOutputStatus(status);
        } else {
          // Advance synthetic playback timer if running in preview
          const nextTime = state.currentTimeMs + 250;
          if (nextTime >= state.durationMs) {
            usePlayerStore.getState().nextTrack();
          } else {
            setCurrentTime(nextTime);
          }
        }
      }
    }, 250);

    return () => clearInterval(timer);
  }, [isPlaying, setCurrentTime]);

  return <AppLayout />;
};

export default App;
