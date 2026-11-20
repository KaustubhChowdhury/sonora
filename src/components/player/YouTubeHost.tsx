import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { AudioEngine } from "../../services/audioEngine";
import { YoutubeIcon } from "../shared/ProviderIcons";
import { IconButton } from "../ui/primitives";
import { cn } from "../../lib/cn";

/**
 * YouTube tracks play through the official embedded player, which must stay mounted and visible
 * (YouTube's terms don't allow hiding it). It sits above the player bar and can be collapsed to a strip.
 */
export const YouTubeHost: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const inspectorOpen = useUiStore((s) => s.inspectorOpen);
  const [collapsed, setCollapsed] = useState(false);
  const active = currentTrack?.providerId === "youtube" || !!currentTrack?.youtubeVideoId;

  useEffect(() => {
    AudioEngine.registerYouTubeIframe(iframeRef.current);
  }, []);

  return (
    <div
      aria-hidden={!active}
      className={cn(
        "fixed bottom-[96px] z-40 w-[320px] rounded-lg overflow-hidden bg-surface-elevated border border-line-strong shadow-2xl shadow-black/50 transition-[opacity,transform] duration-200",
        inspectorOpen ? "right-[364px]" : "right-4",
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-2 h-9 pl-3 pr-1">
        <YoutubeIcon className="w-4 h-4 text-ink-2 shrink-0" />
        <span className="flex-1 text-[12px] text-ink-2 truncate">{currentTrack?.title ?? "YouTube"}</span>
        <IconButton label={collapsed ? "Show video" : "Hide video"} size="sm" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </IconButton>
      </div>
      <div className={cn("aspect-video bg-black", collapsed && "h-0 aspect-auto")}>
        <iframe
          ref={iframeRef}
          title="YouTube player"
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture"
        />
      </div>
    </div>
  );
};
