import React, { useState } from "react";
import { X, Trash2, GripVertical } from "lucide-react";
import { useUiStore, InspectorTab } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useAudioStudioStore } from "../../stores/audioStudioStore";
import { Artwork, Button, EqBars, IconButton, Tabs } from "../ui/primitives";
import { useActiveLyricIndex, useLyrics, useScrollActiveLine } from "../../hooks/useLyrics";
import { formatTime, sourceLabel, plural } from "../../lib/format";
import { cn } from "../../lib/cn";
import { Track } from "../../types/music";

export const Inspector: React.FC = () => {
  const { inspectorOpen, inspectorTab, setInspectorTab, closeInspector } = useUiStore();
  if (!inspectorOpen) return null;

  return (
    <aside className="w-[340px] shrink-0 flex flex-col min-h-0 ml-2 rounded-t-xl bg-surface border-t border-x border-line overflow-hidden">
      <div className="flex items-center justify-between px-3 h-12 shrink-0">
        <Tabs
          value={inspectorTab}
          onChange={(v) => setInspectorTab(v as InspectorTab)}
          items={[
            { value: "queue", label: "Queue" },
            { value: "lyrics", label: "Lyrics" },
            { value: "track-info", label: "Details" },
          ]}
        />
        <IconButton label="Close panel" size="sm" onClick={closeInspector}>
          <X className="w-4 h-4" />
        </IconButton>
      </div>
      {inspectorTab === "queue" && <QueuePanel />}
      {inspectorTab === "lyrics" && <LyricsPanel />}
      {inspectorTab === "track-info" && <DetailsPanel />}
    </aside>
  );
};

/* ---------------- Queue ---------------- */

const QueuePanel: React.FC = () => {
  const { queue, queueIndex, isPlaying, removeFromQueue, clearQueue, reorderQueue } = usePlayerStore();
  const { openNewPlaylist } = useUiStore();
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  if (queue.length === 0) {
    return (
      <div className="px-5 py-8 text-[13px] text-ink-2">
        <p className="font-semibold text-ink mb-1">Queue is empty</p>
        Play something, or right-click a song and choose “Add to queue”.
      </div>
    );
  }

  const current = queue[queueIndex];
  const upNext = queue.map((t, i) => ({ t, i })).filter(({ i }) => i > queueIndex);
  const played = queueIndex > 0 ? queueIndex : 0;

  const Row: React.FC<{ t: Track; i: number; isCurrent?: boolean }> = ({ t, i, isCurrent }) => (
    <div
      draggable={!isCurrent}
      onDragStart={() => setDragFrom(i)}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(i);
      }}
      onDragEnd={() => {
        setDragFrom(null);
        setDragOver(null);
      }}
      onDrop={() => {
        if (dragFrom !== null && dragFrom !== i) reorderQueue(dragFrom, i);
        setDragFrom(null);
        setDragOver(null);
      }}
      onDoubleClick={() => usePlayerStore.getState().playTrack(t)}
      className={cn(
        "group flex items-center gap-3 h-14 px-2 rounded-md",
        isCurrent ? "bg-white/[0.05]" : "hover:bg-white/[0.04]",
        dragOver === i && dragFrom !== i && "shadow-[inset_0_2px_0_var(--color-signal)]"
      )}
    >
      {!isCurrent && <GripVertical className="w-3.5 h-3.5 text-ink-3 opacity-0 group-hover:opacity-100 cursor-grab -mr-1" />}
      <Artwork src={t.artworkUrl} className="w-10 h-10" rounded="rounded" />
      <div className="min-w-0 flex-1">
        <p className={cn("text-[13px] font-medium truncate", isCurrent ? "text-signal" : "text-ink")}>{t.title}</p>
        <p className="text-[12px] text-ink-2 truncate">{t.artists.join(", ")}</p>
      </div>
      {isCurrent ? (
        <EqBars playing={isPlaying} />
      ) : (
        <IconButton label="Remove from queue" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => removeFromQueue(i)}>
          <X className="w-3.5 h-3.5" />
        </IconButton>
      )}
    </div>
  );

  return (
    <>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {current && (
          <>
            <h3 className="px-2 pt-2 pb-1 text-[12px] font-medium text-ink-3">Now playing</h3>
            <Row t={current} i={queueIndex} isCurrent />
          </>
        )}
        <h3 className="px-2 pt-5 pb-1 text-[12px] font-medium text-ink-3">
          {upNext.length ? `Next up · ${upNext.length}` : "Nothing up next"}
        </h3>
        {upNext.map(({ t, i }) => (
          <Row key={`${t.id}-${i}`} t={t} i={i} />
        ))}
        {played > 0 && <p className="px-2 pt-4 text-[12px] text-ink-3">{plural(played, "earlier song")} in this queue</p>}
      </div>
      <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-3 border-t border-line">
        <Button size="sm" variant="ghost" onClick={() => openNewPlaylist(queue)}>
          Save as playlist
        </Button>
        <Button size="sm" variant="danger" onClick={clearQueue}>
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </Button>
      </div>
    </>
  );
};

/* ---------------- Lyrics ---------------- */

