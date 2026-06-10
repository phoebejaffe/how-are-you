import { describe, expect, it } from "vitest";
import { formatImportantDate, sanitizeImportantDates } from "./personImportantDates";

describe("sanitizeImportantDates", () => {
  it("keeps valid dates and drops empty labels", () => {
    const result = sanitizeImportantDates([
      { id: "1", label: "Birthday", month: 3, day: 15, year: 1990 },
      { id: "2", label: "  ", month: 1, day: 1 },
      { id: "3", label: "Anniversary", month: 13, day: 1 },
    ]);
    expect(result).toEqual([{ id: "1", label: "Birthday", month: 3, day: 15, year: 1990 }]);
  });
});

describe("formatImportantDate", () => {
  it("formats with year when present", () => {
    expect(formatImportantDate({ id: "1", label: "Birthday", month: 3, day: 15, year: 1990 })).toBe(
      "Mar 15, 1990",
    );
  });

  it("formats without year", () => {
    expect(formatImportantDate({ id: "1", label: "Birthday", month: 3, day: 15 })).toBe("Mar 15");
  });
});
