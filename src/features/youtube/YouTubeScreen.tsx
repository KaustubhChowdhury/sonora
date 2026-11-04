import React, { useState, useEffect } from "react";
import {
  Play,
  Search,
  Sparkles,
  Flame,
  Radio,
  Loader2,
  RefreshCw,
  TrendingUp,
  Zap,
  Headphones,
} from "lucide-react";
import { YoutubeIcon } from "../../components/shared/ProviderIcons";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { Track } from "../../types/music";
import { TauriBridge } from "../../services/tauriBridge";

const YOUTUBE_STARTER_HITS: Track[] = [
  {
    id: "yt-s1",
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
    id: "yt-s2",
    title: "Close Eyes (Official Drift Audio)",
    artists: ["DVRST"],
    album: "Close Eyes",
    durationMs: 132000,
    sourceKind: "video",
    providerId: "youtube",
    providerTrackId: "ao4RConhVPU",
    youtubeVideoId: "ao4RConhVPU",
    streamUrl: "https://www.youtube.com/watch?v=ao4RConhVPU",
    codec: "Opus",
    artworkUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    attribution: "YouTube - DVRST",
  },
  {
    id: "yt-s3",
    title: "Midnight City (M83 Remix Live)",
    artists: ["M83"],
    album: "YouTube Music Electronic",
    durationMs: 244000,
    sourceKind: "video",
    providerId: "youtube",
    providerTrackId: "dX3k_QDnzHE",
    youtubeVideoId: "dX3k_QDnzHE",
    streamUrl: "https://www.youtube.com/watch?v=dX3k_QDnzHE",
    codec: "Opus",
    artworkUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    attribution: "YouTube - M83",
  },
  {
    id: "yt-s4",
    title: "Resonance - Synthwave Chill Beats",
    artists: ["HOME"],
    album: "YouTube Music Synthwave",
    durationMs: 212000,
    sourceKind: "video",
    providerId: "youtube",
    providerTrackId: "8GW6sLrK40k",
    youtubeVideoId: "8GW6sLrK40k",
    streamUrl: "https://www.youtube.com/watch?v=8GW6sLrK40k",
    codec: "Opus",
    artworkUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80",
    attribution: "YouTube - HOME",
  },
  {
    id: "yt-s5",
    title: "Starboy (Official Music Video)",
    artists: ["The Weeknd ft. Daft Punk"],
    album: "YouTube Music Global Top",
    durationMs: 230000,
    sourceKind: "video",
    providerId: "youtube",
    providerTrackId: "34Na4j8AVgA",
    youtubeVideoId: "34Na4j8AVgA",
    streamUrl: "https://www.youtube.com/watch?v=34Na4j8AVgA",
    codec: "Opus",
    artworkUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    attribution: "YouTube - The Weeknd",
  },
  {
    id: "yt-s6",
    title: "Sahara (Bass Drift)",
    artists: ["Hensonn"],
    album: "Sahara",
    durationMs: 171000,
    sourceKind: "video",
    providerId: "youtube",
    providerTrackId: "v3x_G2-0cT4",
    youtubeVideoId: "v3x_G2-0cT4",
    streamUrl: "https://www.youtube.com/watch?v=v3x_G2-0cT4",
    codec: "Opus",
    artworkUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    attribution: "YouTube - Hensonn",
  },
];

const YOUTUBE_GENRES = [
  { id: "viral", label: "▶️ Viral Radar", query: "top viral music hits 2026" },
  { id: "phonk", label: "⚡ Phonk Drift", query: "phonk drift bass music" },
  { id: "lofi", label: "🎧 Lo-Fi Beats", query: "lofi hip hop radio beats" },
  { id: "synth", label: "🌌 Synthwave", query: "synthwave retro chill" },
  { id: "global", label: "🔥 Global Top 100", query: "billboard hot 100 music" },
  { id: "rock", label: "🎸 Rock & Nu-Metal", query: "rock trending hits" },
];

