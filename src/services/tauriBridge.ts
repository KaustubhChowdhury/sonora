import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Track, SourceKind, AudioDevice, AudioOutputStatus, DspSettings, LyricsData, FolderScanStatus } from "../types/music";

// Don't assign window.isTauri: Tauri 2 defines it as read-only, and writing to it
// throws at module load in the packaged app (blank window).
export const isTauri = () =>
  typeof window !== "undefined" &&
  ("__TAURI_INTERNALS__" in window || "__TAURI__" in window || Boolean((window as any).isTauri));

export class JamendoError extends Error {
  constructor(public kind: "missing-key" | "network" | "api", message: string) {
    super(message);
  }
}

const JAMENDO_KEY = "sonora-jamendo-client-id";
export const getJamendoClientId = (): string => {
  try {
    return localStorage.getItem(JAMENDO_KEY)?.trim() || "";
  } catch {
    return "";
  }
};
export const setJamendoClientId = (id: string) => {
  try {
    if (id.trim()) localStorage.setItem(JAMENDO_KEY, id.trim());
    else localStorage.removeItem(JAMENDO_KEY);
  } catch {
    /* storage unavailable */
  }
};

export interface SaavnCollection {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  kind: "playlist" | "album" | "song";
}
export interface SaavnHome {
  newReleases: SaavnCollection[];
  charts: SaavnCollection[];
  topPlaylists: SaavnCollection[];
  trending: SaavnCollection[];
}

async function callTracks(cmd: string, args: Record<string, unknown>, map: (x: any) => Track): Promise<Track[]> {
  if (!isTauri()) return [];
  try {
    const items = await invoke<any[]>(cmd, args);
    return Array.isArray(items) ? items.map(map) : [];
  } catch (err) {
    console.error(`[TauriBridge] ${cmd} failed:`, err);
    return [];
  }
}

const mapSaavn = (item: any): Track => ({
  id: `jio_${item.id}`,
  title: item.title,
  artists: item.artists?.length ? item.artists : ["Unknown artist"],
  album: item.album,
  durationMs: (item.duration_seconds || 180) * 1000,
  sourceKind: "stream",
  providerId: "jiosaavn",
  providerTrackId: item.id,
  streamUrl: item.stream_url,
  codec: "AAC",
  sampleRate: 44100,
  bitrate: item.bitrate || 320,
  channels: 2,
  year: item.year ? Number(item.year) || undefined : undefined,
  artworkUrl: item.image,
  attribution: "JioSaavn",
  downloadAllowed: false,
  cachingAllowed: false,
});

/**
 * YouTube results come as "Artist - Song (Official Video)" from channels like "ArtistVEVO"
 * or "Artist - Topic". Split them into a clean title and artist.
 */
export function cleanYouTube(rawTitle: string, channel: string): { title: string; artist: string } {
  const strip = (t: string) =>
    t
      .replace(/\s*[\(\[][^)\]]*(official|video|audio|lyric|visuali[sz]er|hd|4k|mv|m\/v)[^)\]]*[\)\]]/gi, "")
      .replace(/\s*\|.*$/, "")
      .replace(/\s+/g, " ")
      .trim();
  const cleanChannel = channel.replace(/VEVO$/i, "").replace(/\s*-\s*Topic$/i, "").replace(/official/i, "").trim() || channel;
  const m = rawTitle.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  // "Song - Lyrical Video" / "Song - Full Video Song": the right side isn't an artist split.
  if (m && /^(lyric(al)?|official|full|video|audio|song|hd|4k|8k)(\s|$)/i.test(strip(m[2]) || m[2])) {
    return { title: strip(m[1]) || m[1], artist: cleanChannel };
  }
  if (m) {
    // Drop "ft. X" / "feat. X" — only as a separate word, so "Daft Punk" survives.
    const artist = m[1].replace(/\s+(ft\.?|feat\.?|featuring)\s.*$/i, "").trim();
    return { title: strip(m[2]) || strip(rawTitle), artist };
  }
  return { title: strip(rawTitle) || rawTitle, artist: cleanChannel };
}

