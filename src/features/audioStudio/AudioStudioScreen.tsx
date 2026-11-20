import React, { useState } from "react";
import { useAudioStudioStore, EQ_FREQUENCIES, EQ_PRESETS } from "../../stores/audioStudioStore";
import { usePlayerStore } from "../../stores/playerStore";
import { BoostControls, Switch } from "../../components/audio/AudioBoosterModal";
import { Button, Dialog, PageHeader } from "../../components/ui/primitives";
import { isTauri } from "../../services/tauriBridge";
import { cn } from "../../lib/cn";

const Group: React.FC<{ title: string; description?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  description,
  aside,
  children,
}) => (
  <section className="py-8 border-t border-line">
    <div className="flex items-start justify-between gap-6 mb-5">
      <div>
        <h2 className="text-[18px] font-bold tracking-[-0.01em]">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-ink-2 max-w-[64ch]">{description}</p>}
      </div>
      {aside}
    </div>
    {children}
  </section>
);

export const AudioStudioScreen: React.FC = () => {
  const {
    devices,
    selectedDeviceId,
    selectDevice,
    outputMode,
    setOutputMode,
    exclusiveModeWarningDismissed,
    setExclusiveWarningDismissed,
    dspSettings,
    setDspBypass,
    setPreampGain,
    setEqBand,
    applyEqPreset,
  } = useAudioStudioStore();
  const outputStatus = usePlayerStore((s) => s.outputStatus);
  const [confirmExclusive, setConfirmExclusive] = useState(false);
  const exclusive = outputMode === "exclusive";
  const eqOn = !dspSettings.bypass && !exclusive;

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-20">
      <div className="max-w-[880px]">
        <PageHeader title="Sound" />

        <Group
          title="Output"
          description="Where songs from your library play. Streams and YouTube always use the Windows default device."
        >
          <div className="flex flex-col gap-5 max-w-xl">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-ink-2">Device</span>
              <select
                value={selectedDeviceId}
                onChange={(e) => selectDevice(e.target.value)}
                disabled={!isTauri()}
                className="h-9 px-3 rounded-md bg-white/[0.05] border border-line text-[13px] text-ink focus:outline-none focus:border-line-strong disabled:opacity-50"
              >
                <option value="" className="bg-surface-elevated">
                  Windows default
                </option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id} className="bg-surface-elevated">
                    {d.name}
                    {d.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <div role="radiogroup" aria-label="Output mode" className="grid grid-cols-2 gap-3">
              {(
                [
                  ["shared", "Shared", "Plays alongside other apps. EQ is available."],
                  ["exclusive", "Exclusive", "Sonora takes over the device and sends the file untouched (bit-perfect). Other apps go silent; EQ is off."],
                ] as const
              ).map(([mode, label, body]) => (
                <button
                  key={mode}
                  role="radio"
                  aria-checked={outputMode === mode}
                  onClick={() => {
                    if (mode === "exclusive" && !exclusive && !exclusiveModeWarningDismissed) setConfirmExclusive(true);
                    else setOutputMode(mode);
                  }}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-colors",
                    outputMode === mode ? "border-signal bg-signal/[0.06]" : "border-line hover:border-line-strong"
                  )}
                >
                  <span className="flex items-center gap-2 text-[14px] font-semibold">
                    <span
                      className={cn(
                        "w-3.5 h-3.5 rounded-full border-2",
                        outputMode === mode ? "border-signal bg-signal shadow-[inset_0_0_0_2px_var(--color-surface)]" : "border-ink-3"
                      )}
                    />
                    {label}
                  </span>
                  <span className="block mt-1.5 text-[12px] text-ink-2 leading-relaxed">{body}</span>
                </button>
              ))}
            </div>

            {isTauri() && (
              <p className="text-[12px] text-ink-3 tnum">
                Now: {outputStatus.deviceName}, {(outputStatus.negotiatedSampleRate / 1000).toFixed(1)} kHz / {outputStatus.negotiatedBitDepth}-bit
                {outputStatus.isBitPerfect ? ", bit-perfect" : ""}
              </p>
            )}
          </div>
        </Group>

        <Group
          title="Equalizer"
          description={exclusive ? "Turned off while Exclusive output is on." : "Applies to your library and to streams. YouTube plays in its own player and isn't affected."}
          aside={<Switch checked={eqOn} disabled={exclusive} onChange={(v) => setDspBypass(!v)} label="Equalizer" />}
        >
          <div className={cn("transition-opacity", !eqOn && "opacity-40 pointer-events-none")}>
            <div className="flex flex-wrap gap-1 mb-6">
              {Object.keys(EQ_PRESETS)
                .filter((p) => p !== "Custom" || dspSettings.eqPreset === "Custom")
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => applyEqPreset(p)}
                    className={cn(
                      "h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors",
                      dspSettings.eqPreset === p ? "bg-ink text-bg" : "text-ink-2 hover:text-ink hover:bg-white/[0.06]"
                    )}
                  >
                    {p}
                  </button>
                ))}
            </div>

            <div className="flex items-stretch gap-6">
              <EqColumn label="Preamp" value={dspSettings.preampGainDb} onChange={setPreampGain} accent />
              <div className="w-px bg-line" />
              <div className="flex-1 grid grid-cols-10 gap-1">
                {EQ_FREQUENCIES.map((f, i) => (
                  <EqColumn key={f} label={f.replace("Hz", "")} value={dspSettings.eqBands[i]} onChange={(v) => setEqBand(i, v)} />
                ))}
              </div>
            </div>
            <div className="mt-4">
              <Button size="sm" variant="ghost" onClick={() => applyEqPreset("Flat")}>
                Reset to flat
              </Button>
            </div>
          </div>
        </Group>

        <Group title="Boost">
          <div className="max-w-xl">
            <BoostControls />
          </div>
        </Group>
      </div>

      <Dialog open={confirmExclusive} onClose={() => setConfirmExclusive(false)} title="Switch to Exclusive output?">
        <p className="text-[13px] text-ink-2 leading-relaxed pt-1">
          While Sonora plays a song from your library, other apps (browsers, calls, notifications) won't make any sound on this device.
          The equalizer turns off so the file reaches your DAC unchanged.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" onClick={() => setConfirmExclusive(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setExclusiveWarningDismissed(true);
              setOutputMode("exclusive");
              setConfirmExclusive(false);
            }}
          >
            Use Exclusive
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

