import type { Channel, Fact, FactFolder } from "../../types";
import { UNSORTED_DROP_ID } from "../../lib/factFolders";
import { FactRow } from "./FactRow";

export function UnsortedFactsSection({
  facts,
  folders,
  isDropTarget,
  onPin,
  onDeleteFact,
  onEdit,
  onMoveToFolder,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  facts: Fact[];
  folders: FactFolder[];
  isDropTarget: boolean;
  onPin: (factId: string) => void;
  onDeleteFact: (factId: string) => void;
  onEdit: (factId: string, text: string, channel: Channel) => void;
  onMoveToFolder: (factId: string, folderId: string | null) => void;
  onDragStart: (factId: string) => void;
  onDragEnd: () => void;
  onDragOver: (targetId: string) => void;
  onDragLeave: (targetId: string) => void;
  onDrop: (targetId: string) => void;
}) {
  if (facts.length === 0) return null;

  return (
    <div
      className={`mb-2 rounded-lg bg-stone-100/80 px-1 py-1 transition-shadow ${
        isDropTarget ? "ring-2 ring-sage/60" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(UNSORTED_DROP_ID);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onDragLeave(UNSORTED_DROP_ID);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(UNSORTED_DROP_ID);
      }}
    >
      <p className="px-2 py-0.5 text-xs font-semibold text-stone-500">Unsorted ({facts.length})</p>
      {facts.map((fact) => (
        <FactRow
          key={fact.id}
          fact={fact}
          folders={folders}
          draggable
          onDragStart={() => onDragStart(fact.id)}
          onDragEnd={onDragEnd}
          onPin={() => onPin(fact.id)}
          onDelete={() => onDeleteFact(fact.id)}
          onEdit={(text, ch) => onEdit(fact.id, text, ch)}
          onMoveToFolder={(folderId) => onMoveToFolder(fact.id, folderId)}
        />
      ))}
    </div>
  );
}
