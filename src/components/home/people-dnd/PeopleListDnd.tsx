import {
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo, useRef, useState, type ReactNode } from "react";
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

function resolveOverId(over: DragEndEvent["over"], collisions: DragEndEvent["collisions"]): string | null {
  if (over) return String(over.id);
  const hit = collisions?.[0];
  return hit ? String(hit.id) : null;
}

function measurePersonDragRect(event: DragStartEvent): DragRectSnapshot | null {
  const measured = event.active.rect.current?.initial ?? event.active.rect.current?.translated;
  if (measured) {
    return { left: measured.left, top: measured.top, width: measured.width };
  }

  const target = event.activatorEvent.target;
  if (!(target instanceof Element)) return null;
  const row = target.closest("[data-person-drag-row]");
  const rect = row?.getBoundingClientRect();
  if (!rect) return null;
  return { left: rect.left, top: rect.top, width: rect.width };
}

type DragRectSnapshot = {
  left: number;
  top: number;
  width: number;
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

  const dragRectRef = useRef<DragRectSnapshot | null>(null);
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
    const start = dragRectRef.current;
    if (!start) return;
    setPreviewPosition({
      x: start.left + dragDeltaRef.current.x,
      y: start.top + dragDeltaRef.current.y,
      width: start.width,
    });
  }

  function clearPersonDrag() {
    setActivePersonKey(null);
    setPreviewPosition(null);
    dragRectRef.current = null;
    dragDeltaRef.current = { x: 0, y: 0 };
    onHighlightFolder(undefined);
    onPersonDragChange(false);
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (!isPersonDragId(id)) return;

    const start = measurePersonDragRect(event);
    if (!start) return;

    dragRectRef.current = start;
    dragDeltaRef.current = { x: 0, y: 0 };
    setActivePersonKey(id.slice("person:".length));
    onPersonDragChange(true);
    setPreviewPosition({ x: start.left, y: start.top, width: start.width });
  }

  function handleDragMove(event: DragMoveEvent) {
    if (!dragRectRef.current) return;
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
    const { active, over, collisions } = event;
    const activeId = String(active.id);

    if (isFolderSortId(activeId)) {
      if (previewLayoutOrder) {
        onApplyLayoutOrder(previewLayoutOrder);
        onFolderReorderDone();
      }
      setPreviewLayoutOrder(null);
      clearPersonDrag();
      return;
    }

    if (!isPersonDragId(activeId)) {
      clearPersonDrag();
      return;
    }

    const personKey = activeId.slice("person:".length);
    const overId = resolveOverId(over, collisions);
    clearPersonDrag();

    if (!overId) return;

    if (isPersonDragId(overId) && overId !== activeId) {
      onDropPersonOnPerson(personKey, overId.slice("person:".length));
      return;
    }

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

  function handleDragCancel() {
    setPreviewLayoutOrder(null);
    clearPersonDrag();
  }

  return (
    <AppDndContext
      sensors={sensors}
      collisionDetection={peopleListCollisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
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
