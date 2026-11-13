// Analytical test engine: examine rendered ink in several distinct
// ways against a ground-truth example, instead of resting quality
// on one overlay number or one pair of eyes.
//
// The ground truth is a Make Me a Hanzi character file: per-stroke
// outline paths (the printed silhouette) + medians. The candidate is
// any Bihua record baked in any style. Measures, each aimed at a
// different way ink can be wrong:
//
//  - IoU, whole and per stroke — silhouette agreement.
//  - 田字格 grid delta (grid.ts) — whole-character balance.
//  - Width profiles — ink width across the spine at 12 arc
//    fractions, candidate vs oracle measured around the SAME
//    centreline; summarised as normalised RMSE plus entry/exit
//    taper-ratio deltas. This is the measure that sees "the flat
//    brush does not taper" and "the 捺 foot is too round".
//  - Corner reports — for each detected corner: how much ink sits
//    in a disc around the corner (candidate vs oracle). This is the
//    measure that sees "joints look like overlapped strokes". (A
//    spine-overshoot diagnostic is also reported, but kept OUT of
//    the verdict: it conflates a turn's natural radius with a true
//    bulge, while the ink ratio measures what the eye actually
//    objected to.)
//  - Boundary distance — mean / p95 distance between the two
//    outlines' boundaries, both ways. Sees placement drift that
//    area measures forgive.
//
// Verdict bands are constants below, calibrated on the F2 batch
// (IoU 0.63–0.79 for honest fitted drafts) — they are a starting
// calibration, stated so they can be argued with.

import polygonClipping from "polygon-clipping";
import type { MultiPolygon, Pt } from "../types.js";
import { multiPolygonArea } from "../bake.js";
import type { MmhCharData } from "./convert.js";
import { analyzeMedian } from "./convert.js";
import { analyzeGrid, gridDelta } from "./grid.js";

type GridDelta = ReturnType<typeof gridDelta>;
import { bakeBihuaStroke, bakeCharacter } from "./render.js";
import { smoothSpine } from "./brush.js";
import { maobiStyle, type BihuaStyle } from "./styles.js";
import type { BihuaCharacter } from "./types.js";

export type Band = "ok" | "warn" | "fail";
export const BANDS = {
  iouOk: 0.7, iouWarn: 0.6,
  centroidOk: 35, centroidWarn: 60,
  widthRmseOk: 0.22, widthRmseWarn: 0.35,
  cornerRatioLo: 0.75, cornerRatioHi: 1.33, cornerRatioWarnLo: 0.6, cornerRatioWarnHi: 1.6,
  overshootOk: 6, overshootWarn: 14,
  boundaryOk: 12, boundaryWarn: 22,
} as const;

const band = (v: number, ok: number, warn: number, invert = false): Band => {
  if (!invert) return v >= ok ? "ok" : v >= warn ? "warn" : "fail";
  return v <= ok ? "ok" : v <= warn ? "warn" : "fail";
};
const worst = (bands: Band[]): Band =>
  bands.includes("fail") ? "fail" : bands.includes("warn") ? "warn" : "ok";

/** Flatten one MMH SVG outline path (M/L/Q/C/Z) into rings of points. */
export function flattenMmhPath(d: string, steps = 20): Pt[][] {
  const tokens = d.match(/[MLQCZ]|-?\d*\.?\d+/g) ?? [];
  let i = 0, cmd = "", cur: Pt = { x: 0, y: 0 }, start: Pt | null = null;
  const ring: Pt[] = [];
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[MLQCZ]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === "M") { cur = { x: num(), y: num() }; start = cur; ring.push(cur); cmd = "L"; }
    else if (cmd === "L") { cur = { x: num(), y: num() }; ring.push(cur); }
    else if (cmd === "Q") {
      const c = { x: num(), y: num() }; const to = { x: num(), y: num() };
      for (let s = 1; s <= steps; s++) {
        const t = s / steps, u = 1 - t;
        ring.push({
          x: u * u * cur.x + 2 * u * t * c.x + t * t * to.x,
          y: u * u * cur.y + 2 * u * t * c.y + t * t * to.y,
        });
      }
      cur = to;
    } else if (cmd === "C") {
      const c1 = { x: num(), y: num() }; const c2 = { x: num(), y: num() }; const to = { x: num(), y: num() };
      for (let s = 1; s <= steps; s++) {
        const t = s / steps, u = 1 - t;
        ring.push({
          x: u ** 3 * cur.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * to.x,
          y: u ** 3 * cur.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * to.y,
        });
      }
      cur = to;
    } else if (cmd === "Z") { if (start) ring.push(start); }
  }
  return [ring];
}

