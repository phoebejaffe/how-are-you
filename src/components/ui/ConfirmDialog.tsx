import { useEffect, useRef } from "react";
import { DialogOverlay } from "./DialogOverlay";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <DialogOverlay onClose={onCancel}>
      <div
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="dialog-panel"
      >
        <h2 id="confirm-title" className="font-display text-xl font-normal text-ink">
          {title}
        </h2>
        <p id="confirm-message" className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-muted">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button ref={cancelRef} type="button" onClick={onCancel} className="btn-ghost btn-compact">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="btn-secondary btn-compact">
            {confirmLabel}
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
}
