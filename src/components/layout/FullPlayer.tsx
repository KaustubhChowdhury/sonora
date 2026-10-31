import React, { useEffect, useState, useRef } from "react";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Star,
  Sliders,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { useAudioStudioStore } from "../../stores/audioStudioStore";
import { LyricsData } from "../../types/music";
import { TauriBridge } from "../../services/tauriBridge";
import { SourceBadge } from "../shared/SourceBadge";
import { AudioFormatBadge } from "../shared/AudioFormatBadge";

export const FullPlayer: React.FC = () => {
  const { isFullPlayerOpen, setFullPlayerOpen, showToast, navigate } = useUiStore();
  const {
    currentTrack,
    isPlaying,
    currentTimeMs,
    durationMs,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    outputStatus,
    togglePlayPause,
    seek,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();
  const { toggleTrackFavourite } = useLibraryStore();
  const { outputMode } = useAudioStudioStore();

  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [activeTab, setActiveTab] = useState<"lyrics" | "visualizer">("lyrics");
  const activeLyricRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!currentTrack) return;
    TauriBridge.fetchLyrics(
      currentTrack.path,
      currentTrack.title,
      currentTrack.artists[0],
      currentTrack.album,
      Math.floor(currentTrack.durationMs / 1000)
    ).then((res) => setLyricsData(res));
  }, [currentTrack?.id]);

  useEffect(() => {
    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentTimeMs]);

  if (!isFullPlayerOpen || !currentTrack) return null;

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0d12] flex flex-col animate-in fade-in zoom-in-95 duration-200 select-none overflow-hidden">
      {/* Dynamic blurred ambient glow behind artwork */}
      {currentTrack.artworkUrl && (
        <div
          style={{ backgroundImage: `url(${currentTrack.artworkUrl})` }}
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-125 pointer-events-none"
        />
      )}

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <button
          onClick={() => setFullPlayerOpen(false)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-semibold">Minimize Player</span>
        </button>

        <div className="flex items-center gap-2">
          <AudioFormatBadge
            codec={currentTrack.codec}
            sampleRate={currentTrack.sampleRate}
            bitDepth={currentTrack.bitDepth}
            isBitPerfect={outputStatus.isBitPerfect || outputMode === "exclusive"}
          />
        </div>

        <button
          onClick={() => {
            setFullPlayerOpen(false);
            navigate("audio-studio");
          }}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-purple-300 transition-colors"
        >
          <Sliders className="w-4 h-4" />
          <span>Audio Studio</span>
        </button>
      </div>

      {/* Main Split View: Left = Big Hero Artwork, Right = Synced Lyrics */}
      <div className="relative z-10 flex-1 grid grid-cols-2 gap-12 p-12 max-w-6xl mx-auto w-full items-center min-h-0">
        {/* Left: Artwork Hero & Meta */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-80 h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-6 group">
            {currentTrack.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900 text-6xl">
                ♪
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">{currentTrack.title}</h2>
            <button
              onClick={() => {
                toggleTrackFavourite(currentTrack.id);
                TauriBridge.toggleFavourite(currentTrack.id, !currentTrack.isFavourite);
                showToast(
                  currentTrack.isFavourite
                    ? `Removed from favourites`
                    : `Added to favourites`
                );
              }}
              className="text-zinc-500 hover:text-amber-400 transition-colors"
            >
              <Star
                className={`w-5 h-5 ${
                  currentTrack.isFavourite ? "text-amber-400 fill-amber-400" : ""
                }`}
              />
            </button>
          </div>

          <p className="text-base text-zinc-400">{currentTrack.artists.join(", ")}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {currentTrack.album} {currentTrack.year ? `(${currentTrack.year})` : ""}
          </p>

          <div className="mt-3">
            <SourceBadge
              sourceKind={currentTrack.sourceKind}
              providerId={currentTrack.providerId}
              attribution={currentTrack.attribution}
            />
          </div>
        </div>

        {/* Right: Synced Lyrics */}
        <div className="h-full flex flex-col bg-surface/40 backdrop-blur-md rounded-2xl border border-white/[0.06] p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
            <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider">
              Synchronized Lyrics
            </span>
            {lyricsData && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                {lyricsData.source}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {lyricsData?.syncedLines && lyricsData.syncedLines.length > 0 ? (
              lyricsData.syncedLines.map((line, idx) => {
                const nextLine = lyricsData.syncedLines![idx + 1];
                const isActive =
                  currentTimeMs >= line.timeMs &&
                  (!nextLine || currentTimeMs < nextLine.timeMs);

                return (
                  <p
                    key={idx}
                    ref={isActive ? activeLyricRef : null}
                    onClick={() => {
                      seek(line.timeMs);
                      TauriBridge.seek(line.timeMs);
                    }}
                    className={`cursor-pointer transition-all duration-300 text-lg leading-relaxed ${
                      isActive
                        ? "text-purple-300 font-bold scale-[1.03] origin-left drop-shadow-md"
                        : "text-zinc-500 hover:text-zinc-300 opacity-60"
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : lyricsData?.plainText ? (
              <div className="whitespace-pre-line text-sm text-zinc-300 leading-relaxed">
                {lyricsData.plainText}
              </div>
            ) : (
              <div className="py-24 text-center text-zinc-500 text-sm">
                No synchronized lyrics available for this recording.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Transport Controls */}
      <div className="relative z-10 max-w-3xl mx-auto w-full px-6 pb-8 pt-2">
        {/* Timeline */}
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mb-4">
          <span className="w-10 text-right tabular-nums">{formatTime(currentTimeMs)}</span>
          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min={0}
              max={durationMs || 1000}
              value={currentTimeMs}
              onChange={(e) => {
                const val = Number(e.target.value);
                seek(val);
                TauriBridge.seek(val);
              }}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <div
              style={{ width: `${progressPercent}%` }}
              className="absolute left-0 top-0 bottom-0 bg-purple-400 rounded-lg pointer-events-none"
            />
          </div>
          <span className="w-10 text-left tabular-nums">{formatTime(durationMs)}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-lg transition-colors ${
              isShuffle ? "text-purple-400 bg-purple-500/15" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                prevTrack();
                TauriBridge.resume();
              }}
              className="p-2 rounded-full text-zinc-300 hover:text-white transition-colors"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            <button
              onClick={() => {
                togglePlayPause();
                if (!isPlaying) TauriBridge.resume();
                else TauriBridge.pause();
              }}
              className="w-14 h-14 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={() => {
                nextTrack();
                TauriBridge.resume();
              }}
              className="p-2 rounded-full text-zinc-300 hover:text-white transition-colors"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
          </div>

          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-lg transition-colors ${
              repeatMode !== "off"
                ? "text-purple-400 bg-purple-500/15"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {repeatMode === "one" ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
