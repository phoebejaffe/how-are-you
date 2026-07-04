import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FriendsSection } from "../components/home/FriendsSection";
import { NearbyLocationSection } from "../components/home/NearbyLocationSection";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { personMatchesSearch } from "../lib/peopleSearch";
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
  const dropPersonOnPerson = useAppStore((s) => s.dropPersonOnPerson);
  const applyPeopleLayoutOrder = useAppStore((s) => s.applyPeopleLayoutOrder);
  const bundles = useAppStore((s) => s.bundles);
  const ensureSearchBundles = useAppStore((s) => s.ensureSearchBundles);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const allPeople = useMemo(
    () => people.filter((p) => !pendingDeletes.has(p.nameKey)),
    [people, pendingDeletes],
  );

  useEffect(() => {
    if (!query.trim()) return;
    void ensureSearchBundles();
  }, [query, ensureSearchBundles]);

  const visible = useMemo(() => {
    const q = query.trim();
    if (!q) return allPeople;
    return allPeople.filter((person) => personMatchesSearch(person, bundles[person.nameKey], q));
  }, [allPeople, query, bundles]);

  const searching = query.trim().length > 0;

  return (
    <div className="page page-enter">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] font-normal leading-tight text-ink sm:text-3xl">
            How Are You
          </h1>
          <p className="mt-1.5 text-[0.9375rem] text-ink-muted">Remember what to ask your people</p>
        </div>
        <div className="mt-1 flex shrink-0 items-center gap-2">
          <Link to="/map" className="btn-ghost btn-compact">
            Map
          </Link>
          <Link to="/settings" className="btn-ghost btn-compact">
            Settings
          </Link>
        </div>
      </header>

      <NearbyLocationSection people={allPeople} />

      <div className="card-padded mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, topics, and facts…"
          className="input"
        />
      </div>

      <FriendsSection
        people={searching ? visible : allPeople}
        folders={peopleFolders}
        sortable={!searching}
        onDeletePerson={setDeleteTarget}
        onAddPerson={addPerson}
        onMovePersonToFolder={(nameKey, folderId) => void movePersonToFolder(nameKey, folderId)}
        onDropPersonOnPerson={(draggedKey, targetKey) => void dropPersonOnPerson(draggedKey, targetKey)}
        onAddFolder={(name) => void addPeopleFolder(name)}
        onRenameFolder={(folderId, name) => void renamePeopleFolder(folderId, name)}
        onDeleteFolder={(folderId) => void deletePeopleFolder(folderId)}
        onToggleFolderCollapsed={(folderId) => void togglePeopleFolderCollapsed(folderId)}
        onApplyLayoutOrder={(order) => void applyPeopleLayoutOrder(order)}
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
