import { Track } from "../types/music";
import { usePlayerStore } from "../stores/playerStore";
import { TauriBridge } from "./tauriBridge";

class AudioEngineService {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: Track | null = null;
  private isInitialized = false;
  private ytIframe: HTMLIFrameElement | null = null;
  private ytPollTimer: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initAudioElement();
    }
  }

  private initAudioElement() {
    if (this.audio) return;
    this.audio = new Audio();
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
      console.warn("Audio element error:", e);
    });

    this.isInitialized = true;
  }

  public registerYouTubeIframe(iframe: HTMLIFrameElement | null) {
    this.ytIframe = iframe;
  }

  public async playTrack(track: Track) {
    this.currentTrack = track;
    this.initAudioElement();

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
