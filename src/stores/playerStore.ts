import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Track, AudioOutputStatus } from "../types/music";
import { AudioEngine } from "../services/audioEngine";
import { useLibraryStore } from "./libraryStore";

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: "off" | "all" | "one";
  queue: Track[];
  queueIndex: number;
  outputStatus: AudioOutputStatus;
  
  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlayPause: () => void;
  pause: () => void;
  resume: () => void;
  seek: (timeMs: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (tracks: Track | Track[], next?: boolean) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  setOutputStatus: (status: Partial<AudioOutputStatus>) => void;
  setCurrentTime: (timeMs: number) => void;
  setDuration: (durationMs: number) => void;
  setTrackFavourite: (trackId: string, isFav: boolean) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
  (set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTimeMs: 0,
  durationMs: 0,
  volume: 0.85,
  isMuted: false,
  isShuffle: false,
  repeatMode: "off",
  queue: [],
  queueIndex: -1,
  outputStatus: {
    mode: "shared",
    deviceName: "Windows Default Endpoint (Direct WASAPI)",
    negotiatedSampleRate: 48000,
    negotiatedBitDepth: 24,
    negotiatedChannels: 2,
    isBitPerfect: false,
    dspBypassed: false,
    underrunCount: 0,
  },

  playTrack: (track, newQueue) => {
    let queue = get().queue;
    let index = 0;

    if (newQueue && newQueue.length > 0) {
      queue = newQueue;
      index = queue.findIndex((t) => t.id === track.id);
      if (index === -1) {
        queue = [track, ...queue];
        index = 0;
      }
    } else {
      const existingIdx = queue.findIndex((t) => t.id === track.id);
      if (existingIdx !== -1) {
        index = existingIdx;
      } else {
        queue = [...queue, track];
        index = queue.length - 1;
      }
    }

    set({
      currentTrack: track,
      queue,
      queueIndex: index,
      isPlaying: true,
      currentTimeMs: 0,
      durationMs: track.durationMs || 180000,
    });

    try {
      useLibraryStore.getState().recordTrackPlayed(track);
    } catch (e) {
      console.warn("Record track played note:", e);
    }

    AudioEngine.playTrack(track);
  },

  togglePlayPause: () => {
    const { isPlaying, currentTrack, queue } = get();
    if (!currentTrack && queue.length > 0) {
      get().playTrack(queue[0]);
      return;
    }
    const nextState = !isPlaying;
    set({ isPlaying: nextState });
    if (nextState) {
      AudioEngine.resume();
    } else {
      AudioEngine.pause();
    }
  },

  pause: () => {
    set({ isPlaying: false });
    AudioEngine.pause();
  },

  resume: () => {
    set({ isPlaying: true });
    AudioEngine.resume();
  },

  seek: (timeMs: number) => {
    const { durationMs } = get();
    const clamped = Math.max(0, Math.min(timeMs, durationMs));
    set({ currentTimeMs: clamped });
    AudioEngine.seek(clamped);
  },

  nextTrack: () => {
    const { queue, queueIndex, repeatMode, isShuffle } = get();
    if (queue.length === 0) return;

    if (repeatMode === "one") {
      set({ currentTimeMs: 0, isPlaying: true });
      const current = queue[queueIndex];
      if (current) AudioEngine.playTrack(current);
      return;
    }

    let nextIdx = queueIndex + 1;
    if (isShuffle && queue.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * queue.length);
      } while (nextIdx === queueIndex);
    } else if (nextIdx >= queue.length) {
      if (repeatMode === "all") {
        nextIdx = 0;
      } else {
        set({ isPlaying: false });
        AudioEngine.pause();
        return;
      }
    }

    const nextTrack = queue[nextIdx];
    if (nextTrack) {
      set({
        currentTrack: nextTrack,
        queueIndex: nextIdx,
        isPlaying: true,
        currentTimeMs: 0,
        durationMs: nextTrack.durationMs || 180000,
      });
      AudioEngine.playTrack(nextTrack);
    }
  },

  prevTrack: () => {
    const { queue, queueIndex, currentTimeMs } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart track
    if (currentTimeMs > 3000) {
      set({ currentTimeMs: 0 });
      AudioEngine.seek(0);
      return;
    }

    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = queue.length - 1;
    }

    const prevTrack = queue[prevIdx];
    if (prevTrack) {
      set({
        currentTrack: prevTrack,
        queueIndex: prevIdx,
        isPlaying: true,
        currentTimeMs: 0,
        durationMs: prevTrack.durationMs || 180000,
      });
      AudioEngine.playTrack(prevTrack);
    }
  },

  setVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ volume: clamped, isMuted: false });
    AudioEngine.setVolume(clamped);
  },

  toggleMute: () => {
    const muted = !get().isMuted;
    set({ isMuted: muted });
    AudioEngine.setVolume(muted ? 0 : get().volume);
  },

  toggleShuffle: () => {
    set((state) => ({ isShuffle: !state.isShuffle }));
  },

  toggleRepeat: () => {
    set((state) => {
      const next =
        state.repeatMode === "off"
          ? "all"
          : state.repeatMode === "all"
          ? "one"
          : "off";
      return { repeatMode: next };
    });
  },

  addToQueue: (tracks, next = false) => {
    const trackArr = Array.isArray(tracks) ? tracks : [tracks];
    const { queue, queueIndex } = get();
    if (next && queueIndex !== -1) {
      const newQueue = [...queue];
      newQueue.splice(queueIndex + 1, 0, ...trackArr);
      set({ queue: newQueue });
    } else {
      set({ queue: [...queue, ...trackArr] });
    }
  },

  removeFromQueue: (index: number) => {
    const { queue, queueIndex } = get();
    if (index < 0 || index >= queue.length) return;
    const newQueue = queue.filter((_, idx) => idx !== index);
    let newIdx = queueIndex;
    if (index < queueIndex) {
      newIdx -= 1;
    } else if (index === queueIndex) {
      if (newQueue.length === 0) {
        set({ queue: [], queueIndex: -1, currentTrack: null, isPlaying: false });
        return;
      }
      newIdx = Math.min(queueIndex, newQueue.length - 1);
      set({ currentTrack: newQueue[newIdx] });
    }
    set({ queue: newQueue, queueIndex: newIdx });
  },

  reorderQueue: (fromIndex: number, toIndex: number) => {
    const { queue, queueIndex, currentTrack } = get();
    const newQueue = [...queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);

    let newCurrentIdx = newQueue.findIndex((t) => t.id === currentTrack?.id);
    if (newCurrentIdx === -1) newCurrentIdx = queueIndex;

    set({ queue: newQueue, queueIndex: newCurrentIdx });
  },

  clearQueue: () => {
    set({ queue: [], queueIndex: -1, currentTrack: null, isPlaying: false });
  },

  setOutputStatus: (status) => {
    set((state) => ({
      outputStatus: { ...state.outputStatus, ...status },
    }));
  },

  setCurrentTime: (timeMs) => set({ currentTimeMs: timeMs }),
  setDuration: (durationMs) => set({ durationMs: durationMs }),

  setTrackFavourite: (trackId, isFav) => {
    set((state) => {
      const updatedQueue = state.queue.map((t) =>
        t.id === trackId ? { ...t, isFavourite: isFav } : t
      );
      const updatedCurrent =
        state.currentTrack?.id === trackId
          ? { ...state.currentTrack, isFavourite: isFav }
          : state.currentTrack;
      return { queue: updatedQueue, currentTrack: updatedCurrent };
    });
  },
}),
  {
    name: "sonora-player",
    storage: createJSONStorage(() => localStorage),
    partialize: (s) => ({
      volume: s.volume,
      isMuted: s.isMuted,
      isShuffle: s.isShuffle,
      repeatMode: s.repeatMode,
      // Restore what was playing (paused) on the next launch
      currentTrack: s.currentTrack,
      durationMs: s.durationMs,
      queue: s.queue.slice(0, 300),
      queueIndex: s.queueIndex < 300 ? s.queueIndex : -1,
    }),
  }
  )
);
