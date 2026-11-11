// Composite spines — the FMStroke model, ported from Floating Marker
// via NibGlider's NGCompositePath (see docs/SPEC.md §4.5).
//
// A spine is authored as SEMANTIC points, not raw spline controls:
// each point declares what it is (a spline point the curve flows
// through near, a hard corner, a rounded corner with a radius), and
// what its outgoing segment is (line, spline, a bowed line, an arc).
// Three-point arcs pass through a declared through point, so a bowl
// can be a true circular arc from construction points. Expansion
// (FM's multiplicity trick) turns the semantic points into a sampled
// centreline: spline point = 1 B-spline control, rounded corner = 2,
// hard corner = 3 coincident controls; the sampled centreline is then
// resampled uniformly so tip-state keyframes interpolate by arc
// position. The semantic points are the authoring truth; everything
// below them is derived and may be regenerated.
import type { Pt, Spine, StrokePoint } from "./types.js";

export type CompositePointKind =
  | "spline" // curve flows smoothly (1 control)
  | "corner" // hard cusp (3 coincident controls)
  | "round" // rounded corner (2 controls, or radius trim — see corner)
  | "line" // vertex on a straight run
  | "bowed" // rounded-like vertex (2 controls); its outgoing segment bows
  | "arcThrough"; // this point is the through point of a 3-point arc

export interface CompositeCorner {
  rounding: "arc" | "bSpline" | "bevel";
  radius: number;
}

export interface CompositeOutgoing {
  kind: "inherit" | "line" | "spline" | "bowed" | "arc";
  /** Bowed segments: peak offset from the chord (default: chord/4). */
  bowOffset?: number;
  /** Bowed segments: which side of travel the peak bows to. */
  bowFacing?: "left" | "right";
}

export interface CompositePoint extends Pt {
  kind?: CompositePointKind;
  corner?: CompositeCorner;
  outgoing?: CompositeOutgoing;
  // Tip-state keyframes (penpos channels) declared at this point;
  // carried through expansion onto the resolved stroke.
  angleDeg?: number;
  widthFactor?: number;
  pressure?: number;
  twistDeg?: number;
  spread?: number;
}

export interface CompositeSpine {
  points: CompositePoint[];
  closed?: boolean;
}

// ---------------------------------------------------------------------------
// Sampling (uniform cubic B-spline + cubics, adaptive by chord deviation)

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function appendDistinct(points: Pt[], point: Pt): void {
  if (!points.length || dist(points[points.length - 1], point) > 1e-9) points.push({ ...point });
}

