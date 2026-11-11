// Generate standalone SVG stills of the Phase 1 glyphs for visual checks.
// Run after `npm run build`:  node scripts/shots.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { bakeGlyph, bakeStroke, broadEdgeNib, flatBrush, guidesSVG, multiPolygonArea, pointedBrush, toSVGPath } from "../dist/index.js";
import { glyphBrushA, glyphH, glyphX, swellStroke } from "../dist/fixtures.js";

mkdirSync(new URL("../demo/shots", import.meta.url), { recursive: true });

function shot(name, strokes, extra = "") {
  const baked = bakeGlyph(strokes);
  const ink = baked.groups.get("ink");
  const spineLines = strokes
    .map((s) => {
      const [a, b] = s.spine.nodes;
      return `<line x1="${a.x}" y1="${-a.y}" x2="${b.x}" y2="${-b.y}" stroke="#e67e22" stroke-width="0.7" stroke-dasharray="3 2"/>`;
    })
    .join("\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -116 132 132" width="528" height="528">
<rect x="-16" y="-116" width="132" height="132" fill="white"/>
<path d="${toSVGPath(ink)}" fill="#1a1a1a" fill-rule="evenodd"/>
${spineLines}
${extra}
</svg>`;
  writeFileSync(new URL(`../demo/shots/${name}.svg`, import.meta.url), svg);
  console.log(name, "polygons:", ink.length, "area:", Math.round(multiPolygonArea(ink)));
}

shot("x", glyphX(broadEdgeNib("C-like", 22, 4), 30));
shot("h", glyphH(broadEdgeNib("C-like", 16, 3), 0));

// The comparison still: PostScript-style stroke of the same x spines.
const ps = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -116 132 132" width="528" height="528">
<rect x="-16" y="-116" width="132" height="132" fill="white"/>
<line x1="14" y1="-8" x2="86" y2="-92" stroke="#c0392b" stroke-width="22" stroke-linecap="butt"/>
<line x1="14" y1="-92" x2="86" y2="-8" stroke="#c0392b" stroke-width="22" stroke-linecap="butt"/>
</svg>`;
writeFileSync(new URL("../demo/shots/x-postscript.svg", import.meta.url), ps);
console.log("x-postscript written");

// Phase 2: the pointed-brush swell — one spine, pressure 0 → 1 → 0.
{
  const baked = bakeStroke(swellStroke(pointedBrush("Pointed brush", 26, 40)), { step: 2 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -84 108 76" width="648" height="456">
<rect x="-4" y="-84" width="108" height="76" fill="white"/>
<path d="${toSVGPath(baked.outline)}" fill="#1a1a1a" fill-rule="evenodd"/>
</svg>`;
  writeFileSync(new URL("../demo/shots/swell.svg", import.meta.url), svg);
  console.log("swell written; area:", Math.round(multiPolygonArea(baked.outline)));
}

// Phase 2: the flat-brush Roman A over a Dürer-style scaffold —
// the square, its inscribed circle, diagonals and centre line.
{
  const baked = bakeGlyph(glyphBrushA(flatBrush("Flat brush", 14, 3)), { step: 2 });
  const ink = baked.groups.get("ink");
  const scaffold = [
    `<rect x="6" y="-94" width="88" height="88" fill="none" stroke="#b03a2e" stroke-width="0.7"/>`,
    `<circle cx="50" cy="-50" r="44" fill="none" stroke="#b03a2e" stroke-width="0.7"/>`,
    `<line x1="6" y1="-6" x2="94" y2="-94" stroke="#b03a2e" stroke-width="0.5"/>`,
    `<line x1="6" y1="-94" x2="94" y2="-6" stroke="#b03a2e" stroke-width="0.5"/>`,
    `<line x1="50" y1="-6" x2="50" y2="-94" stroke="#b03a2e" stroke-width="0.5"/>`,
  ].join("\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -116 132 132" width="528" height="528">
<rect x="-16" y="-116" width="132" height="132" fill="white"/>
${scaffold}
<path d="${toSVGPath(ink)}" fill="#1a1a1a" fill-rule="evenodd"/>
</svg>`;
  writeFileSync(new URL("../demo/shots/a-brush.svg", import.meta.url), svg);
  console.log("a-brush written; polygons:", ink.length, "area:", Math.round(multiPolygonArea(ink)));
}

// The Foundational display form (SPEC §10): the H set on the full
// guideline system — labelled lines, nib stack, X-height bracket —
// scaled so its ink stands exactly on the Capital Line.
{
  const nibPx = 15;
  const baselineY = 190;
  const strokes = glyphH(broadEdgeNib("C-like", 16, 3), 0);
  const ink = bakeGlyph(strokes).groups.get("ink");
  let minX = Infinity, minY = Infinity, maxY = -Infinity;
  for (const poly of ink) for (const ring of poly) for (const p of ring) {
    minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
  }
  const capPx = 6 * nibPx; // Capital Line: 6 nib widths
  const k = capPx / (maxY - minY);
  const tx = 90 - k * minX;
  const ty = baselineY + k * minY; // toSVGPath negates y; keep ink bottom on the baseline
  const guides = guidesSVG({ nibPx, baselineY, x0: 70, x1: 330, stackX: 46, labelX: 340 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 55 470 190" width="940" height="380">
<rect x="0" y="55" width="470" height="190" fill="white"/>
${guides}
<g transform="translate(${tx} ${ty}) scale(${k})"><path d="${toSVGPath(ink)}" fill="#1a1a1a" fill-rule="evenodd"/></g>
</svg>`;
  writeFileSync(new URL("../demo/shots/h-guides.svg", import.meta.url), svg);
  console.log("h-guides written; H ink height =", Math.round(maxY - minY), "scaled to cap height", capPx);

  // Same example with the Practice Maker's checkerboard nib stack.
  const guidesCb = guidesSVG({ nibPx, baselineY, x0: 86, x1: 330, stackX: 46, labelX: 340, stackStyle: "checkerboard" });
  const svgCb = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 55 470 190" width="940" height="380">
<rect x="0" y="55" width="470" height="190" fill="white"/>
${guidesCb}
<g transform="translate(${tx} ${ty}) scale(${k})"><path d="${toSVGPath(ink)}" fill="#1a1a1a" fill-rule="evenodd"/></g>
</svg>`;
  writeFileSync(new URL("../demo/shots/h-guides-checker.svg", import.meta.url), svgCb);
  console.log("h-guides-checker written");
}
