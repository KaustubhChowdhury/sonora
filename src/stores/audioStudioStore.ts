import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AudioDevice, AudioOutputMode, DspSettings } from "../types/music";

export const EQ_FREQUENCIES = [
  "31Hz",
  "63Hz",
  "125Hz",
  "250Hz",
  "500Hz",
  "1kHz",
  "2kHz",
  "4kHz",
  "8kHz",
  "16kHz",
];

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "Bass Boost": [5.5, 4.5, 3.0, 1.5, 0, 0, 0, 0, 0, 0],
  "Vocal Clarity": [-1.0, -0.5, 0, 2.0, 3.5, 3.0, 2.0, 1.0, 0, -1.0],
  "Acoustic Warmth": [3.0, 2.5, 1.5, 1.0, 0.5, 0.5, 1.0, 1.5, 2.0, 1.5],
  Rock: [4.0, 3.0, 1.5, 0, -1.0, 0.5, 2.0, 3.5, 4.0, 3.5],
  Electronic: [5.0, 4.0, 2.0, 0, -1.5, 0, 2.0, 3.0, 4.5, 4.0],
  Custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export interface BoosterSettings {
  enabled: boolean;
  preampBoostDb: number; // 0 to 18 dB (up to 400% volume)
  bassBoostDb: number;   // 0 to 15 dB (sub-bass punch)
  clarityBoostDb: number; // 0 to 10 dB (vocal/treble shine)
  activePreset: string;
}

export const BOOSTER_PRESETS: Record<string, { preamp: number; bass: number; clarity: number }> = {
  Loud: { preamp: 9.0, bass: 3.0, clarity: 2.0 },
  "Heavy bass": { preamp: 6.0, bass: 12.0, clarity: 3.5 },
  Club: { preamp: 4.5, bass: 10.0, clarity: 1.0 },
  "Clear vocals": { preamp: 3.0, bass: 1.0, clarity: 7.5 },
  Warm: { preamp: 5.0, bass: 5.0, clarity: 2.0 },
  "Quiet room": { preamp: 6.0, bass: 4.0, clarity: 3.0 },
};

interface AudioStudioState {
  devices: AudioDevice[];
  selectedDeviceId: string;
  outputMode: AudioOutputMode;
  exclusiveModeWarningDismissed: boolean;
  
  dspSettings: DspSettings;
  boosterSettings: BoosterSettings;
  isBoosterModalOpen: boolean;
  
  // Real-time diagnostics
  bufferSizeFrames: number;
  estimatedLatencyMs: number;
  underrunCount: number;
  isExclusiveActive: boolean;

  // Actions
  setDevices: (devices: AudioDevice[]) => void;
  selectDevice: (deviceId: string) => void;
  setOutputMode: (mode: AudioOutputMode) => void;
  setExclusiveWarningDismissed: (val: boolean) => void;
  setDspBypass: (bypass: boolean) => void;
  setPreampGain: (gainDb: number) => void;
  setEqBand: (index: number, valueDb: number) => void;
  applyEqPreset: (presetName: string) => void;
  setReplayGainMode: (mode: "off" | "track" | "album") => void;
  setCrossfadeSeconds: (seconds: number) => void;
  resetDiagnostics: () => void;

  // Audio Booster Actions
  toggleBooster: () => void;
  setBoosterEnabled: (enabled: boolean) => void;
  setBoosterPreamp: (gainDb: number) => void;
  setBoosterBass: (gainDb: number) => void;
  setBoosterClarity: (gainDb: number) => void;
  applyBoosterPreset: (presetName: string) => void;
  setBoosterModalOpen: (open: boolean) => void;
}

