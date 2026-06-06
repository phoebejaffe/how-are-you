import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface RowMenuItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

export function RowMenu({ items, compact = false }: { items: RowMenuItem[]; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    function updatePosition() {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuWidth = menuRef.current?.offsetWidth ?? 136;
      const menuHeight = menuRef.current?.offsetHeight ?? items.length * 44 + 8;
      const margin = 8;

      let left = rect.right - menuWidth;
      left = Math.max(margin, Math.min(left, window.innerWidth - menuWidth - margin));

      let top = rect.bottom + 4;
      if (top + menuHeight > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - menuHeight - 4);
      }

      setMenuStyle({
        position: "fixed",
        top,
        left,
        zIndex: 100,
      });
    }

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      className="min-w-[8.5rem] overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-stone-200/80"
      style={{
        ...menuStyle,
        boxShadow: "var(--shadow-lift)",
        visibility: menuStyle.top == null ? "hidden" : "visible",
      }}
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
          className={`block w-full px-4 py-3 text-left text-sm transition-colors active:bg-stone-50 ${
            item.destructive ? "text-terracotta-dark" : "text-ink"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex shrink-0 items-center justify-center rounded-xl text-lg leading-none text-ink-muted transition-colors active:bg-white/70 active:text-ink ${
          compact ? "size-8 text-base" : "size-11"
        }`}
        aria-label="Actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        ⋯
      </button>
      {menu && createPortal(menu, document.body)}
    </>
  );
}
