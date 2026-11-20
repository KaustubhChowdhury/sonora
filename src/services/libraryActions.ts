import { invoke } from "@tauri-apps/api/core";
import { TauriBridge, isTauri } from "./tauriBridge";
import { useLibraryStore } from "../stores/libraryStore";
import { useUiStore } from "../stores/uiStore";

const toast = (m: string) => useUiStore.getState().showToast(m);

async function reloadTracks() {
  const tracks = await TauriBridge.getLibraryTracks();
  useLibraryStore.getState().setTracks(tracks);
}

export async function scanFolder(path: string) {
  const lib = useLibraryStore.getState();
  lib.setScanStatus({ isScanning: true, currentFolder: path, scannedFiles: 0, errorCount: 0, errors: [] });
  const res = await TauriBridge.scanFolder(path);
  lib.setScanStatus({ ...res, isScanning: false });
  await reloadTracks();
  toast(res.errorCount && !res.scannedFiles ? `Couldn't scan ${path}` : `Found ${res.scannedFiles} songs in ${path}`);
}

/** Opens the system folder picker, then adds and scans the chosen folder. */
export async function addFolderWithPicker() {
  if (!isTauri()) {
    toast("Adding folders needs the desktop app.");
    return;
  }
  const { open } = await import("@tauri-apps/plugin-dialog");
  const picked = await open({ directory: true, multiple: false, title: "Choose a music folder" });
  if (typeof picked !== "string") return;
  useLibraryStore.getState().addFolder(picked);
  await scanFolder(picked);
}

export async function removeFolder(path: string) {
  useLibraryStore.getState().removeFolder(path);
  if (isTauri()) {
    try {
      await invoke("remove_library_folder", { folderPath: path });
    } catch (e) {
      console.error("remove_library_folder failed", e);
    }
    await reloadTracks();
  }
  toast(`Removed ${path}`);
}
