import { useState, type HTMLAttributes } from "react";
import { DragHandle } from "../dnd/DragHandle";
import { CheckIcon } from "../ui/CheckIcon";
import { RowMenu, type RowMenuItem } from "../ui/RowMenu";

type HandleProps = HTMLAttributes<HTMLButtonElement>;

export function FolderHeader({
  name,
  count,
  collapsed,
  isFolderReorderTarget,
  onToggleCollapsed,
  onRename,
  onDeleteRequest,
  sortableHandleRef,
  sortableHandleProps,
  flush = false,
}: {
  name: string;
  count: number;
  collapsed: boolean;
  isFolderReorderTarget: boolean;
  onToggleCollapsed: () => void;
  onRename: (name: string) => void;
  onDeleteRequest: () => void;
  sortableHandleRef?: (node: HTMLButtonElement | null) => void;
  sortableHandleProps?: HandleProps;
  flush?: boolean;
}) {
  const padX = flush ? "px-3" : "px-4";
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);

  const menuItems: RowMenuItem[] = [
    {
      label: "Rename",
      onClick: () => {
        setNameInput(name);
        setEditingName(true);
      },
    },
    { label: "Delete folder", onClick: onDeleteRequest, destructive: true },
  ];

  return (
    <div
      className={`flex items-center gap-0.5 py-1 ${padX} ${isFolderReorderTarget ? "rounded-xl ring-2 ring-amber-400/70" : ""}`}
    >
      {editingName ? (
        <form
          className="flex min-w-0 flex-1 items-center gap-2 py-1"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = nameInput.trim();
            if (!trimmed) return;
            onRename(trimmed);
            setEditingName(false);
          }}
        >
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="input input-compact min-w-0 flex-1 text-sm"
            autoFocus
          />
          <button type="submit" className="btn-primary btn-compact min-w-11 px-3" aria-label="Save">
            <CheckIcon />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingName(false);
              setNameInput(name);
            }}
            aria-label="Cancel"
            className="btn-ghost btn-compact min-w-11 px-3"
          >
            ✕
          </button>
        </form>
      ) : (
        <>
          {sortableHandleProps && (
            <DragHandle ref={sortableHandleRef} compact className="shrink-0" {...sortableHandleProps} />
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={`flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl px-1 text-left text-sm font-semibold text-ink transition-colors active:bg-white/50`}
          >
            <span className="flex min-w-0 flex-1 items-baseline">
              <span className="truncate">{name}</span>
              {collapsed && (
                <span className="ml-2 shrink-0 text-xs font-normal tabular-nums text-ink-muted">({count})</span>
              )}
            </span>
          </button>
          <div onPointerDown={(e) => e.stopPropagation()}>
            <RowMenu items={menuItems} />
          </div>
        </>
      )}
    </div>
  );
}

export function UnsortedFolderHeader({
  label,
  count,
  isFolderReorderTarget,
  sortableHandleRef,
  sortableHandleProps,
  flush = false,
}: {
  label: string;
  count: number;
  isFolderReorderTarget: boolean;
  sortableHandleRef?: (node: HTMLButtonElement | null) => void;
  sortableHandleProps?: HandleProps;
  flush?: boolean;
}) {
  const padX = flush ? "px-3" : "px-4";
  return (
    <div
      className={`flex items-center gap-0.5 py-1 ${padX} ${isFolderReorderTarget ? "rounded-xl ring-2 ring-amber-400/70" : ""}`}
    >
      {sortableHandleProps && (
        <DragHandle ref={sortableHandleRef} compact className="shrink-0" {...sortableHandleProps} />
      )}
      <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-1 text-sm font-semibold text-ink-muted">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-xs font-normal tabular-nums">({count})</span>
      </div>
    </div>
  );
}
