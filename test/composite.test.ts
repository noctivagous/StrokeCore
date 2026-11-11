import { describe, expect, it } from "vitest";
import { arcThroughPoints, expandCompositeSpine, type CompositeSpine } from "../src/composite.js";

const P = (x: number, y: number, extra: object = {}) => ({ x, y, ...extra });
const cs = (points: CompositeSpine["points"], closed = false): CompositeSpine => ({ points, closed });

describe("composite spine expansion (FMStroke model)", () => {
  it("a hard corner stays a cusp: the centreline passes through it and turns sharply", () => {
    const { spine } = expandCompositeSpine(cs([P(0, 0), { x: 100, y: 0, kind: "corner" }, P(100, 100)]));
    const near = spine.nodes.filter((p) => Math.hypot(p.x - 100, p.y) < 2);
    expect(near.length).toBeGreaterThan(0);
    // direction change across the corner
    const idx = spine.nodes.findIndex((p) => Math.hypot(p.x - 100, p.y) < 2);
    const before = spine.nodes[Math.max(0, idx - 3)], after = spine.nodes[Math.min(spine.nodes.length - 1, idx + 3)];
    const turn = Math.abs(Math.atan2(after.y - 100, after.x - 100) - Math.atan2(before.y - 0, before.x - 100));
    expect(turn).toBeGreaterThan(0.8);
  });

  it("a three-point arc lies on its circle", () => {
    const a = { x: 0, y: 0 }, through = { x: 50, y: 25 }, c = { x: 100, y: 0 };
    const info = arcThroughPoints(a, through, c)!;
    expect(info).not.toBeNull();
    const { spine } = expandCompositeSpine(cs([a, { ...through, kind: "arcThrough" }, c]));
    for (const p of spine.nodes) {
      expect(Math.abs(Math.hypot(p.x - info.center.x, p.y - info.center.y) - info.radius)).toBeLessThan(1.2);
    }
  });

  it("a bowed segment peaks at its bow offset, on the facing side", () => {
    const { spine } = expandCompositeSpine(cs([
      { x: 0, y: 0, outgoing: { kind: "bowed", bowOffset: 30, bowFacing: "left" } },
      P(100, 0),
    ]));
    const midY = Math.max(...spine.nodes.map((p) => p.y));
    expect(midY).toBeGreaterThan(26);
    expect(midY).toBeLessThan(34);
  });

  it("a rounded corner with radius trims the vertex instead of passing through it", () => {
    const { spine } = expandCompositeSpine(cs([
      P(0, 0),
      { x: 100, y: 0, kind: "round", corner: { rounding: "arc", radius: 24 } },
      P(100, 100),
    ]));
    const closest = Math.min(...spine.nodes.map((p) => Math.hypot(p.x - 100, p.y)));
    expect(closest).toBeGreaterThan(4); // trimmed away from the sharp vertex
    expect(closest).toBeLessThan(24);
  });

  it("a closed spline loop closes explicitly (last node repeats the first)", () => {
    const { spine } = expandCompositeSpine(cs([P(0, 100), P(100, 200), P(200, 100), P(100, 0)], true));
    expect(spine.nodes.length).toBeGreaterThan(20);
    const first = spine.nodes[0], last = spine.nodes[spine.nodes.length - 1];
    expect(Math.hypot(first.x - last.x, first.y - last.y)).toBeLessThan(1e-6);
  });

  it("tip-state keyframes declared on composite points survive expansion", () => {
    const { points } = expandCompositeSpine(cs([
      { x: 0, y: 0, pressure: 0.1 },
      { x: 60, y: 40, pressure: 0.9 },
      { x: 120, y: 0, pressure: 0.2 },
    ]));
    expect(points.map((p) => p.pressure)).toEqual([0.1, 0.9, 0.2]);
    expect(points[1].node).toBeGreaterThan(points[0].node);
    expect(points[2].node).toBeGreaterThan(points[1].node);
  });
});
