import { describe, expect, it } from "vitest";
import { formatAppLogsForCopy, type AppLogEntry } from "./appLog";

describe("formatAppLogsForCopy", () => {
  it("formats log entries for clipboard export", () => {
    const logs: AppLogEntry[] = [
      {
        id: "1",
        level: "error",
        message: "Something failed",
        detail: "at foo.ts:1",
        atIso: "2026-07-04T12:00:00.000Z",
      },
    ];

    expect(formatAppLogsForCopy(logs)).toContain("ERROR Something failed");
    expect(formatAppLogsForCopy(logs)).toContain("at foo.ts:1");
  });
});
