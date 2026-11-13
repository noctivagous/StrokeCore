// Generate demo/bihua-yong.html — the F1 specimen page for the owner:
// the animated 永 (partial-sweep frames), an overlay against the Make
// Me a Hanzi outline oracle, and the stroke/八法 table. Also renders
// demo/bihua-yong.png (gitignored by the repo's demo/**/*.png rule).
//
// Usage: node scripts/bihua-yong-specimen.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import polygonClipping from "polygon-clipping";
import {
  FORMS,
  STYLES,
  analyzeGrid,
  bakeCharacter,
  bakeCharacterPartial,
  gridDelta,
  lin,
  yong,
} from "../dist/bihua/index.js";
import { multiPolygonArea } from "../dist/index.js";

function flattenPath(d, steps = 20) {
  const tokens = d.match(/[MLQCZ]|-?\d*\.?\d+/g);
  let i = 0, cmd = "", cur = [0, 0], start = null;
  const ring = [];
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[MLQCZ]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === "M") { cur = [num(), num()]; start = cur; ring.push(cur); cmd = "L"; }
    else if (cmd === "L") { cur = [num(), num()]; ring.push(cur); }
    else if (cmd === "Q") {
      const c = [num(), num()]; const to = [num(), num()];
      for (let k = 1; k <= steps; k++) {
        const t = k / steps, u = 1 - t;
        ring.push([u * u * cur[0] + 2 * u * t * c[0] + t * t * to[0], u * u * cur[1] + 2 * u * t * c[1] + t * t * to[1]]);
      }
      cur = to;
    } else if (cmd === "C") {
      const c1 = [num(), num()]; const c2 = [num(), num()]; const to = [num(), num()];
      for (let k = 1; k <= steps; k++) {
        const t = k / steps, u = 1 - t;
        ring.push([u ** 3 * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * to[0], u ** 3 * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * to[1]]);
      }
      cur = to;
    } else if (cmd === "Z") { if (start) ring.push(start); }
  }
  return [ring];
}
function iouOf(fused, oracleJson) {
  const ink = polygonClipping.union(...oracleJson.strokes.map((d) => flattenPath(d)));
  const inter = polygonClipping.intersection(fused, ink);
  const uni = polygonClipping.union(fused, ink);
  return { iou: multiPolygonArea(inter) / multiPolygonArea(uni), ink };
}

const oracle = JSON.parse(
  readFileSync(new URL("./bihua-oracle-yong.json", import.meta.url), "utf8"),
);

const full = bakeCharacter(yong);
const yongGrid = analyzeGrid(full.fused, 1024);
const yongOracle = JSON.parse(readFileSync(new URL("./bihua-oracle-yong.json", import.meta.url), "utf8"));
const yongDelta = gridDelta(yongGrid, analyzeGrid(iouOf(full.fused, yongOracle).ink, 1024));
const linBake = bakeCharacter(lin);
const linOracle = JSON.parse(readFileSync(new URL("./bihua-oracle-lin.json", import.meta.url), "utf8"));
const linIou = iouOf(linBake.fused, linOracle);
const linDelta = gridDelta(analyzeGrid(linBake.fused, 1024), analyzeGrid(linIou.ink, 1024));
const linOraclePaths = linOracle.strokes.map((d) => `<path d="${d}" fill="#2563eb" fill-opacity="0.45"/>`).join("");
const styleBakes = Object.values(STYLES).map((st) => ({ style: st, bake: bakeCharacter(yong, st) }));
const stylePanels = styleBakes
  .map(({ style, bake }) => `
  <figure>
    <svg width="320" height="320" viewBox="0 -1024 1024 1024">
      <path d="${bake.svgPath}" fill="#111" fill-rule="evenodd"/>
    </svg>
    <figcaption><b>${style.zh} — ${style.pinyin} (${style.gloss})</b><br>${style.note}</figcaption>
  </figure>`)
  .join("");
const oraclePaths = oracle.strokes
  .map((d) => `<path d="${d}" fill="#2563eb" fill-opacity="0.45"/>`)
  .join("");

