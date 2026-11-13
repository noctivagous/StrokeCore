// The MetaPost oracle (docs/ORACLE.md): an independent, exact
// envelope solver checked against our stamp-and-union bake.
//
// For each sampled stroke, the stroke record is translated into a
// MetaPost program that sweeps the SAME tip along the SAME spine,
// and MetaPost computes the envelope analytically (penstroke / draw
// withpen). The SVG it emits is parsed back into polygons and
// compared with our bake's outline for that stroke: IoU, area
// delta, bbox delta. Per-glyph rows union the per-stroke results.
//
// Translation routes (classified per stroke, reported in the output):
//   A  constant tip state        -> draw spine withpen makepen(tip)
//   B  angle/widthFactor vary,   -> penpos per node + penstroke,
//      tip shape constant           plus full tip fills at both ends
//                                   (our model's caps are full tip
//                                   stamps; penstroke's are diameter
//                                   segments — measured, docs/ORACLE.md)
//   F  dab (spine < 3 units)     -> fill the tip polygon at the centre
//   X  tip SHAPE varies (pressure/spread channels) or tangentRelative
//      angle mode                 -> MetaPost's pen model cannot say
//                                   this; counted, not faked.
//
// Usage: node scripts/oracle.mjs [--keep]   (work files in demo/oracle/)
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  foundationalFont, imperialFont, frakturFont, gothicFont, durerFont,
  loadStrokeFont, resolveGlyphStrokes, bakeFontGlyph,
} from "../dist/index.js";
import { bakeStroke, multiPolygonArea } from "../dist/bake.js";
import { effectiveTip } from "../dist/tool.js";

const require = createRequire(import.meta.url);
const pc = require("polygon-clipping");

const WORK = new URL("../demo/oracle/", import.meta.url).pathname;
mkdirSync(WORK, { recursive: true });
const TMP = join(tmpdir(), `sc-oracle-${process.pid}`);
mkdirSync(TMP, { recursive: true });
const KEEP = process.argv.includes("--keep");

// ---------- tip-state machinery (mirrors bake.ts keyframe rules) ----------
function nodeStates(stroke) {
  const n = stroke.spine.nodes.length;
  const chan = (pick, dflt) => {
    const defined = new Map();
    for (const p of stroke.points ?? []) {
      const v = pick(p);
      if (v !== undefined) defined.set(p.node, v);
    }
    return Array.from({ length: n }, (_, i) => {
      if (defined.has(i)) return defined.get(i);
      if (defined.size === 0) return dflt;
      let lo = -1, hi = -1;
      for (const k of defined.keys()) { if (k < i) lo = Math.max(lo, k); if (k > i && hi < 0) hi = k; }
      if (lo < 0) return defined.get(hi);
      if (hi < 0) return defined.get(lo);
      const t = (i - lo) / (hi - lo);
      return defined.get(lo) + (defined.get(hi) - defined.get(lo)) * t;
    });
  };
  const angle = chan((p) => p.angleDeg, stroke.angleDeg ?? 0);
  const twist = chan((p) => p.twistDeg, 0);
  const wf = chan((p) => p.widthFactor, 1);
  const pressure = chan((p) => p.pressure, 0);
  const spread = chan((p) => p.spread, undefined);
  return stroke.spine.nodes.map((_, i) => ({
    angle: angle[i] + twist[i],
    wf: wf[i],
    tip: effectiveTip(stroke.tool, pressure[i], spread[i]),
  }));
}
const tipDims = (t) => t.kind === "polygon" ? `poly${t.points.length}` : `${t.kind}:${t.width}x${t.thickness ?? t.height ?? t.maxWidth}`;
const sameTip = (a, b) => tipDims(a) === tipDims(b);

/** The tip as a polygon in tip space (unrotated), scaled by wf.
 *  Ellipses get 128 sides: the oracle should be MORE exact than the
 *  bake's default 28, so the difference measures our discretization. */
function tipPolygon(tip, wf = 1) {
  if (tip.kind === "rect")
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => [sx * tip.width / 2 * wf, sy * tip.thickness / 2 * wf]);
  if (tip.kind === "ellipse") {
    const pts = [];
    for (let i = 0; i < 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push([Math.cos(a) * tip.width / 2 * wf, Math.sin(a) * tip.height / 2 * wf]);
    }
    return pts;
  }
  if (tip.kind === "polygon") return tip.points.map((p) => [p.x * wf, p.y * wf]);
  throw new Error(`tip kind ${tip.kind} should have been resolved by effectiveTip`);
}
const rot = ([x, y], deg) => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};
const fmt = (v) => (+v.toFixed(3)).toString();
const pt = (p) => `(${fmt(p.x ?? p[0])},${fmt(p.y ?? p[1])})`;

