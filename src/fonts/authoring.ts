// Small authoring helpers for building glyph stroke lists by hand.
import { pt } from "../geometry.js";
import { expandCompositeSpine, type CompositePoint, type CompositeSpine } from "../composite.js";
import type { FileStroke } from "../font.js";
import type { Pt, Spine, SpineSegment } from "../types.js";

export const L = (x1: number, y1: number, x2: number, y2: number): Spine => ({
  nodes: [pt(x1, y1), pt(x2, y2)],
  segments: [{ kind: "line" }],
});

/** Spine through nodes; each segment is a cubic via its two control points, or "line". */
export function spine(nodes: [number, number][], segs: ("line" | [number, number, number, number])[]): Spine {
  return {
    nodes: nodes.map(([x, y]) => pt(x, y)),
    segments: segs.map((s): SpineSegment =>
      s === "line" ? { kind: "line" } : { kind: "cubic", c1: pt(s[0], s[1]), c2: pt(s[2], s[3]) },
    ),
  };
}

/** One cubic stroke from A to B with control points C1, C2. */
export const arc = (x1: number, y1: number, c1x: number, c1y: number, c2x: number, c2y: number, x2: number, y2: number): Spine =>
  spine([[x1, y1], [x2, y2]], [[c1x, c1y, c2x, c2y]]);

let n = 0;
export function stroke(
  tool: string,
  role: string,
  move: string,
  sp: Spine,
  angleDeg = 30,
  extra: Partial<FileStroke> = {},
): FileStroke {
  return { id: `s${++n}`, tool, role, move, angleDeg, spine: sp, ...extra };
}

/** A composite spine from semantic points (§4.5): [x, y] pairs are
 * plain spline points; full CompositePoint objects declare kinds,
 * corners, outgoing segments and tip-state keyframes. */
export function cspine(points: (CompositePoint | [number, number])[], closed = false): CompositeSpine {
  return {
    closed,
    points: points.map((p): CompositePoint => (Array.isArray(p) ? { x: p[0], y: p[1] } : p)),
  };
}

/** A stroke authored as a composite spine: expansion happens now, and
 * the composite points ride along as the authoring truth. */
export function cstroke(
  tool: string,
  role: string,
  move: string,
  cs: CompositeSpine,
  angleDeg = 30,
  extra: Partial<FileStroke> = {},
): FileStroke {
  const expanded = expandCompositeSpine(cs);
  return {
    id: `s${++n}`,
    tool, role, move, angleDeg,
    spine: expanded.spine,
    composite: cs,
    ...(expanded.points.length ? { points: expanded.points } : {}),
    ...extra,
  };
}

export const resetIds = () => { n = 0; };

/**
 * A calligraphic stem: entry hook at the top (the sharp-headed serif),
 * a straight pull down, and a small foot flick at the baseline.
 * Drawn top → bottom. (x = stem centre line.)
 */
export function stem(tool: string, x: number, top: number, bot: number, move = "pull the stem down"): FileStroke {
  // Spine inset ~30 from the ladder lines: the nib's stamp projects
  // ~30 units beyond the spine end, so the INK lands on the lines.
  return stroke(tool, "stem", move, spine(
    [[x - 52, top - 12], [x, top - 36], [x, bot + 30], [x + 74, bot + 12]],
    [[x - 16, top - 14, x, top - 26], "line", [x, bot + 44, x + 34, bot + 14]],
  ));
}

/** A plain descending stem with no foot (for p, q, descenders). */
export function stemBare(tool: string, x: number, top: number, bot: number, move = "pull the stem down"): FileStroke {
  return stroke(tool, "stem", move, spine(
    [[x - 40, top - 14], [x, top - 36], [x, bot + 12]],
    [[x - 12, top - 16, x, top - 26], "line"],
  ));
}
