import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useAppStore } from "../store/appStore";

export function HomePage() {
  const people = useAppStore((s) => s.people);
  const pendingDeletes = useAppStore((s) => s.pendingDeletes);
  const addPerson = useAppStore((s) => s.addPerson);
  const scheduleDeletePerson = useAppStore((s) => s.scheduleDeletePerson);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people
      .filter((p) => !pendingDeletes.has(p.nameKey))
      .filter((p) => !q || p.displayName.toLowerCase().includes(q));
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
    <div className="mx-auto max-w-lg px-4 py-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-800">How Are You</h1>
          <p className="mt-1 text-sm text-stone-500">Remember what to ask your friends</p>
        </div>
        <Link
          to="/settings"
          className="rounded-lg px-3 py-1.5 text-sm text-stone-600 ring-1 ring-stone-300 hover:bg-white/60"
        >
          Settings
        </Link>
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search friends…"
        className="mb-3 w-full rounded-lg border border-stone-300 bg-white/80 px-3 py-2 text-sm"
      />

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a friend…"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white/80 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-dark"
        >
          Add
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-terracotta-dark">{error}</p>}

      <ul className="divide-y divide-stone-200/80 rounded-xl bg-white/50 ring-1 ring-stone-200/60">
        {visible.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-stone-400">No friends yet — add someone above.</li>
        )}
        {visible.map((person) => (
          <li key={person.nameKey} className="group flex items-center">
            <Link
              to={`/person/${encodeURIComponent(person.nameKey)}`}
              className="min-w-0 flex-1 truncate px-4 py-2.5 text-sm font-medium text-stone-800 hover:bg-white/60"
            >
              {person.displayName}
            </Link>
            <button
              type="button"
              onClick={() => setDeleteTarget(person.nameKey)}
              className="mr-2 rounded p-1 text-xs opacity-0 hover:bg-stone-200 group-hover:opacity-100"
              title="Delete person"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>

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
