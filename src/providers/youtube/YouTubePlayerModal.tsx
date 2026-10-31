import React from "react";
import { X, ExternalLink, ShieldAlert } from "lucide-react";
import { YoutubeIcon } from "../../components/shared/ProviderIcons";
import { openYouTubeVideo } from "./index";

interface YouTubePlayerModalProps {
  videoId: string | null;
  videoTitle?: string;
  onClose: () => void;
}

export const YouTubePlayerModal: React.FC<YouTubePlayerModalProps> = ({
  videoId,
  videoTitle,
  onClose,
}) => {
  if (!videoId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-150 select-none">
      <div className="bg-[#141821] border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#0b0d12]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <YoutubeIcon className="w-3.5 h-3.5 fill-current" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Official YouTube Player
              </span>
              <p className="text-[11px] text-zinc-400 truncate max-w-sm">
                {videoTitle || "Official Video Playback"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openYouTubeVideo(videoId)}
              title="Open on YouTube.com"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Player"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compliant Video Viewport (Min 480x270px 16:9 ratio, fully visible) */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
              window.location.origin
            )}`}
            title={videoTitle || "YouTube video player"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Compliance Footer Notice */}
        <div className="px-5 py-2.5 bg-[#0b0d12] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Provided by YouTube API Services. Audio is rendered directly by the official player.</span>
          <span className="text-red-400 font-semibold">YouTube Compliant</span>
        </div>
      </div>
    </div>
  );
};
