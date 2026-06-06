import type { Channel } from "../types";

export const CHANNEL_LABELS: Record<Channel, string> = {
  call: "Call",
  text: "Text",
  in_person: "In person",
};

export const CHANNEL_ICONS: Record<Channel, string> = {
  call: "📱",
  text: "💬",
  in_person: "👤",
};

export const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "text", label: "Text" },
  { value: "in_person", label: "In person" },
];
