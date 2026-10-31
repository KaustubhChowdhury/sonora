import { create } from "zustand";
import { Track, Album, Artist, Playlist, FolderScanStatus, PlayHistoryEntry } from "../types/music";

interface LibraryState {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  folders: string[];
  scanStatus: FolderScanStatus;
  history: PlayHistoryEntry[];
  
  // Library filters & view modes
  activeView: "songs" | "albums" | "artists" | "folders" | "favourites" | "history";
  viewMode: "grid" | "list";
  searchQuery: string;
  sourceFilter: "all" | "local" | "jamendo" | "navidrome";
  qualityFilter: "all" | "lossless" | "hires";
  sortBy: "title" | "artist" | "album" | "duration" | "year" | "dateAdded";
  sortOrder: "asc" | "desc";

  // Actions
  setTracks: (tracks: Track[]) => void;
  addTracks: (newTracks: Track[]) => void;
  setAlbums: (albums: Album[]) => void;
  setArtists: (artists: Artist[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  addPlaylist: (name: string, description?: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  
  toggleTrackFavourite: (trackId: string) => void;
  addHistoryEntry: (entry: Omit<PlayHistoryEntry, "id">) => void;
  
  setFolders: (folders: string[]) => void;
  addFolder: (folder: string) => void;
  removeFolder: (folder: string) => void;
  setScanStatus: (status: Partial<FolderScanStatus>) => void;
  
  setActiveView: (view: "songs" | "albums" | "artists" | "folders" | "favourites" | "history") => void;
  setViewMode: (mode: "grid" | "list") => void;
  setSearchQuery: (query: string) => void;
  setSourceFilter: (filter: "all" | "local" | "jamendo" | "navidrome") => void;
  setQualityFilter: (filter: "all" | "lossless" | "hires") => void;
  setSort: (by: "title" | "artist" | "album" | "duration" | "year" | "dateAdded", order?: "asc" | "desc") => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  albums: [],
  artists: [],
  playlists: [
    {
      id: "playlist-smart-lossless",
      name: "Lossless Master Vault",
      description: "Auto-curated 24-bit and bit-perfect FLAC/ALAC lossless tracks",
      trackCount: 0,
      totalDurationMs: 0,
      isSmart: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "playlist-smart-recent",
      name: "Recently Added",
      description: "Tracks imported into Sonora in the last 30 days",
      trackCount: 0,
      totalDurationMs: 0,
      isSmart: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  folders: [],
  scanStatus: {
    isScanning: false,
    scannedFiles: 0,
    totalCandidates: 0,
    errorCount: 0,
    errors: [],
  },
  history: [],

  activeView: "songs",
  viewMode: "list",
  searchQuery: "",
  sourceFilter: "all",
  qualityFilter: "all",
  sortBy: "title",
  sortOrder: "asc",

  setTracks: (tracks) => {
    // Recompute albums and artists from tracks
    const albumMap = new Map<string, Album>();
    const artistMap = new Map<string, Artist>();

    tracks.forEach((t) => {
      const albumKey = `${t.artists[0] || "Unknown Artist"} - ${t.album || "Unknown Album"}`;
      const existingAlbum = albumMap.get(albumKey);
      if (existingAlbum) {
        existingAlbum.trackCount += 1;
        existingAlbum.totalDurationMs += t.durationMs;
        if (!existingAlbum.artworkUrl && t.artworkUrl) {
          existingAlbum.artworkUrl = t.artworkUrl;
        }
      } else {
        albumMap.set(albumKey, {
          id: t.albumId || `album-${albumKey}`,
          title: t.album || "Unknown Album",
          artist: t.artists[0] || "Unknown Artist",
          year: t.year,
          genre: t.genre,
          artworkUrl: t.artworkUrl,
          trackCount: 1,
          totalDurationMs: t.durationMs,
          sourceKind: t.sourceKind,
        });
      }

      t.artists.forEach((art) => {
        const existingArtist = artistMap.get(art);
        if (existingArtist) {
          existingArtist.trackCount += 1;
        } else {
          artistMap.set(art, {
            id: `artist-${art}`,
            name: art,
            albumCount: 1,
            trackCount: 1,
            artworkUrl: t.artworkUrl,
          });
        }
      });
    });

    set({
      tracks,
      albums: Array.from(albumMap.values()),
      artists: Array.from(artistMap.values()),
    });
  },

  addTracks: (newTracks) => {
    const existing = get().tracks;
    const combined = [...existing, ...newTracks];
    get().setTracks(combined);
  },

  setAlbums: (albums) => set({ albums }),
  setArtists: (artists) => set({ artists }),
  setPlaylists: (playlists) => set({ playlists }),

  addPlaylist: (name, description) => {
    const newPl: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      description,
      trackCount: 0,
      totalDurationMs: 0,
      isSmart: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ playlists: [...state.playlists, newPl] }));
    return newPl;
  },

  deletePlaylist: (playlistId) => {
    set((state) => ({
      playlists: state.playlists.filter((p) => p.id !== playlistId),
    }));
  },

  addTrackToPlaylist: (playlistId, _trackId) => {
    set((state) => ({
      playlists: state.playlists.map((p) =>
        p.id === playlistId
          ? { ...p, trackCount: p.trackCount + 1, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
  },

  removeTrackFromPlaylist: (playlistId, _trackId) => {
    set((state) => ({
      playlists: state.playlists.map((p) =>
        p.id === playlistId && p.trackCount > 0
          ? { ...p, trackCount: p.trackCount - 1, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
  },

  toggleTrackFavourite: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, isFavourite: !t.isFavourite } : t
      ),
    }));
  },

  addHistoryEntry: (entry) => {
    const newEntry: PlayHistoryEntry = {
      ...entry,
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    set((state) => ({
      history: [newEntry, ...state.history.slice(0, 99)],
    }));
  },

  setFolders: (folders) => set({ folders }),
  addFolder: (folder) => {
    const existing = get().folders;
    if (!existing.includes(folder)) {
      set({ folders: [...existing, folder] });
    }
  },
  removeFolder: (folder) => {
    set((state) => ({
      folders: state.folders.filter((f) => f !== folder),
    }));
  },

  setScanStatus: (status) =>
    set((state) => ({
      scanStatus: { ...state.scanStatus, ...status },
    })),

  setActiveView: (view) => set({ activeView: view }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSourceFilter: (filter) => set({ sourceFilter: filter }),
  setQualityFilter: (filter) => set({ qualityFilter: filter }),
  setSort: (by, order) => {
    const current = get();
    const newOrder =
      order !== undefined
        ? order
        : current.sortBy === by && current.sortOrder === "asc"
        ? "desc"
        : "asc";
    set({ sortBy: by, sortOrder: newOrder });
  },
}));
