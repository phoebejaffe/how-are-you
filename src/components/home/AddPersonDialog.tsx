import { useEffect, useRef, useState } from "react";
import { DialogOverlay } from "../ui/DialogOverlay";

export function AddPersonDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setError("");
    inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await onAdd(name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add person.");
    }
  }

  return (
    <DialogOverlay onClose={onClose}>
      <div role="dialog" aria-labelledby="add-person-title" className="dialog-panel max-w-md">
        <h2 id="add-person-title" className="font-display text-xl font-normal text-ink">
          Add friend
        </h2>
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4">
          <input
            ref={inputRef}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name…"
            className="input w-full"
          />
          {error && <p className="text-sm text-terracotta-dark">{error}</p>}
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="btn-ghost btn-compact">
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-compact">
              Add
            </button>
          </div>
        </form>
      </div>
    </DialogOverlay>
  );
}
