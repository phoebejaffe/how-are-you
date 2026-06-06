import { CHANNEL_LABELS, CHANNEL_OPTIONS } from "../../lib/channels";
import type { Channel } from "../../types";
import { ChannelIcon } from "./ChannelIcon";

export function ChannelPicker({
  value,
  onChange,
}: {
  value: Channel;
  onChange: (channel: Channel) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1" role="group" aria-label="Channel">
      {CHANNEL_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={CHANNEL_LABELS[opt.value]}
          aria-label={CHANNEL_LABELS[opt.value]}
          aria-pressed={value === opt.value}
          className={`rounded-lg px-2.5 py-2 text-sm transition-all ${
            value === opt.value
              ? "bg-sage-light ring-1 ring-sage/30"
              : "opacity-45 grayscale hover:bg-white/60 hover:opacity-70"
          }`}
        >
          <ChannelIcon channel={opt.value} />
        </button>
      ))}
    </div>
  );
}
