import { create } from "zustand";
import { Track, Album, Artist, Playlist, FolderScanStatus, PlayHistoryEntry } from "../types/music";

export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  color?: string;
  tracks: Track[];
  createdAt: string;
}

const DEFAULT_RECENT_TRACKS: Track[] = [
  {
    id: "jio-s1",
    title: "Apna Bana Le",
    artists: ["Arijit Singh", "Sachin-Jigar"],
    album: "Bhediya / Trending Love",
    durationMs: 261000,
    sourceKind: "stream",
    providerId: "jiosaavn",
    providerTrackId: "jio-s1",
    streamUrl: "https://aac.saavncdn.com/675/1456dc2903d0fb4465d2d2904008803b_320.mp4",
    codec: "AAC",
    sampleRate: 44100,
    bitrate: 320,
    artworkUrl: "https://c.saavncdn.com/675/Trending-Love-Songs-Hindi-2026-20260506185328-500x500.jpg",
    attribution: "JioSaavn Music",
  },
  {
    id: "yt-curated-1",
    title: "METAMORPHOSIS (Sped Up / Ultra Bass)",
    artists: ["INTERWORLD"],
    album: "YouTube Music Viral",
    durationMs: 143000,
    sourceKind: "video",
    providerId: "youtube",
    providerTrackId: "6jy0pE4qT_8",
    youtubeVideoId: "6jy0pE4qT_8",
    streamUrl: "https://www.youtube.com/watch?v=6jy0pE4qT_8",
    codec: "Opus",
    artworkUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    attribution: "YouTube - INTERWORLD",
  },
  {
    id: "yt-curated-2",
    title: "Close Eyes (Slowed + Reverb Phonk)",
    artists: ["DVRST"],
    album: "Close Eyes",
    durationMs: 132000,
    sourceKind: "video",
    providerId: "youtube",
    providerTrackId: "p9A5_5-0eG4",
    youtubeVideoId: "p9A5_5-0eG4",
    streamUrl: "https://www.youtube.com/watch?v=p9A5_5-0eG4",
    codec: "Opus",
    artworkUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80",
    attribution: "YouTube - DVRST",
  },
  {
    id: "jio-s2",
    title: "Ishq de Fanniyar",
    artists: ["Jyotica Tangri"],
    album: "Fukrey Returns",
    durationMs: 254000,
    sourceKind: "stream",
    providerId: "jiosaavn",
    providerTrackId: "jio-s2",
    streamUrl: "https://aac.saavncdn.com/675/f1f48664e51db48f0d26a40d42d515a8_320.mp4",
    codec: "AAC",
    sampleRate: 44100,
    bitrate: 320,
    artworkUrl: "https://c.saavncdn.com/675/Trending-Love-Songs-Hindi-2026-20260506185328-500x500.jpg",
    attribution: "JioSaavn Music",
  },
  {
    id: "jio-s3",
    title: "Vaaroon",
    artists: ["Rochak Kohli", "B Praak"],
    album: "Mirzapur Hits",
    durationMs: 238000,
    sourceKind: "stream",
    providerId: "jiosaavn",
    providerTrackId: "jio-s3",
    streamUrl: "https://aac.saavncdn.com/675/ff5cbe7f8c09da84cb039852eae36fce_320.mp4",
    codec: "AAC",
    sampleRate: 44100,
    bitrate: 320,
    artworkUrl: "https://c.saavncdn.com/675/Trending-Love-Songs-Hindi-2026-20260506185328-500x500.jpg",
    attribution: "JioSaavn Music",
  },
  {
    id: "yt-curated-3",
    title: "Starboy (Ultra Bass Boost Master)",
    artists: ["The Weeknd", "Daft Punk"],
    album: "Starboy",
    durationMs: 230000,
    sourceKind: "video",
    providerId: "youtube",
    providerTrackId: "34Na4j8AVgA",
    youtubeVideoId: "34Na4j8AVgA",
    streamUrl: "https://www.youtube.com/watch?v=34Na4j8AVgA",
    codec: "Opus",
    artworkUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    attribution: "YouTube - The Weeknd",
  },
];

interface LibraryState {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  folders: string[];
  scanStatus: FolderScanStatus;
  history: PlayHistoryEntry[];
  recentlyPlayed: Track[];
  customPlaylists: CustomPlaylist[];
  
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
  
  // Custom Playlists & Listen Again
  recordTrackPlayed: (track: Track) => void;
  createCustomPlaylist: (name: string, description?: string, color?: string) => CustomPlaylist;
  deleteCustomPlaylist: (id: string) => void;
  addTrackToCustomPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromCustomPlaylist: (playlistId: string, trackId: string) => void;

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
  recentlyPlayed: DEFAULT_RECENT_TRACKS,
  customPlaylists: [
    {
      id: "pl-phonk",
      name: "⚡ Phonk & Drift High Octane",
      description: "Aggressive 808 cowbell, hard distortion & drift phonk",
      color: "from-purple-600 via-pink-600 to-red-600",
      tracks: [DEFAULT_RECENT_TRACKS[1], DEFAULT_RECENT_TRACKS[2]],
      createdAt: new Date().toISOString(),
    },
    {
      id: "pl-bollywood",
      name: "❤️ Bollywood Love & Soulful Masters",
      description: "Lossless 320kbps romantic & soulful chartbusters",
      color: "from-emerald-500 via-teal-600 to-cyan-700",
      tracks: [DEFAULT_RECENT_TRACKS[0], DEFAULT_RECENT_TRACKS[3], DEFAULT_RECENT_TRACKS[4]],
      createdAt: new Date().toISOString(),
    },
    {
      id: "pl-viral",
      name: "🚀 Global Viral Top Hits",
      description: "The biggest viral bangers and streaming anthems",
      color: "from-amber-500 via-orange-600 to-rose-700",
      tracks: [DEFAULT_RECENT_TRACKS[5], DEFAULT_RECENT_TRACKS[1]],
      createdAt: new Date().toISOString(),
    },
  ],
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

  recordTrackPlayed: (track: Track) => {
    set((state) => {
      const filtered = state.recentlyPlayed.filter((t) => t.id !== track.id && t.title !== track.title);
      return {
        recentlyPlayed: [track, ...filtered].slice(0, 20),
      };
    });
  },

  createCustomPlaylist: (name: string, description?: string, color?: string) => {
    const newPl: CustomPlaylist = {
      id: `pl-${Date.now()}`,
      name,
      description: description || "User custom playlist",
      color: color || "from-violet-600 to-indigo-700",
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      customPlaylists: [newPl, ...state.customPlaylists],
    }));
    return newPl;
  },

  deleteCustomPlaylist: (id: string) => {
    set((state) => ({
      customPlaylists: state.customPlaylists.filter((p) => p.id !== id),
    }));
  },

  addTrackToCustomPlaylist: (playlistId: string, track: Track) => {
    set((state) => ({
      customPlaylists: state.customPlaylists.map((pl) => {
        if (pl.id !== playlistId) return pl;
        if (pl.tracks.some((t) => t.id === track.id)) return pl;
        return {
          ...pl,
          tracks: [...pl.tracks, track],
        };
      }),
    }));
  },

  removeTrackFromCustomPlaylist: (playlistId: string, trackId: string) => {
    set((state) => ({
      customPlaylists: state.customPlaylists.map((pl) => {
        if (pl.id !== playlistId) return pl;
        return {
          ...pl,
          tracks: pl.tracks.filter((t) => t.id !== trackId),
        };
      }),
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
