import React from "react";
import { useAudioStudioStore, BOOSTER_PRESETS } from "../../stores/audioStudioStore";
import { Dialog, Tabs } from "../ui/primitives";
import { Scrubber } from "../player/Scrubber";
import { cn } from "../../lib/cn";

export const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }> = ({
  checked,
  onChange,
  label,
  disabled,
}) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative w-9 h-5 rounded-full transition-colors shrink-0 disabled:opacity-40",
      checked ? "bg-signal" : "bg-white/[0.16]"
    )}
  >
    <span
      className={cn(
        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
        checked && "translate-x-4"
      )}
    />
  </button>
);

const SliderRow: React.FC<{ label: string; value: number; max: number; onChange: (v: number) => void; disabled?: boolean }> = ({
  label,
  value,
  max,
  onChange,
  disabled,
}) => (
  <div className={cn("grid grid-cols-[96px_1fr_56px] items-center gap-3", disabled && "opacity-40")}>
    <span className="text-[13px] text-ink-2">{label}</span>
    <Scrubber label={label} value={value} max={max} step={0.5} onScrub={(v) => v !== null && onChange(v)} onCommit={onChange} disabled={disabled} />
    <span className="text-[13px] text-right tnum">+{value.toFixed(1)} dB</span>
  </div>
);

/** Loudness boost for streamed audio (JioSaavn, Jamendo, your server). */
export const BoostControls: React.FC = () => {
  const { boosterSettings: b, setBoosterEnabled, setBoosterPreamp, setBoosterBass, setBoosterClarity, applyBoosterPreset } =
    useAudioStudioStore();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-ink-2 max-w-[44ch]">
          Makes quiet streams louder and adds bass or clarity. A limiter keeps it from clipping. Doesn't affect YouTube.
        </p>
        <Switch checked={b.enabled} onChange={setBoosterEnabled} label="Boost" />
      </div>
      <Tabs
        value={b.activePreset}
        onChange={(p) => {
          if (!b.enabled) setBoosterEnabled(true);
          applyBoosterPreset(p);
        }}
        items={Object.keys(BOOSTER_PRESETS).map((p) => ({ value: p, label: p }))}
        className="flex-wrap"
      />
      <div className="flex flex-col gap-3">
        <SliderRow label="Loudness" value={b.preampBoostDb} max={18} onChange={setBoosterPreamp} disabled={!b.enabled} />
        <SliderRow label="Bass" value={b.bassBoostDb} max={15} onChange={setBoosterBass} disabled={!b.enabled} />
        <SliderRow label="Clarity" value={b.clarityBoostDb} max={10} onChange={setBoosterClarity} disabled={!b.enabled} />
      </div>
    </div>
  );
};

export const AudioBoosterModal: React.FC = () => {
  const { isBoosterModalOpen, setBoosterModalOpen } = useAudioStudioStore();
  return (
    <Dialog open={isBoosterModalOpen} onClose={() => setBoosterModalOpen(false)} title="Boost" width="max-w-lg">
      <div className="pt-2">
        <BoostControls />
      </div>
    </Dialog>
  );
};