export interface OracleInk {
  perStroke: MultiPolygon[];
  fused: MultiPolygon;
}

export function oracleInk(data: MmhCharData): OracleInk {
  const perStroke = data.strokes.map(
    (d) =>
      [flattenMmhPath(d).map((ring) => ring.map((p) => [p.x, p.y] as [number, number]))] as MultiPolygon,
  );
  const fused = perStroke.length ? polygonClipping.union(perStroke[0], ...perStroke.slice(1)) : [];
  return { perStroke, fused };
}

function iouOf(a: MultiPolygon, b: MultiPolygon): number {
  if (!a.length || !b.length) return 0;
  const inter = multiPolygonArea(polygonClipping.intersection(a, b));
  const union = multiPolygonArea(polygonClipping.union(a, b));
  return union === 0 ? 0 : inter / union;
}

// --- width profiles ---

const PROFILE_TS = [0.06, 0.14, 0.22, 0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78, 0.86, 0.94];

function spineFrame(spine: Pt[]): { cum: number[]; total: number } {
  const cum = [0];
  for (let i = 1; i < spine.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(spine[i].x - spine[i - 1].x, spine[i].y - spine[i - 1].y));
  }
  return { cum, total: cum[cum.length - 1] || 1 };
}

function pointAt(spine: Pt[], cum: number[], target: number): { p: Pt; tangent: Pt } {
  let i = 0;
  while (i < cum.length - 2 && cum[i + 1] < target) i++;
  const segLen = cum[i + 1] - cum[i] || 1;
  const f = Math.min(1, Math.max(0, (target - cum[i]) / segLen));
  const a = spine[i], b = spine[i + 1];
  const p = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { p, tangent: { x: (b.x - a.x) / len, y: (b.y - a.y) / len } };
}

/** Ink width across the spine at arc fraction t, via a thin sliver clip. */
export function inkWidthAt(ink: MultiPolygon, spine: Pt[], t: number): number {
  const { cum, total } = spineFrame(spine);
  const { p, tangent } = pointAt(spine, cum, t * total);
  const across = { x: -tangent.y, y: tangent.x };
  const L = 9; // sliver length along the spine
  const W = 460; // sliver extent across (beyond any stroke width)
  const c = [
    { x: p.x - tangent.x * L / 2 - across.x * W / 2, y: p.y - tangent.y * L / 2 - across.y * W / 2 },
    { x: p.x + tangent.x * L / 2 - across.x * W / 2, y: p.y + tangent.y * L / 2 - across.y * W / 2 },
    { x: p.x + tangent.x * L / 2 + across.x * W / 2, y: p.y + tangent.y * L / 2 + across.y * W / 2 },
    { x: p.x - tangent.x * L / 2 + across.x * W / 2, y: p.y - tangent.y * L / 2 + across.y * W / 2 },
  ];
  const sliver = [[[...c, c[0]].map((q) => [q.x, q.y])]] as unknown as MultiPolygon;
  const area = multiPolygonArea(polygonClipping.intersection(ink, sliver));
  return area / L;
}

export function widthProfile(ink: MultiPolygon, spine: Pt[]): number[] {
  return PROFILE_TS.map((t) => inkWidthAt(ink, spine, t));
}

// --- corners ---

/**
 * How far the smoothed spine strays past a sharp corner, measured
 * against the plane through the corner perpendicular to the travel
 * direction INTO it (from the previous key point — the adjacent raw
 * node is too close to give a true heading). Only meaningful for
 * sharp corners: a curve's bow is not an overshoot.
 */
