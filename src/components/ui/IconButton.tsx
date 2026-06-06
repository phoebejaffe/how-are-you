import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconButton({
  children,
  className = "",
  compact = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; compact?: boolean }) {
  return (
    <button
      type="button"
      className={`flex shrink-0 items-center justify-center rounded-xl text-ink-muted transition-colors active:bg-white/70 active:text-ink ${
        compact ? "size-8" : "size-11"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
