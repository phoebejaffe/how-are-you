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
}: {
  name: string;
  count: number;
  collapsed: boolean;
  isFolderReorderTarget: boolean;
  onToggleCollapsed: () => void;
  onRename: (name: string) => void;
  onDeleteRequest: () => void;
  sortableHandleProps?: HandleProps;
}) {
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
      className={`flex items-center gap-1 px-1 ${isFolderReorderTarget ? "rounded ring-2 ring-amber-400/80" : ""}`}
    >
      {editingName ? (
        <form
          className="flex min-w-0 flex-1 items-center gap-1"
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
            className="min-w-0 flex-1 rounded border border-stone-300 bg-white/80 px-2 py-0.5 text-xs"
            autoFocus
          />
          <button type="submit" className="rounded bg-sage px-2 py-0.5 text-xs text-white">
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingName(false);
              setNameInput(name);
            }}
            aria-label="Cancel"
            className="rounded px-2 py-0.5 text-xs text-stone-500"
          >
            X
          </button>
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex min-w-0 flex-1 cursor-pointer touch-none select-none items-center justify-between rounded px-1 py-0.5 text-left text-xs font-semibold text-stone-600 hover:text-stone-800"
            {...sortableHandleProps}
          >
            <span className="truncate">
              {name} ({count})
            </span>
            {collapsed && (
              <span
                className="relative inline-flex shrink-0 -top-0.5 items-center justify-center pl-2 text-[16px] leading-none text-stone-500"
                aria-hidden="true"
              >
                <span className="inline-block rotate-180">^</span>
              </span>
            )}
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
}: {
  label: string;
  count: number;
  isFolderReorderTarget: boolean;
  sortableHandleProps?: HandleProps;
}) {
  return (
    <div
      className={`flex items-center gap-1 px-1 ${isFolderReorderTarget ? "rounded ring-2 ring-amber-400/80" : ""}`}
    >
      <div
        className="min-w-0 flex-1 touch-none select-none truncate px-1 py-0.5 text-xs font-semibold text-stone-500"
        {...sortableHandleProps}
      >
        {label} ({count})
      </div>
    </div>
  );
}
