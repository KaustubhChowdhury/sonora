import React, { useMemo, useState } from "react";
import { FolderOpen, FolderPlus, Heart, RefreshCw, Search, Trash2 } from "lucide-react";
import { useLibraryStore, SortKey, albumIdFor } from "../../stores/libraryStore";
import { useUiStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { TrackList } from "../../components/shared/TrackRow";
import { CollectionHeader } from "../../components/shared/CollectionHeader";
import { MediaTile, TileGrid } from "../../components/shared/MediaTile";
import { Button, EmptyState, IconButton, PageHeader } from "../../components/ui/primitives";
import { addFolderWithPicker, removeFolder, scanFolder } from "../../services/libraryActions";
import { formatLongDuration, plural } from "../../lib/format";
import { Track } from "../../types/music";

export const LibraryScreen: React.FC = () => {
  const view = useLibraryStore((s) => s.activeView);
  switch (view) {
    case "albums":
      return <AlbumsView />;
    case "artists":
      return <ArtistsView />;
    case "favourites":
      return <LikedView />;
    case "history":
      return <HistoryView />;
    case "folders":
      return <FoldersView />;
    default:
      return <SongsView />;
  }
};

const NoLibrary: React.FC = () => (
  <EmptyState
    icon={<FolderOpen className="w-6 h-6" />}
    title="Your library is empty"
    body="Add a folder of music files. Sonora reads FLAC, WAV, ALAC, MP3, AAC, Ogg and Opus, and keeps everything on this computer."
    action={
      <Button variant="primary" onClick={addFolderWithPicker}>
        <FolderPlus className="w-4 h-4" /> Add a music folder
      </Button>
    }
  />
);

const SORTS: { value: SortKey; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "artist", label: "Artist" },
  { value: "album", label: "Album" },
  { value: "year", label: "Year" },
  { value: "duration", label: "Length" },
];

function sortTracks(list: Track[], by: SortKey, order: "asc" | "desc") {
  const cmp = (a: Track, b: Track) => {
    switch (by) {
      case "artist":
        return (a.artists[0] || "").localeCompare(b.artists[0] || "") || (a.album || "").localeCompare(b.album || "") || (a.trackNumber || 0) - (b.trackNumber || 0);
      case "album":
        return (a.album || "").localeCompare(b.album || "") || (a.discNumber || 0) - (b.discNumber || 0) || (a.trackNumber || 0) - (b.trackNumber || 0);
      case "year":
        return (a.year || 0) - (b.year || 0);
      case "duration":
        return a.durationMs - b.durationMs;
      default:
        return a.title.localeCompare(b.title);
    }
  };
  const sorted = [...list].sort(cmp);
  return order === "asc" ? sorted : sorted.reverse();
}

const FilterBar: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string; children?: React.ReactNode }> = ({
  value,
  onChange,
  placeholder,
  children,
}) => (
  <div className="flex items-center gap-3 px-8 pb-4">
    <label className="relative w-60">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full h-8 pl-9 pr-3 rounded-full bg-white/[0.06] text-[13px] placeholder:text-ink-3 focus:outline-none focus:bg-white/[0.09]"
      />
    </label>
    {children}
  </div>
);

const SongsView: React.FC = () => {
  const { tracks, sortBy, sortOrder, setSort } = useLibraryStore();
  const [filter, setFilter] = useState("");
  const list = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const base = q
      ? tracks.filter((t) => t.title.toLowerCase().includes(q) || t.artists.some((a) => a.toLowerCase().includes(q)) || t.album?.toLowerCase().includes(q))
      : tracks;
    return sortTracks(base, sortBy, sortOrder);
  }, [tracks, filter, sortBy, sortOrder]);
  const total = tracks.reduce((s, t) => s + t.durationMs, 0);

  if (!tracks.length)
    return (
      <div className="flex-1 overflow-y-auto px-8">
        <PageHeader title="Songs" />
        <NoLibrary />
      </div>
    );

  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <CollectionHeader
        kind="Your library"
        title="Songs"
        meta={`${plural(tracks.length, "song")}, ${formatLongDuration(total)}`}
        artworkUrl={tracks.find((t) => t.artworkUrl)?.artworkUrl}
        tracks={list}
      />
      <FilterBar value={filter} onChange={setFilter} placeholder="Filter songs">
        <label className="flex items-center gap-2 text-[12px] text-ink-3 ml-auto">
          Sort by
          <select
            value={sortBy}
            onChange={(e) => setSort(e.target.value as SortKey, "asc")}
            className="h-8 px-2 rounded-md bg-white/[0.06] text-[13px] text-ink focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-surface-elevated">
                {s.label}
              </option>
            ))}
          </select>
          <Button size="sm" variant="ghost" onClick={() => setSort(sortBy, sortOrder === "asc" ? "desc" : "asc")}>
            {sortOrder === "asc" ? "A → Z" : "Z → A"}
          </Button>
        </label>
      </FilterBar>
      <div className="px-6">
        {list.length ? <TrackList tracks={list} /> : <p className="px-2 py-6 text-[13px] text-ink-2">No songs match “{filter}”.</p>}
      </div>
    </div>
  );
};

