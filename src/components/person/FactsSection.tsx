import { useState } from "react";
import type { Channel, Fact, FactFolder } from "../../types";
import { factDragId } from "../dnd/dndIds";
import { factsLayoutStorageKey } from "../../lib/factFolders";
import { CollectionItemOverlay } from "../dnd/CollectionItemOverlay";
import { CollectionSection } from "../collection/CollectionSection";
import { FactCollectionItem } from "../collection/FactCollectionItem";
import { SortableFactItem } from "../collection/SortableFactItem";

export function FactsSection({
  personKey,
  folders,
  unpinnedFacts,
  onAddFact,
  onPin,
  onDeleteFact,
  onEdit,
  onMoveToFolder,
  onReorderFacts,
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
  onReorderFacts: (draggedId: string, targetId: string) => void;
  onAddFolder: (name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolderCollapsed: (folderId: string) => void;
  onReorderLayout: (draggedId: string, targetId: string) => void;
}) {
  const [factText, setFactText] = useState("");
  const [targetFolderId, setTargetFolderId] = useState("");
  const hasFolders = folders.length > 0;

  return (
    <CollectionSection
      title="Facts"
      addLinkLabel="add a fact"
      emptyMessage="No facts yet."
      layoutStorageKey={factsLayoutStorageKey(personKey)}
      items={unpinnedFacts}
      folders={folders}
      features={{
        folders: true,
        folderCreate: true,
        dragItems: true,
        dragFolders: true,
        addFolderPicker: true,
      }}
      getItemDragId={(fact) => factDragId(fact.id)}
      onAddFolder={onAddFolder}
      onRenameFolder={onRenameFolder}
      onDeleteFolder={onDeleteFolder}
      onToggleFolderCollapsed={onToggleFolderCollapsed}
      onMoveItemToFolder={(factId, folderId) => onMoveToFolder(factId, folderId)}
      onReorderItems={onReorderFacts}
      onReorderFolders={onReorderLayout}
      addForm={({ onDone }) => (
        <form
          className="my-1 flex flex-wrap items-center gap-1 px-1"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = factText.trim();
            if (!trimmed) return;
            onAddFact(trimmed, targetFolderId || undefined);
            setFactText("");
            onDone();
          }}
        >
          <input
            value={factText}
            onChange={(e) => setFactText(e.target.value)}
            placeholder="Add a fact…"
            className="input input-compact min-w-0 flex-1"
            autoFocus
          />
          {hasFolders && (
            <select
              value={targetFolderId}
              onChange={(e) => setTargetFolderId(e.target.value)}
              className="input input-compact w-auto text-ink-muted"
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
          <button type="submit" className="btn-primary btn-compact">
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setFactText("");
              onDone();
            }}
            aria-label="Cancel"
            className="btn-ghost btn-compact min-w-11 px-3"
          >
            ✕
          </button>
        </form>
      )}
      renderItem={(fact, { sortable }) =>
        sortable ? (
          <SortableFactItem
            fact={fact}
            folders={folders}
            onPin={() => onPin(fact.id)}
            onDelete={() => onDeleteFact(fact.id)}
            onEdit={(text, ch) => onEdit(fact.id, text, ch)}
            onMoveToFolder={(folderId) => onMoveToFolder(fact.id, folderId)}
          />
        ) : (
          <FactCollectionItem
            fact={fact}
            folders={folders}
            draggable
            onPin={() => onPin(fact.id)}
            onDelete={() => onDeleteFact(fact.id)}
            onEdit={(text, ch) => onEdit(fact.id, text, ch)}
            onMoveToFolder={(folderId) => onMoveToFolder(fact.id, folderId)}
          />
        )
      }
      renderDragOverlay={(fact) => (
        <CollectionItemOverlay text={fact.text} timestampIso={fact.recordedAtIso} />
      )}
    />
  );
}
