import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ImportConflictDialog } from "../components/settings/ImportConflictDialog";
import {
  buildExportPayload,
  downloadJson,
  exportFilename,
  serializeExportPayload,
} from "../domain/importExport";
import { copyTextToClipboard } from "../lib/clipboard";
import * as repo from "../storage/repository";
import { useAppStore } from "../store/appStore";
import { useToastStore } from "../store/toastStore";
import type { ImportConflict, ImportConflictResolution, PeopleFolder, PersonBundle } from "../types";

export function SettingsPage() {
  const people = useAppStore((s) => s.people);
  const peopleFolders = useAppStore((s) => s.peopleFolders);
  const loadBundle = useAppStore((s) => s.loadBundle);
  const importData = useAppStore((s) => s.importData);
  const applyImportResolutions = useAppStore((s) => s.applyImportResolutions);
  const addToast = useToastStore((s) => s.add);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importText, setImportText] = useState("");
  const [conflicts, setConflicts] = useState<ImportConflict[]>([]);
  const [conflictIndex, setConflictIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Map<string, ImportConflictResolution>>(new Map());
  const [pendingImport, setPendingImport] = useState<PersonBundle[] | null>(null);
  const [pendingImportFolders, setPendingImportFolders] = useState<PeopleFolder[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    for (const person of people) void loadBundle(person.nameKey);
  }, [people, loadBundle]);

  useEffect(() => {
    setSelected((prev) => {
      const keys = people.map((person) => person.nameKey);
      if (prev.size === 0) return new Set(keys);

      const next = new Set(prev);
      for (const key of keys) {
        if (!prev.has(key)) next.add(key);
      }
      for (const key of prev) {
        if (!keys.includes(key)) next.delete(key);
      }
      return next;
    });
  }, [people]);

  function togglePerson(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function buildSelectedExportPayload() {
    const bundles = await repo.listAllBundles();
    return buildExportPayload(bundles, [...selected], peopleFolders);
  }

  async function handleExportToFile() {
    const payload = await buildSelectedExportPayload();
    downloadJson(exportFilename(), payload);
  }

  function handleExportToClipboard() {
    const textPromise = buildSelectedExportPayload().then(serializeExportPayload);
    void copyTextToClipboard(textPromise).then((ok) => {
      addToast(ok ? "Copied export to clipboard" : "Could not copy to clipboard", ok ? "success" : "error");
    });
  }

  async function startImport(text: string) {
    const { conflicts: found, newPeople, peopleFolders: importedFolders } = await importData(text);
    const allImported = [...found.map((c) => c.imported), ...newPeople];
    setPendingImport(allImported);
    setImportText("");

    if (found.length > 0) {
      setConflicts(found);
      setConflictIndex(0);
      setResolutions(new Map());
      setPendingImportFolders(importedFolders);
    } else {
      await finishImport(allImported, new Map(), importedFolders);
    }
  }

  async function handleImportPaste() {
    try {
      await startImport(importText);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Import failed.", "error");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      await startImport(await file.text());
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

  const exportDisabled = selected.size === 0;
  const importDisabled = importText.trim().length === 0;

  return (
    <div className="page page-enter">
      <Link to="/" className="back-link">
        ← My people
      </Link>
      <h1 className="mt-5 font-display text-[1.75rem] font-normal text-ink sm:text-3xl">Settings</h1>

      <section className="card-padded mt-8">
        <h2 className="section-title">Export</h2>
        <p className="mt-1.5 text-sm text-ink-muted">Select people to include in the export.</p>
        <div className="mt-4 flex gap-4">
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
        <ul className="mt-2 max-h-52 overflow-y-auto rounded-lg bg-white/50 ring-1 ring-stone-200/60">
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
        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={exportDisabled}
            onClick={() => void handleExportToFile()}
            className="btn-primary btn-compact disabled:opacity-40"
          >
            Download file
          </button>
          <button
            type="button"
            disabled={exportDisabled}
            onClick={() => handleExportToClipboard()}
            className="btn-secondary btn-compact disabled:opacity-40"
          >
            Copy to clipboard
          </button>
        </div>
      </section>

      <section className="card-padded mt-5">
        <h2 className="section-title">Import</h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          Paste export JSON or choose a file. Conflicts are resolved per person.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='{"schemaVersion":1,"people":[...]}'
          rows={5}
          spellCheck={false}
          className="input mt-4 min-h-0 w-full resize-y py-2.5 font-mono text-xs leading-relaxed"
        />
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
        <div className="mt-3 flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={importDisabled}
            onClick={() => void handleImportPaste()}
            className="btn-primary btn-compact disabled:opacity-40"
          >
            Import pasted data
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary btn-compact">
            Choose file…
          </button>
        </div>
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
