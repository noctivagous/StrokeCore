// Overlay diff for the F1 pilot: bake 永 from the bihua record and
// compare (IoU) against the Make Me a Hanzi outline oracle.
// Oracle data: scripts/bihua-oracle-yong.json — hanzi-writer-data
// 2.0.1 (Make Me a Hanzi, Arphic Public License), the same file
// HanJian's CDN fallback serves for 永.
//
// Usage: node scripts/bihua-yong-diff.mjs [--widths 120,150,180]
// Prints one line per brush width tried; the record's default width
// is the one src/bihua/brush.ts exports.

import { readFileSync } from "node:fs";
import polygonClipping from "polygon-clipping";
import { bakeBihuaStroke, bakeCharacter, maobiStyle, maobiStyleWithWidth, yong } from "../dist/bihua/index.js";
import { multiPolygonArea } from "../dist/index.js";

const oracle = JSON.parse(
  readFileSync(new URL("./bihua-oracle-yong.json", import.meta.url), "utf8"),
);

// --- minimal SVG path flattener (M/L/Q/C/Z, as used by MMH data) ---
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
      for (let s = 1; s <= steps; s++) {
        const t = s / steps, u = 1 - t;
        ring.push([
          u * u * cur[0] + 2 * u * t * c[0] + t * t * to[0],
          u * u * cur[1] + 2 * u * t * c[1] + t * t * to[1],
        ]);
      }
      cur = to;
    } else if (cmd === "C") {
      const c1 = [num(), num()]; const c2 = [num(), num()]; const to = [num(), num()];
      for (let s = 1; s <= steps; s++) {
        const t = s / steps, u = 1 - t;
        ring.push([
          u ** 3 * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * to[0],
          u ** 3 * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * to[1],
        ]);
      }
      cur = to;
    } else if (cmd === "Z") { if (start) ring.push(start); }
  }
  return [ring];
}

const oraclePolys = oracle.strokes.map((d) => flattenPath(d));
const oracleInk = polygonClipping.union(...oraclePolys);
const oracleArea = multiPolygonArea(oracleInk);

const widthsArg = process.argv.find((a) => a.startsWith("--widths="));
const widths = widthsArg
  ? widthsArg.slice("--widths=".length).split(",").map(Number)
  : [undefined];

for (const w of widths) {
  const tool = w ? maobiStyleWithWidth(w) : maobiStyle;
  const bake = bakeCharacter(yong, tool);
  const inter = polygonClipping.intersection(bake.fused, oracleInk);
  const union = polygonClipping.union(bake.fused, oracleInk);
  const iou = multiPolygonArea(inter) / multiPolygonArea(union);
  console.log(
    `width=${w ?? "default"}  ours=${Math.round(bake.area)}  oracle=${Math.round(oracleArea)}  IoU=${iou.toFixed(4)}`,
  );
}

if (process.argv.includes("--per-stroke")) {
  const w = widths[0];
  const tool = w ? maobiStyleWithWidth(w) : maobiStyle;
  yong.strokes.forEach((s, i) => {
    const ours = bakeBihuaStroke(s, `s${i + 1}`, tool).outline;
    const theirs = oraclePolys[i];
    const inter = polygonClipping.intersection(ours, theirs);
    const union = polygonClipping.union(ours, theirs);
    const iou = multiPolygonArea(inter) / multiPolygonArea(union);
    console.log(
      `  stroke ${i + 1} ${s.form}: ours=${Math.round(multiPolygonArea(ours))} oracle=${Math.round(multiPolygonArea([theirs]))} IoU=${iou.toFixed(4)}`,
    );
  });
}
