/**
 * Calling hours and MOCKED phone checks for the Aria callback demo (adapted from my earlier one-pager build).
 * Nothing here contacts a real service.
 * Calling hours: Monday to Saturday, 9:00 AM to 8:00 PM in the chosen time zone.
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

const START = 9 * 60;
const END = 20 * 60; // last start time is 7:30 PM
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
export function formatPhone(s: string) {
  const d = digits(s).replace(/^1/, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
export function phoneError(s: string): "empty" | "invalid" | null {
  const d = digits(s).replace(/^1/, "");
  if (d.length !== 10) return "empty";
  if (/^[01]/.test(d) || /^\d{3}[01]/.test(d)) return "invalid";
  return null;
}
/** DEMO RULE: numbers ending in 0000 act as if they are on the do-not-call list. */
export const onDoNotCallList = (s: string) => digits(s).endsWith("0000");
/** DEMO RULE: any 6 digits verify, except 000000. */
export const codeOk = (code: string) => code !== "000000";
export const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
