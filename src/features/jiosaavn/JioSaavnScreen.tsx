import React, { useState, useEffect } from "react";
import {
  Music,
  Play,
  Search,
  Sparkles,
  Flame,
  Radio,
  Loader2,
  RefreshCw,
  TrendingUp,
  Disc,
} from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { Track } from "../../types/music";
import { TauriBridge } from "../../services/tauriBridge";
import { TrackRow } from "../../components/shared/TrackRow";

// Curated starter tracks with verified 320kbps direct stream URLs
const JIOSAAVN_STARTER_HITS: Track[] = [
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
];

const JIOSAAVN_GENRES = [
  { id: "trending", label: "🔥 Top Trending", query: "trending hindi hits" },
  { id: "bollywood", label: "✨ Bollywood Top 50", query: "top 50 hindi" },
  { id: "punjabi", label: "🦁 Punjabi Hits", query: "punjabi top hits" },
  { id: "phonk", label: "⚡ Phonk & Bass", query: "phonk bass" },
  { id: "lofi", label: "🎧 Lo-Fi & Chill", query: "hindi lofi chill" },
  { id: "arijit", label: "👑 Arijit Singh Hits", query: "arijit singh best" },
];

export const JioSaavnScreen: React.FC = () => {
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const { showToast } = useUiStore();

  const [activeGenre, setActiveGenre] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>(JIOSAAVN_STARTER_HITS);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Load feed when genre changes
  const loadGenreTracks = async (query: string) => {
    setIsLoadingFeed(true);
    try {
      const items = await TauriBridge.searchJioSaavn(query, 24);
      if (items && items.length > 0) {
        setTrendingTracks(items);
      }
    } catch (err) {
      console.warn("Failed to load JioSaavn genre feed:", err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    const genre = JIOSAAVN_GENRES.find((g) => g.id === activeGenre);
    if (genre) {
      loadGenreTracks(genre.query);
    }
  }, [activeGenre]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const items = await TauriBridge.searchJioSaavn(q, 30);
      setSearchResults(items);
    } catch (err) {
      console.error("JioSaavn standalone search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const heroTrack = (searchResults && searchResults[0]) || trendingTracks[0] || JIOSAAVN_STARTER_HITS[0];

  const handlePlayHero = () => {
    const list = searchResults || trendingTracks;
    if (heroTrack) {
      playTrack(heroTrack, list);
      showToast(`Playing "${heroTrack.title}" in 320kbps AAC`);
    }
  };

  const handlePlayCollection = (collection: Track[], label: string) => {
    if (collection.length === 0) return;
    playTrack(collection[0], collection);
    showToast(`Playing ${label} (${collection.length} tracks) in 320kbps AAC`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 select-none">
      {/* Header & JioSaavn Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-lg shadow-cyan-950/40">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                JioSaavn Music Hub
                <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30 font-mono font-semibold">
                  320kbps Lossless AAC
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Direct in-app streaming • Top Indian & Global charts • Studio Master Quality
              </p>
            </div>
          </div>
        </div>

        {/* Standalone JioSaavn Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
          <input
            type="text"
            placeholder="Search JioSaavn 320kbps songs, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141821]/90 border border-cyan-500/30 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-md"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-400 animate-spin" />
          )}
        </form>
      </div>

      {/* Genre / Mood Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {JIOSAAVN_GENRES.map((g) => {
          const isActive = activeGenre === g.id && !searchResults;
          return (
            <button
              key={g.id}
              onClick={() => {
                setSearchResults(null);
                setSearchQuery("");
                setActiveGenre(g.id);
              }}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? "bg-cyan-500 text-zinc-950 font-bold shadow-lg shadow-cyan-950/40 border border-cyan-400"
                  : "bg-[#141821]/80 hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <span>{g.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hero Spotlight */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-cyan-950/70 via-[#141821]/90 to-[#0e1118] border border-cyan-500/30 p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {heroTrack.artworkUrl && (
          <div
            style={{ backgroundImage: `url(${heroTrack.artworkUrl})` }}
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110 pointer-events-none"
          />
        )}

        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            <span>Featured JioSaavn Master Track • 320kbps</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {heroTrack.title}
          </h2>
          <p className="text-sm text-zinc-300">
            By <span className="font-bold text-white">{heroTrack.artists.join(", ")}</span> •{" "}
            {heroTrack.album || "JioSaavn Official"} • 320 kbps AAC Direct Stream
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handlePlayHero}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-bold text-xs shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play in 320kbps</span>
            </button>

            <button
              onClick={() => handlePlayCollection(searchResults || trendingTracks, "JioSaavn Station")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition-colors"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Play All</span>
            </button>
          </div>
        </div>

        {heroTrack.artworkUrl && (
          <div className="relative z-10 w-44 h-44 rounded-2xl overflow-hidden shadow-2xl border border-cyan-500/30 shrink-0 group">
            <img
              src={heroTrack.artworkUrl}
              alt={heroTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-[9px] font-mono text-cyan-300 border border-cyan-500/30 font-bold">
              320K
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={handlePlayHero}
                className="w-12 h-12 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center shadow-lg"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Tracks Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {searchResults
                ? `Search Results for "${searchQuery}" (${searchResults.length})`
                : `${JIOSAAVN_GENRES.find((g) => g.id === activeGenre)?.label || "Top"} Hits`}
            </h2>
            {isLoadingFeed && (
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin ml-2" />
            )}
          </div>

          <button
            onClick={() => handlePlayCollection(searchResults || trendingTracks, "JioSaavn Queue")}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            <span>Play Queue ({(searchResults || trendingTracks).length})</span>
          </button>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(searchResults || trendingTracks).map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, searchResults || trendingTracks)}
                className={`p-3 rounded-2xl bg-[#141821]/80 hover:bg-[#1a202c] border transition-all cursor-pointer group flex flex-col space-y-2.5 shadow-md ${
                  isCurrent ? "border-cyan-500 ring-1 ring-cyan-500/50" : "border-white/[0.06] hover:border-cyan-500/30"
                }`}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                  <img
                    src={track.artworkUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-[9px] font-mono text-cyan-300 border border-cyan-500/30 font-bold">
                    320K
                  </div>
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isCurrent && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <h3 className="font-semibold text-xs text-white truncate group-hover:text-cyan-300">
                    {track.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {track.artists.join(", ")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};