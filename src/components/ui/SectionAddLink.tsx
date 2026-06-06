import type { ReactNode } from "react";

export function SectionAddLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center py-2 text-xs text-stone-400 active:text-stone-600 active:underline"
    >
      <span className="mr-0.5 text-stone-500" aria-hidden="true">
        +
      </span>
      {children}
    </button>
  );
}
