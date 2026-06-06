import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ImportConflictDialog } from "../components/settings/ImportConflictDialog";
import { downloadJson } from "../domain/importExport";
import * as repo from "../storage/repository";
import { useAppStore } from "../store/appStore";
import { useToastStore } from "../store/toastStore";
import type { ImportConflict, ImportConflictResolution, PeopleFolder, PersonBundle } from "../types";

export function SettingsPage() {
  const people = useAppStore((s) => s.people);
  const peopleFolders = useAppStore((s) => s.peopleFolders);
  const loadBundle = useAppStore((s) => s.loadBundle);
  const importFile = useAppStore((s) => s.importFile);
  const applyImportResolutions = useAppStore((s) => s.applyImportResolutions);
  const addToast = useToastStore((s) => s.add);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [conflicts, setConflicts] = useState<ImportConflict[]>([]);
  const [conflictIndex, setConflictIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Map<string, ImportConflictResolution>>(new Map());
  const [pendingImport, setPendingImport] = useState<PersonBundle[] | null>(null);
  const [pendingImportFolders, setPendingImportFolders] = useState<PeopleFolder[]>([]);
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
      peopleFolders,
    };
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(`how-are-you-export-${date}.json`, payload);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const { conflicts: found, newPeople, peopleFolders: importedFolders } = await importFile(file);
      const allImported = [...found.map((c) => c.imported), ...newPeople];
      setPendingImport(allImported);

      if (found.length > 0) {
        setConflicts(found);
        setConflictIndex(0);
        setResolutions(new Map());
        setPendingImportFolders(importedFolders);
      } else {
        await finishImport(allImported, new Map(), importedFolders);
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Import failed.", "error");
    }
  }

  async function finishImport(
    imported: PersonBundle[],
    finalResolutions: Map<string, ImportConflictResolution>,
    importedFolders: PeopleFolder[] = pendingImportFolders,
  ) {
    const stats = await applyImportResolutions(imported, finalResolutions, importedFolders);
    addToast(`Imported ${stats.imported}, merged ${stats.merged}, skipped ${stats.skipped}.`, "success");
    setPendingImport(null);
    setPendingImportFolders([]);
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
    <div className="page page-enter">
      <Link to="/" className="back-link">
        ← Friends
      </Link>
      <h1 className="mt-5 font-display text-[1.75rem] font-normal text-ink sm:text-3xl">Settings</h1>

      <section className="card-padded mt-8">
        <h2 className="section-title">Export</h2>
        <p className="mt-1.5 text-sm text-ink-muted">Select people to include in the export file.</p>
        <ul className="mt-4 max-h-52 overflow-y-auto rounded-xl bg-white/50 ring-1 ring-stone-200/60">
          {people.map((p) => (
            <li key={p.nameKey} className="flex items-center gap-3 border-b border-stone-100 px-4 py-3 last:border-0">
              <input
                type="checkbox"
                checked={selected.has(p.nameKey)}
                onChange={() => togglePerson(p.nameKey)}
                id={`export-${p.nameKey}`}
                className="size-4 rounded accent-sage"
              />
              <label htmlFor={`export-${p.nameKey}`} className="text-[0.9375rem]">
                {p.displayName}
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-4">
          <button
            type="button"
            onClick={() => setSelected(new Set(people.map((p) => p.nameKey)))}
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Clear
          </button>
        </div>
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={() => void handleExport()}
          className="btn-primary mt-5 disabled:opacity-40"
        >
          Export selected
        </button>
      </section>

      <section className="card-padded mt-5">
        <h2 className="section-title">Import</h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          Import a JSON export file. Conflicts are resolved per person.
        </p>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-secondary mt-5"
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
