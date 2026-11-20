import { Track } from "../types/music";
import { usePlayerStore } from "../stores/playerStore";
import { useAudioStudioStore } from "../stores/audioStudioStore";
import { useUiStore } from "../stores/uiStore";
import { TauriBridge, isTauri } from "./tauriBridge";

/**
 * Routes playback to one of three backends:
 *  - "native":  local files inside the desktop app go to the Rust engine (WASAPI, DSP, bit-perfect).
 *  - "html":    HTTP streams play through an <audio> element, routed through Web Audio for the booster.
 *  - "youtube": YouTube tracks play in the embedded iframe player.
 */
type Backend = "native" | "html" | "youtube" | "none";

const isYouTube = (t: Track) => t.providerId === "youtube" || Boolean(t.youtubeVideoId);

class AudioEngineService {
  private backend: Backend = "none";
  private currentTrack: Track | null = null;

  /** CORS-enabled element wired into the Web Audio booster graph. */
  private audio: HTMLAudioElement | null = null;
  /** Plain element used when a stream host refuses CORS (booster can't apply there). */
  private plainAudio: HTMLAudioElement | null = null;
  private active: HTMLAudioElement | null = null;

  private ytIframe: HTMLIFrameElement | null = null;
  private ytTimer: ReturnType<typeof setInterval> | null = null;
  private nativeTimer: ReturnType<typeof setInterval> | null = null;
  private nativeWasPlaying = false;

  private audioCtx: AudioContext | null = null;
  private bassNode: BiquadFilterNode | null = null;
  private clarityNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private eqNodes: BiquadFilterNode[] = [];
  private preampNode: GainNode | null = null;

  // ---------- element setup ----------

  private makeElement(cors: boolean): HTMLAudioElement {
    const el = new Audio();
    if (cors) el.crossOrigin = "anonymous";
    el.preload = "auto";

    el.addEventListener("timeupdate", () => {
      if (el === this.active && !el.paused) {
        usePlayerStore.getState().setCurrentTime(Math.floor(el.currentTime * 1000));
      }
    });
    el.addEventListener("loadedmetadata", () => {
      if (el === this.active && Number.isFinite(el.duration)) {
        usePlayerStore.getState().setDuration(Math.floor(el.duration * 1000));
      }
    });
    el.addEventListener("ended", () => {
      if (el === this.active) usePlayerStore.getState().nextTrack();
    });
    el.addEventListener("error", () => {
      if (el === this.active) this.handleHtmlError(el);
    });
    return el;
  }

  private ensureElements() {
    if (!this.audio) this.audio = this.makeElement(true);
    if (!this.plainAudio) this.plainAudio = this.makeElement(false);
  }

  private ensureWebAudio() {
    if (this.audioCtx || !this.audio) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      const source = ctx.createMediaElementSource(this.audio);

      // 10-band graphic EQ + preamp, same bands as the native engine
      this.eqNodes = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000].map((f) => {
        const n = ctx.createBiquadFilter();
        n.type = "peaking";
        n.frequency.value = f;
        n.Q.value = 1.41;
        return n;
      });
      this.preampNode = ctx.createGain();

      this.bassNode = ctx.createBiquadFilter();
      this.bassNode.type = "lowshelf";
      this.bassNode.frequency.value = 85;

      this.clarityNode = ctx.createBiquadFilter();
      this.clarityNode.type = "highshelf";
      this.clarityNode.frequency.value = 5500;

      this.gainNode = ctx.createGain();

      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -1;
      limiter.knee.value = 4;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.1;

