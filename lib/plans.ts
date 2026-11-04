/**
 * Plan logic. Every number, label and sentence on a plan card is derived here
 * from the plan's own data, so they can never contradict each other.
 * Verified by scripts/verify-data.ts.
 */
import { BUNDLE_PRESETS, PLANS, SERVICE_ORDER, type AddressType, type Plan, type ServiceId, type Tech, type Text } from "@/data/sample";
import type { Lang } from "./i18n";

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
/** Lower-cases only the first letter, so acronyms like "IP" stay intact. */
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(cents / 100);
const n = (v: number, lang: Lang) => new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US").format(v);

export function speedText(p: Plan, lang: Lang): string | null {
  if (!p.downloadMbps) return null;
  if (p.downloadMinMbps) return `${n(p.downloadMinMbps, lang)}–${n(p.downloadMbps, lang)} Mbps`;
  return p.downloadMbps >= 1000 ? `${n(p.downloadMbps / 1000, lang)} Gbps` : `${n(p.downloadMbps, lang)} Mbps`;
}

/** Technology name, worded for the address type (5G is not "home" for a business). */
export const techLabel = (p: Plan, lang: Lang, type: AddressType = "residential") =>
  p.tech === "fiveG" && type === "business" ? (lang === "es" ? "5G fijo" : "5G fixed wireless") : TECH[p.tech].label[lang];

export const TECH: Record<Tech, { label: Text; note: Text }> = {
  fiber: {
    label: { en: "Fiber", es: "Fibra" },
    note: { en: "Light over glass to your door. Uploads close to download speed, low lag and steady at busy times.", es: "Luz por fibra hasta tu puerta. Subida cercana a la bajada, poca latencia y estable en horas pico." },
  },
  cable: {
    label: { en: "Cable", es: "Cable" },
    note: { en: "Uses the coax lines from cable TV. Fast downloads, much slower uploads, and speeds can dip when neighbors are busy online.", es: "Usa las líneas coaxiales de la TV por cable. Bajada rápida, subida mucho más lenta y puede bajar cuando los vecinos usan mucho internet." },
  },
  fiveG: {
    label: { en: "5G Home", es: "5G Hogar" },
    note: { en: "Wireless from a nearby cell tower. No install visit, but speed depends on signal at your address and changes during the day.", es: "Inalámbrico desde una antena cercana. Sin visita de instalación, pero la velocidad depende de la señal en tu dirección y cambia durante el día." },
  },
  dsl: {
    label: { en: "DSL", es: "DSL" },
    note: { en: "Runs over phone lines. Widely available, but slower, and speed drops the farther you are from the provider's equipment.", es: "Funciona por líneas telefónicas. Muy disponible, pero más lento, y baja con la distancia al equipo del proveedor." },
  },
  satellite: {
    label: { en: "Satellite", es: "Satélite" },
    note: { en: "Works almost anywhere with a clear view of the sky. Signals travel to space and back, so lag is high (around 600 ms) and heavy rain or snow can interrupt service.", es: "Funciona casi en cualquier lugar con vista despejada del cielo. La señal va al espacio y vuelve, así que la latencia es alta (unos 600 ms) y la lluvia o nieve fuerte puede cortar el servicio." },
  },
  streaming: {
    label: { en: "Streaming TV", es: "TV por streaming" },
    note: { en: "Live TV over your internet. No box or install, and it needs a steady connection.", es: "TV en vivo por tu internet. Sin decodificador ni instalación, y necesita una conexión estable." },
  },
  wireless: {
    label: { en: "5G mobile", es: "Móvil 5G" },
    note: { en: "Phone service on a national 5G network.", es: "Servicio móvil en una red 5G nacional." },
  },
  monitored: {
    label: { en: "Monitored security", es: "Seguridad monitoreada" },
    note: { en: "A monitoring team responds to alarms around the clock.", es: "Un equipo de monitoreo responde a las alarmas a toda hora." },
  },
  voip: {
    label: { en: "Internet phone", es: "Teléfono por internet" },
    note: { en: "Calls run over your internet, so they stop if the internet goes down.", es: "Las llamadas usan tu internet, así que se detienen si se cae el internet." },
  },
  landline: {
    label: { en: "Copper landline", es: "Línea de cobre" },
    note: { en: "A traditional phone line that keeps working in a power outage.", es: "Una línea tradicional que sigue funcionando sin electricidad." },
  },
};

