// The letterform vocabulary (docs/GRAMMAR.md).
//
// StrokeCore the engine strokes any object; this module is the
// LETTERFORM layer that sits on it: three small lexicons and the
// pairing between them.
//
//   GESTURES — what the hand does: the core's base primitives
//     (lead, pull, push, drive, arc, bow, turn, point, flick, dab),
//     the tool events (twist, swell) and the terminals (head, foot,
//     diamond). Each carries a parameter signature: a primitive is a
//     named template, configured — never a fixed shape.
//     A word earns base-primitive status only if it differs in TOOL
//     BEHAVIOUR or AUTHORING SEMANTICS, not merely in path shape:
//     path-shape variants are PATTERNS (named configurations) instead.
//     So the hook is a pattern (a bow with a terminal turn), and the
//     sweep is a pattern (a bow with a guide) — both stay in the
//     spoken vocabulary at the level where descriptive names live.
//
//   PARTS — what a letter has: the anatomy words (stem, bowl, arm,
//     ear, tail, …). A stroke's `role` names its part.
//
//   FUNCTIONS — what a stroke is doing for the letter: a verb plus
//     an optional target part (completes → serif, crosses → stem,
//     closes → bowl). A stroke's `purpose` carries it.
//
// A StrokeFont configures the gestures for its hand in a per-font
// `primitives` table (§7) and may name reusable configurations as
// `patterns`. A glyph stroke pairs the lexicons: role (part) +
// gesture (primitive + configuration) + purpose (function).

export interface PrimitiveParam {
  name: string;
  kind: "number" | "string";
  note: string;
}

export interface BasePrimitive {
  name: string;
  kind: "gesture" | "event" | "terminal";
  summary: string;
  params: PrimitiveParam[];
}

const n = (name: string, note: string): PrimitiveParam => ({ name, kind: "number", note });
const s = (name: string, note: string): PrimitiveParam => ({ name, kind: "string", note });

export const BASE_PRIMITIVES: BasePrimitive[] = [
  { name: "lead", kind: "gesture", summary: "the entry: a light approach stroke that brings the tool to the letter", params: [n("widthFactor", "tip size multiplier; a lead is usually a hairline")] },
  { name: "pull", kind: "gesture", summary: "a stroke drawn toward the writer — the strong vertical/oblique of broad-edge work", params: [n("bow", "entasis: how much the stroke bellies from its chord"), s("startTerminal", "terminal the stroke begins with"), s("endTerminal", "terminal the stroke ends with")] },
  { name: "push", kind: "gesture", summary: "a stroke pushed away or across — the manner-bound opposite of the pull", params: [n("bow", "entasis"), s("startTerminal", "terminal the stroke begins with"), s("endTerminal", "terminal the stroke ends with")] },
  { name: "drive", kind: "gesture", summary: "a horizontal stroke written with authority; the serif-bearing stroke of the brush capitals", params: [n("twistFrom", "tip twist at the start, degrees"), n("twistTo", "tip twist at the end, degrees"), s("startTerminal", "terminal the stroke begins with"), s("endTerminal", "terminal the stroke ends with")] },
  { name: "arc", kind: "gesture", summary: "a true circular arc, declared by three points; the bowl-maker", params: [n("axis", "stress axis the arc is centred on, degrees")] },
  { name: "bow", kind: "gesture", summary: "a free curve through declared spline points — the arc's hand-drawn sibling; configured with a guide it is spoken of as a sweep, with a terminal turn as a hook (both are patterns, not base primitives)", params: [n("points", "default number of spline points used to say the curve"), s("guide", "the ladder line the bow follows, when it does: baseline, waistline, …")] },
  { name: "turn", kind: "gesture", summary: "a rounded change of direction (a composite round point)", params: [n("radius", "rounding radius at the vertex"), s("rounding", "arc | spline | bevel")] },
  { name: "point", kind: "gesture", summary: "a sharp change of direction — the turn fractured (Fraktur)", params: [n("angle", "the cusp angle at the vertex, degrees")] },
  { name: "flick", kind: "gesture", summary: "an edged exit: the stroke leaves the paper tapering (the ear of g)", params: [n("taper", "length over which the stroke tapers out"), n("endWidthFactor", "tip size multiplier at the very end")] },
  { name: "dab", kind: "gesture", summary: "a placed mark with no travel: the dot of an i or j", params: [n("size", "the mark's size along its angle"), n("angle", "the mark's cut angle, degrees")] },
  { name: "twist", kind: "event", summary: "the tool rotates during a stroke (the Imperial serif twists)", params: [n("from", "twist at the start, degrees"), n("to", "twist at the end, degrees")] },
  { name: "swell", kind: "event", summary: "pressure rises and falls during a stroke (the pointed pen's shade)", params: [n("peak", "peak pressure, 0..1"), n("position", "where along the stroke the peak falls, 0..1")] },
  { name: "head", kind: "terminal", summary: "the finish at a stroke's top (a serif is a head made by twists)", params: [n("length", "how far the terminal extends"), s("form", "the terminal's form, in typography's words: serif, beak, ball, finial, spur, hairline")] },
  { name: "foot", kind: "terminal", summary: "the finish at a stroke's bottom, standing on its line", params: [n("length", "how far the terminal extends"), s("form", "the terminal's form: serif, beak, ball, finial, spur, hairline")] },
  { name: "diamond", kind: "terminal", summary: "the square-cut finish of Fraktur feet and dots", params: [n("size", "the diamond's size"), n("angle", "its cut angle, degrees")] },
];

