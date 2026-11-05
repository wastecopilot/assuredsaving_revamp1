/**
 * Resolves every UI key from the official copy (data/official-copy.json) and writes
 * only those strings to lib/copy.gen.json, so the browser never downloads the full
 * official dictionary. Runs before `next build` (npm "prebuild").
 */
import { writeFileSync } from "node:fs";
import { resolveAll } from "../lib/copy-sources";

const out = resolveAll();
writeFileSync(new URL("../lib/copy.gen.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(`copy.gen.json: ${Object.keys(out.en).length} keys in en and es`);
