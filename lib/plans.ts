/**
 * Plan logic. Every number, label and sentence on a plan card is derived here
 * from the plan's own data, so they can never contradict each other.
 * Verified by scripts/verify-data.ts.
 */
import { BUNDLE_PRESETS, PLANS, SERVICE_ORDER, type Plan, type ServiceId, type Tech } from "@/data/sample";
import { translate, type Key, type Lang } from "./i18n";

type Priced = Plan & { pricing: Extract<Plan["pricing"], { kind: "priced" }> };
export const isPriced = (p: Plan): p is Priced => p.pricing.kind === "priced";

/* ------------------------------ Price maths ------------------------------ */
const sum = (xs: { cents: number }[]) => xs.reduce((a, b) => a + b.cents, 0);
/** All-in monthly today = plan + required fees - promo credit. */
export const allInNow = (p: Plan) => (isPriced(p) ? p.pricing.planCents + sum(p.pricing.fees) - (p.pricing.promo?.creditCents ?? 0) : Infinity);
/** All-in monthly after the promo ends. */
export const allInAfter = (p: Plan) => (isPriced(p) ? p.pricing.planCents + sum(p.pricing.fees) : Infinity);
export const cost24 = (p: Plan) => {
  if (!isPriced(p)) return Infinity;
  const m = Math.min(p.pricing.promo?.months ?? 0, 24);
  return allInNow(p) * m + allInAfter(p) * (24 - m);
};

/* ------------------------------ Matching ------------------------------ */
const key = (s: ServiceId[]) => [...s].sort().join("+");
export const ordered = (s: ServiceId[]) => SERVICE_ORDER.filter((x) => s.includes(x));

export interface Results {
  plans: Plan[];
  covered: ServiceId[];
  missing: ServiceId[];
}

/**
 * Exact matches first. If the combination isn't offered, fall back to the
 * largest combination that is, and report what's missing (never silently).
 */
export function resultsFor(selected: ServiceId[]): Results {
  const exact = PLANS.filter((p) => key(p.services) === key(selected));
  if (exact.length) return { plans: sortPlans(exact), covered: ordered(selected), missing: [] };
  const groups = new Map<string, Plan[]>();
  for (const p of PLANS) {
    if (!p.services.every((s) => selected.includes(s))) continue;
    groups.set(key(p.services), [...(groups.get(key(p.services)) ?? []), p]);
  }
  const best = [...groups.values()].sort((a, b) => b[0].services.length - a[0].services.length || b.length - a.length)[0] ?? [];
  const covered = best.length ? ordered(best[0].services) : [];
  return { plans: sortPlans(best), covered, missing: ordered(selected.filter((s) => !covered.includes(s))) };
}

/** Sort by all-in monthly price. Quote-only plans go last. Rank = position. */
export const sortPlans = (plans: Plan[]) =>
  [...plans].sort((a, b) => Number(!isPriced(a)) - Number(!isPriced(b)) || allInNow(a) - allInNow(b) || allInAfter(a) - allInAfter(b) || a.id.localeCompare(b.id));

export const presetFor = (services: ServiceId[]) => BUNDLE_PRESETS.find((b) => key(b.services) === key(services)) ?? null;

/* ------------------------------ Labels ------------------------------ */
export type Label = "mostAffordable" | "bestValue" | "fastest";

/**
 * Labels are earned by rules, computed across every priced plan shown.
 * Each label goes to exactly one plan (ties broken by lower price, then id),
 * and only when there are at least 2 priced plans to compare.
 * A plan may earn more than one label if it truly wins more than one rule.
 *
 * - Most Affordable: lowest all-in monthly price today.
 * - Best Value: lowest all-in price per Mbps of download (low end of the typical
 *   range for 5G and satellite); per channel for TV without internet;
 *   lowest 24-month cost for mobile, security and home phone.
 * - Fastest: highest download speed (internet plans only).
 */
