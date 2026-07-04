import {
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppDndContext } from "../../dnd/AppDndContext";
import {
  folderIdFromDropId,
  folderIdFromSortId,
  folderSortId,
  isFolderDropId,
  isFolderSortId,
  isPersonDragId,
} from "../../dnd/dndIds";
import { useAppDndSensors } from "../../dnd/dndSensors";
import { resolvePeopleLayoutOrder, UNSORTED_DROP_ID } from "../../../lib/peopleFolders";
import type { PeopleFolder, Person } from "../../../types";
import { peopleListCollisionDetection } from "./collisionDetection";
import { PersonDragPreview, type DragPreviewPosition } from "./PersonDragPreview";

type DragStartSnapshot = {
  left: number;
  top: number;
  width: number;
  scrollY: number;
};

export function PeopleListDnd({
  folders,
  people,
  layoutVersion,
  onMovePersonToFolder,
  onDropPersonOnPerson,
  onApplyLayoutOrder,
  onHighlightFolder,
  onFolderReorderDone,
  onPersonDragChange,
  children,
}: {
  folders: PeopleFolder[];
  people: Person[];
  layoutVersion: number;
  onMovePersonToFolder: (nameKey: string, folderId: string | null) => void;
  onDropPersonOnPerson: (draggedKey: string, targetKey: string) => void;
  onApplyLayoutOrder: (order: string[]) => void;
  onHighlightFolder: (folderId: string | null | undefined) => void;
  onFolderReorderDone: () => void;
  onPersonDragChange: (dragging: boolean) => void;
  children: (layoutOrder: string[]) => ReactNode;
}) {
  const sensors = useAppDndSensors();
  const [activePersonKey, setActivePersonKey] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<DragPreviewPosition | null>(null);
  const [previewLayoutOrder, setPreviewLayoutOrder] = useState<string[] | null>(null);

  const dragSnapshotRef = useRef<DragStartSnapshot | null>(null);
  const dragDeltaRef = useRef({ x: 0, y: 0 });

  const layoutOrder = useMemo(
    () => previewLayoutOrder ?? resolvePeopleLayoutOrder(folders),
    [folders, layoutVersion, previewLayoutOrder],
  );

  const folderSortableIds = useMemo(
    () => layoutOrder.map((id) => folderSortId(id)),
    [layoutOrder],
  );

  const activePerson = useMemo(
    () => (activePersonKey ? people.find((person) => person.nameKey === activePersonKey) : null),
    [activePersonKey, people],
  );

  function updatePreviewPosition() {
    const start = dragSnapshotRef.current;
    if (!start) return;
    const scrollDelta = window.scrollY - start.scrollY;
    setPreviewPosition({
      x: start.left + dragDeltaRef.current.x,
      y: start.top + dragDeltaRef.current.y + scrollDelta,
      width: start.width,
    });
  }

  function resetDrag() {
    setActivePersonKey(null);
    setPreviewPosition(null);
    setPreviewLayoutOrder(null);
    dragSnapshotRef.current = null;
    dragDeltaRef.current = { x: 0, y: 0 };
    onHighlightFolder(undefined);
    onPersonDragChange(false);
  }

  useEffect(() => {
    if (!activePersonKey) return;
    const onScroll = () => updatePreviewPosition();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activePersonKey]);

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (!isPersonDragId(id)) return;

    const rect = event.active.rect.current?.initial;
    if (!rect) return;

    dragSnapshotRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      scrollY: window.scrollY,
    };
    dragDeltaRef.current = { x: 0, y: 0 };
    setActivePersonKey(id.slice("person:".length));
    onPersonDragChange(true);
    setPreviewPosition({ x: rect.left, y: rect.top, width: rect.width });
  }

  function handleDragMove(event: DragMoveEvent) {
    if (!dragSnapshotRef.current) return;
    dragDeltaRef.current = event.delta;
    updatePreviewPosition();
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    const activeId = String(active.id);

    if (isFolderSortId(activeId)) {
      if (over) {
        const overId = String(over.id);
        if (isFolderSortId(overId) && activeId !== overId) {
          const draggedLayoutId = folderIdFromSortId(activeId);
          const overLayoutId = folderIdFromSortId(overId);
          setPreviewLayoutOrder((current) => {
            const order = current ?? resolvePeopleLayoutOrder(folders);
            const oldIndex = order.indexOf(draggedLayoutId);
            const newIndex = order.indexOf(overLayoutId);
            if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return order;
            return arrayMove(order, oldIndex, newIndex);
          });
        }
      }
      return;
    }

    if (!isPersonDragId(activeId)) {
      onHighlightFolder(undefined);
      return;
    }

    const folderCollision = event.collisions?.find((hit) => isFolderDropId(String(hit.id)));
    if (folderCollision) {
      onHighlightFolder(folderIdFromDropId(String(folderCollision.id)) ?? null);
      return;
    }

    if (over && isPersonDragId(String(over.id))) {
      const nameKey = String(over.id).slice("person:".length);
      const person = people.find((entry) => entry.nameKey === nameKey);
      onHighlightFolder(person?.folderId ?? null);
      return;
    }

    onHighlightFolder(undefined);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = String(active.id);

    if (isFolderSortId(activeId)) {
      if (previewLayoutOrder) {
        onApplyLayoutOrder(previewLayoutOrder);
        onFolderReorderDone();
      }
      resetDrag();
      return;
    }

    const personKey = activePersonKey;
    resetDrag();

    if (!over || !personKey) return;
    const overId = String(over.id);

    if (isPersonDragId(activeId) && isPersonDragId(overId) && activeId !== overId) {
      onDropPersonOnPerson(personKey, overId.slice("person:".length));
      return;
    }

    if (isPersonDragId(activeId)) {
      let targetFolderId: string | null | undefined;

      if (isFolderDropId(overId)) {
        targetFolderId = folderIdFromDropId(overId);
      } else if (isFolderSortId(overId)) {
        const folderId = folderIdFromSortId(overId);
        targetFolderId = folderId === UNSORTED_DROP_ID ? null : folderId;
      }

      if (targetFolderId !== undefined) {
        const person = people.find((entry) => entry.nameKey === personKey);
        const currentFolderId = person?.folderId ?? null;
        if (person && currentFolderId !== targetFolderId) {
          onMovePersonToFolder(personKey, targetFolderId);
        }
      }
    }
  }

  return (
    <AppDndContext
      sensors={sensors}
      collisionDetection={peopleListCollisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={resetDrag}
    >
      <SortableContext items={folderSortableIds} strategy={verticalListSortingStrategy}>
        {children(layoutOrder)}
      </SortableContext>
      {activePerson && previewPosition ? (
        <PersonDragPreview person={activePerson} position={previewPosition} />
      ) : null}
    </AppDndContext>
  );
}
