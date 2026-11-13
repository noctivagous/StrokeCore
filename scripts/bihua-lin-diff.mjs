// Reuse test: 林 assembled from the stored 木 component (×2, placed
// and variant-ruled) vs 林's Make Me a Hanzi outline oracle.
// Oracle: scripts/bihua-oracle-lin.json (hanzi-writer-data 2.0.1).
//
// Usage: node scripts/bihua-lin-diff.mjs

import { readFileSync } from "node:fs";
import polygonClipping from "polygon-clipping";
import { analyzeGrid, bakeCharacter, gridDelta, lin } from "../dist/bihua/index.js";
import { multiPolygonArea } from "../dist/index.js";

const oracle = JSON.parse(
  readFileSync(new URL("./bihua-oracle-lin.json", import.meta.url), "utf8"),
);

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
        ring.push([u * u * cur[0] + 2 * u * t * c[0] + t * t * to[0], u * u * cur[1] + 2 * u * t * c[1] + t * t * to[1]]);
      }
      cur = to;
    } else if (cmd === "C") {
      const c1 = [num(), num()]; const c2 = [num(), num()]; const to = [num(), num()];
      for (let s = 1; s <= steps; s++) {
        const t = s / steps, u = 1 - t;
        ring.push([u ** 3 * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * to[0], u ** 3 * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * to[1]]);
      }
      cur = to;
    } else if (cmd === "Z") { if (start) ring.push(start); }
  }
  return [ring];
}

const oracleInk = polygonClipping.union(...oracle.strokes.map((d) => flattenPath(d)));
const bake = bakeCharacter(lin);
const inter = polygonClipping.intersection(bake.fused, oracleInk);
const union = polygonClipping.union(bake.fused, oracleInk);
const iou = multiPolygonArea(inter) / multiPolygonArea(union);
console.log(
  `assembled 林: ours=${Math.round(bake.area)} oracle=${Math.round(multiPolygonArea(oracleInk))} IoU=${iou.toFixed(4)}`,
);
const ours = analyzeGrid(bake.fused, 1024);
const theirs = analyzeGrid(oracleInk, 1024);
const d = gridDelta(ours, theirs);
console.log(
  `grid: centroid ours=(${Math.round(ours.centroid.x)},${Math.round(ours.centroid.y)}) oracle=(${Math.round(theirs.centroid.x)},${Math.round(theirs.centroid.y)}) distance=${d.centroidDistance.toFixed(1)} quadrant Δmax=${d.quadrantShareDelta.toFixed(3)} areaRatio=${d.areaRatio.toFixed(3)}`,
);
