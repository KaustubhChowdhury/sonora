export type SourceKind = "local" | "stream" | "personal-server";

export type PlaybackDescriptor =
  | { kind: "local"; path: string; fileIdentity?: string }
  | { kind: "stream"; url: string; expiresAt?: string; headers?: Record<string, string> }
  | { kind: "personal-server"; serverId: string; trackId: string };

export interface Track {
  id: string;
  title: string;
  artists: string[];
  album?: string;
  albumId?: string;
  artistId?: string;
  durationMs: number;
  artworkUrl?: string;
  sourceKind: SourceKind;
  providerId: string; // "local" | "jamendo" | "navidrome"
  providerTrackId?: string;
  path?: string;
  codec?: string; // "FLAC", "MP3", "WAV", "ALAC", "AAC", "Opus"
  sampleRate?: number; // 44100, 48000, 96000, 192000
  bitDepth?: number; // 16, 24, 32
  bitrate?: number; // kbps
  channels?: number;
  fileSize?: number;
  year?: number;
  genre?: string;
  trackNumber?: number;
  discNumber?: number;
  isFavourite?: boolean;
  playCount?: number;
  licenseUrl?: string;
  attribution?: string;
  downloadAllowed?: boolean;
  cachingAllowed?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year?: number;
  genre?: string;
  artworkUrl?: string;
  trackCount: number;
  totalDurationMs: number;
  sourceKind: SourceKind;
}

export interface Artist {
  id: string;
  name: string;
  artworkUrl?: string;
  albumCount: number;
  trackCount: number;
  bio?: string;
}

export interface AudioDevice {
  id: string;
  name: string;
  isDefault: boolean;
  sampleRates: number[];
  channels: number;
  exclusiveSupported: boolean;
}

export type AudioOutputMode = "shared" | "exclusive";

export interface AudioOutputStatus {
  mode: AudioOutputMode;
  deviceName: string;
  negotiatedSampleRate: number;
  negotiatedBitDepth: number;
  negotiatedChannels: number;
  isBitPerfect: boolean;
  dspBypassed: boolean;
  underrunCount: number;
}

export interface DspSettings {
  bypass: boolean;
  preampGainDb: number; // -12 to +12
  eqBands: number[]; // 10 bands: 31, 63, 125, 250, 500, 1k, 2k, 4k, 8k, 16k (-12 to +12 dB)
  eqPreset: string;
  replayGainMode: "off" | "track" | "album";
  crossfadeSeconds: number; // 0 to 10
}

export interface LyricsLine {
  timeMs: number;
  text: string;
}

export interface LyricsData {
  source: "embedded" | "sidecar" | "lrclib" | "none";
  isSynced: boolean;
  plainText?: string;
  syncedLines?: LyricsLine[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  totalDurationMs: number;
  isSmart: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FolderScanStatus {
  isScanning: boolean;
  currentFolder?: string;
  scannedFiles: number;
  totalCandidates: number;
  errorCount: number;
  errors: string[];
}

export interface PlayHistoryEntry {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
  playedAt: string;
  listenedMs: number;
  completionRatio: number;
}
