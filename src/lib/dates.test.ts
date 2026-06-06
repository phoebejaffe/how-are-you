import { describe, expect, it, vi, afterEach } from "vitest";
import { formatExactTime, formatRelativeTime } from "./dates";

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns now for timestamps within the last hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T12:00:00"));
    expect(formatRelativeTime("2026-06-05T11:30:00")).toBe("now");
    expect(formatRelativeTime("2026-06-05T11:01:00")).toBe("now");
  });

  it("returns today for earlier today but more than an hour ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T18:00:00"));
    expect(formatRelativeTime("2026-06-05T08:00:00")).toBe("today");
    expect(formatRelativeTime("2026-06-05T16:30:00")).toBe("today");
  });

  it("returns yesterday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T12:00:00"));
    expect(formatRelativeTime("2026-06-04T12:00:00")).toBe("yesterday");
  });

  it("returns weekday for dates within the past week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T12:00:00"));
    expect(formatRelativeTime("2026-06-02T12:00:00")).toBe("Tues");
  });

  it("returns m/d/yy for older dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T12:00:00"));
    expect(formatRelativeTime("2026-05-20T12:00:00")).toBe("5/20/26");
    expect(formatRelativeTime("2025-02-20T12:00:00")).toBe("2/20/25");
  });
});

describe("formatExactTime", () => {
  it("includes date and time", () => {
    const formatted = formatExactTime("2026-06-05T14:30:00");
    expect(formatted).toMatch(/Jun/);
    expect(formatted).toMatch(/5/);
    expect(formatted).toMatch(/2026/);
  });
});
