import type { ReactNode } from "react";
import { formatExactTime } from "../../lib/dates";
import type { Channel } from "../../types";
import { ChannelIndicator } from "./ChannelIndicator";
import { RelativeTime } from "./RelativeTime";
import { RowMenu, type RowMenuItem } from "./RowMenu";

export function EntryRow({
  leading,
  text,
  timestampIso,
  channel,
  pinned = false,
  menuItems,
  archived = false,
  highlighted = false,
  compact = false,
  topic = false,
  disclosureCollapsed = false,
  onRowClick,
  onClusterSelect,
}: {
  leading?: ReactNode;
  text: string;
  timestampIso: string;
  channel?: Channel;
  pinned?: boolean;
  menuItems: RowMenuItem[];
  archived?: boolean;
  highlighted?: boolean;
  compact?: boolean;
  topic?: boolean;
  disclosureCollapsed?: boolean;
  onRowClick?: () => void;
  onClusterSelect?: (timestampIso: string) => void;
}) {
  const meta = (
    <>
      <RelativeTime iso={timestampIso} />
      {channel && <ChannelIndicator channel={channel} />}
    </>
  );

  return (
    <div
      role={onRowClick ? "button" : undefined}
      tabIndex={onRowClick ? 0 : undefined}
      onClick={onRowClick}
      onKeyDown={
        onRowClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick();
              }
            }
          : undefined
      }
      className={`flex items-start gap-2 rounded pl-2 text-sm transition-colors ${
        compact ? "py-0.5" : topic ? "my-1 py-1" : "min-h-10 py-2"
      } ${
        highlighted
          ? "bg-amber-100/90 ring-1 ring-amber-300/80"
          : archived
            ? "bg-stone-100/60 text-stone-500"
            : "active:bg-white/70"
      } ${onRowClick ? "cursor-pointer" : ""}`}
    >
      {leading}
      <div className="min-w-0 flex-1 break-words text-left">
        {pinned && (
          <span className="mr-1 text-amber-500" aria-label="Pinned">
            📌
          </span>
        )}
        {text}
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        {disclosureCollapsed && (
          <span
            className="relative inline-flex shrink-0 -top-0.5 items-center justify-center text-[16px] leading-none text-stone-500"
            aria-hidden="true"
          >
            <span className="inline-block rotate-180">^</span>
          </span>
        )}
        {onClusterSelect ? (
          <button
            type="button"
            data-time-cluster-trigger
            className="flex min-h-10 cursor-pointer items-center gap-2 rounded border-0 bg-transparent px-1 active:bg-white/50"
            title={formatExactTime(timestampIso)}
            onClick={(e) => {
              e.stopPropagation();
              onClusterSelect(timestampIso);
            }}
          >
            {meta}
          </button>
        ) : (
          <span className="flex items-center gap-2" title={formatExactTime(timestampIso)}>
            {meta}
          </span>
        )}
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <RowMenu items={menuItems} />
        </div>
      </div>
    </div>
  );
}
