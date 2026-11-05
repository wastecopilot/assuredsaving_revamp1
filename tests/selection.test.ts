/**
 * Service selection rules, recorded from https://www.assuredsaving.com/ on 2026-11-05
 * by clicking the service buttons in order (I = Internet, T = TV, L = Landline,
 * M = Mobile, S = Home Security). Landline is the "phone" service id here.
 */
import { describe, expect, it } from "vitest";
import { VALID_SELECTIONS, applyClicks, businessAllows, isValidSelection, toggleService } from "@/lib/selection";
import type { ServiceId } from "@/data/catalog";

const ID: Record<string, ServiceId> = { I: "internet", T: "tv", L: "phone", M: "mobile", S: "security" };
const run = (seq: string) => applyClicks(seq.split(" ").map((c) => ID[c]));
const ids = (s: string) => (s ? s.split(" ").map((c) => ID[c]) : []);
const same = (a: ServiceId[], b: ServiceId[]) => expect([...a].sort()).toEqual([...b].sort());

describe("official selection rules", () => {
  // [click sequence, selection afterwards] exactly as observed on the live site
  const observed: [string, string][] = [
    ["I", "I"], ["T", "T"], ["L", "L"], ["M", "M"], ["S", "S"],
    ["I T", "I T"], ["T I", "I T"],
    ["I L", "L"], ["I M", "M"], ["T M", "M"], ["T L", "L"],
    ["I T L", "I T L"], ["I T M", "I T M"], ["I L M", "M"], ["I T L M", "I T L M"],
    ["I S", "S"], ["S I", "I"], ["S T", "T"], ["I T S", "S"],
    ["I I", "I"], ["I T T", "I"], ["I T I", "T"],
    ["I T L T", "I"], ["I T L I", "T"], ["I T L L", "I T"],
    ["I T L M L", "I T M"], ["I T L M T", "I"],
    ["S S", "S"], ["T T", "T"], ["L I", "I"], ["M I", "I"], ["M T", "T"], ["L T", "T"],
  ];
  it.each(observed)("clicking %s leaves %s selected", (seq, expected) => same(run(seq), ids(expected)));

  it("allows only the combinations the official site allows", () => {
    expect(VALID_SELECTIONS.map((v) => [...v].sort().join("+")).sort()).toEqual(
      ["I", "T", "L", "M", "S", "I T", "I T L", "I T M", "I T L M"].map((s) => ids(s).sort().join("+")).sort(),
    );
  });

  it("never lets the selection become empty once something is chosen", () => {
    for (const x of Object.values(ID)) expect(toggleService([x], x)).toEqual([x]);
  });

  it("keeps every reachable selection valid (exhaustive over 5 clicks)", () => {
    const all = Object.values(ID);
    const walk = (sel: ServiceId[], depth: number) => {
      if (depth === 0) return;
      for (const x of all) {
        const next = toggleService(sel, x);
        expect(isValidSelection(next)).toBe(true);
        walk(next, depth - 1);
      }
    };
    walk([], 5);
  });

  it("Home Security is always alone", () => {
    expect(isValidSelection(ids("S I"))).toBe(false);
    expect(isValidSelection(ids("S"))).toBe(true);
  });
});

describe("business address rule", () => {
  // Official text: "Only Internet and Internet + TV Bundle are available for business addresses."
  it("allows Internet and Internet + TV only", () => {
    expect(businessAllows(ids("I"))).toBe(true);
    expect(businessAllows(ids("I T"))).toBe(true);
    for (const s of ["T", "L", "M", "S", "I T L", "I T M", "I T L M"]) expect(businessAllows(ids(s))).toBe(false);
  });
});
