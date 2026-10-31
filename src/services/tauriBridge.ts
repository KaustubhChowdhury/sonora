import { invoke } from "@tauri-apps/api/core";
import { Track, SourceKind, AudioDevice, AudioOutputStatus, DspSettings, LyricsData, FolderScanStatus } from "../types/music";

export const isTauri = () => {
  return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
};

// Initial built-in audiophile demo catalogue for immediate testing and listening
export const SAMPLE_AUDIO_TRACKS: Track[] = [
  {
    id: "sample-1",
    title: "Celestial Architecture (Acoustic Master)",
    artists: ["Aethelgard Chamber Ensemble"],
    album: "Resonance in Monochrome",
    albumId: "album-resonance",
    durationMs: 274000,
    sourceKind: "local",
    providerId: "local",
    codec: "FLAC",
    sampleRate: 96000,
    bitDepth: 24,
    channels: 2,
    bitrate: 2822,
    fileSize: 96800000,
    year: 2025,
    genre: "Neoclassical / Ambient",
    trackNumber: 1,
    discNumber: 1,
    isFavourite: true,
    artworkUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    downloadAllowed: true,
  },
  {
    id: "sample-2",
    title: "Subterranean Pulse (Modular Synthesis)",
    artists: ["Kuroshio"],
    album: "Vapour & Iron",
    albumId: "album-vapour",
    durationMs: 341000,
    sourceKind: "local",
    providerId: "local",
    codec: "WAV",
    sampleRate: 192000,
    bitDepth: 24,
    channels: 2,
    bitrate: 9216,
    fileSize: 393000000,
    year: 2026,
    genre: "Minimal Techno / Modular",
    trackNumber: 2,
    discNumber: 1,
    isFavourite: false,
    artworkUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    downloadAllowed: true,
  },
  {
    id: "sample-3",
    title: "Midnight Blue (Live at Blue Note Tokyo)",
    artists: ["Takeshi Morita Quartet"],
    album: "Tokyo Sessions",
    albumId: "album-tokyo-sessions",
    durationMs: 395000,
    sourceKind: "local",
    providerId: "local",
    codec: "FLAC",
    sampleRate: 88200,
    bitDepth: 24,
    channels: 2,
    bitrate: 2510,
    fileSize: 124000000,
    year: 2024,
    genre: "Post-Bop Jazz",
    trackNumber: 4,
    discNumber: 1,
    isFavourite: true,
    artworkUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80",
    downloadAllowed: true,
  },
  {
    id: "sample-4",
    title: "Nordic Frost (Symphonic Poem)",
    artists: ["Bergen Philharmonic", "Elin Solberg"],
    album: "Glacial Horizons",
    albumId: "album-glacial",
    durationMs: 482000,
    sourceKind: "local",
    providerId: "local",
    codec: "ALAC",
    sampleRate: 48000,
    bitDepth: 24,
    channels: 2,
    bitrate: 1450,
    fileSize: 87000000,
    year: 2025,
    genre: "Classical / Orchestral",
    trackNumber: 1,
    discNumber: 1,
    isFavourite: false,
    artworkUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=800&auto=format&fit=crop&q=80",
    downloadAllowed: true,
  },
  {
    id: "sample-5",
    title: "Ephemeral Echoes",
    artists: ["Starlight Project"],
    album: "Open Horizons (CC Discovery)",
    albumId: "album-open-horizons",
    durationMs: 215000,
    sourceKind: "stream",
    providerId: "jamendo",
    providerTrackId: "189201",
    codec: "MP3",
    sampleRate: 44100,
    bitDepth: 16,
    channels: 2,
    bitrate: 320,
    year: 2024,
    genre: "Indie Pop",
    artworkUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    attribution: "CC BY-SA 3.0 via Jamendo - Starlight Project",
    downloadAllowed: false,
    cachingAllowed: false,
  },
];

