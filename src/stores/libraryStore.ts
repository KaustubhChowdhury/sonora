import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Track, Album, Artist, FolderScanStatus, PlayHistoryEntry } from "../types/music";
import { TauriBridge } from "../services/tauriBridge";

/** A user playlist. Tracks are stored whole so streamed tracks survive without a library entry. */
export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

export type LibraryView = "songs" | "albums" | "artists" | "folders" | "favourites" | "history";
export type SortKey = "title" | "artist" | "album" | "duration" | "year" | "dateAdded";

interface LibraryState {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  folders: string[];
  scanStatus: FolderScanStatus;
  history: PlayHistoryEntry[];
  recentlyPlayed: Track[];
  customPlaylists: CustomPlaylist[];
  favourites: Track[];

  activeView: LibraryView;
  viewMode: "grid" | "list";
  searchQuery: string;
  sourceFilter: "all" | "local" | "jamendo" | "navidrome";
  qualityFilter: "all" | "lossless" | "hires";
  sortBy: SortKey;
  sortOrder: "asc" | "desc";

  setTracks: (tracks: Track[]) => void;
  addTracks: (newTracks: Track[]) => void;

  recordTrackPlayed: (track: Track) => void;
  clearRecentlyPlayed: () => void;
  createCustomPlaylist: (name: string, description?: string) => CustomPlaylist;
  renameCustomPlaylist: (id: string, name: string) => void;
  deleteCustomPlaylist: (id: string) => void;
  addTrackToCustomPlaylist: (playlistId: string, track: Track | Track[]) => number;
  removeTrackFromCustomPlaylist: (playlistId: string, trackId: string) => void;

  isFavourite: (trackId: string) => boolean;
  toggleTrackFavourite: (track: Track) => boolean;
  addHistoryEntry: (entry: Omit<PlayHistoryEntry, "id">) => void;

  setFolders: (folders: string[]) => void;
  addFolder: (folder: string) => void;
  removeFolder: (folder: string) => void;
  setScanStatus: (status: Partial<FolderScanStatus>) => void;

  setActiveView: (view: LibraryView) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setSearchQuery: (query: string) => void;
  setSourceFilter: (filter: "all" | "local" | "jamendo" | "navidrome") => void;
  setQualityFilter: (filter: "all" | "lossless" | "hires") => void;
  setSort: (by: SortKey, order?: "asc" | "desc") => void;
}

const now = () => new Date().toISOString();

/** Stable album id for a track, matching the ids produced by deriveAlbumsAndArtists. */
export function albumIdFor(t: Track): string {
  return t.albumId || `album-${t.artists[0] || "Unknown artist"}\u0000${t.album || "Unknown album"}`;
}

