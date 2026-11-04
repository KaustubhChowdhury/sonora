import { Track } from "../types/music";
import { usePlayerStore } from "../stores/playerStore";
import { useAudioStudioStore } from "../stores/audioStudioStore";
import { TauriBridge } from "./tauriBridge";

class AudioEngineService {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: Track | null = null;
  private isInitialized = false;
  private ytIframe: HTMLIFrameElement | null = null;
  private ytPollTimer: any = null;

  // Web Audio Booster Nodes
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private bassBoostNode: BiquadFilterNode | null = null;
  private clarityNode: BiquadFilterNode | null = null;
  private boosterGainNode: GainNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initAudioElement();
    }
  }

  private initWebAudio() {
    if (this.audioCtx || !this.audio) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);

      this.bassBoostNode = this.audioCtx.createBiquadFilter();
      this.bassBoostNode.type = "lowshelf";
      this.bassBoostNode.frequency.value = 85;
      this.bassBoostNode.gain.value = 0;

      this.clarityNode = this.audioCtx.createBiquadFilter();
      this.clarityNode.type = "highshelf";
      this.clarityNode.frequency.value = 5500;
      this.clarityNode.gain.value = 0;

      this.boosterGainNode = this.audioCtx.createGain();
      this.boosterGainNode.gain.value = 1.0;

      this.limiterNode = this.audioCtx.createDynamicsCompressor();
      this.limiterNode.threshold.value = -1.0;
      this.limiterNode.knee.value = 4.0;
      this.limiterNode.ratio.value = 20.0;
      this.limiterNode.attack.value = 0.002;
      this.limiterNode.release.value = 0.1;

      this.sourceNode
        .connect(this.bassBoostNode)
        .connect(this.clarityNode)
        .connect(this.boosterGainNode)
        .connect(this.limiterNode)
        .connect(this.audioCtx.destination);
    } catch (err) {
      console.warn("Web Audio API initialization note:", err);
    }
  }

  public updateBooster(enabled: boolean, preampDb: number, bassDb: number, clarityDb: number) {
    this.initAudioElement();
    this.initWebAudio();
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(console.warn);
    }
    if (this.bassBoostNode) {
      this.bassBoostNode.gain.value = enabled ? bassDb : 0;
    }
    if (this.clarityNode) {
      this.clarityNode.gain.value = enabled ? clarityDb : 0;
    }
    if (this.boosterGainNode) {
      const linear = enabled ? Math.pow(10, preampDb / 20) : 1.0;
      this.boosterGainNode.gain.value = linear;
    }
  }

  private initAudioElement() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
    this.audio.preload = "auto";

    // Playback events
    this.audio.addEventListener("timeupdate", () => {
      if (this.audio && !this.audio.paused) {
        const timeMs = Math.floor(this.audio.currentTime * 1000);
        usePlayerStore.getState().setCurrentTime(timeMs);
      }
    });

    this.audio.addEventListener("loadedmetadata", () => {
      if (this.audio && this.audio.duration && !isNaN(this.audio.duration)) {
        const durMs = Math.floor(this.audio.duration * 1000);
        usePlayerStore.getState().setDuration(durMs);
      }
    });

    this.audio.addEventListener("ended", () => {
      usePlayerStore.getState().nextTrack();
    });

    this.audio.addEventListener("error", (e) => {
      console.warn("Audio element playback error:", e);
      if (this.currentTrack?.streamUrl) {
        if (this.currentTrack.streamUrl.includes("_320.mp4")) {
          const fallback = this.currentTrack.streamUrl.replace("_320.mp4", "_160.mp4");
          console.log("[AudioEngine] 320kbps fallback -> 160kbps:", fallback);
          this.currentTrack.streamUrl = fallback;
          if (this.audio) {
            this.audio.src = fallback;
            this.audio.play().catch(console.warn);
          }
        } else if (this.currentTrack.streamUrl.includes("_160.mp4")) {
          const fallback = this.currentTrack.streamUrl.replace("_160.mp4", "_96.mp4");
          console.log("[AudioEngine] 160kbps fallback -> 96kbps:", fallback);
          this.currentTrack.streamUrl = fallback;
          if (this.audio) {
            this.audio.src = fallback;
            this.audio.play().catch(console.warn);
          }
        }
      }
    });

    this.isInitialized = true;
  }

  public registerYouTubeIframe(iframe: HTMLIFrameElement | null) {
    this.ytIframe = iframe;
  }

  public async playTrack(track: Track) {
    this.currentTrack = track;
    this.initAudioElement();
    this.initWebAudio();
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(console.warn);
    }

    // Immediately apply current booster settings to the new track
    try {
      const { boosterSettings } = useAudioStudioStore.getState();
      this.updateBooster(
        boosterSettings.enabled,
        boosterSettings.preampBoostDb,
        boosterSettings.bassBoostDb,
        boosterSettings.clarityBoostDb
      );
    } catch (e) {
      console.warn("Booster state sync:", e);
    }

    // If it's a YouTube track
    if (track.providerId === "youtube" || track.youtubeVideoId) {
      if (this.audio) {
        this.audio.pause();
        this.audio.src = "";
      }
      this.playYouTubeVideo(track.youtubeVideoId || track.providerTrackId || "");
      return;
    }

    // Stop YouTube video if playing
    this.stopYouTubeVideo();

    // Stream URL or file path
    const audioUrl = track.streamUrl || track.path;
    if (!audioUrl) {
      console.warn("No audio stream or path for track:", track);
      return;
    }

    if (this.audio) {
      try {
        this.audio.crossOrigin = "anonymous";
        this.audio.src = audioUrl;
        this.audio.volume = usePlayerStore.getState().volume;
        await this.audio.play();
      } catch (err) {
        console.error("HTML5 Audio play failed:", err);
      }
    }
  }

  public pause() {
    if (this.currentTrack?.providerId === "youtube" || this.currentTrack?.youtubeVideoId) {
      this.sendYouTubeCommand("pauseVideo");
    } else if (this.audio) {
      this.audio.pause();
    }
  }

  public resume() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(console.warn);
    }
    if (this.currentTrack?.providerId === "youtube" || this.currentTrack?.youtubeVideoId) {
      this.sendYouTubeCommand("playVideo");
    } else if (this.audio) {
      this.audio.play().catch((err) => console.warn("Resume failed:", err));
    }
  }

  public seek(timeMs: number) {
    const timeSec = timeMs / 1000;
    if (this.currentTrack?.providerId === "youtube" || this.currentTrack?.youtubeVideoId) {
      this.sendYouTubeCommand("seekTo", [timeSec, true]);
    } else if (this.audio) {
      this.audio.currentTime = timeSec;
    }
  }

  public setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
    if (this.currentTrack?.providerId === "youtube" || this.currentTrack?.youtubeVideoId) {
      this.sendYouTubeCommand("setVolume", [Math.round(volume * 100)]);
    }
  }

  private playYouTubeVideo(videoId: string) {
    if (!videoId) return;
    if (this.ytIframe) {
      this.ytIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
        window.location.origin
      )}`;
    }

    // Start synthetic time ticker for YouTube if needed
    if (this.ytPollTimer) clearInterval(this.ytPollTimer);
    let ytSec = 0;
    this.ytPollTimer = setInterval(() => {
      const state = usePlayerStore.getState();
      if (state.isPlaying && state.currentTrack?.providerId === "youtube") {
        ytSec += 0.5;
        const ms = ytSec * 1000;
        if (ms >= state.durationMs && state.durationMs > 0) {
          clearInterval(this.ytPollTimer);
          state.nextTrack();
        } else {
          state.setCurrentTime(ms);
        }
      }
    }, 500);
  }

  private stopYouTubeVideo() {
    if (this.ytPollTimer) {
      clearInterval(this.ytPollTimer);
      this.ytPollTimer = null;
    }
    if (this.ytIframe) {
      this.ytIframe.src = "about:blank";
    }
  }

  private sendYouTubeCommand(func: string, args: any[] = []) {
    if (this.ytIframe && this.ytIframe.contentWindow) {
      this.ytIframe.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func,
          args,
        }),
        "*"
      );
    }
  }
}

export const AudioEngine = new AudioEngineService();

// Subscribe to AudioStudio store so any booster change (presets, sliders, toggle) applies instantaneously in real time
if (typeof window !== "undefined") {
  useAudioStudioStore.subscribe((state) => {
    AudioEngine.updateBooster(
      state.boosterSettings.enabled,
      state.boosterSettings.preampBoostDb,
      state.boosterSettings.bassBoostDb,
      state.boosterSettings.clarityBoostDb
    );
  });
}
