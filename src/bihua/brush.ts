// 笔法 (bǐfǎ, "brush method") — turn a BihuaStroke into a core Stroke
// the existing bake can sweep.
//
// The brush is a 毛笔 (máobǐ), and it is NOT a disc of varying size.
// Four behaviours distinguish it, and the model carries all four:
//
//  1. The contact patch is ELONGATED — an ellipse longer along the
//     stroke's travel than across it (the core's `pointed` tip).
//  2. Its shape is PRESSURE-COUPLED: pressed, the patch swells; as the
//     brush lifts, the patch shrinks toward the point and the stroke
//     thins to its 出锋 (the pointed exit) — the core mapping
//     width = maxWidth × (0.06 + 0.94·p^0.75), cross-width 0.55 of that.
//  3. It points ALONG the travel (angleMode "tangentRelative"): the
//     shape an entry or exit leaves depends on the direction the
//     point was moving, as a real brush's does.
//  4. The tip LAGS at turns: the belly trails a change of direction,
//     carried on the core's twist channel as a lagged fraction of the
//     tangent's turn at each node (see TIP_LAG). This is what
//     thickens the outside of a 折 and gathers a 钩.
//
// What it still does not model: bristle split （飞白， "flying white")
// and speed. Those need tip shapes beyond the core's current kinds
// and are named here as known limits, not silently absent.
//
// Calibration note: a plain disc tip scores slightly higher IoU
// against the Make Me a Hanzi outline oracle (0.750 vs ~0.73) — the
// oracle is a printed form, so the disc wins by resembling print.
// The pilot's exit criterion is the owner's eye ("written, not
// traced"), so brush truth wins over the overlay number.

import type { Pt, Spine, SpineSegment } from "../types.js";

/**
 * The pointed tip's full-pressure patch length, in grid units (1024
 * grid), as calibrated against the outline oracle (plateau 110–124,
 * IoU ≈ 0.734; cross-width is 0.55 × the pressure-scaled patch).
 */
export const MAOBI_MAX_WIDTH = 114;

/**
 * Cross-width multiplier of the core pointed mapping (ellipse height
 * is 0.55 × its pressure-scaled width). Kept as a named constant so
 * widthAt() reports real ink width.
 */
export const MAOBI_CROSS_RATIO = 0.55;

/** How much of a direction change the tip's orientation trails, 0..1. */
export const TIP_LAG = 0.55;

/** Nominal ink (cross) width at a pressure, per the core pointed mapping. */
export function widthAt(pressure: number, maxWidth: number = MAOBI_MAX_WIDTH): number {
  const p = Math.min(1, Math.max(0, pressure));
  return MAOBI_CROSS_RATIO * maxWidth * (0.06 + 0.94 * Math.pow(p, 0.75));
}

/**
 * Smoothing tension at a node, from the direction change there.
 * Plain Catmull-Rom treats every node alike, and at a real corner
 * （折） it overshoots: the control point of the segment LEAVING a
 * corner is dragged along the next segment's long axis, so the curve
 * bulges past the corner before turning — under a long brush patch
 * the joint then reads as two strokes overlapping. A written corner
 * is a pivot: the brush stops, presses, and turns on the spot. So
 * tension falls with turn angle — a gentle node keeps full smoothing
 * (a 撇's curve is untouched), a sharp corner is pinned nearly
 * linear and the patch fans around the corner point instead.
 */
export function cornerTension(turnDegrees: number): number {
  return clamp(1.15 - turnDegrees / 75, 0.08, 1);
}

/** Catmull-Rom smoothing of a node polyline into a cubic spine, corner-aware. */
export function smoothSpine(nodes: Pt[]): Spine {
  if (nodes.length < 3) {
    return {
      nodes: nodes.map((p) => ({ ...p })),
      segments: nodes.slice(1).map((): SpineSegment => ({ kind: "line" })),
    };
  }
  const tension = nodes.map((_, i) => {
    if (i === 0 || i === nodes.length - 1) return 1;
    const a = Math.atan2(nodes[i].y - nodes[i - 1].y, nodes[i].x - nodes[i - 1].x);
    const b = Math.atan2(nodes[i + 1].y - nodes[i].y, nodes[i + 1].x - nodes[i].x);
    return cornerTension(Math.abs(turnDeg((a * 180) / Math.PI, (b * 180) / Math.PI)));
  });
  const segments: SpineSegment[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const p0 = nodes[Math.max(0, i - 1)];
    const p1 = nodes[i];
    const p2 = nodes[i + 1];
    const p3 = nodes[Math.min(nodes.length - 1, i + 2)];
    segments.push({
      kind: "cubic",
      c1: { x: p1.x + ((p2.x - p0.x) / 6) * tension[i], y: p1.y + ((p2.y - p0.y) / 6) * tension[i] },
      c2: { x: p2.x - ((p3.x - p1.x) / 6) * tension[i + 1], y: p2.y - ((p3.y - p1.y) / 6) * tension[i + 1] },
    });
  }
  return { nodes: nodes.map((p) => ({ ...p })), segments };
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Signed smallest turn from angle a to angle b, in degrees. */
function turnDeg(a: number, b: number): number {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * Per-node tip lag: at each interior node, the twist that makes the
 * tip's orientation trail the spine's turn there by TIP_LAG of the
 * turn, clamped to ±40°. Ends get none (the brush enters and leaves
 * pointing along its travel).
 */
export function tipLagTwists(nodes: Pt[]): number[] {
  const tangents: number[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    tangents.push(
      (Math.atan2(nodes[i + 1].y - nodes[i].y, nodes[i + 1].x - nodes[i].x) * 180) / Math.PI,
    );
  }
  return nodes.map((_, i) => {
    if (i === 0 || i === nodes.length - 1) return 0;
    const turn = turnDeg(tangents[i - 1], tangents[i]);
    const v = clamp(-TIP_LAG * turn, -40, 40);
    return v === 0 ? 0 : v; // normalise -0
  });
}

// Stroke construction per style lives in styles.ts; this module
// holds the shared 笔法 machinery (spine smoothing, tip lag, widths).
