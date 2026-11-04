/**
 * DESIGN TOKENS: Assured Saving "Midnight Spectrum" edition. The single source of truth.
 * Colour, type scale, spacing (8px grid), radius, shadow and motion live here.
 * layout.tsx writes them as CSS variables; Tailwind maps them to utilities in
 * app/globals.css; scripts/contrast.ts checks every text pair for WCAG AA.
 *
 * Direction: a deep midnight stage with neon glows for the hero, the scan and
 * the TV tiers; solid colour-blocked service tiles (cyan, magenta, amber, lime,
 * royal blue); a magenta-to-violet action gradient; light lavender work areas.
 */
import type { ServiceId } from "@/data/catalog";

export const color = {
  ink: "#0E1236",
  muted: "#4C5275",
  line: "#E2E4F0",
  lineStrong: "#C9CCE0",
  canvas: "#F1F2F9",
  surface: "#FFFFFF",
  surface2: "#F6F7FC",
  primary: "#5B2EE8", // electric violet: links, focus, selected states
  primaryStrong: "#4A20D4",
  primarySoft: "#EEE9FF",
  magenta: "#D3136C", // start of the action gradient
  danger: "#C4173E",
  dangerSoft: "#FDECEF",
  success: "#0A7A55",
  navy: "#0A0E2E", // midnight stage
  midnight2: "#151A47", // raised panels on the midnight stage
  onDark: "#FFFFFF",
  onDarkMuted: "#B9BEE8",
  neon: "#2EE6FF", // decorative glow and focus ring on dark
} as const;

/**
 * One solid colour block per service: vivid = tile fill · text = AA-safe text on
 * light surfaces · on = text on the vivid fill · soft = tinted background.
 */
export const service: Record<ServiceId, { vivid: string; text: string; on: string; soft: string }> = {
  internet: { vivid: "#12C8E8", text: "#086A80", on: "#0E1236", soft: "#E1F8FC" },
  tv: { vivid: "#E0167A", text: "#B2105E", on: "#FFFFFF", soft: "#FDE7F1" },
  mobile: { vivid: "#FFB020", text: "#875400", on: "#0E1236", soft: "#FFF3DC" },
  security: { vivid: "#7DD322", text: "#3B6A08", on: "#0E1236", soft: "#EDF8DF" },
  phone: { vivid: "#3B5BFF", text: "#2B45D4", on: "#FFFFFF", soft: "#E8ECFF" },
};

/** Action gradient (buttons, active step) and the neon headline gradient used on midnight. */
export const gradient = { from: "#D3136C", to: "#5B2EE8", text: "#FFFFFF" };
export const neonText = { a: "#FF5CAA", b: "#B49BFF", c: "#2EE6FF" };

/** Type scale (rem / line height). One family: Plus Jakarta Sans, tabular numbers for prices. */
export const type = {
  xs: ["0.75rem", "1rem"],
  sm: ["0.875rem", "1.375rem"],
  base: ["1rem", "1.625rem"],
  lg: ["1.125rem", "1.75rem"],
  xl: ["1.25rem", "1.75rem"],
  "2xl": ["1.5rem", "2rem"],
  "3xl": ["1.875rem", "2.25rem"],
  "4xl": ["2.5rem", "2.75rem"],
  "5xl": ["3.75rem", "1"],
} as const;

export const space = { unit: 8 };
export const radius = { sm: "10px", md: "14px", lg: "20px", xl: "28px", full: "9999px" };
export const shadow = {
  sm: "0 1px 2px rgb(14 18 54 / 0.06)",
  md: "0 2px 4px rgb(14 18 54 / 0.04), 0 18px 40px -18px rgb(14 18 54 / 0.22)",
  glow: "0 12px 28px -10px rgb(211 19 108 / 0.55)",
  overlay: "0 30px 80px -20px rgb(10 14 46 / 0.55)",
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
    [color.primary, color.canvas, "primary text/canvas"],
    [color.primary, color.primarySoft, "primary text/primarySoft"],
    ["#FFFFFF", color.primary, "white/primary"],
    ["#FFFFFF", color.primaryStrong, "white/primaryStrong"],
    ["#FFFFFF", gradient.from, "white/gradient start"],
    ["#FFFFFF", gradient.to, "white/gradient end"],
    [color.magenta, color.surface, "magenta text/surface"],
    [color.onDark, color.navy, "white/midnight"],
    [color.onDark, color.midnight2, "white/midnight2"],
    [color.onDarkMuted, color.navy, "muted on dark/midnight"],
    [color.onDarkMuted, color.midnight2, "muted on dark/midnight2"],
    [color.neon, color.navy, "neon/midnight"],
    [neonText.a, color.navy, "neon pink/midnight"],
    [neonText.b, color.navy, "neon violet/midnight"],
    [color.danger, color.surface, "danger/surface"],
    [color.danger, color.dangerSoft, "danger/dangerSoft"],
    [color.success, color.surface, "success/surface"],
  ];
  for (const [k, c] of Object.entries(service)) {
    p.push(
      [c.text, color.surface, `${k} text/surface`],
      [c.text, color.canvas, `${k} text/canvas`],
      [c.text, c.soft, `${k} text/soft`],
      [c.on, c.vivid, `${k} on/vivid`],
    );
  }
  return p;
}

export function cssVariables(): string {
  const v: string[] = [];
  const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  for (const [k, c] of Object.entries(color)) v.push(`--${kebab(k).replace(/(\d)/, "-$1")}:${c}`);
  for (const [k, c] of Object.entries(service)) v.push(`--${k}:${c.vivid}`, `--${k}-text:${c.text}`, `--${k}-on:${c.on}`, `--${k}-soft:${c.soft}`);
  v.push(`--grad-from:${gradient.from}`, `--grad-to:${gradient.to}`, `--neon-a:${neonText.a}`, `--neon-b:${neonText.b}`, `--neon-c:${neonText.c}`);
  for (const [k, s] of Object.entries(shadow)) v.push(`--sh-${k}:${s}`);
  return `:root{${v.join(";")}}`;
}