      let node: AudioNode = source;
      for (const eq of this.eqNodes) node = node.connect(eq);
      node.connect(this.preampNode).connect(this.bassNode).connect(this.clarityNode).connect(this.gainNode).connect(limiter).connect(ctx.destination);
      this.audioCtx = ctx;
      this.updateEq();
    } catch (err) {
      console.warn("Web Audio unavailable, booster disabled:", err);
    }
  }

  private resumeCtx() {
    if (this.audioCtx?.state === "suspended") this.audioCtx.resume().catch(() => {});
  }

  private stopAll() {
    for (const el of [this.audio, this.plainAudio]) {
      if (el) {
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
    }
    this.active = null;
    if (this.ytTimer) clearInterval(this.ytTimer);
    this.ytTimer = null;
    if (this.ytIframe && this.ytIframe.src !== "about:blank") this.ytIframe.src = "about:blank";
    if (this.nativeTimer) clearInterval(this.nativeTimer);
    this.nativeTimer = null;
    if (this.backend === "native") TauriBridge.stop();
  }

  private effectiveVolume() {
    const { volume, isMuted } = usePlayerStore.getState();
    return isMuted ? 0 : volume;
  }

  private fail(message: string) {
    usePlayerStore.setState({ isPlaying: false });
    useUiStore.getState().showToast(message);
  }

  // ---------- public API ----------

  public registerYouTubeIframe(iframe: HTMLIFrameElement | null) {
    this.ytIframe = iframe;
  }

  public updateBooster(enabled: boolean, preampDb: number, bassDb: number, clarityDb: number) {
    if (enabled) {
      this.ensureElements();
      this.ensureWebAudio();
      this.resumeCtx();
    }
    if (this.bassNode) this.bassNode.gain.value = enabled ? bassDb : 0;
    if (this.clarityNode) this.clarityNode.gain.value = enabled ? clarityDb : 0;
    if (this.gainNode) this.gainNode.gain.value = enabled ? Math.pow(10, preampDb / 20) : 1;
  }

  /** Applies the Sound page's EQ and preamp to streamed audio. */
  public updateEq() {
    const { dspSettings: d, outputMode } = useAudioStudioStore.getState();
    const off = d.bypass || outputMode === "exclusive";
    this.eqNodes.forEach((n, i) => (n.gain.value = off ? 0 : d.eqBands[i] ?? 0));
    if (this.preampNode) this.preampNode.gain.value = off ? 1 : Math.pow(10, d.preampGainDb / 20);
  }

  public async playTrack(track: Track) {
    this.stopAll();
    this.currentTrack = track;

    if (isYouTube(track)) {
      this.backend = "youtube";
      this.playYouTube(track.youtubeVideoId || track.providerTrackId || "");
      return;
    }

    if (track.path && !track.streamUrl && isTauri()) {
      this.backend = "native";
      await TauriBridge.setVolume(this.effectiveVolume());
      await TauriBridge.play(track.path);
      this.startNativePolling();
      return;
    }

    const url = track.streamUrl;
    if (!url) {
      this.backend = "none";
      this.fail(
        track.path
          ? "Local files play in the desktop app. Run Sonora with `npm run tauri dev`."
          : `“${track.title}” has no audio source.`
      );
      return;
    }

    this.backend = "html";
    this.ensureElements();
    this.ensureWebAudio();
    this.resumeCtx();
    const { boosterSettings: b } = useAudioStudioStore.getState();
    this.updateBooster(b.enabled, b.preampBoostDb, b.bassBoostDb, b.clarityBoostDb);
    await this.playOn(this.audio!, url);
  }

  private async playOn(el: HTMLAudioElement, url: string) {
    this.active = el;
    el.src = url;
    el.volume = this.effectiveVolume();
    try {
      await el.play();
    } catch (err: any) {
      // AbortError just means another track was requested before this one started.
      if (err?.name !== "AbortError" && el === this.active) this.handleHtmlError(el);
    }
  }

  private handleHtmlError(el: HTMLAudioElement) {
    const track = this.currentTrack;
    if (!track?.streamUrl) return;
    const url = track.streamUrl;

    // Host refused CORS: retry on the plain element (booster won't apply to this track).
    if (el === this.audio) {
      this.playOn(this.plainAudio!, url);
      return;
    }

    // JioSaavn: step down the bitrate before giving up.
    const steps: [string, string][] = [
      ["_320.mp4", "_160.mp4"],
      ["_160.mp4", "_96.mp4"],
    ];
    for (const [from, to] of steps) {
      if (url.includes(from)) {
        track.streamUrl = url.replace(from, to);
        this.playOn(this.audio!, track.streamUrl);
        return;
      }
    }
    this.fail(`Couldn't play “${track.title}”. The stream may have expired — search for it again.`);
  }

  public pause() {
    switch (this.backend) {
      case "youtube":
        this.ytCommand("pauseVideo");
        break;
      case "native":
        TauriBridge.pause();
        break;
      case "html":
        this.active?.pause();
        break;
    }
  }

  public resume() {
    this.resumeCtx();
    switch (this.backend) {
      case "youtube":
        this.ytCommand("playVideo");
        break;
      case "native":
        TauriBridge.resume();
        break;
      case "html":
        this.active?.play().catch(() => {});
        break;
      case "none": {
        const t = usePlayerStore.getState().currentTrack;
        if (t) this.playTrack(t);
        break;
      }
    }
  }

  public seek(timeMs: number) {
    switch (this.backend) {
      case "youtube":
        this.ytCommand("seekTo", [timeMs / 1000, true]);
        break;
      case "native":
        TauriBridge.seek(timeMs);
        break;
      case "html":
        if (this.active) this.active.currentTime = timeMs / 1000;
        break;
    }
  }

  public setVolume(volume: number) {
    const v = Math.max(0, Math.min(1, volume));
    if (this.audio) this.audio.volume = v;
    if (this.plainAudio) this.plainAudio.volume = v;
    if (this.backend === "native") TauriBridge.setVolume(v);
    if (this.backend === "youtube") this.ytCommand("setVolume", [Math.round(v * 100)]);
  }

  // ---------- native engine ----------

  private startNativePolling() {
    this.nativeWasPlaying = false;
    this.nativeTimer = setInterval(async () => {
      if (this.backend !== "native") return;
      const pos = await TauriBridge.getEnginePosition();
      if (!pos) return;
      const store = usePlayerStore.getState();
      if (pos.durationMs > 0 && pos.durationMs !== store.durationMs) store.setDuration(pos.durationMs);
      if (pos.isPlaying) {
        this.nativeWasPlaying = true;
        store.setCurrentTime(pos.positionMs);
      } else if (this.nativeWasPlaying && store.isPlaying && pos.durationMs > 0 && pos.positionMs >= pos.durationMs - 750) {
        // Engine stopped on its own at the end of the file.
        this.nativeWasPlaying = false;
        store.nextTrack();
      }
    }, 250);
  }

  // ---------- YouTube ----------

  private playYouTube(videoId: string) {
    if (!videoId) {
      this.fail("This YouTube result has no video ID.");
      return;
    }
    if (this.ytIframe) {
      this.ytIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
        window.location.origin
      )}`;
    }
    // The embed doesn't report position without the full IFrame API, so the clock runs locally.
    // It reads from the store each tick so seeking and pausing stay in step.
    this.ytTimer = setInterval(() => {
      const s = usePlayerStore.getState();
      if (!s.isPlaying || this.backend !== "youtube") return;
      const next = s.currentTimeMs + 500;
      if (s.durationMs > 0 && next >= s.durationMs) s.nextTrack();
      else s.setCurrentTime(next);
    }, 500);
  }

  private ytCommand(func: string, args: unknown[] = []) {
    this.ytIframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }
}

export const AudioEngine = new AudioEngineService();

if (typeof window !== "undefined") {
  // Push sound settings to the engines whenever they change, and once at startup
  // so saved settings (EQ, output mode, device) are applied before the first song.
  let dspTimer: ReturnType<typeof setTimeout> | null = null;
  useAudioStudioStore.subscribe((state, prev) => {
    if (state.boosterSettings !== prev.boosterSettings) {
      const b = state.boosterSettings;
      AudioEngine.updateBooster(b.enabled, b.preampBoostDb, b.bassBoostDb, b.clarityBoostDb);
    }
    if (state.dspSettings !== prev.dspSettings) {
      // EQ sliders fire continuously while dragging; send at most every 60 ms.
      if (dspTimer) clearTimeout(dspTimer);
      AudioEngine.updateEq();
      dspTimer = setTimeout(() => TauriBridge.setDspSettings(useAudioStudioStore.getState().dspSettings), 60);
    }
    if (state.outputMode !== prev.outputMode) TauriBridge.setOutputMode(state.outputMode);
    if (state.selectedDeviceId !== prev.selectedDeviceId && state.selectedDeviceId) TauriBridge.setAudioDevice(state.selectedDeviceId);
  });

  if (isTauri()) {
    const s = useAudioStudioStore.getState();
    TauriBridge.setDspSettings(s.dspSettings);
    TauriBridge.setOutputMode(s.outputMode);
    if (s.selectedDeviceId) TauriBridge.setAudioDevice(s.selectedDeviceId);
  }
}
