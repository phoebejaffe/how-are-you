import { CHANNEL_LABELS } from "../../lib/channels";
import type { Channel } from "../../types";
import { ChannelIcon } from "./ChannelIcon";

/** Channel emoji for inline row display (badges, metadata). */
export function ChannelIndicator({ channel }: { channel: Channel }) {
  const label = CHANNEL_LABELS[channel];

  return (
    <span className="shrink-0 text-[11px] grayscale opacity-50" title={label}>
      <span aria-hidden="true">
        <ChannelIcon channel={channel} />
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
