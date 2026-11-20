import React, { useEffect, useState } from "react";
import { Compass, ExternalLink } from "lucide-react";
import { TauriBridge, JamendoError, getJamendoClientId, setJamendoClientId } from "../../services/tauriBridge";
import { Track } from "../../types/music";
import { CollectionHeader } from "../../components/shared/CollectionHeader";
import { TrackList } from "../../components/shared/TrackRow";
import { Button, EmptyState, Tabs, TextField } from "../../components/ui/primitives";

const MOODS = [
  { id: "popular", label: "Popular this week", tags: "" },
  { id: "chill", label: "Chill", tags: "chillout" },
  { id: "electronic", label: "Electronic", tags: "electronic" },
  { id: "acoustic", label: "Acoustic", tags: "acoustic" },
  { id: "hiphop", label: "Hip-hop", tags: "hiphop" },
  { id: "classical", label: "Classical", tags: "classical" },
  { id: "jazz", label: "Jazz", tags: "jazz" },
];

const cache = new Map<string, Track[]>();

/** Free, Creative Commons–licensed music from Jamendo. */
export const ExploreScreen: React.FC = () => {
  const [mood, setMood] = useState(MOODS[0].id);
  const [tracks, setTracks] = useState<Track[]>(cache.get(MOODS[0].id) ?? []);
  const [error, setError] = useState<JamendoError | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyVersion, setKeyVersion] = useState(0);

  useEffect(() => {
    const hit = cache.get(mood);
    if (hit) {
      setTracks(hit);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    TauriBridge.searchJamendo("", 40, MOODS.find((m) => m.id === mood)!.tags || undefined)
      .then((res) => {
        if (!alive) return;
        cache.set(mood, res);
        setTracks(res);
        setError(null);
      })
      .catch((e) => alive && setError(e instanceof JamendoError ? e : new JamendoError("network", String(e))))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [mood, keyVersion]);

  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <div className="px-8 pt-8 flex items-center gap-3">
        <Compass className="w-5 h-5 text-ink-2" />
        <h1 className="text-[15px] font-semibold">Free music</h1>
        <span className="text-[13px] text-ink-3">Creative Commons music from Jamendo, free to stream</span>
      </div>

      {error?.kind === "missing-key" || error?.kind === "api" ? (
        <KeySetup
          message={error.kind === "api" ? error.message : undefined}
          onSaved={() => {
            cache.clear();
            setKeyVersion((v) => v + 1);
          }}
        />
      ) : (
        <>
          <div className="px-8 pt-4">
            <Tabs value={mood} onChange={setMood} items={MOODS.map((m) => ({ value: m.id, label: m.label }))} />
          </div>
          {error ? (
            <div className="px-8">
              <EmptyState title="Couldn't load free music" body={error.message} action={<Button onClick={() => setKeyVersion((v) => v + 1)}>Try again</Button>} />
            </div>
          ) : loading && !tracks.length ? (
            <p className="px-8 py-10 text-[13px] text-ink-3">Loading…</p>
          ) : (
            <div className={loading ? "opacity-50" : undefined}>
              <CollectionHeader
                kind="Jamendo"
                title={MOODS.find((m) => m.id === mood)!.label}
                meta={`${tracks.length} songs, all under Creative Commons licences`}
                artworkUrl={tracks[0]?.artworkUrl}
                tracks={tracks}
              />
              <div className="px-6">
                <TrackList tracks={tracks} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const KeySetup: React.FC<{ message?: string; onSaved: () => void }> = ({ message, onSaved }) => {
  const [value, setValue] = useState(getJamendoClientId());
  return (
    <div className="px-8 pt-10 max-w-lg">
      <h2 className="text-[20px] font-bold tracking-[-0.01em]">Connect Jamendo</h2>
      <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">
        Jamendo needs a free client ID. Create an app at the Jamendo developer portal, then paste its client ID here.
        It's stored on this computer only.
      </p>
      {message && <p className="mt-3 text-[13px] text-danger">{message}</p>}
      <form
        className="mt-5 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setJamendoClientId(value);
          onSaved();
        }}
      >
        <div className="flex-1">
          <TextField label="Client ID" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. a1b2c3d4" />
        </div>
        <Button variant="primary" type="submit" disabled={!value.trim()}>
          Connect
        </Button>
      </form>
      <Button variant="ghost" size="sm" className="mt-3 -ml-3" onClick={() => TauriBridge.openExternal("https://devportal.jamendo.com/")}>
        Open developer portal <ExternalLink className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};
