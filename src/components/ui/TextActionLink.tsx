import type { ReactNode } from "react";

const toneClass = {
  accent: "text-terracotta active:underline",
  muted: "text-stone-400 active:text-stone-600 active:underline",
} as const;

export function TextActionLink({
  children,
  onClick,
  tone = "muted",
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: keyof typeof toneClass;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center py-2 text-xs ${toneClass[tone]}`}
    >
      {children}
    </button>
  );
}
