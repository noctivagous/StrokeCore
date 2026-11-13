// HanGlyph constraint equations as validators (docs/HANGLYPH.md).
//
// The HanGlyph reference manual (§4) defines each of its 41 primitive
// strokes by control points plus equations over them (e.g. for 横折钩:
// y0 = y1 > y3 > y2 and x0 < x3 < x1 = x2). Here those equations are
// executable checks over a fitted spine's KEY POINTS — start, detected
// corners in order, end — so a converter-assigned label can be verified
// mechanically instead of trusted. Equalities carry a tolerance scaled
// to the stroke's own size; strict inequalities are checked plainly
// (median data is integral, so no epsilon games are needed).
//
// A form with no entry returns "no-spec": the manual gives no usable
// equations for it, and the honest answer is that we cannot check.
//
// Two equations are applied with calligraphic allowances, because the
// manual's control points are ideals and fitted medians carry real
// hand geometry: a 横 RISES toward the right （抗肩， up to ~16% of its
// width) rather than sitting level, and a 竖 may lean (its foot up to
// ~22% of its height sideways of its head) rather than standing
// plumb. The checks below encode those allowances explicitly.

import type { Pt } from "../types.js";

export interface KeyPoints {
  /** Start, corners in order, end. */
  points: Pt[];
  /** Per corner (points[1..n-2]): true when the turn is concentrated (折), false when spread (弯). */
  cornerSharp: boolean[];
}

export type ValidatorStatus = "pass" | "fail" | "no-spec";
export interface ValidatorResult {
  status: ValidatorStatus;
  failed: string[];
}

interface Ctx {
  p: Pt[];
  sharp: boolean[];
  tol: number;
}

type Check = (c: Ctx) => string[];

// Relation helpers: each returns the failed relation's name, or null.
const eqY = (c: Ctx, i: number, j: number, name: string) =>
  Math.abs(c.p[i].y - c.p[j].y) <= c.tol ? null : name;
const eqX = (c: Ctx, i: number, j: number, name: string) =>
  Math.abs(c.p[i].x - c.p[j].x) <= c.tol ? null : name;
const gtY = (c: Ctx, i: number, j: number, name: string) =>
  c.p[i].y > c.p[j].y ? null : name;
const ltY = (c: Ctx, i: number, j: number, name: string) =>
  c.p[i].y < c.p[j].y ? null : name;
const gtX = (c: Ctx, i: number, j: number, name: string) =>
  c.p[i].x > c.p[j].x ? null : name;
const ltX = (c: Ctx, i: number, j: number, name: string) =>
  c.p[i].x < c.p[j].x ? null : name;
const cornerIs = (wantSharp: boolean, name: string) => (c: Ctx) =>
  c.sharp.length > 0 && c.sharp[0] === wantSharp ? [] : [name];
/** 横 level check with 抗肩 allowance: may rise up to 16% of width, may not fall. */
const hengLevel = (c: Ctx, i: number, j: number, name: string) => {
  const rise = c.p[j].y - c.p[i].y;
  const w = Math.abs(c.p[j].x - c.p[i].x);
  return rise >= -c.tol && rise <= 0.16 * w + c.tol ? null : name;
};
/** 竖 plumb check with lean allowance: sideways drift up to 22% of the drop. */
const shuPlumb = (c: Ctx, i: number, j: number, name: string) => {
  const drift = Math.abs(c.p[j].x - c.p[i].x);
  const drop = Math.abs(c.p[i].y - c.p[j].y);
  return drift <= 0.22 * drop + c.tol * 0.5 ? null : name;
};

type RawCheck = (c: Ctx) => (string | null)[];
function all(...checks: (Check | RawCheck)[]): Check {
  return (c) => checks.flatMap((f) => f(c)).filter((x): x is string => x !== null);
}
function need(arity: number, check: Check): Check {
  return (c) => (c.p.length === arity ? check(c) : [`expected ${arity} key points, got ${c.p.length}`]);
}

