import type { ImportConflict, ImportConflictResolution } from "../../types";
import { DialogOverlay } from "../ui/DialogOverlay";

export function ImportConflictDialog({
  conflict,
  index,
  total,
  onResolve,
}: {
  conflict: ImportConflict;
  index: number;
  total: number;
  onResolve: (resolution: ImportConflictResolution) => void;
}) {
  const name = conflict.imported.person.displayName;

  return (
    <DialogOverlay>
      <div className="dialog-panel max-w-md">
        <p className="section-label">
          Import conflict {index + 1} of {total}
        </p>
        <h2 className="mt-2 font-display text-xl font-normal text-ink">
          &ldquo;{name}&rdquo; already exists
        </h2>
        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-muted">
          Choose how to handle the imported data for this person.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <button type="button" onClick={() => onResolve("merge")} className="btn-primary w-full justify-start">
            Merge — combine topics and facts
          </button>
          <button type="button" onClick={() => onResolve("override")} className="btn-secondary w-full justify-start">
            Override — replace existing data
          </button>
          <button type="button" onClick={() => onResolve("ignore")} className="btn-ghost w-full justify-start">
            Ignore — keep existing, skip import
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
}
