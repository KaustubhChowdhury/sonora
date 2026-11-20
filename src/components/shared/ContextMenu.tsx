import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Play,
  ListStart,
  ListEnd,
  Heart,
  ListPlus,
  ChevronRight,
  MicVocal,
  Disc3,
  ExternalLink,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";
import { TauriBridge } from "../../services/tauriBridge";
import { cn } from "../../lib/cn";

const Item: React.FC<{
  icon: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
  danger?: boolean;
  trailing?: React.ReactNode;
  onMouseEnter?: () => void;
}> = ({ icon, onClick, children, danger, trailing, onMouseEnter }) => (
  <button
    role="menuitem"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    className={cn(
      "w-full h-8 flex items-center gap-3 px-2.5 rounded-md text-left text-[13px] transition-colors",
      danger ? "text-danger hover:bg-danger/10" : "text-ink hover:bg-white/[0.07]"
    )}
  >
    <span className="w-4 h-4 shrink-0 text-ink-2 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
    <span className="flex-1 truncate">{children}</span>
    {trailing}
  </button>
);

const Divider = () => <div className="my-1 h-px bg-line" />;

export const ContextMenu: React.FC = () => {
  const { contextMenu, closeContextMenu, showToast, setInspectorTab, navigate, openNewPlaylist, activeRoute, selectedPlaylistId } =
    useUiStore();
  const { playTrack, addToQueue } = usePlayerStore();
  const { toggleTrackFavourite, favourites, customPlaylists, addTrackToCustomPlaylist, removeTrackFromCustomPlaylist } =
    useLibraryStore();
  const ref = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [submenu, setSubmenu] = useState(false);

  useEffect(() => {
    if (!contextMenu.isOpen) return;
    setSubmenu(false);
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && closeContextMenu();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeContextMenu();
    const onScroll = () => closeContextMenu();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [contextMenu.isOpen, contextMenu.x, contextMenu.y, closeContextMenu]);

  // Keep the menu on screen
  useLayoutEffect(() => {
    if (!contextMenu.isOpen || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({
      x: Math.max(8, Math.min(contextMenu.x, window.innerWidth - r.width - 8)),
      y: Math.max(8, Math.min(contextMenu.y, window.innerHeight - r.height - 8)),
    });
  }, [contextMenu.isOpen, contextMenu.x, contextMenu.y]);

  if (!contextMenu.isOpen || !contextMenu.track) return null;
  const track = contextMenu.track;
  const liked = favourites.some((f) => f.id === track.id);
  const inPlaylist =
    activeRoute === "playlists" &&
    selectedPlaylistId &&
    customPlaylists.find((p) => p.id === selectedPlaylistId)?.tracks.some((t) => t.id === track.id);

  const run = (fn: () => void) => () => {
    fn();
    closeContextMenu();
  };

  const externalUrl =
    track.providerId === "youtube" && track.youtubeVideoId
      ? `https://music.youtube.com/watch?v=${track.youtubeVideoId}`
      : track.providerId === "jiosaavn"
      ? `https://www.jiosaavn.com/search/song/${encodeURIComponent(`${track.title} ${track.artists[0] ?? ""}`)}`
      : null;

  const subLeft = pos.x + 232 + 220 > window.innerWidth;

  return (
    <div
      ref={ref}
      role="menu"
      style={{ top: pos.y, left: pos.x }}
      className="fixed z-[70] w-[232px] p-1 rounded-lg bg-surface-elevated border border-line-strong shadow-2xl shadow-black/50"
      onContextMenu={(e) => e.preventDefault()}
      onMouseOver={(e) => {
        // Close the playlist submenu when another item is hovered (not on mouseleave, which fires
        // while the pointer travels diagonally toward the submenu).
        if (submenu && !subRef.current?.contains(e.target as Node) && (e.target as HTMLElement).closest("[role=menuitem]")) setSubmenu(false);
      }}
    >
      <Item icon={<Play />} onClick={run(() => playTrack(track))}>
        Play
      </Item>
      <Item
        icon={<ListStart />}
        onClick={run(() => {
          addToQueue(track, true);
          showToast("Playing next");
        })}
      >
        Play next
      </Item>
      <Item
        icon={<ListEnd />}
        onClick={run(() => {
          addToQueue(track);
          showToast("Added to queue");
        })}
      >
        Add to queue
      </Item>
      <Divider />
      <Item icon={<Heart className={cn(liked && "fill-current text-signal")} />} onClick={run(() => toggleTrackFavourite(track))}>
        {liked ? "Remove from liked songs" : "Add to liked songs"}
      </Item>
      <div className="relative" ref={subRef}>
        <Item
          icon={<ListPlus />}
          onMouseEnter={() => setSubmenu(true)}
          onClick={() => setSubmenu(true)}
          trailing={<ChevronRight className="w-4 h-4 text-ink-3" />}
        >
          Add to playlist
        </Item>
        {submenu && (
          <div
            className={cn(
              "absolute top-[-4px] w-[220px] max-h-[300px] overflow-y-auto p-1 rounded-lg bg-surface-elevated border border-line-strong shadow-2xl shadow-black/50",
              subLeft ? "right-full mr-1" : "left-full ml-1"
            )}
          >
            <Item icon={<Plus />} onClick={run(() => openNewPlaylist([track]))}>
              New playlist
            </Item>
            {customPlaylists.length > 0 && <Divider />}
            {customPlaylists.map((pl) => (
              <Item
                key={pl.id}
                icon={<span />}
                onClick={run(() => {
                  const n = addTrackToCustomPlaylist(pl.id, track);
                  showToast(n ? `Added to “${pl.name}”` : `Already in “${pl.name}”`);
                })}
              >
                {pl.name}
              </Item>
            ))}
          </div>
        )}
      </div>
      {inPlaylist && (
        <Item
          icon={<Trash2 />}
          danger
          onClick={run(() => {
            removeTrackFromCustomPlaylist(selectedPlaylistId!, track.id);
            showToast("Removed from playlist");
          })}
        >
          Remove from this playlist
        </Item>
      )}
      <Divider />
      {track.artists[0] && (
        <Item icon={<MicVocal />} onClick={run(() => navigate("artist-detail", { artistId: `artist-${track.artists[0]}` }))}>
          Go to artist
        </Item>
      )}
      {track.albumId && (
        <Item icon={<Disc3 />} onClick={run(() => navigate("album-detail", { albumId: track.albumId }))}>
          Go to album
        </Item>
      )}
      <Item
        icon={<Info />}
        onClick={run(() => {
          if (usePlayerStore.getState().currentTrack?.id !== track.id) playTrack(track);
          setInspectorTab("track-info");
        })}
      >
        File and format details
      </Item>
      {externalUrl && (
        <Item icon={<ExternalLink />} onClick={run(() => TauriBridge.openExternal(externalUrl))}>
          Open in {track.providerId === "youtube" ? "YouTube Music" : "JioSaavn"}
        </Item>
      )}
    </div>
  );
};
