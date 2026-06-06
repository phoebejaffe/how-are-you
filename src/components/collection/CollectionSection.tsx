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
  onReorderItems,
  onReorderFolders,
  isItemDragId = isFactDragId,
  itemIdFromDragId,
  getItemDragId,
  archivedItems = [],
  showArchivedItems = false,
  headerMenu,
  headerBanner,
}: {
  title: string;
  addLinkLabel: string;
  emptyMessage: string;
  layoutStorageKey: string;
  items: TItem[];
  folders?: BaseFolder[];
  features: CollectionSectionFeatures;
  addForm: (props: { onDone: () => void }) => ReactNode;
  renderItem: (item: TItem, options: { draggable: boolean; sortable: boolean; archived?: boolean }) => ReactNode;
  archivedItems?: TItem[];
  showArchivedItems?: boolean;
  headerMenu?: ReactNode;
  headerBanner?: ReactNode;
  renderDragOverlay?: (activeItem: TItem) => ReactNode;
  onAddFolder?: (name: string) => void;
  onRenameFolder?: (folderId: string, name: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onToggleFolderCollapsed?: (folderId: string) => void;
  onMoveItemToFolder?: (itemId: string, folderId: string | null) => void;
  onReorderItems?: (draggedId: string, targetId: string) => void;
  onReorderFolders?: (draggedId: string, targetId: string) => void;
  isItemDragId?: (id: string) => boolean;
  itemIdFromDragId?: (dragId: string) => string;
  getItemDragId?: (item: TItem) => string;
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
  const hasAnyItems =
    items.length > 0 || hasFolders || (showArchivedItems && archivedItems.length > 0);

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
  const resolveItemDragId =
    getItemDragId ?? ((item: TItem) => (itemIdFromDragId ? itemIdFromDragId(item.id) : `fact:${item.id}`));
  const activeItem = activeItemId ? items.find((item) => item.id === activeItemId) : null;
  const canSortItems = Boolean(features.dragItems && onReorderItems);

  const archivedByFolder = useMemo(() => {
    const map = new Map<string | null, TItem[]>();
    if (!showArchivedItems) return map;
    for (const item of archivedItems) {
      const key = item.folderId ?? null;
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    }
    return map;
  }, [archivedItems, showArchivedItems]);

  function archivedCountForFolder(folderId: string | null) {
    return archivedByFolder.get(folderId)?.length ?? 0;
  }

  function renderFolderItems(folderItems: TItem[], folderId: string | null) {
    const activeNodes = folderItems.map((item) => (
      <div key={item.id}>
        {renderItem(item, { draggable: Boolean(features.dragItems), sortable: canSortItems })}
      </div>
    ));

    const archivedNodes = (archivedByFolder.get(folderId) ?? []).map((item) => (
      <div key={item.id}>
        {renderItem(item, { draggable: false, sortable: false, archived: true })}
      </div>
    ));

    if (!canSortItems) {
      return (
        <>
          {activeNodes}
          {archivedNodes}
        </>
      );
    }

    const dragIds = folderItems.map((item) => resolveItemDragId(item));
    return (
      <>
        <SortableContext items={dragIds} strategy={verticalListSortingStrategy}>
          {activeNodes}
        </SortableContext>
        {archivedNodes}
      </>
    );
  }

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

    if (isItemDragId(activeId) && isItemDragId(overId) && activeId !== overId && onReorderItems) {
      const draggedId = resolveItemId(activeId);
      const targetId = resolveItemId(overId);
      const draggedItem = items.find((i) => i.id === draggedId);
      const targetItem = items.find((i) => i.id === targetId);
      if (
        draggedItem &&
        targetItem &&
        (draggedItem.folderId ?? null) === (targetItem.folderId ?? null)
      ) {
        onReorderItems(draggedId, targetId);
      }
      return;
    }

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
              <CollectionUnsortedSection
                key={itemId}
                label="Unsorted"
                itemCount={grouped.unsorted.length + archivedCountForFolder(null)}
              >
                {renderFolderItems(grouped.unsorted, null)}
              </CollectionUnsortedSection>
            );
          }

          const folder = folderMap.get(itemId);
          if (!folder) return null;

          return (
            <CollectionFolderSection
              key={itemId}
              folder={folder}
              itemCount={(folderItemsMap.get(itemId) ?? []).length + archivedCountForFolder(itemId)}
              onToggleCollapsed={() => onToggleFolderCollapsed?.(folder.id)}
              onRename={(name) => onRenameFolder?.(folder.id, name)}
              onDelete={() => onDeleteFolder?.(folder.id)}
            >
              {renderFolderItems(folderItemsMap.get(itemId) ?? [], itemId)}
            </CollectionFolderSection>
          );
        })}
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeItem && renderDragOverlay ? renderDragOverlay(activeItem) : null}
      </DragOverlay>
    </DndContext>
  ) : (
    items.map((item) => <div key={item.id}>{renderItem(item, { draggable: false, sortable: false })}</div>)
  );

  return (
    <section className="mb-5">
      <div className="section-header">
        <h2 className="collection-section-title">{title}</h2>
        {!addingItem && (
          <SectionAddLink compact onClick={() => setAddingItem(true)}>
            {addLinkLabel}
          </SectionAddLink>
        )}
        {(headerMenu || (useFolders && features.folderCreate && onAddFolder && !addingFolder)) && (
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            {headerMenu}
            {useFolders && features.folderCreate && onAddFolder && !addingFolder && (
              <IconButton compact onClick={() => setAddingFolder(true)} aria-label="New folder">
                <FolderPlusIcon />
              </IconButton>
            )}
          </div>
        )}
      </div>

      {headerBanner}

      {addingItem &&
        addForm({
          onDone: () => setAddingItem(false),
        })}

      {useFolders && features.folderCreate && onAddFolder && addingFolder && (
        <form
          className="card-padded mb-4 flex flex-wrap items-center gap-2.5"
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
            className="input input-compact min-w-0 flex-1"
            autoFocus
          />
          <button type="submit" className="btn-primary btn-compact">
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setFolderName("");
              setAddingFolder(false);
            }}
            aria-label="Cancel"
            className="btn-ghost btn-compact min-w-11 px-3"
          >
            ✕
          </button>
        </form>
      )}

      <div>
        {!hasAnyItems && <p className="empty-state text-xs">{emptyMessage}</p>}
        {listContent}
      </div>
    </section>
  );
}
