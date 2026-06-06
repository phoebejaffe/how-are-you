import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Channel, Fact, FactFolder } from "../../types";
import {
  groupUnpinnedFacts,
  moveUnsortedToEnd,
  resolveFactsLayoutOrder,
  saveFactsLayoutOrder,
  UNSORTED_DROP_ID,
} from "../../lib/factFolders";
import { FolderPlusIcon } from "../ui/FolderPlusIcon";
import { FactFolderSection } from "./FactFolderSection";
import { UnsortedFactsSection } from "./UnsortedFactsSection";

export function FactsSection({
  personKey,
  folders,
  unpinnedFacts,
  onAddFact,
  onPin,
  onDeleteFact,
  onEdit,
  onMoveToFolder,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderCollapsed,
  onReorderLayout,
}: {
  personKey: string;
  folders: FactFolder[];
  unpinnedFacts: Fact[];
  onAddFact: (text: string, folderId?: string) => void;
  onPin: (factId: string) => void;
  onDeleteFact: (factId: string) => void;
  onEdit: (factId: string, text: string, channel: Channel) => void;
  onMoveToFolder: (factId: string, folderId: string | null) => void;
  onAddFolder: (name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolderCollapsed: (folderId: string) => void;
  onReorderLayout: (draggedId: string, targetId: string) => void;
}) {
  const [factText, setFactText] = useState("");
  const [targetFolderId, setTargetFolderId] = useState("");
  const [addingFact, setAddingFact] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [draggingFactId, setDraggingFactId] = useState<string | null>(null);
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [factDropTargetId, setFactDropTargetId] = useState<string | null>(null);
  const [folderReorderTargetId, setFolderReorderTargetId] = useState<string | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);

  const grouped = useMemo(() => groupUnpinnedFacts(unpinnedFacts, folders), [unpinnedFacts, folders]);
  const hasFolders = folders.length > 0;
  const hasAnyFacts = unpinnedFacts.length > 0 || hasFolders;

  const layoutOrder = useMemo(
    () => resolveFactsLayoutOrder(personKey, folders),
    [personKey, folders, layoutVersion],
  );

  const folderFactsMap = useMemo(() => {
    const map = new Map<string, Fact[]>();
    for (const { folder, facts } of grouped.folders) {
      map.set(folder.id, facts);
    }
    return map;
  }, [grouped.folders]);

  const folderMap = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);

  const unsortedVisible = grouped.unsorted.length > 0 || draggingFactId !== null;
  const wasUnsortedVisibleRef = useRef(unsortedVisible);

  useEffect(() => {
    if (unsortedVisible && !wasUnsortedVisibleRef.current) {
      const next = moveUnsortedToEnd(resolveFactsLayoutOrder(personKey, folders));
      saveFactsLayoutOrder(personKey, next);
      setLayoutVersion((v) => v + 1);
    }
    wasUnsortedVisibleRef.current = unsortedVisible;
  }, [unsortedVisible, personKey, folders]);

  const handleFactDragStart = useCallback((factId: string) => {
    setDraggingFactId(factId);
    setDraggingFolderId(null);
    setFolderReorderTargetId(null);
  }, []);

  const handleFactDragEnd = useCallback(() => {
    setDraggingFactId(null);
    setFactDropTargetId(null);
  }, []);

  const handleFolderDragStart = useCallback((folderId: string) => {
    setDraggingFolderId(folderId);
    setDraggingFactId(null);
    setFactDropTargetId(null);
  }, []);

  const handleFolderDragEnd = useCallback(() => {
    setDraggingFolderId(null);
    setFolderReorderTargetId(null);
  }, []);

  const handleFactDrop = useCallback(
    (targetId: string) => {
      const factId = draggingFactId;
      handleFactDragEnd();
      if (!factId) return;

      const fact = unpinnedFacts.find((f) => f.id === factId);
      if (!fact) return;

      const targetFolderId = targetId === UNSORTED_DROP_ID ? null : targetId;
      const currentFolderId = fact.folderId ?? null;
      if (currentFolderId === targetFolderId) return;

      onMoveToFolder(factId, targetFolderId);
    },
    [draggingFactId, handleFactDragEnd, onMoveToFolder, unpinnedFacts],
  );

  const handleFolderDrop = useCallback(
    (targetId: string) => {
      const draggedId = draggingFolderId;
      handleFolderDragEnd();
      if (!draggedId || draggedId === targetId) return;
      onReorderLayout(draggedId, targetId);
      setLayoutVersion((v) => v + 1);
    },
    [draggingFolderId, handleFolderDragEnd, onReorderLayout],
  );

  const handleFactDragOver = useCallback(
    (targetId: string) => {
      if (!draggingFactId) return;
      setFactDropTargetId(targetId);
    },
    [draggingFactId],
  );

  const handleFolderDragOver = useCallback(
    (targetId: string) => {
      if (!draggingFolderId || draggingFolderId === targetId) return;
      setFolderReorderTargetId(targetId);
    },
    [draggingFolderId],
  );

  return (
    <section className="mb-3">
      <div className="mb-1 flex items-baseline gap-2 pr-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-stone-600">Facts</h2>
        {!addingFact && (
          <button
            type="button"
            onClick={() => setAddingFact(true)}
            className="text-xs text-stone-400 hover:text-stone-600 hover:underline"
          >
            add a fact
          </button>
        )}
        {!addingFolder && (
          <button
            type="button"
            onClick={() => setAddingFolder(true)}
            className="ml-auto shrink-0 rounded p-0.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
            aria-label="New folder"
          >
            <FolderPlusIcon />
          </button>
        )}
      </div>

      {addingFact && (
        <>
          <form
            className="my-1 flex flex-wrap items-center gap-1 px-1"
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = factText.trim();
              if (!trimmed) return;
              onAddFact(trimmed, targetFolderId || undefined);
              setFactText("");
              setAddingFact(false);
            }}
          >
            <input
              value={factText}
              onChange={(e) => setFactText(e.target.value)}
              placeholder="add a fact"
              className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white/80 px-3 py-1.5 text-sm"
              autoFocus
            />
            {hasFolders && (
              <select
                value={targetFolderId}
                onChange={(e) => setTargetFolderId(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white/80 px-2 py-1.5 text-sm text-stone-600"
                aria-label="Folder"
              >
                <option value="">Unsorted</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            )}
            <button type="submit" className="rounded-lg bg-sage px-3 py-1.5 text-sm text-white hover:bg-sage-dark">
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setFactText("");
                setAddingFact(false);
              }}
              aria-label="Cancel"
              className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100"
            >
              X
            </button>
          </form>
        </>
      )}

      {addingFolder && (
        <form
          className="my-1 flex flex-wrap items-center gap-1 px-1"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = folderName.trim();
            if (!trimmed) return;
            onAddFolder(trimmed);
            setFolderName("");
            setAddingFolder(false);
          }}
        >
          <input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name…"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white/80 px-3 py-1.5 text-sm"
            autoFocus
          />
          <button type="submit" className="rounded-lg bg-sage px-3 py-1.5 text-sm text-white hover:bg-sage-dark">
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setFolderName("");
              setAddingFolder(false);
            }}
            aria-label="Cancel"
            className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100"
          >
            X
          </button>
        </form>
      )}

      <div className="rounded-lg bg-white/40 px-1 py-1">
        {!hasAnyFacts && <p className="px-2 py-2 text-center text-xs text-stone-400">No facts yet.</p>}

        {layoutOrder.map((itemId) => {
          if (itemId === UNSORTED_DROP_ID) {
            if (!unsortedVisible) return null;
            return (
              <UnsortedFactsSection
                key={itemId}
                facts={grouped.unsorted}
                folders={folders}
                isFactDragging={draggingFactId !== null}
                isFactDropTarget={factDropTargetId === UNSORTED_DROP_ID}
                isFolderReorderTarget={folderReorderTargetId === UNSORTED_DROP_ID}
                isFolderDragging={draggingFolderId === UNSORTED_DROP_ID}
                onPin={onPin}
                onDeleteFact={onDeleteFact}
                onEdit={onEdit}
                onMoveToFolder={onMoveToFolder}
                onFactDragStart={handleFactDragStart}
                onFactDragEnd={handleFactDragEnd}
                onFactDragOver={handleFactDragOver}
                onFactDragLeave={(id) => setFactDropTargetId((current) => (current === id ? null : current))}
                onFactDrop={handleFactDrop}
                onFolderDragStart={handleFolderDragStart}
                onFolderDragEnd={handleFolderDragEnd}
                onFolderDragOver={handleFolderDragOver}
                onFolderDragLeave={(id) => setFolderReorderTargetId((current) => (current === id ? null : current))}
                onFolderDrop={handleFolderDrop}
              />
            );
          }

          const folder = folderMap.get(itemId);
          if (!folder) return null;
          const facts = folderFactsMap.get(itemId) ?? [];

          return (
            <FactFolderSection
              key={itemId}
              folder={folder}
              facts={facts}
              allFolders={folders}
              isFactDragging={draggingFactId !== null}
              isFactDropTarget={factDropTargetId === folder.id}
              isFolderReorderTarget={folderReorderTargetId === folder.id}
              isFolderDragging={draggingFolderId === folder.id}
              onToggleCollapsed={() => onToggleFolderCollapsed(folder.id)}
              onRename={(name) => onRenameFolder(folder.id, name)}
              onDelete={() => onDeleteFolder(folder.id)}
              onPin={onPin}
              onDeleteFact={onDeleteFact}
              onEdit={onEdit}
              onMoveToFolder={onMoveToFolder}
              onFactDragStart={handleFactDragStart}
              onFactDragEnd={handleFactDragEnd}
              onFactDragOver={handleFactDragOver}
              onFactDragLeave={(id) => setFactDropTargetId((current) => (current === id ? null : current))}
              onFactDrop={handleFactDrop}
              onFolderDragStart={handleFolderDragStart}
              onFolderDragEnd={handleFolderDragEnd}
              onFolderDragOver={handleFolderDragOver}
              onFolderDragLeave={(id) => setFolderReorderTargetId((current) => (current === id ? null : current))}
              onFolderDrop={handleFolderDrop}
            />
          );
        })}
      </div>
    </section>
  );
}
