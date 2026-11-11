// Ductus sheet: every glyph drawn stroke by stroke in Harris's
// manner — each stroke in its own colour, numbered at its start,
// spine dashed — over the ladder guides.
//   node scripts/ductus-sheet.mjs foundational
import { writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { bakeFontGlyph, loadStrokeFont, resolveGlyphStrokes, sampleSpine, toSVGPath } from "../dist/index.js";
import { foundationalFont } from "../dist/fonts/foundational.js";
import { imperialFont } from "../dist/fonts/imperial.js";
import { frakturFont } from "../dist/fonts/fraktur.js";

const FONTS = { foundational: foundationalFont, imperial: imperialFont, fraktur: frakturFont };
const COLORS = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#42d4f4", "#f032e6", "#bfef45"];
const fontKey = process.argv[2] ?? "foundational";
const font = loadStrokeFont(FONTS[fontKey]());
const chars = Object.keys(font.file.encoding).filter((c) => !c.startsWith("_")).sort();

const S = 0.16;                       // units -> px
const CW = 150, CH = 190;             // cell size px
const COLS = 7;
const TOP = 760, BOT = -340;          // unit span shown (ascender..descender)
const cells = chars.map((ch, idx) => {
  const glyphName = font.file.encoding[ch];
  const bake = bakeFontGlyph(font, glyphName);
  const strokes = resolveGlyphStrokes(font, glyphName);
  const cx = (idx % COLS) * CW + 14, cy = Math.floor(idx / COLS) * CH + 8;
  const X = (u) => cx + u * S;
  const Y = (u) => cy + (TOP - u) * S;
  const guides = [700, 600, 400, 0, -300].map((gy) =>
    `<line x1="${cx - 6}" y1="${Y(gy)}" x2="${cx + CW - 22}" y2="${Y(gy)}" stroke="#dddddd" stroke-width="1"/>`).join("");
  const parts = bake.perStroke.map((sb, i) => {
    const s = strokes[i];
    const pts = sampleSpine(s.spine, 6).map((sm) => `${X(sm.point.x).toFixed(1)},${Y(sm.point.y).toFixed(1)}`).join(" ");
    const st = s.spine.nodes[0];
    const sx = X(st.x), sy = Y(st.y);
    const c = COLORS[i % COLORS.length];
    // NB: toSVGPath already negates y (SVG-ready), so scale uniformly.
    const path = sb.outline.length
      ? `<path d="${toSVGPath(sb.outline)}" transform="translate(${cx} ${cy + TOP * S}) scale(${S} ${S})" fill="${c}" fill-opacity="0.55" fill-rule="evenodd"/>`
      : "";
    return `${path}<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="1.4" stroke-dasharray="4 3"/>
<circle cx="${sx}" cy="${sy}" r="7" fill="${c}"/><text x="${sx}" y="${sy + 3.5}" font-size="9" font-family="sans-serif" font-weight="bold" fill="white" text-anchor="middle">${i + 1}</text>`;
  }).join("\n");
  const label = ch === "&" ? "&amp;" : ch;
  return `${guides}${parts}<text x="${cx - 4}" y="${cy + 12}" font-size="13" font-family="sans-serif" fill="#888">${label}</text>`;
}).join("\n");

const rows = Math.ceil(chars.length / COLS);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COLS * CW + 8} ${rows * CH + 12}" width="${COLS * CW + 8}" height="${rows * CH + 12}">
<rect width="100%" height="100%" fill="white"/>
${cells}
</svg>`;
mkdirSync(new URL("../demo/shots", import.meta.url), { recursive: true });
writeFileSync(new URL(`../demo/shots/ductus-${fontKey}.svg`, import.meta.url), svg);
const png = new Resvg(svg, { background: "white" }).render().asPng();
writeFileSync(new URL(`../demo/shots/ductus-${fontKey}.png`, import.meta.url), png);
console.log(`wrote demo/shots/ductus-${fontKey}.png (${chars.length} glyphs)`);