/**
 * One plain sentence from the plan's own fields, worded for home or business.
 * It never mentions a number that isn't on the card.
 */
export function whyThisPlan(p: Plan, lang: Lang, type: AddressType): string {
  const es = lang === "es";
  const biz = type === "business";
  const parts: string[] = [];
  const speed = speedText(p, lang);
  const tech = techLabel(p, lang, type);
  if (speed) {
    const low = p.downloadMinMbps ?? p.downloadMbps ?? 0;
    const fit = biz
      ? low >= 500
        ? es ? "suficiente para un equipo completo con nube y videollamadas" : "enough for a full team on cloud apps and video meetings"
        : low >= 200
          ? es ? "cómodo para una oficina con videollamadas" : "comfortable for an office running video meetings"
          : es ? "suficiente para correo, pagos con tarjeta y navegación" : "enough for email, card payments and browsing"
      : low >= 500
        ? es ? "suficiente para muchos dispositivos y streaming 4K a la vez" : "enough for many devices and 4K streaming at once"
        : low >= 200
          ? es ? "cómodo para varias personas con video y videollamadas" : "comfortable for several people streaming and on video calls"
          : es ? "bien para navegar, correo y streaming HD" : "fine for browsing, email and HD streaming";
    parts.push(es ? `${tech} de ${speed}, ${fit}` : `${speed} ${tech.toLowerCase().replace("5g", "5G")}, ${fit}`);
    if (p.uploadMbps && p.downloadMbps && p.uploadMbps >= p.downloadMbps * 0.8) parts.push(es ? "con subida igual de rápida" : "with uploads just as fast");
  } else {
    parts.push(tech);
  }
  if (p.channels) parts.push(es ? `${p.channels}+ canales` : `${p.channels}+ channels`);
  if (p.lines) parts.push(es ? `${p.lines} línea móvil` : `${p.lines} mobile line`);
  if (p.services.includes("phone")) parts.push(es ? (biz ? "una línea de negocio" : "un teléfono fijo") : biz ? "a business phone line" : "a home phone line");
  if (biz && p.business) parts.push(lowerFirst(p.business.staticIp[lang]));
  let s = parts.join(", ");
  s = `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;

  if (isPriced(p)) {
    const now = money(allInNow(p));
    const promo = p.pricing.promo;
    s += promo
      ? es
        ? ` ${now}/mes con todo incluido por ${promo.months} ${promo.months === 1 ? "mes" : "meses"}, luego ${money(allInAfter(p))}.`
        : ` ${now}/mo all-in for ${promo.months} ${promo.months === 1 ? "month" : "months"}, then ${money(allInAfter(p))}.`
      : es
        ? ` ${now}/mes con todo incluido, sin promoción que venza.`
        : ` ${now}/mo all-in with no promo to expire.`;
  } else {
    s += es ? " El precio se confirma por teléfono." : " Price is confirmed by phone.";
  }
  if (p.dataCapGB) s += es ? ` Incluye ${n(p.dataCapGB, lang)} GB de datos al mes.` : ` Includes ${n(p.dataCapGB, lang)} GB of data a month.`;
  s += p.contractMonths ? (es ? ` Contrato de ${p.contractMonths} meses.` : ` ${p.contractMonths}-month contract.`) : es ? " Sin contrato anual." : " No annual contract.";
  return s;
}

/** Savings appear only when the visitor has entered their current bill. */
export function savings(p: Plan, billCents: number | null): number | null {
  if (!billCents || !isPriced(p)) return null;
  const d = billCents - allInNow(p);
  return d > 0 ? d : null;
}
