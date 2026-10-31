import { ProviderDescriptor, ProviderId, ProviderSearchResult } from "./types";
import { YOUTUBE_DESCRIPTOR, openYouTubeMusic, getYouTubeCuratedResults } from "./youtube";
import { JIOSAAVN_DESCRIPTOR, openJioSaavn, getJioSaavnCuratedResults } from "./jiosaavn";

export const LOCAL_DESCRIPTOR: ProviderDescriptor = {
  id: "local",
  name: "Local Library",
  status: "available",
  capabilities: [
    "nativePlayback",
    "offlinePlayback",
    "searchMetadata",
    "browseArtists",
    "browseAlbums",
    "readUserPlaylists",
    "lyrics",
  ],
  officialHomeUrl: "file://local",
  notice: "Local lossless files decoded natively via Symphonia & WASAPI.",
  iconName: "HardDrive",
};

export const JAMENDO_DESCRIPTOR: ProviderDescriptor = {
  id: "jamendo",
  name: "Jamendo Discovery",
  status: "available",
  capabilities: ["searchMetadata", "nativePlayback", "lyrics"],
  officialHomeUrl: "https://www.jamendo.com",
  notice:
    "Creative Commons catalogue via Jamendo API v3. Non-commercial license attribution strictly preserved.",
  iconName: "Globe",
};

export const PROVIDER_REGISTRY: Record<ProviderId, ProviderDescriptor> = {
  local: LOCAL_DESCRIPTOR,
  jamendo: JAMENDO_DESCRIPTOR,
  youtube: YOUTUBE_DESCRIPTOR,
  jiosaavn: JIOSAAVN_DESCRIPTOR,
};

export function getProviderDescriptor(id: ProviderId): ProviderDescriptor {
  return PROVIDER_REGISTRY[id] || LOCAL_DESCRIPTOR;
}

export function getAllProviders(): ProviderDescriptor[] {
  return Object.values(PROVIDER_REGISTRY);
}

export async function openOfficialProvider(id: ProviderId, query?: string): Promise<void> {
  if (id === "youtube") {
    await openYouTubeMusic(query);
  } else if (id === "jiosaavn") {
    await openJioSaavn(query);
  }
}
