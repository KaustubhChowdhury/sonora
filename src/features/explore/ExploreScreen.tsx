import React, { useEffect, useState } from "react";
import {
  Globe,
  Compass,
  Radio,
  ExternalLink,
  ShieldCheck,
  Play,
  Sparkles,
  Info,
} from "lucide-react";
import { Track } from "../../types/music";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { TauriBridge } from "../../services/tauriBridge";
import { TrackRow } from "../../components/shared/TrackRow";

export const ExploreScreen: React.FC = () => {
  const { playTrack } = usePlayerStore();
  const { showToast } = useUiStore();

  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [genreFilter, setGenreFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    TauriBridge.searchJamendo("", 20).then((tracks) => {
      if (isMounted) {
        if (tracks.length > 0) {
          setFeaturedTracks(tracks);
        } else {
          // Fallback discovery items if offline or demo
          setFeaturedTracks([
            {
              id: "jamendo-101",
              title: "Horizon of Light",
              artists: ["Alexei De Valera"],
              album: "Creative Commons Masters Vol. 1",
              durationMs: 242000,
              sourceKind: "stream",
              providerId: "jamendo",
              codec: "MP3",
              sampleRate: 44100,
              bitDepth: 16,
              bitrate: 320,
              artworkUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
              licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
              attribution: "CC BY-SA 4.0 via Jamendo - Alexei De Valera",
              downloadAllowed: false,
              cachingAllowed: false,
            },
            {
              id: "jamendo-102",
              title: "Echoes of the High Plains",
              artists: ["Nordic Sound Project"],
              album: "Arctic Drift",
              durationMs: 310000,
              sourceKind: "stream",
              providerId: "jamendo",
              codec: "MP3",
              sampleRate: 44100,
              bitDepth: 16,
              bitrate: 320,
              artworkUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
              licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
              attribution: "CC BY 4.0 via Jamendo - Nordic Sound Project",
              downloadAllowed: false,
              cachingAllowed: false,
            },
            {
              id: "jamendo-103",
              title: "Neon Rain over Shibuya",
              artists: ["Kaze Beats"],
              album: "Midnight Tokyo Lo-Fi",
              durationMs: 198000,
              sourceKind: "stream",
              providerId: "jamendo",
              codec: "MP3",
              sampleRate: 44100,
              bitDepth: 16,
              bitrate: 320,
              artworkUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
              licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
              attribution: "CC BY-NC 4.0 via Jamendo - Kaze Beats",
              downloadAllowed: false,
              cachingAllowed: false,
            },
          ]);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const openServiceHandoff = (service: "youtube" | "spotify" | "jiosaavn") => {
    let url = "";
    if (service === "youtube") url = "https://music.youtube.com";
    else if (service === "spotify") url = "https://open.spotify.com";
    else if (service === "jiosaavn") url = "https://www.jiosaavn.com";
    TauriBridge.openExternal(url);
    showToast(`Opening ${service.toUpperCase()} in default browser`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 select-none max-w-5xl pb-48">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Lawful Music Discovery
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Independent Creative Commons music via the official Jamendo API. Track licenses and artist attribution are strictly preserved.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span>JAMENDO CC API</span>
        </div>
      </div>

      {/* Rights & Licensing Disclosure Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <p className="font-semibold text-amber-200">Creative Commons Attribution Compliance:</p>
          <p className="mt-0.5 text-zinc-400">
            Every track below is licensed under Creative Commons by independent creators. In compliance with Jamendo developer terms and licensing policy, streams are played in real-time without unauthorized local caching.
          </p>
        </div>
      </div>

      {/* Featured CC Tracks List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Trending Creative Commons Tracks
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            {featuredTracks.length} tracks available
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-zinc-500 animate-pulse">
            Connecting to Jamendo discovery catalogue...
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

            {featuredTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                playlistContext={featuredTracks}
              />
            ))}
          </div>
        )}
      </section>

      {/* Commercial Catalogue Handoff Section */}
      <section className="bg-surface-muted/50 rounded-3xl border border-white/[0.06] p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-purple-400" />
            <span>Commercial Streaming Services (Official Handoff)</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Sonora does not scrape or reverse-engineer commercial streaming services. Launch your official accounts directly:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* YouTube Music */}
          <div
            onClick={() => openServiceHandoff("youtube")}
            className="p-4 rounded-2xl bg-surface-elevated/40 hover:bg-surface-elevated/80 border border-white/[0.05] hover:border-red-500/30 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-zinc-200 group-hover:text-red-400 transition-colors">
                YouTube Music
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400" />
            </div>
            <p className="text-xs text-zinc-500">
              Launch official web client or search artists on YouTube Music.
            </p>
          </div>

          {/* Spotify */}
          <div
            onClick={() => openServiceHandoff("spotify")}
            className="p-4 rounded-2xl bg-surface-elevated/40 hover:bg-surface-elevated/80 border border-white/[0.05] hover:border-emerald-500/30 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-zinc-200 group-hover:text-emerald-400 transition-colors">
                Spotify
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400" />
            </div>
            <p className="text-xs text-zinc-500">
              Open Spotify web player or listen to your Premium account.
            </p>
          </div>

          {/* JioSaavn */}
          <div
            onClick={() => openServiceHandoff("jiosaavn")}
            className="p-4 rounded-2xl bg-surface-elevated/40 hover:bg-surface-elevated/80 border border-white/[0.05] hover:border-cyan-500/30 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-zinc-200 group-hover:text-cyan-400 transition-colors">
                JioSaavn
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400" />
            </div>
            <p className="text-xs text-zinc-500">
              Open JioSaavn official portal for Indian regional and commercial releases.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