export const YouTubeScreen: React.FC = () => {
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const { showToast } = useUiStore();

  const [activeGenre, setActiveGenre] = useState("viral");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>(YOUTUBE_STARTER_HITS);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Load feed when genre changes
  const loadGenreTracks = async (query: string) => {
    setIsLoadingFeed(true);
    try {
      const items = await TauriBridge.searchYouTube(query, 20);
      if (items && items.length > 0) {
        setTrendingTracks(items);
      }
    } catch (err) {
      console.warn("Failed to load YouTube feed:", err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    const genre = YOUTUBE_GENRES.find((g) => g.id === activeGenre);
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
      const items = await TauriBridge.searchYouTube(q, 24);
      setSearchResults(items);
    } catch (err) {
      console.error("YouTube standalone search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const heroTrack = (searchResults && searchResults[0]) || trendingTracks[0] || YOUTUBE_STARTER_HITS[0];

  const handlePlayHero = () => {
    const list = searchResults || trendingTracks;
    if (heroTrack) {
      playTrack(heroTrack, list);
      showToast(`Playing "${heroTrack.title}" in YouTube Music Player`);
    }
  };

  const handlePlayCollection = (collection: Track[], label: string) => {
    if (collection.length === 0) return;
    playTrack(collection[0], collection);
    showToast(`Playing ${label} (${collection.length} videos)`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 select-none">
      {/* Header & YouTube Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/30 shadow-lg shadow-red-950/40">
              <YoutubeIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                YouTube Music Hub
                <span className="text-[10px] text-red-400 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-500/30 font-mono font-semibold">
                  In-App Audio & Video
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Direct in-app playback • Music videos, live sets, viral phonk & lo-fi radios
              </p>
            </div>
          </div>
        </div>

        {/* Standalone YouTube Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400" />
          <input
            type="text"
            placeholder="Search YouTube Music videos, tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141821]/90 border border-red-500/30 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/50 shadow-md"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-red-400 animate-spin" />
          )}
        </form>
      </div>

      {/* Genre / Mood Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {YOUTUBE_GENRES.map((g) => {
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
                  ? "bg-red-600 text-white font-bold shadow-lg shadow-red-950/40 border border-red-400"
                  : "bg-[#141821]/80 hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <span>{g.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hero Spotlight */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-red-950/70 via-[#141821]/90 to-[#0e1118] border border-red-500/30 p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {heroTrack.artworkUrl && (
          <div
            style={{ backgroundImage: `url(${heroTrack.artworkUrl})` }}
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110 pointer-events-none"
          />
        )}

        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>Featured YouTube Spotlight • In-App Player</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {heroTrack.title}
          </h2>
          <p className="text-sm text-zinc-300">
            Channel: <span className="font-bold text-white">{heroTrack.artists.join(", ")}</span> •{" "}
            {heroTrack.album || "YouTube Music"} • Uninterrupted In-App Playback
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handlePlayHero}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Watch & Listen</span>
            </button>

            <button
              onClick={() => handlePlayCollection(searchResults || trendingTracks, "YouTube Station")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition-colors"
            >
              <Radio className="w-4 h-4 text-red-400" />
              <span>Play All</span>
            </button>
          </div>
        </div>

        {heroTrack.artworkUrl && (
          <div className="relative z-10 w-56 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-red-500/30 shrink-0 group">
            <img
              src={heroTrack.artworkUrl}
              alt={heroTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-[9px] font-mono text-red-300 border border-red-500/30 font-bold flex items-center gap-1">
              <YoutubeIcon className="w-2.5 h-2.5" />
              YT
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={handlePlayHero}
                className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg"
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
            <TrendingUp className="w-4 h-4 text-red-400" />
            <h2 className="text-base font-bold text-white">
              {searchResults
                ? `Search Results for "${searchQuery}" (${searchResults.length})`
                : `${YOUTUBE_GENRES.find((g) => g.id === activeGenre)?.label || "Viral"} Hits`}
            </h2>
            {isLoadingFeed && (
              <RefreshCw className="w-3.5 h-3.5 text-red-400 animate-spin ml-2" />
            )}
          </div>

          <button
            onClick={() => handlePlayCollection(searchResults || trendingTracks, "YouTube Queue")}
            className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            <span>Play Queue ({(searchResults || trendingTracks).length})</span>
          </button>
        </div>

        {/* 16:9 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(searchResults || trendingTracks).map((yt) => {
            const isCurrent = currentTrack?.id === yt.id;
            return (
              <div
                key={yt.id}
                onClick={() => playTrack(yt, searchResults || trendingTracks)}
                className={`p-3 rounded-2xl bg-[#141821]/80 hover:bg-[#1a202c] border transition-all cursor-pointer group flex flex-col space-y-2.5 shadow-md ${
                  isCurrent ? "border-red-500 ring-1 ring-red-500/50" : "border-white/[0.06] hover:border-red-500/30"
                }`}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800">
                  <img
                    src={yt.artworkUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"}
                    alt={yt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-[9px] font-mono text-red-300 border border-red-500/30 font-bold flex items-center gap-1">
                    <YoutubeIcon className="w-2.5 h-2.5" />
                    YT
                  </div>
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isCurrent && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <h3 className="font-semibold text-xs text-white truncate group-hover:text-red-300">
                    {yt.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {yt.artists.join(", ")}
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