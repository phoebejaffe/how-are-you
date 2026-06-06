import { CHANNEL_ICONS, CHANNEL_LABELS } from "../../lib/channels";
import type { Channel } from "../../types";

export function ChannelBadge({ channel }: { channel: Channel }) {
  return (
    <span className="shrink-0 text-[11px] grayscale opacity-50" title={CHANNEL_LABELS[channel]}>
      <span aria-hidden="true">{CHANNEL_ICONS[channel]}</span>
      <span className="sr-only">{CHANNEL_LABELS[channel]}</span>
    </span>
  );
}
