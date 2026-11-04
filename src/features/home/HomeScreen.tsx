import React, { useState, useEffect } from "react";
import {
  Play,
  Sparkles,
  Flame,
  Music,
  Radio,
  Zap,
  Headphones,
  Compass,
  Disc3,
  ShieldCheck,
  RefreshCw,
  Plus,
} from "lucide-react";
import { YoutubeIcon } from "../../components/shared/ProviderIcons";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { Track } from "../../types/music";
import { TauriBridge } from "../../services/tauriBridge";

// Starter curated tracks for immediate zero-latency rendering
const CURATED_JIOSAAVN_HITS: Track[] = [
  {
    id: "jio-curated-1",
    title: "Apna Bana Le",
    artists: ["Arijit Singh", "Sachin-Jigar"],
    album: "Bhediya / Trending Love",
    durationMs: 261000,
    sourceKind: "stream",
    providerId: "jiosaavn",
    providerTrackId: "jio-curated-1",
    streamUrl: "https://aac.saavncdn.com/675/1456dc2903d0fb4465d2d2904008803b_320.mp4",
    codec: "AAC",
    sampleRate: 44100,
    bitrate: 320,
    artworkUrl: "https://c.saavncdn.com/675/Trending-Love-Songs-Hindi-2026-20260506185328-500x500.jpg",
    attribution: "JioSaavn Music",
  },
  {
    id: "jio-curated-2",
    title: "Ishq de Fanniyar",
    artists: ["Jyotica Tangri"],
    album: "Fukrey Returns",
    durationMs: 254000,
    sourceKind: "stream",
    providerId: "jiosaavn",
    providerTrackId: "jio-curated-2",
    streamUrl: "https://aac.saavncdn.com/675/f1f48664e51db48f0d26a40d42d515a8_320.mp4",
    codec: "AAC",
    sampleRate: 44100,
    bitrate: 320,
    artworkUrl: "https://c.saavncdn.com/675/Trending-Love-Songs-Hindi-2026-20260506185328-500x500.jpg",
    attribution: "JioSaavn Music",
  },
  {
    id: "jio-curated-3",
    title: "Vaaroon",
    artists: ["Rochak Kohli", "B Praak"],
    album: "Mirzapur Hits",
    durationMs: 238000,
    sourceKind: "stream",
    providerId: "jiosaavn",
    providerTrackId: "jio-curated-3",
    streamUrl: "https://aac.saavncdn.com/675/ff5cbe7f8c09da84cb039852eae36fce_320.mp4",
    codec: "AAC",
    sampleRate: 44100,
    bitrate: 320,
    artworkUrl: "https://c.saavncdn.com/675/Trending-Love-Songs-Hindi-2026-20260506185328-500x500.jpg",
    attribution: "JioSaavn Music",
  },
];

const CURATED_YOUTUBE_HITS: Track[] = [
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
    id: "yt-curated-3",
    title: "Resonance - 10 Hours Chillwave Beats",
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
    id: "yt-curated-4",
    title: "Starboy (Official Audio)",
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
];

