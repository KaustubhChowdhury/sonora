import React, { useState } from "react";
import {
  Search,
  Globe,
  HardDrive,
  Music,
  ExternalLink,
  Play,
  Film,
} from "lucide-react";
import { YoutubeIcon } from "../../components/shared/ProviderIcons";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { Track } from "../../types/music";
import { TrackRow } from "../../components/shared/TrackRow";
import { TauriBridge } from "../../services/tauriBridge";
import { SourceBadge } from "../../components/shared/SourceBadge";
import { getYouTubeCuratedResults, openYouTubeMusic } from "../../providers/youtube";
import { getJioSaavnCuratedResults, openJioSaavn } from "../../providers/jiosaavn";
import { YouTubePlayerModal } from "../../providers/youtube/YouTubePlayerModal";
import { ProviderSearchResult } from "../../providers/types";

export const SearchScreen: React.FC = () => {
  const { tracks } = useLibraryStore();
  const { playTrack } = usePlayerStore();
  const { showToast } = useUiStore();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "local" | "jamendo" | "youtube" | "jiosaavn">("all");
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineJamendoResults, setOnlineJamendoResults] = useState<Track[]>([]);
  const [activeYouTubeVideoId, setActiveYouTubeVideoId] = useState<string | null>(null);
  const [activeYouTubeTitle, setActiveYouTubeTitle] = useState<string | undefined>(undefined);

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

  // YouTube curated / official video results
  const youtubeResults = getYouTubeCuratedResults(query);

  // JioSaavn curated highlights
  const jiosaavnResults = getJioSaavnCuratedResults(query);

  const handleSearchJamendo = async () => {
    if (!query.trim()) return;
    setIsSearchingOnline(true);
    const results = await TauriBridge.searchJamendo(query.trim(), 15);
    setOnlineJamendoResults(results);
    setIsSearchingOnline(false);
  };

  const handleOpenExternal = (provider: "youtube" | "jiosaavn") => {
    if (provider === "youtube") {
      openYouTubeMusic(query);
      showToast(`Opening YouTube Music for "${query}"`);
    } else {
      openJioSaavn(query);
      showToast(`Opening JioSaavn for "${query}"`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none p-8 space-y-6">
      {/* Top Search Field & Provider Tabs */}
      <div className="max-w-3xl w-full space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search local lossless vault, Jamendo CC, YouTube or JioSaavn..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchJamendo();
            }}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#141821]/90 border border-white/[0.08] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#9b7bff] focus:ring-1 focus:ring-[#9b7bff]/50 shadow-lg"
          />
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
            All Sources
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
            <span>Local Vault ({localResults.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("jamendo");
              handleSearchJamendo();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors font-medium ${
              activeTab === "jamendo"
                ? "bg-[#9b7bff]/25 text-purple-200 font-semibold border border-purple-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Jamendo CC ({onlineJamendoResults.length})</span>
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
          </button>
        </div>
      </div>

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {query.trim() === "" ? (
          <div className="py-24 text-center space-y-2">
            <Search className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-medium">
              Unified cross-provider search with provenance
            </p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Type keywords to query your local lossless vault, Jamendo Creative Commons open streams, or launch official YouTube Music &amp; JioSaavn searches.
            </p>
          </div>
        ) : (
          <>
            {/* LOCAL RESULTS */}
            {(activeTab === "all" || activeTab === "local") && localResults.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-[#9b7bff]" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Local Library ({localResults.length})
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">Native Playback</span>
                </div>

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
              </section>
            )}

            {/* JAMENDO CC RESULTS */}
            {(activeTab === "all" || activeTab === "jamendo") && (
              <section className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Jamendo Creative Commons ({onlineJamendoResults.length})
                    </h2>
                  </div>
                  <button
                    onClick={handleSearchJamendo}
                    className="text-[11px] text-purple-400 hover:underline"
                  >
                    Query Jamendo
                  </button>
                </div>

                {isSearchingOnline ? (
                  <p className="text-xs text-zinc-500 italic py-4 animate-pulse">
                    Querying Jamendo CC API...
                  </p>
                ) : onlineJamendoResults.length > 0 ? (
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
                ) : (
                  <p className="text-xs text-zinc-500 italic py-2">
                    Press Enter or click "Query Jamendo" to search open Creative Commons tracks.
                  </p>
                )}
              </section>
            )}

            {/* YOUTUBE RESULTS */}
            {(activeTab === "all" || activeTab === "youtube") && (
              <section className="space-y-3 bg-[#141821]/40 p-4 rounded-2xl border border-red-500/20">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <YoutubeIcon className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      YouTube Music Official Integration
                    </h2>
                  </div>
                  <button
                    onClick={() => handleOpenExternal("youtube")}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium"
                  >
                    <span>Search on YouTube Music</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {youtubeResults.map((yt) => (
                    <div
                      key={yt.providerItemId}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated/40 border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {yt.artworkUrl && (
                          <img
                            src={yt.artworkUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-zinc-800 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-zinc-100 truncate">{yt.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{yt.artists.join(", ")}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {yt.youtubeVideoId && (
                          <button
                            onClick={() => {
                              setActiveYouTubeVideoId(yt.youtubeVideoId!);
                              setActiveYouTubeTitle(yt.title);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 text-xs hover:bg-red-600/30 transition-colors"
                          >
                            <Film className="w-3 h-3" />
                            <span>Watch</span>
                          </button>
                        )}
                        <button
                          onClick={() => openYouTubeMusic(yt.title)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
                          title="Open in YouTube Music"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* JIOSAAVN RESULTS */}
            {(activeTab === "all" || activeTab === "jiosaavn") && (
              <section className="space-y-3 bg-[#141821]/40 p-4 rounded-2xl border border-cyan-500/20">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      JioSaavn Official Service
                    </h2>
                  </div>
                  <button
                    onClick={() => handleOpenExternal("jiosaavn")}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    <span>Search on JioSaavn.com</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {jiosaavnResults.map((js) => (
                    <div
                      key={js.providerItemId}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated/40 border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {js.artworkUrl && (
                          <img
                            src={js.artworkUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-zinc-800 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-zinc-100 truncate">{js.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{js.artists.join(", ")}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => openJioSaavn(js.title)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs hover:bg-cyan-600/30 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Compliant YouTube IFrame Modal if active */}
      <YouTubePlayerModal
        videoId={activeYouTubeVideoId}
        videoTitle={activeYouTubeTitle}
        onClose={() => setActiveYouTubeVideoId(null)}
      />
    </div>
  );
};
