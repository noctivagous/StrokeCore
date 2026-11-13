// Brush-behaviour tests for the two specimen findings (owner,
// 2026-11-12): corners must pivot, not overlap; and the flat brush's
// size must answer pressure, not only its angle.

import { describe, expect, it } from "vitest";
import polygonClipping from "polygon-clipping";
import { multiPolygonArea } from "../src/index.js";
import {
  bakeBihuaStroke,
  cornerTension,
  flatBrushStyle,
  smoothSpine,
  yong,
  type BihuaStroke,
} from "../src/bihua/index.js";

function cubicMaxY(stroke: BihuaStroke): number {
  const s = smoothSpine(stroke.spine);
  let maxY = -Infinity;
  s.segments.forEach((seg, i) => {
    if (seg.kind !== "cubic") return;
    const p0 = s.nodes[i], p1 = s.nodes[i + 1];
    for (let k = 0; k <= 40; k++) {
      const t = k / 40, u = 1 - t;
      const y = u ** 3 * p0.y + 3 * u * u * t * seg.c1.y + 3 * u * t * t * seg.c2.y + t ** 3 * p1.y;
      if (y > maxY) maxY = y;
    }
  });
  return maxY;
}

describe("corner joints", () => {
  it("tension falls as the turn sharpens", () => {
    expect(cornerTension(5)).toBe(1);
    expect(cornerTension(60)).toBeLessThan(0.4);
    expect(cornerTension(120)).toBe(0.08);
  });
  it("永's 横折钩 spine no longer bulges past its corner", () => {
    const stroke = yong.strokes[1];
    const nodeMax = Math.max(...stroke.spine.map((p) => p.y));
    // Plain Catmull-Rom overshot the corner by ~27 units; the ink
    // then read as one stroke laid over another.
    expect(cubicMaxY(stroke) - nodeMax).toBeLessThanOrEqual(4);
  });
  it("a gentle curve keeps its smoothing (a 撇 is not pinned)", () => {
    const pie = yong.strokes[3];
    const s = smoothSpine(pie.spine);
    // Interior segments stay cubic with real control offsets.
    const seg = s.segments[1];
    expect(seg.kind).toBe("cubic");
    if (seg.kind === "cubic") {
      const off = Math.hypot(seg.c1.x - s.nodes[1].x, seg.c1.y - s.nodes[1].y);
      expect(off).toBeGreaterThan(5);
    }
  });
});

describe("flat brush size answers pressure", () => {
  const zone = (cx: number, cy: number, half: number) => [
    [[cx - half, cy - half], [cx + half, cy - half], [cx + half, cy + half], [cx - half, cy + half], [cx - half, cy - half]],
  ] as unknown as Parameters<typeof polygonClipping.intersection>[0];

  function zoneAreas(pressure: [number, number, number]) {
    const stroke: BihuaStroke = {
      form: "na",
      spine: [{ x: 200, y: 800 }, { x: 500, y: 500 }, { x: 800, y: 200 }],
      pressure: [...pressure],
      segments: [{ form: "na", span: [0, 2] }],
      provenance: "authored",
    };
    const ink = bakeBihuaStroke(stroke, "flat-test", flatBrushStyle).outline;
    const entry = multiPolygonArea(polygonClipping.intersection(ink, zone(260, 740, 95)));
    const foot = multiPolygonArea(polygonClipping.intersection(ink, zone(740, 260, 95)));
    return { entry, foot };
  }

  it("a pressed foot lays more ink than a light entry", { timeout: 60_000 }, () => {
    const { entry, foot } = zoneAreas([0.3, 0.7, 1.0]);
    expect(foot).toBeGreaterThan(entry * 1.3);
  });
  it("constant pressure lays near-constant ink (direction alone does not fake it)", { timeout: 60_000 }, () => {
    const { entry, foot } = zoneAreas([0.65, 0.65, 0.65]);
    expect(foot).toBeLessThan(entry * 1.3);
    expect(entry).toBeLessThan(foot * 1.3);
  });
});