export const LyricsBody: React.FC<{ large?: boolean }> = ({ large }) => {
  const { data, loading, track } = useLyrics();
  const idx = useActiveLyricIndex(data);
  const ref = useScrollActiveLine(idx);
  const seek = usePlayerStore((s) => s.seek);

  if (!track) return <p className="px-5 py-8 text-[13px] text-ink-2">Play a song to see its lyrics.</p>;
  if (loading) return <p className="px-5 py-8 text-[13px] text-ink-3">Looking for lyrics…</p>;
  if (!data || data.source === "none" || (!data.plainText && !data.syncedLines?.length)) {
    return (
      <div className="px-5 py-8 text-[13px] text-ink-2">
        <p className="font-semibold text-ink mb-1">No lyrics found</p>
        Sonora checks for a matching .lrc file next to the song, then LRCLIB.
      </div>
    );
  }

  if (data.isSynced && data.syncedLines?.length) {
    return (
      <div ref={ref} className={cn("relative flex-1 overflow-y-auto", large ? "px-2 py-[30vh]" : "px-5 py-[40%]")}>
        {data.syncedLines.map((l, i) => (
          <button
            key={i}
            data-line={i}
            onClick={() => seek(l.timeMs)}
            className={cn(
              "block w-full text-left font-bold tracking-[-0.01em] transition-colors duration-300",
              large ? "text-[34px] leading-[1.25] py-2" : "text-[19px] leading-[1.35] py-1.5",
              i === idx ? "text-ink" : i < idx ? "text-ink/35 hover:text-ink/70" : "text-ink/45 hover:text-ink/70"
            )}
          >
            {l.text || "♪"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex-1 overflow-y-auto whitespace-pre-line text-ink-2", large ? "px-2 py-10 text-[22px] leading-relaxed" : "px-5 py-4 text-[14px] leading-relaxed")}>
      {data.plainText}
    </div>
  );
};

const LyricsPanel: React.FC = () => (
  <div className="flex-1 min-h-0 flex flex-col">
    <LyricsBody />
  </div>
);

/* ---------------- Details ---------------- */

const DetailsPanel: React.FC = () => {
  const { currentTrack: t, outputStatus } = usePlayerStore();
  const { outputMode, dspSettings, boosterSettings } = useAudioStudioStore();
  if (!t) return <p className="px-5 py-8 text-[13px] text-ink-2">Nothing playing.</p>;

  const native = t.sourceKind === "local" && !!t.path;
  const rows: [string, React.ReactNode][] = [
    ["Source", sourceLabel(t.providerId, t.sourceKind)],
    ["Format", t.codec ?? "—"],
    ["Sample rate", t.sampleRate ? `${(t.sampleRate / 1000).toFixed(1)} kHz` : "—"],
    ["Bit depth", t.bitDepth ? `${t.bitDepth}-bit` : "—"],
    ["Bitrate", t.bitrate ? `${t.bitrate} kbps` : "—"],
    ["Channels", t.channels ? (t.channels === 2 ? "Stereo" : t.channels === 1 ? "Mono" : `${t.channels}`) : "—"],
    ["Length", formatTime(t.durationMs)],
  ];
  if (t.fileSize) rows.push(["File size", `${(t.fileSize / 1048576).toFixed(1)} MB`]);
  if (t.year) rows.push(["Year", String(t.year)]);
  if (t.genre) rows.push(["Genre", t.genre]);

  const outRows: [string, React.ReactNode][] = native
    ? [
        ["Engine", "Sonora native (WASAPI)"],
        ["Mode", outputMode === "exclusive" ? "Exclusive" : "Shared"],
        ["Device", outputStatus.deviceName],
        ["Output", `${(outputStatus.negotiatedSampleRate / 1000).toFixed(1)} kHz / ${outputStatus.negotiatedBitDepth}-bit`],
        ["EQ and effects", dspSettings.bypass || outputStatus.isBitPerfect ? "Bypassed" : "On"],
        ["Bit-perfect", outputStatus.isBitPerfect ? "Yes" : "No"],
      ]
    : [
        ["Engine", t.providerId === "youtube" ? "YouTube embedded player" : "Web audio stream"],
        ["Boost", boosterSettings.enabled ? `On, +${boosterSettings.preampBoostDb} dB` : "Off"],
      ];

  const Table: React.FC<{ title: string; rows: [string, React.ReactNode][] }> = ({ title, rows }) => (
    <div className="mt-5 first:mt-0">
      <h3 className="text-[12px] font-medium text-ink-3 mb-1.5">{title}</h3>
      <dl className="text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-1.5 border-b border-line last:border-0">
            <dt className="text-ink-2">{k}</dt>
            <dd className="text-ink text-right truncate tnum">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      <div className="flex items-center gap-3 py-2 mb-3">
        <Artwork src={t.artworkUrl} className="w-14 h-14" />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold truncate">{t.title}</p>
          <p className="text-[12px] text-ink-2 truncate">{t.artists.join(", ")}</p>
        </div>
      </div>
      <Table title="File" rows={rows} />
      <Table title="Playback" rows={outRows} />
      {t.path && <p className="mt-4 text-[11px] text-ink-3 break-all select-text">{t.path}</p>}
      {t.attribution && <p className="mt-4 text-[12px] text-ink-3">{t.attribution}</p>}
    </div>
  );
};
