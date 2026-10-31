import React from "react";
import {
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
  FileText,
  ListMusic,
  Sliders,
  Maximize2,
} from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { SourceBadge } from "../shared/SourceBadge";
import { AudioFormatBadge } from "../shared/AudioFormatBadge";
import { TauriBridge } from "../../services/tauriBridge";

export const MiniPlayer: React.FC = () => {
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

  const {
    inspectorOpen,
    inspectorTab,
    toggleInspector,
    setFullPlayerOpen,
    showToast,
    navigate,
  } = useUiStore();

  const { toggleTrackFavourite } = useLibraryStore();

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    seek(newTime);
    TauriBridge.seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    TauriBridge.setVolume(newVol);
  };

  const handleFavourite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTrack) return;
    toggleTrackFavourite(currentTrack.id);
    TauriBridge.toggleFavourite(currentTrack.id, !currentTrack.isFavourite);
    showToast(
      currentTrack.isFavourite
        ? `Removed "${currentTrack.title}" from favourites`
        : `Added "${currentTrack.title}" to favourites`
    );
  };

  const progressPercent = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;

  return (
    <footer className="h-[92px] w-full bg-surface-muted/95 backdrop-blur-xl border-t border-white/[0.08] px-4 flex items-center justify-between select-none z-40 relative">
      {/* Left Block: Track Identity */}
      <div className="flex items-center gap-3.5 w-[30%] min-w-0 pr-4">
        {currentTrack ? (
          <>
            <div
              onClick={() => setFullPlayerOpen(true)}
              className="relative group w-14 h-14 rounded-xl overflow-hidden bg-surface-elevated shrink-0 cursor-pointer shadow-md border border-white/5"
            >
              {currentTrack.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900 font-mono text-sm">
                  ♪
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p
                  onClick={() => setFullPlayerOpen(true)}
                  className="font-semibold text-sm text-zinc-100 truncate hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {currentTrack.title}
                </p>
                <button
                  onClick={handleFavourite}
                  title={currentTrack.isFavourite ? "Remove from favourites" : "Add to favourites"}
                  className="p-0.5 rounded text-zinc-500 hover:text-amber-400 transition-colors shrink-0"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      currentTrack.isFavourite ? "text-amber-400 fill-amber-400" : ""
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {currentTrack.artists.join(", ")}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <SourceBadge
                  sourceKind={currentTrack.sourceKind}
                  providerId={currentTrack.providerId}
                  attribution={currentTrack.attribution}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="text-xs text-zinc-500 italic">No track selected</div>
        )}
      </div>

      {/* Center Block: Transport & Timeline */}
      <div className="flex flex-col items-center gap-1.5 w-[40%] max-w-[560px]">
        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            title={isShuffle ? "Disable Shuffle" : "Enable Shuffle"}
            className={`p-1.5 rounded-lg transition-colors ${
              isShuffle ? "text-purple-400 bg-purple-500/15" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              prevTrack();
              TauriBridge.resume();
            }}
            title="Previous Track"
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white transition-colors"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={() => {
              togglePlayPause();
              if (!isPlaying) TauriBridge.resume();
              else TauriBridge.pause();
            }}
            title={isPlaying ? "Pause" : "Play"}
            className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => {
              nextTrack();
              TauriBridge.resume();
            }}
            title="Next Track"
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white transition-colors"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            title={`Repeat: ${repeatMode}`}
            className={`p-1.5 rounded-lg transition-colors ${
              repeatMode !== "off"
                ? "text-purple-400 bg-purple-500/15"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {repeatMode === "one" ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Seekbar */}
        <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-zinc-400">
          <span className="w-9 text-right tabular-nums">{formatTime(currentTimeMs)}</span>

          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min={0}
              max={durationMs || 1000}
              value={currentTimeMs}
              onChange={handleSeekChange}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-400 group-hover:h-1.5 transition-all"
            />
            {/* Custom filled progress track */}
            <div
              style={{ width: `${progressPercent}%` }}
              className="absolute left-0 top-0 bottom-0 bg-purple-400 rounded-lg pointer-events-none group-hover:bg-purple-300"
            />
          </div>

          <span className="w-9 text-left tabular-nums">{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* Right Block: Format, Inspector, Audio Studio & Volume */}
      <div className="flex items-center justify-end gap-3 w-[30%] min-w-0 pl-4">
        {currentTrack && (
          <AudioFormatBadge
            compact
            codec={currentTrack.codec}
            sampleRate={currentTrack.sampleRate}
            bitDepth={currentTrack.bitDepth}
            isBitPerfect={outputStatus.isBitPerfect}
          />
        )}

        <button
          onClick={() => navigate("audio-studio")}
          title="Open Audio Studio (Device & DSP Settings)"
          className="p-2 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-white/[0.04] transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <button
          onClick={() => toggleInspector("lyrics")}
          title="Lyrics"
          className={`p-2 rounded-lg transition-colors ${
            inspectorOpen && inspectorTab === "lyrics"
              ? "text-purple-300 bg-purple-500/15"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
          }`}
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          onClick={() => toggleInspector("queue")}
          title="Queue"
          className={`p-2 rounded-lg transition-colors ${
            inspectorOpen && inspectorTab === "queue"
              ? "text-purple-300 bg-purple-500/15"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
          }`}
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Volume */}
        <div className="flex items-center gap-1.5 w-28 group">
          <button
            onClick={() => {
              toggleMute();
              TauriBridge.setVolume(isMuted ? volume : 0);
            }}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-400 group-hover:h-1.5 transition-all"
          />
        </div>

        <button
          onClick={() => setFullPlayerOpen(true)}
          title="Expand Full Player"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