export const useAudioStudioStore = create<AudioStudioState>()(
  persist(
  (set, get) => ({
  devices: [],
  selectedDeviceId: "",
  outputMode: "shared",
  exclusiveModeWarningDismissed: false,

  dspSettings: {
    bypass: false,
    preampGainDb: 0,
    eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    eqPreset: "Flat",
    replayGainMode: "off",
    crossfadeSeconds: 0,
  },

  boosterSettings: {
    enabled: false,
    preampBoostDb: 6.0, // +6 dB (200% volume by default)
    bassBoostDb: 8.0,   // +8 dB sub-bass punch
    clarityBoostDb: 3.5, // +3.5 dB vocal/treble shine
    activePreset: "Heavy bass",
  },
  isBoosterModalOpen: false,

  bufferSizeFrames: 1024,
  estimatedLatencyMs: 21.3,
  underrunCount: 0,
  isExclusiveActive: false,

  setDevices: (devices) => set({ devices }),
  selectDevice: (deviceId) => set({ selectedDeviceId: deviceId }),

  setOutputMode: (mode) => {
    // If switching to exclusive, note that bit-perfect bypasses sample-changing DSP
    if (mode === "exclusive") {
      set({
        outputMode: "exclusive",
        isExclusiveActive: true,
      });
    } else {
      set({
        outputMode: "shared",
        isExclusiveActive: false,
      });
    }
  },

  setExclusiveWarningDismissed: (val) => set({ exclusiveModeWarningDismissed: val }),

  setDspBypass: (bypass) =>
    set((state) => ({
      dspSettings: { ...state.dspSettings, bypass },
    })),

  setPreampGain: (gainDb) =>
    set((state) => ({
      dspSettings: { ...state.dspSettings, preampGainDb: gainDb },
    })),

  setEqBand: (index, valueDb) => {
    const { dspSettings } = get();
    const newBands = [...dspSettings.eqBands];
    newBands[index] = Math.max(-12, Math.min(12, valueDb));
    set({
      dspSettings: {
        ...dspSettings,
        eqBands: newBands,
        eqPreset: "Custom",
      },
    });
  },

  applyEqPreset: (presetName) => {
    const preset = EQ_PRESETS[presetName];
    if (preset) {
      set((state) => ({
        dspSettings: {
          ...state.dspSettings,
          eqBands: [...preset],
          eqPreset: presetName,
        },
      }));
    }
  },

  setReplayGainMode: (mode) =>
    set((state) => ({
      dspSettings: { ...state.dspSettings, replayGainMode: mode },
    })),

  setCrossfadeSeconds: (seconds) =>
    set((state) => ({
      dspSettings: {
        ...state.dspSettings,
        crossfadeSeconds: Math.max(0, Math.min(10, seconds)),
      },
    })),

  resetDiagnostics: () =>
    set({
      underrunCount: 0,
    }),

  // Audio Booster Actions
  toggleBooster: () =>
    set((state) => {
      const next = !state.boosterSettings.enabled;
      return {
        boosterSettings: { ...state.boosterSettings, enabled: next },
      };
    }),

  setBoosterEnabled: (enabled) =>
    set((state) => ({
      boosterSettings: { ...state.boosterSettings, enabled },
    })),

  setBoosterPreamp: (gainDb) =>
    set((state) => ({
      boosterSettings: {
        ...state.boosterSettings,
        preampBoostDb: Math.max(0, Math.min(18, gainDb)),
        activePreset: "Custom",
      },
    })),

  setBoosterBass: (gainDb) =>
    set((state) => ({
      boosterSettings: {
        ...state.boosterSettings,
        bassBoostDb: Math.max(0, Math.min(15, gainDb)),
        activePreset: "Custom",
      },
    })),

  setBoosterClarity: (gainDb) =>
    set((state) => ({
      boosterSettings: {
        ...state.boosterSettings,
        clarityBoostDb: Math.max(0, Math.min(10, gainDb)),
        activePreset: "Custom",
      },
    })),

  applyBoosterPreset: (presetName) => {
    const p = BOOSTER_PRESETS[presetName];
    if (p) {
      set((state) => ({
        boosterSettings: {
          ...state.boosterSettings,
          preampBoostDb: p.preamp,
          bassBoostDb: p.bass,
          clarityBoostDb: p.clarity,
          activePreset: presetName,
        },
      }));
    }
  },

  setBoosterModalOpen: (open) => set({ isBoosterModalOpen: open }),
}),
  {
    name: "sonora-sound",
    version: 2,
    storage: createJSONStorage(() => localStorage),
    partialize: (s) => ({
      selectedDeviceId: s.selectedDeviceId,
      outputMode: s.outputMode,
      exclusiveModeWarningDismissed: s.exclusiveModeWarningDismissed,
      dspSettings: s.dspSettings,
      boosterSettings: s.boosterSettings,
    }),
    migrate: () => ({}) as any,
  }
  )
);