const EqColumn: React.FC<{ label: string; value: number; onChange: (v: number) => void; accent?: boolean }> = ({
  label,
  value,
  onChange,
  accent,
}) => {
  // -12…+12 mapped to fill from the centre line
  const pct = ((value + 12) / 24) * 100;
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <span className="text-[11px] text-ink-2 tnum h-4">{value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}</span>
      <div className="relative h-40 w-8 flex justify-center">
        <div className="absolute top-1/2 left-1 right-1 h-px bg-line-strong" />
        <input
          type="range"
          min={-12}
          max={12}
          step={0.5}
          value={value}
          aria-label={`${label} gain`}
          onChange={(e) => onChange(Number(e.target.value))}
          onDoubleClick={() => onChange(0)}
          className="slider show-thumb"
          style={
            {
              writingMode: "vertical-lr",
              direction: "rtl",
              width: 4,
              height: "100%",
              background: `linear-gradient(to top, rgb(255 255 255 / 0.12) 0%, rgb(255 255 255 / 0.12) ${Math.min(pct, 50)}%, ${
                accent ? "var(--color-signal)" : "var(--color-ink)"
              } ${Math.min(pct, 50)}%, ${accent ? "var(--color-signal)" : "var(--color-ink)"} ${Math.max(pct, 50)}%, rgb(255 255 255 / 0.12) ${Math.max(
                pct,
                50
              )}%)`,
            } as React.CSSProperties
          }
        />
      </div>
      <span className={cn("text-[11px] truncate", accent ? "text-ink font-medium" : "text-ink-3")}>{label}</span>
    </div>
  );
};
