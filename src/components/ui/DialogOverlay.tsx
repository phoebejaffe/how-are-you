import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/** Full-viewport modal backdrop; portaled so fixed positioning isn't trapped by ancestor transforms. */
export function DialogOverlay({ children }: { children: ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-ink/25 p-5 backdrop-blur-[2px]">
      {children}
    </div>,
    document.body,
  );
}
