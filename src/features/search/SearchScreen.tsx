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
  Flame,
  Radio,
  Sliders,
  Disc,
} from "lucide-react";
import { YoutubeIcon } from "../../components/shared/ProviderIcons";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { Track } from "../../types/music";
import { TrackRow } from "../../components/shared/TrackRow";
import { TauriBridge } from "../../services/tauriBridge";

const POPULAR_SEARCH_TAGS = [
  "🔥 Phonk Drift",
  "⚡ The Weeknd",
  "✨ Apna Bana Le",
  "🦁 Sidhu Moosewala",
  "🎧 Lo-Fi Beats",
  "👑 Arijit Singh",
  "🏎️ DVRST - Close Eyes",
  "💎 Starboy",
  "💥 Metamorphosis",
  "🌙 Diljit Dosanjh",
  "🎸 Rock & Electric",
  "📻 Synthwave 80s",
];

export const SearchScreen: React.FC = () => {
  const { tracks } = useLibraryStore();
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const { showToast, globalSearchQuery, setGlobalSearchQuery } = useUiStore();

  const [activeTab, setActiveTab] = useState<"all" | "jiosaavn" | "youtube" | "local">("all");
  const [isSearching, setIsSearching] = useState(false);
  const [jiosaavnResults, setJiosaavnResults] = useState<Track[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<Track[]>([]);
  const [localResults, setLocalResults] = useState<Track[]>([]);

  const debounceTimerRef = useRef<any>(null);

  // Relevance ranking algorithm
  const rankTracks = (items: Track[], queryStr: string) => {
    const q = queryStr.toLowerCase().trim();
    if (!q) return items;
    return [...items].sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aArtist = a.artists ? a.artists.join(" ").toLowerCase() : "";
      const bArtist = b.artists ? b.artists.join(" ").toLowerCase() : "";

      // Exact title match gets #1 priority
      if (aTitle === q && bTitle !== q) return -1;
      if (bTitle === q && aTitle !== q) return 1;

      // Title starts with query
      if (aTitle.startsWith(q) && !bTitle.startsWith(q)) return -1;
      if (bTitle.startsWith(q) && !aTitle.startsWith(q)) return 1;

      // Title contains query
      if (aTitle.includes(q) && !bTitle.includes(q)) return -1;
      if (bTitle.includes(q) && !aTitle.includes(q)) return 1;

      // Artist contains query
      if (aArtist.includes(q) && !bArtist.includes(q)) return -1;
      if (bArtist.includes(q) && !aArtist.includes(q)) return 1;

      return 0;
    });
  };

  const executeSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) {
      setJiosaavnResults([]);
      setYoutubeResults([]);
      setLocalResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Local library matches
      const localMatches = tracks.filter((t) => {
        const queryLower = q.toLowerCase();
        return (
          t.title.toLowerCase().includes(queryLower) ||
          t.artists.some((a) => a.toLowerCase().includes(queryLower)) ||
          t.album?.toLowerCase().includes(queryLower)
        );
      });
      setLocalResults(localMatches);

      // Simultaneously query both JioSaavn (320kbps Lossless) and YouTube Music
      const [jioRes, ytRes] = await Promise.allSettled([
        TauriBridge.searchJioSaavn(q, 25),
        TauriBridge.searchYouTube(q, 25),
      ]);

      if (jioRes.status === "fulfilled") {
        setJiosaavnResults(rankTracks(jioRes.value, q));
      }
      if (ytRes.status === "fulfilled") {
        setYoutubeResults(rankTracks(ytRes.value, q));
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search on globalSearchQuery change
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (globalSearchQuery.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        executeSearch(globalSearchQuery);
      }, 250);
    } else {
      setJiosaavnResults([]);
      setYoutubeResults([]);
      setLocalResults([]);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [globalSearchQuery]);

  // Combined and sorted results
  const allResults = rankTracks(
    [...jiosaavnResults, ...youtubeResults, ...localResults],
    globalSearchQuery
  );

  const bestMatch = allResults.length > 0 ? allResults[0] : null;

  const currentDisplayList =
    activeTab === "all"
      ? allResults
      : activeTab === "jiosaavn"
      ? jiosaavnResults
      : activeTab === "youtube"
      ? youtubeResults
      : localResults;

  const handleChipClick = (tag: string) => {
    const clean = tag.replace(/^[^\w]+/, "").trim();
    setGlobalSearchQuery(clean);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-48 select-none">
      {/* Top Search Input Bar */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            placeholder="Search all songs, artists, albums, phonk, or mixes..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[#12141c]/90 border border-white/[0.12] focus:border-[#b4ff39]/60 focus:bg-[#151824] text-white text-sm placeholder-zinc-500 font-medium transition-all shadow-xl outline-none"
            autoFocus
          />
          {globalSearchQuery && (
            <button
              onClick={() => setGlobalSearchQuery("")}
              className="absolute right-4 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {isSearching && (
            <Loader2 className="w-4 h-4 text-[#b4ff39] animate-spin absolute right-12" />
          )}
        </div>

        {/* Source Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-[#b4ff39] text-[#111216] shadow-md shadow-[#b4ff39]/30"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]"
            }`}
          >
            <span>All Sources</span>
            <span className="text-[10px] opacity-70">({allResults.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("jiosaavn")}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "jiosaavn"
                ? "bg-cyan-400 text-[#111216] shadow-md shadow-cyan-400/30"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>JioSaavn 320k</span>
            <span className="text-[10px] opacity-70">({jiosaavnResults.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("youtube")}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "youtube"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]"
            }`}
          >
            <YoutubeIcon className="w-3.5 h-3.5" />
            <span>YouTube Music</span>
            <span className="text-[10px] opacity-70">({youtubeResults.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("local")}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "local"
                ? "bg-emerald-400 text-[#111216] shadow-md shadow-emerald-400/30"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local Vault</span>
            <span className="text-[10px] opacity-70">({localResults.length})</span>
          </button>
        </div>
      </div>

      {/* When Empty: Show Popular Categories & Trending Tags */}
      {!globalSearchQuery.trim() && (
        <div className="max-w-4xl mx-auto space-y-6 pt-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#b4ff39]" />
              Popular & Trending Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCH_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleChipClick(tag)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] hover:border-[#b4ff39]/40 text-xs font-semibold text-zinc-300 hover:text-white transition-all hover:scale-105 active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Discover Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            <div
              onClick={() => handleChipClick("Phonk Drift")}
              className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 via-black to-[#0e1017] border border-purple-500/20 hover:border-purple-500/50 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                  ⚡ Drift & Phonk
                </span>
                <Flame className="w-4 h-4 text-purple-400 group-hover:scale-125 transition-transform" />
              </div>
              <h4 className="text-base font-black text-white mt-2">Aggressive 808 Cowbell</h4>
              <p className="text-xs text-zinc-400 mt-1">INTERWORLD, DVRST, Kordhell, Hensonn</p>
            </div>

            <div
              onClick={() => handleChipClick("Trending Hindi Top 50")}
              className="p-4 rounded-2xl bg-gradient-to-br from-cyan-900/40 via-black to-[#0e1017] border border-cyan-500/20 hover:border-cyan-500/50 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
                  🔥 JioSaavn 320k Hits
                </span>
                <Music className="w-4 h-4 text-cyan-400 group-hover:scale-125 transition-transform" />
              </div>
              <h4 className="text-base font-black text-white mt-2">Bollywood & Indie Masters</h4>
              <p className="text-xs text-zinc-400 mt-1">Arijit Singh, Sachin-Jigar, Anuv Jain</p>
            </div>

            <div
              onClick={() => handleChipClick("The Weeknd Viral")}
              className="p-4 rounded-2xl bg-gradient-to-br from-rose-900/40 via-black to-[#0e1017] border border-rose-500/20 hover:border-rose-500/50 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-rose-300 uppercase tracking-wider">
                  👑 Global Viral Anthems
                </span>
                <YoutubeIcon className="w-4 h-4 text-rose-400 group-hover:scale-125 transition-transform" />
              </div>
              <h4 className="text-base font-black text-white mt-2">Top Chartbusters</h4>
              <p className="text-xs text-zinc-400 mt-1">Starboy, Blinding Lights, Metamorphosis</p>
            </div>
          </div>
        </div>
      )}

      {/* When Results Are Available */}
      {globalSearchQuery.trim() && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Result / Best Match Hero Card */}
          {bestMatch && activeTab === "all" && (
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                Top Result (Best Match)
              </h3>
              <div
                onClick={() => {
                  playTrack(bestMatch, allResults);
                  showToast(`Playing "${bestMatch.title}"`);
                }}
                className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-[#12141c] border border-white/[0.12] hover:border-[#b4ff39]/50 transition-all cursor-pointer group flex items-center justify-between shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 shadow-lg border border-white/10">
                    {bestMatch.artworkUrl ? (
                      <img
                        src={bestMatch.artworkUrl}
                        alt={bestMatch.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        <Music className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#b4ff39] text-[#111216]">
                        BEST MATCH
                      </span>
                      {bestMatch.providerId === "jiosaavn" ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                          320kbps AAC
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40">
                          YouTube Music
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-white group-hover:text-[#b4ff39] transition-colors leading-tight">
                      {bestMatch.title}
                    </h2>
                    <p className="text-xs text-zinc-300 font-medium">
                      {bestMatch.artists ? bestMatch.artists.join(", ") : "Unknown Artist"} •{" "}
                      {bestMatch.album || "Single"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playTrack(bestMatch, allResults);
                    showToast(`Playing "${bestMatch.title}"`);
                  }}
                  className="w-12 h-12 rounded-full bg-[#b4ff39] hover:bg-[#a3e635] text-[#111216] flex items-center justify-center shadow-xl shadow-[#b4ff39]/40 hover:scale-110 active:scale-95 transition-all shrink-0 ml-4"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Matching Songs ({currentDisplayList.length})</span>
              {currentDisplayList.length > 0 && (
                <button
                  onClick={() => playTrack(currentDisplayList[0], currentDisplayList)}
                  className="text-[11px] font-bold text-[#b4ff39] hover:underline"
                >
                  Play All
                </button>
              )}
            </h3>

            {currentDisplayList.length === 0 && !isSearching && (
              <div className="text-center py-12 space-y-2">
                <Search className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-400 font-semibold">
                  No matching tracks found for "{globalSearchQuery}"
                </p>
                <p className="text-xs text-zinc-600">
                  Try searching for another artist, song title, or genre.
                </p>
              </div>
            )}

            <div className="space-y-1">
              {currentDisplayList.map((track, idx) => (
                <TrackRow
                  key={`${track.id}-${idx}`}
                  track={track}
                  index={idx}
                  playlistContext={currentDisplayList}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