export const BASE_PRIMITIVE_NAMES: ReadonlySet<string> = new Set(BASE_PRIMITIVES.map((p) => p.name));

export const primitiveByName = (name: string): BasePrimitive | undefined =>
  BASE_PRIMITIVES.find((p) => p.name === name);

/** The anatomy lexicon: what a letter has. A stroke's `role` is one of these. */
export const ANATOMY_PARTS: { name: string; gloss: string }[] = [
  { name: "stem", gloss: "the main vertical (or diagonal) stroke of a letter" },
  { name: "bowl", gloss: "a curved stroke enclosing a counter (o, and the round parts of a, b, d, e, g, p, q)" },
  { name: "arm", gloss: "a horizontal or diagonal stroke extending from a stem (E's arms, T's bar-arms, z's top)" },
  { name: "leg", gloss: "a diagonal stroke descending from a junction (R, K, x, &)" },
  { name: "tail", gloss: "a stroke leaving the letter's body, usually descending (Q, y, g's flick, &'s sweep)" },
  { name: "ear", gloss: "the small flick at the top right of a double-storey g" },
  { name: "bar", gloss: "a horizontal stroke crossing or joining a stem (e's bar, t's cross, H's crossbar)" },
  { name: "arch", gloss: "the curved top joining two stems, or a stem to its branch (h, m, n)" },
  { name: "shoulder", gloss: "the small arch where a stroke branches (r)" },
  { name: "eye", gloss: "the small enclosed upper part of an e" },
  { name: "loop", gloss: "an open or closed curve below the baseline or in a ligature (g's lower loop, &'s upper loop)" },
  { name: "link", gloss: "the connecting stroke between two parts (the g's link between bowl and loop; glossaries also call it the neck)" },
  { name: "spine", gloss: "the central curved body of an s" },
  { name: "serif", gloss: "the finish where a stroke meets its line — in ductus terms, an event on a stroke, kept as a part name for the strokes that exist to make one" },
  { name: "head", gloss: "the top finish of a stem, where it is not a full serif stroke" },
  { name: "foot", gloss: "the bottom finish of a stem, standing on the baseline" },
  { name: "dot", gloss: "the placed mark over i and j" },
  { name: "spike", gloss: "Fraktur's pointed projection where one stroke overshoots another" },
];

export const ANATOMY_PART_NAMES: ReadonlySet<string> = new Set(ANATOMY_PARTS.map((p) => p.name));

