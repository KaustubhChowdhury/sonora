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
  Clock,
  ListMusic,
  Heart,
  Volume2,
  X,
  FolderPlus,
} from "lucide-react";
import { YoutubeIcon } from "../../components/shared/ProviderIcons";
import { useLibraryStore, CustomPlaylist } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useAudioStudioStore, BOOSTER_PRESETS } from "../../stores/audioStudioStore";
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

const DAILY_MIXES = [
  {
    id: "mix-phonk",
    title: "Daily Mix 1: Phonk & Drift",
    subtitle: "INTERWORLD, DVRST, Kordhell, Ghostface Playa",
    gradient: "from-purple-900 via-pink-900/60 to-black",
    accent: "#ec4899",
    tracks: CURATED_YOUTUBE_HITS,
  },
  {
    id: "mix-bollywood",
    title: "Daily Mix 2: Bollywood & Acoustic Chill",
    subtitle: "Arijit Singh, Sachin-Jigar, Jyotica Tangri",
    gradient: "from-cyan-950 via-teal-900/50 to-black",
    accent: "#06b6d4",
    tracks: CURATED_JIOSAAVN_HITS,
  },
  {
    id: "mix-global",
    title: "Daily Mix 3: Global Viral Hits",
    subtitle: "The Weeknd, Daft Punk, Trending Viral",
    gradient: "from-rose-950 via-amber-950/50 to-black",
    accent: "#f43f5e",
    tracks: [CURATED_YOUTUBE_HITS[2], CURATED_JIOSAAVN_HITS[0]],
  },
];

