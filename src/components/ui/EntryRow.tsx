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
      className={`flex items-start gap-2 rounded pl-2 text-sm transition-colors ${
        compact ? "py-0.5" : "min-h-10 py-2"
      } ${
        highlighted
          ? "bg-amber-100/90 ring-1 ring-amber-300/80"
          : archived
            ? "bg-stone-100/60 text-stone-500"
            : "hover:bg-white/70"
      }`}
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
        {onClusterSelect ? (
          <button
            type="button"
            data-time-cluster-trigger
            className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0"
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
        <RowMenu items={menuItems} />
      </div>
    </div>
  );
}
