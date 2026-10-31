# Sonora

<p align="center">
  <strong>A premium, local-first Windows music player with audiophile-grade playback, transparent format inspection, and lawful music discovery.</strong>
</p>

---

## 🎧 Overview

**Sonora** combines the speed and reliability of a dedicated desktop library player with the visual refinement, ambient artwork, and discoverability of a modern streaming client.

Built strictly in adherence with the **Sonora Product Requirements Document** and the **Desktop Music App Research Blueprint**, Sonora is:
1. **Local-First**: Complete playback, library indexing, playlist management, queueing, favourites, and settings work offline without an account or internet connection.
2. **Audiophile-Grade & Format-Transparent**: Exposes verified source codec, sample rate, bit depth, channels, and negotiated WASAPI endpoint output. Offers a dedicated **Audio Studio** with both standard Windows Shared output and an explicit **WASAPI Exclusive / Bit-Perfect** mode with strict DSP bypass.
3. **Rights-Aware & Modular**: Integrates discovery only through permitted and documented paths (Jamendo API v3 for Creative Commons discovery, Navidrome / Subsonic for personal server streaming, and official handoffs for commercial catalogues). **Zero unofficial scraping or reverse-engineered endpoints.**

---

## 🏛️ System Architecture

```text
React 19 + TypeScript + Vite + Tailwind CSS 4 (Tauri 2 Desktop Shell)
  │
  ├── UI Shell & Stores (Zustand: Player, Library, Audio Studio, UI, Providers)
  │     ├── Left Navigation Rail (Home, Search, Library, Playlists, Explore, Audio Studio, Settings)
  │     ├── Responsive Workspace (Cards, sortable track tables, hero headers)
  │     ├── Collapsible Inspector (Queue, Synced / Plain Lyrics, Audio Diagnostics)
  │     ├── Persistent Mini-Player (Transport, Seekbar, Volume, Format Badges, Studio Shortcut)
  │     └── Immersive Full-Player (Dynamic ambient blur backdrop, hero artwork, synced lyrics)
  │
  └── Rust Application Core (Tauri 2 IPC, Tokio, Rusqlite, CPAL, Symphonia, Lofty)
        ├── Audio Engine: Symphonia multi-format decoding (FLAC, WAV, MP3, ALAC, AAC, Vorbis, Opus)
        ├── Direct WASAPI Output: Shared Mode & Exclusive Bit-Perfect stream negotiation
        ├── DSP Pipeline: 10-Band Graphic EQ (RBJ IIR Peaking filters), Preamp gain, ReplayGain, Soft Limiter
        ├── Local Storage: SQLite embedded database with WAL mode and indexing
        ├── Library Scanner: Lofty tag and embedded artwork extraction, recursive directory walker
        ├── Metadata & Lyrics: LRCLIB API integration, local sidecar .lrc resolver
        └── Providers: Jamendo v3 CC API, Subsonic / Navidrome Personal Server adapter
```

---

## ✨ Features

- **Multi-Format Native Decoding**: Pure Rust demuxing and decoding via Symphonia for FLAC, WAV (PCM), MP3, AAC-LC, ALAC, Vorbis, and Opus.
- **Audio Studio**:
  - Endpoint device selector (enumerates all Windows WASAPI devices).
  - Mode switch: **Shared Mode** (friendly everyday Windows mixing) vs **Exclusive / Bit-Perfect Mode** (hardware DAC takeover, silences system sounds, strict DSP bypass).
  - 10-Band Equalizer (31 Hz, 63 Hz, 125 Hz, 250 Hz, 500 Hz, 1 kHz, 2 kHz, 4 kHz, 8 kHz, 16 kHz) with audiophile presets.
  - Preamp gain (-12 dB to +12 dB) and soft limiting.
  - ReplayGain loudness normalization.
  - Real-time diagnostics: buffer underrun counter, estimated latency, negotiated format.
- **Asynchronous Incremental Library**:
  - Scan multiple directory roots concurrently.
  - Lofty metadata reader: Title, Artist, Album, Year, Genre, Track Number, Disc Number, and embedded cover art extraction to local thumbnail cache.
  - SQLite persistent catalogue with full indexing.
- **Queue & Playlists**:
  - Persistent queue with drag/drop reordering, remove with undo, clear, and "Save as Playlist".
  - User-created playlists and auto-curated Smart Playlists (*Lossless Master Vault*, *Recently Added*).
- **Synchronized Lyrics**:
  - Priority resolution: Local sidecar `.lrc` files → Embedded tags → LRCLIB API.
  - Interactive auto-scrolling lyrics highlighted synchronously with playback timestamp.
- **Lawful Discovery**:
  - Jamendo API v3 integration with Creative Commons license preservation and artist attribution.
  - Navidrome / Subsonic personal server integration for self-hosted home music collections.
  - "Open in Provider" official handoff links for Spotify, YouTube Music, and JioSaavn.
- **Desktop Ergonomics**:
  - Global keyboard shortcuts (`Space` = Play/Pause, `←`/`→` = Seek 5s, `↑`/`↓` = Volume 5%, `Ctrl+Q` = Queue, `Ctrl+L` = Lyrics, `Ctrl+E` = Audio Studio).
  - Floating track context menu.
  - Exportable diagnostics bundle.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24)
- Rust 1.77+ (Cargo 1.99+)
- Windows 10 / Windows 11 with WebView2

### Development

```bash
# Install frontend dependencies
npm install

# Run frontend in development mode
npm run dev

# Run full desktop application with Tauri
npm run tauri dev
```

### Production Build

```bash
# Build frontend web assets
npm run build

# Build signed Windows application installer (.msi / .exe)
npm run tauri build
```

---

## 📜 License

Sonora is released under the MIT License.
Third-party libraries used: Symphonia (MPL-2.0), Lofty (MIT/Apache-2.0), CPAL (Apache-2.0), Rusqlite (MIT), Tauri 2 (MIT/Apache-2.0).
