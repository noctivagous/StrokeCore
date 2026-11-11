import polygonClipping from "polygon-clipping";

const { union } = polygonClipping;
import {
  lerp,
  lerpAngleDeg,
  ringArea,
  sampleSpine,
  simplifyRing,
  type SpineSample,
} from "./geometry.js";
import { effectiveTip, tipMinDimension, tipPolygon } from "./tool.js";
import type {
  BakeOptions,
  MultiPolygon,
  Polygon,
  Pt,
  Stroke,
  StrokePoint,
  TipShape,
} from "./types.js";

interface Keyframe {
  u: number;
  value: number;
}

function keyframes(
  points: StrokePoint[] | undefined,
  segCount: number,
  pick: (p: StrokePoint) => number | undefined,
  fallback: number,
): Keyframe[] {
  const defined = (points ?? [])
    .filter((p) => pick(p) !== undefined)
    .map((p) => ({ u: segCount === 0 ? 0 : p.node / segCount, value: pick(p)! }))
    .sort((a, b) => a.u - b.u);
  if (defined.length === 0) return [{ u: 0, value: fallback }];
  const frames = [...defined];
  if (frames[0].u > 0) frames.unshift({ u: 0, value: frames[0].value });
  if (frames[frames.length - 1].u < 1)
    frames.push({ u: 1, value: frames[frames.length - 1].value });
  return frames;
}

function sampleKeyframes(frames: Keyframe[], u: number, angular: boolean): number {
  if (u <= frames[0].u) return frames[0].value;
  for (let i = 1; i < frames.length; i++) {
    if (u <= frames[i].u) {
      const span = frames[i].u - frames[i - 1].u;
      const t = span === 0 ? 0 : (u - frames[i - 1].u) / span;
      return angular
        ? lerpAngleDeg(frames[i - 1].value, frames[i].value, t)
        : lerp(frames[i - 1].value, frames[i].value, t);
    }
  }
  return frames[frames.length - 1].value;
}

export interface ResolvedTipState {
  angleDeg: number;
  widthFactor: number;
  /** Interpolated brush channels (0 / 0 / undefined for rigid nibs). */
  pressure: number;
  twistDeg: number;
  spread?: number;
  /** The tip shape the tool presents at this sample (§3.3 mapping). */
  tip: TipShape;
}

/** Resolve the tip state at a spine sample (SPEC §4 interpolation rules). */
export function resolveTipState(
  stroke: Stroke,
  sample: SpineSample,
): ResolvedTipState {
  const segCount = stroke.spine.nodes.length - 1;
  const widthFrames = keyframes(stroke.points, segCount, (p) => p.widthFactor, 1);
  const angleFrames = keyframes(stroke.points, segCount, (p) => p.angleDeg, stroke.angleDeg);
  const pressureFrames = keyframes(stroke.points, segCount, (p) => p.pressure, 0);
  const twistFrames = keyframes(stroke.points, segCount, (p) => p.twistDeg, 0);
  const widthFactor = sampleKeyframes(widthFrames, sample.u, false);
  const declared = sampleKeyframes(angleFrames, sample.u, true);
  const pressure = sampleKeyframes(pressureFrames, sample.u, false);
  const twistDeg = sampleKeyframes(twistFrames, sample.u, true);
  const spreadFrames = keyframes(stroke.points, segCount, (p) => p.spread, NaN);
  const spreadSample = sampleKeyframes(spreadFrames, sample.u, false);
  const spread = Number.isNaN(spreadSample) ? undefined : spreadSample;
  const mode = stroke.angleMode ?? "fixed";
  const base = mode === "tangentRelative" ? sample.tangentDeg + declared : declared;
  return {
    angleDeg: base + twistDeg, // twist rotates the tip beyond its declared angle
    widthFactor,
    pressure,
    twistDeg,
    spread,
    tip: effectiveTip(stroke.tool, pressure, spread),
  };
}

export interface StrokeBake {
  outline: MultiPolygon;
  /** Tip polygon at every sample — the stamps the outline was built from. */
  tips: Pt[][];
  samples: SpineSample[];
}