export function valueMetric(p: Plan) {
  if (p.services.includes("internet")) return allInNow(p) / (p.downloadMinMbps ?? p.downloadMbps ?? 1);
  if (p.services.includes("tv")) return allInNow(p) / (p.channels ?? 1);
  return cost24(p);
}

const winner = (plans: Plan[], score: (p: Plan) => number) =>
  [...plans].sort((a, b) => score(a) - score(b) || allInNow(a) - allInNow(b) || a.id.localeCompare(b.id))[0];

export function labelsFor(plans: Plan[]): Map<string, Label[]> {
  const out = new Map<string, Label[]>();
  const add = (p: Plan | undefined, l: Label) => p && out.set(p.id, [...(out.get(p.id) ?? []), l]);
  const priced = plans.filter(isPriced);
  if (priced.length < 2) return out;
  add(winner(priced, allInNow), "mostAffordable");
  add(winner(priced, valueMetric), "bestValue");
  if (priced.every((p) => p.services.includes("internet"))) add(winner(priced, (p) => -(p.downloadMbps ?? 0)), "fastest");
  return out;
}

/* ------------------------------ Display ------------------------------ */
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(cents / 100);
const num = (v: number, lang: Lang) => new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US").format(v);

export function speedText(p: Plan, lang: Lang): string | null {
  if (!p.downloadMbps) return null;
  if (p.downloadMinMbps) return `${num(p.downloadMinMbps, lang)}–${num(p.downloadMbps, lang)} Mbps`;
  return p.downloadMbps >= 1000 ? `${num(p.downloadMbps / 1000, lang)} Gbps` : `${num(p.downloadMbps, lang)} Mbps`;
}

/** Official technology words (lib/i18n.ts). */
export const TECH_KEY: Record<Tech, Key> = {
  fiber: "tech_fiber",
  cable: "tech_cable",
  fiveG: "tech_fiveG",
  dsl: "tech_dsl",
  satellite: "tech_satellite",
  streaming: "tech_streaming",
  wireless: "tech_wireless",
  monitored: "tech_monitored",
  voip: "tech_voip",
  landline: "tech_landline",
};
export const techLabel = (p: Plan, lang: Lang) => translate(lang, TECH_KEY[p.tech]);

/** Official "Best For" by technology (internet plans only). */
export function bestFor(p: Plan, lang: Lang): string | null {
  if (!p.services.includes("internet")) return null;
  const k: Key = p.tech === "fiber" ? "bestForFiber" : p.tech === "cable" ? "bestForCable" : p.tech === "fiveG" ? "bestFor5g" : "bestForOther";
  return translate(lang, k);
}

/**
 * "Why This Plan" reasons, built only from the official sentence templates and
 * the plan's own numbers, compared with the top match.
 */
export function planReasons(p: Plan, top: Plan | undefined, lang: Lang): string[] {
  const t = (k: Key, v?: Record<string, string | number>) => translate(lang, k, v);
  const speed = speedText(p, lang);
  const tech = techLabel(p, lang);
  const out: string[] = [];
  if (!top || top.id === p.id) {
    if (speed) out.push(t("reasonSuitsMost", { speed }));
    return out;
  }
  out.push(
    p.tech !== top.tech
      ? t("reasonDifferentTech", { provider: p.provider, tech, topProvider: top.provider, topTech: techLabel(top, lang) })
      : t("reasonAlsoDelivers", { provider: p.provider, tech }),
  );
  if (isPriced(p) && isPriced(top)) {
    const price = `${money(allInNow(p))}${t("perMo")}`;
    const delta = allInNow(top) - allInNow(p);
    if (delta > 0) out.push(t("reasonCheaperThanTop", { price, delta: (delta / 100).toFixed(2), topProvider: top.provider, annual: Math.round((delta * 12) / 100) }));
    else if (delta === 0) out.push(t("reasonMatchesTop", { topProvider: top.provider, price }));
    else if (speed) out.push(t("reasonMoreExpensive", { price, speed }));
  }
  if (speed && (p.downloadMbps ?? 0) > (top.downloadMbps ?? 0)) out.push(t("reasonFasterDownloads", { speed }));
  return out;
}
