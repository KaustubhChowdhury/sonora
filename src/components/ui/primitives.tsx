import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Music2, Play, Pause, X } from "lucide-react";
import { cn } from "../../lib/cn";

/* ---------------- Artwork ---------------- */

export const Artwork: React.FC<{
  src?: string;
  alt?: string;
  className?: string;
  rounded?: string;
  iconSize?: string;
}> = ({ src, alt = "", className, rounded = "rounded-md", iconSize = "w-1/3 h-1/3" }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div className={cn("relative overflow-hidden bg-raised shrink-0", rounded, className)}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-ink-3">
          <Music2 className={iconSize} strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
};

/* ---------------- Buttons ---------------- */

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean; size?: "sm" | "md" }
>(({ label, active, size = "md", className, children, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={active}
    className={cn(
      "inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-35",
      size === "sm" ? "w-7 h-7" : "w-8 h-8",
      active ? "text-signal" : "text-ink-2 hover:text-ink hover:bg-white/[0.06]",
      className
    )}
    {...rest}
  >
    {children}
  </button>
));
IconButton.displayName = "IconButton";

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" }
> = ({ variant = "secondary", size = "md", className, children, ...rest }) => (
  <button
    type="button"
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-40 whitespace-nowrap",
      size === "sm" ? "h-7 px-3 text-[12px]" : "h-9 px-4 text-[13px]",
      variant === "primary" && "bg-ink text-bg hover:bg-white",
      variant === "secondary" && "bg-white/[0.07] text-ink hover:bg-white/[0.12]",
      variant === "ghost" && "text-ink-2 hover:text-ink hover:bg-white/[0.06]",
      variant === "danger" && "text-danger hover:bg-danger/10",
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

/** The round play button. The only filled control in the app besides the transport. */
export const PlayButton: React.FC<{
  playing?: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}> = ({ playing, onClick, size = "md", className, label }) => {
  const dims = size === "lg" ? "w-12 h-12" : size === "md" ? "w-10 h-10" : "w-8 h-8";
  const icon = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? (playing ? "Pause" : "Play")}
      title={label ?? (playing ? "Pause" : "Play")}
      className={cn(
        "rounded-full bg-signal text-signal-ink flex items-center justify-center shrink-0",
        "transition-transform hover:scale-[1.04] active:scale-95",
        dims,
        className
      )}
    >
      {playing ? <Pause className={cn(icon, "fill-current")} /> : <Play className={cn(icon, "fill-current translate-x-[1px]")} />}
    </button>
  );
};

/* ---------------- Layout pieces ---------------- */

export const PageHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, className }) => (
  <header className={cn("flex items-end justify-between gap-6 pt-8 pb-6", className)}>
    <div className="min-w-0">
      <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.02em] text-ink">{title}</h1>
      {subtitle && <p className="mt-2 text-[13px] text-ink-2 max-w-[60ch]">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </header>
);

export const Section: React.FC<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, action, children, className }) => (
  <section className={cn("mt-10 first:mt-0", className)}>
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="text-[18px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, body, action, className }) => (
  <div className={cn("flex flex-col items-start gap-2 py-10 max-w-md", className)}>
    {icon && <div className="text-ink-3 mb-1">{icon}</div>}
    <p className="text-[15px] font-semibold text-ink">{title}</p>
    {body && <p className="text-[13px] text-ink-2 leading-relaxed">{body}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export const Tabs: React.FC<{
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string; count?: number }[];
  className?: string;
}> = ({ value, onChange, items, className }) => (
  <div role="tablist" className={cn("flex items-center gap-1", className)}>
    {items.map((it) => (
      <button
        key={it.value}
        role="tab"
        aria-selected={value === it.value}
        onClick={() => onChange(it.value)}
        className={cn(
          "h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors",
          value === it.value ? "bg-ink text-bg" : "text-ink-2 hover:text-ink hover:bg-white/[0.06]"
        )}
      >
        {it.label}
        {it.count !== undefined && <span className={cn("ml-1.5 tnum", value === it.value ? "opacity-60" : "text-ink-3")}>{it.count}</span>}
      </button>
    ))}
  </div>
);

export const TextField = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string }>(
  ({ label, className, id, ...rest }, ref) => {
    const fieldId = id || (label ? `f-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-[12px] font-medium text-ink-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={fieldId}
          className={cn(
            "h-9 px-3 rounded-md bg-white/[0.05] border border-line text-[13px] text-ink placeholder:text-ink-3",
            "focus:outline-none focus:border-line-strong focus:bg-white/[0.07]",
            className
          )}
          {...rest}
        />
      </div>
    );
  }
);
TextField.displayName = "TextField";

/* ---------------- Dialog ---------------- */

export const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}> = ({ open, onClose, title, children, width = "max-w-sm" }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
            className={cn("w-full rounded-xl bg-surface-elevated border border-line shadow-2xl shadow-black/50", width)}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
              <IconButton label="Close" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </IconButton>
            </div>
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** Asks for a single name. Used for new playlists and "save queue as playlist". */
export const NameDialog: React.FC<{
  open: boolean;
  title: string;
  confirmLabel: string;
  initial?: string;
  placeholder?: string;
  onClose: () => void;
  onConfirm: (name: string) => void;
}> = ({ open, title, confirmLabel, initial = "", placeholder, onClose, onConfirm }) => {
  const [name, setName] = useState(initial);
  useEffect(() => {
    if (open) setName(initial);
  }, [open, initial]);
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            onConfirm(name.trim());
            onClose();
          }
        }}
        className="flex flex-col gap-4 pt-2"
      >
        <TextField autoFocus value={name} placeholder={placeholder} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!name.trim()}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

/* ---------------- Playing indicator ---------------- */

export const EqBars: React.FC<{ playing: boolean }> = ({ playing }) => (
  <span className={cn("eq-bars", !playing && "paused")} aria-label={playing ? "Playing" : "Paused"}>
    <span />
    <span />
    <span />
  </span>
);