const CURATED_PHONK_MIX: Track[] = [
  {
    id: "phonk-1",
    title: "Close Eyes",
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
    id: "phonk-2",
    title: "Sahara",
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
  {
    id: "phonk-3",
    title: "Why Not",
    artists: ["Ghostface Playa"],
    album: "Why Not",
    durationMs: 168000,
    sourceKind: "video",
    providerId: "youtube",
    providerTrackId: "5f8fXb5jZGE",
    youtubeVideoId: "5f8fXb5jZGE",
    streamUrl: "https://www.youtube.com/watch?v=5f8fXb5jZGE",
    codec: "Opus",
    artworkUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    attribution: "YouTube - Ghostface Playa",
  },
];

export const HomeScreen: React.FC = () => {
  const { tracks, albums } = useLibraryStore();
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const { navigate, showToast } = useUiStore();

  const [activeMood, setActiveMood] = useState<string>("all");
  const [jiosaavnTrending, setJiosaavnTrending] = useState<Track[]>(CURATED_JIOSAAVN_HITS);
  const [youtubeTrending, setYoutubeTrending] = useState<Track[]>(CURATED_YOUTUBE_HITS);
  const [phonkMix, setPhonkMix] = useState<Track[]>(CURATED_PHONK_MIX);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Fetch live recommendations on mount
  useEffect(() => {
    let isMounted = true;
    const fetchLiveContent = async () => {
      setIsLoadingLive(true);
      try {
        const [jioRes, ytRes, phonkRes] = await Promise.allSettled([
          TauriBridge.searchJioSaavn("trending hindi hits", 12),
          TauriBridge.searchYouTube("top viral music hits", 8),
          TauriBridge.searchJioSaavn("drift phonk", 8),
        ]);

        if (!isMounted) return;

        if (jioRes.status === "fulfilled" && jioRes.value.length > 0) {
          setJiosaavnTrending(jioRes.value);
        }
        if (ytRes.status === "fulfilled" && ytRes.value.length > 0) {
          setYoutubeTrending(ytRes.value);
        }
        if (phonkRes.status === "fulfilled" && phonkRes.value.length > 0) {
          setPhonkMix(phonkRes.value);
        }
      } catch (err) {
        console.warn("Live feed fetch warning:", err);
      } finally {
        if (isMounted) setIsLoadingLive(false);
      }
    };

    fetchLiveContent();
    return () => {
      isMounted = false;
    };
  }, []);

  const heroTrack = jiosaavnTrending[0] || CURATED_JIOSAAVN_HITS[0];

  const handlePlayHero = () => {
    if (heroTrack) {
      playTrack(heroTrack, jiosaavnTrending);
      showToast(`Playing "${heroTrack.title}" by ${heroTrack.artists.join(", ")}`);
    }
  };

  const handlePlayCollection = (collection: Track[], label: string) => {
    if (collection.length === 0) return;
    playTrack(collection[0], collection);
    showToast(`Playing ${label} mix (${collection.length} tracks)`);
  };

  const losslessTracks = tracks.filter(
    (t) =>
      ["FLAC", "WAV", "ALAC", "DSD"].includes(t.codec?.toUpperCase() || "") ||
      (t.bitDepth && t.bitDepth > 16)
  );

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 select-none">
      {/* Top Mood & Source Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: "all", label: "✨ All Feeds", icon: Compass },
            { id: "jiosaavn", label: "🎵 JioSaavn 320kbps", icon: Music },
            { id: "youtube", label: "▶️ YouTube Music", icon: YoutubeIcon },
            { id: "phonk", label: "⚡ Phonk & Drift", icon: Zap },
            { id: "lossless", label: "💎 Lossless Master Vault", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMood === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMood(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all text-xs shrink-0 ${
                  isActive
                    ? "bg-[#9b7bff] text-white shadow-lg shadow-purple-900/40 border border-purple-400/40"
                    : "bg-[#141821]/80 hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {isLoadingLive && (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-purple-400 font-mono">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Updating live streams...</span>
          </div>
        )}
      </div>

      {/* Hero Spotlight Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/80 via-[#141821]/90 to-[#0e1118] border border-purple-500/30 p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {heroTrack.artworkUrl && (
          <div
            style={{ backgroundImage: `url(${heroTrack.artworkUrl})` }}
            className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl scale-110 pointer-events-none"
          />
        )}

        <div className="relative z-10 max-w-xl space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Trending Spotlight • 320kbps Master Audio</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {heroTrack.title}
          </h1>
          <p className="text-sm text-zinc-300">
            By <span className="font-bold text-white">{heroTrack.artists.join(", ")}</span> •{" "}
            {heroTrack.album || "Featured Hit"} • Direct In-App Playback
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handlePlayHero}
              className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play Now</span>
            </button>

            <button
              onClick={() => handlePlayCollection(jiosaavnTrending, "JioSaavn Weekly")}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition-colors"
            >
              <Radio className="w-4 h-4 text-purple-400" />
              <span>Play Top 50 Station</span>
            </button>
          </div>
        </div>

        {heroTrack.artworkUrl && (
          <div className="relative z-10 w-48 h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/15 shrink-0 group">
            <img
              src={heroTrack.artworkUrl}
              alt={heroTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={handlePlayHero}
                className="w-12 h-12 rounded-full bg-[#9b7bff] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Play Mix Tiles (Spotify / YT Music 6-Pack) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          {
            title: "JioSaavn Weekly Chart",
            sub: "Top 50 Hindi & Global Hits",
            icon: Music,
            color: "from-cyan-900/50 to-[#141821]",
            tracks: jiosaavnTrending,
          },
          {
            title: "YouTube Viral Radar",
            sub: "Top Trending Video Tracks",
            icon: YoutubeIcon,
            color: "from-red-900/50 to-[#141821]",
            tracks: youtubeTrending,
          },
          {
            title: "Phonk Night Drift",
            sub: "High-Octane Bass & Drift",
            icon: Zap,
            color: "from-purple-900/50 to-[#141821]",
            tracks: phonkMix,
          },
          {
            title: "Late Night Chill Lo-Fi",
            sub: "Soothing Beats & Focus",
            icon: Headphones,
            color: "from-amber-900/50 to-[#141821]",
            tracks: youtubeTrending,
          },
          {
            title: "Local Lossless Vault",
            sub: `${losslessTracks.length} FLAC / Studio Masters`,
            icon: ShieldCheck,
            color: "from-emerald-900/50 to-[#141821]",
            tracks: losslessTracks.length > 0 ? losslessTracks : jiosaavnTrending,
          },
          {
            title: "Bollywood Gold & Romance",
            sub: "Arijit, Pritam & Legends",
            icon: Disc3,
            color: "from-rose-900/50 to-[#141821]",
            tracks: jiosaavnTrending,
          },
        ].map((tile, idx) => {
          const Icon = tile.icon;
          return (
            <div
              key={idx}
              onClick={() => handlePlayCollection(tile.tracks, tile.title)}
              className={`p-3.5 rounded-2xl bg-gradient-to-r ${tile.color} border border-white/[0.08] hover:border-purple-500/40 cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between group shadow-lg`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center shrink-0 text-white group-hover:text-purple-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-xs text-white truncate group-hover:text-purple-200">
                    {tile.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate">{tile.sub}</p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayCollection(tile.tracks, tile.title);
                }}
                className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* SECTION 1: JIOSAAVN 320KBPS WEEKLY TOP HITS */}
      {(activeMood === "all" || activeMood === "jiosaavn") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Music className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base font-bold text-white">
                JioSaavn 320kbps Master Hits
              </h2>
              <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30 font-medium">
                Lossless AAC 320kbps
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlayCollection(jiosaavnTrending, "JioSaavn Weekly Top")}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <Play className="w-3 h-3 fill-current ml-0.5" />
                <span>Play All ({jiosaavnTrending.length})</span>
              </button>
              <button
                onClick={() => navigate("jiosaavn")}
                className="text-xs px-2.5 py-1 rounded-full bg-cyan-950/60 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors font-medium"
              >
                Explore Hub →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {jiosaavnTrending.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, jiosaavnTrending)}
                  className={`p-3 rounded-2xl bg-[#141821]/80 hover:bg-[#1a202c] border transition-all cursor-pointer group flex flex-col space-y-2.5 shadow-md ${
                    isCurrent ? "border-cyan-500 ring-1 ring-cyan-500/40" : "border-white/[0.06] hover:border-cyan-500/30"
                  }`}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                    <img
                      src={track.artworkUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-[9px] font-mono text-cyan-300 border border-cyan-500/30 font-bold">
                      320K
                    </div>
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isCurrent && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
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
      )}

      {/* SECTION 2: YOUTUBE MUSIC VIRAL RADAR */}
      {(activeMood === "all" || activeMood === "youtube") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                <YoutubeIcon className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base font-bold text-white">
                YouTube Music Viral Radar
              </h2>
              <span className="text-[10px] text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30 font-medium">
                In-App Player
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlayCollection(youtubeTrending, "YouTube Viral")}
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
              >
                <Play className="w-3 h-3 fill-current ml-0.5" />
                <span>Play All ({youtubeTrending.length})</span>
              </button>
              <button
                onClick={() => navigate("youtube")}
                className="text-xs px-2.5 py-1 rounded-full bg-red-950/60 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-colors font-medium"
              >
                Explore Hub →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {youtubeTrending.map((yt) => {
              const isCurrent = currentTrack?.id === yt.id;
              return (
                <div
                  key={yt.id}
                  onClick={() => playTrack(yt, youtubeTrending)}
                  className={`p-3 rounded-2xl bg-[#141821]/80 hover:bg-[#1a202c] border transition-all cursor-pointer group flex flex-col space-y-2.5 shadow-md ${
                    isCurrent ? "border-red-500 ring-1 ring-red-500/40" : "border-white/[0.06] hover:border-red-500/30"
                  }`}
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800">
                    <img
                      src={yt.artworkUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"}
                      alt={yt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-[9px] font-mono text-red-300 border border-red-500/30 font-bold flex items-center gap-1">
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
      )}

      {/* SECTION 3: PHONK & DRIFT NIGHTS */}
      {(activeMood === "all" || activeMood === "phonk") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base font-bold text-white">
                Phonk Drift & Bass Vault
              </h2>
              <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30 font-medium">
                High BPM • Car Drift
              </span>
            </div>

            <button
              onClick={() => handlePlayCollection(phonkMix, "Phonk Drift")}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-current ml-0.5" />
              <span>Play Mix ({phonkMix.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {phonkMix.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, phonkMix)}
                  className={`p-3 rounded-2xl bg-[#141821]/80 hover:bg-[#1a202c] border transition-all cursor-pointer group flex flex-col space-y-2.5 shadow-md ${
                    isCurrent ? "border-purple-500 ring-1 ring-purple-500/40" : "border-white/[0.06] hover:border-purple-500/30"
                  }`}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                    <img
                      src={track.artworkUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500"}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isCurrent && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#9b7bff] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <h3 className="font-semibold text-xs text-white truncate group-hover:text-purple-300">
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
      )}

      {/* SECTION 4: LOCAL LOSSLESS MASTER VAULT */}
      {(activeMood === "all" || activeMood === "lossless") && losslessTracks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base font-bold text-white">
                Lossless Master Studio Vault
              </h2>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                Bit-Perfect FLAC / WAV
              </span>
            </div>

            <button
              onClick={() => handlePlayCollection(losslessTracks, "Lossless Vault")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-current ml-0.5" />
              <span>Play All ({losslessTracks.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {losslessTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track, losslessTracks)}
                className="p-3.5 rounded-2xl bg-[#141821]/80 hover:bg-[#1a202c] border border-white/[0.06] hover:border-emerald-500/40 cursor-pointer group transition-all space-y-2.5 shadow-md"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                  <img
                    src={track.artworkUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500"}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-[9px] font-mono text-emerald-400 border border-emerald-500/30 font-bold">
                    {track.codec} {track.bitDepth ? `${track.bitDepth}b` : ""}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <h3 className="font-semibold text-xs text-white truncate group-hover:text-emerald-300">
                    {track.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {track.artists.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};