export function spineOvershoot(spine: Pt[], cornerIndex: number, prevKeyIndex: number): number {
  const s = smoothSpine(spine);
  const corner = spine[cornerIndex];
  const prev = spine[prevKeyIndex];
  const inLen = Math.hypot(corner.x - prev.x, corner.y - prev.y) || 1;
  const u = { x: (corner.x - prev.x) / inLen, y: (corner.y - prev.y) / inLen };
  let max = 0;
  // Sample the two segments adjacent to the corner node.
  for (const segI of [cornerIndex - 1, cornerIndex]) {
    const seg = s.segments[segI];
    if (!seg || seg.kind !== "cubic") continue;
    const p0 = s.nodes[segI], p1 = s.nodes[segI + 1];
    for (let k = 0; k <= 30; k++) {
      const t = k / 30, w = 1 - t;
      const x = w ** 3 * p0.x + 3 * w * w * t * seg.c1.x + 3 * w * t * t * seg.c2.x + t ** 3 * p1.x;
      const y = w ** 3 * p0.y + 3 * w * w * t * seg.c1.y + 3 * w * t * t * seg.c2.y + t ** 3 * p1.y;
      const past = (x - corner.x) * u.x + (y - corner.y) * u.y;
      if (past > max) max = past;
    }
  }
  return max;
}

function discInkRatio(cand: MultiPolygon, oracle: MultiPolygon, centre: Pt, r: number): number {
  const ring: [number, number][] = [];
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2;
    ring.push([centre.x + r * Math.cos(a), centre.y + r * Math.sin(a)]);
  }
  ring.push(ring[0]);
  const disc = [[ring]] as unknown as MultiPolygon;
  const ca = multiPolygonArea(polygonClipping.intersection(cand, disc));
  const oa = multiPolygonArea(polygonClipping.intersection(oracle, disc));
  return oa === 0 ? 1 : ca / oa;
}

// --- boundary distance ---

function pointSegDist(p: Pt, a: Pt, b: Pt): number {
  const vx = b.x - a.x, vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2));
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

function pointInRing(p: Pt, ring: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].x, yi = ring[i].y, xj = ring[j].x, yj = ring[j].y;
    if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointToInk(p: Pt, ink: MultiPolygon): number {
  let best = Infinity;
  for (const poly of ink) {
    for (const ring of poly) {
      const pts = ring.map(([x, y]) => ({ x, y }));
      if (pointInRing(p, pts)) return 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const d = pointSegDist(p, pts[i], pts[i + 1]);
        if (d < best) best = d;
      }
    }
  }
  return best;
}

function sampleBoundary(ink: MultiPolygon, spacing = 14): Pt[] {
  const out: Pt[] = [];
  for (const poly of ink) {
    for (const ring of poly) {
      const pts = ring.map(([x, y]) => ({ x, y }));
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const n = Math.max(1, Math.floor(len / spacing));
        for (let k = 0; k < n; k++) out.push({ x: a.x + (b.x - a.x) * (k / n), y: a.y + (b.y - a.y) * (k / n) });
      }
    }
  }
  return out;
}

export function boundaryDistance(a: MultiPolygon, b: MultiPolygon): { mean: number; p95: number } {
  const ds: number[] = [];
  for (const p of sampleBoundary(a)) ds.push(pointToInk(p, b));
  for (const p of sampleBoundary(b)) ds.push(pointToInk(p, a));
  if (!ds.length) return { mean: 0, p95: 0 };
  ds.sort((m, n) => m - n);
  const mean = ds.reduce((s, v) => s + v, 0) / ds.length;
  return { mean, p95: ds[Math.min(ds.length - 1, Math.floor(ds.length * 0.95))] };
}

// --- scorecard ---

export interface StrokeScore {
  form: string;
  iou: number;
  widthRmse: number;
  entryTaperDelta: number;
  exitTaperDelta: number;
  cornerInkRatios: number[];
  spineOvershoot: number;
  verdict: Band;
}

