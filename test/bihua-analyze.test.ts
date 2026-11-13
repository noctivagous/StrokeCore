// Analytical engine self-tests: the measures must be right before
// their verdicts mean anything — identity scores perfect, a known
// shift degrades the boundary distance by about the shift, and a
// width profile reads a synthetic taper.

import { describe, expect, it } from "vitest";
import type { MultiPolygon } from "../src/index.js";
import {
  boundaryDistance,
  inkWidthAt,
  spineOvershoot,
} from "../src/bihua/index.js";

const rect = (x0: number, y0: number, x1: number, y1: number): MultiPolygon =>
  [[[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]] as MultiPolygon;

describe("boundary distance", () => {
  it("is zero for identical ink", () => {
    const a = rect(100, 100, 300, 200);
    const d = boundaryDistance(a, a);
    expect(d.mean).toBeLessThan(1.5); // sampling granularity only
  });
  it("recovers a known shift", () => {
    const a = rect(100, 100, 300, 200);
    const b = rect(120, 120, 320, 220); // shifted (20, 20): every edge stands off
    const d = boundaryDistance(a, b);
    expect(d.mean).toBeGreaterThan(10);
    expect(d.mean).toBeLessThan(30);
    expect(d.p95).toBeGreaterThan(16);
  });
});

describe("width profile", () => {
  it("reads the width of a straight band", () => {
    const ink = rect(100, 470, 900, 530); // 60 tall
    const spine = [{ x: 100, y: 500 }, { x: 900, y: 500 }];
    expect(inkWidthAt(ink, spine, 0.5)).toBeGreaterThan(52);
    expect(inkWidthAt(ink, spine, 0.5)).toBeLessThan(68);
  });
  it("reads a taper: narrow at the exit, wide at the entry", () => {
    // Triangle ink: height 120 at x=100 shrinking to 10 at x=900.
    const tri = [[[[100, 440], [900, 495], [900, 505], [100, 560], [100, 440]]]] as MultiPolygon;
    const spine = [{ x: 100, y: 500 }, { x: 900, y: 500 }];
    expect(inkWidthAt(tri, spine, 0.08)).toBeGreaterThan(90);
    expect(inkWidthAt(tri, spine, 0.92)).toBeLessThan(30);
  });
});

describe("spine overshoot", () => {
  it("a pinned right-angle corner stays near zero", () => {
    const spine = [
      { x: 100, y: 800 }, { x: 300, y: 800 }, { x: 500, y: 800 },
      { x: 505, y: 500 }, { x: 500, y: 200 },
    ];
    // Corner at index 2, previous key point index 0.
    expect(spineOvershoot(spine, 2, 0)).toBeLessThan(6);
  });
});