function chordDistance(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

function sampleCurve(evaluate: (t: number) => Pt, breaks: number[], tolerance = 0.35, maxDepth = 12): Pt[] {
  const result: Pt[] = [];
  function span(a: number, b: number, p: Pt, q: Pt, depth: number): void {
    const m = (a + b) / 2;
    const mp = evaluate(m);
    const deviation = Math.max(
      chordDistance(mp, p, q),
      chordDistance(evaluate((3 * a + b) / 4), p, q),
      chordDistance(evaluate((a + 3 * b) / 4), p, q),
    );
    if (deviation > tolerance && depth < maxDepth) {
      span(a, m, p, mp, depth + 1);
      span(m, b, mp, q, depth + 1);
    } else appendDistinct(result, q);
  }
  if (!breaks.length) return result;
  appendDistinct(result, evaluate(breaks[0]));
  for (let i = 1; i < breaks.length; i++) span(breaks[i - 1], breaks[i], evaluate(breaks[i - 1]), evaluate(breaks[i]), 0);
  return result;
}

export function sampleBSpline(controls: Pt[], closed = false, tolerance = 0.35): Pt[] {
  if (!controls.length) return [];
  if (controls.length === 1) return [{ ...controls[0] }];
  if (closed && controls.length >= 3) {
    const n = controls.length;
    const get = (i: number) => controls[((i % n) + n) % n];
    const evaluate = (value: number): Pt => {
      const i = Math.floor(value), t = value - i;
      const w = [(1 - t) ** 3 / 6, (3 * t ** 3 - 6 * t * t + 4) / 6, (-3 * t ** 3 + 3 * t * t + 3 * t + 1) / 6, t ** 3 / 6];
      const p = { x: 0, y: 0 };
      w.forEach((wi, j) => { p.x += get(i + j - 1).x * wi; p.y += get(i + j - 1).y * wi; });
      return p;
    };
    const samples = sampleCurve(evaluate, Array.from({ length: n + 1 }, (_, i) => i), tolerance);
    if (samples.length > 1 && dist(samples[0], samples[samples.length - 1]) <= 1e-9) samples.pop();
    return samples;
  }
  const n = controls.length;
  const degree = Math.min(3, n - 1);
  const end = n - degree;
  const knots = Array.from({ length: n + degree + 1 }, (_, i) => (i <= degree ? 0 : i >= n ? end : i - degree));
  const evaluate = (t: number): Pt => {
    const k = t >= end ? n - 1 : degree + Math.floor(t);
    const d = Array.from({ length: degree + 1 }, (_, j) => ({ ...controls[k - degree + j] }));
    for (let r = 1; r <= degree; r++) {
      for (let j = degree; j >= r; j--) {
        const left = knots[k - degree + j], right = knots[k + 1 + j - r];
        const alpha = right === left ? 0 : (t - left) / (right - left);
        d[j] = { x: (1 - alpha) * d[j - 1].x + alpha * d[j].x, y: (1 - alpha) * d[j - 1].y + alpha * d[j].y };
      }
    }
    return d[degree];
  };
  return sampleCurve(evaluate, Array.from({ length: end + 1 }, (_, i) => i), tolerance);
}

function sampleCubic(from: Pt, c1: Pt, c2: Pt, to: Pt, tolerance = 0.35): Pt[] {
  return sampleCurve((t) => {
    const u = 1 - t;
    return {
      x: u ** 3 * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * to.x,
      y: u ** 3 * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * to.y,
    };
  }, [0, 1], tolerance);
}

// ---------------------------------------------------------------------------
// Circular arcs through three points

export interface ArcInfo { center: Pt; radius: number; startAngle: number; sweep: number }

export function arcThroughPoints(a: Pt, b: Pt, c: Pt): ArcInfo | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-9) return null;
  const a2 = a.x * a.x + a.y * a.y, b2 = b.x * b.x + b.y * b.y, c2 = c.x * c.x + c.y * c.y;
  const center = {
    x: (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d,
    y: (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d,
  };
  const radius = Math.hypot(a.x - center.x, a.y - center.y);
  if (!(radius > 0)) return null;
  const startAngle = Math.atan2(a.y - center.y, a.x - center.x);
  const midAngle = Math.atan2(b.y - center.y, b.x - center.x);
  const endAngle = Math.atan2(c.y - center.y, c.x - center.x);
  const twoPi = Math.PI * 2;
  const norm = (v: number) => ((v % twoPi) + twoPi) % twoPi;
  const ccw = norm(endAngle - startAngle);
  const midCcw = norm(midAngle - startAngle);
  const sweep = midCcw <= ccw ? ccw : ccw - twoPi;
  if (Math.abs(sweep) < 1e-9) return null;
  return { center, radius, startAngle, sweep };
}

function sampleArc(info: ArcInfo, tolerance = 0.35): Pt[] {
  const steps = Math.max(2, Math.ceil(Math.abs(info.sweep) / (Math.PI / 10)));
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = info.startAngle + (info.sweep * i) / steps;
    pts.push({ x: info.center.x + info.radius * Math.cos(a), y: info.center.y + info.radius * Math.sin(a) });
  }
  void tolerance;
  return pts;
}

// ---------------------------------------------------------------------------
// Expansion: semantic points -> centreline commands -> uniform samples

type Command =
  | { kind: "line"; from: Pt; to: Pt }
  | { kind: "splineControls"; points: Pt[]; closed: boolean }
  | { kind: "cubic"; from: Pt; c1: Pt; c2: Pt; to: Pt }
  | { kind: "arc"; info: ArcInfo };

interface Vertex { entry: Pt; exit: Pt; repeats: number; corner: Command[] }

function vertex(point: CompositePoint, previous?: CompositePoint, next?: CompositePoint): Vertex {
  const kind = point.kind ?? "spline";
  const result: Vertex = {
    entry: { x: point.x, y: point.y },
    exit: { x: point.x, y: point.y },
    repeats: kind === "corner" ? 3 : kind === "round" || kind === "bowed" ? 2 : 1,
    corner: [],
  };
  if (kind === "round" && point.corner?.radius === 0) result.repeats = 3;
  if (kind !== "round" || !previous || !next || !point.corner?.radius) return result;
  const incoming = dist(previous, point), outgoing = dist(point, next);
  if (incoming < 1e-9 || outgoing < 1e-9) return result;
  const u = { x: (previous.x - point.x) / incoming, y: (previous.y - point.y) / incoming };
  const v = { x: (next.x - point.x) / outgoing, y: (next.y - point.y) / outgoing };
  const theta = Math.acos(Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y)));
  if (theta < 1e-6 || Math.PI - theta < 1e-6) return result;
  const trim = Math.min(point.corner.radius / Math.tan(theta / 2), incoming / 2, outgoing / 2);
  result.entry = { x: point.x + u.x * trim, y: point.y + u.y * trim };
  result.exit = { x: point.x + v.x * trim, y: point.y + v.y * trim };
  if (point.corner.rounding === "bevel") {
    result.corner = [{ kind: "line", from: result.entry, to: result.exit }];
  } else if (point.corner.rounding === "bSpline") {
    result.corner = [{ kind: "splineControls", points: [result.entry, { x: point.x, y: point.y }, { x: point.x, y: point.y }, result.exit], closed: false }];
  } else {
    // Rounding arc: tangent to both legs, centre on the bisector.
    const radius = trim * Math.tan(theta / 2);
    const bisLen = Math.hypot(u.x + v.x, u.y + v.y);
    const centerDist = radius / Math.sin(theta / 2);
    const center = { x: point.x + ((u.x + v.x) / bisLen) * centerDist, y: point.y + ((u.y + v.y) / bisLen) * centerDist };
    const midAngle = Math.atan2(point.y - center.y, point.x - center.x);
    const info = arcThroughPoints(result.entry, { x: center.x + radius * Math.cos(midAngle), y: center.y + radius * Math.sin(midAngle) }, result.exit);
    if (info) result.corner = [{ kind: "arc", info }];
    else result.corner = [{ kind: "line", from: result.entry, to: result.exit }];
  }
  return result;
}

