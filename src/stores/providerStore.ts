import { create } from "zustand";

interface SubsonicSettings {
  serverUrl: string;
  username: string;
  token: string;
  salt: string;
  isConnected: boolean;
  serverVersion?: string;
  statusMessage?: string;
}

interface ProviderState {
  jamendoEnabled: boolean;
  jamendoClientId: string;
  
  subsonic: SubsonicSettings;
  
  // Actions
  setJamendoEnabled: (enabled: boolean) => void;
  setJamendoClientId: (id: string) => void;
  setSubsonicConfig: (cfg: Partial<SubsonicSettings>) => void;
  setSubsonicConnected: (connected: boolean, ver?: string, msg?: string) => void;
}

export const useProviderStore = create<ProviderState>((set) => ({
  jamendoEnabled: true,
  jamendoClientId: "56d30c95",

  subsonic: {
    serverUrl: "",
    username: "",
    token: "",
    salt: "",
    isConnected: false,
    serverVersion: undefined,
    statusMessage: undefined,
  },

  setJamendoEnabled: (enabled) => set({ jamendoEnabled: enabled }),
  setJamendoClientId: (id) => set({ jamendoClientId: id }),
  setSubsonicConfig: (cfg) =>
    set((state) => ({ subsonic: { ...state.subsonic, ...cfg } })),
  setSubsonicConnected: (connected, ver, msg) =>
    set((state) => ({
      subsonic: {
        ...state.subsonic,
        isConnected: connected,
        serverVersion: ver,
        statusMessage: msg,
      },
    })),
}));
