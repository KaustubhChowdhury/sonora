import React from "react";
import { HardDrive, Globe, Server, Music } from "lucide-react";
import { SourceKind } from "../../types/music";
import { YoutubeIcon } from "./ProviderIcons";

interface SourceBadgeProps {
  sourceKind: SourceKind;
  providerId?: string;
  attribution?: string;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  sourceKind,
  providerId,
  attribution,
  className = "",
}) => {
  if (providerId === "youtube") {
    return (
      <span
        title="Official YouTube Music connection"
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase bg-red-950/40 text-red-400 border border-red-500/30 ${className}`}
      >
        <YoutubeIcon className="w-2.5 h-2.5" />
        <span>YouTube</span>
      </span>
    );
  }

  if (providerId === "jiosaavn") {
    return (
      <span
        title="JioSaavn Official Service"
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 ${className}`}
      >
        <Music className="w-2.5 h-2.5" />
        <span>JioSaavn</span>
      </span>
    );
  }

  if (sourceKind === "personal-server" || providerId === "subsonic") {
    return (
      <span
        title="Personal Music Server (Navidrome / Subsonic)"
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}
      >
        <Server className="w-2.5 h-2.5" />
        <span>Personal Server</span>
      </span>
    );
  }

  if (sourceKind === "stream" || providerId === "jamendo") {
    return (
      <span
        title={attribution || "Jamendo Creative Commons Catalogue (Direct Stream)"}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}
      >
        <Globe className="w-2.5 h-2.5" />
        <span>Jamendo CC</span>
      </span>
    );
  }

  return (
    <span
      title="Local Lossless / Stored File"
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 ${className}`}
    >
      <HardDrive className="w-2.5 h-2.5" />
      <span>Local</span>
    </span>
  );
};
