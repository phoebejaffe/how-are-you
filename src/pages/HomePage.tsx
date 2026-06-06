import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FriendsSection } from "../components/home/FriendsSection";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useAppStore } from "../store/appStore";

export function HomePage() {
  const people = useAppStore((s) => s.people);
  const peopleFolders = useAppStore((s) => s.peopleFolders);
  const pendingDeletes = useAppStore((s) => s.pendingDeletes);
  const addPerson = useAppStore((s) => s.addPerson);
  const scheduleDeletePerson = useAppStore((s) => s.scheduleDeletePerson);
  const addPeopleFolder = useAppStore((s) => s.addPeopleFolder);
  const renamePeopleFolder = useAppStore((s) => s.renamePeopleFolder);
  const deletePeopleFolder = useAppStore((s) => s.deletePeopleFolder);
  const togglePeopleFolderCollapsed = useAppStore((s) => s.togglePeopleFolderCollapsed);
  const movePersonToFolder = useAppStore((s) => s.movePersonToFolder);
  const reorderPeople = useAppStore((s) => s.reorderPeople);
  const reorderPeopleLayout = useAppStore((s) => s.reorderPeopleLayout);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => !pendingDeletes.has(p.nameKey)).filter((p) => !q || p.displayName.toLowerCase().includes(q));
  }, [people, pendingDeletes, query]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await addPerson(newName);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add person.");
    }
  }

  return (
    <div className="page page-enter">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] font-normal leading-tight text-ink sm:text-3xl">
            How Are You
          </h1>
          <p className="mt-1.5 text-[0.9375rem] text-ink-muted">Remember what to ask your friends</p>
        </div>
        <Link to="/settings" className="btn-ghost btn-compact mt-1">
          Settings
        </Link>
      </header>

      <div className="card-padded mb-6 space-y-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search friends…"
          className="input"
        />

        <form onSubmit={handleAdd} className="flex gap-2.5">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add a friend…"
            className="input min-w-0 flex-1"
          />
          <button type="submit" className="btn-primary">
            Add
          </button>
        </form>
        {error && <p className="text-sm text-terracotta-dark">{error}</p>}
      </div>

      <FriendsSection
        people={visible}
        folders={peopleFolders}
        onDeletePerson={setDeleteTarget}
        onMovePersonToFolder={(nameKey, folderId) => void movePersonToFolder(nameKey, folderId)}
        onReorderPeople={(draggedKey, targetKey) => void reorderPeople(draggedKey, targetKey)}
        onAddFolder={(name) => void addPeopleFolder(name)}
        onRenameFolder={(folderId, name) => void renamePeopleFolder(folderId, name)}
        onDeleteFolder={(folderId) => void deletePeopleFolder(folderId)}
        onToggleFolderCollapsed={(folderId) => void togglePeopleFolderCollapsed(folderId)}
        onReorderLayout={(draggedId, targetId) => void reorderPeopleLayout(draggedId, targetId)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete person?"
        message="This will remove the person and all their topics and facts."
        onConfirm={() => {
          if (deleteTarget) void scheduleDeletePerson(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
