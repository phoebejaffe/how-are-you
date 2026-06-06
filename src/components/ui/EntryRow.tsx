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
  disclosureCount,
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
  disclosureCount?: number;
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
      className={`flex items-start gap-2 rounded text-sm leading-snug transition-colors ${
        compact ? "py-0.5" : topic ? "py-1" : "py-1"
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
        {disclosureCollapsed && disclosureCount != null && (
          <span className="ml-1.5 whitespace-nowrap text-xs tabular-nums text-stone-500">
            ({disclosureCount})
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-1 self-start pt-px">
        {onClusterSelect ? (
          <button
            type="button"
            data-time-cluster-trigger
            className="inline-flex cursor-pointer items-center gap-1.5 rounded border-0 bg-transparent p-0 text-xs leading-none text-stone-400 active:bg-white/50"
            title={formatExactTime(timestampIso)}
            onClick={(e) => {
              e.stopPropagation();
              onClusterSelect(timestampIso);
            }}
          >
            {meta}
          </button>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 text-xs leading-none text-stone-400"
            title={formatExactTime(timestampIso)}
          >
            {meta}
          </span>
        )}
        <div
          className="-mr-1 -mt-0.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <RowMenu items={menuItems} compact />
        </div>
      </div>
    </div>
  );
}
