import type { Pt, Spine } from "./types.js";

export const pt = (x: number, y: number): Pt => ({ x, y });
export const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Pt, s: number): Pt => ({ x: a.x * s, y: a.y * s });
export const dist = (a: Pt, b: Pt): number => Math.hypot(b.x - a.x, b.y - a.y);

export const deg2rad = (d: number): number => (d * Math.PI) / 180;
export const rad2deg = (r: number): number => (r * 180) / Math.PI;

export function normDeg(d: number): number {
  let r = d % 360;
  if (r < 0) r += 360;
  return r;
}

/** Interpolate angles by the shortest circular path. */
export function lerpAngleDeg(a: number, b: number, t: number): number {
  let delta = normDeg(b) - normDeg(a);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return normDeg(a + delta * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function rotate(p: Pt, angleDeg: number): Pt {
  const r = deg2rad(angleDeg);
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

function cubicAt(p0: Pt, c1: Pt, c2: Pt, p1: Pt, t: number): Pt {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return {
    x: w0 * p0.x + w1 * c1.x + w2 * c2.x + w3 * p1.x,
    y: w0 * p0.y + w1 * c1.y + w2 * c2.y + w3 * p1.y,
  };
}

export interface SpineSample {
  point: Pt;
  /** Global parameter: segment i occupies [i/(n-1), (i+1)/(n-1)]. */
  u: number;
  tangentDeg: number;
}

/**
 * Sample a spine at roughly `step` font units. Each segment gets an equal
 * share of the global parameter u, so StrokePoints (declared per node)
 * interpolate segment by segment.
 */
export function sampleSpine(spine: Spine, step: number): SpineSample[] {
  const segCount = spine.nodes.length - 1;
  if (segCount < 1) return [];
  const samples: SpineSample[] = [];
  for (let i = 0; i < segCount; i++) {
    const a = spine.nodes[i];
    const b = spine.nodes[i + 1];
    const seg = spine.segments[i];
    let approxLen: number;
    if (seg.kind === "line") {
      approxLen = dist(a, b);
    } else {
      approxLen =
        (dist(a, seg.c1) + dist(seg.c1, seg.c2) + dist(seg.c2, b) + dist(a, b)) / 2;
    }
    const n = Math.max(1, Math.ceil(approxLen / step));
    for (let j = i === 0 ? 0 : 1; j <= n; j++) {
      const t = j / n;
      let p: Pt;
      let tangentDeg: number;
      if (seg.kind === "line") {
        p = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
        tangentDeg = rad2deg(Math.atan2(b.y - a.y, b.x - a.x));
      } else {
        p = cubicAt(a, seg.c1, seg.c2, b, t);
        const e = 0.001;
        const pA = cubicAt(a, seg.c1, seg.c2, b, Math.max(0, t - e));
        const pB = cubicAt(a, seg.c1, seg.c2, b, Math.min(1, t + e));
        tangentDeg = rad2deg(Math.atan2(pB.y - pA.y, pB.x - pA.x));
      }
      samples.push({ point: p, u: (i + t) / segCount, tangentDeg });
    }
  }
  return samples;
}

/** Shoelace area of a ring (signed). */
export function ringArea(ring: [number, number][]): number {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/** Douglas–Peucker simplification of an open polyline. */
export function simplifyLine(
  points: [number, number][],
  tolerance: number,
): [number, number][] {
  if (points.length <= 2 || tolerance <= 0) return points.slice();
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    let maxD = 0;
    let maxI = -1;
    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i];
      const d =
        lenSq === 0
          ? Math.hypot(px - ax, py - ay)
          : Math.abs(dy * px - dx * py + bx * ay - by * ax) / Math.sqrt(lenSq);
      if (d > maxD) {
        maxD = d;
        maxI = i;
      }
    }
    if (maxD > tolerance && maxI > 0) {
      keep[maxI] = true;
      stack.push([first, maxI], [maxI, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Simplify a closed ring: anchor at vertex 0, simplify as an open chain. */
export function simplifyRing(
  ring: [number, number][],
  tolerance: number,
): [number, number][] {
  if (ring.length <= 3 || tolerance <= 0) return ring;
  const open: [number, number][] = [...ring, ring[0]];
  const simplified = simplifyLine(open, tolerance);
  simplified.pop(); // drop the duplicated closing point
  return simplified.length >= 3 ? simplified : ring;
}