function spinePath(spine) {
  let d = pt(spine.nodes[0]);
  spine.segments.forEach((seg, i) => {
    const to = spine.nodes[i + 1];
    d += seg.kind === "line" ? `--${pt(to)}` : `..controls ${pt(seg.c1)} and ${pt(seg.c2)}..${pt(to)}`;
  });
  return d;
}
const penPath = (poly) => `makepen((${poly.map((p) => pt(p)).join("--")}--cycle))`;
const fillPath = (poly, centre, angleDeg) =>
  `fill (${poly.map((p) => pt(rot(p, angleDeg))).join("--")}--cycle) shifted ${pt(centre)};`;

function classify(stroke, states) {
  const nodes = stroke.spine.nodes;
  let len = 0;
  for (let i = 0; i < nodes.length - 1; i++)
    len += Math.hypot(nodes[i + 1].x - nodes[i].x, nodes[i + 1].y - nodes[i].y);
  if (len < 3) return "F";
  if (stroke.angleMode === "tangentRelative") return "X";
  const shapeVaries = states.some((s) => !sameTip(s.tip, states[0].tip));
  if (shapeVaries) return "X";
  const stateVaries = states.some((s) => Math.abs(s.angle - states[0].angle) > 1e-9 || Math.abs(s.wf - states[0].wf) > 1e-9);
  return stateVaries ? "B" : "A";
}

function emitStroke(stroke, states, route) {
  const lines = [
    `outputformat := "svg";`,
    `outputtemplate := "%j.svg";`,
    `beginfig(1);`,
  ];
  const nodes = stroke.spine.nodes;
  if (route === "F" || route === "A") {
    const s = states[0];
    const pen = tipPolygon(s.tip, s.wf).map((p) => rot(p, s.angle));
    lines.push(`draw ${spinePath(stroke.spine)} withpen ${penPath(pen)};`);
  } else if (route === "B") {
    const pen = tipPolygon(states[0].tip, 1);
    lines.push(`pen nib; nib := ${penPath(pen)}; pickup nib;`);
    states.forEach((s, i) => {
      lines.push(`z${i + 1} = ${pt(nodes[i])};`);
      // penpos breadth = the tip's long-axis length (calibrated, probe P2)
      const breadth = (states[0].tip.kind === "ellipse" ? states[0].tip.width : states[0].tip.width) * s.wf;
      lines.push(`penpos${i + 1}(${fmt(breadth)}, ${fmt(s.angle)});`);
    });
    lines.push(`penstroke ${states.map((_, i) => `z${i + 1}e`).join("--")};`);
    // our model's caps: full tip stamps at the ends
    lines.push(fillPath(tipPolygon(states[0].tip, states[0].wf), nodes[0], states[0].angle));
    lines.push(fillPath(tipPolygon(states[states.length - 1].tip, states[states.length - 1].wf), nodes[nodes.length - 1], states[states.length - 1].angle));
  }
  lines.push(`show llcorner currentpicture; show urcorner currentpicture;`);
  lines.push(`endfig;`, `end.`);
  return lines.join("\n");
}

