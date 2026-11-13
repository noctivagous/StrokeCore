/**
 * FIELD-INK PILOT — is a metaball-style field a better FUSION than the
 * polygon union for brush ink at a corner?
 *
 * The question the pilot isolates: both bakes start from the SAME tip
 * stamps (the exact polygons bakeStroke stamps along 永's 横折钩 in the
 * maobi style). The production bake unions them (plus strip quads); the
 * pilot instead gives each stamp an anisotropic (elliptical) Wyvill
 * kernel, SUMS the field on a 4-unit grid, and takes the iso-contour by
 * marching squares — the grid-paint-labs / NCTGraphite approach, with
 * the one change a brush forces: the kernel is an oriented ellipse
 * fitted to the tip, not a circle.
 *
 * Summation is the point: where the brush turns and stamps pile up, the
 * field pools — the corner fills by arithmetic, not by layering.
 *
 * Calibration: one free parameter, a global kernel scale s, chosen so
 * the field contour's width on the straight horizontal run matches the
 * union bake's width there. Everything at the corner is then prediction,
 * not fit. Scores use the analytical engine's own measures against the
 * MMH oracle stroke: IoU, boundary distance, width-profile RMSE, and
 * the corner ink-disc ratio (disc radius 72 at the corner node).
 *
 * Run: node scripts/bihua-field-pilot.mjs [--dump=/tmp/field-pilot.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import polygonClipping from "polygon-clipping";
import { multiPolygonArea, resolveTipState } from "../dist/bake.js";
import { yong } from "../dist/bihua/characters/yong.js";
import { maobiStyle } from "../dist/bihua/styles.js";
import { bakeBihuaStroke } from "../dist/bihua/render.js";
import { oracleInk, boundaryDistance, widthProfile, inkWidthAt } from "../dist/bihua/analyze.js";

const STROKE_INDEX = 1; // 横折钩 — the corner stroke
const CELL = 4;
const TAU = 0.4;
const DISC_R = 72;

const record = yong.strokes[STROKE_INDEX];
const bake = bakeBihuaStroke(record, "field-pilot", maobiStyle);
const unionInk = bake.outline;
const stamps = bake.tips;

const mmh = JSON.parse(
  readFileSync(new URL("./fixtures/hanzi-writer/永.json", import.meta.url), "utf8"),
);
const oracle = oracleInk(mmh).perStroke[STROKE_INDEX];

// ---------- stamp -> oriented ellipse (2nd moments of the tip polygon) ----------
function ellipseOf(poly) {
  const n = poly.length;
  let cx = 0, cy = 0;
  for (const p of poly) { cx += p.x; cy += p.y; }
  cx /= n; cy /= n;
  let cxx = 0, cyy = 0, cxy = 0;
  for (const p of poly) {
    const dx = p.x - cx, dy = p.y - cy;
    cxx += dx * dx; cyy += dy * dy; cxy += dx * dy;
  }
  cxx /= n; cyy /= n; cxy /= n;
  const mean = (cxx + cyy) / 2;
  const dev = Math.sqrt(Math.max(0, ((cxx - cyy) / 2) ** 2 + cxy * cxy));
  const l1 = mean + dev, l2 = Math.max(1, mean - dev);
  const theta = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
  // Vertices sit ON the boundary: for an ellipse E[x^2] = a^2/2 along the axis.
  return { cx, cy, a: Math.sqrt(2 * l1), b: Math.sqrt(2 * l2), cos: Math.cos(theta), sin: Math.sin(theta) };
}
const ellipses = stamps.map(ellipseOf);

// Optional pressure weighting (--weight=pressure): a pressed stamp pools
// more ink than a lifted one — amplitude 0.55 + 0.45p per stamp.
const WEIGHT_PRESSURE = process.argv.includes("--weight=pressure");
if (WEIGHT_PRESSURE) {
  const styled = maobiStyle.stroke(record, "field-pilot");
  bake.samples.forEach((s, i) => {
    ellipses[i].w = 0.55 + 0.45 * resolveTipState(styled, s).pressure;
  });
}

// ---------- field ----------
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const e of ellipses) {
  const r = e.a + 8;
  minX = Math.min(minX, e.cx - r); maxX = Math.max(maxX, e.cx + r);
  minY = Math.min(minY, e.cy - r); maxY = Math.max(maxY, e.cy + r);
}
const W = Math.ceil((maxX - minX) / CELL) + 1;
const H = Math.ceil((maxY - minY) / CELL) + 1;

function buildField(scale) {
  const F = new Float32Array(W * H);
  for (const e of ellipses) {
    const a = e.a * scale, b = e.b * scale;
    const i0 = Math.max(0, Math.floor((e.cx - a - minX) / CELL));
    const i1 = Math.min(W - 1, Math.ceil((e.cx + a - minX) / CELL));
    const j0 = Math.max(0, Math.floor((e.cy - a - minY) / CELL));
    const j1 = Math.min(H - 1, Math.ceil((e.cy + a - minY) / CELL));
    for (let j = j0; j <= j1; j++) {
      const y = minY + j * CELL;
      for (let i = i0; i <= i1; i++) {
        const x = minX + i * CELL;
        const dx = x - e.cx, dy = y - e.cy;
        const u = (dx * e.cos + dy * e.sin) / a;
        const v = (-dx * e.sin + dy * e.cos) / b;
        const d2 = u * u + v * v;
        if (d2 < 1) {
          const t = 1 - d2;
          F[j * W + i] += (e.w ?? 1) * t * t * t;
        }
      }
    }
  }
  return F;
}

/** Width of the field contour across the spine at arc fraction t (scan the grid). */
function fieldWidthAt(F, spine, t) {
  const total = spine.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - spine[i].x, p.y - spine[i].y), 0);
  let target = total * t, px = spine[0].x, py = spine[0].y, tx = 1, ty = 0;
  for (let i = 1; i < spine.length; i++) {
    const len = Math.hypot(spine[i].x - spine[i - 1].x, spine[i].y - spine[i - 1].y);
    if (target <= len) {
      const f = len === 0 ? 0 : target / len;
      px = spine[i - 1].x + (spine[i].x - spine[i - 1].x) * f;
      py = spine[i - 1].y + (spine[i].y - spine[i - 1].y) * f;
      tx = (spine[i].x - spine[i - 1].x) / (len || 1);
      ty = (spine[i].y - spine[i - 1].y) / (len || 1);
      break;
    }
    target -= len;
  }
  const nx = -ty, ny = tx;
  let lo = null, hi = null;
  for (let s = -300; s <= 300; s += 2) {
    const x = px + nx * s, y = py + ny * s;
    const i = Math.round((x - minX) / CELL), j = Math.round((y - minY) / CELL);
    if (i < 0 || j < 0 || i >= W || j >= H) continue;
    if (F[j * W + i] >= TAU) { if (lo === null) lo = s; hi = s; }
  }
  return lo === null ? 0 : hi - lo;
}

