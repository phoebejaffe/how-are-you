import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Channel, Fact, FactFolder } from "../../types";
import {
  folderIdFromDropId,
  folderIdFromSortId,
  folderSortId,
  isFactDragId,
  isFolderDropId,
  isFolderSortId,
} from "../dnd/dndIds";
import { useAppDndSensors } from "../dnd/dndSensors";
import {
  groupUnpinnedFacts,
  moveUnsortedToEnd,
  resolveFactsLayoutOrder,
  saveFactsLayoutOrder,
  UNSORTED_DROP_ID,
} from "../../lib/factFolders";
import { FolderPlusIcon } from "../ui/FolderPlusIcon";
import { IconButton } from "../ui/IconButton";
import { SectionAddLink } from "../ui/SectionAddLink";
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
  const sensors = useAppDndSensors();
  const [factText, setFactText] = useState("");
  const [targetFolderId, setTargetFolderId] = useState("");
  const [addingFact, setAddingFact] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [activeFactId, setActiveFactId] = useState<string | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);

  const grouped = useMemo(() => groupUnpinnedFacts(unpinnedFacts, folders), [unpinnedFacts, folders]);
  const hasFolders = folders.length > 0;
  const hasAnyFacts = unpinnedFacts.length > 0 || hasFolders;

  const layoutOrder = useMemo(
    () => resolveFactsLayoutOrder(personKey, folders),
    [personKey, folders, layoutVersion],
  );
  const sortableIds = useMemo(() => layoutOrder.map((id) => folderSortId(id)), [layoutOrder]);

  const folderFactsMap = useMemo(() => {
    const map = new Map<string, Fact[]>();
    for (const { folder, facts } of grouped.folders) {
      map.set(folder.id, facts);
    }
    return map;
  }, [grouped.folders]);

  const folderMap = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);

  const unsortedVisible = grouped.unsorted.length > 0 || activeFactId !== null;
  const wasUnsortedVisibleRef = useRef(unsortedVisible);

  useEffect(() => {
    if (unsortedVisible && !wasUnsortedVisibleRef.current) {
      const next = moveUnsortedToEnd(resolveFactsLayoutOrder(personKey, folders));
      saveFactsLayoutOrder(personKey, next);
      setLayoutVersion((v) => v + 1);
    }
    wasUnsortedVisibleRef.current = unsortedVisible;
  }, [unsortedVisible, personKey, folders]);

  const activeFact = activeFactId ? unpinnedFacts.find((f) => f.id === activeFactId) : null;

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (isFactDragId(id)) {
      setActiveFactId(id.slice("fact:".length));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveFactId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (isFactDragId(activeId)) {
      const factId = activeId.slice("fact:".length);
      let targetFolderId: string | null | undefined;

      if (isFolderDropId(overId)) {
        targetFolderId = folderIdFromDropId(overId);
      } else if (isFolderSortId(overId)) {
        const folderId = folderIdFromSortId(overId);
        targetFolderId = folderId === UNSORTED_DROP_ID ? null : folderId;
      }

      if (targetFolderId !== undefined) {
        const fact = unpinnedFacts.find((f) => f.id === factId);
        const currentFolderId = fact?.folderId ?? null;
        if (fact && currentFolderId !== targetFolderId) {
          onMoveToFolder(factId, targetFolderId);
        }
      }
      return;
    }

    if (isFolderSortId(activeId) && isFolderSortId(overId) && activeId !== overId) {
      onReorderLayout(folderIdFromSortId(activeId), folderIdFromSortId(overId));
      setLayoutVersion((v) => v + 1);
    }
  }

  return (
    <section className="mb-3">
      <div className="mb-1 flex items-baseline gap-2 pr-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-stone-600">Facts</h2>
        {!addingFact && (
          <SectionAddLink onClick={() => setAddingFact(true)}>add a fact</SectionAddLink>
        )}
        {!addingFolder && (
          <IconButton className="ml-auto" onClick={() => setAddingFolder(true)} aria-label="New folder">
            <FolderPlusIcon />
          </IconButton>
        )}
      </div>

      {addingFact && (
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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {layoutOrder.map((itemId) => {
              if (itemId === UNSORTED_DROP_ID) {
                if (!unsortedVisible) return null;
                return (
                  <UnsortedFactsSection
                    key={itemId}
                    facts={grouped.unsorted}
                    folders={folders}
                    onPin={onPin}
                    onDeleteFact={onDeleteFact}
                    onEdit={onEdit}
                    onMoveToFolder={onMoveToFolder}
                  />
                );
              }

              const folder = folderMap.get(itemId);
              if (!folder) return null;

              return (
                <FactFolderSection
                  key={itemId}
                  folder={folder}
                  facts={folderFactsMap.get(itemId) ?? []}
                  allFolders={folders}
                  onToggleCollapsed={() => onToggleFolderCollapsed(folder.id)}
                  onRename={(name) => onRenameFolder(folder.id, name)}
                  onDelete={() => onDeleteFolder(folder.id)}
                  onPin={onPin}
                  onDeleteFact={onDeleteFact}
                  onEdit={onEdit}
                  onMoveToFolder={onMoveToFolder}
                />
              );
            })}
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeFact ? (
              <div className="rounded-lg bg-white/95 px-3 py-2 text-sm shadow-md ring-1 ring-sage/40">
                {activeFact.text}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </section>
  );
}
