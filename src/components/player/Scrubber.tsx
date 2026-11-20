import React, { useState } from "react";
import { cn } from "../../lib/cn";

/**
 * Range slider that only commits on release, so dragging doesn't fire
 * dozens of seeks at the native engine. Fill is drawn via --fill.
 */
export const Scrubber: React.FC<{
  value: number;
  max: number;
  onCommit: (v: number) => void;
  onScrub?: (v: number | null) => void;
  step?: number;
  label: string;
  className?: string;
  disabled?: boolean;
}> = ({ value, max, onCommit, onScrub, step = 1, label, className, disabled }) => {
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? value;
  const pct = max > 0 ? Math.min(100, (shown / max) * 100) : 0;

  const commit = () => {
    if (drag !== null) {
      onCommit(drag);
      setDrag(null);
      onScrub?.(null);
    }
  };

  return (
    <input
      type="range"
      aria-label={label}
      min={0}
      max={max || 1}
      step={step}
      value={shown}
      disabled={disabled}
      onChange={(e) => {
        const v = Number(e.target.value);
        setDrag(v);
        onScrub?.(v);
      }}
      onPointerUp={commit}
      onKeyUp={commit}
      onBlur={commit}
      style={{ "--fill": `${pct}%` } as React.CSSProperties}
      className={cn("slider w-full disabled:opacity-40", className)}
    />
  );
};
