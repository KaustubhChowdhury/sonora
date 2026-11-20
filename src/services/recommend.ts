import { Track } from "../types/music";
import { TauriBridge } from "./tauriBridge";
import { useLibraryStore, topTracks, topArtists } from "../stores/libraryStore";

/**
 * Recommendations built from what you listen to.
 *
 * Every suggestion is seeded by a real song:
 *  - JioSaavn songs  → JioSaavn's song radio
 *  - YouTube songs   → YouTube's auto-generated mix
 *  - anything else   → find the song on JioSaavn first, then use its radio
 */

const radioCache = new Map<string, { at: number; tracks: Track[] }>();
const CACHE_MS = 30 * 60_000;

/** Key that treats the same song from different sources/uploads as one. */
export function songKey(t: Track): string {
  const title = t.title
    .toLowerCase()
    .replace(/\(from [^)]*\)/g, "")
    .replace(/[\(\[].*?[\)\]]/g, "")
    .replace(/\b(official|video|audio|lyrics?|remastered|hd)\b/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  const artist = (t.artists[0] || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return `${title}|${artist}`;
}

/** Songs similar to `seed`. Results are cached for 30 minutes. */
export async function similarTo(seed: Track, limit = 20): Promise<Track[]> {
  const hit = radioCache.get(seed.id);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.tracks.slice(0, limit);

  let tracks: Track[] = [];
  if (seed.providerId === "jiosaavn" && seed.providerTrackId) {
    tracks = await TauriBridge.jiosaavnRadio(seed.providerTrackId, limit);
  } else if (seed.providerId === "youtube" && (seed.youtubeVideoId || seed.providerTrackId)) {
    tracks = await TauriBridge.youtubeMix(seed.youtubeVideoId || seed.providerTrackId!, limit);
  }
  if (tracks.length === 0) {
    // Local file, server track, or the source had nothing: match it on JioSaavn and use that song's radio.
    const match = (await TauriBridge.searchJioSaavn(`${seed.title} ${seed.artists[0] ?? ""}`, 1))[0];
    if (match) tracks = [match, ...(await TauriBridge.jiosaavnRadio(match.providerTrackId!, limit))];
    if (tracks.length === 0 && seed.artists[0]) tracks = await TauriBridge.searchJioSaavn(seed.artists[0], limit);
  }

  const seedKey = songKey(seed);
  tracks = dedupe(tracks).filter((t) => songKey(t) !== seedKey && isSong(t));
  radioCache.set(seed.id, { at: Date.now(), tracks });
  return tracks.slice(0, limit);
}

/** True for something song-length: drops hour-long YouTube compilations and 20-second clips. */
export const isSong = (t: Track) => t.durationMs >= 60_000 && t.durationMs <= 10 * 60_000;

export function dedupe(tracks: Track[], exclude: Iterable<string> = []): Track[] {
  const seen = new Set<string>(exclude);
  const out: Track[] = [];
  for (const t of tracks) {
    const k = songKey(t);
    if (seen.has(k) || seen.has(t.id)) continue;
    seen.add(k);
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

/** Song keys to keep out of fresh suggestions: things you just heard or keep skipping. */
function avoidKeys(): Set<string> {
  const { recentlyPlayed, stats } = useLibraryStore.getState();
  const keys = new Set(recentlyPlayed.slice(0, 15).map(songKey));
  for (const st of Object.values(stats)) if (st.skips >= 2 && st.skips >= st.plays) keys.add(songKey(st.track));
  return keys;
}

/** Interleave several lists so no single seed dominates. */
function interleave<T>(lists: T[][]): T[] {
  const out: T[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

/** The songs your taste is built from: most played first, then recent plays. */
export function tasteSeeds(n = 5): Track[] {
  const { stats, recentlyPlayed, favourites } = useLibraryStore.getState();
  return dedupe([...topTracks(stats, n), ...favourites.slice(0, 3), ...recentlyPlayed.slice(0, n)]).slice(0, n);
}

export const hasHistory = () => tasteSeeds(1).length > 0;

/** "Quick picks": a mix of radios from your top songs, minus what you just heard. */
export async function quickPicks(limit = 24): Promise<Track[]> {
  const seeds = tasteSeeds(4);
  if (!seeds.length) return [];
  const lists = await Promise.all(seeds.map((s) => similarTo(s, 15).catch(() => [])));
  return dedupe(interleave(lists), avoidKeys()).slice(0, limit);
}

export interface ArtistMix {
  artist: string;
  seed: Track;
  cover?: string;
}

/** One mix per favourite artist, each started from your favourite song by them. */
export function artistMixes(n = 6): ArtistMix[] {
  // Each mix needs its own seed song; otherwise two mixes would play (and look) the same.
  const used = new Set<string>();
  const out: ArtistMix[] = [];
  for (const a of topArtists(useLibraryStore.getState().stats, n * 2)) {
    if (used.has(a.seed.id)) continue;
    used.add(a.seed.id);
    out.push({ artist: a.name, seed: a.seed, cover: a.seed.artworkUrl });
    if (out.length >= n) break;
  }
  return out;
}

/** Tracks for a mix: the seed song, then songs like it. */
export async function mixTracks(mix: ArtistMix, limit = 30): Promise<Track[]> {
  return dedupe([mix.seed, ...(await similarTo(mix.seed, limit))]);
}

/** Songs to append when the queue runs out, based on what's playing and what you like. */
export async function autoplayFor(current: Track, queue: Track[], limit = 10): Promise<Track[]> {
  const exclude = new Set([...avoidKeys(), ...queue.map(songKey)]);
  const fromCurrent = await similarTo(current, 25).catch(() => [] as Track[]);
  let picks = dedupe(fromCurrent, exclude);
  if (picks.length < limit) {
    // Top up from your wider taste so autoplay doesn't dead-end on a niche song.
    const seed = tasteSeeds(3).find((s) => s.id !== current.id);
    if (seed) picks = dedupe([...picks, ...(await similarTo(seed, 15).catch(() => []))], exclude);
  }
  return picks.slice(0, limit);
}
