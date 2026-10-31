import React from "react";
import { HardDrive, Globe, Server } from "lucide-react";
import { SourceKind } from "../../types/music";

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
