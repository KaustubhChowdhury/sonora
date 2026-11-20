import React from "react";
import { TauriBridge } from "../../services/tauriBridge";
import { CURATED_YOUTUBE_HITS } from "../../data/curated";
import { ProviderBrowse } from "../shared/ProviderBrowse";
import { YoutubeIcon } from "../../components/shared/ProviderIcons";

const CATEGORIES = [
  { id: "popular", label: "Popular", query: "top music hits this week" },
  { id: "global", label: "Global top 100", query: "billboard hot 100 official audio" },
  { id: "lofi", label: "Lo-fi", query: "lofi hip hop beats" },
  { id: "synth", label: "Synthwave", query: "synthwave retro" },
  { id: "rock", label: "Rock", query: "rock hits official audio" },
  { id: "phonk", label: "Phonk", query: "phonk drift" },
];

export const YouTubeScreen: React.FC = () => (
  <ProviderBrowse
    providerKey="youtube"
    name="YouTube"
    blurb="Plays through the embedded YouTube player"
    categories={CATEGORIES}
    search={TauriBridge.searchYouTube}
    fallback={CURATED_YOUTUBE_HITS}
    icon={<YoutubeIcon />}
  />
);