// Specs keyed by form id. Point indices follow the manual: p0 is the
// start, interior points are corners, the last is the stroke's end.
const SPECS: Record<string, Check> = {
  // Dots: monotone down-right (dian/changdian), down-left (piedian),
  // down-then-down-left (zuodian: x0 = x1 > x2).
  dian: all((c) => [ltX(c, 0, c.p.length - 1, "x0<xEnd"), gtY(c, 0, c.p.length - 1, "y0>yEnd")]),
  changdian: all((c) => [ltX(c, 0, c.p.length - 1, "x0<xEnd"), gtY(c, 0, c.p.length - 1, "y0>yEnd")]),
  piedian: all((c) => [gtX(c, 0, c.p.length - 1, "x0>xEnd"), gtY(c, 0, c.p.length - 1, "y0>yEnd")]),
  zuodian: all((c) => [gtX(c, 0, c.p.length - 1, "x0>xEnd"), gtY(c, 0, c.p.length - 1, "y0>yEnd")]),
  piezhedian: need(3, all((c) => [gtX(c, 1, 0, "x1<x0"), ltX(c, 1, 2, "x1<x2"), gtY(c, 0, 2, "y0>y2")])),
  // Singles.
  heng: all((c) => [hengLevel(c, 0, c.p.length - 1, "y0≈yEnd （抗肩）"), ltX(c, 0, c.p.length - 1, "x0<xEnd")]),
  shu: all((c) => [shuPlumb(c, 0, c.p.length - 1, "x0≈xEnd (lean)"), gtY(c, 0, c.p.length - 1, "y0>yEnd")]),
  ti: all((c) => [ltX(c, 0, c.p.length - 1, "x0<xEnd"), ltY(c, 0, c.p.length - 1, "y0<yEnd")]),
  pie: all((c) => [gtX(c, 0, c.p.length - 1, "x0>xEnd"), gtY(c, 0, c.p.length - 1, "y0>yEnd")]),
  pingpie: all((c) => [gtX(c, 0, c.p.length - 1, "x0>xEnd"), gtY(c, 0, c.p.length - 1, "y0>yEnd")]),
  shupie: all((c) => [gtX(c, 0, c.p.length - 1, "x0>xEnd"), gtY(c, 0, c.p.length - 1, "y0>yEnd")]),
  na: all((c) => [ltX(c, 0, c.p.length - 1, "x0<xEnd"), gtY(c, 0, c.p.length - 1, "y0>yEnd")]),
  pingna: all((c) => [ltX(c, 0, c.p.length - 1, "x0<xEnd"), gtY(c, 0, c.p.length - 1, "y0>yEnd")]),
  // Two-leg turns: corner character is part of the definition.
  hengzhe: need(3, all(
    (c) => [hengLevel(c, 0, 1, "y0≈y1 （抗肩）"), gtY(c, 1, 2, "y1>y2"), ltX(c, 0, 1, "x0<x1"), shuPlumb(c, 1, 2, "x1≈x2 (lean)")],
    cornerIs(true, "corner sharp （折）"),
  )),
  hengzhewan: need(3, all(
    (c) => [hengLevel(c, 0, 1, "y0≈y1 （抗肩）"), gtY(c, 1, 2, "y1>y2"), ltX(c, 0, 1, "x0<x1")],
    cornerIs(false, "corner curved （弯）"),
  )),
  shuzhe: need(3, all(
    (c) => [shuPlumb(c, 0, 1, "x0≈x1 (lean)"), ltX(c, 1, 2, "x1<x2"), gtY(c, 0, 1, "y0>y1"), eqY(c, 1, 2, "y1=y2")],
    cornerIs(true, "corner sharp （折）"),
  )),
  shuwan: need(3, all(
    (c) => [shuPlumb(c, 0, 1, "x0≈x1 (lean)"), ltX(c, 1, 2, "x1<x2"), gtY(c, 0, 1, "y0>y1")],
    cornerIs(false, "corner curved （弯）"),
  )),
  hengpie: need(3, all((c) => [
    hengLevel(c, 0, 1, "y0≈y1 （抗肩）"), gtY(c, 1, 2, "y1>y2"), ltX(c, 0, 1, "x0<x1"), gtX(c, 1, 2, "x1>x2"),
  ])),
  hengzhexie: need(3, all((c) => [
    hengLevel(c, 0, 1, "y0≈y1 （抗肩）"), gtY(c, 1, 2, "y1>y2"), gtX(c, 1, 2, "x1>x2"), ltX(c, 0, 2, "x0<x2"),
  ])),
  henggou: need(3, all((c) => [
    hengLevel(c, 0, 1, "y0≈y1 （抗肩）"), gtY(c, 1, 2, "y1>y2"), gtX(c, 1, 2, "x1>x2"), ltX(c, 0, 1, "x0<x1"),
  ])),
  shuti: need(3, all((c) => [
    shuPlumb(c, 0, 1, "x0≈x1 (lean)"), gtY(c, 0, 1, "y0>y1"), ltX(c, 1, 2, "x1<x2"), ltY(c, 1, 2, "y1<y2"),
  ])),
  shugou: need(3, all((c) => [
    shuPlumb(c, 0, 1, "x0≈x1 (lean)"), gtY(c, 0, 2, "y0>y2"), gtY(c, 2, 1, "y2>y1"), gtX(c, 0, 2, "x0>x2"),
  ])),
  piezhe: need(3, all((c) => [
    gtX(c, 0, 1, "x0>x1"), gtY(c, 0, 2, "y0>y2"), ltX(c, 1, 2, "x1<x2"), ltY(c, 1, 2, "y1<y2"),
  ])),
  // Three+ legs.
  hengzhegou: need(4, all((c) => [
    hengLevel(c, 0, 1, "y0≈y1 （抗肩）"), gtY(c, 1, 3, "y1>y3"), gtY(c, 3, 2, "y3>y2"),
    ltX(c, 0, 3, "x0<x3"), ltX(c, 3, 1, "x3<x1"), shuPlumb(c, 1, 2, "x1≈x2 (lean)"),
  ])),
  hengzhezhe: need(4, all((c) => [
    hengLevel(c, 0, 1, "y0≈y1 （抗肩）"), gtY(c, 1, 2, "y1>y2"), eqY(c, 2, 3, "y2=y3"),
    ltX(c, 0, 1, "x0<x1"), shuPlumb(c, 1, 2, "x1≈x2 (lean)"), ltX(c, 2, 3, "x2<x3"),
  ])),
  shuzhezhe: need(4, all((c) => [
    shuPlumb(c, 0, 1, "x0≈x1 (lean)"), gtY(c, 0, 1, "y0>y1"), eqY(c, 1, 2, "y1=y2"),
    gtY(c, 2, 3, "y2>y3"), ltX(c, 1, 2, "x1<x2"), shuPlumb(c, 2, 3, "x2≈x3 (lean)"),
  ])),
  shuwangou: need(4, all(
    (c) => [
      shuPlumb(c, 0, 1, "x0≈x1 (lean)"), gtY(c, 0, 1, "y0>y1"), eqY(c, 2, 3, "y2=y3"),
      ltX(c, 1, 2, "x1<x2"), ltX(c, 2, 3, "x2<x3"),
    ],
    cornerIs(false, "corner curved （弯）"),
  )),
  hengzheti: need(4, all((c) => [
    hengLevel(c, 0, 1, "y0≈y1 （抗肩）"), gtY(c, 1, 2, "y1>y2"), ltY(c, 2, 3, "y2<y3"),
    ltX(c, 0, 1, "x0<x1"), gtX(c, 1, 2, "x1>x2"), ltX(c, 2, 3, "x2<x3"),
  ])),
  hengzhezhezhe: need(5, all((c) => [
    hengLevel(c, 0, 1, "y0≈y1 （抗肩）"), eqY(c, 2, 3, "y2=y3"), gtY(c, 1, 2, "y1>y2"), gtY(c, 3, 4, "y3>y4"),
    ltX(c, 0, 1, "x0<x1"), ltX(c, 2, 3, "x2<x3"), shuPlumb(c, 1, 2, "x1≈x2 (lean)"), shuPlumb(c, 3, 4, "x3≈x4 (lean)"),
  ])),
  hengzhezhegou: need(5, all((c) => [
    hengLevel(c, 0, 1, "y0≈y1 （抗肩）"), eqY(c, 2, 3, "y2=y3"), gtY(c, 3, 4, "y3>y4"),
    ltX(c, 0, 1, "x0<x1"), gtX(c, 1, 2, "x1>x2"), ltX(c, 2, 3, "x2<x3"), gtX(c, 3, 4, "x3>x4"),
  ])),
  shuzhezhegou: need(5, all((c) => [
    shuPlumb(c, 0, 1, "x0≈x1 (lean)"), eqY(c, 2, 3, "y2=y3"), gtY(c, 2, 4, "y2>y4"), gtY(c, 4, 3, "y4>y3"),
    ltX(c, 1, 2, "x1<x2"), shuPlumb(c, 2, 3, "x2≈x3 (lean)"), gtX(c, 3, 4, "x3>x4"),
  ])),
  hengzhezhepie: need(5, all((c) => [
    hengLevel(c, 0, 1, "y0≈y1 （抗肩）"), eqY(c, 2, 3, "y2=y3"), gtY(c, 3, 4, "y3>y4"),
    ltX(c, 0, 1, "x0<x1"), shuPlumb(c, 1, 2, "x1≈x2 (lean)"), gtX(c, 3, 4, "x3>x4"),
  ])),
  shuzhepie: need(4, all((c) => [
    shuPlumb(c, 0, 1, "x0≈x1 (lean)"), eqY(c, 1, 2, "y1=y2"), gtY(c, 2, 3, "y2>y3"),
    ltX(c, 1, 2, "x1<x2"), gtX(c, 2, 3, "x2>x3"),
  ])),
  hengxiegou: all((c) => {
    const e = c.p.length - 1;
    return [ltX(c, 0, e, "x0<xEnd"), gtY(c, 0, e, "y0>yEnd"), hengLevel(c, 0, 1, "y0≈y1 （抗肩）")];
  }),
  xiegou: all((c) => {
    const e = c.p.length - 1;
    return [ltX(c, 0, e, "x0<xEnd"), gtY(c, 0, e, "y0>yEnd")];
  }),
  wangou: all((c) => {
    const e = c.p.length - 1;
    return [gtY(c, 0, e, "y0>yEnd")];
  }),
  wogou: all((c) => {
    const e = c.p.length - 1;
    return [ltX(c, 0, e, "x0<xEnd"), gtY(c, 0, e, "y0>yEnd")];
  }),
};

/** Validate a fitted stroke's key points against its form's HanGlyph equations. */
export function validateForm(form: string, key: KeyPoints): ValidatorResult {
  const spec = SPECS[form];
  if (!spec) return { status: "no-spec", failed: [] };
  const xs = key.points.map((p) => p.x);
  const ys = key.points.map((p) => p.y);
  const extent = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const tol = Math.max(10, 0.09 * extent);
  const failed = spec({ p: key.points, sharp: key.cornerSharp, tol });
  return { status: failed.length === 0 ? "pass" : "fail", failed };
}

/** Form ids that carry an executable constraint spec. */
export function specForms(): string[] {
  return Object.keys(SPECS);
}
