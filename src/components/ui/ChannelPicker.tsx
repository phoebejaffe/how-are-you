import { CHANNEL_ICONS, CHANNEL_OPTIONS } from "../../lib/channels";
import type { Channel } from "../../types";

export function ChannelPicker({
  value,
  onChange,
}: {
  value: Channel;
  onChange: (channel: Channel) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Channel)}
      className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700"
      aria-label="Channel"
    >
      {CHANNEL_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {CHANNEL_ICONS[opt.value]} {opt.label}
        </option>
      ))}
    </select>
  );
}