export interface CharacterScore {
  char: string;
  styleId: string;
  iou: number;
  grid: GridDelta;
  boundaryMean: number;
  boundaryP95: number;
  strokes: StrokeScore[];
  verdict: Band;
}

export function analyzeCharacter(
  character: BihuaCharacter,
  oracle: MmhCharData,
  style: BihuaStyle = maobiStyle,
): CharacterScore {
  const ink = oracleInk(oracle);
  const bake = bakeCharacter(character, style);
  const charIou = iouOf(bake.fused, ink.fused);
  const grid = gridDelta(analyzeGrid(bake.fused, character.grid), analyzeGrid(ink.fused, character.grid));
  const bnd = boundaryDistance(bake.fused, ink.fused);

  const strokes: StrokeScore[] = character.strokes.map((stroke, i) => {
    const candInk = bake.strokes[i].outline;
    const orcInk = ink.perStroke[i] ?? [];
    const sIou = iouOf(candInk, orcInk);
    const candProfile = widthProfile(candInk, stroke.spine);
    const orcProfile = widthProfile(orcInk, stroke.spine);
    const meanOrc = orcProfile.reduce((s, v) => s + v, 0) / orcProfile.length || 1;
    const rmse = Math.sqrt(
      candProfile.reduce((s, v, k) => s + (v - orcProfile[k]) ** 2, 0) / candProfile.length,
    ) / meanOrc;
    const mid = 5; // profile index nearest arc middle
    const taperDelta = (cand: number[], orc: number[], idx: number) => {
      const cR = cand[idx] / (cand[mid] || 1);
      const oR = orc[idx] / (orc[mid] || 1);
      return cR - oR;
    };
    const analysis = analyzeMedian(stroke.spine.map((p) => [p.x, p.y]));
    const cornerRatios: number[] = [];
    let overshoot = 0;
    analysis.keyIndices.slice(1, -1).forEach((nodeIdx, k) => {
      cornerRatios.push(discInkRatio(candInk, orcInk, stroke.spine[nodeIdx], 72));
      if (analysis.key.cornerSharp[k]) {
        overshoot = Math.max(
          overshoot,
          spineOvershoot(stroke.spine, nodeIdx, analysis.keyIndices[k]),
        );
      }
    });
    const cornerBand: Band = cornerRatios.every(
      (r) => r >= BANDS.cornerRatioLo && r <= BANDS.cornerRatioHi,
    )
      ? "ok"
      : cornerRatios.every((r) => r >= BANDS.cornerRatioWarnLo && r <= BANDS.cornerRatioWarnHi)
        ? "warn"
        : "fail";
    const verdict = worst([
      band(sIou, BANDS.iouOk, BANDS.iouWarn),
      band(rmse, BANDS.widthRmseOk, BANDS.widthRmseWarn, true),
      cornerBand,
    ]);
    return {
      form: stroke.form,
      iou: +sIou.toFixed(3),
      widthRmse: +rmse.toFixed(3),
      entryTaperDelta: +taperDelta(candProfile, orcProfile, 0).toFixed(3),
      exitTaperDelta: +taperDelta(candProfile, orcProfile, PROFILE_TS.length - 1).toFixed(3),
      cornerInkRatios: cornerRatios.map((r) => +r.toFixed(2)),
      spineOvershoot: +overshoot.toFixed(1),
      verdict,
    };
  });

  const verdict = worst([
    band(charIou, BANDS.iouOk, BANDS.iouWarn),
    band(grid.centroidDistance, BANDS.centroidOk, BANDS.centroidWarn, true),
    band(bnd.mean, BANDS.boundaryOk, BANDS.boundaryWarn, true),
    ...strokes.map((s) => s.verdict),
  ]);
  return {
    char: character.char,
    styleId: style.id,
    iou: +charIou.toFixed(3),
    grid,
    boundaryMean: +bnd.mean.toFixed(1),
    boundaryP95: +bnd.p95.toFixed(1),
    strokes,
    verdict,
  };
}
