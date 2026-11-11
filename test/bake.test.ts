import { describe, expect, it } from "vitest";
import {
  bakeGlyph,
  bakeStroke,
  broadEdgeNib,
  glyphH,
  glyphX,
  lerpAngleDeg,
  multiPolygonArea,
  pt,
  roundNib,
  tipPolygon,
} from "./helpers.js";

function bbox(mp: ReturnType<typeof bakeGlyph>["groups"]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const poly of mp.get("ink")!) {
    for (const ring of poly) {
      for (const [x, y] of ring) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

describe("angle interpolation", () => {
  it("takes the shortest circular path", () => {
    expect(lerpAngleDeg(350, 10, 0.5)).toBeCloseTo(0, 6);
    expect(lerpAngleDeg(10, 350, 0.5)).toBeCloseTo(0, 6);
    expect(lerpAngleDeg(0, 90, 0.5)).toBeCloseTo(45, 6);
  });
});

describe("tip polygon", () => {
  it("is the nib rectangle at 0 degrees", () => {
    const poly = tipPolygon({ kind: "rect", width: 20, thickness: 4 }, pt(0, 0), 0);
    expect(poly[0]).toEqual({ x: 10, y: 2 });
    expect(poly[2]).toEqual({ x: -10, y: -2 });
  });
});

describe("the bake", () => {
  it("sweeps a straight stroke to the Minkowski area", () => {
    // Rect nib 20x4 held at 0 deg along a 100-long horizontal spine:
    // envelope = tip area (80) + length x perpendicular width (100x4) = 480.
    const nib = broadEdgeNib("test", 20, 4);
    const bake = bakeStroke(
      {
        id: "s",
        tool: nib,
        angleDeg: 0,
        spine: { nodes: [pt(0, 0), pt(100, 0)], segments: [{ kind: "line" }] },
      },
      { step: 2, simplifyTolerance: 0 },
    );
    expect(bake.outline.length).toBe(1);
    expect(multiPolygonArea(bake.outline)).toBeCloseTo(480, 0);
  });

  it("gives a round nib its capsule area", () => {
    const nib = roundNib("round", 20);
    const bake = bakeStroke(
      {
        id: "s",
        tool: nib,
        angleDeg: 0,
        spine: { nodes: [pt(0, 0), pt(100, 0)], segments: [{ kind: "line" }] },
      },
      { step: 1.5, simplifyTolerance: 0 },
    );
    const expected = Math.PI * 100 + 100 * 20; // circle + rectangle
    expect(multiPolygonArea(bake.outline)).toBeGreaterThan(expected * 0.96);
    expect(multiPolygonArea(bake.outline)).toBeLessThan(expected * 1.02);
  });

  it("rotates the cap with the nib, not the spine — the 'x' property", () => {
    // Diagonal spine at 45 deg, nib held at 30 deg. The start cap edge
    // must run at the nib angle (30), NOT perpendicular to the spine
    // (which would be 135) as PostScript forces.
    const nib = broadEdgeNib("test", 24, 5);
    const bake = bakeStroke({
      id: "d",
      tool: nib,
      angleDeg: 30,
      spine: { nodes: [pt(0, 0), pt(100, 100)], segments: [{ kind: "line" }] },
    });
    const tip = bake.tips[0];
    const edgeDeg =
      (Math.atan2(tip[1].y - tip[0].y, tip[1].x - tip[0].x) * 180) / Math.PI;
    const lineDeg = ((edgeDeg % 180) + 180) % 180;
    expect(lineDeg).toBeCloseTo(30, 4);
    expect(Math.abs(lineDeg - 135)).toBeGreaterThan(45);
  });

  it("narrows the tip when widthFactor falls along the stroke", () => {
    const nib = broadEdgeNib("test", 20, 4);
    const bake = bakeStroke({
      id: "taper",
      tool: nib,
      angleDeg: 0,
      spine: { nodes: [pt(0, 0), pt(100, 0)], segments: [{ kind: "line" }] },
      points: [
        { node: 0, widthFactor: 1 },
        { node: 1, widthFactor: 0.4 },
      ],
    });
    const first = bake.tips[0];
    const last = bake.tips[bake.tips.length - 1];
    const width = (tip: typeof first) =>
      Math.abs(tip[0].x - tip[1].x) + Math.abs(tip[0].y - tip[3].y);
    expect(width(last)).toBeLessThan(width(first) * 0.5);
  });
});

describe("the Phase 1 glyphs", () => {
  it("bakes the 'x' from two spines into ONE fused outline", () => {
    const nib = broadEdgeNib("C-like", 22, 4);
    const strokes = glyphX(nib, 30);
    const separate = strokes.map((s) => multiPolygonArea(bakeStroke(s).outline));
    const baked = bakeGlyph(strokes);
    const ink = baked.groups.get("ink")!;
    expect(ink.length).toBe(1); // one fused polygon, not two overlapping strokes
    const fused = multiPolygonArea(ink);
    expect(fused).toBeGreaterThan(Math.max(...separate));
    expect(fused).toBeLessThan(separate[0] + separate[1]); // the crossing is shared ink
  });

  it("bakes the 'H' fused, with broad-edge contrast from the tool", () => {
    const nib = broadEdgeNib("C-like", 16, 3);
    const baked = bakeGlyph(glyphH(nib, 0));
    const ink = baked.groups.get("ink")!;
    expect(ink.length).toBe(1);
    const box = bbox(baked.groups);
    // Stems span the height; the whole glyph is wider than it is tall-ish
    // and the bar (drawn with the thin dimension) adds no extra height.
    expect(box.height).toBeGreaterThan(88);
    expect(box.width).toBeGreaterThan(60);
  });
});
