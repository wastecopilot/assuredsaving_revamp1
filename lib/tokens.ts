/**
 * DESIGN TOKENS: Assured Saving enterprise edition. The single source of truth.
 * Colour, type scale, spacing (8px grid), radius, shadow and motion live here.
 * layout.tsx writes them as CSS variables; Tailwind maps them to utilities in
 * app/globals.css; scripts/contrast.ts checks every text pair for WCAG AA.
 *
 * Direction: crisp enterprise SaaS. Cool white surfaces, hairline borders,
 * one bright azure primary, and four bright service accents used with restraint.
 */
import type { ServiceId } from "@/data/catalog";

export const color = {
  ink: "#0A1628", // 16.8:1 on canvas
  muted: "#4B5A70", // 6.5:1 on canvas
  line: "#E3E8EF",
  lineStrong: "#CBD3DF",
  canvas: "#F4F6FA",
  surface: "#FFFFFF",
  surface2: "#F7F9FC",
  primary: "#135DF0", // bright azure, white text 5.4:1
  primaryStrong: "#1257E0",
  primarySoft: "#E8EFFF",
  danger: "#C42443",
  dangerSoft: "#FDECEF",
  success: "#0A7A55",
  navy: "#0B1B3A", // dark panels (summary header, footer band)
} as const;

/**
 * One accent per service: vivid = fills and dots · text = AA-safe text ·
 * on = text on a vivid fill · soft = tinted background.
 */
export const service: Record<ServiceId, { vivid: string; text: string; on: string; soft: string }> = {
  internet: { vivid: "#1463FF", text: "#135DF0", on: "#FFFFFF", soft: "#E8EFFF" },
  tv: { vivid: "#F0446C", text: "#C03656", on: "#0A1628", soft: "#FEECF0" },
  mobile: { vivid: "#6D51E0", text: "#6A4FDB", on: "#FFFFFF", soft: "#F2EFFF" },
  security: { vivid: "#0EA372", text: "#0A7A55", on: "#0A1628", soft: "#E7F6F1" },
  phone: { vivid: "#F5A30B", text: "#956307", on: "#0A1628", soft: "#FEF6E7" },
};

/** Brand gradient for the logo mark and small highlights (white text passes at both ends). */
export const gradient = { from: "#135DF0", to: "#1257E0", text: "#FFFFFF" };

/** Type scale (rem / line height). One family: Geist, with tabular numbers for prices. */
export const type = {
  xs: ["0.75rem", "1rem"],
  sm: ["0.875rem", "1.375rem"],
  base: ["1rem", "1.625rem"],
  lg: ["1.125rem", "1.75rem"],
  xl: ["1.25rem", "1.75rem"],
  "2xl": ["1.5rem", "2rem"],
  "3xl": ["1.875rem", "2.25rem"],
  "4xl": ["2.5rem", "2.75rem"],
  "5xl": ["3.5rem", "3.75rem"],
} as const;

export const space = { unit: 8 };
export const radius = { sm: "8px", md: "12px", lg: "16px", xl: "20px", full: "9999px" };
export const shadow = {
  sm: "0 1px 2px rgb(10 22 40 / 0.06)",
  md: "0 1px 3px rgb(10 22 40 / 0.06), 0 8px 24px -8px rgb(10 22 40 / 0.12)",
  glow: "0 8px 20px -8px rgb(20 99 255 / 0.55)",
  overlay: "0 24px 64px -16px rgb(10 22 40 / 0.35)",
};
export const motion = {
  fast: 0.15,
  base: 0.22,
  slow: 0.4,
  ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
  spring: { type: "spring" as const, stiffness: 600, damping: 32 },
  soft: { type: "spring" as const, stiffness: 300, damping: 32 },
};

export function contrastPairs(): [string, string, string][] {
  const p: [string, string, string][] = [
    [color.ink, color.canvas, "ink/canvas"],
    [color.ink, color.surface2, "ink/surface2"],
    [color.muted, color.canvas, "muted/canvas"],
    [color.muted, color.surface, "muted/surface"],
    [color.muted, color.surface2, "muted/surface2"],
    [color.muted, color.primarySoft, "muted/primarySoft"],
    [color.primary, color.surface, "primary text/surface"],
    [color.primary, color.primarySoft, "primary text/primarySoft"],
    ["#FFFFFF", color.primary, "white/primary"],
    ["#FFFFFF", color.primaryStrong, "white/primaryStrong"],
    ["#FFFFFF", color.navy, "white/navy"],
    ["#C7D3EA", color.navy, "light text/navy"],
    [color.danger, color.surface, "danger/surface"],
    [color.danger, color.dangerSoft, "danger/dangerSoft"],
    [color.success, color.surface, "success/surface"],
  ];
  for (const [k, c] of Object.entries(service)) {
    p.push([c.text, color.surface, `${k} text/surface`], [c.text, color.canvas, `${k} text/canvas`], [c.text, c.soft, `${k} text/soft`], [c.on, c.vivid, `${k} on/vivid`]);
  }
  return p;
}

export function cssVariables(): string {
  const v: string[] = [];
  const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  for (const [k, c] of Object.entries(color)) v.push(`--${kebab(k)}:${c}`);
  for (const [k, c] of Object.entries(service)) v.push(`--${k}:${c.vivid}`, `--${k}-text:${c.text}`, `--${k}-on:${c.on}`, `--${k}-soft:${c.soft}`);
  v.push(`--grad-from:${gradient.from}`, `--grad-to:${gradient.to}`);
  for (const [k, s] of Object.entries(shadow)) v.push(`--sh-${k}:${s}`);
  return `:root{${v.join(";")}}`;
}
