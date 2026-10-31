import { ProviderDescriptor, ProviderSearchResult } from "../types";
import { TauriBridge } from "../../services/tauriBridge";

export const JIOSAAVN_DESCRIPTOR: ProviderDescriptor = {
  id: "jiosaavn",
  name: "JioSaavn",
  status: "externalOnly",
  capabilities: ["externalOpen"],
  officialHomeUrl: "https://www.jiosaavn.com/",
  notice:
    "Official service connection. JioSaavn Terms of Use (last updated 7 Oct 2026) prohibit unofficial automated access or programming interfaces without a separate written agreement. Direct playback opens in JioSaavn.",
  iconName: "Music",
};

// Strict URL allowlist for JioSaavn
const ALLOWED_JIOSAAVN_HOSTS = [
  "www.jiosaavn.com",
  "jiosaavn.com",
];

export function isValidJioSaavnUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_JIOSAAVN_HOSTS.includes(parsed.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export async function openJioSaavn(searchQuery?: string): Promise<void> {
  let targetUrl = "https://www.jiosaavn.com/";
  if (searchQuery && searchQuery.trim()) {
    targetUrl = `https://www.jiosaavn.com/search/${encodeURIComponent(searchQuery.trim())}`;
  }

  if (isValidJioSaavnUrl(targetUrl)) {
    await TauriBridge.openExternal(targetUrl);
  } else {
    console.error("Disallowed JioSaavn destination URL:", targetUrl);
  }
}

export function getJioSaavnCuratedResults(query: string): ProviderSearchResult[] {
  const q = query.toLowerCase().trim();
  const sampleHighlights: ProviderSearchResult[] = [
    {
      providerId: "jiosaavn",
      providerItemId: "js-1",
      title: "Raga Yaman (Evening Meditation)",
      artists: ["Pandit Hariprasad Chaurasia"],
      album: "Classical Legends of India",
      artworkUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80",
      itemType: "track",
      sourceLabel: "JioSaavn Catalogue",
      action: "openExternal",
      externalUrl: "https://www.jiosaavn.com/search/Raga+Yaman",
    },
    {
      providerId: "jiosaavn",
      providerItemId: "js-2",
      title: "Coke Studio India - Classical Fusion",
      artists: ["Various Artists"],
      album: "Coke Studio Season Sessions",
      artworkUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
      itemType: "album",
      sourceLabel: "JioSaavn Catalogue",
      action: "openExternal",
      externalUrl: "https://www.jiosaavn.com/search/Coke+Studio+India",
    },
  ];

  if (!q) return sampleHighlights;
  return sampleHighlights.filter(
    (h) =>
      h.title.toLowerCase().includes(q) ||
      h.artists.some((a) => a.toLowerCase().includes(q))
  );
}
