// F2 converter: Make Me a Hanzi medians → draft Bihua records.
//
// Pipeline per stroke: dedupe the median into a spine, detect corners
// (Ramer–Douglas–Peucker vertices whose turn clears a threshold) and
// classify each corner as sharp （折） or curved （弯） by how
// concentrated its turn is; read the legs between key points; match
// the leg pattern against the 41-stroke taxonomy (docs/HANGLYPH.md);
// assign the form's pressure signature; then VERIFY the label with
// the form's HanGlyph constraint equations (constraints.ts).
//
// Nothing here pretends to be authored: every converted stroke is
// provenance "fitted-from-median", carries its classifier confidence
// and validator result, and is flagged for review when either is
// weak. The outline data in the same source files stays behind as
// the overlay oracle (scripts/bihua-convert.mjs reports IoU).

import type { Pt } from "../types.js";
import type { BihuaCharacter, BihuaSegment, BihuaStroke } from "./types.js";
import { formById } from "./forms.js";
import { validateForm, type KeyPoints } from "./constraints.js";

/** The shape of a hanzi-writer-data character file. */
export interface MmhCharData {
  strokes: string[];
  medians: number[][][];
}

type DirClass = "E" | "NE" | "N" | "NW" | "W" | "SW" | "S" | "SE";

export interface Leg {
  dir: DirClass;
  /** Chord length between the leg's key points. */
  chord: number;
  /** Spine index where this leg starts. */
  fromIndex: number;
}

export interface StrokeAnalysis {
  spine: Pt[];
  /** Spine indices of start, corners, end. */
  keyIndices: number[];
  key: KeyPoints;
  legs: Leg[];
  /** True when the final leg is a short hook flick. */
  hook: boolean;
  arc: number;
  bbox: { w: number; h: number };
  /** Total absolute direction change along the stroke, degrees. */
  totalTurn: number;
  /** Travel direction at the very start / end of the stroke, degrees. */
  startHeading: number;
  endHeading: number;
}

const DIRS: [number, DirClass][] = [
  [22.5, "E"], [67.5, "NE"], [112.5, "N"], [157.5, "NW"],
  [202.5, "W"], [247.5, "SW"], [292.5, "S"], [337.5, "SE"], [360, "E"],
];
function dirClass(angleDeg: number): DirClass {
  const a = ((angleDeg % 360) + 360) % 360;
  for (const [bound, d] of DIRS) if (a < bound) return d;
  return "E";
}
const angleOf = (dx: number, dy: number) => (Math.atan2(dy, dx) * 180) / Math.PI;
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

function dedupe(raw: number[][]): Pt[] {
  const out: Pt[] = [];
  for (const [x, y] of raw) {
    const p = { x, y };
    if (out.length === 0 || dist(out[out.length - 1], p) >= 2) out.push(p);
  }
  if (out.length === 1 && raw.length > 1) {
    const [x, y] = raw[raw.length - 1];
    out.push({ x, y });
  }
  return out;
}

/** Ramer–Douglas–Peucker simplification; returns kept indices. */
function rdpIndices(pts: Pt[], eps: number): number[] {
  const keep = new Set([0, pts.length - 1]);
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    if (b - a < 2) continue;
    const A = pts[a], B = pts[b];
    const vx = B.x - A.x, vy = B.y - A.y;
    const vlen = Math.hypot(vx, vy) || 1;
    let maxD = 0, maxI = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i].x - A.x) * vy - (pts[i].y - A.y) * vx) / vlen;
      if (d > maxD) { maxD = d; maxI = i; }
    }
    if (maxD > eps && maxI > 0) {
      keep.add(maxI);
      stack.push([a, maxI], [maxI, b]);
    }
  }
  return [...keep].sort((m, n) => m - n);
}

function headingAt(pts: Pt[], i: number, w: number): number {
  const a = pts[Math.max(0, i - w)];
  const b = pts[Math.min(pts.length - 1, i + w)];
  return angleOf(b.x - a.x, b.y - a.y);
}
function turnBetween(h1: number, h2: number): number {
  let d = Math.abs(h2 - h1) % 360;
  return d > 180 ? 360 - d : d;
}

