import { useSyncExternalStore, useState } from "react";
import {
  clearAppLogs,
  formatAppLogsForCopy,
  getAppLogs,
  subscribeAppLogs,
  type AppLogEntry,
  type AppLogLevel,
} from "../../lib/appLog";
import { copyTextToClipboard } from "../../lib/clipboard";
import { formatExactTime } from "../../lib/dates";
import { useToastStore } from "../../store/toastStore";

const LEVEL_CLASS: Record<AppLogLevel, string> = {
  log: "text-ink",
  warn: "text-amber-700",
  error: "text-terracotta-dark",
  throw: "text-terracotta-dark",
};

function LogLine({ entry }: { entry: AppLogEntry }) {
  return (
    <div className="border-b border-stone-200/60 px-3 py-2 last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[10px] uppercase tracking-wide text-ink-muted">{entry.level}</span>
        <span className="text-[10px] text-ink-muted">{formatExactTime(entry.atIso)}</span>
      </div>
      <pre className={`mt-1 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed ${LEVEL_CLASS[entry.level]}`}>
        {entry.message}
      </pre>
      {entry.detail && (
        <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-ink-muted">
          {entry.detail}
        </pre>
      )}
    </div>
  );
}

export function AppLogPanel() {
  const logs = useSyncExternalStore(subscribeAppLogs, getAppLogs, getAppLogs);
  const addToast = useToastStore((s) => s.add);
  const [copying, setCopying] = useState(false);

  async function handleCopy() {
    setCopying(true);
    const ok = await copyTextToClipboard(formatAppLogsForCopy(logs));
    addToast(ok ? "Copied logs to clipboard" : "Could not copy logs", ok ? "success" : "error");
    setCopying(false);
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg bg-white/50 ring-1 ring-stone-200/60">
      <div className="flex items-center justify-between gap-2 border-b border-stone-200/60 px-3 py-2">
        <span className="text-xs text-ink-muted">{logs.length} entr{logs.length === 1 ? "y" : "ies"}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => clearAppLogs()}
            className="text-xs text-ink-muted transition-colors hover:text-ink"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={copying || logs.length === 0}
            onClick={() => void handleCopy()}
            className="text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
          >
            Copy
          </button>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-ink-muted">No logs yet.</p>
        ) : (
          logs.map((entry) => <LogLine key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
