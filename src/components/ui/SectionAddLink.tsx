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
      className={`items-center text-xs leading-none text-stone-400 active:text-stone-600 active:underline ${
        compact ? "block w-fit py-0.5" : "inline-flex min-h-10 py-2"
      }`}
    >
      {!hidePrefix && (
        <span className="mr-0.5 text-stone-500" aria-hidden="true">
          {prefix}
        </span>
      )}
      {children}
    </button>
  );
}
