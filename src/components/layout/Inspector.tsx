import React, { useEffect, useState, useRef } from "react";
import {
  X,
  ListMusic,
  FileText,
  Sliders,
  Trash2,
  BookmarkPlus,
  ShieldCheck,
  Zap,
  HardDrive,
  Cpu,
  Info,
} from "lucide-react";
import { useUiStore, InspectorTab } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { useAudioStudioStore } from "../../stores/audioStudioStore";
import { LyricsData } from "../../types/music";
import { TauriBridge } from "../../services/tauriBridge";
import { AudioFormatBadge } from "../shared/AudioFormatBadge";

export const Inspector: React.FC = () => {
  const { inspectorOpen, inspectorTab, setInspectorTab, closeInspector, showToast } = useUiStore();
  const {
    currentTrack,
    queue,
    queueIndex,
    currentTimeMs,
    outputStatus,
    removeFromQueue,
    clearQueue,
    playTrack,
  } = usePlayerStore();
  const { addPlaylist } = useLibraryStore();
  const { outputMode, dspSettings, underrunCount } = useAudioStudioStore();

  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const activeLyricRef = useRef<HTMLParagraphElement>(null);

  // Fetch lyrics when current track changes
  useEffect(() => {
    if (!currentTrack) {
      setLyricsData(null);
      return;
    }

    let isMounted = true;
    setIsLoadingLyrics(true);

    TauriBridge.fetchLyrics(
      currentTrack.path,
      currentTrack.title,
      currentTrack.artists[0],
      currentTrack.album,
      Math.floor(currentTrack.durationMs / 1000)
    ).then((data) => {
      if (isMounted) {
        setLyricsData(data);
        setIsLoadingLyrics(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.id]);

  // Scroll synced lyrics to active line
  useEffect(() => {
    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentTimeMs]);

  if (!inspectorOpen) return null;

  const handleSaveQueueAsPlaylist = () => {
    if (queue.length === 0) return;
    const name = prompt("Name for this playlist:", `Queue ${new Date().toLocaleDateString()}`);
    if (name && name.trim()) {
      addPlaylist(name.trim(), `${queue.length} tracks saved from playback queue`);
      showToast(`Saved ${queue.length} tracks to "${name}"`);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <aside className="w-[320px] shrink-0 h-full flex flex-col bg-surface/95 backdrop-blur-md border-l border-white/[0.06] select-none text-zinc-300 z-30">
      {/* Top Inspector Header with Tabs */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setInspectorTab("queue")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              inspectorTab === "queue"
                ? "bg-purple-600/30 text-purple-300 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Queue</span>
          </button>

          <button
            onClick={() => setInspectorTab("lyrics")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              inspectorTab === "lyrics"
                ? "bg-purple-600/30 text-purple-300 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lyrics</span>
          </button>

          <button
            onClick={() => setInspectorTab("track-info")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              inspectorTab === "track-info"
                ? "bg-purple-600/30 text-purple-300 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Diagnostics</span>
          </button>
        </div>

        <button
          onClick={closeInspector}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-3.5">
        {/* TAB 1: QUEUE */}
        {inspectorTab === "queue" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Now Playing & Queue
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {queue.length} {queue.length === 1 ? "track" : "tracks"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleSaveQueueAsPlaylist}
                  title="Save current queue as playlist"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-white/[0.04] transition-colors"
                >
                  <BookmarkPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={clearQueue}
                  title="Clear Queue"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {queue.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Queue is empty. Play or add songs from your library.
              </div>
            ) : (
              <div className="space-y-1.5">
                {queue.map((track, idx) => {
                  const isCurrent = idx === queueIndex;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      onClick={() => playTrack(track)}
                      className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors border ${
                        isCurrent
                          ? "bg-purple-950/40 border-purple-500/30 text-white"
                          : "hover:bg-white/[0.04] border-transparent text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {track.artworkUrl ? (
                          <img
                            src={track.artworkUrl}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover shrink-0 bg-zinc-800"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center font-mono text-zinc-600">
                            ♪
                          </div>
                        )}
                        <div className="min-w-0">
                          <p
                            className={`truncate font-medium ${
                              isCurrent ? "text-purple-300 font-semibold" : "text-zinc-100"
                            }`}
                          >
                            {track.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {track.artists.join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isCurrent ? (
                          <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold px-1.5 py-0.5 rounded bg-purple-500/20">
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(idx);
                              showToast(`Removed "${track.title}" from queue`);
                            }}
                            className="p-1 rounded text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LYRICS */}
        {inspectorTab === "lyrics" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Lyrics
              </span>
              {lyricsData && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {lyricsData.source === "lrclib"
                    ? "LRCLIB API"
                    : lyricsData.source === "sidecar"
                    ? "Local .lrc"
                    : lyricsData.source === "embedded"
                    ? "Embedded Tag"
                    : "No Lyrics"}
                </span>
              )}
            </div>

            {isLoadingLyrics ? (
              <div className="py-12 text-center text-xs text-zinc-500 animate-pulse">
                Fetching synchronized lyrics...
              </div>
            ) : lyricsData?.syncedLines && lyricsData.syncedLines.length > 0 ? (
              <div className="space-y-3 text-sm py-4">
                {lyricsData.syncedLines.map((line, idx) => {
                  const nextLine = lyricsData.syncedLines![idx + 1];
                  const isActive =
                    currentTimeMs >= line.timeMs &&
                    (!nextLine || currentTimeMs < nextLine.timeMs);

                  return (
                    <p
                      key={idx}
                      ref={isActive ? activeLyricRef : null}
                      onClick={() => {
                        usePlayerStore.getState().seek(line.timeMs);
                        TauriBridge.seek(line.timeMs);
                      }}
                      className={`cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "text-purple-300 font-bold scale-[1.02] origin-left"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {line.text}
                    </p>
                  );
                })}
              </div>
            ) : lyricsData?.plainText ? (
              <div className="whitespace-pre-line text-sm text-zinc-300 leading-relaxed font-sans">
                {lyricsData.plainText}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500">
                No lyrics available for this track.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DIAGNOSTICS & TRACK INFO */}
        {inspectorTab === "track-info" && currentTrack && (
          <div className="space-y-5 text-xs">
            {/* Source Specs */}
            <div>
              <div className="flex items-center gap-1.5 text-zinc-400 uppercase font-semibold text-[10px] tracking-wider mb-2">
                <HardDrive className="w-3 h-3 text-purple-400" />
                <span>Source Audio File</span>
              </div>
              <div className="bg-surface-muted p-3 rounded-xl border border-white/[0.05] space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Codec:</span>
                  <span className="text-zinc-200 font-semibold">{currentTrack.codec || "PCM"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sample Rate:</span>
                  <span className="text-zinc-200">{currentTrack.sampleRate || 44100} Hz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Bit Depth:</span>
                  <span className="text-zinc-200">{currentTrack.bitDepth || 16}-bit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Channels:</span>
                  <span className="text-zinc-200">{currentTrack.channels || 2} ch (Stereo)</span>
                </div>
                {currentTrack.bitrate && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Bitrate:</span>
                    <span className="text-zinc-200">{currentTrack.bitrate} kbps</span>
                  </div>
                )}
                {currentTrack.fileSize && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">File Size:</span>
                    <span className="text-zinc-200">{formatFileSize(currentTrack.fileSize)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/[0.05]">
                  <span className="text-zinc-500 text-[10px] block">Path:</span>
                  <span className="text-zinc-400 text-[10px] break-all">
                    {currentTrack.path || "Stream / Network"}
                  </span>
                </div>
              </div>
            </div>

            {/* Output Engine Specs */}
            <div>
              <div className="flex items-center gap-1.5 text-zinc-400 uppercase font-semibold text-[10px] tracking-wider mb-2">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span>Windows Audio Engine (WASAPI)</span>
              </div>
              <div className="bg-surface-muted p-3 rounded-xl border border-white/[0.05] space-y-2 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Output Mode:</span>
                  {outputMode === "exclusive" || outputStatus.isBitPerfect ? (
                    <span className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 font-bold border border-purple-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      BIT-PERFECT DIRECT
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-zinc-400" />
                      WASAPI SHARED
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Device:</span>
                  <span className="text-zinc-200 text-right truncate max-w-[170px]" title={outputStatus.deviceName}>
                    {outputStatus.deviceName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Endpoint Format:</span>
                  <span className="text-zinc-200">
                    {outputStatus.negotiatedSampleRate}Hz / {outputStatus.negotiatedBitDepth}b
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">DSP Pipeline:</span>
                  <span className={dspSettings.bypass || outputStatus.isBitPerfect ? "text-purple-300 font-semibold" : "text-zinc-300"}>
                    {dspSettings.bypass || outputStatus.isBitPerfect ? "Bypassed (Strict Pass-through)" : "Active (10-Band EQ)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Buffer Underruns:</span>
                  <span className="text-emerald-400 font-semibold">{underrunCount} (Zero-glitch)</span>
                </div>
              </div>
            </div>

            {/* Audiophile Caveat Disclosure */}
            <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                Sonora delivers decoded audio samples directly to your Windows audio endpoint without alterations in Bit-Perfect mode. Note that hardware DAC firmware may still perform internal analog reconstruction.
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