/** Unit normal to the LEFT of travel (y-up: rotate direction by +90°). */
function leftNormal(from: Pt, to: Pt): Pt {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (!(len > 1e-9)) return { x: 0, y: 1 };
  return { x: -dy / len, y: dx / len };
}

function bowedCubic(from: Pt, to: Pt, outgoing?: CompositeOutgoing): Command {
  const len = dist(from, to);
  const offset = outgoing?.bowOffset ?? len * 0.25;
  const side = (outgoing?.bowFacing ?? "left") === "left" ? 1 : -1;
  const n = leftNormal(from, to);
  const peak = { x: (from.x + to.x) / 2 + n.x * offset * side, y: (from.y + to.y) / 2 + n.y * offset * side };
  const q = { x: 2 * peak.x - (from.x + to.x) / 2, y: 2 * peak.y - (from.y + to.y) / 2 };
  return {
    kind: "cubic", from: { ...from }, to: { ...to },
    c1: { x: from.x + (2 / 3) * (q.x - from.x), y: from.y + (2 / 3) * (q.y - from.y) },
    c2: { x: to.x + (2 / 3) * (q.x - to.x), y: to.y + (2 / 3) * (q.y - to.y) },
  };
}

export function expandCompositeCommands(cs: CompositeSpine): Command[] {
  const points = cs.points;
  const n = points.length;
  if (n < 2) return [];
  const closed = !!cs.closed;
  const vertices = points.map((p, i) => vertex(p,
    i ? points[i - 1] : closed ? points[n - 1] : undefined,
    i + 1 < n ? points[i + 1] : closed ? points[0] : undefined));
  const kindOf = (p: CompositePoint) => p.kind ?? "spline";
  const isLine = (i: number) => points[i].outgoing?.kind === "line" || (kindOf(points[i]) === "line" && (!points[i].outgoing || points[i].outgoing.kind === "inherit"));
  const isBowed = (i: number) => points[i].outgoing?.kind === "bowed" || kindOf(points[i]) === "bowed";
  const isArcChord = (i: number) => points[i].outgoing?.kind === "arc";
  const hasSpecial = points.some((p, i) => isBowed(i) || isArcChord(i) || kindOf(p) === "arcThrough");
  if (closed && !hasSpecial && vertices.every((v, i) => !v.corner.length && !isLine(i))) {
    return [{ kind: "splineControls", closed: true, points: vertices.flatMap((v) => Array.from({ length: v.repeats }, () => ({ ...v.exit }))) }];
  }
  const commands: Command[] = [];
  let controls: Pt[] = [];
  const append = (v: Vertex, point: Pt) => { for (let r = 0; r < v.repeats; r++) controls.push({ ...point }); };
  const flush = () => { if (controls.length > 1) commands.push({ kind: "splineControls", points: controls, closed: false }); controls = []; };
  const totalSteps = closed ? n : n - 1;
  append(vertices[0], vertices[0].exit);
  let step = 0;
  while (step < totalSteps) {
    const i = step % n, j = (i + 1) % n;
    const a = vertices[i], b = vertices[j];
    // Three-point arc: points[j] is the through point, points[k] the end.
    const k = (j + 1) % n;
    if (kindOf(points[j]) === "arcThrough" && step + 2 <= totalSteps) {
      flush();
      const info = arcThroughPoints(a.exit, { x: points[j].x, y: points[j].y }, vertices[k].entry);
      if (info) commands.push({ kind: "arc", info });
      else {
        commands.push({ kind: "line", from: { ...a.exit }, to: { x: points[j].x, y: points[j].y } });
        commands.push({ kind: "line", from: { x: points[j].x, y: points[j].y }, to: { ...vertices[k].entry } });
      }
      append(vertices[k], vertices[k].entry);
      if (vertices[k].corner.length) { flush(); commands.push(...vertices[k].corner); append(vertices[k], vertices[k].exit); }
      step += 2;
      continue;
    }
    if (isBowed(i)) {
      flush();
      commands.push(bowedCubic(a.exit, b.entry, points[i].outgoing));
      append(b, b.entry);
    } else if (isArcChord(i)) {
      flush();
      const len = dist(a.exit, b.entry);
      const nrm = leftNormal(a.exit, b.entry);
      const through = { x: (a.exit.x + b.entry.x) / 2 + nrm.x * (len / 2), y: (a.exit.y + b.entry.y) / 2 + nrm.y * (len / 2) };
      const info = arcThroughPoints(a.exit, through, b.entry);
      if (info) commands.push({ kind: "arc", info });
      else commands.push({ kind: "line", from: { ...a.exit }, to: { ...b.entry } });
      append(b, b.entry);
    } else if (isLine(i)) {
      flush();
      commands.push({ kind: "line", from: { ...a.exit }, to: { ...b.entry } });
      append(b, b.entry);
    } else append(b, b.entry);
    if (b.corner.length) { flush(); commands.push(...b.corner); append(b, b.exit); }
    step += 1;
  }
  flush();
  return commands;
}

