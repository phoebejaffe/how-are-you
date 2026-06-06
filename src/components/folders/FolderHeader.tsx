import { useState, type HTMLAttributes } from "react";
import { RowMenu, type RowMenuItem } from "../ui/RowMenu";

type HandleProps = HTMLAttributes<HTMLElement>;

export function FolderHeader({
  name,
  count,
  collapsed,
  isFolderReorderTarget,
  onToggleCollapsed,
  onRename,
  onDeleteRequest,
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
      className={`flex items-center gap-1 py-1 ${padX} ${isFolderReorderTarget ? "rounded-xl ring-2 ring-amber-400/70" : ""}`}
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
            ✔️
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
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={`flex min-h-11 min-w-0 flex-1 cursor-pointer touch-none select-none items-center gap-2 rounded-xl text-left text-sm font-semibold text-ink transition-colors active:bg-white/50 ${flush ? "px-1" : "px-1"}`}
            {...sortableHandleProps}
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
  sortableHandleProps,
  flush = false,
}: {
  label: string;
  count: number;
  isFolderReorderTarget: boolean;
  sortableHandleProps?: HandleProps;
  flush?: boolean;
}) {
  const padX = flush ? "px-3" : "px-4";
  return (
    <div
      className={`flex items-center gap-1 py-1 ${padX} ${isFolderReorderTarget ? "rounded-xl ring-2 ring-amber-400/70" : ""}`}
    >
      <div
        className={`flex min-h-11 min-w-0 flex-1 touch-none select-none items-center gap-2 text-sm font-semibold text-ink-muted`}
        {...sortableHandleProps}
      >
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-xs font-normal tabular-nums">({count})</span>
      </div>
    </div>
  );
}
