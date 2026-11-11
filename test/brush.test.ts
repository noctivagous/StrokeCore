import { describe, expect, it } from "vitest";
import { bakeGlyph, bakeStroke, multiPolygonArea, resolveTipState } from "../src/bake.js";
import { glyphBrushA, swellStroke } from "../src/fixtures.js";
import { sampleSpine } from "../src/geometry.js";
import {
  effectiveTip,
  flatBrush,
  pointedBrush,
  speedballBrush,
  speedballNib,
} from "../src/tool.js";

const tipExtent = (poly: { x: number; y: number }[]) => {
  let w = 0;
  for (let i = 0; i < poly.length; i++)
    for (let j = i + 1; j < poly.length; j++)
      w = Math.max(w, Math.hypot(poly[i].x - poly[j].x, poly[i].y - poly[j].y));
  return w;
};

describe("brush physics (Phase 2)", () => {
  it("completes the Speedball table: A–D nibs plus the E steel brush", () => {
    for (const s of ["A", "B", "C", "D"] as const) {
      expect(speedballNib(s, 2).tip.kind).toBeDefined();
    }
    const e = speedballBrush("E", 2);
    expect(e.tip.kind).toBe("steelBrush");
    // George's direction rule (§3.2): C and E manner-bound, B any.
    expect(speedballNib("C", 2).direction).toBe("manner");
    expect(speedballNib("B", 2).direction).toBe("any");
    expect(e.direction).toBe("manner");
  });

  it("maps pressure to pointed-tip width: hairline at lift, full swell at press", () => {
    const brush = pointedBrush("pointed", 26, 40);
    const at0 = effectiveTip(brush, 0);
    const at1 = effectiveTip(brush, 1);
    expect(at0.kind).toBe("ellipse");
    expect(at1.kind).toBe("ellipse");
    if (at0.kind === "ellipse" && at1.kind === "ellipse") {
      expect(at0.width).toBeGreaterThan(0); // never vanishes — a hairline
      expect(at0.width).toBeLessThan(26 * 0.15);
      expect(at1.width).toBeCloseTo(26, 5);
    }
  });

  it("flattens and spreads a flat brush under pressure, and splays steel harder", () => {
    const flat = effectiveTip(flatBrush("flat", 20, 4), 1);
    const steel = effectiveTip(speedballBrush("E", 0, 5), 1); // 22 wide, 4.84 thick at rest
    if (flat.kind === "rect") {
      expect(flat.width).toBeGreaterThan(20);
      expect(flat.thickness).toBeLessThan(4);
    } else throw new Error("flat brush should present a rect tip");
    if (steel.kind === "rect") {
      // Steel: width grows by 1 + 0.6p + 0.4·spread(=p) = ×2 at full press.
      expect(steel.width).toBeCloseTo(22 * 2, 4);
    } else throw new Error("steel brush should present a rect tip");
  });

  it("interpolates pressure along the swell and twists the flat-brush tip", () => {
    const swell = swellStroke(pointedBrush("pointed", 26, 40));
    const samples = sampleSpine(swell.spine, 4);
    const mid = samples.reduce((a, b) => (Math.abs(b.u - 0.5) < Math.abs(a.u - 0.5) ? b : a));
    expect(resolveTipState(swell, samples[0]).pressure).toBeCloseTo(0, 5);
    expect(resolveTipState(swell, mid).pressure).toBeGreaterThan(0.9);

    const [leftStem] = glyphBrushA(flatBrush("flat", 18, 3.5));
    const stemSamples = sampleSpine(leftStem.spine, 4);
    const stemMid = stemSamples.reduce((a, b) => (Math.abs(b.u - 0.5) < Math.abs(a.u - 0.5) ? b : a));
    const state = resolveTipState(leftStem, stemMid);
    expect(state.twistDeg).toBeCloseTo(22, 0); // the declared mid-stem flexion
    expect(state.angleDeg).toBeCloseTo(30 + 22, 0); // held angle + twist
  });

  it("bakes the swell as one fused mark, thin at the ends and fat in the middle", () => {
    const baked = bakeStroke(swellStroke(pointedBrush("pointed", 26, 40)), { step: 2 });
    expect(baked.outline.length).toBe(1);
    expect(multiPolygonArea(baked.outline)).toBeGreaterThan(400);
    const first = tipExtent(baked.tips[0]);
    const middle = tipExtent(baked.tips[Math.floor(baked.tips.length / 2)]);
    expect(middle).toBeGreaterThan(first * 3);
  });

  it("bakes the flat-brush A to a single fused glyph", () => {
    const baked = bakeGlyph(glyphBrushA(flatBrush("flat", 18, 3.5)), { step: 2 });
    const ink = baked.groups.get("ink")!;
    expect(ink.length).toBe(1);
    expect(multiPolygonArea(ink)).toBeGreaterThan(1500);
  });
});
