import { create } from "zustand";
import { Track } from "../types/music";
import type { SaavnCollection } from "../services/tauriBridge";

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
  | "settings"
  | "collection";

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
  selectedCollection: SaavnCollection | null;
  
  inspectorOpen: boolean;
  inspectorTab: InspectorTab;
  
  isFullPlayerOpen: boolean;
  isCommandPaletteOpen: boolean;
  isOnboardingOpen: boolean;
  sidebarOpen: boolean;
  
  contextMenu: ContextMenuState;
  toastMessage: string | null;
  globalSearchQuery: string;
  history: { route: AppRoute; albumId: string | null; artistId: string | null; playlistId: string | null; collection: SaavnCollection | null }[];
  newPlaylist: { open: boolean; tracks: Track[] };

  // Actions
  navigate: (route: AppRoute, params?: { albumId?: string; artistId?: string; playlistId?: string; collection?: SaavnCollection }) => void;
  goBack: () => void;
  openNewPlaylist: (tracks?: Track[]) => void;
  closeNewPlaylist: () => void;
  setGlobalSearchQuery: (q: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
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
  selectedCollection: null,

  inspectorOpen: false,
  inspectorTab: "queue",

  isFullPlayerOpen: false,
  isCommandPaletteOpen: false,
  isOnboardingOpen: false,
  sidebarOpen: true,

  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
    track: null,
  },
  toastMessage: null,
  globalSearchQuery: "",
  history: [],
  newPlaylist: { open: false, tracks: [] },

  navigate: (route, params) => {
    const cur = get();
    const same =
      cur.activeRoute === route &&
      cur.selectedAlbumId === (params?.albumId ?? null) &&
      cur.selectedArtistId === (params?.artistId ?? null) &&
      cur.selectedPlaylistId === (params?.playlistId ?? null) &&
      cur.selectedCollection?.id === params?.collection?.id;
    if (same) return;
    set({
      history: [
        ...cur.history.slice(-30),
        {
          route: cur.activeRoute,
          albumId: cur.selectedAlbumId,
          artistId: cur.selectedArtistId,
          playlistId: cur.selectedPlaylistId,
          collection: cur.selectedCollection,
        },
      ],
      activeRoute: route,
      selectedAlbumId: params?.albumId ?? null,
      selectedArtistId: params?.artistId ?? null,
      selectedPlaylistId: params?.playlistId ?? null,
      selectedCollection: params?.collection ?? null,
    });
  },

  goBack: () => {
    const h = get().history;
    const prev = h[h.length - 1];
    if (!prev) return;
    set({
      history: h.slice(0, -1),
      activeRoute: prev.route,
      selectedAlbumId: prev.albumId,
      selectedArtistId: prev.artistId,
      selectedPlaylistId: prev.playlistId,
      selectedCollection: prev.collection,
    });
  },

  openNewPlaylist: (tracks = []) => set({ newPlaylist: { open: true, tracks } }),
  closeNewPlaylist: () => set({ newPlaylist: { open: false, tracks: [] } }),

  setGlobalSearchQuery: (globalSearchQuery: string) => {
    set({ globalSearchQuery });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

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
