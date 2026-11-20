import React, { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ChevronLeft, Search, X } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { isTauri } from "../../services/tauriBridge";
import { IconButton } from "../ui/primitives";

const win = () => (isTauri() ? getCurrentWindow() : null);

/**
 * Frameless window chrome: back, global search and the Windows caption buttons.
 * Everything that isn't a control is a drag region.
 */
export const TitleBar: React.FC = () => {
  const { activeRoute, navigate, history, goBack, globalSearchQuery, setGlobalSearchQuery } = useUiStore();
  const [isMaximized, setIsMaximized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const w = win();
    if (!w) return;
    let unlisten: (() => void) | undefined;
    w.isMaximized().then(setIsMaximized).catch(() => {});
    w.onResized(() => w.isMaximized().then(setIsMaximized).catch(() => {}))
      .then((fn) => (unlisten = fn))
      .catch(() => {});
    return () => unlisten?.();
  }, []);

  // Ctrl+K / Ctrl+F focuses search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.code === "KeyK" || e.code === "KeyF")) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleMax = () => win()?.toggleMaximize().catch(() => {});

  return (
    <header
      data-tauri-drag-region
      onDoubleClick={(e) => e.target === e.currentTarget && toggleMax()}
      className="h-12 shrink-0 flex items-center gap-3 pl-3 relative z-50"
    >
      <div data-tauri-drag-region className="w-[204px] shrink-0 flex items-center gap-2 pl-1">
        <IconButton label="Back" size="sm" onClick={goBack} disabled={history.length === 0}>
          <ChevronLeft className="w-4 h-4" />
        </IconButton>
      </div>

      <div data-tauri-drag-region className="flex-1 flex justify-center min-w-0">
        <label className="group relative w-full max-w-[440px] flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-ink-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={globalSearchQuery}
            onChange={(e) => {
              setGlobalSearchQuery(e.target.value);
              if (activeRoute !== "search") navigate("search");
            }}
            onFocus={() => activeRoute !== "search" && globalSearchQuery && navigate("search")}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setGlobalSearchQuery("");
                inputRef.current?.blur();
              }
            }}
            placeholder="Search songs, artists, albums"
            aria-label="Search"
            className="w-full h-8 pl-9 pr-16 rounded-full bg-white/[0.06] border border-transparent text-[13px] text-ink placeholder:text-ink-3 focus:outline-none focus:bg-white/[0.09] focus:border-line-strong [&::-webkit-search-cancel-button]:hidden"
          />
          {globalSearchQuery ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setGlobalSearchQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 w-6 h-6 rounded-full flex items-center justify-center text-ink-3 hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3 text-[11px] text-ink-3 font-sans pointer-events-none">Ctrl K</kbd>
          )}
        </label>
      </div>

      <div className="flex items-stretch self-stretch shrink-0">
        <CaptionButton label="Minimize" onClick={() => win()?.minimize()}>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0 5h10" stroke="currentColor" strokeWidth="1" />
          </svg>
        </CaptionButton>
        <CaptionButton label={isMaximized ? "Restore" : "Maximize"} onClick={toggleMax}>
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="2.5" width="7" height="7" />
              <path d="M2.5 2.5V0.5h7v7h-2" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="9" height="9" />
            </svg>
          )}
        </CaptionButton>
        <CaptionButton label="Close" danger onClick={() => win()?.close()}>
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1">
            <path d="M0 0l10 10M10 0L0 10" />
          </svg>
        </CaptionButton>
      </div>
    </header>
  );
};

const CaptionButton: React.FC<{ label: string; danger?: boolean; onClick: () => void; children: React.ReactNode }> = ({
  label,
  danger,
  onClick,
  children,
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    className={`w-[46px] flex items-center justify-center text-ink-2 transition-colors ${
      danger ? "hover:bg-[#c42b1c] hover:text-white" : "hover:bg-white/[0.08] hover:text-ink"
    }`}
  >
    {children}
  </button>
);
