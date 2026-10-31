import React, { useState } from "react";
import { Search, Globe, HardDrive, Server, Sparkles, ExternalLink } from "lucide-react";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { Track } from "../../types/music";
import { TrackRow } from "../../components/shared/TrackRow";
import { TauriBridge } from "../../services/tauriBridge";
import { SourceBadge } from "../../components/shared/SourceBadge";

export const SearchScreen: React.FC = () => {
  const { tracks } = useLibraryStore();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "local" | "jamendo" | "subsonic">("all");
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<Track[]>([]);

  // Local results
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

  const handleSearchJamendo = async () => {
    if (!query.trim()) return;
    setIsSearchingOnline(true);
    const results = await TauriBridge.searchJamendo(query.trim(), 15);
    setOnlineResults(results);
    setIsSearchingOnline(false);
    setActiveTab("jamendo");
  };

  const displayedTracks =
    activeTab === "all"
      ? [...localResults, ...onlineResults]
      : activeTab === "local"
      ? localResults
      : activeTab === "jamendo"
      ? onlineResults
      : [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none p-8 space-y-6">
      {/* Search Input Bar */}
      <div className="max-w-2xl w-full">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search tracks, artists, albums, or lossless audio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchJamendo();
            }}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-surface-muted/90 border border-white/[0.08] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 shadow-lg"
          />
        </div>

        {/* Search Source Tabs */}
        <div className="flex items-center gap-2 mt-3 text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "all"
                ? "bg-purple-600/30 text-purple-300 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All Sources
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "local"
                ? "bg-purple-600/30 text-purple-300 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local Vault ({localResults.length})</span>
          </button>
          <button
            onClick={handleSearchJamendo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "jamendo"
                ? "bg-purple-600/30 text-purple-300 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Jamendo CC ({onlineResults.length})</span>
          </button>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto">
        {isSearchingOnline ? (
          <div className="py-20 text-center text-xs text-zinc-500 animate-pulse">
            Querying Creative Commons catalogue...
          </div>
        ) : query.trim() === "" ? (
          <div className="py-24 text-center space-y-2">
            <Search className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-medium">Type to search your music collection</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Local searches execute instantly offline. You can also search the Jamendo Creative Commons open library by pressing Enter.
            </p>
          </div>
        ) : displayedTracks.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-xs text-zinc-400">No tracks found for "{query}"</p>
            <button
              onClick={handleSearchJamendo}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs hover:bg-purple-600/30 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Search Jamendo CC Online</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-[36px_1fr_1fr_120px_140px_70px] items-center px-3 pb-2 text-[11px] font-mono uppercase font-semibold text-zinc-500 border-b border-white/[0.05]">
              <span className="text-center">#</span>
              <span>Title</span>
              <span>Album</span>
              <span>Source</span>
              <span>Format Spec</span>
              <span className="text-right">Duration</span>
            </div>

            {displayedTracks.map((track, idx) => (
              <TrackRow
                key={`${track.id}-${idx}`}
                track={track}
                index={idx}
                playlistContext={displayedTracks}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