const AlbumsView: React.FC = () => {
  const { albums, tracks } = useLibraryStore();
  const { navigate } = useUiStore();
  const [filter, setFilter] = useState("");
  const list = albums
    .filter((a) => !filter || `${a.title} ${a.artist}`.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => a.artist.localeCompare(b.artist) || (a.year || 0) - (b.year || 0));
  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <PageHeader className="px-8" title="Albums" subtitle={albums.length ? plural(albums.length, "album") : undefined} />
      {!albums.length ? (
        <div className="px-8">
          <NoLibrary />
        </div>
      ) : (
        <>
          <FilterBar value={filter} onChange={setFilter} placeholder="Filter albums" />
          <div className="px-8">
            <TileGrid>
              {list.map((a) => {
                const albumTracks = tracks.filter((t) => (t.albumId || `album-${t.artists[0] || "Unknown artist"}\u0000${t.album || "Unknown album"}`) === a.id);
                return (
                  <MediaTile
                    key={a.id}
                    title={a.title}
                    subtitle={[a.artist, a.year].filter(Boolean).join(" · ")}
                    artworkUrl={a.artworkUrl}
                    onOpen={() => navigate("album-detail", { albumId: a.id })}
                    onPlay={albumTracks.length ? () => usePlayerStore.getState().playTrack(albumTracks[0], albumTracks) : undefined}
                  />
                );
              })}
            </TileGrid>
          </div>
        </>
      )}
    </div>
  );
};

const ArtistsView: React.FC = () => {
  const { artists } = useLibraryStore();
  const { navigate } = useUiStore();
  const [filter, setFilter] = useState("");
  const list = artists.filter((a) => !filter || a.name.toLowerCase().includes(filter.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <PageHeader className="px-8" title="Artists" subtitle={artists.length ? plural(artists.length, "artist") : undefined} />
      {!artists.length ? (
        <div className="px-8">
          <NoLibrary />
        </div>
      ) : (
        <>
          <FilterBar value={filter} onChange={setFilter} placeholder="Filter artists" />
          <div className="px-8">
            <TileGrid>
              {list.map((a) => (
                <MediaTile
                  key={a.id}
                  round
                  title={a.name}
                  subtitle={plural(a.trackCount, "song")}
                  artworkUrl={a.artworkUrl}
                  onOpen={() => navigate("artist-detail", { artistId: a.id })}
                />
              ))}
            </TileGrid>
          </div>
        </>
      )}
    </div>
  );
};

const LikedView: React.FC = () => {
  const { favourites } = useLibraryStore();
  const total = favourites.reduce((s, t) => s + t.durationMs, 0);
  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <CollectionHeader
        kind="Playlist"
        title="Liked songs"
        artwork={
          <div className="w-[184px] h-[184px] rounded-lg bg-signal flex items-center justify-center shadow-xl shadow-black/40">
            <Heart className="w-16 h-16 text-signal-ink fill-current" />
          </div>
        }
        meta={favourites.length ? `${plural(favourites.length, "song")}, ${formatLongDuration(total)}` : undefined}
        tracks={favourites}
      />
      <div className="px-6">
        {favourites.length ? (
          <TrackList tracks={favourites} />
        ) : (
          <EmptyState className="px-2" title="Songs you like will appear here" body="Click the heart next to any song, from search, your library or the player bar." />
        )}
      </div>
    </div>
  );
};

const HistoryView: React.FC = () => {
  const { recentlyPlayed, clearRecentlyPlayed } = useLibraryStore();
  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <PageHeader
        className="px-8"
        title="Recently played"
        actions={recentlyPlayed.length ? <Button variant="ghost" size="sm" onClick={clearRecentlyPlayed}>Clear history</Button> : null}
      />
      <div className="px-6">
        {recentlyPlayed.length ? (
          <TrackList tracks={recentlyPlayed} />
        ) : (
          <EmptyState className="px-2" title="Nothing played yet" body="The last 30 songs you play show up here." />
        )}
      </div>
    </div>
  );
};

const FoldersView: React.FC = () => {
  const { folders, scanStatus, tracks } = useLibraryStore();
  return (
    <div className="flex-1 overflow-y-auto px-8 pb-16">
      <PageHeader
        title="Folders"
        subtitle="Sonora reads the tags and artwork from these folders. Your files stay where they are."
        actions={
          <Button variant="primary" onClick={addFolderWithPicker} disabled={scanStatus.isScanning}>
            <FolderPlus className="w-4 h-4" /> Add folder
          </Button>
        }
      />
      {scanStatus.isScanning && (
        <p className="mb-4 text-[13px] text-ink-2">
          Scanning {scanStatus.currentFolder}… <span className="text-ink-3">this can take a minute for large folders.</span>
        </p>
      )}
      {!scanStatus.isScanning && scanStatus.errors.length > 0 && (
        <p className="mb-4 text-[13px] text-danger">
          {plural(scanStatus.errors.length, "file")} couldn't be read. {scanStatus.errors[0]}
        </p>
      )}
      {folders.length === 0 ? (
        <NoLibrary />
      ) : (
        <ul className="max-w-3xl border-t border-line">
          {folders.map((f) => {
            const count = tracks.filter((t) => t.path?.toLowerCase().startsWith(f.toLowerCase())).length;
            return (
              <li key={f} className="group flex items-center gap-4 h-14 border-b border-line">
                <FolderOpen className="w-5 h-5 text-ink-3 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink truncate select-text">{f}</p>
                  <p className="text-[12px] text-ink-3">{plural(count, "song")}</p>
                </div>
                <IconButton label="Scan again" onClick={() => scanFolder(f)} disabled={scanStatus.isScanning}>
                  <RefreshCw className="w-4 h-4" />
                </IconButton>
                <IconButton label="Remove folder" onClick={() => removeFolder(f)} className="hover:text-danger">
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