// Animation frames: quarter-stroke steps through the whole character.
const frames = [];
const labels = [];
for (let s = 0; s < yong.strokes.length; s++) {
  const form = FORMS[yong.strokes[s].form];
  const segs = yong.strokes[s].segments
    .map((g) => (g.bafa ? `${g.bafa} ${FORMS[g.form].zh}` : FORMS[g.form].zh))
    .join(" · ");
  for (const f of [0.25, 0.5, 0.75, 1]) {
    frames.push(bakeCharacterPartial(yong, s + f).svgPath);
    labels.push(`第${s + 1}笔 — ${form.zh} ${form.pinyin} (${form.gloss}) — ${segs}`);
  }
}

const framePaths = frames
  .map((d, i) => `<path class="frame" data-i="${i}" d="${d}" fill="#111"/>`)
  .join("");
const strokeRows = yong.strokes
  .map((s, i) => {
    const form = FORMS[s.form];
    const segs = s.segments
      .map((g) => `${g.bafa ?? ""} ${FORMS[g.form].zh} (${FORMS[g.form].gloss})`)
      .join(", ");
    return `<tr><td>${i + 1}</td><td>${form.zh}</td><td>${form.pinyin}</td><td>${form.gloss}</td><td>${segs}</td><td>${s.provenance}</td></tr>`;
  })
  .join("");

