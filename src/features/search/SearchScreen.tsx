import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Globe,
  HardDrive,
  Music,
  Play,
  Loader2,
  Sparkles,
  ListPlus,
} from "lucide-react";
import { YoutubeIcon } from "../../components/shared/ProviderIcons";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { Track } from "../../types/music";
import { TrackRow } from "../../components/shared/TrackRow";
import { TauriBridge } from "../../services/tauriBridge";

const POPULAR_SEARCH_TAGS = [
  "Phonk",
  "Arijit Singh",
  "Late Night Lo-Fi",
  "The Weeknd",
  "Diljit Dosanjh",
  "Drift Phonk",
  "Karan Aujla",
  "Bollywood Hits",
  "Synthwave",
  "Anirudh",
  "Bass Boosted",
];

export const SearchScreen: React.FC = () => {
  const { tracks } = useLibraryStore();
  const { playTrack, addToQueue } = usePlayerStore();
  const { showToast } = useUiStore();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "local" | "jiosaavn" | "youtube" | "jamendo">("all");
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  
  const [jiosaavnResults, setJiosaavnResults] = useState<Track[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<Track[]>([]);
  const [onlineJamendoResults, setOnlineJamendoResults] = useState<Track[]>([]);

  const debounceTimerRef = useRef<any>(null);

  // Local tracks search
  const localResults = query.trim()
    ? tracks.filter((t) => {
        const q = query.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.artists.some((a) => a.toLowerCase().includes(q)) ||
          t.album?.toLowerCase().includes(q) ||
          t.genre?.toLowerCase().includes(q)
        );
      })
    : [];

  const executeLiveSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) {
      setJiosaavnResults([]);
      setYoutubeResults([]);
      setOnlineJamendoResults([]);
      return;
    }

    setIsSearchingOnline(true);
    try {
      const [jioRes, ytRes, jamRes] = await Promise.allSettled([
        TauriBridge.searchJioSaavn(q, 20),
        TauriBridge.searchYouTube(q, 20),
        TauriBridge.searchJamendo(q, 10),
      ]);

      if (jioRes.status === "fulfilled") {
        setJiosaavnResults(jioRes.value);
      }
      if (ytRes.status === "fulfilled") {
        setYoutubeResults(ytRes.value);
      }
      if (jamRes.status === "fulfilled") {
        setOnlineJamendoResults(jamRes.value);
      }
    } catch (err) {
      console.error("Live search failed:", err);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Debounced auto-search when typing
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (query.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        executeLiveSearch(query);
      }, 300);
    } else {
      setJiosaavnResults([]);
      setYoutubeResults([]);
      setOnlineJamendoResults([]);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  const handleManualSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      executeLiveSearch(query);
    }
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    executeLiveSearch(tag);
  };

  const handlePlayAll = (items: Track[], label: string) => {
    if (items.length === 0) return;
    playTrack(items[0], items);
    showToast(`Playing ${items.length} tracks from ${label}`);
  };

  const totalResultsCount =
    localResults.length +
    jiosaavnResults.length +
    youtubeResults.length +
    onlineJamendoResults.length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none p-8 space-y-6">
      {/* Top Search Field & Provider Tabs */}
      <div className="max-w-4xl w-full space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search songs, artists, JioSaavn 320kbps streams, YouTube Music or local files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleManualSearch}
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-[#141821]/90 border border-white/[0.08] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#9b7bff] focus:ring-1 focus:ring-[#9b7bff]/50 shadow-lg"
          />
          {isSearchingOnline && (
            <Loader2 className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 animate-spin" />
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-zinc-500 text-[11px] font-medium mr-1 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Quick:
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/40 border border-white/[0.08] text-zinc-400 text-xs transition-all whitespace-nowrap shrink-0"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Provenance Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl transition-colors font-medium ${
              activeTab === "all"
                ? "bg-[#9b7bff]/25 text-purple-200 font-semibold border border-purple-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All Sources {query.trim() && `(${totalResultsCount})`}
          </button>

          <button
            onClick={() => setActiveTab("jiosaavn")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors font-medium ${
              activeTab === "jiosaavn"
                ? "bg-cyan-950/40 text-cyan-300 font-semibold border border-cyan-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span>JioSaavn</span>
            {jiosaavnResults.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/20 rounded-full font-mono">
                {jiosaavnResults.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("youtube")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors font-medium ${
              activeTab === "youtube"
                ? "bg-red-950/40 text-red-300 font-semibold border border-red-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <YoutubeIcon className="w-3.5 h-3.5 text-red-400" />
            <span>YouTube Music</span>
            {youtubeResults.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-red-500/20 rounded-full font-mono">
                {youtubeResults.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("local")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors font-medium ${
              activeTab === "local"
                ? "bg-[#9b7bff]/25 text-purple-200 font-semibold border border-purple-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local Vault</span>
            {localResults.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/20 rounded-full font-mono">
                {localResults.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("jamendo")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors font-medium ${
              activeTab === "jamendo"
                ? "bg-amber-950/40 text-amber-300 font-semibold border border-amber-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Jamendo CC</span>
            {onlineJamendoResults.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 rounded-full font-mono">
                {onlineJamendoResults.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {!query.trim() ? (
          <div className="h-64 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-xl">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">Live Streaming & Local Search</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Type any song, artist, album, or click a quick suggestion above to play immediately in 320kbps Master AAC from JioSaavn or YouTube Music.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* JIOSAAVN RESULTS */}
            {(activeTab === "all" || activeTab === "jiosaavn") && (
              <section className="space-y-3 bg-[#141821]/40 p-4 rounded-2xl border border-cyan-500/20">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      JioSaavn Music ({jiosaavnResults.length})
                    </h2>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30 font-medium">
                      320kbps AAC Playable
                    </span>
                  </div>

                  {jiosaavnResults.length > 0 && (
                    <button
                      onClick={() => handlePlayAll(jiosaavnResults, "JioSaavn")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all"
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
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
                ) : isSearchingOnline ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-cyan-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching JioSaavn 320kbps catalogue...</span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-2">
                    No JioSaavn matches found for "{query}".
                  </p>
                )}
              </section>
            )}

            {/* YOUTUBE RESULTS */}
            {(activeTab === "all" || activeTab === "youtube") && (
              <section className="space-y-3 bg-[#141821]/40 p-4 rounded-2xl border border-red-500/20">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <YoutubeIcon className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      YouTube Music ({youtubeResults.length})
                    </h2>
                    <span className="text-[10px] text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30 font-medium">
                      In-App Player
                    </span>
                  </div>

                  {youtubeResults.length > 0 && (
                    <button
                      onClick={() => handlePlayAll(youtubeResults, "YouTube Music")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-medium transition-all"
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
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
                ) : isSearchingOnline ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-red-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching YouTube Music...</span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-2">
                    No YouTube Music matches found for "{query}".
                  </p>
                )}
              </section>
            )}

            {/* LOCAL VAULT RESULTS */}
            {(activeTab === "all" || activeTab === "local") && (
              <section className="space-y-3 bg-[#141821]/40 p-4 rounded-2xl border border-white/[0.06]">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-purple-400" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Local Lossless Vault ({localResults.length})
                    </h2>
                  </div>

                  {localResults.length > 0 && (
                    <button
                      onClick={() => handlePlayAll(localResults, "Local Vault")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition-all"
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                      <span>Play All</span>
                    </button>
                  )}
                </div>

                {localResults.length > 0 ? (
                  <div className="space-y-1">
                    {localResults.map((track, idx) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={idx}
                        playlistContext={localResults}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-2">
                    No local lossless tracks matching "{query}".
                  </p>
                )}
              </section>
            )}

            {/* JAMENDO CC RESULTS */}
            {(activeTab === "all" || activeTab === "jamendo") && (
              <section className="space-y-3 bg-[#141821]/40 p-4 rounded-2xl border border-amber-500/20">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Jamendo Creative Commons ({onlineJamendoResults.length})
                    </h2>
                  </div>

                  {onlineJamendoResults.length > 0 && (
                    <button
                      onClick={() => handlePlayAll(onlineJamendoResults, "Jamendo")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all"
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                      <span>Play All</span>
                    </button>
                  )}
                </div>

                {onlineJamendoResults.length > 0 ? (
                  <div className="space-y-1">
                    {onlineJamendoResults.map((track, idx) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={idx}
                        playlistContext={onlineJamendoResults}
                      />
                    ))}
                  </div>
                ) : isSearchingOnline ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-amber-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Querying Jamendo Creative Commons open streams...</span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-2">
                    Type and press Enter to query Jamendo.
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};