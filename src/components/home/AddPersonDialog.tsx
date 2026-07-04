import { useEffect, useRef, useState } from "react";
import { DialogOverlay } from "../ui/DialogOverlay";

export function AddPersonDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, context?: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setContext("");
    setError("");
    inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await onAdd(name, context);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add person.");
    }
  }

  return (
    <DialogOverlay onClose={onClose}>
      <div role="dialog" aria-labelledby="add-person-title" className="dialog-panel max-w-md">
        <h2 id="add-person-title" className="font-display text-xl font-normal text-ink">
          Add person
        </h2>
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="add-person-name" className="section-label">
              Name
            </label>
            <input
              id="add-person-name"
              ref={inputRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name…"
              className="input w-full"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="add-person-context" className="section-label">
              Who they are
            </label>
            <textarea
              id="add-person-context"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="The tall brother, the juggler from Portland…"
              rows={2}
              className="input min-h-0 w-full resize-none py-2.5"
            />
          </div>
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
