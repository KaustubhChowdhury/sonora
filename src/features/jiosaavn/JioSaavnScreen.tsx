import React from "react";
import { TauriBridge } from "../../services/tauriBridge";
import { CURATED_JIOSAAVN_HITS } from "../../data/curated";
import { ProviderBrowse } from "../shared/ProviderBrowse";

const CATEGORIES = [
  { id: "trending", label: "Trending", query: "trending hindi hits" },
  { id: "top", label: "Bollywood top 50", query: "top 50 hindi" },
  { id: "punjabi", label: "Punjabi", query: "punjabi top hits" },
  { id: "romantic", label: "Romantic", query: "romantic hindi songs" },
  { id: "lofi", label: "Lo-fi", query: "hindi lofi chill" },
  { id: "retro", label: "Retro", query: "old hindi classics" },
];

export const JioSaavnScreen: React.FC = () => (
  <ProviderBrowse
    providerKey="jiosaavn"
    name="JioSaavn"
    blurb="Streams at up to 320 kbps"
    categories={CATEGORIES}
    search={TauriBridge.searchJioSaavn}
    fallback={CURATED_JIOSAAVN_HITS}
    icon={
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6.25" />
        <path d="M10.5 5.75c-.6-.6-1.5-.9-2.5-.9-1.3 0-2.2.7-2.2 1.6 0 2 4.6 1.2 4.6 3.3 0 1-.9 1.7-2.4 1.7-1 0-1.9-.3-2.6-1" strokeLinecap="round" />
      </svg>
    }
  />
);