/**
 * Bake one stroke (SPEC §6): sample the spine, stamp the tip at each
 * sample, strip-connect consecutive stamps, union everything, simplify.
 * The start and end caps are the tip itself at its declared angle —
 * there is no cap style and no cap-rotation property.
 */
export function bakeStroke(stroke: Stroke, options: BakeOptions = {}): StrokeBake {
  const tip = stroke.tool.tip;
  const step = options.step ?? Math.max(0.5, tipMinDimension(tip) / 2);
  const tolerance = options.simplifyTolerance ?? 0.25;
  const ellipseSegments = options.ellipseSegments ?? 28;
  const samples = sampleSpine(stroke.spine, step);
  if (samples.length === 0) return { outline: [], tips: [], samples };

  const tips = samples.map((s) => {
    const state = resolveTipState(stroke, s);
    return tipPolygon(state.tip, s.point, state.angleDeg, state.widthFactor, ellipseSegments);
  });

  const pieces: Polygon[] = [];
  const asPolygon = (pts: Pt[]): Polygon => [
    pts.map((p): [number, number] => [p.x, p.y]),
  ];
  pieces.push(asPolygon(tips[0]));
  pieces.push(asPolygon(tips[tips.length - 1]));
  for (let i = 1; i < tips.length; i++) {
    const A = tips[i - 1];
    const B = tips[i];
    const L = Math.min(A.length, B.length);
    for (let k = 0; k < L; k++) {
      const k2 = (k + 1) % L;
      pieces.push(asPolygon([A[k], A[k2], B[k2], B[k]]));
    }
  }

  const fused = union(pieces[0], ...pieces.slice(1)) as MultiPolygon;
  const outline = fused.map((poly) =>
    poly.map((ring) => simplifyRing(ring, tolerance)),
  ) as MultiPolygon;
  return { outline, tips, samples };
}

/** Union several baked outlines into one (glyph-level fusing, SPEC §6). */
export function fuseOutlines(outlines: MultiPolygon[]): MultiPolygon {
  const nonEmpty = outlines.filter((o) => o.length > 0);
  if (nonEmpty.length === 0) return [];
  if (nonEmpty.length === 1) return nonEmpty[0];
  return union(nonEmpty[0], ...nonEmpty.slice(1)) as MultiPolygon;
}

export interface GlyphBake {
  /** One fused outline per fuse group. */
  groups: Map<string, MultiPolygon>;
  perStroke: StrokeBake[];
}

/** Bake a whole glyph: strokes in the same fuse group union together. */
export function bakeGlyph(strokes: Stroke[], options: BakeOptions = {}): GlyphBake {
  const perStroke = strokes.map((s) => bakeStroke(s, options));
  const byGroup = new Map<string, MultiPolygon[]>();
  strokes.forEach((s, i) => {
    const g = s.fuseGroup ?? "ink";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(perStroke[i].outline);
  });
  const groups = new Map<string, MultiPolygon>();
  for (const [g, list] of byGroup) groups.set(g, fuseOutlines(list));
  return { groups, perStroke };
}

/** Total ink area: outer rings minus holes. */
export function multiPolygonArea(mp: MultiPolygon): number {
  let total = 0;
  for (const poly of mp) {
    poly.forEach((ring, i) => {
      const a = Math.abs(ringArea(ring));
      total += i === 0 ? a : -a;
    });
  }
  return total;
}

const fmt = (n: number): string => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
};

/**
 * SVG path data for a baked outline. Font coordinates are y-up and SVG
 * is y-down, so y is negated (equivalent to a scale(1,-1) on the group).
 * Use with fill-rule="evenodd" so holes cut correctly.
 */
export function toSVGPath(mp: MultiPolygon): string {
  const parts: string[] = [];
  for (const poly of mp) {
    for (const ring of poly) {
      if (ring.length === 0) continue;
      parts.push(
        "M" +
          ring.map(([x, y]) => `${fmt(x)} ${fmt(-y)}`).join("L") +
          "Z",
      );
    }
  }
  return parts.join(" ");
}
