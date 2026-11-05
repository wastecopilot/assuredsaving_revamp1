/**
 * Runtime UI text. Reads only the strings the app uses (lib/copy.gen.json),
 * which scripts/build-copy.ts resolves from the official copy via lib/copy-sources.ts.
 * tests/copy.test.ts fails if copy.gen.json is out of date.
 */
import gen from "./copy.gen.json";
import type { Key, Lang } from "./copy-sources";

export type { Key, Lang };

const TEXT = gen as Record<Lang, Record<Key, string>>;
export const KEYS = Object.keys(TEXT.en) as Key[];

export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  const base = TEXT[lang][key] ?? TEXT.en[key] ?? key;
  if (!vars) return base;
  return base.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