// ---------- marching squares ----------
function marchingSquares(F) {
  const segs = [];
  const lerpPt = (x1, y1, v1, x2, y2, v2) => {
    const t = (TAU - v1) / (v2 - v1 || 1e-9);
    return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  };
  for (let j = 0; j < H - 1; j++) {
    for (let i = 0; i < W - 1; i++) {
      const x = minX + i * CELL, y = minY + j * CELL;
      const v00 = F[j * W + i], v10 = F[j * W + i + 1], v01 = F[(j + 1) * W + i], v11 = F[(j + 1) * W + i + 1];
      const idx = (v00 >= TAU ? 1 : 0) | (v10 >= TAU ? 2 : 0) | (v11 >= TAU ? 4 : 0) | (v01 >= TAU ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const B = () => lerpPt(x, y, v00, x + CELL, y, v10);
      const R = () => lerpPt(x + CELL, y, v10, x + CELL, y + CELL, v11);
      const T = () => lerpPt(x, y + CELL, v01, x + CELL, y + CELL, v11);
      const L = () => lerpPt(x, y, v00, x, y + CELL, v01);
      const table = {
        1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[R, T]], 6: [[B, T]],
        7: [[L, T]], 8: [[T, L]], 9: [[T, B]], 11: [[R, T]], 12: [[R, L]],
        13: [[B, R]], 14: [[L, B]],
      };
      let pairs = table[idx];
      if (idx === 5) pairs = (v00 + v10 + v11 + v01) / 4 >= TAU ? [[L, T], [B, R]] : [[L, B], [R, T]];
      if (idx === 10) pairs = (v00 + v10 + v11 + v01) / 4 >= TAU ? [[L, B], [R, T]] : [[L, T], [B, R]];
      if (!pairs) continue;
      for (const [p, q] of pairs) segs.push([p(), q()]);
    }
  }
  // Join segments into rings by shared endpoints.
  const key = (p) => `${Math.round(p[0] * 50)},${Math.round(p[1] * 50)}`;
  const byEnd = new Map();
  segs.forEach((s, i) => {
    for (const p of s) {
      const k = key(p);
      if (!byEnd.has(k)) byEnd.set(k, []);
      byEnd.get(k).push(i);
    }
  });
  const used = new Array(segs.length).fill(false);
  const rings = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const ring = [segs[i][0], segs[i][1]];
    for (;;) {
      const tail = ring[ring.length - 1];
      const next = (byEnd.get(key(tail)) ?? []).find((si) => !used[si]);
      if (next === undefined) break;
      used[next] = true;
      const s = segs[next];
      const other = key(s[0]) === key(tail) ? s[1] : s[0];
      ring.push(other);
      if (key(other) === key(ring[0])) break;
    }
    if (ring.length > 8) rings.push(ring);
  }
  return rings.map((ring) => [ring]) ;
}

