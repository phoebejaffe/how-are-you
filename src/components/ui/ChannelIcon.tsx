import { CHANNEL_ICONS } from "../../lib/channels";
import type { Channel } from "../../types";

const CHANNEL_ICON_CLASS: Record<Channel, string> = {
  call: "contrast-[0.7]",
  text: "invert brightness-[0.85]",
  in_person: "brightness-[0.5]",
};

export function ChannelIcon({ channel, className = "" }: { channel: Channel; className?: string }) {
  const channelClass = CHANNEL_ICON_CLASS[channel];
  return (
    <span className={[channelClass, className].filter(Boolean).join(" ")}>
      {CHANNEL_ICONS[channel]}
    </span>
  );
}
