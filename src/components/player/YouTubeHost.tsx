import React, { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { AudioEngine } from "../../services/audioEngine";
import { YoutubeIcon } from "../shared/ProviderIcons";
import { Maximize2, Minimize2, X } from "lucide-react";

export const YouTubeHost: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { currentTrack } = usePlayerStore();
  const [isMinimized, setIsMinimized] = useState(false);

  const isYouTubeActive =
    currentTrack?.providerId === "youtube" || !!currentTrack?.youtubeVideoId;

  useEffect(() => {
    if (iframeRef.current) {
      AudioEngine.registerYouTubeIframe(iframeRef.current);
    }
  }, []);

  if (!isYouTubeActive) {
    return (
      <iframe
        ref={iframeRef}
        id="sonora-yt-host"
        className="hidden"
        title="YouTube Audio Engine"
        allow="autoplay; encrypted-media"
      />
    );
  }

  return (
    <div
      className={`fixed bottom-24 right-6 z-40 bg-[#141821] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
        isMinimized ? "w-64 h-12" : "w-80 h-52"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0b0d12] border-b border-white/[0.08] select-none text-xs">
        <div className="flex items-center gap-2 truncate">
          <YoutubeIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="font-semibold text-white truncate text-[11px]">
            {currentTrack?.title || "YouTube Music"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:text-white rounded"
            title={isMinimized ? "Expand video" : "Minimize video"}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Embedded 16:9 compliant YouTube IFrame */}
      <div className={`flex-1 relative bg-black ${isMinimized ? "hidden" : "block"}`}>
        <iframe
          ref={iframeRef}
          id="sonora-yt-host"
          className="w-full h-full border-0"
          title="YouTube Music Player"
          allow="autoplay; encrypted-media"
        />
      </div>
    </div>
  );
};
