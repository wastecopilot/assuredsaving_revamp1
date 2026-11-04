/**
 * Address autocomplete, ported from the original one-pager
 * (github.com/wastecopilot/assuredsaving, app/lib/data.ts · getAddressSuggestions).
 *
 * MOCKED, no real lookup:
 * - Fixed suggestions match first (inclusive, any part of the address).
 * - When fewer than 3 match, realistic US addresses are built from whatever the
 *   visitor typed, so the list never goes empty.
 * - Every suggestion carries its own address type (residential or business),
 *   so the visitor never chooses it. Typed text with business words such as
 *   "Suite" or "Office" is always treated as business.
 */
import { ADDRESS_TEMPLATES, ADDRESSES, type AddressType, type SampleAddress } from "@/data/catalog";

/** Words that mark a commercial address. Apartment markers (Apt, Unit, #) stay residential. */
const BUSINESS_HINTS =
  /\b(suite|ste\.?|floor|office|offices|plaza|center|centre|commerce|commercial|business|industrial|corporate|tower|mall|warehouse|depot|tech park|office park|business park)\b/i;

export const hasBusinessHint = (text: string) => BUSINESS_HINTS.test(text);
export const formatAddress = (a: SampleAddress) => `${a.line1}, ${a.city}, ${a.state} ${a.zip}`;
const titleCase = (s: string) => s.replace(/\b([a-z])/g, (m) => m.toUpperCase());

export function getAddressSuggestions(query: string): SampleAddress[] {
  const cleaned = query.trim();
  if (!cleaned) return [];
  const needle = cleaned.toLowerCase();

  const base = ADDRESSES.filter((a) => formatAddress(a).toLowerCase().includes(needle));
  if (base.length >= 3) return base.slice(0, 5);

  // Street part only (ignore any city typed after a comma).
  const typed = titleCase(cleaned.split(",")[0].replace(/\s+/g, " ").trim());
  // Just a house number? Put it in front of the template street, like the original.
  const onlyNumber = /^\d+[A-Za-z]?$/.test(typed);
  const taken = new Set(base.map((a) => formatAddress(a).toLowerCase()));
  const built = ADDRESS_TEMPLATES.map((tpl, i): SampleAddress => {
    const line1 = onlyNumber ? `${typed} ${tpl.street}` : typed;
    return {
      id: `typed-${i}-${line1.toLowerCase()}`,
      line1,
      city: tpl.city,
      state: tpl.state,
      zip: tpl.zip,
      timeZone: tpl.timeZone,
      type: hasBusinessHint(line1) ? "business" : tpl.type,
    };
  }).filter((a) => !taken.has(formatAddress(a).toLowerCase()));

  return [...base, ...built].slice(0, 5);
}

export type { AddressType };
