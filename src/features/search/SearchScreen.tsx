import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Music,
  Play,
  Loader2,
  Sparkles,
  X,
  HardDrive,
  Globe,
} from "lucide-react";
import { YoutubeIcon } from "../../components/shared/ProviderIcons";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { Track } from "../../types/music";
import { TrackRow } from "../../components/shared/TrackRow";
import { TauriBridge } from "../../services/tauriBridge";

const JIOSAAVN_CHIPS = [
  "Tauba Tauba",
  "Arijit Singh",
  "Diljit Dosanjh",
  "Husn",
  "Millionaire",
  "Karan Aujla",
  "Shreya Ghoshal",
  "Anirudh",
  "Sidhu Moosewala",
  "AP Dhillon",
  "Badshah",
];

const YOUTUBE_CHIPS = [
  "Phonk Drift",
  "DVRST",
  "METAMORPHOSIS",
  "Lo-Fi Hip Hop Beats",
  "Synthwave Retro",
  "The Weeknd",
  "Hensonn",
  "INTERWORLD",
  "Bass Boosted EDM",
  "Ghostface Playa",
];

const ALL_CHIPS = [
  "Phonk",
  "Arijit Singh",
  "Lo-Fi Beats",
  "Tauba Tauba",
  "The Weeknd",
  "Diljit Dosanjh",
  "DVRST",
  "Karan Aujla",
];

