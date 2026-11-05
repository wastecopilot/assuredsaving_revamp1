/** Unit tests for the price maths, ranking, earned labels and "Why This Plan" reasons. */
import { describe, expect, it } from "vitest";
import { PLANS } from "@/data/sample";
import { VALID_SELECTIONS } from "@/lib/selection";
import { allInAfter, allInNow, isPriced, labelsFor, money, planReasons, resultsFor, speedText, techLabel } from "@/lib/plans";

describe("sample data", () => {
  it("has unique plan ids", () => {
    expect(new Set(PLANS.map((p) => p.id)).size).toBe(PLANS.length);
  });

  it("computes all-in prices from plan + fees - promo", () => {
    for (const p of PLANS.filter(isPriced)) {
      const fees = p.pricing.fees.reduce((a, f) => a + f.cents, 0);
      expect(allInNow(p)).toBe(p.pricing.planCents + fees - (p.pricing.promo?.creditCents ?? 0));
      expect(allInAfter(p)).toBe(p.pricing.planCents + fees);
      expect(allInNow(p)).toBeGreaterThan(0);
    }
  });

  it("has an official technology word for every plan", () => {
    for (const p of PLANS) for (const lang of ["en", "es"] as const) expect(techLabel(p, lang)).toBeTruthy();
  });
});

describe("results for every selection the official site allows", () => {
  it.each(VALID_SELECTIONS.map((v) => [v.join(" + "), v] as const))("%s has its own plans, sorted, no duplicates", (_, sel) => {
    const { plans, missing } = resultsFor([...sel]);
    expect(missing).toEqual([]);
    expect(plans.length).toBeGreaterThan(0);
    expect(new Set(plans.map((p) => p.id)).size).toBe(plans.length);
    const priced = plans.filter(isPriced);
    priced.forEach((p, i) => i && expect(allInNow(priced[i - 1])).toBeLessThanOrEqual(allInNow(p)));
    const firstQuote = plans.findIndex((p) => !isPriced(p));
    if (firstQuote >= 0) expect(plans.slice(firstQuote).every((p) => !isPriced(p))).toBe(true);
  });

  it.each(VALID_SELECTIONS.map((v) => [v.join(" + "), v] as const))("%s gives each label to at most one priced plan", (_, sel) => {
    const { plans } = resultsFor([...sel]);
    const labels = labelsFor(plans);
    const counts: Record<string, number> = {};
    for (const [id, ls] of labels) {
      expect(isPriced(plans.find((p) => p.id === id)!)).toBe(true);
      for (const l of ls) counts[l] = (counts[l] ?? 0) + 1;
    }
    for (const c of Object.values(counts)) expect(c).toBe(1);
  });
});

describe("Why This Plan", () => {
  it("only states numbers that are on the plan", () => {
    for (const sel of VALID_SELECTIONS) {
      const { plans } = resultsFor([...sel]);
      const top = plans[0];
      for (const p of plans)
        for (const lang of ["en", "es"] as const) {
          const text = planReasons(p, top, lang).join(" ");
          const sp = speedText(p, lang);
          if (p.id === top.id && sp) expect(text).toContain(sp);
          for (const amt of text.match(/\$[\d,]+\.\d{2}/g) ?? []) expect([money(allInNow(p)), money(allInAfter(p))]).toContain(amt);
        }
    }
  });

  it("says the cheaper plan is cheaper, by the right amount", () => {
    const { plans } = resultsFor(["internet"]);
    const top = plans[0];
    const pricier = plans.find((p) => isPriced(p) && allInNow(p) > allInNow(top))!;
    expect(planReasons(pricier, top, "en").join(" ")).toContain(money(allInNow(pricier)));
    const fake = { ...top, id: "x", provider: "Test", pricing: { ...top.pricing, planCents: (top.pricing.kind === "priced" ? top.pricing.planCents : 0) - 500 } } as typeof top;
    expect(planReasons(fake, top, "en").join(" ")).toContain("$5.00/mo less than");
  });
});
