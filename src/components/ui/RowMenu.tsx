import { useEffect, useRef, useState } from "react";

export interface RowMenuItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

export function RowMenu({ items }: { items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-10 min-w-10 items-center justify-center rounded text-sm leading-none text-stone-400 active:bg-stone-200 active:text-stone-600"
        aria-label="Actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-0.5 min-w-[7.5rem] rounded-lg bg-white py-1 shadow-lg ring-1 ring-stone-200"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`block w-full px-3 py-2.5 text-left text-xs active:bg-stone-50 ${
                item.destructive ? "text-terracotta-dark" : "text-stone-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
