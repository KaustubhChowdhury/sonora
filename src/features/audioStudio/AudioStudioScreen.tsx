import React, { useState } from "react";
import {
  Sliders,
  ShieldCheck,
  Zap,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Cpu,
  Info,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import {
  useAudioStudioStore,
  EQ_FREQUENCIES,
  EQ_PRESETS,
} from "../../stores/audioStudioStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUiStore } from "../../stores/uiStore";
import { TauriBridge } from "../../services/tauriBridge";

export const AudioStudioScreen: React.FC = () => {
  const {
    devices,
    selectedDeviceId,
    outputMode,
    dspSettings,
    exclusiveModeWarningDismissed,
    underrunCount,
    estimatedLatencyMs,
    bufferSizeFrames,
    selectDevice,
    setOutputMode,
    setExclusiveWarningDismissed,
    setDspBypass,
    setPreampGain,
    setEqBand,
    applyEqPreset,
    setReplayGainMode,
    setCrossfadeSeconds,
    resetDiagnostics,
  } = useAudioStudioStore();

  const { currentTrack, outputStatus } = usePlayerStore();
  const { showToast } = useUiStore();

  const [showExclusiveModal, setShowExclusiveModal] = useState(false);

  const handleModeChange = (mode: "shared" | "exclusive") => {
    if (mode === "exclusive" && !exclusiveModeWarningDismissed) {
      setShowExclusiveModal(true);
    } else {
      setOutputMode(mode);
      TauriBridge.setOutputMode(mode);
      showToast(
        mode === "exclusive"
          ? "Switched to WASAPI Exclusive / Bit-Perfect Mode (DSP Bypassed)"
          : "Switched to Windows Shared Audio Mode"
      );
    }
  };

  const confirmExclusiveMode = () => {
    setExclusiveWarningDismissed(true);
    setShowExclusiveModal(false);
    setOutputMode("exclusive");
    TauriBridge.setOutputMode("exclusive");
    showToast("WASAPI Exclusive / Bit-Perfect mode engaged");
  };

  const handleDeviceChange = (deviceId: string) => {
    selectDevice(deviceId);
    TauriBridge.setAudioDevice(deviceId);
    showToast("Audio output endpoint switched");
  };

  const handleDspChange = () => {
    TauriBridge.setDspSettings(dspSettings);
  };

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 select-none max-w-5xl">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Audio Studio</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure direct WASAPI endpoint negotiation, bit-perfect delivery, and DSP processing.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {outputMode === "exclusive" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs font-mono font-semibold shadow-lg shadow-purple-950/30">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>BIT-PERFECT EXCLUSIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-white/10 text-zinc-300 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
              <span>SHARED WINDOWS MIXER</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: OUTPUT MODE & DEVICE SELECTION */}
      <section className="bg-surface-muted/50 rounded-3xl border border-white/[0.06] p-6 space-y-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>Output Path & Windows Endpoint</span>
        </h2>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shared Mode */}
          <div
            onClick={() => handleModeChange("shared")}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              outputMode === "shared"
                ? "bg-purple-950/20 border-purple-500/50 shadow-md ring-1 ring-purple-500/30"
                : "bg-surface-elevated/40 border-white/[0.05] hover:border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-white">Shared Mode (Default)</span>
              {outputMode === "shared" && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Standard Windows audio session. Mixes audio with YouTube, browsers, and Windows system notifications. Enables 10-band EQ, preamp gain, and ReplayGain.
            </p>
          </div>

          {/* Exclusive / Bit-Perfect Mode */}
          <div
            onClick={() => handleModeChange("exclusive")}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              outputMode === "exclusive"
                ? "bg-purple-950/40 border-purple-500/60 shadow-lg ring-1 ring-purple-500/50"
                : "bg-surface-elevated/40 border-white/[0.05] hover:border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-purple-200">
                  Exclusive / Bit-Perfect
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  Audiophile
                </span>
              </div>
              {outputMode === "exclusive" && <ShieldCheck className="w-4 h-4 text-purple-400" />}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bypasses the Windows audio engine mixer and hardware resampler. Sends decoded samples directly to your DAC. Automatically bypasses software EQ and DSP.
            </p>
          </div>
        </div>

        {/* Device selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Selected Audio Device (WASAPI Endpoint)
          </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full bg-surface-elevated border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
          >
            {devices.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name} {dev.isDefault ? "(Windows Default)" : ""}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono pt-1">
            <span>Supported Rates: 44.1k, 48k, 88.2k, 96k, 192k</span>
            <span>•</span>
            <span>Channels: {selectedDevice.channels} (Stereo)</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: 10-BAND GRAPHIC EQUALIZER & DSP CHAIN */}
      <section className="bg-surface-muted/50 rounded-3xl border border-white/[0.06] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>10-Band Graphic Equalizer &amp; DSP Chain</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Parametric IIR peaking filters with ±12 dB adjustment and preamp soft limiter.
            </p>
          </div>

          {/* Strict DSP Bypass switch */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-zinc-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={dspSettings.bypass || outputMode === "exclusive"}
                disabled={outputMode === "exclusive"}
                onChange={(e) => {
                  setDspBypass(e.target.checked);
                  handleDspChange();
                }}
                className="rounded bg-zinc-800 border-white/20 text-purple-600 focus:ring-0"
              />
              <span>Bypass DSP (Strict Pass-through)</span>
            </label>
          </div>
        </div>

        {outputMode === "exclusive" && (
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              DSP chain is automatically bypassed because Bit-Perfect Exclusive mode delivers exact source samples without modification.
            </span>
          </div>
        )}

        {/* EQ Presets Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <span className="text-zinc-500 uppercase font-mono text-[10px] shrink-0">Presets:</span>
          {Object.keys(EQ_PRESETS).map((preset) => (
            <button
              key={preset}
              disabled={dspSettings.bypass || outputMode === "exclusive"}
              onClick={() => {
                applyEqPreset(preset);
                handleDspChange();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 disabled:opacity-40 ${
                dspSettings.eqPreset === preset
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                  : "bg-surface-elevated/70 text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* 10 EQ Frequency Sliders */}
        <div
          className={`grid grid-cols-10 gap-2 pt-4 pb-2 ${
            dspSettings.bypass || outputMode === "exclusive" ? "opacity-30 pointer-events-none" : ""
          }`}
        >
          {EQ_FREQUENCIES.map((freq, idx) => {
            const gain = dspSettings.eqBands[idx] || 0;
            return (
              <div key={freq} className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-mono font-semibold text-zinc-300">
                  {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
                </span>
                <div className="h-36 flex items-center justify-center">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={gain}
                    onChange={(e) => {
                      setEqBand(idx, Number(e.target.value));
                      handleDspChange();
                    }}
                    style={{ writingMode: "vertical-lr", direction: "rtl" }}
                    className="h-32 appearance-none bg-zinc-800 rounded-lg cursor-pointer accent-purple-400 w-1.5"
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{freq}</span>
              </div>
            );
          })}
        </div>

        {/* Preamp, ReplayGain & Crossfade settings */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/[0.06] ${
            dspSettings.bypass || outputMode === "exclusive" ? "opacity-30 pointer-events-none" : ""
          }`}
        >
          {/* Preamp Gain */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-400">Preamp Gain</span>
              <span className="font-mono text-zinc-200">
                {dspSettings.preampGainDb > 0 ? `+${dspSettings.preampGainDb} dB` : `${dspSettings.preampGainDb} dB`}
              </span>
            </div>
            <input
              type="range"
              min={-12}
              max={12}
              step={0.5}
              value={dspSettings.preampGainDb}
              onChange={(e) => {
                setPreampGain(Number(e.target.value));
                handleDspChange();
              }}
              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-400"
            />
          </div>

          {/* ReplayGain Mode */}
          <div className="space-y-2">
            <span className="font-semibold text-zinc-400 text-xs block">ReplayGain Normalisation</span>
            <select
              value={dspSettings.replayGainMode}
              onChange={(e) => {
                setReplayGainMode(e.target.value as any);
                handleDspChange();
              }}
              className="w-full bg-surface-elevated border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="off">Disabled</option>
              <option value="track">Track Gain (-14 LUFS)</option>
              <option value="album">Album Gain (Preserve Dynamics)</option>
            </select>
          </div>

          {/* Crossfade */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-400">Track Crossfade</span>
              <span className="font-mono text-zinc-200">
                {dspSettings.crossfadeSeconds === 0 ? "Off (Gapless)" : `${dspSettings.crossfadeSeconds}s`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={dspSettings.crossfadeSeconds}
              onChange={(e) => {
                setCrossfadeSeconds(Number(e.target.value));
                handleDspChange();
              }}
              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-400"
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: AUDIO DIAGNOSTICS & TELEMETRY */}
      <section className="bg-surface-muted/50 rounded-3xl border border-white/[0.06] p-6 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Audio Engine Diagnostics</span>
          </h2>

          <button
            onClick={resetDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Counters</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-elevated/60 p-3.5 rounded-xl border border-white/[0.04]">
            <p className="text-zinc-500 text-[10px] uppercase">Buffer Underruns</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">{underrunCount}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Glitch-free performance</p>
          </div>

          <div className="bg-surface-elevated/60 p-3.5 rounded-xl border border-white/[0.04]">
            <p className="text-zinc-500 text-[10px] uppercase">Estimated Latency</p>
            <p className="text-lg font-bold text-zinc-200 mt-1">{estimatedLatencyMs.toFixed(1)} ms</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">WASAPI stream buffer</p>
          </div>

          <div className="bg-surface-elevated/60 p-3.5 rounded-xl border border-white/[0.04]">
            <p className="text-zinc-500 text-[10px] uppercase">Negotiated Format</p>
            <p className="text-lg font-bold text-zinc-200 mt-1">
              {outputStatus.negotiatedSampleRate}Hz / {outputStatus.negotiatedBitDepth}b
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Endpoint DAC resolution</p>
          </div>

          <div className="bg-surface-elevated/60 p-3.5 rounded-xl border border-white/[0.04]">
            <p className="text-zinc-500 text-[10px] uppercase">Ring Buffer Size</p>
            <p className="text-lg font-bold text-zinc-200 mt-1">{bufferSizeFrames} frames</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Lock-free SPSC buffer</p>
          </div>
        </div>
      </section>

      {/* EXCLUSIVE MODE WARNING MODAL */}
      {showExclusiveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-elevated max-w-md w-full p-6 rounded-3xl border border-purple-500/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-purple-400">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <h3 className="font-bold text-white text-base">Enable WASAPI Exclusive Mode?</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              WASAPI Exclusive mode grants Sonora exclusive hardware ownership of your audio output device to deliver bit-perfect audio directly to your DAC.
            </p>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-200 space-y-1">
              <p>• System sounds and other applications will be muted while playing.</p>
              <p>• Software volume, EQ, and ReplayGain will be automatically bypassed.</p>
              <p>• If the device is disconnected or in use by another app, Sonora will safely revert to Shared mode.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowExclusiveModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmExclusiveMode}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-colors"
              >
                Enable Bit-Perfect Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