export const HomeScreen: React.FC = () => {
  const { recentlyPlayed, customPlaylists, createCustomPlaylist, tracks } = useLibraryStore();
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const { boosterSettings, toggleBooster, applyBoosterPreset } = useAudioStudioStore();
  const { navigate, showToast } = useUiStore();

  const [activeMood, setActiveMood] = useState<string>("all");
  const [jiosaavnTrending, setJiosaavnTrending] = useState<Track[]>(CURATED_JIOSAAVN_HITS);
  const [youtubeTrending, setYoutubeTrending] = useState<Track[]>(CURATED_YOUTUBE_HITS);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // New Playlist Modal State
  const [isNewPlaylistOpen, setIsNewPlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [newPlaylistColor, setNewPlaylistColor] = useState("from-purple-600 via-pink-600 to-red-600");

  const PLAYLIST_COLORS = [
    { label: "Neon Lime & Teal", val: "from-lime-500 via-emerald-600 to-teal-800" },
    { label: "Phonk Violet & Pink", val: "from-purple-600 via-pink-600 to-red-600" },
    { label: "Deep Cyan & Navy", val: "from-cyan-600 via-blue-700 to-indigo-900" },
    { label: "Sunset Gold & Flame", val: "from-amber-500 via-orange-600 to-rose-700" },
  ];

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Fetch live trending recommendations on mount
  useEffect(() => {
    let isMounted = true;
    const fetchLiveContent = async () => {
      setIsLoadingLive(true);
      try {
        const [jioRes, ytRes] = await Promise.allSettled([
          TauriBridge.searchJioSaavn("trending hindi hits", 12),
          TauriBridge.searchYouTube("top viral music hits", 8),
        ]);

        if (!isMounted) return;

        if (jioRes.status === "fulfilled" && jioRes.value.length > 0) {
          setJiosaavnTrending(jioRes.value);
        }
        if (ytRes.status === "fulfilled" && ytRes.value.length > 0) {
          setYoutubeTrending(ytRes.value);
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

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const pl = createCustomPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim(), newPlaylistColor);
    setIsNewPlaylistOpen(false);
    setNewPlaylistName("");
    setNewPlaylistDesc("");
    showToast(`Playlist "${pl.name}" created!`);
  };

  const handlePlayCollection = (collection: Track[], label: string) => {
    if (collection.length === 0) return;
    playTrack(collection[0], collection);
    showToast(`Playing ${label} (${collection.length} tracks)`);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-9 select-none pb-48">
      {/* 1. TOP HEADER & PERSONALIZED GREETING */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            {getGreeting()}, Audiophile
            <span className="w-2 h-2 rounded-full bg-[#b4ff39] animate-pulse" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Personalised studio feeds, 320kbps lossless streaming & hardware sound engine
          </p>
        </div>

        {/* Quick Mood Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "✨ All Feeds" },
            { id: "phonk", label: "⚡ Phonk & Drift" },
            { id: "jiosaavn", label: "🎵 JioSaavn 320k" },
            { id: "youtube", label: "▶️ YouTube Music" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveMood(pill.id)}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all text-xs shrink-0 cursor-pointer ${
                activeMood === pill.id
                  ? "bg-[#b4ff39] text-[#111216] shadow-md shadow-[#b4ff39]/30"
                  : "bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. "LISTEN AGAIN" / "JUMP BACK IN" (Personalized Quick Grid) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#b4ff39]" />
            Listen Again
          </h2>
          <span className="text-[11px] text-zinc-500 font-medium">Recent high-rotation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {recentlyPlayed.slice(0, 6).map((track, idx) => {
            const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
            return (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => {
                  playTrack(track, recentlyPlayed);
                  showToast(`Playing "${track.title}"`);
                }}
                className={`relative flex items-center gap-3 p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border transition-all duration-200 cursor-pointer group shadow-md ${
                  isCurrentPlaying ? "border-[#b4ff39]/60 bg-[#b4ff39]/10" : "border-white/[0.06]"
                }`}
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow">
                  {track.artworkUrl ? (
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      <Music className="w-5 h-5" />
                    </div>
                  )}
                  {/* Hover play icon overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-[#b4ff39] text-[#111216] flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden space-y-0.5 flex-1 pr-2">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#b4ff39] transition-colors leading-tight">
                    {track.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {track.artists ? track.artists.join(", ") : "Unknown"}
                  </p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {track.providerId === "jiosaavn" && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                        320K AAC
                      </span>
                    )}
                    {track.providerId === "youtube" && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-red-950/80 text-red-300 border border-red-500/30">
                        YouTube
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. "MADE FOR YOU / DAILY MIXES" (Personalized Feeds) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#b4ff39]" />
            Made For You • Daily Feeds
          </h2>
          <span className="text-[11px] text-zinc-500 font-medium">Auto-tuned algorithm</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {DAILY_MIXES.map((mix) => (
            <div
              key={mix.id}
              onClick={() => handlePlayCollection(mix.tracks, mix.title)}
              className={`p-5 rounded-3xl bg-gradient-to-br ${mix.gradient} border border-white/[0.1] hover:border-white/[0.25] transition-all duration-300 cursor-pointer group shadow-xl relative overflow-hidden`}
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-white uppercase tracking-wider">
                  Personal Mix
                </span>
                <h3 className="text-lg font-black text-white group-hover:text-[#b4ff39] transition-colors leading-snug">
                  {mix.title}
                </h3>
                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                  {mix.subtitle}
                </p>
              </div>

              <div className="pt-6 flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-400">
                  {mix.tracks.length} curated tracks
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayCollection(mix.tracks, mix.title);
                  }}
                  className="w-10 h-10 rounded-full bg-[#b4ff39] text-[#111216] flex items-center justify-center shadow-lg shadow-[#b4ff39]/30 group-hover:scale-110 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. "YOUR PLAYLISTS" & "+ CREATE PLAYLIST" */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-purple-400" />
            Your Playlists
          </h2>
          <button
            onClick={() => setIsNewPlaylistOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-[#b4ff39] hover:text-[#111216] text-xs font-bold text-zinc-200 transition-all border border-white/[0.08]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Playlist</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Create Playlist Tile */}
          <div
            onClick={() => setIsNewPlaylistOpen(true)}
            className="p-5 rounded-3xl bg-white/[0.02] hover:bg-white/[0.05] border-2 border-dashed border-white/[0.12] hover:border-[#b4ff39]/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group min-h-[160px]"
          >
            <div className="w-11 h-11 rounded-full bg-white/[0.06] group-hover:bg-[#b4ff39] group-hover:text-[#111216] flex items-center justify-center text-zinc-400 transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-300 group-hover:text-white">
              Create Custom Playlist
            </span>
            <span className="text-[10px] text-zinc-500">Collect & organize tracks</span>
          </div>

          {/* User Playlists */}
          {customPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => {
                if (pl.tracks.length > 0) {
                  playTrack(pl.tracks[0], pl.tracks);
                  showToast(`Playing playlist "${pl.name}"`);
                } else {
                  showToast(`Playlist "${pl.name}" is currently empty`);
                }
              }}
              className={`p-5 rounded-3xl bg-gradient-to-br ${pl.color || "from-zinc-800 to-zinc-900"} border border-white/[0.1] hover:border-white/[0.25] transition-all cursor-pointer group shadow-lg min-h-[160px] flex flex-col justify-between`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/30 text-white">
                  PLAYLIST
                </span>
                <h4 className="text-sm font-black text-white group-hover:text-[#b4ff39] transition-colors leading-tight pt-1">
                  {pl.name}
                </h4>
                <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                  {pl.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-[10px] font-bold text-zinc-400">
                  {pl.tracks.length} {pl.tracks.length === 1 ? "track" : "tracks"}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#b4ff39] text-[#111216] flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. TRENDING JIOSAAVN MUSIC (320kbps AAC Playable) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4 text-cyan-400" />
              Trending on JioSaavn
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
              320kbps Lossless AAC
            </span>
          </div>
          <button
            onClick={() => navigate("jiosaavn")}
            className="text-xs font-bold text-cyan-400 hover:underline"
          >
            Explore JioSaavn →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          {jiosaavnTrending.slice(0, 6).map((track, idx) => (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => {
                playTrack(track, jiosaavnTrending);
                showToast(`Playing "${track.title}" in 320kbps AAC`);
              }}
              className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-cyan-500/40 transition-all cursor-pointer group space-y-2 shadow"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800 shadow">
                {track.artworkUrl ? (
                  <img
                    src={track.artworkUrl}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <Music className="w-6 h-6" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-[#b4ff39] text-[#111216] flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                  {track.title}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate">
                  {track.artists ? track.artists.join(", ") : "JioSaavn Artist"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. VIRAL ON YOUTUBE MUSIC */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <YoutubeIcon className="w-4 h-4 text-rose-500" />
              Viral on YouTube Music
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40">
              Streaming Audio
            </span>
          </div>
          <button
            onClick={() => navigate("youtube")}
            className="text-xs font-bold text-rose-400 hover:underline"
          >
            Explore YouTube →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          {youtubeTrending.slice(0, 6).map((track, idx) => (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => {
                playTrack(track, youtubeTrending);
                showToast(`Streaming "${track.title}" via YouTube Audio`);
              }}
              className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-rose-500/40 transition-all cursor-pointer group space-y-2 shadow"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800 shadow">
                {track.artworkUrl ? (
                  <img
                    src={track.artworkUrl}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <YoutubeIcon className="w-6 h-6 text-rose-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-[#b4ff39] text-[#111216] flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-300 transition-colors">
                  {track.title}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate">
                  {track.artists ? track.artists.join(", ") : "YouTube Artist"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. QUICK BOOSTER PRESET BAR */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-zinc-900/90 via-[#10121a] to-zinc-900/90 border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#b4ff39] text-[#111216] flex items-center justify-center font-bold shadow-md shadow-[#b4ff39]/30">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">Audio Booster Quick Presets</h4>
            <p className="text-[11px] text-zinc-400">
              Instant hardware loudness preamp, sub-bass blast & zero-clip limiter
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.keys(BOOSTER_PRESETS).slice(0, 4).map((preset) => (
            <button
              key={preset}
              onClick={() => {
                if (!boosterSettings.enabled) toggleBooster();
                applyBoosterPreset(preset);
                showToast(`Booster Preset: ${preset}`);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-[#b4ff39] hover:text-[#111216] text-[11px] font-bold text-zinc-300 transition-all border border-white/[0.08]"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* CREATE PLAYLIST MODAL */}
      {isNewPlaylistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#14161f] border border-white/[0.14] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#b4ff39]" />
                Create New Playlist
              </h3>
              <button
                onClick={() => setIsNewPlaylistOpen(false)}
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylistSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Playlist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Midnight Phonk Drive"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-xs placeholder-zinc-500 font-medium focus:outline-none focus:border-[#b4ff39]"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Description</label>
                <input
                  type="text"
                  placeholder="e.g. High octane bass and drift hits"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-xs placeholder-zinc-500 font-medium focus:outline-none focus:border-[#b4ff39]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Cover Gradient Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLAYLIST_COLORS.map((c) => (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => setNewPlaylistColor(c.val)}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all bg-gradient-to-r ${c.val} text-white ${
                        newPlaylistColor === c.val ? "ring-2 ring-white" : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPlaylistOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-[#b4ff39] hover:bg-[#a3e635] text-[#111216] shadow-md shadow-[#b4ff39]/30 transition-all"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
