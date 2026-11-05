/**
 * DESIGN TOKENS: the single source of truth for colour, type, radius, shadow and motion.
 * layout.tsx writes them as CSS variables; Tailwind maps them in app/globals.css;
 * scripts/contrast.ts checks every text pair for WCAG AA.
 *
 * Flat colours only. No gradients, glows or translucent glass.
 * A solid navy stage for step 1, white work areas after it, one bright blue for
 * actions, and one solid colour per service.
 */
import type { ServiceId } from "@/data/catalog";

export const color = {
  ink: "#101828",
  muted: "#475467",
  line: "#E4E7EC",
  lineStrong: "#D0D5DD",
  canvas: "#F5F7FA",
  surface: "#FFFFFF",
  surface2: "#F9FAFB",
  primary: "#0B5FFF", // actions, links, focus
  primaryStrong: "#0047D6",
  primarySoft: "#EAF1FF",
  danger: "#B42318",
  dangerSoft: "#FEF3F2",
  success: "#067647",
  successSoft: "#ECFDF3",
  warning: "#B54708",
  warningSoft: "#FFFAEB",
  navy: "#0A1F44", // step 1 stage, scan, footer
  navy2: "#132B57", // panels on the navy stage
  navyLine: "#284473",
  onDark: "#FFFFFF",
  onDarkMuted: "#C1CDE3",
  accent: "#00A6A6", // brand teal, marks and highlights on navy
} as const;

/**
 * One solid colour per service: vivid = tile fill · on = text on that fill ·
 * text = AA text on white · soft = light tint.
 */
export const service: Record<ServiceId, { vivid: string; on: string; text: string; soft: string }> = {
  internet: { vivid: "#00A6A6", on: "#06202A", text: "#00706F", soft: "#E5F6F6" },
  tv: { vivid: "#E0301E", on: "#FFFFFF", text: "#B42318", soft: "#FEF3F2" },
  phone: { vivid: "#7A5AF8", on: "#FFFFFF", text: "#5925DC", soft: "#F4F3FF" },
  mobile: { vivid: "#F79009", on: "#1F1300", text: "#B54708", soft: "#FFFAEB" },
  security: { vivid: "#17B26A", on: "#06231A", text: "#067647", soft: "#ECFDF3" },
};

export const type = {
  xs: ["0.75rem", "1rem"],
  sm: ["0.875rem", "1.375rem"],
  base: ["1rem", "1.5rem"],
  lg: ["1.125rem", "1.75rem"],
  xl: ["1.25rem", "1.75rem"],
  "2xl": ["1.5rem", "2rem"],
  "3xl": ["1.875rem", "2.25rem"],
  "4xl": ["2.25rem", "2.5rem"],
  "5xl": ["3rem", "1.1"],
} as const;

export const space = { unit: 4 };
export const radius = { sm: "6px", md: "8px", lg: "12px", xl: "16px", full: "9999px" };
export const shadow = {
  sm: "0 1px 2px rgb(16 24 40 / 0.06)",
  md: "0 1px 3px rgb(16 24 40 / 0.08), 0 1px 2px rgb(16 24 40 / 0.04)",
  lg: "0 12px 16px -4px rgb(16 24 40 / 0.08), 0 4px 6px -2px rgb(16 24 40 / 0.03)",
  overlay: "0 24px 48px -12px rgb(16 24 40 / 0.18)",
};
export const motion = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
  ease: [0.2, 0, 0, 1] as [number, number, number, number],
  spring: { type: "spring" as const, stiffness: 500, damping: 40 },
  soft: { type: "spring" as const, stiffness: 320, damping: 36 },
};

export function contrastPairs(): [string, string, string][] {
  const p: [string, string, string][] = [
    [color.ink, color.surface, "ink/surface"],
    [color.ink, color.canvas, "ink/canvas"],
    [color.muted, color.surface, "muted/surface"],
    [color.muted, color.canvas, "muted/canvas"],
    [color.muted, color.surface2, "muted/surface2"],
    [color.primary, color.surface, "primary text/surface"],
    [color.primary, color.primarySoft, "primary text/primarySoft"],
    ["#FFFFFF", color.primary, "white/primary"],
    ["#FFFFFF", color.primaryStrong, "white/primaryStrong"],
    [color.danger, color.surface, "danger/surface"],
    [color.danger, color.dangerSoft, "danger/dangerSoft"],
    [color.success, color.surface, "success/surface"],
    [color.success, color.successSoft, "success/successSoft"],
    [color.warning, color.warningSoft, "warning/warningSoft"],
    [color.onDark, color.navy, "white/navy"],
    [color.onDark, color.navy2, "white/navy2"],
    [color.onDarkMuted, color.navy, "muted on dark/navy"],
    [color.onDarkMuted, color.navy2, "muted on dark/navy2"],
    [color.accent, color.navy, "teal/navy (large text)"],
  ];
  for (const [k, c] of Object.entries(service)) {
    p.push([c.on, c.vivid, `${k} on/vivid`], [c.text, color.surface, `${k} text/surface`], [c.text, c.soft, `${k} text/soft`]);
  }
  return p;
}

export function cssVariables(): string {
  const v: string[] = [];
  const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).replace(/(\D)(\d)/, "$1-$2");
  for (const [k, c] of Object.entries(color)) v.push(`--${kebab(k)}:${c}`);
  for (const [k, c] of Object.entries(service)) v.push(`--${k}:${c.vivid}`, `--${k}-on:${c.on}`, `--${k}-text:${c.text}`, `--${k}-soft:${c.soft}`);
  for (const [k, s] of Object.entries(shadow)) v.push(`--sh-${k}:${s}`);
  return `:root{${v.join(";")}}`;
}
