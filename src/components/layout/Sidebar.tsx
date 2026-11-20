import React from "react";
import {
  Home,
  Compass,
  Music2,
  Disc3,
  MicVocal,
  Heart,
  History,
  FolderOpen,
  SlidersHorizontal,
  Settings,
  Plus,
  ListMusic,
} from "lucide-react";
import { YoutubeIcon } from "../shared/ProviderIcons";
import { useUiStore, AppRoute } from "../../stores/uiStore";
import { useLibraryStore, LibraryView } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { cn } from "../../lib/cn";
import { EqBars } from "../ui/primitives";

const SaavnGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.25" />
    <path d="M10.5 5.75c-.6-.6-1.5-.9-2.5-.9-1.3 0-2.2.7-2.2 1.6 0 2 4.6 1.2 4.6 3.3 0 1-.9 1.7-2.4 1.7-1 0-1.9-.3-2.6-1" strokeLinecap="round" />
  </svg>
);

export const Sidebar: React.FC = () => {
  const { activeRoute, navigate, selectedPlaylistId, openNewPlaylist } = useUiStore();
  const { customPlaylists, activeView, setActiveView, favourites } = useLibraryStore();
  const { currentTrack, isPlaying } = usePlayerStore();

  const Item: React.FC<{
    label: string;
    icon: React.ReactNode;
    route: AppRoute;
    view?: LibraryView;
    meta?: React.ReactNode;
  }> = ({ label, icon, route, view, meta }) => {
    const active = activeRoute === route && (!view || activeView === view);
    return (
      <button
        onClick={() => {
          if (view) setActiveView(view);
          navigate(route);
        }}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative w-full h-8 flex items-center gap-3 pl-3 pr-2 rounded-md text-[13px] text-left transition-colors",
          active ? "bg-white/[0.08] text-ink font-semibold" : "text-ink-2 hover:text-ink hover:bg-white/[0.04]"
        )}
      >
        {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-signal" />}
        <span className={cn("w-4 h-4 shrink-0 [&>svg]:w-4 [&>svg]:h-4", active ? "text-ink" : "text-ink-3")}>{icon}</span>
        <span className="truncate flex-1">{label}</span>
        {meta}
      </button>
    );
  };

  const Group: React.FC<{ title?: string; children: React.ReactNode; action?: React.ReactNode }> = ({
    title,
    children,
    action,
  }) => (
    <div className="mt-5 first:mt-0">
      {title && (
        <div className="flex items-center justify-between pl-3 pr-1 mb-1 h-6">
          <span className="text-[12px] font-medium text-ink-3">{title}</span>
          {action}
        </div>
      )}
      <div className="flex flex-col gap-px">{children}</div>
    </div>
  );

  return (
    <aside className="w-[220px] shrink-0 flex flex-col min-h-0 pl-3 pr-2 pb-3">
      <div className="h-9 flex items-center gap-2 pl-3 mb-3">
        <Wordmark />
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
        <Group>
          <Item label="Home" icon={<Home />} route="home" />
          <Item label="Free music" icon={<Compass />} route="explore" />
        </Group>

        <Group title="Streaming">
          <Item label="JioSaavn" icon={<SaavnGlyph />} route="jiosaavn" />
          <Item label="YouTube" icon={<YoutubeIcon />} route="youtube" />
        </Group>

        <Group title="Your music">
          <Item label="Songs" icon={<Music2 />} route="library" view="songs" />
          <Item label="Albums" icon={<Disc3 />} route="library" view="albums" />
          <Item label="Artists" icon={<MicVocal />} route="library" view="artists" />
          <Item
            label="Liked songs"
            icon={<Heart />}
            route="library"
            view="favourites"
            meta={favourites.length > 0 ? <span className="text-[12px] text-ink-3 tnum">{favourites.length}</span> : null}
          />
          <Item label="History" icon={<History />} route="library" view="history" />
          <Item label="Folders" icon={<FolderOpen />} route="library" view="folders" />
        </Group>

        <Group
          title="Playlists"
          action={
            <button
              onClick={() => openNewPlaylist()}
              title="New playlist"
              aria-label="New playlist"
              className="w-6 h-6 rounded-md flex items-center justify-center text-ink-3 hover:text-ink hover:bg-white/[0.06]"
            >
              <Plus className="w-4 h-4" />
            </button>
          }
        >
          {customPlaylists.length === 0 ? (
            <button
              onClick={() => openNewPlaylist()}
              className="text-left pl-3 py-1.5 text-[12px] text-ink-3 hover:text-ink-2"
            >
              Create your first playlist
            </button>
          ) : (
            customPlaylists.map((pl) => {
              const active = activeRoute === "playlists" && selectedPlaylistId === pl.id;
              const playingHere = !!currentTrack && pl.tracks.some((t) => t.id === currentTrack.id);
              return (
                <button
                  key={pl.id}
                  onClick={() => navigate("playlists", { playlistId: pl.id })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative w-full h-8 flex items-center gap-3 pl-3 pr-2 rounded-md text-[13px] text-left transition-colors",
                    active ? "bg-white/[0.08] text-ink font-semibold" : "text-ink-2 hover:text-ink hover:bg-white/[0.04]"
                  )}
                >
                  {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-signal" />}
                  <ListMusic className={cn("w-4 h-4 shrink-0", active ? "text-ink" : "text-ink-3")} />
                  <span className="truncate flex-1">{pl.name}</span>
                  {playingHere && <EqBars playing={isPlaying} />}
                </button>
              );
            })
          )}
        </Group>
      </nav>

      <div className="pt-3 mt-2 border-t border-line flex flex-col gap-px">
        <Item label="Sound" icon={<SlidersHorizontal />} route="audio-studio" />
        <Item label="Settings" icon={<Settings />} route="settings" />
      </div>
    </aside>
  );
};

/** The mark is a quarter-note stem cut from a circle; the name is set in the UI face. */
const Wordmark: React.FC = () => (
  <div className="flex items-center gap-2 select-none" data-tauri-drag-region>
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="8" fill="var(--color-signal)" />
      <path d="M10.5 4.5v6.2a2.3 2.3 0 1 1-1.4-2.1V4.5h1.4z" fill="var(--color-signal-ink)" />
    </svg>
    <span className="text-[15px] font-bold tracking-[-0.01em] text-ink" data-tauri-drag-region>
      Sonora
    </span>
  </div>
);
