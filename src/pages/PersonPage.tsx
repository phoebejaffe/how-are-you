import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FactRow } from "../components/person/FactRow";
import { TopicRow } from "../components/person/TopicRow";
import { ChannelPicker } from "../components/ui/ChannelPicker";
import type { Channel } from "../types";
import { useAppStore } from "../store/appStore";

export function PersonPage() {
  const navigate = useNavigate();
  const { nameKey: encoded } = useParams();
  const nameKey = encoded ? decodeURIComponent(encoded) : "";
  const bundle = useAppStore((s) => s.bundles[nameKey]);
  const pendingTopicDeletes = useAppStore((s) => s.pendingTopicDeletes);
  const pendingFactDeletes = useAppStore((s) => s.pendingFactDeletes);
  const loadBundle = useAppStore((s) => s.loadBundle);
  const renamePerson = useAppStore((s) => s.renamePerson);
  const addTopic = useAppStore((s) => s.addTopic);
  const addFact = useAppStore((s) => s.addFact);
  const scheduleArchiveTopic = useAppStore((s) => s.scheduleArchiveTopic);
  const scheduleDeleteTopic = useAppStore((s) => s.scheduleDeleteTopic);
  const toggleTopicPin = useAppStore((s) => s.toggleTopicPin);
  const updateTopic = useAppStore((s) => s.updateTopic);
  const addFollowUp = useAppStore((s) => s.addFollowUp);
  const updateFollowUp = useAppStore((s) => s.updateFollowUp);
  const updateFact = useAppStore((s) => s.updateFact);
  const toggleFactPin = useAppStore((s) => s.toggleFactPin);
  const scheduleDeleteFact = useAppStore((s) => s.scheduleDeleteFact);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [topicText, setTopicText] = useState("");
  const [topicChannel, setTopicChannel] = useState<Channel>("call");
  const [factText, setFactText] = useState("");
  const [factChannel, setFactChannel] = useState<Channel>("call");
  const [showArchived, setShowArchived] = useState(true);

  useEffect(() => {
    if (nameKey) void loadBundle(nameKey);
  }, [nameKey, loadBundle]);

  useEffect(() => {
    if (bundle) setNameInput(bundle.person.displayName);
  }, [bundle]);

  const visibleTopics = useMemo(() => {
    if (!bundle) return { pinnedActive: [], active: [], archived: [] };
    const topics = bundle.topics.filter((t) => !pendingTopicDeletes.has(t.id));
    const active = topics.filter((t) => t.status === "active");
    const archived = topics.filter((t) => t.status === "archived");
    return {
      pinnedActive: active.filter((t) => t.pinned),
      active: active.filter((t) => !t.pinned),
      archived,
    };
  }, [bundle, pendingTopicDeletes]);

  const { pinnedFacts, unpinnedFacts } = useMemo(() => {
    if (!bundle) return { pinnedFacts: [], unpinnedFacts: [] };
    const facts = bundle.facts.filter((f) => !pendingFactDeletes.has(f.id));
    return {
      pinnedFacts: facts.filter((f) => f.pinned),
      unpinnedFacts: facts.filter((f) => !f.pinned),
    };
  }, [bundle, pendingFactDeletes]);

  if (!bundle) {
    return (
      <div className="px-4 py-6 text-sm text-stone-500">
        <Link to="/" className="text-terracotta hover:underline">
          ← Back
        </Link>
        <p className="mt-4">Loading…</p>
      </div>
    );
  }

  async function saveName() {
    setNameError("");
    try {
      const newKey = await renamePerson(nameKey, nameInput);
      setEditingName(false);
      if (newKey !== nameKey) {
        navigate(`/person/${encodeURIComponent(newKey)}`, { replace: true });
      }
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Could not rename.");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <Link to="/" className="text-sm text-terracotta hover:underline">
        ← Friends
      </Link>

      <header className="mt-3 mb-4">
        {editingName ? (
          <div className="flex gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-1.5 font-display text-xl"
              autoFocus
            />
            <button type="button" onClick={() => void saveName()} className="rounded-lg bg-sage px-3 text-sm text-white">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingName(false);
                setNameInput(bundle.person.displayName);
              }}
              className="rounded-lg px-3 text-sm text-stone-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="font-display text-2xl font-semibold text-stone-800 hover:text-terracotta"
          >
            {bundle.person.displayName}
          </button>
        )}
        {nameError && <p className="mt-1 text-sm text-terracotta-dark">{nameError}</p>}
      </header>

      {pinnedFacts.length > 0 && (
        <section className="mb-3 rounded-lg bg-amber-50/80 px-2 py-1 ring-1 ring-amber-200/60">
          <h2 className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Pinned facts</h2>
          {pinnedFacts.map((fact) => (
            <FactRow
              key={fact.id}
              fact={fact}
              onPin={() => void toggleFactPin(fact.id)}
              onDelete={() => void scheduleDeleteFact(fact.id)}
              onEdit={(text, ch) => void updateFact(fact.id, text, ch)}
            />
          ))}
        </section>
      )}

      <form
        className="mb-4 flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          void addTopic(nameKey, topicText, topicChannel);
          setTopicText("");
        }}
      >
        <input
          value={topicText}
          onChange={(e) => setTopicText(e.target.value)}
          placeholder="New topic to ask about…"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white/80 px-3 py-1.5 text-sm"
        />
        <ChannelPicker value={topicChannel} onChange={setTopicChannel} />
        <button type="submit" className="rounded-lg bg-terracotta px-3 text-sm text-white">
          Add
        </button>
      </form>

      <section className="mb-3">
        <h2 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Topics</h2>
        <div className="rounded-lg bg-white/40 px-1 py-1">
          {[...visibleTopics.pinnedActive, ...visibleTopics.active].length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-stone-400">No active topics.</p>
          )}
          {visibleTopics.pinnedActive.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              followUps={bundle.followUps}
              onPin={() => void toggleTopicPin(topic.id)}
              onArchive={() => void scheduleArchiveTopic(topic.id)}
              onDelete={() => void scheduleDeleteTopic(topic.id)}
              onEdit={(text, ch) => void updateTopic(topic.id, text, ch)}
              onAddFollowUp={(text, ch) => void addFollowUp(topic.id, text, ch)}
              onEditFollowUp={(id, text, ch) => void updateFollowUp(id, text, ch)}
            />
          ))}
          {visibleTopics.active.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              followUps={bundle.followUps}
              onPin={() => void toggleTopicPin(topic.id)}
              onArchive={() => void scheduleArchiveTopic(topic.id)}
              onDelete={() => void scheduleDeleteTopic(topic.id)}
              onEdit={(text, ch) => void updateTopic(topic.id, text, ch)}
              onAddFollowUp={(text, ch) => void addFollowUp(topic.id, text, ch)}
              onEditFollowUp={(id, text, ch) => void updateFollowUp(id, text, ch)}
            />
          ))}
        </div>
      </section>

      <section className="mb-3">
        <h2 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Facts</h2>
        <form
          className="mb-2 flex gap-1 px-1"
          onSubmit={(e) => {
            e.preventDefault();
            void addFact(nameKey, factText, factChannel);
            setFactText("");
          }}
        >
          <input
            value={factText}
            onChange={(e) => setFactText(e.target.value)}
            placeholder="Add a fact…"
            className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1 text-xs"
          />
          <ChannelPicker value={factChannel} onChange={setFactChannel} />
          <button type="submit" className="rounded bg-sage px-2 text-xs text-white">
            Add
          </button>
        </form>
        <div className="rounded-lg bg-white/40 px-1 py-1">
          {unpinnedFacts.length === 0 && (
            <p className="px-2 py-2 text-center text-xs text-stone-400">No facts yet.</p>
          )}
          {unpinnedFacts.map((fact) => (
            <FactRow
              key={fact.id}
              fact={fact}
              onPin={() => void toggleFactPin(fact.id)}
              onDelete={() => void scheduleDeleteFact(fact.id)}
              onEdit={(text, ch) => void updateFact(fact.id, text, ch)}
            />
          ))}
        </div>
      </section>

      <section>
        <button
          type="button"
          onClick={() => setShowArchived((s) => !s)}
          className="mb-1 flex w-full items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wide text-stone-400"
        >
          <span>Archived ({visibleTopics.archived.length})</span>
          <span>{showArchived ? "▾" : "▸"}</span>
        </button>
        {showArchived && visibleTopics.archived.length > 0 && (
          <div className="rounded-lg bg-stone-100/50 px-1 py-1">
            {visibleTopics.archived.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                followUps={bundle.followUps}
                archived
                onPin={() => void toggleTopicPin(topic.id)}
                onArchive={() => {}}
                onDelete={() => void scheduleDeleteTopic(topic.id)}
                onEdit={(text, ch) => void updateTopic(topic.id, text, ch)}
                onAddFollowUp={() => {}}
                onEditFollowUp={(id, text, ch) => void updateFollowUp(id, text, ch)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
