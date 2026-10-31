export type ProviderId = "local" | "jamendo" | "youtube" | "jiosaavn";

export type ProviderStatus =
  | "available"
  | "externalOnly"
  | "pendingApproval"
  | "disabled";

export type ProviderCapability =
  | "searchMetadata"
  | "browseArtists"
  | "browseAlbums"
  | "readUserPlaylists"
  | "embeddedPlayback"
  | "nativePlayback"
  | "offlinePlayback"
  | "lyrics"
  | "externalOpen";

export interface ProviderDescriptor {
  id: ProviderId;
  name: string;
  status: ProviderStatus;
  capabilities: ProviderCapability[];
  officialHomeUrl: string;
  notice: string;
  iconName: "HardDrive" | "Globe" | "Youtube" | "Music";
}

export interface ProviderSearchResult {
  providerId: ProviderId;
  providerItemId: string;
  title: string;
  artists: string[];
  album?: string;
  artworkUrl?: string;
  durationSeconds?: number;
  itemType: "track" | "album" | "artist" | "playlist" | "video";
  sourceLabel: string;
  action: "playNative" | "playEmbedded" | "openExternal";
  externalUrl?: string;
  youtubeVideoId?: string;
}

export interface MusicProvider {
  getDescriptor(): ProviderDescriptor;
  search?(query: string): Promise<ProviderSearchResult[]>;
  openOfficialService?(): Promise<void>;
}