export const SearchScreen: React.FC = () => {
  const { tracks } = useLibraryStore();
  const { playTrack } = usePlayerStore();
  const { showToast } = useUiStore();

  // Search modes: "jiosaavn" (standalone), "youtube" (standalone), "combined"
  const [searchMode, setSearchMode] = useState<"jiosaavn" | "youtube" | "combined">("jiosaavn");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [jiosaavnResults, setJiosaavnResults] = useState<Track[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<Track[]>([]);
  const [jamendoResults, setJamendoResults] = useState<Track[]>([]);

  const debounceTimerRef = useRef<any>(null);

  // Local tracks search (for combined view)
  const localResults = query.trim()
    ? tracks.filter((t) => {
        const q = query.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.artists.some((a) => a.toLowerCase().includes(q)) ||
          t.album?.toLowerCase().includes(q)
        );
      })
    : [];

  const executeSearch = async (searchTerm: string, mode = searchMode) => {
    const q = searchTerm.trim();
    if (!q) {
      setJiosaavnResults([]);
      setYoutubeResults([]);
      setJamendoResults([]);
      return;
    }

    setIsSearching(true);
    try {
      if (mode === "jiosaavn") {
        const items = await TauriBridge.searchJioSaavn(q, 30);
        setJiosaavnResults(items);
      } else if (mode === "youtube") {
        const items = await TauriBridge.searchYouTube(q, 24);
        setYoutubeResults(items);
      } else {
        const [jio, yt, jam] = await Promise.allSettled([
          TauriBridge.searchJioSaavn(q, 15),
          TauriBridge.searchYouTube(q, 15),
          TauriBridge.searchJamendo(q, 10),
        ]);
        if (jio.status === "fulfilled") setJiosaavnResults(jio.value);
        if (yt.status === "fulfilled") setYoutubeResults(yt.value);
        if (jam.status === "fulfilled") setJamendoResults(jam.value);
      }
    } catch (err) {
      console.error("Search execution error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced auto-search
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (query.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        executeSearch(query, searchMode);
      }, 300);
    } else {
      setJiosaavnResults([]);
      setYoutubeResults([]);
      setJamendoResults([]);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, searchMode]);

  const handleManualSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      executeSearch(query, searchMode);
    }
  };

  const handleChipClick = (chip: string) => {
    setQuery(chip);
    executeSearch(chip, searchMode);
  };

  const handleClear = () => {
    setQuery("");
    setJiosaavnResults([]);
    setYoutubeResults([]);
    setJamendoResults([]);
  };

  const handlePlayAll = (items: Track[], label: string) => {
    if (items.length === 0) return;
    playTrack(items[0], items);
    showToast(`Playing ${items.length} tracks from ${label}`);
  };

  const activeChips =
    searchMode === "jiosaavn"
      ? JIOSAAVN_CHIPS
      : searchMode === "youtube"
      ? YOUTUBE_CHIPS
      : ALL_CHIPS;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none p-8 space-y-6">
      {/* Top Standalone Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Standalone Music Search
          </h1>
          <p className="text-xs text-zinc-400">
            Dedicated standalone search engines for JioSaavn (320kbps) & YouTube Music
          </p>
        </div>

        {/* Big Standalone Mode Switcher */}
        <div className="flex items-center gap-2 bg-[#141821] p-1.5 rounded-2xl border border-white/[0.08] shadow-lg">
          <button
            onClick={() => {
              setSearchMode("jiosaavn");
              if (query.trim()) executeSearch(query, "jiosaavn");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              searchMode === "jiosaavn"
                ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-950/50"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>JioSaavn Standalone</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/30 text-cyan-200">
              320k
            </span>
          </button>

          <button
            onClick={() => {
              setSearchMode("youtube");
              if (query.trim()) executeSearch(query, "youtube");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              searchMode === "youtube"
                ? "bg-red-600 text-white shadow-md shadow-red-950/50"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <YoutubeIcon className="w-3.5 h-3.5" />
            <span>YouTube Music Standalone</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/30 text-red-200">
              In-App
            </span>
          </button>

          <button
            onClick={() => {
              setSearchMode("combined");
              if (query.trim()) executeSearch(query, "combined");
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              searchMode === "combined"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/50"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Combined</span>
          </button>
        </div>
      </div>

      {/* Standalone Search Bar */}
      <div className="max-w-4xl w-full space-y-3">
        <div className="relative">
          <Search
            className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${
              searchMode === "jiosaavn"
                ? "text-cyan-400"
                : searchMode === "youtube"
                ? "text-red-400"
                : "text-purple-400"
            }`}
          />
          <input
            type="text"
            autoFocus
            placeholder={
              searchMode === "jiosaavn"
                ? "Search JioSaavn 320kbps songs, artists, albums (e.g. Arijit Singh, Tauba Tauba)..."
                : searchMode === "youtube"
                ? "Search YouTube Music videos, phonk drift, lo-fi radios (e.g. DVRST, METAMORPHOSIS)..."
                : "Search across all sources simultaneously..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleManualSearch}
            className={`w-full pl-12 pr-20 py-3.5 rounded-2xl bg-[#141821]/90 border text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none shadow-xl transition-all ${
              searchMode === "jiosaavn"
                ? "border-cyan-500/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                : searchMode === "youtube"
                ? "border-red-500/40 focus:border-red-400 focus:ring-1 focus:ring-red-400/50"
                : "border-purple-500/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
            }`}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSearching && (
              <Loader2
                className={`w-4 h-4 animate-spin ${
                  searchMode === "jiosaavn"
                    ? "text-cyan-400"
                    : searchMode === "youtube"
                    ? "text-red-400"
                    : "text-purple-400"
                }`}
              />
            )}
            {query.trim() && (
              <button
                onClick={handleClear}
                className="w-5 h-5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-zinc-500 text-[11px] font-medium mr-1 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Quick:
          </span>
          {activeChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              className={`px-3 py-1 rounded-full border text-xs transition-all whitespace-nowrap shrink-0 ${
                searchMode === "jiosaavn"
                  ? "bg-cyan-950/30 hover:bg-cyan-500/20 hover:text-cyan-300 border-cyan-500/30 text-zinc-300"
                  : searchMode === "youtube"
                  ? "bg-red-950/30 hover:bg-red-500/20 hover:text-red-300 border-red-500/30 text-zinc-300"
                  : "bg-white/[0.05] hover:bg-purple-500/20 hover:text-purple-300 border-white/[0.08] text-zinc-400"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Main Results Container */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {!query.trim() ? (
          <div className="h-72 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl border ${
                searchMode === "jiosaavn"
                  ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                  : searchMode === "youtube"
                  ? "bg-red-500/15 border-red-500/30 text-red-500"
                  : "bg-purple-500/15 border-purple-500/30 text-purple-400"
              }`}
            >
              {searchMode === "jiosaavn" ? (
                <Music className="w-8 h-8" />
              ) : searchMode === "youtube" ? (
                <YoutubeIcon className="w-8 h-8" />
              ) : (
                <Search className="w-8 h-8" />
              )}
            </div>

            <div>
              <h3 className="font-extrabold text-base text-zinc-100">
                {searchMode === "jiosaavn"
                  ? "Standalone JioSaavn 320kbps Search"
                  : searchMode === "youtube"
                  ? "Standalone YouTube Music In-App Search"
                  : "Unified Streaming Search"}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                {searchMode === "jiosaavn"
                  ? "Type any song, artist, or album to search and stream in direct 320kbps Master AAC without web popups."
                  : searchMode === "youtube"
                  ? "Type any track, phonk mix, or live set to search and play with in-app audio & video picture-in-picture."
                  : "Search across JioSaavn, YouTube Music, and your local library simultaneously."}
              </p>
            </div>
          </div>
        ) : searchMode === "jiosaavn" ? (
          /* JIOSAAVN STANDALONE RESULTS */
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  JioSaavn Results ({jiosaavnResults.length})
                </h2>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-mono font-semibold">
                  320kbps AAC Direct Stream
                </span>
              </div>

              {jiosaavnResults.length > 0 && (
                <button
                  onClick={() => handlePlayAll(jiosaavnResults, "JioSaavn")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-zinc-950 text-xs font-bold transition-all shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Play All</span>
                </button>
              )}
            </div>

            {jiosaavnResults.length > 0 ? (
              <div className="space-y-1">
                {jiosaavnResults.map((t, idx) => (
                  <TrackRow key={t.id} track={t} index={idx} playlistContext={jiosaavnResults} />
                ))}
              </div>
            ) : isSearching ? (
              <div className="flex items-center gap-2 py-8 text-xs text-cyan-400 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Searching JioSaavn high-fidelity 320kbps catalogue...</span>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic py-8 text-center">
                No JioSaavn matches found for "{query}".
              </p>
            )}
          </section>
        ) : searchMode === "youtube" ? (
          /* YOUTUBE MUSIC STANDALONE RESULTS */
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-red-500/20">
              <div className="flex items-center gap-2">
                <YoutubeIcon className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  YouTube Music Results ({youtubeResults.length})
                </h2>
                <span className="text-[10px] text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-500/30 font-mono font-semibold">
                  In-App Audio & Video
                </span>
              </div>

              {youtubeResults.length > 0 && (
                <button
                  onClick={() => handlePlayAll(youtubeResults, "YouTube Music")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Play All</span>
                </button>
              )}
            </div>

            {youtubeResults.length > 0 ? (
              <div className="space-y-1">
                {youtubeResults.map((yt, idx) => (
                  <TrackRow key={yt.id} track={yt} index={idx} playlistContext={youtubeResults} />
                ))}
              </div>
            ) : isSearching ? (
              <div className="flex items-center gap-2 py-8 text-xs text-red-400 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Searching YouTube Music videos & tracks...</span>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic py-8 text-center">
                No YouTube Music matches found for "{query}".
              </p>
            )}
          </section>
        ) : (
          /* COMBINED RESULTS VIEW */
          <div className="space-y-6">
            {/* JioSaavn Subsection */}
            <section className="space-y-3 bg-[#141821]/40 p-4 rounded-2xl border border-cyan-500/20">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    JioSaavn 320kbps ({jiosaavnResults.length})
                  </h2>
                </div>
                {jiosaavnResults.length > 0 && (
                  <button
                    onClick={() => handlePlayAll(jiosaavnResults, "JioSaavn")}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                    <span>Play</span>
                  </button>
                )}
              </div>
              {jiosaavnResults.length > 0 ? (
                <div className="space-y-1">
                  {jiosaavnResults.slice(0, 8).map((t, idx) => (
                    <TrackRow key={t.id} track={t} index={idx} playlistContext={jiosaavnResults} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic py-2">
                  No JioSaavn matches for "{query}".
                </p>
              )}
            </section>

            {/* YouTube Music Subsection */}
            <section className="space-y-3 bg-[#141821]/40 p-4 rounded-2xl border border-red-500/20">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <YoutubeIcon className="w-4 h-4 text-red-500" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    YouTube Music ({youtubeResults.length})
                  </h2>
                </div>
                {youtubeResults.length > 0 && (
                  <button
                    onClick={() => handlePlayAll(youtubeResults, "YouTube Music")}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-medium"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                    <span>Play</span>
                  </button>
                )}
              </div>
              {youtubeResults.length > 0 ? (
                <div className="space-y-1">
                  {youtubeResults.slice(0, 8).map((yt, idx) => (
                    <TrackRow key={yt.id} track={yt} index={idx} playlistContext={youtubeResults} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic py-2">
                  No YouTube Music matches for "{query}".
                </p>
              )}
            </section>

            {/* Local Vault Subsection if matches */}
            {localResults.length > 0 && (
              <section className="space-y-3 bg-[#141821]/40 p-4 rounded-2xl border border-white/[0.06]">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-purple-400" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Local Vault ({localResults.length})
                    </h2>
                  </div>
                  <button
                    onClick={() => handlePlayAll(localResults, "Local Vault")}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                    <span>Play</span>
                  </button>
                </div>
                <div className="space-y-1">
                  {localResults.map((track, idx) => (
                    <TrackRow key={track.id} track={track} index={idx} playlistContext={localResults} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};