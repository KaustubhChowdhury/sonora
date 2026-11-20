# Sonora

A desktop music player for Windows that plays your own files and streams from JioSaavn, YouTube, Jamendo and your own Subsonic/Navidrome server, all in one library, queue and set of playlists.

Built with Tauri 2 (Rust) and React.

## Features

- **Your files**: add folders and Sonora reads tags and cover art from FLAC, WAV, ALAC, MP3, AAC, Ogg and Opus. Files stay where they are.
- **Native audio engine** (Rust, Symphonia + WASAPI) for local files, with a Shared mode and a bit-perfect Exclusive mode.
- **Streaming**: search and play JioSaavn and YouTube, free Creative Commons music from Jamendo, and your own Subsonic-compatible server.
- **Playlists and liked songs** that mix local and streamed tracks. Everything is saved on your computer.
- **10-band equalizer** and preamp, applied to both local files and streams, plus a loudness/bass/clarity boost with a limiter for quiet streams.
- **Synced lyrics** from `.lrc` files next to your songs or from LRCLIB.
- **Queue** with drag-to-reorder, play next, and save-as-playlist.
- The interface takes its colour from the album art of whatever is playing.

## Keyboard shortcuts

| Action | Keys |
| --- | --- |
| Play / pause | `Space` |
| Next / previous song | `Ctrl` `→` / `Ctrl` `←` |
| Skip forward / back 5 s | `Shift` `→` / `Shift` `←` |
| Volume up / down | `Ctrl` `↑` / `Ctrl` `↓` |
| Mute | `M` |
| Search | `Ctrl` `K` |
| Queue / lyrics | `Ctrl` `Q` / `Ctrl` `L` |
| Go back | `Alt` `←` |

## Getting started

### Requirements

- Windows 10 or 11 with WebView2
- Node.js 18+
- Rust (stable) with the MSVC toolchain

### Run in development

```bash
npm install
npm run tauri dev
```

`npm run dev` starts only the web UI in a browser. Local playback, folder scanning and streaming search need the desktop app.

### Build the installer

```bash
npm run tauri build
```

This produces `sonora.exe` and MSI/NSIS installers under `src-tauri/target/release/bundle/`.
If `rustc` crashes while compiling the `windows` crate, limit parallel jobs: `CARGO_BUILD_JOBS=4 npm run tauri build`.

### Optional setup

- **Free music (Jamendo)**: create a free app at [devportal.jamendo.com](https://devportal.jamendo.com/) and paste its client ID in Settings.
- **Your server**: enter your Subsonic/Navidrome address and login in Settings. Only a salted token is stored, never the password.

## Project layout

```
src/                  React UI
  components/         Shell, player bar, shared UI
  features/           One folder per screen
  services/           Audio routing and the bridge to Rust commands
  stores/             Zustand state (persisted to localStorage)
src-tauri/src/
  audio/              Decoder, DSP (EQ, preamp) and WASAPI output
  library/            Folder scanner and tag reader
  providers/          JioSaavn, YouTube, Jamendo and Subsonic clients
  db/                 SQLite library database
```

## Disclaimer

Sonora is an independent project and isn't affiliated with JioSaavn, YouTube or Jamendo. Use of those services is subject to their terms.

## License

[MIT](LICENSE). Third-party libraries include Tauri (MIT/Apache-2.0), Symphonia (MPL-2.0), Lofty (MIT/Apache-2.0), CPAL (Apache-2.0) and rusqlite (MIT).
