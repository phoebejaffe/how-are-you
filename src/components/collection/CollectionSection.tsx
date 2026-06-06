import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { BaseFolder } from "../../lib/folders";
import { groupByFolder, moveUnsortedToEnd, resolveLayoutOrder, saveLayoutOrder, UNSORTED_DROP_ID } from "../../lib/folders";
import {
  folderIdFromDropId,
  folderIdFromSortId,
  folderSortId,
  isFactDragId,
  isFolderDropId,
  isFolderSortId,
} from "../dnd/dndIds";
import { useAppDndSensors } from "../dnd/dndSensors";
import { FolderPlusIcon } from "../ui/FolderPlusIcon";
import { IconButton } from "../ui/IconButton";
import { SectionAddLink } from "../ui/SectionAddLink";
import { CollectionFolderSection } from "./CollectionFolderSection";
import { CollectionUnsortedSection } from "./CollectionUnsortedSection";
import type { CollectionSectionFeatures } from "./types";

export function CollectionSection<TItem extends { id: string; folderId?: string }>({
  title,
  addLinkLabel,
  emptyMessage,
  layoutStorageKey,
  items,
  folders = [],
  features,
  addForm,
  renderItem,
  renderDragOverlay,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderCollapsed,
  onMoveItemToFolder,
  onReorderFolders,
  isItemDragId = isFactDragId,
  itemIdFromDragId,
}: {
  title: string;
  addLinkLabel: string;
  emptyMessage: string;
  layoutStorageKey: string;
  items: TItem[];
  folders?: BaseFolder[];
  features: CollectionSectionFeatures;
  addForm: (props: { onDone: () => void }) => ReactNode;
  renderItem: (item: TItem, options: { draggable: boolean }) => ReactNode;
  renderDragOverlay?: (activeItem: TItem) => ReactNode;
  onAddFolder?: (name: string) => void;
  onRenameFolder?: (folderId: string, name: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onToggleFolderCollapsed?: (folderId: string) => void;
  onMoveItemToFolder?: (itemId: string, folderId: string | null) => void;
  onReorderFolders?: (draggedId: string, targetId: string) => void;
  isItemDragId?: (id: string) => boolean;
  itemIdFromDragId?: (dragId: string) => string;
}) {
  const sensors = useAppDndSensors();
  const [addingItem, setAddingItem] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);

  const useFolders = Boolean(features.folders);
  const grouped = useMemo(
    () => (useFolders ? groupByFolder(items, folders) : { folders: [], unsorted: items }),
    [items, folders, useFolders],
  );
  const hasFolders = folders.length > 0;
  const hasAnyItems = items.length > 0 || hasFolders;

  const layoutOrder = useMemo(
    () => (useFolders ? resolveLayoutOrder(layoutStorageKey, folders.map((f) => f.id)) : []),
    [layoutStorageKey, folders, layoutVersion, useFolders],
  );
  const sortableIds = useMemo(() => layoutOrder.map((id) => folderSortId(id)), [layoutOrder]);

  const folderItemsMap = useMemo(() => {
    const map = new Map<string, TItem[]>();
    for (const { folder, items: folderItems } of grouped.folders) {
      map.set(folder.id, folderItems);
    }
    return map;
  }, [grouped.folders]);

  const folderMap = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);

  const unsortedVisible = !useFolders || grouped.unsorted.length > 0 || activeItemId !== null;
  const wasUnsortedVisibleRef = useRef(unsortedVisible);

  useEffect(() => {
    if (!useFolders) return;
    if (unsortedVisible && !wasUnsortedVisibleRef.current) {
      const next = moveUnsortedToEnd(resolveLayoutOrder(layoutStorageKey, folders.map((f) => f.id)));
      saveLayoutOrder(layoutStorageKey, next);
      setLayoutVersion((v) => v + 1);
    }
    wasUnsortedVisibleRef.current = unsortedVisible;
  }, [unsortedVisible, layoutStorageKey, folders, useFolders]);

  const resolveItemId = itemIdFromDragId ?? ((dragId: string) => dragId.slice("fact:".length));
  const activeItem = activeItemId ? items.find((item) => item.id === activeItemId) : null;

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (isItemDragId(id)) {
      setActiveItemId(resolveItemId(id));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItemId(null);
    if (!over || !useFolders) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (isItemDragId(activeId) && onMoveItemToFolder) {
      const itemId = resolveItemId(activeId);
      let targetFolderId: string | null | undefined;

      if (isFolderDropId(overId)) {
        targetFolderId = folderIdFromDropId(overId);
      } else if (isFolderSortId(overId)) {
        const folderId = folderIdFromSortId(overId);
        targetFolderId = folderId === UNSORTED_DROP_ID ? null : folderId;
      }

      if (targetFolderId !== undefined) {
        const item = items.find((i) => i.id === itemId);
        const currentFolderId = item?.folderId ?? null;
        if (item && currentFolderId !== targetFolderId) {
          onMoveItemToFolder(itemId, targetFolderId);
        }
      }
      return;
    }

    if (isFolderSortId(activeId) && isFolderSortId(overId) && activeId !== overId && onReorderFolders) {
      onReorderFolders(folderIdFromSortId(activeId), folderIdFromSortId(overId));
      setLayoutVersion((v) => v + 1);
    }
  }

  const listContent = useFolders ? (
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
              <CollectionUnsortedSection key={itemId} label="Unsorted" itemCount={grouped.unsorted.length}>
                {grouped.unsorted.map((item) => (
                  <div key={item.id}>{renderItem(item, { draggable: Boolean(features.dragItems) })}</div>
                ))}
              </CollectionUnsortedSection>
            );
          }

          const folder = folderMap.get(itemId);
          if (!folder) return null;

          return (
            <CollectionFolderSection
              key={itemId}
              folder={folder}
              itemCount={(folderItemsMap.get(itemId) ?? []).length}
              onToggleCollapsed={() => onToggleFolderCollapsed?.(folder.id)}
              onRename={(name) => onRenameFolder?.(folder.id, name)}
              onDelete={() => onDeleteFolder?.(folder.id)}
            >
              {(folderItemsMap.get(itemId) ?? []).map((item) => (
                <div key={item.id}>{renderItem(item, { draggable: Boolean(features.dragItems) })}</div>
              ))}
            </CollectionFolderSection>
          );
        })}
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeItem && renderDragOverlay ? renderDragOverlay(activeItem) : null}
      </DragOverlay>
    </DndContext>
  ) : (
    items.map((item) => <div key={item.id}>{renderItem(item, { draggable: false })}</div>)
  );

  return (
    <section className="mb-3">
      <div className="mb-1 flex items-baseline gap-2 pr-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-stone-600">{title}</h2>
        {!addingItem && <SectionAddLink onClick={() => setAddingItem(true)}>{addLinkLabel}</SectionAddLink>}
        {useFolders && features.folderCreate && onAddFolder && !addingFolder && (
          <IconButton className="ml-auto" onClick={() => setAddingFolder(true)} aria-label="New folder">
            <FolderPlusIcon />
          </IconButton>
        )}
      </div>

      {addingItem &&
        addForm({
          onDone: () => setAddingItem(false),
        })}

      {useFolders && features.folderCreate && onAddFolder && addingFolder && (
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
        {!hasAnyItems && <p className="px-2 py-2 text-center text-xs text-stone-400">{emptyMessage}</p>}
        {listContent}
      </div>
    </section>
  );
}
