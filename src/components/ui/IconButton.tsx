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
      className={`flex shrink-0 items-center justify-center rounded text-stone-500 active:bg-stone-100 active:text-stone-700 ${
        compact ? "h-7 w-7" : "min-h-10 min-w-10"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
