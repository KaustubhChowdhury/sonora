import { create } from "zustand";
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
  "Audiophile Neutral": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "Bass Boost": [5.5, 4.5, 3.0, 1.5, 0, 0, 0, 0, 0, 0],
  "Vocal Clarity": [-1.0, -0.5, 0, 2.0, 3.5, 3.0, 2.0, 1.0, 0, -1.0],
  "Acoustic Warmth": [3.0, 2.5, 1.5, 1.0, 0.5, 0.5, 1.0, 1.5, 2.0, 1.5],
  "Rock & Electric": [4.0, 3.0, 1.5, 0, -1.0, 0.5, 2.0, 3.5, 4.0, 3.5],
  "Electronic / Club": [5.0, 4.0, 2.0, 0, -1.5, 0, 2.0, 3.0, 4.5, 4.0],
  Custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

interface AudioStudioState {
  devices: AudioDevice[];
  selectedDeviceId: string;
  outputMode: AudioOutputMode;
  exclusiveModeWarningDismissed: boolean;
  
  dspSettings: DspSettings;
  
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
}

export const useAudioStudioStore = create<AudioStudioState>((set, get) => ({
  devices: [
    {
      id: "default-wasapi",
      name: "Realtek High Definition Audio (Default System Endpoint)",
      isDefault: true,
      sampleRates: [44100, 48000, 88200, 96000, 192000],
      channels: 2,
      exclusiveSupported: true,
    },
    {
      id: "usb-dac-01",
      name: "USB HiFi DAC / Audio Interface (ASIO/WASAPI Direct)",
      isDefault: false,
      sampleRates: [44100, 48000, 88200, 96000, 176400, 192000],
      channels: 2,
      exclusiveSupported: true,
    },
  ],
  selectedDeviceId: "default-wasapi",
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
}));
