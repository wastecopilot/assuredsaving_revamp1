/**
 * Verifies the sample data and every promise the results make:
 * price maths, earned labels, unique plans, fallback notices, sort order and
 * "Why this plan" accuracy (English and Spanish, home and business).
 */
import { ADDRESSES, ADDRESS_TEMPLATES, BUNDLE_PRESETS, PLANS, SERVICE_ORDER, type ServiceId } from "../data/sample";
import { getAddressSuggestions, hasBusinessHint } from "../lib/address";
import { allInAfter, allInNow, isPriced, labelsFor, money, resultsFor, speedText, valueMetric, whyThisPlan } from "../lib/plans";

let fails = 0;
const ok = (c: boolean, m: string) => {
  if (!c) {
    fails++;
    console.error("FAIL", m);
  }
};

// Address autocomplete (same engine as the original one-pager): empty input shows
// nothing, typed input always gets suggestions, and every suggestion carries its type.
ok(getAddressSuggestions("").length === 0, "no suggestions before typing");
ok(getAddressSuggestions("658").every((a) => ADDRESSES.some((s) => s.id === a.id)), '"658" matches the fixed suggestions');
for (const q of ["658", "12 Oak St", "9 Elm Ave Apt 4", "500 Main St Suite 200", "77 Tech Park Dr", "Fannin", "4 Willow Court"]) {
  const list = getAddressSuggestions(q);
  ok(list.length > 0 && list.length <= 5, `address "${q}" has 1 to 5 suggestions`);
  ok(new Set(list.map((a) => a.id)).size === list.length, `address "${q}" suggestions unique`);
  for (const a of list) {
    const fixed = ADDRESSES.find((s) => s.id === a.id);
    const tpl = ADDRESS_TEMPLATES.find((x) => x.city === a.city);
    const want = fixed ? fixed.type : hasBusinessHint(a.line1) ? "business" : tpl?.type;
    ok(a.type === want, `address "${q}" -> ${a.line1}, ${a.city} typed ${a.type}, expected ${want}`);
  }
  if (hasBusinessHint(q)) ok(list.every((a) => a.type === "business"), `address "${q}" with business words is always business`);
  console.log(`address ${q.padEnd(24)} -> ${list.map((a) => `${a.line1}, ${a.city} [${a.type}]`).join(" | ")}`);
}

// Required technology coverage
for (const tech of ["fiber", "cable", "fiveG", "dsl", "satellite"] as const) ok(PLANS.some((p) => p.tech === tech && p.services.includes("internet")), `has a ${tech} internet plan`);
ok(PLANS.some((p) => p.pricing.kind === "quote"), "has a call-for-pricing plan");
ok(PLANS.some((p) => !!p.dataCapGB), "has a data-cap plan");

const ids = new Set<string>();
for (const p of PLANS) {
  ok(!ids.has(p.id), `unique id ${p.id}`);
  ids.add(p.id);
  if (isPriced(p)) {
    const fees = p.pricing.fees.reduce((a, f) => a + f.cents, 0);
    ok(allInNow(p) === p.pricing.planCents + fees - (p.pricing.promo?.creditCents ?? 0), `${p.id} all-in maths`);
    ok(allInAfter(p) === p.pricing.planCents + fees, `${p.id} after-promo maths`);
    ok(allInNow(p) > 0, `${p.id} positive`);
  } else if (p.pricing.kind === "quote") {
    ok(p.pricing.reason.en.length > 40 && p.pricing.reason.es.length > 40, `${p.id} quote has a reason`);
  }
  for (const lang of ["en", "es"] as const)
    for (const type of ["residential", "business"] as const) {
      const why = whyThisPlan(p, lang, type);
      const sp = speedText(p, lang);
      if (sp) ok(why.includes(sp), `${p.id} ${lang} why has speed ${sp}`);
      if (p.channels) ok(why.includes(`${p.channels}+`), `${p.id} ${lang} why has channels`);
      if (isPriced(p)) {
        ok(why.includes(money(allInNow(p))), `${p.id} ${lang} why has all-in price`);
        for (const amt of why.match(/\$[\d,]+\.\d{2}/g) ?? []) ok(amt === money(allInNow(p)) || amt === money(allInAfter(p)), `${p.id} ${lang} unexpected amount ${amt}`);
      } else ok(!/\$/.test(why), `${p.id} ${lang} quote why has no price`);
      if (type === "business") ok(!/household|famil|hogar\b/i.test(why), `${p.id} ${lang} business why not home-worded: ${why}`);
      ok(!why.includes("—"), `${p.id} no em dash`);
    }
}

const combos: ServiceId[][] = [...SERVICE_ORDER.map((s) => [s]), ...BUNDLE_PRESETS.map((b) => b.services), ["internet", "mobile"]];
for (const c of combos) {
  const { plans, missing, covered } = resultsFor(c);
  const tag = c.join("+");
  ok(plans.length > 0, `${tag} has plans`);
  ok(new Set(plans.map((p) => p.id)).size === plans.length, `${tag} no duplicates`);
  if (missing.length) ok(covered.length > 0, `${tag} fallback reports covered services`);
  // Sort: priced ascending, quotes last
  const firstQuote = plans.findIndex((p) => !isPriced(p));
  if (firstQuote >= 0) ok(plans.slice(firstQuote).every((p) => !isPriced(p)), `${tag} quotes last`);
  const priced = plans.filter(isPriced);
  ok(priced.every((p, i) => i === 0 || allInNow(priced[i - 1]) <= allInNow(p)), `${tag} sorted by all-in`);
  // Labels
  const labels = labelsFor(plans);
  const holders = (l: string) => [...labels].filter(([, ls]) => ls.includes(l as never)).map(([id]) => id);
  for (const l of ["mostAffordable", "bestValue", "fastest"]) ok(holders(l).length <= 1, `${tag} ${l} on at most one plan`);
  if (priced.length >= 2) {
    ok(holders("mostAffordable")[0] === priced[0].id, `${tag} Most Affordable is cheapest`);
    const bv = Math.min(...priced.map(valueMetric));
    ok(valueMetric(PLANS.find((p) => p.id === holders("bestValue")[0])!) === bv, `${tag} Best Value follows rule`);
    if (priced.every((p) => p.services.includes("internet"))) {
      const fast = Math.max(...priced.map((p) => p.downloadMbps ?? 0));
      ok(PLANS.find((p) => p.id === holders("fastest")[0])?.downloadMbps === fast, `${tag} Fastest is fastest`);
    } else ok(holders("fastest").length === 0, `${tag} no Fastest without internet`);
  }
  ok(!labels.has(plans.find((p) => !isPriced(p))?.id ?? "-"), `${tag} quote plans earn no labels`);
  console.log(`${tag.padEnd(28)} ${String(plans.length).padStart(2)} plans${missing.length ? ` (fallback: missing ${missing.join("+")})` : ""}  ${[...labels].map(([id, l]) => `${id}=${l.join("+")}`).join("  ")}`);
}

console.log(fails ? `\n${fails} failure(s)` : "\nAll data checks pass.");
process.exit(fails ? 1 : 0);
