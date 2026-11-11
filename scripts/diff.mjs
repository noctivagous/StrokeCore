// Pixel-diff step 1 (bake): render my glyph's fused ink solid black
// on transparency, at the exemplar crop's exact pixel size and the
// overlay alignment (ink bbox -> ink bbox, height exact).
//   node scripts/diff.mjs foundational a   ->  demo/diffs/foundational-a-mine.png
// Step 2 is scripts/diff.py (mask, IoU, composite).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { bakeFontGlyph, loadStrokeFont, toSVGPath } from "../dist/index.js";
import { foundationalFont } from "../dist/fonts/foundational.js";
import { imperialFont } from "../dist/fonts/imperial.js";
import { frakturFont } from "../dist/fonts/fraktur.js";

const FONTS = { foundational: foundationalFont, imperial: imperialFont, fraktur: frakturFont };
const TAGS = {
  foundational: ["fnd44", "fnd45L", "fnd45R"],
  imperial: ["ic1", "ic2", "ic3", "ic4", "ic5", "ic6", "ic7"],
  fraktur: ["fk76", "fk77L", "fk77R"],
};
const ALIAS = { a2: "a", o2: "o", r2: "r", h2: "h", longs: "ſ" };
const [fontKey, ch] = process.argv.slice(2);
const exDir = new URL("../demo/overlays/exemplars/", import.meta.url);
let entry;
for (const t of TAGS[fontKey]) {
  const map = JSON.parse(readFileSync(new URL(`${t}-map.json`, exDir), "utf8"));
  if (map[ch]?.model) { entry = map[ch].model; break; }
}
if (!entry) { console.error(`no model exemplar for ${ch}`); process.exit(1); }

const font = loadStrokeFont(FONTS[fontKey]());
const bake = bakeFontGlyph(font, font.file.encoding[ALIAS[ch] ?? ch]);
const ink = bake.groups.get("ink");
let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
for (const poly of ink) for (const ring of poly) for (const p of ring) {
  minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
  minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
}
const [exX0, exY0, exX1, exY1] = entry.bbox;
const [crX0, crY0, crX1, crY1] = entry.crop;
const exH = exY1 - exY0 + 1;
const scale = exH / (maxY - minY);
const ox = (exX0 - crX0) - minX * scale;
const oy = (exY1 - crY0) + minY * scale;
const cropW = crX1 - crX0, cropH = crY1 - crY0;
// toSVGPath already negates y; translate+uniform scale is the overlay mapping.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cropW} ${cropH}" width="${cropW}" height="${cropH}">
<path d="${toSVGPath(ink)}" transform="translate(${ox} ${oy}) scale(${scale})" fill="black" fill-rule="evenodd"/>
</svg>`;
mkdirSync(new URL("../demo/diffs", import.meta.url), { recursive: true });
writeFileSync(new URL(`../demo/diffs/${fontKey}-${ch}-mine.png`, import.meta.url),
  new Resvg(svg, { background: "rgba(0,0,0,0)" }).render().asPng());
writeFileSync(new URL(`../demo/diffs/${fontKey}-${ch}-exemplar.json`, import.meta.url),
  JSON.stringify({ cropFile: entry.file, scheme: fontKey === "foundational" ? "blue" : "red" }));
console.log(`baked ${fontKey}-${ch}-mine.png (${cropW}x${cropH})`);
