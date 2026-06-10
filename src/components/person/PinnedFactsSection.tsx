import { closestCenter, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { AppDndContext } from "../dnd/AppDndContext";
import { AppDragOverlay } from "../dnd/AppDragOverlay";
import { CollectionItemOverlay } from "../dnd/CollectionItemOverlay";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import type { Channel, Fact, FactFolder } from "../../types";
import { factDragId } from "../dnd/dndIds";
import { useAppDndSensors } from "../dnd/dndSensors";
import { SortableFactItem } from "../collection/SortableFactItem";

export function PinnedFactsSection({
  facts,
  folders,
  onPin,
  onDelete,
  onEdit,
  onMoveToFolder,
  onReorderPinnedFacts,
}: {
  facts: Fact[];
  folders: FactFolder[];
  onPin: (factId: string) => void;
  onDelete: (factId: string) => void;
  onEdit: (factId: string, text: string, channel: Channel) => void;
  onMoveToFolder: (factId: string, folderId: string | null) => void;
  onReorderPinnedFacts: (draggedId: string, targetId: string) => void;
}) {
  const sensors = useAppDndSensors();
  const sortableIds = useMemo(() => facts.map((f) => factDragId(f.id)), [facts]);
  const [activeFactId, setActiveFactId] = useState<string | null>(null);
  const activeFact = activeFactId ? facts.find((f) => f.id === activeFactId) : null;

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (id.startsWith("fact:")) setActiveFactId(id.slice("fact:".length));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveFactId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("fact:") || !overId.startsWith("fact:") || activeId === overId) return;
    onReorderPinnedFacts(activeId.slice("fact:".length), overId.slice("fact:".length));
  }

  if (facts.length === 0) return null;

  return (
    <section className="pinned-strip">
      <h2 className="section-label mb-2 text-amber-800/80">Pinned facts</h2>
      <AppDndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {facts.map((fact) => (
            <SortableFactItem
              key={fact.id}
              fact={fact}
              folders={folders}
              onPin={() => onPin(fact.id)}
              onDelete={() => onDelete(fact.id)}
              onEdit={(text, ch) => onEdit(fact.id, text, ch)}
              onMoveToFolder={(folderId) => onMoveToFolder(fact.id, folderId)}
            />
          ))}
        </SortableContext>

        <AppDragOverlay>
          {activeFact ? (
            <CollectionItemOverlay text={activeFact.text} timestampIso={activeFact.recordedAtIso} compact />
          ) : null}
        </AppDragOverlay>
      </AppDndContext>
    </section>
  );
}
