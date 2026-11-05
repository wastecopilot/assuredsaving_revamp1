/**
 * Service selection rules, matching https://www.assuredsaving.com/:
 *
 * - Any one service can be chosen on its own.
 * - Combinations: Internet + TV, Internet + TV + Landline, Internet + TV + Mobile,
 *   and Internet + TV + Landline + Mobile. Home Security is always alone.
 * - Clicking a service that does not fit the current selection starts over with
 *   just that service.
 * - Clicking a selected service removes it, unless it is the only one selected.
 *   Landline and Mobile only come with Internet + TV, so removing Internet or TV
 *   also removes them.
 *
 * Landline is the "phone" service id.
 */
import type { ServiceId } from "@/data/catalog";

export const VALID_SELECTIONS: ServiceId[][] = [
  ["internet"],
  ["tv"],
  ["phone"],
  ["mobile"],
  ["security"],
  ["internet", "tv"],
  ["internet", "tv", "phone"],
  ["internet", "tv", "mobile"],
  ["internet", "tv", "phone", "mobile"],
];

const key = (s: readonly ServiceId[]) => [...new Set(s)].sort().join("+");
const VALID = new Set(VALID_SELECTIONS.map(key));

export const isValidSelection = (s: readonly ServiceId[]) => s.length === 0 || VALID.has(key(s));

/** The selection after one click on `x`. */
export function toggleService(sel: readonly ServiceId[], x: ServiceId): ServiceId[] {
  if (sel.includes(x)) {
    if (sel.length === 1) return [...sel];
    let next = sel.filter((s) => s !== x);
    if (!(next.includes("internet") && next.includes("tv"))) next = next.filter((s) => s !== "phone" && s !== "mobile");
    return next;
  }
  const added = [...sel, x];
  return VALID.has(key(added)) ? added : [x];
}

/** Applies a series of clicks from an empty selection. */
export const applyClicks = (clicks: readonly ServiceId[]) => clicks.reduce<ServiceId[]>((s, x) => toggleService(s, x), []);

/** Official: "Only Internet and Internet + TV Bundle are available for business addresses." */
export const BUSINESS_SELECTIONS: ServiceId[][] = [["internet"], ["internet", "tv"]];
export const businessAllows = (s: readonly ServiceId[]) => BUSINESS_SELECTIONS.some((b) => key(b) === key(s));
