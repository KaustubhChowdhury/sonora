import React, { useState } from "react";
import {
  Search,
  Filter,
  Grid,
  List,
  ArrowUpDown,
  FolderPlus,
  RefreshCw,
  HardDrive,
  Trash2,
} from "lucide-react";
import { useLibraryStore } from "../../stores/libraryStore";
import { useUiStore } from "../../stores/uiStore";
import { TrackRow } from "../../components/shared/TrackRow";
import { AlbumCard } from "../../components/shared/AlbumCard";
import { ArtistCard } from "../../components/shared/ArtistCard";
import { TauriBridge } from "../../services/tauriBridge";

export const LibraryScreen: React.FC = () => {
  const {
    tracks,
    albums,
    artists,
    folders,
    history,
    scanStatus,
    activeView,
    setActiveView,
    viewMode,
    setViewMode,
    sourceFilter,
    setSourceFilter,
    qualityFilter,
    setQualityFilter,
    sortBy,
    sortOrder,
    setSort,
    setScanStatus,
    addTracks,
    removeFolder,
  } = useLibraryStore();

  const { showToast } = useUiStore();
  const [filterQuery, setFilterQuery] = useState("");

  // Filter tracks
  let filteredTracks = tracks.filter((t) => {
    // Text search
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchArtist = t.artists.some((a) => a.toLowerCase().includes(q));
      const matchAlbum = t.album?.toLowerCase().includes(q);
      if (!matchTitle && !matchArtist && !matchAlbum) return false;
    }

    // Source filter
    if (sourceFilter !== "all" && t.sourceKind !== sourceFilter) {
      return false;
    }

    // Quality filter
    if (qualityFilter === "lossless") {
      const isLossless = ["FLAC", "WAV", "ALAC"].includes(t.codec?.toUpperCase() || "");
      if (!isLossless) return false;
    } else if (qualityFilter === "hires") {
      const isHiRes = (t.sampleRate || 0) > 48000 || (t.bitDepth || 0) > 16;
      if (!isHiRes) return false;
    }

    // Favourites view
    if (activeView === "favourites" && !t.isFavourite) {
      return false;
    }

    return true;
  });

  // Sort tracks
  filteredTracks.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "title") cmp = a.title.localeCompare(b.title);
    else if (sortBy === "artist") cmp = (a.artists[0] || "").localeCompare(b.artists[0] || "");
    else if (sortBy === "album") cmp = (a.album || "").localeCompare(b.album || "");
    else if (sortBy === "duration") cmp = a.durationMs - b.durationMs;
    else if (sortBy === "year") cmp = (a.year || 0) - (b.year || 0);

    return sortOrder === "asc" ? cmp : -cmp;
  });

  const handleManualScan = async (folderPath: string) => {
    setScanStatus({ isScanning: true, currentFolder: folderPath });
    showToast(`Scanning "${folderPath}"...`);
    const res = await TauriBridge.scanFolder(folderPath);
    setScanStatus({
      isScanning: false,
      scannedFiles: res.scannedFiles,
      totalCandidates: res.totalCandidates,
      errorCount: res.errorCount,
      errors: res.errors,
    });
    // Reload tracks from database
    const refreshed = await TauriBridge.getLibraryTracks();
    addTracks(refreshed);
    showToast(`Scan complete: ${res.scannedFiles} tracks indexed`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Subheader: Views, Filters & Search */}
      <div className="px-8 pt-6 pb-4 border-b border-white/[0.06] space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-surface-muted/60 p-1 rounded-xl border border-white/[0.04]">
            {(
              [
                { id: "songs", label: "Tracks" },
                { id: "albums", label: "Albums" },
                { id: "artists", label: "Artists" },
                { id: "folders", label: "Folders" },
                { id: "favourites", label: "Favourites" },
                { id: "history", label: "History" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeView === tab.id
                    ? "bg-purple-600/30 text-purple-300 font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          {activeView === "albums" && (
            <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-white/[0.04]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${
                  viewMode === "grid" ? "bg-white/10 text-white" : "text-zinc-500"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${
                  viewMode === "list" ? "bg-white/10 text-white" : "text-zinc-500"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4">
          {/* Quick search inside current view */}
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter in library..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-muted border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Source & Quality filter tags */}
          <div className="flex items-center gap-2 text-xs">
            {/* Source */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="bg-surface-muted border border-white/[0.06] rounded-xl px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none"
            >
              <option value="all">All Sources</option>
              <option value="local">Local Files</option>
              <option value="jamendo">Jamendo CC</option>
              <option value="navidrome">Personal Server</option>
            </select>

            {/* Quality */}
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value as any)}
              className="bg-surface-muted border border-white/[0.06] rounded-xl px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none"
            >
              <option value="all">All Formats</option>
              <option value="lossless">Lossless Only (FLAC/WAV/ALAC)</option>
              <option value="hires">Hi-Res Only (24-bit / &gt;48kHz)</option>
            </select>

            {/* Sort */}
            <button
              onClick={() => setSort(sortBy)}
              title={`Sorted by ${sortBy} (${sortOrder})`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-muted border border-white/[0.06] text-zinc-300 hover:text-white"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <span className="capitalize">{sortBy}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* SONGS / TRACKS VIEW */}
        {(activeView === "songs" || activeView === "favourites") && (
          <div className="space-y-1">
            {/* Table Header */}
            <div className="grid grid-cols-[36px_1fr_1fr_120px_140px_70px] items-center px-3 pb-2 text-[11px] font-mono uppercase font-semibold text-zinc-500 border-b border-white/[0.05]">
              <span className="text-center">#</span>
              <span
                onClick={() => setSort("title")}
                className="cursor-pointer hover:text-zinc-300"
              >
                Title
              </span>
              <span
                onClick={() => setSort("album")}
                className="cursor-pointer hover:text-zinc-300"
              >
                Album
              </span>
              <span>Source</span>
              <span>Format Spec</span>
              <span className="text-right">Duration</span>
            </div>

            {filteredTracks.length === 0 ? (
              <div className="py-20 text-center text-xs text-zinc-500">
                No tracks match the selected filters.
              </div>
            ) : (
              filteredTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  playlistContext={filteredTracks}
                />
              ))
            )}
          </div>
        )}

        {/* ALBUMS VIEW */}
        {activeView === "albums" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}

        {/* ARTISTS VIEW */}
        {activeView === "artists" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        )}

        {/* FOLDERS VIEW */}
        {activeView === "folders" && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-white">Monitored Music Folders</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sonora reads audio tags and embedded artwork locally. Files never leave your device.
                </p>
              </div>

              <button
                onClick={async () => {
                  const path = prompt("Enter full folder path to scan (e.g. C:\\Music):");
                  if (path && path.trim()) {
                    useLibraryStore.getState().addFolder(path.trim());
                    handleManualScan(path.trim());
                  }
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Add Folder</span>
              </button>
            </div>

            {/* Scan Status banner if active */}
            {scanStatus.isScanning && (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                  <div>
                    <p className="text-xs font-semibold text-white">Scanning Library...</p>
                    <p className="text-[11px] text-zinc-400">
                      Processing: {scanStatus.currentFolder}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-purple-300">
                  {scanStatus.scannedFiles} files indexed
                </span>
              </div>
            )}

            <div className="space-y-3">
              {folders.map((folder) => (
                <div
                  key={folder}
                  className="flex items-center justify-between p-4 rounded-2xl bg-surface-muted/50 border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <HardDrive className="w-5 h-5 text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-zinc-200 truncate">{folder}</p>
                      <p className="text-[11px] text-zinc-500">Recursive scan enabled</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleManualScan(folder)}
                      title="Rescan this folder now"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-xs text-zinc-300 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Rescan</span>
                    </button>
                    <button
                      onClick={() => removeFolder(folder)}
                      title="Remove folder"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY VIEW */}
        {activeView === "history" && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-semibold text-zinc-500 font-mono mb-3">
              Playback Activity Log
            </h3>
            {history.length === 0 ? (
              <div className="py-20 text-center text-xs text-zinc-500">
                No listening history recorded yet.
              </div>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-muted/30 border border-white/[0.04] text-xs"
                >
                  <div className="flex items-center gap-3">
                    {entry.artworkUrl ? (
                      <img
                        src={entry.artworkUrl}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover bg-zinc-800"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-mono text-zinc-600">
                        ♪
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-zinc-100">{entry.title}</p>
                      <p className="text-zinc-400 text-[11px]">{entry.artist}</p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px] text-zinc-500">
                    <p>{new Date(entry.playedAt).toLocaleTimeString()}</p>
                    <p>{Math.round(entry.completionRatio * 100)}% listened</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
