import type { ReactNode } from "react";

export function SectionAddLink({
  children,
  onClick,
  compact = false,
  prefix = "+",
  hidePrefix = false,
}: {
  children: ReactNode;
  onClick: () => void;
  compact?: boolean;
  prefix?: string;
  hidePrefix?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm text-ink-muted transition-colors active:text-terracotta ${
        compact ? "block w-fit py-1" : "inline-flex min-h-11 items-center py-2"
      }`}
    >
      {!hidePrefix && (
        <span className="mr-0.5 font-medium text-sage" aria-hidden="true">
          {prefix}
        </span>
      )}
      {children}
    </button>
  );
}
