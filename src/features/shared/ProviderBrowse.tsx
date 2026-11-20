import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Track } from "../../types/music";
import { CollectionHeader } from "../../components/shared/CollectionHeader";
import { TrackList } from "../../components/shared/TrackRow";
import { EmptyState, Tabs } from "../../components/ui/primitives";
import { isTauri } from "../../services/tauriBridge";

export interface BrowseCategory {
  id: string;
  label: string;
  query: string;
}

const feedCache = new Map<string, Track[]>();

/**
 * A streaming service's page: a row of categories, an in-service search, and the results as a track list.
 * Results per category are cached for the session so switching back is instant.
 */
export const ProviderBrowse: React.FC<{
  providerKey: string;
  name: string;
  blurb: string;
  categories: BrowseCategory[];
  search: (q: string, limit: number) => Promise<Track[]>;
  fallback: Track[];
  icon: React.ReactNode;
}> = ({ providerKey, name, blurb, categories, search, fallback, icon }) => {
  const [cat, setCat] = useState(categories[0].id);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [tracks, setTracks] = useState<Track[]>(() => feedCache.get(`${providerKey}:${categories[0].query}`) ?? []);
  const [loading, setLoading] = useState(false);
  const req = useRef(0);

  const activeQuery = submitted || categories.find((c) => c.id === cat)!.query;
  const cacheKey = `${providerKey}:${activeQuery}`;

  useEffect(() => {
    const hit = feedCache.get(cacheKey);
    if (hit) {
      setTracks(hit);
      return;
    }
    const id = ++req.current;
    setLoading(true);
    search(activeQuery, 40)
      .then((res) => {
        if (id !== req.current) return;
        if (res.length) feedCache.set(cacheKey, res);
        setTracks(res.length ? res : submitted ? [] : fallback);
      })
      .finally(() => id === req.current && setLoading(false));
  }, [cacheKey]);

  const title = submitted ? `“${submitted}”` : categories.find((c) => c.id === cat)!.label;

  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <div className="px-8 pt-8 flex items-center gap-3">
        <span className="text-ink-2 [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
        <h1 className="text-[15px] font-semibold">{name}</h1>
        <span className="text-[13px] text-ink-3">{blurb}</span>
      </div>

      <div className="px-8 pt-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={submitted ? "" : cat}
          onChange={(v) => {
            setSubmitted("");
            setQuery("");
            setCat(v);
          }}
          items={categories.map((c) => ({ value: c.id, label: c.label }))}
        />
        <form
          className="relative w-64"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(query.trim());
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${name}`}
            aria-label={`Search ${name}`}
            className="w-full h-8 pl-9 pr-8 rounded-full bg-white/[0.06] text-[13px] placeholder:text-ink-3 focus:outline-none focus:bg-white/[0.09]"
          />
          {submitted && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setSubmitted("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {loading && tracks.length === 0 ? (
        <p className="px-8 py-10 text-[13px] text-ink-3">Loading…</p>
      ) : tracks.length === 0 ? (
        <div className="px-8">
          <EmptyState
            title={submitted ? `No ${name} results for “${submitted}”` : `Couldn't load ${name}`}
            body={isTauri() ? "Check your internet connection and try again." : `${name} needs the desktop app; the browser preview can't reach it.`}
          />
        </div>
      ) : (
        <>
          <div className={loading ? "opacity-50 transition-opacity" : "transition-opacity"}>
            <CollectionHeader
              kind={submitted ? "Search" : name}
              title={title}
              meta={`${tracks.length} songs`}
              artworkUrl={tracks[0]?.artworkUrl}
              tracks={tracks}
            />
            <div className="px-6">
              <TrackList tracks={tracks} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
