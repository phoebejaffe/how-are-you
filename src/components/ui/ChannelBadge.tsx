import type { Channel } from "../../types";
import { ChannelIndicator } from "./ChannelIndicator";

/** @deprecated Use ChannelIndicator — kept as alias for any external imports. */
export function ChannelBadge({ channel }: { channel: Channel }) {
  return <ChannelIndicator channel={channel} />;
}
