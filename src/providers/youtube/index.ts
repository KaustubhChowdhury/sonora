import { ProviderDescriptor, ProviderSearchResult } from "../types";
import { TauriBridge } from "../../services/tauriBridge";

export const YOUTUBE_DESCRIPTOR: ProviderDescriptor = {
  id: "youtube",
  name: "YouTube Music",
  status: "externalOnly",
  capabilities: ["externalOpen", "searchMetadata", "embeddedPlayback"],
  officialHomeUrl: "https://music.youtube.com/",
  notice:
    "Official service connection. Undocumented audio stream extraction is strictly disallowed by YouTube Developer Policies. Official videos open in a visible player or the system browser.",
  iconName: "Youtube",
};

// Strict URL allowlist for YouTube
const ALLOWED_YOUTUBE_HOSTS = [
  "music.youtube.com",
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
];

export function isValidYouTubeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_YOUTUBE_HOSTS.includes(parsed.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export async function openYouTubeMusic(searchQuery?: string): Promise<void> {
  let targetUrl = "https://music.youtube.com/";
  if (searchQuery && searchQuery.trim()) {
    targetUrl = `https://music.youtube.com/search?q=${encodeURIComponent(searchQuery.trim())}`;
  }

  if (isValidYouTubeUrl(targetUrl)) {
    await TauriBridge.openExternal(targetUrl);
  } else {
    console.error("Disallowed YouTube destination URL:", targetUrl);
  }
}

export async function openYouTubeVideo(videoId: string): Promise<void> {
  const cleanId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");
  const targetUrl = `https://www.youtube.com/watch?v=${cleanId}`;
  if (isValidYouTubeUrl(targetUrl)) {
    await TauriBridge.openExternal(targetUrl);
  }
}

// Curated official music highlights for search suggestions without unofficial scraping
export function getYouTubeCuratedResults(query: string): ProviderSearchResult[] {
  const q = query.toLowerCase().trim();
  const sampleVideos: ProviderSearchResult[] = [
    {
      providerId: "youtube",
      providerItemId: "yt-1",
      title: "Chamber Symphony No. 1 (Official Live Performance)",
      artists: ["Aethelgard Chamber Orchestra"],
      album: "Live at Oslo Concert Hall",
      artworkUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
      durationSeconds: 312,
      itemType: "video",
      sourceLabel: "YouTube Video",
      action: "playEmbedded",
      youtubeVideoId: "dQw4w9WgXcQ",
      externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      providerId: "youtube",
      providerItemId: "yt-2",
      title: "Vapour & Iron Live Modular Sessions",
      artists: ["Kuroshio"],
      album: "Tokyo Synth Summit",
      artworkUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      durationSeconds: 420,
      itemType: "video",
      sourceLabel: "YouTube Video",
      action: "playEmbedded",
      youtubeVideoId: "fJ9rUzIMcZQ",
      externalUrl: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    },
    {
      providerId: "youtube",
      providerItemId: "yt-3",
      title: "Blue Note Tokyo Live Sessions",
      artists: ["Takeshi Morita Quartet"],
      album: "Official YouTube Channel",
      artworkUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80",
      durationSeconds: 388,
      itemType: "video",
      sourceLabel: "YouTube Video",
      action: "openExternal",
      externalUrl: "https://music.youtube.com/search?q=Takeshi+Morita+Quartet",
    },
  ];

  if (!q) return sampleVideos;
  return sampleVideos.filter(
    (v) =>
      v.title.toLowerCase().includes(q) ||
      v.artists.some((a) => a.toLowerCase().includes(q))
  );
}
