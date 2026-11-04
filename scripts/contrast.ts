/** Checks every text/background pair defined in lib/tokens.ts against WCAG AA (4.5:1). */
import { contrastPairs } from "../lib/tokens";

const lum = (h: string) => {
  const [r, g, b] = (h.replace("#", "").match(/\w\w/g) ?? []).map((x) => {
    const v = parseInt(x, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

let fail = 0;
for (const [fg, bg, label] of contrastPairs()) {
  const r = ratio(fg, bg);
  if (r < 4.5) fail++;
  console.log(`${r >= 4.5 ? "PASS" : "FAIL"} ${r.toFixed(2).padStart(5)}:1  ${label}`);
}
console.log(fail ? `\n${fail} pair(s) below 4.5:1` : "\nAll pairs pass WCAG AA.");
process.exit(fail ? 1 : 0);
