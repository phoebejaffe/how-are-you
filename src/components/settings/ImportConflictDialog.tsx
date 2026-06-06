import type { ImportConflict, ImportConflictResolution } from "../../types";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-[#FFFCF8] p-5 shadow-xl ring-1 ring-stone-200">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
          Import conflict {index + 1} of {total}
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-stone-800">
          &ldquo;{name}&rdquo; already exists
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Choose how to handle the imported data for this person.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onResolve("merge")}
            className="rounded-lg bg-sage px-4 py-2 text-left text-sm font-medium text-white hover:bg-sage-dark"
          >
            Merge — combine topics and facts
          </button>
          <button
            type="button"
            onClick={() => onResolve("override")}
            className="rounded-lg bg-terracotta px-4 py-2 text-left text-sm font-medium text-white hover:bg-terracotta-dark"
          >
            Override — replace existing data
          </button>
          <button
            type="button"
            onClick={() => onResolve("ignore")}
            className="rounded-lg px-4 py-2 text-left text-sm text-stone-600 hover:bg-stone-100"
          >
            Ignore — keep existing, skip import
          </button>
        </div>
      </div>
    </div>
  );
}
