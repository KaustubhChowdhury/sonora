import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Search,
  Music,
  Sliders,
  LayoutGrid,
  X,
} from "lucide-react";
import { YoutubeIcon } from "../shared/ProviderIcons";
import { useUiStore, AppRoute } from "../../stores/uiStore";

interface BottomMenuItem {
  id: AppRoute | "drawer";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isDrawer?: boolean;
}

const MENU_ITEMS: BottomMenuItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "jiosaavn", label: "JioSaavn", icon: Music },
  { id: "youtube", label: "YouTube Music", icon: YoutubeIcon },
  { id: "audio-studio", label: "Audio Studio", icon: Sliders },
  { id: "drawer", label: "Library Drawer", icon: LayoutGrid, isDrawer: true },
];

export const BottomMenu: React.FC = () => {
  const {
    activeRoute,
    navigate,
    sidebarOpen,
    toggleSidebar,
    globalSearchQuery,
    setGlobalSearchQuery,
  } = useUiStore();

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // When search becomes active, focus the input
  useEffect(() => {
    if (activeRoute === "search" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeRoute]);

  const handleSearchClick = () => {
    if (activeRoute !== "search") {
      navigate("search");
    }
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none">
      <motion.nav
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-[#0e1017]/95 backdrop-blur-2xl border border-white/[0.14] shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
      >
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.isDrawer ? sidebarOpen : activeRoute === item.id;
          const isHovered = hoveredItem === item.id;

          // SPECIAL: When Search is active, render the expandable interactive search input
          if (item.id === "search" && isActive) {
            return (
              <motion.div
                key="search-interactive"
                initial={{ width: 44, opacity: 0.8 }}
                animate={{ width: "auto", opacity: 1 }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#b4ff39] text-[#111216] shadow-lg shadow-[#b4ff39]/35 font-sans"
              >
                <Search className="w-4 h-4 stroke-[2.5] text-[#111216] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search songs, artists, mixes..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="bg-transparent text-[#111216] placeholder-[#111216]/60 font-black text-xs focus:outline-none w-44 sm:w-56 tracking-tight select-text"
                />
                {globalSearchQuery && (
                  <button
                    onClick={() => setGlobalSearchQuery("")}
                    className="w-4 h-4 rounded-full bg-black/15 hover:bg-black/30 flex items-center justify-center text-[#111216] transition-colors"
                  >
                    <X className="w-2.5 h-2.5 stroke-[3]" />
                  </button>
                )}
              </motion.div>
            );
          }

          const handleClick = () => {
            if (item.isDrawer) {
              toggleSidebar();
            } else if (item.id === "search") {
              handleSearchClick();
            } else {
              navigate(item.id as AppRoute);
            }
          };

          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Floating Tooltip Pill with Neon-Lime Caret Pointer */}
              <AnimatePresence>
                {isHovered && !isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.9 }}
                    transition={{ duration: 0.12 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#eaedf2] text-[#111216] text-[11px] font-extrabold shadow-2xl pointer-events-none flex flex-col items-center whitespace-nowrap z-50"
                  >
                    <span>{item.isDrawer ? (sidebarOpen ? "Hide Library" : "Open Library") : item.label}</span>
                    {/* #b4ff39 neon lime pointer caret */}
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#b4ff39] absolute -bottom-1" />
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleClick}
                className={`relative flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "px-5 py-2.5 rounded-full bg-[#b4ff39] text-[#111216] font-black text-xs shadow-lg shadow-[#b4ff39]/35"
                    : "w-10 h-10 rounded-full bg-[#171922]/90 hover:bg-[#232635] text-zinc-400 hover:text-white justify-center border border-white/[0.06] hover:scale-105 active:scale-95"
                }`}
              >
                <Icon className={`shrink-0 ${isActive ? "w-4 h-4 stroke-[2.5]" : "w-4 h-4 stroke-[1.8]"}`} />
                {isActive && (
                  <span className="font-black tracking-tight truncate max-w-[110px]">
                    {item.isDrawer ? "Library" : item.label}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </motion.nav>
    </div>
  );
};
