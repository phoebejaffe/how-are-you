import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ImportConflictDialog } from "../components/settings/ImportConflictDialog";
import { downloadJson } from "../domain/importExport";
import * as repo from "../storage/repository";
import { useAppStore } from "../store/appStore";
import { useToastStore } from "../store/toastStore";
import type { ImportConflict, ImportConflictResolution, PersonBundle } from "../types";

export function SettingsPage() {
  const people = useAppStore((s) => s.people);
  const loadBundle = useAppStore((s) => s.loadBundle);
  const importFile = useAppStore((s) => s.importFile);
  const applyImportResolutions = useAppStore((s) => s.applyImportResolutions);
  const addToast = useToastStore((s) => s.add);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [conflicts, setConflicts] = useState<ImportConflict[]>([]);
  const [conflictIndex, setConflictIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Map<string, ImportConflictResolution>>(new Map());
  const [pendingImport, setPendingImport] = useState<PersonBundle[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    for (const person of people) void loadBundle(person.nameKey);
  }, [people, loadBundle]);

  function togglePerson(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleExport() {
    const bundles = await repo.listAllBundles();
    const payload = {
      schemaVersion: 1 as const,
      exportedAtIso: new Date().toISOString(),
      people: bundles.filter((b) => selected.has(b.person.nameKey)),
    };
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(`how-are-you-export-${date}.json`, payload);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const { conflicts: found, newPeople } = await importFile(file);
      const allImported = [...found.map((c) => c.imported), ...newPeople];
      setPendingImport(allImported);

      if (found.length > 0) {
        setConflicts(found);
        setConflictIndex(0);
        setResolutions(new Map());
      } else {
        await finishImport(allImported, new Map());
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Import failed.", "error");
    }
  }

  async function finishImport(
    imported: PersonBundle[],
    finalResolutions: Map<string, ImportConflictResolution>,
  ) {
    const stats = await applyImportResolutions(imported, finalResolutions);
    addToast(`Imported ${stats.imported}, merged ${stats.merged}, skipped ${stats.skipped}.`, "success");
    setPendingImport(null);
    setConflicts([]);
  }

  function handleConflictResolve(resolution: ImportConflictResolution) {
    const conflict = conflicts[conflictIndex];
    const next = new Map(resolutions);
    next.set(conflict.imported.person.nameKey, resolution);
    setResolutions(next);

    if (conflictIndex + 1 < conflicts.length) {
      setConflictIndex(conflictIndex + 1);
    } else if (pendingImport) {
      void finishImport(pendingImport, next);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link to="/" className="text-sm text-terracotta hover:underline">
        ← Friends
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-stone-800">Settings</h1>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-stone-700">Export</h2>
        <p className="mt-1 text-xs text-stone-500">Select people to include in the export file.</p>
        <ul className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-white/50 ring-1 ring-stone-200/60">
          {people.map((p) => (
            <li key={p.nameKey} className="flex items-center gap-2 border-b border-stone-100 px-3 py-2 last:border-0">
              <input
                type="checkbox"
                checked={selected.has(p.nameKey)}
                onChange={() => togglePerson(p.nameKey)}
                id={`export-${p.nameKey}`}
              />
              <label htmlFor={`export-${p.nameKey}`} className="text-sm">
                {p.displayName}
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setSelected(new Set(people.map((p) => p.nameKey)))}
            className="text-xs text-stone-500 hover:underline"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs text-stone-500 hover:underline"
          >
            Clear
          </button>
        </div>
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={() => void handleExport()}
          className="mt-3 rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-dark disabled:opacity-40"
        >
          Export selected
        </button>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-stone-700">Import</h2>
        <p className="mt-1 text-xs text-stone-500">
          Import a JSON export file. Conflicts are resolved per person.
        </p>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-3 rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-dark"
        >
          Choose file…
        </button>
      </section>

      {conflicts.length > 0 && conflictIndex < conflicts.length && (
        <ImportConflictDialog
          conflict={conflicts[conflictIndex]}
          index={conflictIndex}
          total={conflicts.length}
          onResolve={handleConflictResolve}
        />
      )}
    </div>
  );
}
