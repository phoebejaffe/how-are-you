import { forwardRef, type HTMLAttributes } from "react";
import { DRAG_SURFACE_ATTR } from "./dragClickGuard";

export const DragHandle = forwardRef<
  HTMLButtonElement,
  HTMLAttributes<HTMLButtonElement> & { compact?: boolean }
>(function DragHandle({ className = "", compact = false, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Drag to reorder"
      {...{ [DRAG_SURFACE_ATTR]: "" }}
      className={`flex shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-lg text-ink-muted/45 transition-colors active:cursor-grabbing active:bg-white/60 active:text-ink-muted ${
        compact ? "size-8" : "size-11"
      } ${className}`}
      {...props}
    >
      <svg
        viewBox="0 0 10 16"
        className={compact ? "h-4 w-2.5" : "h-5 w-3"}
        aria-hidden
      >
        <circle cx="2.5" cy="2.5" r="1.25" fill="currentColor" />
        <circle cx="7.5" cy="2.5" r="1.25" fill="currentColor" />
        <circle cx="2.5" cy="8" r="1.25" fill="currentColor" />
        <circle cx="7.5" cy="8" r="1.25" fill="currentColor" />
        <circle cx="2.5" cy="13.5" r="1.25" fill="currentColor" />
        <circle cx="7.5" cy="13.5" r="1.25" fill="currentColor" />
      </svg>
    </button>
  );
});
