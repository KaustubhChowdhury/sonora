import React, { useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { AppMotionProvider } from "./animations/MotionProvider";
import { useLibraryStore } from "./stores/libraryStore";
import { useAudioStudioStore } from "./stores/audioStudioStore";
import { usePlayerStore } from "./stores/playerStore";
import { TauriBridge } from "./services/tauriBridge";
import { useAmbientColor } from "./hooks/useAmbientColor";

export const App: React.FC = () => {
  useAmbientColor();

  useEffect(() => {
    TauriBridge.getLibraryTracks().then((tracks) => {
      useLibraryStore.getState().setTracks(tracks);
      // Cue (but don't start) the first track so the transport isn't empty on launch.
      const player = usePlayerStore.getState();
      if (!player.currentTrack && tracks.length > 0) {
        usePlayerStore.setState({
          queue: tracks,
          queueIndex: 0,
          currentTrack: tracks[0],
          durationMs: tracks[0].durationMs,
        });
      }
    });
    TauriBridge.getLibraryFolders().then((f) => useLibraryStore.getState().setFolders(f));
    TauriBridge.getAudioDevices().then((devs) => {
      if (devs.length > 0) useAudioStudioStore.getState().setDevices(devs);
    });
  }, []);

  return (
    <AppMotionProvider>
      <AppLayout />
    </AppMotionProvider>
  );
};

export default App;