// Core svgPaths already carry negated y (SVG orientation); MMH oracle
// paths are raw y-up data and need the scale(1 -1) flip into the same
// space. Both panels use viewBox "0 -1024 1024 1024".
const flip = `transform="scale(1 -1)"`;
const html = `<!doctype html>
<meta charset="utf-8">
<title>Bihua F1 — 永 pilot</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; color: #111; background: #fafafa; }
  .row { display: flex; gap: 24px; flex-wrap: wrap; }
  figure { margin: 0; }
  figcaption { font-size: 13px; color: #444; margin-top: 6px; max-width: 320px; }
  svg { background: #fff; border: 1px solid #ddd; }
  .frame { display: none; } .frame.on { display: block; }
  #label { font-size: 15px; margin-top: 8px; min-height: 20px; }
  table { border-collapse: collapse; margin-top: 20px; font-size: 14px; }
  td, th { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
  button { font-size: 14px; padding: 4px 12px; margin-top: 8px; }
</style>
<h1>Bihua Foundation — F1 pilot: 永 (yǒng, “forever”)</h1>
<p>Written from the bihua record: named strokes, authored pressure, round brush.
Measured IoU vs the Make Me a Hanzi outline: <b>0.734</b> (scripts/bihua-yong-diff.mjs) —
the disc-tip variant scored 0.750 by resembling print; brush truth was chosen over the number.</p>
<div class="row">
  <figure>
    <svg width="320" height="320" viewBox="0 -1024 1024 1024">
      <g fill-rule="evenodd">${framePaths}</g>
    </svg>
    <div id="label"></div>
    <button id="replay">↻ Replay 笔顺</button>
    <figcaption>Stroke-order animation from the partial-sweep renderer.
    Each frame is the character baked up to that point of its 笔顺.</figcaption>
  </figure>
  <figure>
    <svg width="320" height="320" viewBox="0 -1024 1024 1024">
      <path d="${full.svgPath}" fill="#dc2626" fill-opacity="0.5" fill-rule="evenodd"/><g ${flip}>${oraclePaths}</g>
    </svg>
    <figcaption>Overlay: our brush-written 永 in red, the outline-database 永
    (Make Me a Hanzi) in blue. The shapes agree; the differences are the
    printed form's wedges and flat feet vs a round brush's entries and exits.</figcaption>
  </figure>
  <figure>
    <svg width="320" height="320" viewBox="0 -1024 1024 1024">
      <path d="${full.svgPath}" fill="#111" fill-rule="evenodd"/>
    </svg>
    <figcaption>The finished character, baked by the existing core
    (spine → brush stamps → union) from the bihua record alone.</figcaption>
  </figure>
</div>
<h2>田字格 analysis — 永</h2>
<div class="row">
  <figure>
    <svg width="320" height="320" viewBox="0 -1024 1024 1024">
      <rect x="0" y="-1024" width="1024" height="1024" fill="none" stroke="#bbb"/>
      <line x1="512" y1="-1024" x2="512" y2="0" stroke="#bbb"/>
      <line x1="0" y1="-512" x2="1024" y2="-512" stroke="#bbb"/>
      <line x1="0" y1="-1024" x2="1024" y2="0" stroke="#ddd" stroke-dasharray="10 10"/>
      <line x1="0" y1="0" x2="1024" y2="-1024" stroke="#ddd" stroke-dasharray="10 10"/>
      <path d="${full.svgPath}" fill="#111" fill-opacity="0.85" fill-rule="evenodd"/>
      <circle cx="${yongGrid.centroid.x}" cy="${-yongGrid.centroid.y}" r="16" fill="#dc2626"/>
    </svg>
    <figcaption>The 田字格 (practice grid): midlines quarter the square, diagonals complete the 米字 form.
    Red dot: the ink's centroid. Against the outline reference — centroid distance
    ${yongDelta.centroidDistance.toFixed(0)} units, quadrant-share difference at most
    ${yongDelta.quadrantShareDelta.toFixed(3)}, ink area ratio ${yongDelta.areaRatio.toFixed(2)}.
    Accuracy argued from the grid, not from an eye.</figcaption>
  </figure>
  <figure>
    <svg width="320" height="320" viewBox="0 -1024 1024 1024">
      <path d="${linBake.svgPath}" fill="#dc2626" fill-opacity="0.5" fill-rule="evenodd"/><g transform="scale(1 -1)">${linOraclePaths}</g>
    </svg>
    <figcaption><b>林 (lín, “forest”) — assembled, not authored:</b> the stored 木 component placed twice
    (squeezed to 0.60×/0.66× width), the left one carrying the na-becomes-dian variant.
    IoU ${linIou.iou.toFixed(3)} vs the outline 林 (blue) — but centroid distance only
    ${linDelta.centroidDistance.toFixed(0)} units and quadrant shares within ${linDelta.quadrantShareDelta.toFixed(3)}:
    reuse transfers balance, not exact silhouettes. See docs/BIHUA.md, “Components”.</figcaption>
  </figure>
</div>
<h2>One record, four renditions</h2>
<p>The same 永 record — same spines, same pressure profile — drawn by each style in
<code>src/bihua/styles.ts</code>. The record carries no style; rendition is a tool choice,
as modern Chinese draws the same character with brush, flat brush, ballpoint, or as 黑体 type.</p>
<div class="row">${stylePanels}</div>
<table>
  <tr><th>#</th><th>笔形</th><th>pinyin</th><th>gloss</th><th>八法 segments</th><th>spine provenance</th></tr>
  ${strokeRows}
</table>
<p style="font-size:13px;color:#555">Spines fitted from Make Me a Hanzi medians
(hanzi-writer-data 2.0.1, Arphic Public License); pressure and segment mapping authored.
Default brush: 毛笔 pointed tip, patch length 114 grid units, tip lag 0.55 at turns.</p>
<script>
  const frames = [...document.querySelectorAll('.frame')];
  const labels = ${JSON.stringify(labels)};
  const label = document.getElementById('label');
  let timer = null;
  function play() {
    let i = 0;
    clearInterval(timer);
    timer = setInterval(() => {
      frames.forEach((f, j) => f.classList.toggle('on', j === i));
      label.textContent = labels[i] ?? '';
      i++;
      if (i >= frames.length) clearInterval(timer);
    }, 260);
  }
  document.getElementById('replay').onclick = play;
  play();
</script>
`;
writeFileSync(new URL("../demo/bihua-yong.html", import.meta.url), html);

// PNG of the finished character for chat/report use.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 -1024 1024 1024"><rect x="0" y="-1024" width="1024" height="1024" fill="white"/><path d="${full.svgPath}" fill="#111" fill-rule="evenodd"/></svg>`;
const png = new Resvg(svg, { fitTo: { mode: "width", value: 512 } }).render().asPng();
writeFileSync(new URL("../demo/bihua-yong.png", import.meta.url), png);

// Four-up strip of the styles for reports.
const cell = 1024;
const stripSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cell * 4}" height="${cell}" viewBox="0 -1024 ${cell * 4} 1024"><rect x="0" y="-1024" width="${cell * 4}" height="1024" fill="white"/>` +
  styleBakes.map(({ bake }, i) => `<g transform="translate(${i * cell} 0)"><path d="${bake.svgPath}" fill="#111" fill-rule="evenodd"/></g>`).join("") +
  `</svg>`;
const stripPng = new Resvg(stripSvg, { fitTo: { mode: "width", value: 1400 } }).render().asPng();
writeFileSync(new URL("../demo/bihua-yong-styles.png", import.meta.url), stripPng);
console.log("wrote demo/bihua-yong.html, demo/bihua-yong.png and demo/bihua-yong-styles.png");