/** The function lexicon: what a stroke is doing for the letter.
 *  A stroke's `purpose` is a verb here plus an optional target part —
 *  e.g. { function: "completes", target: "serif" }. */
export const STROKE_FUNCTIONS: { name: string; gloss: string }[] = [
  { name: "forms", gloss: "the stroke simply is its part (the default; usually left unwritten)" },
  { name: "completes", gloss: "finishes a part another stroke began — the second half of a serif, the return that makes a foot" },
  { name: "closes", gloss: "closes a part that would otherwise stand open — a bowl, a loop" },
  { name: "joins", gloss: "connects two parts that meet at this stroke (a's diagonal joining bowl to stem)" },
  { name: "crosses", gloss: "passes across another part (e's bar, t's crossbar)" },
  { name: "branches", gloss: "leaves a part partway along it (the arch branching from a stem)" },
  { name: "fills", gloss: "fills a gap the construction deliberately left (the Imperial apex fills)" },
  { name: "dots", gloss: "places the dot over a stem (i, j)" },
];

export const STROKE_FUNCTION_NAMES: ReadonlySet<string> = new Set(STROKE_FUNCTIONS.map((f) => f.name));

/** The pairing: which gestures characteristically make which part, and
 *  which functions that part's strokes characteristically serve. A
 *  guide for authors and tooling, not a restriction. */
export const PAIRINGS: Record<string, { gestures: string[]; functions: string[] }> = {
  stem: { gestures: ["pull", "drive"], functions: ["forms"] },
  bowl: { gestures: ["arc", "bow"], functions: ["forms", "closes"] },
  arm: { gestures: ["drive", "pull"], functions: ["forms", "completes"] },
  leg: { gestures: ["pull", "bow"], functions: ["forms"] },
  tail: { gestures: ["bow", "flick"], functions: ["forms"] },
  ear: { gestures: ["flick"], functions: ["completes"] },
  bar: { gestures: ["drive"], functions: ["crosses", "joins"] },
  arch: { gestures: ["bow", "arc"], functions: ["branches", "joins"] },
  shoulder: { gestures: ["bow"], functions: ["branches"] },
  eye: { gestures: ["arc", "bow"], functions: ["closes"] },
  loop: { gestures: ["bow", "arc"], functions: ["forms", "closes"] },
  link: { gestures: ["bow"], functions: ["joins"] },
  spine: { gestures: ["bow"], functions: ["forms"] },
  serif: { gestures: ["drive", "pull"], functions: ["completes", "forms"] },
  head: { gestures: ["drive", "pull"], functions: ["completes"] },
  foot: { gestures: ["bow", "drive"], functions: ["completes"] },
  dot: { gestures: ["dab"], functions: ["dots"] },
  spike: { gestures: ["pull", "point"], functions: ["forms"] },
};

/** A configured primitive: a base primitive name plus parameter values. */
export type PrimitiveConfig = Record<string, number | string>;

/** A stroke's gesture: the primitive it is spelled with, configured. */
export interface StrokeGesture {
  primitive: string;
  config?: PrimitiveConfig;
}

/** A stroke's purpose: a function verb plus the part it acts on. */
export interface StrokePurpose {
  function: string;
  target?: string;
}

/** A named, reusable configuration of one base primitive (a pattern). */
export interface PrimitivePattern {
  primitive: string;
  config?: PrimitiveConfig;
  note?: string;
}

/** Validate a configuration object against a primitive's signature. */
export function validatePrimitiveConfig(primitive: string, config: PrimitiveConfig | undefined, where: string): void {
  const base = primitiveByName(primitive);
  if (!base) throw new Error(`${where}: unknown base primitive '${primitive}'`);
  for (const [key, value] of Object.entries(config ?? {})) {
    const param = base.params.find((p) => p.name === key);
    if (!param) throw new Error(`${where}: primitive '${primitive}' has no parameter '${key}'`);
    if (typeof value !== param.kind) {
      throw new Error(`${where}: parameter '${key}' of '${primitive}' must be a ${param.kind}`);
    }
  }
}
