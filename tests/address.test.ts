import { describe, expect, it } from "vitest";
import { formatAddress, getAddressSuggestions, hasBusinessHint } from "@/lib/address";

describe("address suggestions (mocked engine)", () => {
  it("returns nothing for an empty query", () => {
    expect(getAddressSuggestions("   ")).toEqual([]);
  });

  it("returns nothing without a street number (official: include a street number)", () => {
    expect(getAddressSuggestions("zzzz")).toEqual([]);
    expect(getAddressSuggestions("main street")).toEqual([]);
  });

  it("still finds the fixed sample addresses by name", () => {
    expect(getAddressSuggestions("Crescent").map(formatAddress)).toContain("6585 Crescent Drive, Norcross, GA 30071");
  });

  it("completes a house number with sample streets, at most five", () => {
    const r = getAddressSuggestions("658");
    expect(r.length).toBeLessThanOrEqual(5);
    expect(r[0].line1).toBe("658 FL-60");
    expect(r[0].type).toBe("business");
  });

  it("treats suite and office as business, apartments as home", () => {
    expect(hasBusinessHint("12 Main Street Suite 400")).toBe(true);
    expect(hasBusinessHint("12 Main Street Apt 4")).toBe(false);
    expect(getAddressSuggestions("12 Main Street Suite 400").every((a) => a.type === "business")).toBe(true);
  });

  it("never returns duplicates", () => {
    for (const q of ["6", "65", "658", "6585", "1", "12 Oak"]) {
      const ids = getAddressSuggestions(q).map(formatAddress);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("handles hostile input without throwing", () => {
    for (const q of ["<script>alert(1)</script>", "1 ".repeat(5000), "\u0000‮1", "1'; DROP TABLE x;--", "(((("]) {
      expect(() => getAddressSuggestions(q)).not.toThrow();
    }
  });
});
