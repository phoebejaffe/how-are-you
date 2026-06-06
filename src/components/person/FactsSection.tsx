import { useCallback, useMemo, useState } from "react";
import type { Channel, Fact, FactFolder } from "../../types";
import { groupUnpinnedFacts, UNSORTED_DROP_ID } from "../../lib/factFolders";
import { FactFolderSection } from "./FactFolderSection";
import { UnsortedFactsSection } from "./UnsortedFactsSection";

export function FactsSection({
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
}: {
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
}) {
  const [factText, setFactText] = useState("");
  const [targetFolderId, setTargetFolderId] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [draggingFactId, setDraggingFactId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const grouped = useMemo(() => groupUnpinnedFacts(unpinnedFacts, folders), [unpinnedFacts, folders]);
  const hasFolders = folders.length > 0;
  const hasAnyFacts = unpinnedFacts.length > 0 || hasFolders;

  const handleDragStart = useCallback((factId: string) => {
    setDraggingFactId(factId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingFactId(null);
    setDropTargetId(null);
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      const factId = draggingFactId;
      handleDragEnd();
      if (!factId) return;

      const fact = unpinnedFacts.find((f) => f.id === factId);
      if (!fact) return;

      const targetFolderId = targetId === UNSORTED_DROP_ID ? null : targetId;
      const currentFolderId = fact.folderId ?? null;
      if (currentFolderId === targetFolderId) return;

      onMoveToFolder(factId, targetFolderId);
    },
    [draggingFactId, handleDragEnd, onMoveToFolder, unpinnedFacts],
  );

  return (
    <section className="mb-3">
      <h2 className="mb-1 px-2 text-xs font-bold uppercase tracking-wide text-stone-600">Facts</h2>

      <form
        className="mb-2 flex flex-wrap gap-1 px-1"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = factText.trim();
          if (!trimmed) return;
          onAddFact(trimmed, targetFolderId || undefined);
          setFactText("");
        }}
      >
        <input
          value={factText}
          onChange={(e) => setFactText(e.target.value)}
          placeholder="Add a fact…"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white/80 px-3 py-1.5 text-sm"
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
      </form>

      <div className="mb-2 px-1">
        {addingFolder ? (
          <form
            className="flex flex-wrap items-center gap-1"
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
              className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAddingFolder(true)}
            className="text-xs text-stone-400 hover:text-stone-600 hover:underline"
          >
            New folder
          </button>
        )}
      </div>

      <div className="rounded-lg bg-white/40 px-1 py-1">
        {!hasAnyFacts && <p className="px-2 py-2 text-center text-xs text-stone-400">No facts yet.</p>}

        <UnsortedFactsSection
          facts={grouped.unsorted}
          folders={folders}
          isDropTarget={dropTargetId === UNSORTED_DROP_ID}
          onPin={onPin}
          onDeleteFact={onDeleteFact}
          onEdit={onEdit}
          onMoveToFolder={onMoveToFolder}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={setDropTargetId}
          onDragLeave={(id) => setDropTargetId((current) => (current === id ? null : current))}
          onDrop={handleDrop}
        />

        {grouped.folders.map(({ folder, facts }) => (
          <FactFolderSection
            key={folder.id}
            folder={folder}
            facts={facts}
            allFolders={folders}
            isDropTarget={dropTargetId === folder.id}
            onToggleCollapsed={() => onToggleFolderCollapsed(folder.id)}
            onRename={(name) => onRenameFolder(folder.id, name)}
            onDelete={() => onDeleteFolder(folder.id)}
            onPin={onPin}
            onDeleteFact={onDeleteFact}
            onEdit={onEdit}
            onMoveToFolder={onMoveToFolder}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={setDropTargetId}
            onDragLeave={(id) => setDropTargetId((current) => (current === id ? null : current))}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </section>
  );
}
