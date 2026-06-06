import type { Channel } from "../../types";
import { ChannelIndicator } from "./ChannelIndicator";
import { RelativeTime } from "./RelativeTime";
import { RowMenu, type RowMenuItem } from "./RowMenu";

export function EntryRow({
  text,
  timestampIso,
  channel,
  pinned = false,
  menuItems,
  archived = false,
}: {
  text: string;
  timestampIso: string;
  channel?: Channel;
  pinned?: boolean;
  menuItems: RowMenuItem[];
  archived?: boolean;
}) {
  return (
    <div
      className={`flex min-h-10 items-start gap-2 rounded py-2 pl-2 text-sm ${
        archived ? "bg-stone-100/60 text-stone-500" : "hover:bg-white/70"
      }`}
    >
      <div className="min-w-0 flex-1 break-words text-left">
        {pinned && (
          <span className="mr-1 text-amber-500" aria-label="Pinned">
            📌
          </span>
        )}
        {text}
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <RelativeTime iso={timestampIso} />
        {channel && <ChannelIndicator channel={channel} />}
        <RowMenu items={menuItems} />
      </div>
    </div>
  );
}
