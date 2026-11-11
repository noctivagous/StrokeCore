import { pt } from "./geometry.js";
import type { Stroke, Tool } from "./types.js";

const line = (x1: number, y1: number, x2: number, y2: number) => ({
  nodes: [pt(x1, y1), pt(x2, y2)],
  segments: [{ kind: "line" as const }],
});

/**
 * The Phase 1 test glyphs — spines only, no outlines anywhere.
 * Local box: 100 × 100 font units.
 */

/** The essay's example: an "x" from two line spines and nothing else. */
export function glyphX(tool: Tool, angleDeg: number): Stroke[] {
  return [
    {
      id: "x-diag-up",
      tool,
      role: "stem",
      move: "diagonal upstroke",
      angleDeg,
      spine: line(14, 8, 86, 92),
    },
    {
      id: "x-diag-down",
      tool,
      role: "stem",
      move: "diagonal downstroke",
      angleDeg,
      spine: line(14, 92, 86, 8),
    },
  ];
}

/**
 * An "H" in the Speedball C-nib manner: two stems and a bar, one held
 * angle. At 0° the stems take the nib's full width and the bar takes
 * only its thickness — the broad-edge contrast comes from the tool,
 * not from drawn outlines.
 */
/**
 * The Phase 2 proof strokes.
 */

/**
 * A pointed-brush swell: one arcing spine, pressure rising 0 → peak → 0
 * across three nodes. The tip's long axis follows the travel
 * (tangentRelative + 90° puts the patch's width across the stroke), so
 * the mark swells where the hand presses and hairlines at the lift.
 */
export function swellStroke(tool: Tool, peakPressure = 1): Stroke {
  return {
    id: "swell",
    tool,
    role: "swell",
    move: "press and lift",
    angleDeg: 90,
    angleMode: "tangentRelative",
    spine: {
      nodes: [pt(10, 30), pt(50, 62), pt(90, 30)],
      segments: [
        { kind: "cubic", c1: pt(26, 58), c2: pt(38, 66) },
        { kind: "cubic", c1: pt(62, 66), c2: pt(74, 58) },
      ],
    },
    points: [
      { node: 0, pressure: 0 },
      { node: 1, pressure: peakPressure },
      { node: 2, pressure: 0 },
    ],
  };
}

/**
 * A flat-brush Roman "A" in the Trajan manner: two diagonal stems
 * meeting at the apex and a bar, the brush held at 30° and *twisting*
 * through each stem — Catich's flexion, declared at the nodes.
 * peakTwistDeg is the mid-stem twist (the stems' second node).
 */
export function glyphBrushA(tool: Tool, peakTwistDeg = 22): Stroke[] {
  const stem = (
    id: string,
    from: [number, number],
    apex: [number, number],
  ): Stroke => ({
    id,
    tool,
    role: "stem",
    move: "diagonal downstroke",
    angleDeg: 30,
    spine: {
      nodes: [pt(from[0], from[1]), pt((from[0] + apex[0]) / 2, (from[1] + apex[1]) / 2), pt(apex[0], apex[1])],
      segments: [{ kind: "line" }, { kind: "line" }],
    },
    points: [
      { node: 0, twistDeg: 0, pressure: 0.35 },
      { node: 1, twistDeg: peakTwistDeg, pressure: 0.6 },
      { node: 2, twistDeg: 0, pressure: 0.35 },
    ],
  });
  return [
    stem("a-stem-left", [22, 6], [50, 94]),
    stem("a-stem-right", [78, 6], [50, 94]),
    {
      id: "a-bar",
      tool,
      role: "bar",
      move: "side stroke",
      angleDeg: 30,
      spine: line(36, 38, 64, 38),
      points: [
        { node: 0, pressure: 0.3 },
        { node: 1, pressure: 0.3 },
      ],
    },
  ];
}

export function glyphH(tool: Tool, angleDeg: number): Stroke[] {
  return [
    {
      id: "h-stem-left",
      tool,
      role: "stem",
      move: "downstroke",
      angleDeg,
      spine: line(20, 6, 20, 94),
    },
    {
      id: "h-stem-right",
      tool,
      role: "stem",
      move: "downstroke",
      angleDeg,
      spine: line(80, 6, 80, 94),
    },
    {
      id: "h-bar",
      tool,
      role: "bar",
      move: "side stroke",
      angleDeg,
      spine: line(20, 50, 80, 50),
    },
  ];
}
