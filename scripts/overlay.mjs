// Overlay tool (Phase 3.5 verification): my baked glyph over the
// Harris exemplar crop, aligned by ink bounding box (height exact,
// left edges and baselines matched; the width ratio is printed as a
// diagnostic). Draws the fused outline translucent red and each
// stroke's spine as a coloured, numbered polyline — so shape errors
// and stroke-split errors are both visible against the source.
//   node scripts/overlay.mjs foundational a model
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { bakeFontGlyph, loadStrokeFont, resolveGlyphStrokes, sampleSpine, toSVGPath } from "../dist/index.js";
import { foundationalFont } from "../dist/fonts/foundational.js";
import { imperialFont } from "../dist/fonts/imperial.js";
import { frakturFont } from "../dist/fonts/fraktur.js";

const FONTS = { foundational: foundationalFont, imperial: imperialFont, fraktur: frakturFont };
const TAGS = {
  foundational: ["fnd44", "fnd45L", "fnd45R"],
  imperial: ["ic1", "ic2", "ic3", "ic4", "ic5", "ic6", "ic7"],
  fraktur: ["fk76", "fk77L", "fk77R"],
};
// Map keys that are not encoding characters (alternate forms share the
// main glyph for a first overlay pass).
const ALIAS = { a2: "a", o2: "o", r2: "r", h2: "h", longs: "ſ" };
const COLORS = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#42d4f4", "#f032e6", "#bfef45"];

const [fontKey, ch, kind, tag] = process.argv.slice(2);
if (!fontKey || !ch || !kind) {
  console.error("usage: overlay.mjs <font> <char> <model|ductus> [mapTag]");
  process.exit(1);
}
const exDir = new URL("../demo/overlays/exemplars/", import.meta.url);
let entry, mapTag;
for (const t of tag ? [tag] : TAGS[fontKey]) {
  const map = JSON.parse(readFileSync(new URL(`${t}-map.json`, exDir), "utf8"));
  if (map[ch]?.[kind]) { entry = map[ch][kind]; mapTag = t; break; }
}
if (!entry) { console.error(`no exemplar for ${ch}/${kind} in ${fontKey}`); process.exit(1); }

const font = loadStrokeFont(FONTS[fontKey]());
const glyphName = font.file.encoding[ALIAS[ch] ?? ch];
const bake = bakeFontGlyph(font, glyphName);
const ink = bake.groups.get("ink");
let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
for (const poly of ink) for (const ring of poly) for (const p of ring) {
  minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
  minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
}
const myW = maxX - minX, myH = maxY - minY;
const [exX0, exY0, exX1, exY1] = entry.bbox;
const [crX0, crY0] = entry.crop;
const exW = exX1 - exX0 + 1, exH = exY1 - exY0 + 1;
const scale = exH / myH;
const ox = (exX0 - crX0) - minX * scale;         // left edges align
const oy = (exY1 - crY0) + minY * scale;         // baselines (ink bottoms) align, screen y down
console.log(`${ch}/${kind}: scale ${scale.toFixed(3)} px/unit; my width ${Math.round(myW)}u vs exemplar ${(exW / scale).toFixed(0)}u (ratio ${(myW / (exW / scale)).toFixed(2)})`);

const cropW = entry.crop[2] - entry.crop[0], cropH = entry.crop[3] - entry.crop[1];
const strokes = resolveGlyphStrokes(font, glyphName);
// Harris colours each stroke of the decomposition differently; do the
// same: every stroke's own baked outline in its own colour, with the
// spine and a numbered badge at its start.
const perStroke = bake.perStroke.map((sb, i) => {
  const s = strokes[i];
  const pts = sampleSpine(s.spine, 6).map((sm) => `${(ox + sm.point.x * scale).toFixed(1)},${(oy - sm.point.y * scale).toFixed(1)}`).join(" ");
  const start = s.spine.nodes[0];
  const sx = ox + start.x * scale, sy = oy - start.y * scale;
  const c = COLORS[i % COLORS.length];
  return `<path d="${toSVGPath(sb.outline)}" transform="translate(${ox} ${oy}) scale(${scale})" fill="${c}" fill-opacity="0.55" fill-rule="evenodd"/>
<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="5 3"/>
<circle cx="${sx}" cy="${sy}" r="9" fill="${c}"/>
<text x="${sx}" y="${sy + 4}" font-size="11" font-family="sans-serif" font-weight="bold" fill="white" text-anchor="middle">${i + 1}</text>`;
}).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cropW} ${cropH}" width="${cropW}" height="${cropH}">
${perStroke}
</svg>`;
mkdirSync(new URL("../demo/overlays", import.meta.url), { recursive: true });
const outBase = `${fontKey}-${ch}-${kind}`;
writeFileSync(new URL(`../demo/overlays/${outBase}.svg`, import.meta.url), svg);
const overlayPng = new Resvg(svg, { background: "rgba(0,0,0,0)" }).render().asPng();
writeFileSync(new URL(`../demo/overlays/${outBase}-mine.png`, import.meta.url), overlayPng);
execFileSync("python3", ["-c", `
from PIL import Image
import sys
bg = Image.open(${JSON.stringify(new URL(`../demo/overlays/exemplars/${entry.file}`, import.meta.url).pathname)}).convert("RGBA")
fg = Image.open(${JSON.stringify(new URL(`../demo/overlays/${outBase}-mine.png`, import.meta.url).pathname)}).convert("RGBA")
bg.alpha_composite(fg)
bg.convert("RGB").save(${JSON.stringify(new URL(`../demo/overlays/${outBase}.png`, import.meta.url).pathname)})
`]);
console.log("wrote demo/overlays/" + outBase + ".png");
