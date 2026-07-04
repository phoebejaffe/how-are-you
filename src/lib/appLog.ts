import { createId } from "./ids";

export type AppLogLevel = "log" | "warn" | "error" | "throw";

export interface AppLogEntry {
  id: string;
  level: AppLogLevel;
  message: string;
  detail?: string;
  atIso: string;
}

const MAX_ENTRIES = 200;
const entries: AppLogEntry[] = [];
let snapshot: readonly AppLogEntry[] = [];
const listeners = new Set<() => void>();

let installed = false;

function refreshSnapshot(): void {
  snapshot = entries.slice();
}

function notify(): void {
  refreshSnapshot();
  for (const listener of listeners) listener();
}

function formatArg(arg: unknown): string {
  if (arg instanceof Error) {
    return arg.stack ?? `${arg.name}: ${arg.message}`;
  }
  if (typeof arg === "string") return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function formatArgs(args: unknown[]): string {
  return args.map(formatArg).join(" ");
}

function push(level: AppLogLevel, message: string, detail?: string): void {
  entries.push({
    id: createId(),
    level,
    message,
    detail,
    atIso: new Date().toISOString(),
  });
  if (entries.length > MAX_ENTRIES) entries.shift();
  notify();
}

export function getAppLogs(): readonly AppLogEntry[] {
  return snapshot;
}

export function subscribeAppLogs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearAppLogs(): void {
  entries.length = 0;
  notify();
}

export function formatAppLogsForCopy(logs: readonly AppLogEntry[]): string {
  return logs
    .map((entry) => {
      const time = new Date(entry.atIso).toISOString();
      const detail = entry.detail ? `\n${entry.detail}` : "";
      return `[${time}] ${entry.level.toUpperCase()} ${entry.message}${detail}`;
    })
    .join("\n\n");
}

export function installAppLogCapture(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const original = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  console.log = (...args: unknown[]) => {
    push("log", formatArgs(args));
    original.log(...args);
  };

  console.warn = (...args: unknown[]) => {
    push("warn", formatArgs(args));
    original.warn(...args);
  };

  console.error = (...args: unknown[]) => {
    push("error", formatArgs(args));
    original.error(...args);
  };

  window.addEventListener("error", (event) => {
    push(
      "error",
      event.message || "Uncaught error",
      event.error instanceof Error ? event.error.stack : `${event.filename}:${event.lineno}:${event.colno}`,
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (reason instanceof Error) {
      push("throw", reason.message, reason.stack);
      return;
    }
    push("throw", formatArgs([reason]));
  });

  push("log", "Log capture started");
}