// ---------- SVG back-parsing ----------
function parseSvgRings(svg) {
  const rings = [];
  for (const m of svg.matchAll(/<path d="([^"]+)" style="([^"]*)"/g)) {
    if (!/fill:/.test(m[2]) || /fill: none/.test(m[2])) continue;
    const tokens = m[1].match(/[MLCZ]|-?\d+\.?\d*/g) ?? [];
    let i = 0, cur = null, ringsOut = [];
    const num = () => parseFloat(tokens[i++]);
    while (i < tokens.length) {
      const t = tokens[i++];
      if (t === "M") { cur = [[num(), num()]]; ringsOut.push(cur); }
      else if (t === "L") cur.push([num(), num()]);
      else if (t === "C") {
        const p0 = cur[cur.length - 1];
        const c1 = [num(), num()], c2 = [num(), num()], p1 = [num(), num()];
        for (let k = 1; k <= 20; k++) {
          const u = k / 20, v = 1 - u;
          cur.push([
            v * v * v * p0[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p1[0],
            v * v * v * p0[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p1[1],
          ]);
        }
      } else if (t === "Z") { /* ring closes implicitly */ }
    }
    rings.push(...ringsOut.filter((r) => r.length > 2));
  }
  return rings;
}

function runMpost(mpSource, tag) {
  const base = join(TMP, tag);
  writeFileSync(`${base}.mp`, mpSource);
  execFileSync("mpost", ["-interaction=nonstopmode", `${tag}.mp`], { cwd: TMP, input: "", stdio: ["ignore", "ignore", "pipe"] });
  const log = readFileSync(`${base}.log`, "utf8");
  const corners = [...log.matchAll(/>> \((-?[\d.]+),(-?[\d.]+)\)/g)].map((m) => [parseFloat(m[1]), parseFloat(m[2])]);
  if (corners.length < 2) throw new Error(`no bbox in mpost log for ${tag}`);
  const [[llx, lly], [urx, ury]] = corners;
  const svg = readFileSync(`${base}.svg`, "utf8");
  // MetaPost's SVG keeps math x unless the picture crosses x<0: the
  // emitted x is x_math - min(0, llx). (Empirical, probe P1 + the
  // durer/n debug run — see docs/ORACLE.md.) y is flipped from ury.
  const xoff = Math.min(0, llx);
  const rings = parseSvgRings(svg).map((ring) => ring.map(([sx, sy]) => [sx + xoff, ury - sy]));
  return rings.map((r) => [r]); // one polygon per ring; union sorts winding/holes
}

// ---------- comparison ----------
const asGeom = (mp) => mp.map((poly) => poly.map((ring) => ring.map((p) => [p[0], p[1]])));
function metrics(ours, theirs) {
  const o = asGeom(ours), t = asGeom(theirs);
  const areaO = multiPolygonArea(ours), areaT = multiPolygonArea(theirs);
  let inter = 0, uni = areaO + areaT;
  try {
    const xi = pc.intersection(o, t);
    inter = xi ? multiPolygonArea(xi) : 0;
    const xu = pc.union(o, t);
    uni = xu ? multiPolygonArea(xu) : uni;
  } catch { /* degenerate: fall back to areas */ }
  const box = (mp) => {
    let a = [Infinity, Infinity, -Infinity, -Infinity];
    for (const poly of mp) for (const ring of poly) for (const p of ring) {
      a[0] = Math.min(a[0], p[0]); a[1] = Math.min(a[1], p[1]); a[2] = Math.max(a[2], p[0]); a[3] = Math.max(a[3], p[1]);
    }
    return a;
  };
  const bo = box(ours), bt = box(theirs);
  return {
    iou: uni > 0 ? inter / uni : 1,
    areaDeltaPct: areaO > 0 ? ((areaT - areaO) / areaO) * 100 : 0,
    bboxDelta: bt.map((v, i) => +(v - bo[i]).toFixed(2)),
  };
}

// ---------- the sample ----------
const SAMPLES = [
  ["gothic", gothicFont(), ["A", "E", "H", "O", "S", "8"]],
  ["durer", durerFont(), ["i", "n", "m", "l", "z", "g"]],
  ["foundational", foundationalFont(), ["a", "c", "e", "o", "g", "&"]],
  ["imperial", imperialFont(), ["E", "H", "O", "R"]],
  ["fraktur", frakturFont(), ["a", "e", "f", "m", "ſ"]],
];

const report = { fonts: {}, routes: { A: 0, B: 0, F: 0, X: 0 }, xStrokes: [] };
for (const [fname, file, glyphNames] of SAMPLES) {
  const font = loadStrokeFont(file);
  report.fonts[fname] = {};
  for (const gname of glyphNames) {
    const name = font.file.encoding[gname] ?? gname;
    const strokes = resolveGlyphStrokes(font, name);
    const rows = [];
    const ourPolys = [], mpPolys = [];
    for (let si = 0; si < strokes.length; si++) {
      const stroke = strokes[si];
      const states = nodeStates(stroke);
      const route = classify(stroke, states);
      report.routes[route]++;
      const ours = bakeStroke(stroke).outline;
      ourPolys.push(...ours);
      if (route === "X") {
        report.xStrokes.push(`${fname}/${name}/${stroke.id}`);
        rows.push({ stroke: stroke.id, route, iou: null });
        continue;
      }
      const mp = emitStroke(stroke, states, route);
      writeFileSync(join(WORK, `${fname}-${name}-${stroke.id}.mp`), mp);
      const theirs = runMpost(mp, `${fname}-${name}-${si}`);
      mpPolys.push(...theirs);
      rows.push({ stroke: stroke.id, route, ...metrics(ours, theirs) });
    }
    const glyphOurs = bakeFontGlyph(font, name).groups.get("ink") ?? [];
    const glyphMp = mpPolys.length ? pc.union(asGeom(mpPolys)) ?? [] : [];
    const gm = mpPolys.length && rows.every((r) => r.route !== "X") ? metrics(glyphOurs, glyphMp) : null;
    report.fonts[fname][name] = { strokes: rows, glyph: gm };
    const fmtRow = rows.map((r) => r.iou === null ? `${r.stroke}:${r.route}—` : `${r.stroke}:${r.route} ${r.iou.toFixed(4)}`).join("  ");
    console.log(`${fname}/${name}  glyph IoU ${gm ? gm.iou.toFixed(4) : "n/a (X strokes)"}  areaΔ ${gm ? gm.areaDeltaPct.toFixed(2) + "%" : "—"}`);
    console.log(`   ${fmtRow}`);
  }
}
console.log("\nroutes:", JSON.stringify(report.routes), " inexpressible strokes:", report.xStrokes.join(", ") || "none");
writeFileSync(join(WORK, "results.json"), JSON.stringify(report, null, 2) + "\n");
if (!KEEP) rmSync(TMP, { recursive: true, force: true });
console.log("wrote demo/oracle/results.json");