export class TauriBridge {
  static async play(path: string): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("play_track", { path });
      } catch (err) {
        console.error("Tauri play_track failed:", err);
      }
    } else {
      console.log("[Mock Audio] play:", path);
    }
  }

  static async pause(): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("pause_playback");
      } catch (err) {
        console.error("Tauri pause failed:", err);
      }
    }
  }

  static async resume(): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("resume_playback");
      } catch (err) {
        console.error("Tauri resume failed:", err);
      }
    }
  }

  static async seek(timeMs: number): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("seek_playback", { timeMs });
      } catch (err) {
        console.error("Tauri seek failed:", err);
      }
    }
  }

  static async stop(): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("stop_playback");
      } catch (err) {
        console.error("Tauri stop failed:", err);
      }
    }
  }

  static async setVolume(volume: number): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("set_volume", { volume });
      } catch (err) {
        console.error("Tauri set_volume failed:", err);
      }
    }
  }

  static async setOutputMode(mode: string): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("set_output_mode", { mode });
      } catch (err) {
        console.error("Tauri set_output_mode failed:", err);
      }
    }
  }

  static async setAudioDevice(deviceId: string): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("set_audio_device", { deviceId });
      } catch (err) {
        console.error("Tauri set_audio_device failed:", err);
      }
    }
  }

  static async setDspSettings(settings: DspSettings): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("set_dsp_settings", {
          config: {
            bypass: settings.bypass,
            preamp_gain_db: settings.preampGainDb,
            eq_bands: settings.eqBands,
            eq_preset: settings.eqPreset,
            replay_gain_mode: settings.replayGainMode,
            crossfade_seconds: settings.crossfadeSeconds,
          },
        });
      } catch (err) {
        console.error("Tauri set_dsp_settings failed:", err);
      }
    }
  }

  static async getPlaybackStatus(): Promise<AudioOutputStatus | null> {
    if (isTauri()) {
      try {
        const raw = await invoke<any>("get_playback_status");
        return {
          mode: raw.output_mode as any,
          deviceName: raw.device_name,
          negotiatedSampleRate: raw.sample_rate,
          negotiatedBitDepth: raw.bit_depth || 24,
          negotiatedChannels: raw.channels,
          isBitPerfect: raw.is_bit_perfect,
          dspBypassed: raw.dsp_bypassed,
          underrunCount: raw.underrun_count,
        };
      } catch {
        return null;
      }
    }
    return null;
  }

  static async getAudioDevices(): Promise<AudioDevice[]> {
    if (isTauri()) {
      try {
        const devs = await invoke<any[]>("get_audio_devices");
        return devs.map((d) => ({
          id: d.id,
          name: d.name,
          isDefault: d.is_default,
          sampleRates: d.sample_rates,
          channels: d.channels,
          exclusiveSupported: d.exclusive_supported,
        }));
      } catch {
        return [];
      }
    }
    return [
      {
        id: "default-wasapi",
        name: "Realtek High Definition Audio (Default WASAPI)",
        isDefault: true,
        sampleRates: [44100, 48000, 96000, 192000],
        channels: 2,
        exclusiveSupported: true,
      },
    ];
  }

  static async scanFolder(folderPath: string): Promise<FolderScanStatus> {
    if (isTauri()) {
      try {
        const res = await invoke<any>("scan_library_folder", { folderPath });
        return {
          isScanning: false,
          currentFolder: folderPath,
          scannedFiles: res.total_scanned,
          totalCandidates: res.candidates_found,
          errorCount: res.errors?.length || 0,
          errors: res.errors || [],
        };
      } catch (err) {
        return {
          isScanning: false,
          currentFolder: folderPath,
          scannedFiles: 0,
          totalCandidates: 0,
          errorCount: 1,
          errors: [String(err)],
        };
      }
    }
    return {
      isScanning: false,
      currentFolder: folderPath,
      scannedFiles: 24,
      totalCandidates: 24,
      errorCount: 0,
      errors: [],
    };
  }

  static async getLibraryTracks(): Promise<Track[]> {
    if (isTauri()) {
      try {
        const rawTracks = await invoke<any[]>("get_library_tracks");
        if (rawTracks && rawTracks.length > 0) {
          return rawTracks.map((r) => ({
            id: r.id,
            title: r.title,
            artists: [r.artist],
            album: r.album,
            durationMs: r.duration_ms,
            path: r.path,
            sourceKind: r.source_kind as any,
            providerId: r.provider_id,
            providerTrackId: r.provider_track_id,
            codec: r.codec,
            sampleRate: r.sample_rate,
            bitDepth: r.bit_depth,
            channels: r.channels,
            bitrate: r.bitrate,
            fileSize: r.file_size,
            year: r.year,
            genre: r.genre,
            trackNumber: r.track_number,
            discNumber: r.disc_number,
            artworkUrl: r.artwork_url,
            licenseUrl: r.license_url,
            attribution: r.attribution,
            downloadAllowed: r.download_allowed,
            isFavourite: r.is_favourite,
          }));
        }
      } catch (err) {
        console.error("Failed to load tracks from SQLite:", err);
      }
    }
    return SAMPLE_AUDIO_TRACKS;
  }

  static async getLibraryFolders(): Promise<string[]> {
    if (isTauri()) {
      try {
        return await invoke<string[]>("get_library_folders");
      } catch {
        return [];
      }
    }
    return ["C:\\Users\\Music\\Lossless Vault", "E:\\Audio Masters"];
  }

  static async toggleFavourite(trackId: string, isFav: boolean): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("toggle_favourite", { trackId, isFavourite: isFav });
      } catch (err) {
        console.error("toggle_favourite failed:", err);
      }
    }
  }

  static async fetchLyrics(
    trackPath?: string,
    title?: string,
    artist?: string,
    album?: string,
    durationS?: number
  ): Promise<LyricsData> {
    if (isTauri()) {
      try {
        const res = await invoke<any>("fetch_lyrics", {
          trackPath: trackPath || null,
          title: title || "",
          artist: artist || "",
          album: album || null,
          durationS: durationS || null,
        });
        return {
          source: res.source,
          isSynced: res.is_synced,
          plainText: res.plain_text,
          syncedLines: res.synced_lines?.map((l: any) => ({
            timeMs: l.time_ms,
            text: l.text,
          })),
        };
      } catch (err) {
        console.error("fetch_lyrics failed:", err);
      }
    }

    // High quality demo timed lyrics for the ambient master track
    return {
      source: "embedded",
      isSynced: true,
      syncedLines: [
        { timeMs: 4000, text: "A resonant stillness descending over the valley" },
        { timeMs: 14000, text: "Strings breathing into the cool mountain air" },
        { timeMs: 28000, text: "Echoes of wood and bow vibrating in unison" },
        { timeMs: 46000, text: "Harmonics rising through the morning mist" },
        { timeMs: 68000, text: "Each note suspended in pristine space" },
        { timeMs: 92000, text: "The cellos take the ancient theme" },
        { timeMs: 120000, text: "Deep resonance vibrating through the timber" },
        { timeMs: 154000, text: "A quiet cadence returns to silence" },
      ],
    };
  }

  static async searchJamendo(query: string, limit = 20): Promise<Track[]> {
    if (isTauri()) {
      try {
        const items = await invoke<any[]>("search_jamendo", { query, limit });
        return items.map((item) => ({
          id: item.id,
          title: item.name,
          artists: [item.artist_name],
          album: item.album_name || "Jamendo Release",
          durationMs: (item.duration || 180) * 1000,
          sourceKind: "stream" as SourceKind,
          providerId: "jamendo",
          providerTrackId: item.id,
          streamUrl: item.audio,
          codec: "MP3",
          sampleRate: 44100,
          bitDepth: 16,
          bitrate: 320,
          channels: 2,
          artworkUrl: item.image,
          licenseUrl: item.license_ccurl || "https://creativecommons.org/licenses/by-sa/3.0/",
          attribution: `CC via Jamendo - ${item.artist_name}`,
          downloadAllowed: item.audiodownload_allowed,
          cachingAllowed: false,
        }));
      } catch (err) {
        console.error("search_jamendo failed:", err);
      }
    }
    return [];
  }

  static async searchJioSaavn(query: string, limit = 20): Promise<Track[]> {
    if (isTauri()) {
      try {
        const items = await invoke<any[]>("search_jiosaavn", { query, limit });
        return items.map((item) => ({
          id: `jio_${item.id}`,
          title: item.title,
          artists: item.artists,
          album: item.album,
          durationMs: (item.duration_seconds || 180) * 1000,
          sourceKind: "stream" as SourceKind,
          providerId: "jiosaavn",
          providerTrackId: item.id,
          streamUrl: item.stream_url,
          codec: "AAC",
          sampleRate: 44100,
          bitDepth: 16,
          bitrate: item.bitrate || 320,
          channels: 2,
          artworkUrl: item.image,
          attribution: `JioSaavn Music`,
          downloadAllowed: false,
          cachingAllowed: false,
        }));
      } catch (err) {
        console.error("search_jiosaavn failed:", err);
      }
    }
    return [];
  }

  static async searchYouTube(query: string, limit = 20): Promise<Track[]> {
    if (isTauri()) {
      try {
        const items = await invoke<any[]>("search_youtube", { query, limit });
        return items.map((item) => ({
          id: item.id,
          title: item.title,
          artists: [item.channel],
          album: "YouTube Music",
          durationMs: (item.duration_seconds || 180) * 1000,
          sourceKind: "video" as SourceKind,
          providerId: "youtube",
          providerTrackId: item.youtube_video_id,
          youtubeVideoId: item.youtube_video_id,
          streamUrl: `https://www.youtube.com/watch?v=${item.youtube_video_id}`,
          codec: "Opus",
          sampleRate: 48000,
          bitDepth: 16,
          bitrate: 160,
          channels: 2,
          artworkUrl: item.thumbnail,
          attribution: `YouTube - ${item.channel}`,
          downloadAllowed: false,
          cachingAllowed: false,
        }));
      } catch (err) {
        console.error("search_youtube failed:", err);
      }
    }
    return [];
  }

  static async openExternal(url: string): Promise<void> {
    if (isTauri()) {
      try {
        await invoke("open_external", { url });
      } catch {
        window.open(url, "_blank");
      }
    } else {
      window.open(url, "_blank");
    }
  }
}
