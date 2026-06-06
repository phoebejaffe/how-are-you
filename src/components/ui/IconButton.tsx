import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={`flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded text-stone-500 active:bg-stone-100 active:text-stone-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
