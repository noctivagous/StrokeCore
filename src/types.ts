// StrokeCore Phase 1 core types — see docs/SPEC.md §3–§4.
// Coordinates are font units, y-up. Angles are degrees from the baseline
// (0 = horizontal), counter-clockwise positive.

export interface Pt {
  x: number;
  y: number;
}

export type TipShape =
  | { kind: "rect"; width: number; thickness: number }
  | { kind: "ellipse"; width: number; height: number }
  | { kind: "polygon"; points: Pt[] }
  /** Pointed nib/brush at rest: pressure grows the contact patch (§3.3). */
  | { kind: "pointed"; maxWidth: number; length: number }
  /** Flat brush: pressure spreads the width and thins the edge (§3.3). */
  | { kind: "flatBrush"; width: number; thickness: number }
  /** Steel brush (Speedball E): a flat brush that splays harder. */
  | { kind: "steelBrush"; width: number; thickness: number };

/** George's direction behaviour (§3.2): free in any direction, or manner-bound. */
export type DirectionBehaviour = "any" | "manner";

export interface Tool {
  name: string;
  tip: TipShape;
  direction?: DirectionBehaviour;
}

/** A spine is nodes joined by segments; segment i joins node i to node i+1. */
export type SpineSegment =
  | { kind: "line" }
  | { kind: "cubic"; c1: Pt; c2: Pt };

export interface Spine {
  nodes: Pt[];
  segments: SpineSegment[]; // length = nodes.length - 1
}

export type AngleMode = "fixed" | "absolute" | "tangentRelative";

/**
 * Tip state declared at a spine node — Metafont's penpos, extended for
 * brushes (§3.3/§4): pressure, twist and spread are brush channels;
 * rigid nibs ignore them.
 */
export interface StrokePoint {
  node: number; // index into spine.nodes
  widthFactor?: number; // tip size multiplier here (default 1)
  angleDeg?: number; // tip angle here (meaning depends on angleMode)
  pressure?: number; // 0..1, brushes
  twistDeg?: number; // extra tip rotation here, brushes (the flat-brush flexion)
  spread?: number; // 0..1 splay override, brushes; default derives from pressure
}

export interface Stroke {
  id: string;
  tool: Tool;
  /** The anatomy part this stroke is (stem, bowl, arm, ear, tail, …) — see primitives.ts. */
  role?: string;
  move?: string;
  /** What the hand does: a base primitive, configured (primitives.ts). */
  gesture?: import("./primitives.js").StrokeGesture;
  /** What the stroke is doing for the letter: a function verb + target part (primitives.ts). */
  purpose?: import("./primitives.js").StrokePurpose;
  spine: Spine;
  /**
   * The semantic composite spine this stroke was authored as (§4.5),
   * when it was. `spine` is its expansion; the composite points are
   * the authoring truth and the scaffold the glyph was built on.
   */
  composite?: import("./composite.js").CompositeSpine;
  /** Held tip angle for the whole stroke when points don't override. */
  angleDeg: number;
  angleMode?: AngleMode; // default "fixed"
  points?: StrokePoint[];
  fuseGroup?: string; // default "ink"
}

export interface BakeOptions {
  /** Sampling step along the spine, font units. Default: min tip dimension / 2. */
  step?: number;
  /** Douglas–Peucker tolerance for the fused outline. Default 0.25. */
  simplifyTolerance?: number;
  /** Vertices used to approximate ellipse tips. Default 28. */
  ellipseSegments?: number;
}

/** polygon-clipping geometry: a polygon is [outerRing, ...holeRings]. */
export type Ring = [number, number][];
export type Polygon = Ring[];
export type MultiPolygon = Polygon[];
