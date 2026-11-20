import React, { useState } from "react";
import MD5 from "crypto-js/md5";
import { FolderOpen, FolderPlus, Trash2 } from "lucide-react";
import { useLibraryStore } from "../../stores/libraryStore";
import { useProviderStore } from "../../stores/providerStore";
import { useUiStore } from "../../stores/uiStore";
import { TauriBridge, getJamendoClientId, setJamendoClientId } from "../../services/tauriBridge";
import { addFolderWithPicker, removeFolder } from "../../services/libraryActions";
import { Button, IconButton, PageHeader, TextField } from "../../components/ui/primitives";

const Group: React.FC<{ title: string; description?: React.ReactNode; children: React.ReactNode }> = ({ title, description, children }) => (
  <section className="grid grid-cols-[220px_minmax(0,1fr)] gap-10 py-8 border-t border-line">
    <div>
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {description && <p className="mt-1.5 text-[12px] text-ink-3 leading-relaxed">{description}</p>}
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

export const SettingsScreen: React.FC = () => (
  <div className="flex-1 overflow-y-auto px-8 pb-20">
    <div className="max-w-[880px]">
      <PageHeader title="Settings" />
      <FoldersGroup />
      <ServerGroup />
      <JamendoGroup />
      <DataGroup />
      <ShortcutsGroup />
      <p className="pt-8 border-t border-line text-[12px] text-ink-3">Sonora 1.0.0</p>
    </div>
  </div>
);

const FoldersGroup: React.FC = () => {
  const { folders, scanStatus } = useLibraryStore();
  return (
    <Group title="Music folders" description="Songs in these folders make up your library. Files are read in place, never copied or uploaded.">
      {folders.length > 0 && (
        <ul className="mb-4 border-t border-line">
          {folders.map((f) => (
            <li key={f} className="flex items-center gap-3 h-11 border-b border-line">
              <FolderOpen className="w-4 h-4 text-ink-3 shrink-0" />
              <span className="flex-1 text-[13px] truncate select-text">{f}</span>
              <IconButton label="Remove folder" size="sm" onClick={() => removeFolder(f)} className="hover:text-danger">
                <Trash2 className="w-4 h-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <Button onClick={addFolderWithPicker} disabled={scanStatus.isScanning}>
        <FolderPlus className="w-4 h-4" /> {scanStatus.isScanning ? "Scanning…" : "Add folder"}
      </Button>
    </Group>
  );
};

const ServerGroup: React.FC = () => {
  const { subsonic, setSubsonic, disconnectSubsonic } = useProviderStore();
  const { showToast } = useUiStore();
  const [url, setUrl] = useState(subsonic.serverUrl);
  const [user, setUser] = useState(subsonic.username);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const salt = Math.random().toString(36).slice(2, 12);
    const token = MD5(password + salt).toString();
    const cfg = { serverUrl: url.trim().replace(/\/+$/, ""), username: user.trim(), token, salt };
    try {
      const msg = await TauriBridge.testSubsonic(cfg);
      setSubsonic({ ...cfg, isConnected: true, statusMessage: msg });
      setPassword("");
      showToast("Connected to your server");
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Group
      title="Your music server"
      description="Connect Navidrome, Airsonic or any Subsonic-compatible server to search and stream it alongside everything else."
    >
      {subsonic.isConnected ? (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] text-ink truncate">
              {subsonic.username} on {subsonic.serverUrl}
            </p>
            <p className="text-[12px] text-ink-3 mt-0.5">Connected. Its songs appear in search under “Your server”.</p>
          </div>
          <Button variant="ghost" onClick={disconnectSubsonic}>
            Disconnect
          </Button>
        </div>
      ) : (
        <form onSubmit={connect} className="grid grid-cols-2 gap-3 max-w-lg">
          <div className="col-span-2">
            <TextField label="Server address" placeholder="https://music.example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <TextField label="Username" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {error && <p className="col-span-2 text-[12px] text-danger">{error}</p>}
          <div className="col-span-2">
            <Button variant="primary" type="submit" disabled={busy || !url.trim() || !user.trim() || !password}>
              {busy ? "Connecting…" : "Connect"}
            </Button>
          </div>
        </form>
      )}
    </Group>
  );
};

const JamendoGroup: React.FC = () => {
  const [value, setValue] = useState(getJamendoClientId());
  const [saved, setSaved] = useState(getJamendoClientId());
  return (
    <Group
      title="Free music"
      description={
        <>
          The Free music page uses Jamendo. Get a free client ID at{" "}
          <button className="underline hover:text-ink" onClick={() => TauriBridge.openExternal("https://devportal.jamendo.com/")}>
            devportal.jamendo.com
          </button>
          .
        </>
      }
    >
      <form
        className="flex items-end gap-2 max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          setJamendoClientId(value);
          setSaved(value.trim());
        }}
      >
        <div className="flex-1">
          <TextField label="Jamendo client ID" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <Button type="submit" disabled={value.trim() === saved}>
          Save
        </Button>
      </form>
    </Group>
  );
};

const DataGroup: React.FC = () => {
  const { recentlyPlayed, clearRecentlyPlayed } = useLibraryStore();
  const { showToast } = useUiStore();
  return (
    <Group title="Listening data" description="History, liked songs and playlists are saved on this computer.">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!recentlyPlayed.length}
          onClick={() => {
            clearRecentlyPlayed();
            localStorage.removeItem("sonora-recent-searches");
            showToast("Cleared history and recent searches");
          }}
        >
          Clear history
        </Button>
      </div>
    </Group>
  );
};

const SHORTCUTS: [string, string][] = [
  ["Play or pause", "Space"],
  ["Next / previous song", "Ctrl → / Ctrl ←"],
  ["Skip forward / back 5 seconds", "Shift → / Shift ←"],
  ["Volume up / down", "Ctrl ↑ / Ctrl ↓"],
  ["Mute", "M"],
  ["Search", "Ctrl K"],
  ["Queue", "Ctrl Q"],
  ["Lyrics", "Ctrl L"],
  ["Go back", "Alt ←"],
  ["Close full-screen player", "Esc"],
];

const ShortcutsGroup: React.FC = () => (
  <Group title="Keyboard shortcuts">
    <dl className="grid grid-cols-[1fr_auto] max-w-md text-[13px]">
      {SHORTCUTS.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="py-2 border-b border-line text-ink-2">{k}</dt>
          <dd className="py-2 border-b border-line text-right">
            <kbd className="font-sans text-[12px] text-ink">{v}</kbd>
          </dd>
        </React.Fragment>
      ))}
    </dl>
  </Group>
);
