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
  menuItems,
  archived = false,
  highlighted = false,
  compact = false,
  disclosureCollapsed = false,
  disclosureCount,
  onRowClick,
  onClusterSelect,
}: {
  leading?: ReactNode;
  text: string;
  timestampIso: string;
  channel?: Channel;
  menuItems: RowMenuItem[];
  archived?: boolean;
  highlighted?: boolean;
  compact?: boolean;
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
      className={`flex items-start gap-2.5 rounded-xl leading-snug transition-colors ${
        compact ? "px-2 py-1.5 text-xs" : "px-2.5 py-2.5 text-[0.9375rem]"
      } ${
        highlighted
          ? "bg-amber-100/80 ring-1 ring-amber-300/60"
          : archived
            ? "bg-stone-100/50 text-ink-muted"
            : "active:bg-white/60"
      } ${onRowClick ? "cursor-pointer" : ""}`}
    >
      {leading}
      <div className="min-w-0 flex-1 break-words text-left font-reading leading-relaxed">
        {text}
        {disclosureCollapsed && disclosureCount != null && (
          <span className="ml-1.5 whitespace-nowrap text-xs tabular-nums text-ink-muted">
            ({disclosureCount})
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-1 self-start pt-0.5">
        {onClusterSelect ? (
          <button
            type="button"
            data-time-cluster-trigger
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent p-1 text-xs leading-none text-ink-muted transition-colors active:bg-white/50"
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
            className="inline-flex items-center gap-1.5 p-1 text-xs leading-none text-ink-muted"
            title={formatExactTime(timestampIso)}
          >
            {meta}
          </span>
        )}
        <div
          className="-mr-1"
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
