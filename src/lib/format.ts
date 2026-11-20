export function formatTime(ms: number | undefined): string {
  if (!ms || !Number.isFinite(ms) || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** "1 hr 12 min" / "38 min" */
export function formatLongDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Human summary of a track's encoding, e.g. "FLAC 24/96" or "AAC 320". */
export function formatSpec(t: { codec?: string; sampleRate?: number; bitDepth?: number; bitrate?: number }): string {
  if (!t.codec) return "";
  const lossless = ["FLAC", "WAV", "ALAC", "AIFF"].includes(t.codec.toUpperCase());
  if (lossless && t.sampleRate) {
    const khz = t.sampleRate / 1000;
    return `${t.codec} ${t.bitDepth ?? 16}/${Number.isInteger(khz) ? khz : khz.toFixed(1)}`;
  }
  return t.bitrate ? `${t.codec} ${t.bitrate}` : t.codec;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export const sourceLabel = (providerId?: string, sourceKind?: string): string => {
  switch (providerId) {
    case "jiosaavn":
      return "JioSaavn";
    case "youtube":
      return "YouTube";
    case "jamendo":
      return "Jamendo";
    case "subsonic":
    case "navidrome":
      return "Your server";
  }
  return sourceKind === "local" ? "Local file" : "Stream";
};