// ---------- calibrate scale on the straight run, then extract ----------
const spinePts = record.spine;
const targetWidth = inkWidthAt(unionInk, spinePts, 0.22);
let lo = 0.8, hi = 1.8, scale = 1.2;
for (let iter = 0; iter < 16; iter++) {
  scale = (lo + hi) / 2;
  const w = fieldWidthAt(buildField(scale), spinePts, 0.22);
  if (w < targetWidth) lo = scale; else hi = scale;
}
const F = buildField(scale);
const fieldInk = marchingSquares(F);
const calibWidth = fieldWidthAt(F, spinePts, 0.22);

// ---------- scores ----------
function iou(a, b) {
  const inter = multiPolygonArea(polygonClipping.intersection(a, b));
  const uni = multiPolygonArea(polygonClipping.union(a, b));
  return uni === 0 ? 0 : inter / uni;
}
function discArea(ink, c) {
  const ring = [];
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    ring.push([c.x + DISC_R * Math.cos(a), c.y + DISC_R * Math.sin(a)]);
  }
  ring.push(ring[0]);
  return multiPolygonArea(polygonClipping.intersection(ink, [[ring]]));
}
function profileRmse(a, b) {
  const pa = widthProfile(a, spinePts), pb = widthProfile(b, spinePts);
  const mean = pb.reduce((s, v) => s + v, 0) / pb.length || 1;
  return Math.sqrt(pa.reduce((s, v, i) => s + ((v - pb[i]) / mean) ** 2, 0) / pa.length);
}
// Corner node: the record node with the sharpest turn.
let corner = record.spine[1], bestTurn = -1;
for (let i = 1; i < record.spine.length - 1; i++) {
  const a = record.spine[i - 1], b = record.spine[i], c = record.spine[i + 1];
  const v1 = Math.atan2(b.y - a.y, b.x - a.x), v2 = Math.atan2(c.y - b.y, c.x - b.x);
  let d = Math.abs(v2 - v1) * (180 / Math.PI);
  if (d > 180) d = 360 - d;
  if (d > bestTurn) { bestTurn = d; corner = b; }
}
const oracleDisc = discArea(oracle, corner);

const rows = [
  ["union (production)", unionInk],
  ["field (pilot)", fieldInk],
].map(([name, ink]) => ({
  name,
  iouVsOracle: +iou(ink, oracle).toFixed(3),
  cornerDiscRatio: +(discArea(ink, corner) / oracleDisc).toFixed(3),
  boundaryMeanP95: boundaryDistance(ink, oracle),
  widthRmse: +profileRmse(ink, oracle).toFixed(3),
  area: Math.round(multiPolygonArea(ink)),
}));

console.log(`stamps: ${stamps.length}, grid ${W}x${H} @ ${CELL}u, tau ${TAU}`);
console.log(`calibration: scale ${scale.toFixed(3)} -> straight-run width ${calibWidth} (union ${targetWidth})`);
console.log(`corner node: (${corner.x}, ${corner.y}), turn ${bestTurn.toFixed(0)} deg, oracle disc ink ${Math.round(oracleDisc)}`);
for (const r of rows) console.log(JSON.stringify(r));
console.log(`mutual IoU union-vs-field: ${iou(unionInk, fieldInk).toFixed(3)}`);

const dumpArg = process.argv.find((a) => a.startsWith("--dump="));
if (dumpArg) {
  writeFileSync(dumpArg.slice(7), JSON.stringify({ unionInk, fieldInk, oracle, corner, discR: DISC_R }));
  console.log(`dumped ${dumpArg.slice(7)}`);
}
