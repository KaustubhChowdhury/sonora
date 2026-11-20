import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Subsonic / Navidrome connection. Only the salted token is stored (Subsonic's
 * token auth: md5(password + salt)), never the password itself.
 */
export interface SubsonicSettings {
  serverUrl: string;
  username: string;
  token: string;
  salt: string;
  isConnected: boolean;
  statusMessage?: string;
}

interface ProviderState {
  subsonic: SubsonicSettings;
  setSubsonic: (cfg: Partial<SubsonicSettings>) => void;
  disconnectSubsonic: () => void;
}

const EMPTY: SubsonicSettings = { serverUrl: "", username: "", token: "", salt: "", isConnected: false };

export const useProviderStore = create<ProviderState>()(
  persist(
    (set) => ({
      subsonic: EMPTY,
      setSubsonic: (cfg) => set((s) => ({ subsonic: { ...s.subsonic, ...cfg } })),
      disconnectSubsonic: () => set({ subsonic: EMPTY }),
    }),
    { name: "sonora-providers", version: 2, storage: createJSONStorage(() => localStorage), migrate: () => ({}) as any }
  )
);
