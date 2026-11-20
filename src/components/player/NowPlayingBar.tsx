import React, { useState } from "react";
import {
  Heart,
  ListMusic,
  Maximize2,
  MicVocal,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { useAudioStudioStore } from "../../stores/audioStudioStore";
import { Artwork, IconButton } from "../ui/primitives";
import { Scrubber } from "./Scrubber";
import { formatTime, sourceLabel, formatSpec } from "../../lib/format";
import { cn } from "../../lib/cn";

export const NowPlayingBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTimeMs,
    durationMs,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    queue,
    togglePlayPause,
    seek,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();
  const { setFullPlayerOpen, toggleInspector, inspectorOpen, inspectorTab, navigate } = useUiStore();
  const { toggleTrackFavourite, favourites } = useLibraryStore();
  const { boosterSettings, setBoosterModalOpen } = useAudioStudioStore();
  const [scrub, setScrub] = useState<number | null>(null);

  const liked = !!currentTrack && favourites.some((f) => f.id === currentTrack.id);
  const hasTrack = !!currentTrack;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const spec = currentTrack ? formatSpec(currentTrack) : "";

  return (
    <footer className="relative h-[84px] shrink-0 grid grid-cols-[minmax(220px,1fr)_minmax(360px,1.4fr)_minmax(220px,1fr)] items-center gap-6 px-4 border-t border-line overflow-hidden">
      {/* artwork colour bleeds up from the bottom edge */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 transition-[background] duration-700"
        style={{ background: "linear-gradient(0deg, rgb(var(--ambient) / 0.22), rgb(var(--ambient) / 0.06) 70%, transparent)" }}
      />

      {/* Track */}
      <div className="flex items-center gap-3 min-w-0">
        {hasTrack ? (
          <>
            <button
              onClick={() => setFullPlayerOpen(true)}
              title="Open player"
              className="group relative shrink-0 rounded-md overflow-hidden"
            >
              <Artwork src={currentTrack.artworkUrl} alt="" className="w-14 h-14" />
              <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-white" />
              </span>
            </button>
            <div className="min-w-0">
              <button
                onClick={() => setFullPlayerOpen(true)}
                className="block max-w-full text-left text-[14px] font-semibold text-ink truncate hover:underline underline-offset-2"
              >
                {currentTrack.title}
              </button>
              <button
                onClick={() =>
                  currentTrack.artists[0] &&
                  navigate("artist-detail", { artistId: `artist-${currentTrack.artists[0]}` })
                }
                className="block max-w-full text-left text-[12px] text-ink-2 truncate hover:text-ink hover:underline underline-offset-2"
              >
                {currentTrack.artists.join(", ")}
              </button>
              <p className="text-[11px] text-ink-3 truncate mt-0.5">
                {sourceLabel(currentTrack.providerId, currentTrack.sourceKind)}
                {spec && <span className="tnum">{`  ${spec}`}</span>}
              </p>
            </div>
            <IconButton
              label={liked ? "Remove from liked songs" : "Add to liked songs"}
              active={liked}
              onClick={() => toggleTrackFavourite(currentTrack)}
              className="shrink-0"
            >
              <Heart className={cn("w-4 h-4", liked && "fill-current")} />
            </IconButton>
          </>
        ) : (
          <p className="text-[13px] text-ink-3">Nothing playing</p>
        )}
      </div>

      {/* Transport */}
      <div className="flex flex-col items-center gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <IconButton label={isShuffle ? "Shuffle on" : "Shuffle off"} active={isShuffle} onClick={toggleShuffle} disabled={!hasTrack}>
            <Shuffle className="w-4 h-4" />
          </IconButton>
          <IconButton label="Previous" onClick={prevTrack} disabled={!hasTrack}>
            <SkipBack className="w-[18px] h-[18px] fill-current" />
          </IconButton>
          <button
            onClick={togglePlayPause}
            disabled={!hasTrack && queue.length === 0}
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            className="w-9 h-9 mx-1 rounded-full bg-ink text-bg flex items-center justify-center transition-transform hover:scale-[1.05] active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-[1px]" />}
          </button>
          <IconButton label="Next" onClick={nextTrack} disabled={!hasTrack}>
            <SkipForward className="w-[18px] h-[18px] fill-current" />
          </IconButton>
          <IconButton
            label={repeatMode === "off" ? "Repeat off" : repeatMode === "all" ? "Repeat all" : "Repeat one"}
            active={repeatMode !== "off"}
            onClick={toggleRepeat}
            disabled={!hasTrack}
          >
            {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </IconButton>
        </div>
        <div className="w-full max-w-[560px] flex items-center gap-2.5">
          <span className="w-10 text-right text-[11px] text-ink-3 tnum">{formatTime(scrub ?? currentTimeMs)}</span>
          <Scrubber
            label="Seek"
            value={currentTimeMs}
            max={durationMs}
            step={250}
            disabled={!hasTrack}
            onScrub={setScrub}
            onCommit={seek}
          />
          <span className="w-10 text-[11px] text-ink-3 tnum">{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* Output */}
      <div className="flex items-center justify-end gap-1 min-w-0">
        <button
          onClick={() => setBoosterModalOpen(true)}
          title="Loudness boost"
          className={cn(
            "h-7 px-2.5 mr-1 rounded-full flex items-center gap-1.5 text-[12px] font-semibold transition-colors",
            boosterSettings.enabled ? "bg-signal/15 text-signal hover:bg-signal/25" : "text-ink-2 hover:text-ink hover:bg-white/[0.06]"
          )}
        >
          <Zap className={cn("w-3.5 h-3.5", boosterSettings.enabled && "fill-current")} />
          {boosterSettings.enabled ? <span className="tnum">+{boosterSettings.preampBoostDb.toFixed(0)} dB</span> : "Boost"}
        </button>
        <IconButton
          label="Lyrics"
          active={inspectorOpen && inspectorTab === "lyrics"}
          onClick={() => toggleInspector("lyrics")}
        >
          <MicVocal className="w-4 h-4" />
        </IconButton>
        <IconButton
          label="Queue (Ctrl+Q)"
          active={inspectorOpen && inspectorTab === "queue"}
          onClick={() => toggleInspector("queue")}
        >
          <ListMusic className="w-4 h-4" />
        </IconButton>
        <IconButton label={isMuted ? "Unmute" : "Mute"} onClick={toggleMute}>
          <VolumeIcon className="w-4 h-4" />
        </IconButton>
        <div className="w-24">
          <Scrubber
            label="Volume"
            value={isMuted ? 0 : volume}
            max={1}
            step={0.01}
            onScrub={(v) => v !== null && setVolume(v)}
            onCommit={setVolume}
          />
        </div>
      </div>
    </footer>
  );
};
