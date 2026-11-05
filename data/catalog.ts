/**
 * ============================================================================
 *  SAMPLE DATA · DESIGN PREVIEW ONLY (catalog: services, addresses, options)
 * ============================================================================
 *  Every address, plan, price, fee, speed and tier here is illustrative sample
 *  data for the design preview. Nothing is a live offer. Provider names are
 *  plain text only. All money values are in cents.
 * ============================================================================
 */

export type ServiceId = "internet" | "tv" | "mobile" | "security" | "phone";
export type Tech = "fiber" | "cable" | "fiveG" | "dsl" | "satellite" | "streaming" | "wireless" | "monitored" | "voip" | "landline";
import type { Key } from "@/lib/i18n";
export type Text = { en: string; es: string };
export const T = (en: string, es: string): Text => ({ en, es });

export const SERVICE_ORDER: ServiceId[] = ["internet", "tv", "phone", "mobile", "security"];

export const BUNDLE_PRESETS: { id: "internet-tv" | "internet-tv-phone" | "internet-tv-mobile" | "quad"; services: ServiceId[] }[] = [
  { id: "internet-tv", services: ["internet", "tv"] },
  { id: "internet-tv-phone", services: ["internet", "tv", "phone"] },
  { id: "internet-tv-mobile", services: ["internet", "tv", "mobile"] },
  { id: "quad", services: ["internet", "tv", "mobile", "phone"] },
];

/* ------------------------------------------------------------------ */
/*  Address search (mocked, no real lookup)                            */
/* ------------------------------------------------------------------ */
export type AddressType = "residential" | "business";
export interface SampleAddress {
  id: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  type: AddressType;
  timeZone: string;
}
/** Fixed suggestions, the same five as the original one-pager (each with its type). */
export const ADDRESSES: SampleAddress[] = [
  { id: "s1", line1: "658 FL-60", city: "Lake Wales", state: "FL", zip: "33853", type: "business", timeZone: "America/New_York" },
  { id: "s2", line1: "6581 Lost Canyon Ranch Road", city: "Castle Rock", state: "CO", zip: "80104", type: "residential", timeZone: "America/Denver" },
  { id: "s3", line1: "6580 Fannin Street", city: "Houston", state: "TX", zip: "77030", type: "business", timeZone: "America/Chicago" },
  { id: "s4", line1: "6585 Crescent Drive", city: "Norcross", state: "GA", zip: "30071", type: "residential", timeZone: "America/New_York" },
  { id: "s5", line1: "6584 South Parker Road", city: "Aurora", state: "CO", zip: "80014", type: "residential", timeZone: "America/Denver" },
];

/** Locations used to complete what the visitor types (same templates as the original). */
export const ADDRESS_TEMPLATES: (Omit<SampleAddress, "id" | "line1"> & { street: string })[] = [
  { street: "FL-60", city: "Lake Wales", state: "FL", zip: "33853", type: "business", timeZone: "America/New_York" },
  { street: "Lost Canyon Ranch Road", city: "Castle Rock", state: "CO", zip: "80104", type: "residential", timeZone: "America/Denver" },
  { street: "Fannin Street", city: "Houston", state: "TX", zip: "77030", type: "business", timeZone: "America/Chicago" },
  { street: "Crescent Drive", city: "Norcross", state: "GA", zip: "30071", type: "residential", timeZone: "America/New_York" },
  { street: "South Parker Road", city: "Aurora", state: "CO", zip: "80014", type: "residential", timeZone: "America/Denver" },
];

/* ------------------------------------------------------------------ */
/*  Usage (business tiles from the one-pager; home tiles from the live site) */
/* ------------------------------------------------------------------ */
/** Usage tiles. Labels are keys into the official copy (lib/i18n.ts). */
export const USAGE: Record<AddressType, { id: string; title: Key; desc: Key }[]> = {
  business: [
    { id: "office", title: "usage.businessWork", desc: "usage.businessWorkDesc" },
    { id: "streaming", title: "usage.businessStreaming", desc: "usage.businessStreamingDesc" },
    { id: "data", title: "usage.businessGaming", desc: "usage.businessGamingDesc" },
    { id: "basic", title: "usage.businessCasual", desc: "usage.businessCasualDesc" },
  ],
  residential: [
    { id: "casual", title: "usage.casual", desc: "usage.casualDesc" },
    { id: "remote", title: "usage.work", desc: "usage.workDesc" },
    { id: "4k", title: "usage.streaming", desc: "usage.streamingDesc" },
    { id: "gaming", title: "usage.gaming", desc: "usage.gamingDesc" },
  ],
};
export const DEVICES = { min: 5, max: 100, default: 15 };

export const GENRES: { id: string; label: Key }[] = [
  { id: "entertainment", label: "genre.entertainment" },
  { id: "news", label: "genre.news" },
  { id: "sports", label: "genre.sports" },
  { id: "lifestyle", label: "genre.lifestyle" },
  { id: "onDemand", label: "genre.onDemand" },
];
export const PACKS: { id: string; label: Key }[] = [
  { id: "latino", label: "intl.latino" },
  { id: "southAsian", label: "intl.southAsian" },
  { id: "southeastAsian", label: "intl.southeastAsian" },
  { id: "arabic", label: "intl.arabic" },
  { id: "eastAsian", label: "intl.eastAsian" },
  { id: "european", label: "intl.european" },
];

/** Official site links (titles come from the official copy). */
export const SITE = "https://www.assuredsaving.com";
export const FOOTER_LINKS: { group: Key; links: { key: Key; slug: string }[] }[] = [
  { group: "aboutUs", links: [ { key: "nav_advertiser", slug: "advertiser-disclosure" }, { key: "nav_aria", slug: "ai-assistant" }, { key: "nav_pricing", slug: "pricing-and-availability" } ] },
  { group: "help", links: [ { key: "nav_contact", slug: "contact" }, { key: "nav_accessibility", slug: "accessibility" }, { key: "nav_privacyChoices", slug: "privacy-choices" } ] },
  { group: "legal", links: [ { key: "nav_terms", slug: "terms-of-use" }, { key: "nav_privacy", slug: "privacy-policy" }, { key: "nav_consent", slug: "communications-consent" }, { key: "nav_sms", slug: "sms-terms" }, { key: "nav_dnc", slug: "do-not-call-policy" }, { key: "nav_legal", slug: "legal" } ] },
];
export const siteUrl = (slug: string, lang: "en" | "es") => (lang === "en" ? `${SITE}/${slug}/` : `${SITE}/es/${slug}/`);


