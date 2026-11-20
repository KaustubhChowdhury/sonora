import { usePlayerStore } from "../stores/playerStore";
import { useUiStore } from "../stores/uiStore";
import { autoplayFor, similarTo, dedupe, songKey } from "./recommend";
import { Track } from "../types/music";

/**
 * Keeps music going: when the last song in the queue starts, similar songs are fetched
 * and appended in the background, so "next" never runs into an empty queue.
 */

let inflight: Promise<number> | null = null;

/** Appends autoplay songs to the queue. Returns how many were added. */
export function extendQueue(): Promise<number> {
  if (inflight) return inflight;
  const { currentTrack, queue } = usePlayerStore.getState();
  if (!currentTrack) return Promise.resolve(0);

  usePlayerStore.setState({ autoplayLoading: true });
  inflight = autoplayFor(currentTrack, queue, 10)
    .then((tracks) => {
      const s = usePlayerStore.getState();
      // The user may have changed track while we were fetching; still fine to append.
      const fresh = dedupe(tracks, s.queue.map(songKey));
      if (fresh.length) {
        usePlayerStore.setState({
          queue: [...s.queue, ...fresh],
          autoplayIds: [...s.autoplayIds, ...fresh.map((t) => t.id)].slice(-200),
        });
      }
      return fresh.length;
    })
    .catch(() => 0)
    .finally(() => {
      inflight = null;
      usePlayerStore.setState({ autoplayLoading: false });
    });
  return inflight;
}

/** Called by the player when it reaches the end of the queue while `endedId` was playing. */
let continuing: string | null = null;
export async function continueAfterQueueEnd(endedId: string) {
  if (continuing === endedId) return; // already handling this song's end
  continuing = endedId;
  try {
    await extendQueue();
    const p = usePlayerStore.getState();
    if (p.currentTrack?.id !== endedId) return; // user picked something else meanwhile
    if (p.queueIndex < p.queue.length - 1) {
      p.playTrack(p.queue[p.queueIndex + 1]);
    } else {
      useUiStore.getState().showToast("Couldn't find more songs to play. Check your connection.");
    }
  } finally {
    continuing = null;
  }
}

/** Plays `track` and fills the queue with songs like it (YouTube Music's "Start radio"). */
export async function startRadio(track: Track) {
  const p = usePlayerStore.getState();
  p.playTrack(track, [track]);
  usePlayerStore.setState({ autoplayIds: [], autoplayLoading: true });
  const similar = await similarTo(track, 30).catch(() => [] as Track[]);
  const s = usePlayerStore.getState();
  if (s.currentTrack?.id !== track.id) return; // user moved on
  const fresh = dedupe(similar, s.queue.map(songKey));
  usePlayerStore.setState({
    queue: [...s.queue, ...fresh],
    autoplayIds: fresh.map((t) => t.id),
    autoplayLoading: false,
  });
  useUiStore.getState().showToast(fresh.length ? `Radio based on “${track.title}”` : "No similar songs found");
}

// Prefetch when the last (or second-to-last) song starts.
if (typeof window !== "undefined") {
  usePlayerStore.subscribe((s, prev) => {
    if (!s.autoplay || !s.currentTrack) return;
    if (s.currentTrack.id === prev.currentTrack?.id && s.queue.length === prev.queue.length) return;
    if (s.isShuffle || s.repeatMode !== "off") return;
    if (s.queueIndex >= s.queue.length - 2) extendQueue();
  });
}
