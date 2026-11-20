import React, { useState } from "react";
import { ListMusic, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useLibraryStore } from "../../stores/libraryStore";
import { useUiStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { CollectionHeader, Mosaic } from "../../components/shared/CollectionHeader";
import { TrackList } from "../../components/shared/TrackRow";
import { MediaTile, TileGrid } from "../../components/shared/MediaTile";
import { Button, Dialog, EmptyState, IconButton, NameDialog, PageHeader } from "../../components/ui/primitives";
import { formatLongDuration, plural } from "../../lib/format";

export const PlaylistsScreen: React.FC = () => {
  const { selectedPlaylistId } = useUiStore();
  return selectedPlaylistId ? <PlaylistDetail id={selectedPlaylistId} /> : <PlaylistIndex />;
};

const PlaylistIndex: React.FC = () => {
  const { customPlaylists } = useLibraryStore();
  const { navigate, openNewPlaylist } = useUiStore();
  return (
    <div className="flex-1 overflow-y-auto px-8 pb-16">
      <PageHeader title="Playlists" actions={<Button onClick={() => openNewPlaylist()}>New playlist</Button>} />
      {customPlaylists.length === 0 ? (
        <EmptyState
          icon={<ListMusic className="w-6 h-6" />}
          title="No playlists yet"
          body="Create one here, or right-click any song and choose “Add to playlist”."
          action={<Button variant="primary" onClick={() => openNewPlaylist()}>New playlist</Button>}
        />
      ) : (
        <TileGrid>
          {customPlaylists.map((pl) => (
            <MediaTile
              key={pl.id}
              title={pl.name}
              subtitle={pl.tracks.length ? plural(pl.tracks.length, "song") : "Empty"}
              artworkUrl={pl.tracks.find((t) => t.artworkUrl)?.artworkUrl}
              onOpen={() => navigate("playlists", { playlistId: pl.id })}
              onPlay={pl.tracks.length ? () => usePlayerStore.getState().playTrack(pl.tracks[0], pl.tracks) : undefined}
            />
          ))}
        </TileGrid>
      )}
    </div>
  );
};

const PlaylistDetail: React.FC<{ id: string }> = ({ id }) => {
  const pl = useLibraryStore((s) => s.customPlaylists.find((p) => p.id === id));
  const { renameCustomPlaylist, deleteCustomPlaylist } = useLibraryStore();
  const { navigate, showToast } = useUiStore();
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!pl) {
    return (
      <div className="px-8">
        <EmptyState
          title="This playlist no longer exists"
          action={<Button onClick={() => navigate("playlists")}>See all playlists</Button>}
        />
      </div>
    );
  }

  const total = pl.tracks.reduce((s, t) => s + t.durationMs, 0);

  return (
    <div className="flex-1 overflow-y-auto pb-16">
      <CollectionHeader
        kind="Playlist"
        title={pl.name}
        description={pl.description}
        artwork={<Mosaic tracks={pl.tracks} className="w-[184px] h-[184px]" />}
        meta={pl.tracks.length ? `${plural(pl.tracks.length, "song")}, ${formatLongDuration(total)}` : "No songs yet"}
        tracks={pl.tracks}
        actions={
          <div className="relative">
            <IconButton label="Playlist options" className="w-10 h-10" onClick={() => setMenu((m) => !m)}>
              <MoreHorizontal className="w-5 h-5" />
            </IconButton>
            {menu && (
              <div
                className="absolute left-0 top-full mt-1 z-20 w-48 p-1 rounded-lg bg-surface-elevated border border-line-strong shadow-2xl shadow-black/50"
                onMouseLeave={() => setMenu(false)}
              >
                <button
                  onClick={() => {
                    setMenu(false);
                    setRenaming(true);
                  }}
                  className="w-full h-8 px-2.5 flex items-center gap-3 rounded-md text-[13px] hover:bg-white/[0.07]"
                >
                  <Pencil className="w-4 h-4 text-ink-2" /> Rename
                </button>
                <button
                  onClick={() => {
                    setMenu(false);
                    setConfirmDelete(true);
                  }}
                  className="w-full h-8 px-2.5 flex items-center gap-3 rounded-md text-[13px] text-danger hover:bg-danger/10"
                >
                  <Trash2 className="w-4 h-4" /> Delete playlist
                </button>
              </div>
            )}
          </div>
        }
      />

      <div className="px-6">
        {pl.tracks.length === 0 ? (
          <EmptyState
            className="px-2"
            title="Add songs to this playlist"
            body="Right-click any song in search results, your library or the queue, then choose “Add to playlist”."
            action={<Button onClick={() => navigate("search")}>Search for songs</Button>}
          />
        ) : (
          <TrackList tracks={pl.tracks} />
        )}
      </div>

      <NameDialog
        open={renaming}
        title="Rename playlist"
        confirmLabel="Rename"
        initial={pl.name}
        onClose={() => setRenaming(false)}
        onConfirm={(name) => renameCustomPlaylist(pl.id, name)}
      />
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title={`Delete “${pl.name}”?`}>
        <p className="text-[13px] text-ink-2 pt-1">
          The playlist is removed. The songs in it stay in your library and search results.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-danger text-white hover:bg-danger/90"
            onClick={() => {
              deleteCustomPlaylist(pl.id);
              setConfirmDelete(false);
              showToast(`Deleted “${pl.name}”`);
              navigate("playlists");
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
