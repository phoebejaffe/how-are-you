import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PinnedTopicsSection } from "../components/collection/PinnedTopicsSection";
import { TopicsSection } from "../components/collection/TopicsSection";
import { FactsSection } from "../components/person/FactsSection";
import { PinnedFactsSection } from "../components/person/PinnedFactsSection";
import { RowMenu } from "../components/ui/RowMenu";
import { sortPinnedFacts } from "../lib/factOrder";
import { computeTimeCluster } from "../lib/timeCluster";
import { sortPinnedTopics, sortUnpinnedTopics } from "../lib/topicOrder";
import { useAppStore } from "../store/appStore";

export function PersonPage() {
  const navigate = useNavigate();
  const { nameKey: encoded } = useParams();
  const nameKey = encoded ? decodeURIComponent(encoded) : "";
  const bundle = useAppStore((s) => s.bundles[nameKey]);
  const pendingTopicDeletes = useAppStore((s) => s.pendingTopicDeletes);
  const pendingFactDeletes = useAppStore((s) => s.pendingFactDeletes);
  const pendingFollowUpDeletes = useAppStore((s) => s.pendingFollowUpDeletes);
  const loadBundle = useAppStore((s) => s.loadBundle);
  const renamePerson = useAppStore((s) => s.renamePerson);
  const addTopic = useAppStore((s) => s.addTopic);
  const addFact = useAppStore((s) => s.addFact);
  const scheduleArchiveTopic = useAppStore((s) => s.scheduleArchiveTopic);
  const unarchiveTopic = useAppStore((s) => s.unarchiveTopic);
  const scheduleDeleteTopic = useAppStore((s) => s.scheduleDeleteTopic);
  const toggleTopicPin = useAppStore((s) => s.toggleTopicPin);
  const reorderTopics = useAppStore((s) => s.reorderTopics);
  const reorderPinnedTopics = useAppStore((s) => s.reorderPinnedTopics);
  const moveTopicToFolder = useAppStore((s) => s.moveTopicToFolder);
  const addTopicFolder = useAppStore((s) => s.addTopicFolder);
  const renameTopicFolder = useAppStore((s) => s.renameTopicFolder);
  const deleteTopicFolder = useAppStore((s) => s.deleteTopicFolder);
  const toggleTopicFolderCollapsed = useAppStore((s) => s.toggleTopicFolderCollapsed);
  const reorderTopicsLayout = useAppStore((s) => s.reorderTopicsLayout);
  const updateTopic = useAppStore((s) => s.updateTopic);
  const addFollowUp = useAppStore((s) => s.addFollowUp);
  const updateFollowUp = useAppStore((s) => s.updateFollowUp);
  const scheduleDeleteFollowUp = useAppStore((s) => s.scheduleDeleteFollowUp);
  const updateFact = useAppStore((s) => s.updateFact);
  const toggleFactPin = useAppStore((s) => s.toggleFactPin);
  const scheduleDeleteFact = useAppStore((s) => s.scheduleDeleteFact);
  const moveFactToFolder = useAppStore((s) => s.moveFactToFolder);
  const reorderFacts = useAppStore((s) => s.reorderFacts);
  const reorderPinnedFacts = useAppStore((s) => s.reorderPinnedFacts);
  const addFactFolder = useAppStore((s) => s.addFactFolder);
  const renameFactFolder = useAppStore((s) => s.renameFactFolder);
  const deleteFactFolder = useAppStore((s) => s.deleteFactFolder);
  const toggleFactFolderCollapsed = useAppStore((s) => s.toggleFactFolderCollapsed);
  const reorderFactsLayout = useAppStore((s) => s.reorderFactsLayout);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [clusterAnchorIso, setClusterAnchorIso] = useState<string | null>(null);

  useEffect(() => {
    if (nameKey) void loadBundle(nameKey);
  }, [nameKey, loadBundle]);

  useEffect(() => {
    setClusterAnchorIso(null);
  }, [nameKey]);

  useEffect(() => {
    if (!clusterAnchorIso) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-time-cluster-trigger]")) return;
      setClusterAnchorIso(null);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [clusterAnchorIso]);

  const timeCluster = useMemo(() => {
    if (!bundle || !clusterAnchorIso) {
      return { topicIds: new Set<string>(), followUpIds: new Set<string>() };
    }
    return computeTimeCluster(bundle, clusterAnchorIso, pendingTopicDeletes, pendingFollowUpDeletes);
  }, [bundle, clusterAnchorIso, pendingTopicDeletes, pendingFollowUpDeletes]);

  const handleClusterSelect = useCallback((iso: string) => {
    setClusterAnchorIso((current) => (current === iso ? null : iso));
  }, []);

  useEffect(() => {
    if (bundle) setNameInput(bundle.person.displayName);
  }, [bundle]);

  const visibleTopics = useMemo(() => {
    if (!bundle) return { pinned: [], unpinned: [], archived: [] };
    const topics = bundle.topics.filter((t) => !pendingTopicDeletes.has(t.id));
    const active = topics.filter((t) => t.status === "active");
    const archived = topics.filter((t) => t.status === "archived");
    return {
      pinned: sortPinnedTopics(active),
      unpinned: sortUnpinnedTopics(active),
      archived,
    };
  }, [bundle, pendingTopicDeletes]);

  const { pinnedFacts, unpinnedFacts } = useMemo(() => {
    if (!bundle) return { pinnedFacts: [], unpinnedFacts: [] };
    const facts = bundle.facts.filter((f) => !pendingFactDeletes.has(f.id));
    return {
      pinnedFacts: sortPinnedFacts(facts.filter((f) => f.pinned)),
      unpinnedFacts: facts.filter((f) => !f.pinned),
    };
  }, [bundle, pendingFactDeletes]);

  if (!bundle) {
    return (
      <div className="page page-enter">
        <Link to="/" className="back-link">
          ← Friends
        </Link>
        <p className="mt-6 text-sm text-ink-muted">Loading…</p>
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

  const topicFolders = bundle.topicFolders ?? [];

  return (
    <div className="page page-enter">
      <Link to="/" className="back-link">
        ← Friends
      </Link>

      <header className="mt-5 mb-6">
        {editingName ? (
          <div className="flex gap-2.5">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="input min-w-0 flex-1 font-display text-xl"
              autoFocus
            />
            <button type="button" onClick={() => void saveName()} className="btn-primary btn-compact">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingName(false);
                setNameInput(bundle.person.displayName);
              }}
              aria-label="Cancel"
              className="btn-ghost btn-compact min-w-11 px-3"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <h1 className="min-w-0 flex-1 font-display text-[1.75rem] font-normal leading-tight text-ink sm:text-3xl">
              {bundle.person.displayName}
            </h1>
            <RowMenu items={[{ label: "Rename", onClick: () => setEditingName(true) }]} />
          </div>
        )}
        {nameError && <p className="mt-2 text-sm text-terracotta-dark">{nameError}</p>}
      </header>

      <div className="space-y-5">
        <PinnedFactsSection
          facts={pinnedFacts}
          folders={bundle.factFolders ?? []}
          onPin={(factId) => void toggleFactPin(factId)}
          onDelete={(factId) => void scheduleDeleteFact(factId)}
          onEdit={(factId, text, ch) => void updateFact(factId, text, ch)}
          onMoveToFolder={(factId, folderId) => void moveFactToFolder(factId, folderId)}
          onReorderPinnedFacts={(draggedId, targetId) => void reorderPinnedFacts(nameKey, draggedId, targetId)}
        />

        <PinnedTopicsSection
          topics={visibleTopics.pinned}
          folders={topicFolders}
          followUps={bundle.followUps}
          pendingFollowUpDeletes={pendingFollowUpDeletes}
          topicHighlighted={(id) => timeCluster.topicIds.has(id)}
          followUpHighlighted={(id) => timeCluster.followUpIds.has(id)}
          onClusterSelect={handleClusterSelect}
          onPin={(id) => void toggleTopicPin(id)}
          onArchive={(id) => void scheduleArchiveTopic(id)}
          onDelete={(id) => void scheduleDeleteTopic(id)}
          onEdit={(id, text, ch) => void updateTopic(id, text, ch)}
          onAddFollowUp={(topicId, text, ch) => void addFollowUp(topicId, text, ch)}
          onEditFollowUp={(id, text, ch) => void updateFollowUp(id, text, ch)}
          onDeleteFollowUp={(id) => void scheduleDeleteFollowUp(id)}
          onMoveToFolder={(topicId, folderId) => void moveTopicToFolder(topicId, folderId)}
          onReorderPinnedTopics={(draggedId, targetId) => void reorderPinnedTopics(nameKey, draggedId, targetId)}
        />

        <TopicsSection
          personKey={nameKey}
          unpinnedTopics={visibleTopics.unpinned}
          folders={topicFolders}
          archivedTopics={visibleTopics.archived}
          followUps={bundle.followUps}
          pendingFollowUpDeletes={pendingFollowUpDeletes}
          topicHighlighted={(id) => timeCluster.topicIds.has(id)}
          followUpHighlighted={(id) => timeCluster.followUpIds.has(id)}
          onClusterSelect={handleClusterSelect}
          onAddTopic={(text, channel, folderId) => void addTopic(nameKey, text, channel, folderId)}
          onPin={(id) => void toggleTopicPin(id)}
          onArchive={(id) => void scheduleArchiveTopic(id)}
          onUnarchive={(id) => void unarchiveTopic(id)}
          onDelete={(id) => void scheduleDeleteTopic(id)}
          onEdit={(id, text, ch) => void updateTopic(id, text, ch)}
          onAddFollowUp={(topicId, text, ch) => void addFollowUp(topicId, text, ch)}
          onEditFollowUp={(id, text, ch) => void updateFollowUp(id, text, ch)}
          onDeleteFollowUp={(id) => void scheduleDeleteFollowUp(id)}
          onMoveToFolder={(topicId, folderId) => void moveTopicToFolder(topicId, folderId)}
          onAddFolder={(name) => void addTopicFolder(nameKey, name)}
          onRenameFolder={(folderId, name) => void renameTopicFolder(folderId, name)}
          onDeleteFolder={(folderId) => void deleteTopicFolder(folderId)}
          onToggleFolderCollapsed={(folderId) => void toggleTopicFolderCollapsed(folderId)}
          onReorderLayout={(draggedId, targetId) => void reorderTopicsLayout(nameKey, draggedId, targetId)}
          onReorderTopics={(draggedId, targetId) => void reorderTopics(nameKey, draggedId, targetId)}
        />

        <FactsSection
          personKey={nameKey}
          folders={bundle.factFolders ?? []}
          unpinnedFacts={unpinnedFacts}
          onAddFact={(text, folderId) => void addFact(nameKey, text, "text", false, folderId)}
          onPin={(factId) => void toggleFactPin(factId)}
          onDeleteFact={(factId) => void scheduleDeleteFact(factId)}
          onEdit={(factId, text, ch) => void updateFact(factId, text, ch)}
          onMoveToFolder={(factId, folderId) => void moveFactToFolder(factId, folderId)}
          onAddFolder={(name) => void addFactFolder(nameKey, name)}
          onRenameFolder={(folderId, name) => void renameFactFolder(folderId, name)}
          onDeleteFolder={(folderId) => void deleteFactFolder(folderId)}
          onToggleFolderCollapsed={(folderId) => void toggleFactFolderCollapsed(folderId)}
          onReorderLayout={(draggedId, targetId) => void reorderFactsLayout(nameKey, draggedId, targetId)}
          onReorderFacts={(draggedId, targetId) => void reorderFacts(nameKey, draggedId, targetId)}
        />
      </div>
    </div>
  );
}
