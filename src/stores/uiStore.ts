import { create } from "zustand";
import { Track } from "../types/music";

export type AppRoute =
  | "home"
  | "search"
  | "jiosaavn"
  | "youtube"
  | "library"
  | "album-detail"
  | "artist-detail"
  | "playlists"
  | "playlist-detail"
  | "explore"
  | "audio-studio"
  | "settings";

export type InspectorTab = "queue" | "lyrics" | "track-info";

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  track: Track | null;
}

interface UiState {
  activeRoute: AppRoute;
  selectedAlbumId: string | null;
  selectedArtistId: string | null;
  selectedPlaylistId: string | null;
  
  inspectorOpen: boolean;
  inspectorTab: InspectorTab;
  
  isFullPlayerOpen: boolean;
  isCommandPaletteOpen: boolean;
  isOnboardingOpen: boolean;
  
  contextMenu: ContextMenuState;
  toastMessage: string | null;

  // Actions
  navigate: (route: AppRoute, params?: { albumId?: string; artistId?: string; playlistId?: string }) => void;
  toggleInspector: (tab?: InspectorTab) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  closeInspector: () => void;
  setFullPlayerOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setOnboardingOpen: (open: boolean) => void;
  openContextMenu: (x: number, y: number, track: Track) => void;
  closeContextMenu: () => void;
  showToast: (msg: string) => void;
  hideToast: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  activeRoute: "home",
  selectedAlbumId: null,
  selectedArtistId: null,
  selectedPlaylistId: null,

  inspectorOpen: false,
  inspectorTab: "queue",

  isFullPlayerOpen: false,
  isCommandPaletteOpen: false,
  isOnboardingOpen: false,

  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
    track: null,
  },
  toastMessage: null,

  navigate: (route, params) => {
    set({
      activeRoute: route,
      selectedAlbumId: params?.albumId ?? null,
      selectedArtistId: params?.artistId ?? null,
      selectedPlaylistId: params?.playlistId ?? null,
    });
  },

  toggleInspector: (tab) => {
    const { inspectorOpen, inspectorTab } = get();
    if (tab && (!inspectorOpen || inspectorTab !== tab)) {
      set({ inspectorOpen: true, inspectorTab: tab });
    } else {
      set({ inspectorOpen: !inspectorOpen });
    }
  },

  setInspectorTab: (tab) => set({ inspectorTab: tab, inspectorOpen: true }),
  closeInspector: () => set({ inspectorOpen: false }),

  setFullPlayerOpen: (open) => set({ isFullPlayerOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setOnboardingOpen: (open) => set({ isOnboardingOpen: open }),

  openContextMenu: (x, y, track) => {
    set({
      contextMenu: {
        isOpen: true,
        x,
        y,
        track,
      },
    });
  },

  closeContextMenu: () => {
    set({
      contextMenu: {
        isOpen: false,
        x: 0,
        y: 0,
        track: null,
      },
    });
  },

  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 3200);
  },

  hideToast: () => set({ toastMessage: null }),
}));
