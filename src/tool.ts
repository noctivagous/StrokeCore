import { pt, rotate } from "./geometry.js";
import type { Pt, Tool, TipShape } from "./types.js";

export function broadEdgeNib(name: string, width: number, thickness: number): Tool {
  return { name, tip: { kind: "rect", width, thickness }, direction: "manner" };
}

export function roundNib(name: string, diameter: number): Tool {
  return { name, tip: { kind: "ellipse", width: diameter, height: diameter }, direction: "any" };
}

export function ovalNib(name: string, width: number, height: number): Tool {
  return { name, tip: { kind: "ellipse", width, height }, direction: "any" };
}

export function pointedNib(name: string, maxWidth: number, length: number): Tool {
  return { name, tip: { kind: "pointed", maxWidth, length }, direction: "any" };
}

/** Pointed brush: the contact patch swells with pressure (§3.3). */
export function pointedBrush(name: string, maxWidth: number, length: number): Tool {
  return { name, tip: { kind: "pointed", maxWidth, length }, direction: "any" };
}

/** Flat brush (sign / Trajan brush): held at an angle, twists at curves. */
export function flatBrush(name: string, width: number, thickness: number): Tool {
  return { name, tip: { kind: "flatBrush", width, thickness }, direction: "manner" };
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * The tip shape a tool actually presents at a given pressure (§3.3 —
 * the tool declares its pressure→tip mapping; this is that mapping).
 * Rigid nibs return their tip unchanged. `spread` (0..1 splay) defaults
 * to the pressure for brushes that splay.
 */
export function effectiveTip(tool: Tool, pressure: number, spread?: number): TipShape {
  const tip = tool.tip;
  const p = clamp01(pressure);
  switch (tip.kind) {
    case "pointed": {
      // Never quite zero: a lifted pointed brush still leaves a hairline.
      const w = tip.maxWidth * (0.06 + 0.94 * Math.pow(p, 0.75));
      return { kind: "ellipse", width: w, height: Math.max(0.8, w * 0.55) };
    }
    case "flatBrush": {
      const s = clamp01(spread ?? 0);
      return {
        kind: "rect",
        width: tip.width * (1 + 0.35 * p + 0.25 * s),
        thickness: tip.thickness * (1 - 0.45 * p),
      };
    }
    case "steelBrush": {
      const s = clamp01(spread ?? p); // a steel brush splays as it is pressed
      return {
        kind: "rect",
        width: tip.width * (1 + 0.6 * p + 0.4 * s),
        thickness: tip.thickness * (1 - 0.3 * p),
      };
    }
    default:
      return tip;
  }
}

/**
 * Ross F. George's Speedball series. Sizes follow the maker's numbering
 * (0 = widest). Widths in millimetres at size, mapped from the published
 * nib charts; treat as a good working table, not a metrology claim.
 * A = square tip, B = round tip, C = chisel (broad-edge), D = oval.
 * (E, the steel brush, arrives with brush physics in Phase 2.)
 */
const SPEEDBALL_WIDTH_MM: Record<string, Record<number, number>> = {
  A: { 0: 4.4, 1: 3.5, 2: 2.8, 3: 2.2, 4: 1.7, 5: 1.2 },
  B: { 0: 4.4, 1: 3.5, 2: 2.8, 3: 2.2, 4: 1.7, 5: 1.2, 6: 0.8 },
  C: { 0: 4.5, 1: 3.6, 2: 2.8, 3: 2.1, 4: 1.6, 5: 1.1, 6: 0.6 },
  D: { 1: 3.4, 2: 2.7, 3: 2.1, 4: 1.6, 5: 1.1 },
};

export function speedballNib(
  series: "A" | "B" | "C" | "D",
  size: number,
  unitsPerMm = 40,
): Tool {
  const widthMm = SPEEDBALL_WIDTH_MM[series][size];
  if (widthMm === undefined) {
    throw new Error(`Speedball ${series} has no size ${size} in the table`);
  }
  const w = widthMm * unitsPerMm;
  const name = `Speedball ${series}-${size}`;
  // George's direction rule: A, B and D work in any direction; C is
  // manner-bound (see docs/sources/george-1927-notes.md).
  switch (series) {
    case "A": // square tip: thickness = width
      return { name, tip: { kind: "rect", width: w, thickness: w }, direction: "any" };
    case "B":
      return { name, tip: { kind: "ellipse", width: w, height: w }, direction: "any" };
    case "C": // chisel edge: thin relative to width
      return { name, tip: { kind: "rect", width: w, thickness: w * 0.18 }, direction: "manner" };
    case "D":
      return { name, tip: { kind: "ellipse", width: w, height: w * 0.62 }, direction: "any" };
  }
}

/** Speedball E — the steel brush (§3.2/§3.3): a brush, not a nib. */
export function speedballBrush(series: "E", size: number, unitsPerMm = 40): Tool {
  const widthMm = SPEEDBALL_WIDTH_MM.B[size];
  if (widthMm === undefined) {
    throw new Error(`Speedball ${series} has no size ${size} in the table`);
  }
  const w = widthMm * unitsPerMm;
  return {
    name: `Speedball ${series}-${size}`,
    tip: { kind: "steelBrush", width: w, thickness: w * 0.22 },
    direction: "manner",
  };
}

/**
 * The tip outline at a centre, held at angleDeg, scaled by widthFactor.
 * Vertices come back in a consistent order and starting position for a
 * given shape kind, so consecutive tip polygons can be strip-connected
 * vertex-to-vertex during the bake.
 *
 * Rect: vertices start at the (+width/2, +thickness/2) corner and run
 * counter-clockwise in tip-local space. Ellipse: vertices start at the
 * +width end and run counter-clockwise.
 */
export function tipPolygon(
  tip: TipShape,
  centre: Pt,
  angleDeg: number,
  widthFactor = 1,
  ellipseSegments = 28,
): Pt[] {
  const place = (local: Pt): Pt => {
    const r = rotate({ x: local.x * widthFactor, y: local.y * widthFactor }, angleDeg);
    return { x: centre.x + r.x, y: centre.y + r.y };
  };
  switch (tip.kind) {
    case "rect": {
      const hw = tip.width / 2;
      const ht = tip.thickness / 2;
      return [place(pt(hw, ht)), place(pt(-hw, ht)), place(pt(-hw, -ht)), place(pt(hw, -ht))];
    }
    case "ellipse": {
      const out: Pt[] = [];
      for (let i = 0; i < ellipseSegments; i++) {
        const a = (i / ellipseSegments) * Math.PI * 2;
        out.push(place(pt(Math.cos(a) * (tip.width / 2), Math.sin(a) * (tip.height / 2))));
      }
      return out;
    }
    case "polygon":
      return tip.points.map(place);
    case "pointed":
      // At-rest fallback; the bake normally passes the pressure-grown
      // ellipse from effectiveTip instead.
      return tipPolygon(
        { kind: "ellipse", width: tip.maxWidth * 0.06, height: Math.max(0.8, tip.maxWidth * 0.033) },
        centre, angleDeg, widthFactor, ellipseSegments,
      );
    case "flatBrush":
    case "steelBrush":
      return tipPolygon(
        { kind: "rect", width: tip.width, thickness: tip.thickness },
        centre, angleDeg, widthFactor, ellipseSegments,
      );
  }
}

/** The tip's extent across a direction — used for default sampling step. */
export function tipMinDimension(tip: TipShape): number {
  switch (tip.kind) {
    case "rect":
      return Math.min(tip.width, tip.thickness);
    case "ellipse":
      return Math.min(tip.width, tip.height);
    case "pointed":
      // Sampling scale only: a quarter of full swell (the hairline ends
      // tolerate a coarser step than the swell does).
      return Math.max(1, tip.maxWidth * 0.25);
    case "flatBrush":
    case "steelBrush":
      return tip.thickness;
    case "polygon": {
      let m = Infinity;
      for (const p of tip.points) m = Math.min(m, Math.hypot(p.x, p.y) * 2);
      return m === Infinity ? 1 : m;
    }
  }
}
