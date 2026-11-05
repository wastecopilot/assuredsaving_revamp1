/**
 * Calling hours and MOCKED phone checks for the Aria callback demo (adapted from my earlier one-pager build).
 * Nothing here contacts a real service.
 * Calling hours: Monday to Saturday, 8:00 AM to 9:00 PM in the chosen time zone (official window).
 */
import type { Lang } from "./i18n";

export const TIME_ZONES = [
  { id: "America/New_York", en: "Eastern (ET)", es: "Este (ET)" },
  { id: "America/Chicago", en: "Central (CT)", es: "Centro (CT)" },
  { id: "America/Denver", en: "Mountain (MT)", es: "Montaña (MT)" },
  { id: "America/Phoenix", en: "Arizona (MST)", es: "Arizona (MST)" },
  { id: "America/Los_Angeles", en: "Pacific (PT)", es: "Pacífico (PT)" },
  { id: "America/Anchorage", en: "Alaska (AKT)", es: "Alaska (AKT)" },
  { id: "Pacific/Honolulu", en: "Hawaii (HT)", es: "Hawái (HT)" },
];

const START = 8 * 60; // official: "Preferred Time (8am - 9pm)"
const END = 21 * 60; // last start time is 8:30 PM
const STEP = 30;

function zoned(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return { y: +parts.year, m: +parts.month, d: +parts.day, mins: +parts.hour * 60 + +parts.minute, weekday: parts.weekday as string };
}

export function inCallingHours(now: Date, tz: string) {
  const z = zoned(now, tz);
  return z.weekday !== "Sun" && z.mins >= START && z.mins < END;
}

const pad = (n: number) => String(n).padStart(2, "0");
const label = (mins: number) => {
  const h = Math.floor(mins / 60);
  return `${((h + 11) % 12) + 1}:${pad(mins % 60)} ${h < 12 ? "AM" : "PM"}`;
};

export interface Day {
  key: string;
  label: string;
  isToday: boolean;
  slots: { key: string; label: string }[];
}

/** Next `count` calling days (Mon to Sat) and their open start times. */
export function callingDays(now: Date, tz: string, lang: Lang, count = 6): Day[] {
  const z = zoned(now, tz);
  const base = Date.UTC(z.y, z.m - 1, z.d, 12);
  const days: Day[] = [];
  for (let i = 0; days.length < count && i < 14; i++) {
    const d = new Date(base + i * 86400000);
    if (d.getUTCDay() === 0) continue; // Sunday
    const slots: Day["slots"] = [];
    for (let m = START; m < END; m += STEP) {
      if (i === 0 && m < z.mins + 15) continue; // 15-minute lead time today
      slots.push({ key: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`, label: label(m) });
    }
    if (!slots.length) continue;
    days.push({
      key: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      label: d.toLocaleDateString(lang === "es" ? "es-US" : "en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }),
      isToday: i === 0,
      slots,
    });
  }
  return days;
}

export const digits = (s: string) => s.replace(/\D/g, "");

/** US number as 10 digits: accepts 10 digits, or 11 starting with 1. Never truncates. */
export function nationalDigits(s: string): string {
  const d = digits(s);
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
}

/** Formats a complete or partial US number; anything longer is left as typed digits. */
export function formatPhone(s: string) {
  const d = nationalDigits(s);
  if (d.length > 10) return d.slice(0, 15);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function phoneError(s: string): "empty" | "invalid" | null {
  const d = nationalDigits(s);
  if (d.length < 10) return "empty";
  if (d.length > 10) return "invalid"; // international or mistyped: reject, don't guess
  if (/^[01]/.test(d) || /^\d{3}[01]/.test(d) || /^\d11/.test(d) || /^\d{3}11/.test(d)) return "invalid";
  return null;
}
/** DEMO RULE: numbers ending in 0000 act as if they are on the do-not-call list. */
export const onDoNotCallList = (s: string) => digits(s).endsWith("0000");
/** DEMO RULE: any 6 digits verify, except 000000. */
export const codeOk = (code: string) => code !== "000000";

/** Linear-time email check (no overlapping groups), with RFC length limits. */
export function emailOk(s: string) {
  const v = s.trim();
  if (v.length > 254 || /[\p{Cc}\p{Cf}]/u.test(v)) return false;
  return /^[^\s@]{1,64}@(?:[^\s@.]+\.)+[^\s@.]{2,63}$/.test(v);
}

/** Removes control and invisible formatting characters (bidi overrides, zero-width) and squeezes spaces. */
export const cleanText = (s: string) => s.normalize("NFC").replace(/[\p{Cc}\p{Cf}]/gu, "").replace(/\s+/g, " ").trim();
/** A name needs at least two letters once invisible characters are removed. */
export const nameOk = (s: string) => /\p{L}.*\p{L}/u.test(cleanText(s));

/** Only known time zones; anything else falls back to Eastern. */
export const safeZone = (z: string | undefined | null) => (TIME_ZONES.some((t) => t.id === z) ? (z as string) : "America/New_York");
