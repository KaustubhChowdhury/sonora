import { useEffect } from "react";
import { usePlayerStore } from "../stores/playerStore";

/**
 * Sets the --ambient CSS variable (as "r g b") from the current track's artwork,
 * so headers and the now-playing bar take on the colour of what's playing.
 * Falls back to a stable colour derived from the track id when the image can't be read.
 */

const cache = new Map<string, string>();

function hashColour(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  // Muted, mid-dark colour in HSL → RGB
  const s = 0.38;
  const l = 0.42;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `${Math.round(f(0) * 255)} ${Math.round(f(8) * 255)} ${Math.round(f(4) * 255)}`;
}

function sampleArtwork(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        // Weight each pixel by saturation so a vivid cover doesn't average out to grey.
        let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
          const lum = (max + min) / 2;
          if (lum < 24 || lum > 235) continue;
          const weight = 1 + (max - min) / 32;
          r += pr * weight; g += pg * weight; b += pb * weight; w += weight;
        }
        if (!w) return resolve(null);
        // Clamp brightness so text on top stays readable.
        let cr = r / w, cg = g / w, cb = b / w;
        const lum = 0.2126 * cr + 0.7152 * cg + 0.0722 * cb;
        const scale = lum > 150 ? 150 / lum : lum < 70 ? 70 / Math.max(lum, 1) : 1;
        cr = Math.min(255, cr * scale); cg = Math.min(255, cg * scale); cb = Math.min(255, cb * scale);
        resolve(`${Math.round(cr)} ${Math.round(cg)} ${Math.round(cb)}`);
      } catch {
        resolve(null); // tainted canvas (no CORS)
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function colourForTrack(id: string, artworkUrl?: string): Promise<string> {
  const key = artworkUrl || id;
  const hit = cache.get(key);
  if (hit) return hit;
  const sampled = artworkUrl ? await sampleArtwork(artworkUrl) : null;
  const colour = sampled || hashColour(id);
  cache.set(key, colour);
  return colour;
}

export function useAmbientColor() {
  const track = usePlayerStore((s) => s.currentTrack);
  useEffect(() => {
    let cancelled = false;
    if (!track) {
      document.documentElement.style.setProperty("--ambient", "120 120 130");
      return;
    }
    colourForTrack(track.id, track.artworkUrl).then((c) => {
      if (!cancelled) document.documentElement.style.setProperty("--ambient", c);
    });
    return () => {
      cancelled = true;
    };
  }, [track?.id, track?.artworkUrl]);
}
