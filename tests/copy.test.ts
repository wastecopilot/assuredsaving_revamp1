/**
 * Every word the app shows must come from https://www.assuredsaving.com/ exactly.
 * The source is data/official-copy.json (copied verbatim from the official site).
 */
import { describe, expect, it } from "vitest";
import official from "@/data/official-copy.json";
import { KEYS, translate } from "@/lib/i18n";
import { SOURCES, resolveAll } from "@/lib/copy-sources";
import gen from "@/lib/copy.gen.json";
import { GENRES, PACKS, USAGE } from "@/data/catalog";

type Tree = { [k: string]: string | Tree };
const flat = (o: Tree, out: string[] = []): string[] => {
  for (const v of Object.values(o)) {
    if (typeof v === "string") out.push(v);
    else flat(v, out);
  }
  return out;
};
const nav = Object.values(official.nav as Record<string, Record<"en" | "es", { title: string }>>);
const OFFICIAL = {
  en: new Set([
    ...flat(official.dict.en as unknown as Tree),
    ...Object.keys(official.inline),
    official.consent.call.en,
    official.consent.sms.en,
    official.composed.callbackDesc.en,
    official.composed.lockInDesc.en,
    ...nav.map((n) => n.en.title),
  ]),
  es: new Set([
    ...flat(official.dict.es as unknown as Tree),
    ...Object.values(official.inline as Record<string, string>),
    official.consent.call.es,
    official.consent.sms.es,
    official.composed.callbackDesc.es,
    official.composed.lockInDesc.es,
    ...nav.map((n) => n.es.title),
  ]),
};
/** Official strings with decorations we leave out (a leading emoji or arrow, trailing spaces). */
const clean = (s: string) => s.replace(/^(📞\s|←\s)/, "").replace(/\s→$/, "").trim();
const isOfficial = (lang: "en" | "es", s: string) => OFFICIAL[lang].has(s) || [...OFFICIAL[lang]].some((o) => clean(o) === s);

describe("UI text comes from the official site", () => {
  it.each(["en", "es"] as const)("every %s string is official, word for word", (lang) => {
    const bad = KEYS.filter((k) => !isOfficial(lang, translate(lang, k)));
    expect(bad).toEqual([]);
  });

  it("lib/copy.gen.json is up to date with the official copy (run npm run copy)", () => {
    expect(gen).toEqual(resolveAll());
    expect(KEYS.sort()).toEqual(Object.keys(SOURCES).sort());
  });

  it("every key has a source", () => {
    for (const k of KEYS) expect(SOURCES[k]).toBeTruthy();
  });

  it("English and Spanish differ where the official site translates them", () => {
    expect(translate("es", "continue")).not.toBe(translate("en", "continue"));
  });

  it("fills placeholders", () => {
    expect(translate("en", "welcome", { name: "Jordan" })).toBe("Welcome, Jordan!");
  });

  it("catalog labels point at official keys", () => {
    for (const lang of ["en", "es"] as const) {
      for (const u of [...USAGE.business, ...USAGE.residential]) {
        expect(isOfficial(lang, translate(lang, u.title))).toBe(true);
        expect(isOfficial(lang, translate(lang, u.desc))).toBe(true);
      }
      for (const g of [...GENRES, ...PACKS]) expect(isOfficial(lang, translate(lang, g.label))).toBe(true);
    }
  });
});