const mapYouTube = (item: any): Track => {
  const { title, artist } = cleanYouTube(item.title, item.channel);
  return {
    id: item.id,
    title,
    artists: [artist],
    album: undefined,
    durationMs: (item.duration_seconds || 180) * 1000,
    sourceKind: "video",
    providerId: "youtube",
    providerTrackId: item.youtube_video_id,
    youtubeVideoId: item.youtube_video_id,
    codec: "Opus",
    sampleRate: 48000,
    bitrate: 160,
    channels: 2,
    artworkUrl: item.thumbnail,
    attribution: `YouTube · ${item.channel}`,
    downloadAllowed: false,
    cachingAllowed: false,
  };
};

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

  /** Position and transport state of the native engine, or null outside Tauri / on error. */
  static async getEnginePosition(): Promise<{ isPlaying: boolean; positionMs: number; durationMs: number } | null> {
    if (!isTauri()) return null;
    try {
      const raw = await invoke<any>("get_playback_status");
      return {
        isPlaying: Boolean(raw.is_playing),
        positionMs: Number(raw.current_position_ms) || 0,
        durationMs: Number(raw.duration_ms) || 0,
      };
    } catch {
      return null;
    }
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
        name: "System default output",
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
      scannedFiles: 0,
      totalCandidates: 0,
      errorCount: 1,
      errors: ["Folder scanning needs the desktop app."],
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
    return [];
  }

  static async getLibraryFolders(): Promise<string[]> {
    if (isTauri()) {
      try {
        return await invoke<string[]>("get_library_folders");
      } catch {
        return [];
      }
    }
    return [];
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

    return { source: "none", isSynced: false };
  }

  /**
   * Jamendo (Creative Commons music). Called directly from the webview — the API allows CORS —
   * with the user's own client ID from Settings, since a shared key gets rate-limited or suspended.
   * Throws JamendoError so the UI can say what's wrong instead of showing an empty page.
   */
  static async searchJamendo(query: string, limit = 20, tags?: string): Promise<Track[]> {
    const clientId = getJamendoClientId();
    if (!clientId) throw new JamendoError("missing-key", "Add a Jamendo client ID in Settings to browse free music.");
    const params = new URLSearchParams({
      client_id: clientId,
      format: "json",
      limit: String(limit),
      audioformat: "mp32",
      imagesize: "300",
      include: "musicinfo",
    });
    if (query.trim()) params.set("namesearch", query.trim());
    else params.set("order", "popularity_week");
    if (tags) params.set("tags", tags);

    let body: any;
    try {
      const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
      body = await res.json();
    } catch {
      throw new JamendoError("network", "Couldn't reach Jamendo. Check your internet connection.");
    }
    if (body?.headers?.status !== "success") {
      throw new JamendoError("api", `Jamendo refused the request: ${body?.headers?.error_message || "unknown error"}`);
    }
    return (body.results as any[]).map((item) => ({
      id: `jamendo_${item.id}`,
      title: item.name,
      artists: [item.artist_name],
      album: item.album_name || undefined,
      durationMs: (Number(item.duration) || 0) * 1000,
      sourceKind: "stream" as SourceKind,
      providerId: "jamendo",
      providerTrackId: String(item.id),
      streamUrl: item.audio,
      codec: "MP3",
      sampleRate: 44100,
      bitrate: 320,
      channels: 2,
      artworkUrl: item.album_image || item.image,
      licenseUrl: item.license_ccurl,
      attribution: `${item.artist_name}, via Jamendo (Creative Commons)`,
      downloadAllowed: Boolean(item.audiodownload_allowed),
      cachingAllowed: false,
    }));
  }

  static async testSubsonic(cfg: { serverUrl: string; username: string; token: string; salt: string }): Promise<string> {
    if (!isTauri()) throw new Error("Connecting to a server needs the desktop app.");
    return await invoke<string>("test_subsonic_connection", cfg);
  }

  static async searchSubsonic(
    cfg: { serverUrl: string; username: string; token: string; salt: string },
    query: string
  ): Promise<Track[]> {
    if (!isTauri() || !cfg.serverUrl) return [];
    try {
      const items = await invoke<any[]>("search_subsonic", { ...cfg, query });
      return items.map((it) => ({
        id: `subsonic_${it.id}`,
        title: it.title,
        artists: [it.artist],
        album: it.album,
        durationMs: it.duration_ms,
        sourceKind: "personal-server" as SourceKind,
        providerId: "subsonic",
        providerTrackId: it.id,
        streamUrl: it.stream_url,
        codec: it.content_type?.split("/")[1]?.toUpperCase(),
        bitrate: it.bit_rate ?? undefined,
        year: it.year ?? undefined,
        artworkUrl: it.cover_art_url ?? undefined,
      }));
    } catch (err) {
      console.error("search_subsonic failed:", err);
      return [];
    }
  }

  static async searchJioSaavn(query: string, limit = 20): Promise<Track[]> {
    return callTracks("search_jiosaavn", { query, limit }, mapSaavn);
  }

  static async searchYouTube(query: string, limit = 20): Promise<Track[]> {
    return callTracks("search_youtube", { query, limit }, mapYouTube);
  }

  /** Songs similar to a JioSaavn song (JioSaavn's song radio). */
  static async jiosaavnRadio(songId: string, limit = 20): Promise<Track[]> {
    return callTracks("jiosaavn_radio", { songId, limit }, mapSaavn);
  }

  /** YouTube's auto-generated mix for a video. */
  static async youtubeMix(videoId: string, limit = 20): Promise<Track[]> {
    return callTracks("youtube_mix", { videoId, limit }, mapYouTube);
  }

  /** Songs in a JioSaavn playlist, album or single from the home feed. */
  static async jiosaavnCollection(kind: string, id: string, limit = 50): Promise<Track[]> {
    return callTracks("jiosaavn_collection", { kind, id, limit }, mapSaavn);
  }

  static async jiosaavnHome(): Promise<SaavnHome | null> {
    if (!isTauri()) return null;
    try {
      const raw = await invoke<any>("jiosaavn_home");
      const map = (xs: any[]): SaavnCollection[] =>
        (xs || []).map((x) => ({ id: x.id, title: x.title, subtitle: x.subtitle, image: x.image, kind: x.kind }));
      return {
        newReleases: map(raw.new_releases),
        charts: map(raw.charts),
        topPlaylists: map(raw.top_playlists),
        trending: map(raw.trending),
      };
    } catch (err) {
      console.error("[TauriBridge] jiosaavn_home failed:", err);
      return null;
    }
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

  static async minimizeWindow(): Promise<void> {
    try {
      await getCurrentWindow().minimize();
    } catch (err) {
      console.warn("Minimize error / non-Tauri:", err);
    }
  }

  static async toggleMaximizeWindow(): Promise<void> {
    try {
      await getCurrentWindow().toggleMaximize();
    } catch (err) {
      console.warn("Toggle maximize error / non-Tauri:", err);
    }
  }

  static async closeWindow(): Promise<void> {
    try {
      await getCurrentWindow().close();
    } catch (err) {
      console.warn("Close error / non-Tauri:", err);
    }
  }

  static async isWindowMaximized(): Promise<boolean> {
    try {
      return await getCurrentWindow().isMaximized();
    } catch {
      return false;
    }
  }
}