function deriveAlbumsAndArtists(tracks: Track[]) {
  const albumMap = new Map<string, Album>();
  const artistMap = new Map<string, Artist & { _albums: Set<string> }>();

  for (const t of tracks) {
    const artist = t.artists[0] || "Unknown artist";
    const albumTitle = t.album || "Unknown album";
    const albumKey = `${artist}\u0000${albumTitle}`;
    const existing = albumMap.get(albumKey);
    if (existing) {
      existing.trackCount += 1;
      existing.totalDurationMs += t.durationMs;
      existing.artworkUrl ||= t.artworkUrl;
      existing.year ||= t.year;
    } else {
      albumMap.set(albumKey, {
        id: albumIdFor(t),
        title: albumTitle,
        artist,
        year: t.year,
        genre: t.genre,
        artworkUrl: t.artworkUrl,
        trackCount: 1,
        totalDurationMs: t.durationMs,
        sourceKind: t.sourceKind,
      });
    }

    for (const name of t.artists) {
      const a = artistMap.get(name);
      if (a) {
        a.trackCount += 1;
        a._albums.add(albumTitle);
        a.albumCount = a._albums.size;
        a.artworkUrl ||= t.artworkUrl;
      } else {
        artistMap.set(name, {
          id: `artist-${name}`,
          name,
          albumCount: 1,
          trackCount: 1,
          artworkUrl: t.artworkUrl,
          _albums: new Set([albumTitle]),
        });
      }
    }
  }

  return {
    albums: Array.from(albumMap.values()),
    artists: Array.from(artistMap.values()).map(({ _albums, ...a }) => a),
  };
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      tracks: [],
      albums: [],
      artists: [],
      folders: [],
      scanStatus: { isScanning: false, scannedFiles: 0, totalCandidates: 0, errorCount: 0, errors: [] },
      history: [],
      recentlyPlayed: [],
      customPlaylists: [],
      favourites: [],

      activeView: "songs",
      viewMode: "list",
      searchQuery: "",
      sourceFilter: "all",
      qualityFilter: "all",
      sortBy: "title",
      sortOrder: "asc",

      setTracks: (tracks) => {
        const favIds = new Set(get().favourites.map((f) => f.id));
        const merged = tracks.map((t) => (favIds.has(t.id) ? { ...t, isFavourite: true } : t));
        set({ tracks: merged, ...deriveAlbumsAndArtists(merged) });
      },

      addTracks: (newTracks) => {
        const seen = new Set(get().tracks.map((t) => t.id));
        get().setTracks([...get().tracks, ...newTracks.filter((t) => !seen.has(t.id))]);
      },

      recordTrackPlayed: (track) =>
        set((state) => ({
          recentlyPlayed: [track, ...state.recentlyPlayed.filter((t) => t.id !== track.id)].slice(0, 30),
        })),

      clearRecentlyPlayed: () => set({ recentlyPlayed: [] }),

      createCustomPlaylist: (name, description) => {
        const pl: CustomPlaylist = {
          id: `pl-${Date.now().toString(36)}`,
          name,
          description: description || undefined,
          tracks: [],
          createdAt: now(),
          updatedAt: now(),
        };
        set((state) => ({ customPlaylists: [pl, ...state.customPlaylists] }));
        return pl;
      },

      renameCustomPlaylist: (id, name) =>
        set((state) => ({
          customPlaylists: state.customPlaylists.map((p) => (p.id === id ? { ...p, name, updatedAt: now() } : p)),
        })),

      deleteCustomPlaylist: (id) =>
        set((state) => ({ customPlaylists: state.customPlaylists.filter((p) => p.id !== id) })),

      addTrackToCustomPlaylist: (playlistId, input) => {
        const incoming = Array.isArray(input) ? input : [input];
        let added = 0;
        set((state) => ({
          customPlaylists: state.customPlaylists.map((pl) => {
            if (pl.id !== playlistId) return pl;
            const ids = new Set(pl.tracks.map((t) => t.id));
            const fresh = incoming.filter((t) => !ids.has(t.id));
            added = fresh.length;
            return fresh.length ? { ...pl, tracks: [...pl.tracks, ...fresh], updatedAt: now() } : pl;
          }),
        }));
        return added;
      },

      removeTrackFromCustomPlaylist: (playlistId, trackId) =>
        set((state) => ({
          customPlaylists: state.customPlaylists.map((pl) =>
            pl.id === playlistId ? { ...pl, tracks: pl.tracks.filter((t) => t.id !== trackId), updatedAt: now() } : pl
          ),
        })),

      isFavourite: (trackId) => get().favourites.some((f) => f.id === trackId),

      toggleTrackFavourite: (track) => {
        const isFav = !get().isFavourite(track.id);
        set((state) => ({
          favourites: isFav
            ? [{ ...track, isFavourite: true }, ...state.favourites]
            : state.favourites.filter((f) => f.id !== track.id),
          tracks: state.tracks.map((t) => (t.id === track.id ? { ...t, isFavourite: isFav } : t)),
        }));
        // Keep the player's copy of the track in sync. Imported lazily to avoid a circular import.
        import("./playerStore").then(({ usePlayerStore }) =>
          usePlayerStore.getState().setTrackFavourite(track.id, isFav)
        );
        if (track.sourceKind === "local") TauriBridge.toggleFavourite(track.id, isFav);
        return isFav;
      },

      addHistoryEntry: (entry) =>
        set((state) => ({
          history: [
            { ...entry, id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
            ...state.history.slice(0, 199),
          ],
        })),

      setFolders: (folders) => set({ folders }),
      addFolder: (folder) => {
        if (!get().folders.includes(folder)) set({ folders: [...get().folders, folder] });
      },
      removeFolder: (folder) => set((state) => ({ folders: state.folders.filter((f) => f !== folder) })),
      setScanStatus: (status) => set((state) => ({ scanStatus: { ...state.scanStatus, ...status } })),

      setActiveView: (view) => set({ activeView: view }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSourceFilter: (filter) => set({ sourceFilter: filter }),
      setQualityFilter: (filter) => set({ qualityFilter: filter }),
      setSort: (by, order) => {
        const cur = get();
        const nextOrder = order ?? (cur.sortBy === by && cur.sortOrder === "asc" ? "desc" : "asc");
        set({ sortBy: by, sortOrder: nextOrder });
      },
    }),
    {
      name: "sonora-library",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        recentlyPlayed: s.recentlyPlayed,
        customPlaylists: s.customPlaylists,
        favourites: s.favourites,
        history: s.history,
        viewMode: s.viewMode,
        sortBy: s.sortBy,
        sortOrder: s.sortOrder,
      }),
      // v1 had no persistence; anything older is discarded.
      migrate: () => ({}) as Partial<LibraryState>,
    }
  )
);