export function analyzeMedian(raw: number[][]): StrokeAnalysis {
  const spine = dedupe(raw);
  const xs = spine.map((p) => p.x), ys = spine.map((p) => p.y);
  const bbox = {
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
  let arc = 0;
  for (let i = 1; i < spine.length; i++) arc += dist(spine[i - 1], spine[i]);
  let totalTurn = 0;
  for (let i = 1; i < spine.length; i++) {
    totalTurn += turnBetween(headingAt(spine, i - 1, 1), headingAt(spine, i, 1));
  }
  // Corners: RDP vertices with a real turn. Sharpness is measured on
  // ARC windows: a 折 concentrates its turn within ±10% of the arc
  // around the corner; a 弯 spreads the same turn over ±30%.
  const diag = Math.hypot(bbox.w, bbox.h) || 1;
  const cand = rdpIndices(spine, Math.max(8, 0.05 * diag));
  const cumArc = [0];
  for (let i = 1; i < spine.length; i++) cumArc.push(cumArc[i - 1] + dist(spine[i - 1], spine[i]));
  const indexAtArc = (target: number) => {
    let lo = 0;
    while (lo < cumArc.length - 1 && cumArc[lo] < target) lo++;
    return lo;
  };
  const windowTurn = (i: number, frac: number) => {
    const a = spine[indexAtArc(Math.max(0, cumArc[i] - frac * arc))];
    const b = spine[indexAtArc(Math.min(arc, cumArc[i] + frac * arc))];
    const hIn = angleOf(spine[i].x - a.x, spine[i].y - a.y);
    const hOut = angleOf(b.x - spine[i].x, b.y - spine[i].y);
    return turnBetween(hIn, hOut);
  };
  const corners: number[] = [];
  const sharp: boolean[] = [];
  for (let k = 1; k < cand.length - 1; k++) {
    const i = cand[k];
    const prev = spine[cand[k - 1]], next = spine[cand[k + 1]], here = spine[i];
    const turn = turnBetween(
      angleOf(here.x - prev.x, here.y - prev.y),
      angleOf(next.x - here.x, next.y - here.y),
    );
    // 52°, not lower: sparse medians give a plain 横 a shoulder
    // (rise-then-fall ~47° of chord turn) that is not a corner.
    if (turn < 52) continue;
    const localTurn = windowTurn(i, 0.1);
    const midTurn = windowTurn(i, 0.3);
    corners.push(i);
    sharp.push(localTurn >= 45 && localTurn >= 0.6 * midTurn);
  }
  // Merge corners closer than 12% of the spine's points (keep the first).
  const keyIndices = [0];
  const cornerSharp: boolean[] = [];
  corners.forEach((ci, k) => {
    if (ci - keyIndices[keyIndices.length - 1] >= Math.max(2, spine.length * 0.12)) {
      keyIndices.push(ci);
      cornerSharp.push(sharp[k]);
    }
  });
  keyIndices.push(spine.length - 1);
  const key: KeyPoints = {
    points: keyIndices.map((i) => spine[i]),
    cornerSharp,
  };
  const legs: Leg[] = [];
  for (let k = 0; k < keyIndices.length - 1; k++) {
    const a = spine[keyIndices[k]], b = spine[keyIndices[k + 1]];
    legs.push({
      dir: dirClass(angleOf(b.x - a.x, b.y - a.y)),
      chord: dist(a, b),
      fromIndex: keyIndices[k],
    });
  }
  const startHeading = headingAt(spine, 0, 2);
  const endHeading = headingAt(spine, spine.length - 1, 2);
  // Hook: final leg short, sharply turned, flicking back up/left.
  let hook = false;
  if (legs.length >= 2) {
    const last = legs[legs.length - 1];
    const prevLeg = legs[legs.length - 2];
    const cornerI = keyIndices[keyIndices.length - 2];
    const turn = turnBetween(
      angleOf(spine[cornerI].x - spine[prevLeg.fromIndex].x, spine[cornerI].y - spine[prevLeg.fromIndex].y),
      angleOf(spine[spine.length - 1].x - spine[cornerI].x, spine[spine.length - 1].y - spine[cornerI].y),
    );
    hook =
      last.chord <= 0.42 * prevLeg.chord &&
      turn >= 55 &&
      (last.dir === "NW" || last.dir === "N" || last.dir === "NE" || last.dir === "W");
  }
  return { spine, keyIndices, key, legs, hook, arc, bbox, totalTurn, startHeading, endHeading };
}

export interface Classification {
  form: string;
  confidence: number;
  /** What the classifier weighed, for the review report. */
  basis: string;
}

function pieFamily(a: StrokeAnalysis): Classification {
  const { w, h } = a.bbox;
  if (h > w * 1.35) return { form: "shupie", confidence: 0.85, basis: "steep left-fall (h >> w)" };
  if (w > h * 1.5) return { form: "pingpie", confidence: 0.85, basis: "flat left-fall (w >> h)" };
  return { form: "pie", confidence: 0.9, basis: "left-fall, middle aspect" };
}
function naFamily(a: StrokeAnalysis): Classification {
  const { w, h } = a.bbox;
  if (w > h * 1.6) return { form: "pingna", confidence: 0.85, basis: "flat right-fall (w >> h)" };
  return { form: "na", confidence: 0.9, basis: "right-fall" };
}

export function classifyStroke(a: StrokeAnalysis): Classification {
  const dirs = a.legs.map((l) => l.dir);
  const body = a.hook ? dirs.slice(0, -1) : dirs;
  const sig = body.join(",");
  const diag = Math.hypot(a.bbox.w, a.bbox.h);
  // A dot has real height (a press, not a line): a short flat stroke
  // with almost no height is a small 横, not a dot.
  const isDotSized = a.arc < 260 && diag < 320 && a.bbox.h > 42;

  // Dot family: one tiny movement. Direction of travel alone does
  // not separate the dots — a 左点 starts by dropping straight down
  // before leaning left, so read the net lean and the start heading.
  if (a.legs.length <= 1 && isDotSized) {
    const d = dirs[0] ?? "SE";
    const netDx = a.spine[a.spine.length - 1].x - a.spine[0].x;
    if (d === "NE") return { form: "dianti", confidence: 0.55, basis: "tiny rise, read as dot+lift" };
    if (netDx < -0.1 * a.bbox.h || d === "SW") {
      const startDir = dirClass(a.startHeading);
      return startDir === "S"
        ? { form: "zuodian", confidence: 0.68, basis: "dot dropping, then leaning left" }
        : { form: "piedian", confidence: 0.72, basis: "straight dot down-left" };
    }
    return a.arc > 190
      ? { form: "changdian", confidence: 0.7, basis: "elongated dot down-right" }
      : { form: "dian", confidence: 0.88, basis: "short dot down-right" };
  }

  if (!a.hook) {
    switch (sig) {
      case "E": {
        // A 提 rises far more than a 横's 抗肩 shoulder allows.
        const rise = a.spine[a.spine.length - 1].y - a.spine[0].y;
        if (rise > 0.18 * a.bbox.w) return { form: "ti", confidence: 0.8, basis: "single rising leg, steep for a horizontal" };
        return { form: "heng", confidence: 0.92, basis: "single horizontal leg" };
      }
      case "W":
        return { form: "pingpie", confidence: 0.6, basis: "flat leftward fall" };
      case "S": {
        // A steep 撇's chord can read as vertical while the stroke
        // itself sweeps out to the lower left — trust the end heading
        // AND the net displacement (a bowed 竖 ends under its start).
        const endDir = dirClass(a.endHeading);
        const netDx = a.spine[a.spine.length - 1].x - a.spine[0].x;
        if (a.totalTurn >= 26 && endDir === "SW" && netDx < -0.22 * a.bbox.h) {
          const fam = pieFamily(a);
          return { ...fam, confidence: Math.min(fam.confidence, 0.84), basis: "vertical chord, left-fall sweep" };
        }
        return { form: "shu", confidence: 0.92, basis: "single vertical leg" };
      }
      case "NE": return { form: "ti", confidence: 0.9, basis: "single rising leg" };
      case "SW": return pieFamily(a);
      case "SE": return naFamily(a);
      case "E,S":
        return a.key.cornerSharp[0]
          ? { form: "hengzhe", confidence: 0.9, basis: "horizontal, sharp turn down" }
          : { form: "hengzhewan", confidence: 0.88, basis: "horizontal, curved turn down" };
      case "S,E":
        return a.key.cornerSharp[0]
          ? { form: "shuzhe", confidence: 0.9, basis: "vertical, sharp turn right" }
          : { form: "shuwan", confidence: 0.88, basis: "vertical, curved turn right" };
      case "E,SW": {
        const ratio = a.legs[1].chord / Math.max(1, a.legs[0].chord);
        return ratio > 0.45
          ? { form: "hengpie", confidence: 0.88, basis: "horizontal into long left-fall" }
          : { form: "hengzhexie", confidence: 0.7, basis: "horizontal into short slant" };
      }
      case "E,SE": {
        const ratio = a.legs[1].chord / Math.max(1, a.legs[0].chord);
        if (!a.key.cornerSharp[0]) return { form: "hengxiegou", confidence: 0.6, basis: "horizontal curving down-right (no hook caught)" };
        return ratio <= 0.4
          ? { form: "henggou", confidence: 0.72, basis: "horizontal into short down-right flick" }
          : { form: "hengzhexie", confidence: 0.55, basis: "horizontal into slant (uncertain)" };
      }
      case "S,NE": return { form: "shuti", confidence: 0.88, basis: "vertical lifting at the foot" };
      case "S,SW": {
        // A left-fall whose entry drops steeply before sweeping out.
        const ratio = a.legs[0].chord / Math.max(1, a.legs[1].chord);
        if (ratio <= 0.45) {
          const fam = pieFamily(a);
          return { ...fam, confidence: Math.min(fam.confidence, 0.85), basis: "steep entry into left-fall" };
        }
        break;
      }
      case "S,SE": {
        const ratio = a.legs[0].chord / Math.max(1, a.legs[1].chord);
        if (ratio <= 0.45) {
          const fam = naFamily(a);
          return { ...fam, confidence: Math.min(fam.confidence, 0.8), basis: "steep entry into right-fall" };
        }
        break;
      }
      case "SW,E": return { form: "piezhe", confidence: 0.85, basis: "left-fall turning to a rise" };
      case "SE,SW": {
        // The press entry of a 撇 jogs down-right before the sweep.
        const ratio = a.legs[0].chord / Math.max(1, a.legs[1].chord);
        if (ratio <= 0.25) {
          const fam = pieFamily(a);
          return { ...fam, confidence: Math.min(fam.confidence, 0.84), basis: "entry flick into left-fall" };
        }
        break;
      }
      case "SW,SE": return { form: "piezhedian", confidence: 0.8, basis: "short left-fall into a long dot" };
      case "SE,NE":
        return isDotSized
          ? { form: "dianti", confidence: 0.8, basis: "dot then lift" }
          : { form: "ti", confidence: 0.45, basis: "down-right then rise (uncertain)" };
      case "E,S,E": return { form: "hengzhezhe", confidence: 0.88, basis: "horizontal, down, horizontal" };
      case "S,E,S": return { form: "shuzhezhe", confidence: 0.88, basis: "vertical, right, down" };
      case "E,S,NE": return { form: "hengzheti", confidence: 0.85, basis: "horizontal, down, rise" };
      case "S,E,SW": return { form: "shuzhepie", confidence: 0.82, basis: "vertical, right, left-fall" };
      case "E,S,SW": return { form: "hengzhezhepie", confidence: 0.55, basis: "horizontal, down, left-fall (missing a leg for the full form)" };
      case "E,S,E,S": return { form: "hengzhezhezhe", confidence: 0.85, basis: "four straight legs, staircase" };
    }
    // Curved single-body hooks without a caught hook leg.
    if (a.legs.length === 1 && a.totalTurn > 55) {
      if (dirs[0] === "SE" || dirs[0] === "S") {
        return { form: "xiegou", confidence: 0.5, basis: "curving slant (hook not resolved)" };
      }
    }
  } else {
    switch (sig) {
      case "S": return { form: "shugou", confidence: 0.9, basis: "vertical with hook" };
      case "E,S": return { form: "hengzhegou", confidence: 0.9, basis: "horizontal, down, hook" };
      case "E,S,E": return { form: "hengzhezhegou", confidence: 0.85, basis: "horizontal, down, horizontal, hook" };
      case "S,E,S": return { form: "shuzhezhegou", confidence: 0.85, basis: "vertical, right, down, hook" };
      case "S,E":
        return a.key.cornerSharp[0]
          ? { form: "shuwangou", confidence: 0.6, basis: "vertical, right, hook (corner sharper than 弯 wants)" }
          : { form: "shuwangou", confidence: 0.88, basis: "vertical curving right into hook" };
      case "E,SW": return { form: "hengpiewangou", confidence: 0.8, basis: "horizontal, left-fall curve, hook" };
      case "SE":
        return a.bbox.w > a.bbox.h * 1.45
          ? { form: "wogou", confidence: 0.8, basis: "shallow lying curve with hook" }
          : { form: "xiegou", confidence: 0.85, basis: "slant with upright hook" };
      case "S,SE": return { form: "wangou", confidence: 0.8, basis: "descending curve bending right into hook" };
      case "E":
        return a.bbox.w > a.bbox.h * 2
          ? { form: "wogou", confidence: 0.75, basis: "shallow lying curve with hook" }
          : { form: "wangou", confidence: 0.6, basis: "curved stroke with hook" };
      case "E,S,E":
        return { form: "hengzhewangou", confidence: 0.6, basis: "horizontal, down, horizontal, hook (corner character ambiguous)" };
    }
    if (sig === "E,S,E" || sig === "E,S") {
      // handled above; unreachable
    }
  }
  // Fallback: name what we can see and ask for review.
  const first = dirs[0];
  const guess =
    first === "E" ? "heng" : first === "S" ? "shu" : first === "SW" ? "pie" :
    first === "SE" ? "na" : first === "NE" ? "ti" : "zhe";
  return {
    form: guess,
    confidence: 0.35,
    basis: `unmatched leg pattern [${dirs.join(",")}]${a.hook ? " + hook" : ""}`,
  };
}

const LEG_FORM: Record<string, string> = {
  E: "heng", S: "shu", SW: "pie", SE: "na", NE: "ti", N: "shu", NW: "gou", W: "gou",
};

function segmentsFor(a: StrokeAnalysis, form: string): BihuaSegment[] {
  if (a.keyIndices.length <= 2) {
    const f = formById(form);
    return [{ ...(f.bafa ? { bafa: f.bafa } : {}), form, span: [0, a.spine.length - 1] }];
  }
  const segs: BihuaSegment[] = [];
  a.legs.forEach((leg, k) => {
    const isHookLeg = a.hook && k === a.legs.length - 1;
    const segForm = isHookLeg ? "gou" : (LEG_FORM[leg.dir] ?? form);
    const f = formById(segForm);
    segs.push({
      ...(f.bafa ? { bafa: f.bafa } : {}),
      form: segForm,
      span: [a.keyIndices[k], a.keyIndices[k + 1]],
    });
  });
  return segs;
}

function pressureFor(form: string, nodes: number): number[] {
  const [entry, mid, exit] = formById(form).pressureSignature;
  const out: number[] = [];
  for (let i = 0; i < nodes; i++) {
    const t = nodes === 1 ? 0 : i / (nodes - 1);
    out.push(+(t < 0.5 ? entry + (mid - entry) * (t * 2) : mid + (exit - mid) * ((t - 0.5) * 2)).toFixed(3));
  }
  return out;
}

export interface ConvertedStroke {
  stroke: BihuaStroke;
  classification: Classification;
}

/** Convert one median (a raw MMH polyline) into a fitted Bihua stroke. */
export function convertStroke(rawMedian: number[][]): ConvertedStroke {
  const analysis = analyzeMedian(rawMedian);
  const classification = classifyStroke(analysis);
  const validation = validateForm(classification.form, analysis.key);
  const review = classification.confidence < 0.65 || validation.status === "fail";
  const stroke: BihuaStroke = {
    form: classification.form,
    spine: analysis.spine,
    pressure: pressureFor(classification.form, analysis.spine.length),
    segments: segmentsFor(analysis, classification.form),
    provenance: "fitted-from-median",
    fit: {
      confidence: classification.confidence,
      validator: validation.status,
      ...(validation.failed.length ? { failedRelations: validation.failed } : {}),
      review,
    },
  };
  return { stroke, classification };
}

export interface CharMeta {
  char: string;
  pinyin: string;
  gloss: string;
}

/** Convert a whole MMH character file into a draft Bihua record. */
export function convertCharacter(meta: CharMeta, data: MmhCharData): BihuaCharacter {
  return {
    char: meta.char,
    pinyin: meta.pinyin,
    gloss: meta.gloss,
    grid: 1024,
    strokes: data.medians.map((m) => convertStroke(m).stroke),
    pressureProvenance: "fitted",
    source:
      "Converted by the F2 converter from Make Me a Hanzi medians (hanzi-writer-data 2.0.1, Arphic); " +
      "forms auto-classified against the 41-stroke taxonomy and checked with HanGlyph constraint equations. " +
      "Draft record — strokes flagged for review have not been human-verified.",
  };
}
