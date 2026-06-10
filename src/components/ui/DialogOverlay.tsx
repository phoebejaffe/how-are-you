import { createPortal } from "react-dom";
import { useRef, type ReactNode } from "react";
import { useDialogFocusTrap } from "./useDialogFocusTrap";

/** Full-viewport modal backdrop; portaled so fixed positioning isn't trapped by ancestor transforms. */
export function DialogOverlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(containerRef, onClose);

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-ink/25 p-5 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