function sampleCommand(cmd: Command): Pt[] {
  switch (cmd.kind) {
    case "line": return [{ ...cmd.from }, { ...cmd.to }];
    case "cubic": return sampleCubic(cmd.from, cmd.c1, cmd.c2, cmd.to);
    case "arc": return sampleArc(cmd.info);
    case "splineControls": return sampleBSpline(cmd.points, cmd.closed);
  }
}

/** Uniform arc-length resample of a polyline. */
function resampleUniform(pts: Pt[], step: number, closed: boolean): Pt[] {
  if (pts.length < 2) return pts.slice();
  const out: Pt[] = [{ ...pts[0] }];
  let carry = 0;
  const total = closed ? pts.length : pts.length - 1;
  for (let s = 0; s < total; s++) {
    const a = pts[s], b = pts[(s + 1) % pts.length];
    let segLen = dist(a, b);
    let t = step - carry;
    while (t < segLen) {
      const f = t / segLen;
      out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
      t += step;
    }
    carry = segLen - (t - step);
    if (segLen === 0) carry = step - 0; // degenerate; avoid stall
  }
  if (!closed) {
    const last = pts[pts.length - 1];
    if (dist(out[out.length - 1], last) > 1e-6) out.push({ ...last });
  }
  return out;
}

export interface ExpandedComposite {
  spine: Spine;
  /** Tip-state keyframes, node indices into spine.nodes. */
  points: StrokePoint[];
}

/**
 * Expand a composite spine into the plain Spine + StrokePoint form the
 * bake consumes. `markIndex` records, per semantic point, the sample
 * index its position landed on (for keyframe mapping and tooling).
 */
export function expandCompositeSpine(cs: CompositeSpine, opts: { resampleStep?: number; tolerance?: number } = {}): ExpandedComposite {
  const commands = expandCompositeCommands(cs);
  const raw: Pt[] = [];
  for (const cmd of commands) for (const p of sampleCommand(cmd)) appendDistinct(raw, p);
  if (cs.closed && raw.length > 1 && dist(raw[0], raw[raw.length - 1]) <= 1e-9) raw.pop();
  const nodes = resampleUniform(raw, opts.resampleStep ?? 4, !!cs.closed);
  // StrokeCore spines are open polylines; a closed composite closes
  // explicitly by repeating its first node as the last.
  if (cs.closed && nodes.length > 1) nodes.push({ ...nodes[0] });
  const spine: Spine = {
    nodes,
    segments: Array.from({ length: Math.max(0, nodes.length - 1) }, () => ({ kind: "line" as const })),
  };
  // Map each semantic point that carries tip state to its nearest node.
  const points: StrokePoint[] = [];
  cs.points.forEach((p) => {
    const hasState = p.angleDeg !== undefined || p.widthFactor !== undefined || p.pressure !== undefined || p.twistDeg !== undefined || p.spread !== undefined;
    if (!hasState) return;
    let best = 0, bestD = Infinity;
    nodes.forEach((nd, idx) => { const d = dist(nd, p); if (d < bestD) { bestD = d; best = idx; } });
    const sp: StrokePoint = { node: best };
    if (p.angleDeg !== undefined) sp.angleDeg = p.angleDeg;
    if (p.widthFactor !== undefined) sp.widthFactor = p.widthFactor;
    if (p.pressure !== undefined) sp.pressure = p.pressure;
    if (p.twistDeg !== undefined) sp.twistDeg = p.twistDeg;
    if (p.spread !== undefined) sp.spread = p.spread;
    points.push(sp);
  });
  return { spine, points };
}
