// Dürer Textura — the "Text or Quadrate" letters from Of the Just
// Shaping of Letters (1525), Book III. The second of the two
// fully-specified systems: every dimension below is Dürer's module
// arithmetic, not estimation. Source notes: docs/sources/
// durer-1525-notes.md (prose read in the Nichol translation,
// Gutenberg #37103; one point — the stack count — taken from his
// skeleton plate over the prose, as recorded there).
//
// THE MODULE. One square, side s = 100 = the stem width. A short
// letter is a stack of FIVE squares (baseline 0 to 500); tall letters
// seven (to 700). On the stack's top edge sits an oblique square —
// the module square at 45° — CENTRED on the edge at its first
// third-point (s/3 from the left); on the bottom edge, centred at
// the second point (2s/3). Each diamond protrudes s/√2 ≈ 70.7 beyond
// the stack, so a minim's total ink height is 5s + √2·s ≈ 641.
// Standards repeat at pitch s + 2s/3 (the counter is two-thirds of
// the stem width — prose "narrower than the breadth", plate and the
// Adams trace both measure ≈ 2/3).
//
// THE I AS STROKES. The standard is exactly three strokes: a pull
// with the broad pen (rect nib s wide; angle 0, so the stem ink is
// the rectangle [0,s]×[0,5s]) and two dabs of the oblique square.
// Both stem corners lie inside each diamond (|Δx| = s/3, 2s/3 < s/√2),
// so the union is Dürer's outline with no trimming. His derivations
// ("almost all the other letters are formed after this letter") are
// our component graph: _std is a component glyph.
//
// Marks in comments: [D] = Dürer's prose, [P] = his plates,
// [A] = the Adams CC0 trace, [I] = Kavi's interpretation where the
// prose underdetermines the stroke decomposition (the module-level
// facts — widths, heights, diamond places — are never interpretation).
import type { FontGlyph, StrokeFontFile } from "../font.js";
import { L, cspine, cstroke, resetIds, spine, stroke } from "./authoring.js";

const PEN = "dürer pen";
const SQ = "oblique square";
const S = 100;
const T3 = S / 3;            // the third-point: 33.33
const R = S / Math.SQRT2;    // diamond half-diagonal: 70.71
const SHORT = 500;           // five squares
const TALL = 700;            // seven squares [D: l = six set on end + the seventh cut]
const P = S + 2 * T3;        // standard pitch: 166.67 (counter 2s/3)

function glyph(name: string, g: Partial<FontGlyph> & { strokes: FontGlyph["strokes"] }): FontGlyph {
  g.strokes.forEach((s, i) => (s.id = `${name}-${i + 1}`));
  return { name, ductusKind: "native", ...g } as FontGlyph;
}

type F = ReturnType<typeof stroke>;

/** A standard's stem: ink [x0, x0+100] × [bot, top] exactly. */
const pull = (x0: number, top: number, bot: number, move = "pull the stem down"): F => ({
  ...stroke(PEN, "stem", move, L(x0 + 50, bot + 9, x0 + 50, top - 9), 0),
  gesture: { primitive: "pull" },
});
/**
 * A stem whose top is cut by a diagonal, the apex remaining to the
 * right [D for l, and every limb "cut off by a diagonal" at its top]:
 * a pull whose tip rotates 0° → 45° over its last stretch. Placing
 * the final stamp's centre at (x0 + 71, top − 42) puts its top corner
 * at (x0 + 100, top) — the apex on the stem's right edge, on the line.
 */
const cutPull = (x0: number, top: number, bot: number, move = "pull the stem down, its top cut by a diagonal"): F => ({
  ...stroke(PEN, "stem", move,
    spine([[x0 + 50, bot + 9], [x0 + 50, top - 60], [x0 + 71, top - 42]], ["line", "line"]), 0),
  gesture: { primitive: "pull" },
  points: [{ node: 0, angleDeg: 0 }, { node: 1, angleDeg: 0 }, { node: 2, angleDeg: 45 }],
});
/** An oblique square stamped with its centre at (cx, cy). [D/P] */
const dab = (cx: number, cy: number, role: string, move: string): F => ({
  ...stroke(SQ, role, move, L(cx, cy - 1, cx, cy + 1), 45),
  gesture: { primitive: "dab", config: { size: S, angle: 45 } },
});
const headDab = (x0: number, top: number) => dab(x0 + T3, top, "head", "set the oblique square on the first point");
const footDab = (x0: number, bot = 0) => dab(x0 + 2 * T3, bot, "foot", "set the oblique square on the second point");
/** A broad transverse limb (the pen at 30°). [I: breadth from the Adams trace] */
const drive = (role: string, move: string, x1: number, y: number, x2: number): F => ({
  ...stroke(PEN, role, move, L(x1, y, x2, y), 30),
  gesture: { primitive: "drive" },
});
/** A diagonal stroke with the pen at a declared angle. */
const diag = (role: string, move: string, x1: number, y1: number, x2: number, y2: number, angle = 45, wf?: number): F => {
  const st = stroke(PEN, role, move, L(x1, y1, x2, y2), angle);
  return {
    ...st, gesture: { primitive: "pull" },
    ...(wf ? { points: [{ node: 0, widthFactor: wf }, { node: 1, widthFactor: wf }] } : {}),
  };
};
/** The tiny in-crescent above the I, drawn with a fine pen. [D] */
const crescent = (x0: number, top: number): F => ({
  ...stroke(PEN, "head", "the tiny in-crescent, with a fine pen",
    spine([[x0 + 18, top + R + 26], [x0 + 52, top + R + 40], [x0 + 84, top + R + 24]],
      [[x0 + 30, top + R + 38, x0 + 40, top + R + 42], [x0 + 62, top + R + 40, x0 + 74, top + R + 34]]), 0),
  gesture: { primitive: "flick" },
  points: [{ node: 0, widthFactor: 0.14 }, { node: 1, widthFactor: 0.14 }, { node: 2, widthFactor: 0.14 }],
});

/** The I standard's own strokes at offset x0 (stem, head, foot). */
const stdStrokes = (x0: number, top = SHORT, bot = 0): F[] => [
  pull(x0, top, bot), headDab(x0, top), footDab(x0, bot),
];

export function durerFont(): StrokeFontFile {
  resetIds();
  const glyphs: Record<string, FontGlyph> = {};
  const adv = (inkWidth: number) => Math.round(inkWidth + 34);

  // ---- the standard, as a component (Dürer's own derivation base) -------
  glyphs._std = glyph("_std", { strokes: stdStrokes(0) });

  // ---- short letters -----------------------------------------------------
  glyphs.i = glyph("i", { codepoints: ["i"], components: [{ glyph: "_std" }], strokes: [
    crescent(0, SHORT),
  ], advance: adv(2 * R + T3) }); // ink −37.4 … +137.4
  glyphs.n = glyph("n", { codepoints: ["n"], components: [{ glyph: "_std" }, { glyph: "_std", dx: P }], strokes: [], advance: adv(P + 2 * R + T3) });
  glyphs.m = glyph("m", { codepoints: ["m"], components: [{ glyph: "_std" }, { glyph: "_std", dx: P }, { glyph: "_std", dx: 2 * P }], strokes: [], advance: adv(2 * P + 2 * R + T3) });

  // u and v: Dürer's first V — as n, but the far limb's top diamond is
  // replaced by an oblique cut making a peaked top [D]. [I: the peak is
  // the oblique square centred on the stem instead of on the point.]
  const uvFar = (x0: number): F[] => [pull(x0, SHORT, 0), dab(x0 + 50, SHORT, "head", "the top cut obliquely, making two angles"), footDab(x0)];
  glyphs.u = glyph("u", { codepoints: ["u"], strokes: [...stdStrokes(0), ...uvFar(P)], advance: adv(341) });
  glyphs.v = glyph("v", { codepoints: ["v"], strokes: [...stdStrokes(0), ...uvFar(P)], advance: adv(341) });
  // w: "set before it the standard limb of I" [D]
  glyphs.w = glyph("w", { codepoints: ["w"], strokes: [...stdStrokes(0), ...stdStrokes(P), ...uvFar(2 * P)], advance: adv(508) });

  // r: as I, with an equal square diagonally at top right, angle to
  // angle [D]; the shoulder descends from it [P/A].
  glyphs.r = glyph("r", { codepoints: ["r"], components: [{ glyph: "_std" }], strokes: [
    dab(T3 + 2 * R, SHORT, "head", "an equal square diagonally to the right, angle to angle"),
    { ...cstroke(PEN, "shoulder", "the shoulder sweeping down from the square",
        cspine([[T3 + 2 * R - 6, SHORT - R + 16], [T3 + 2 * R + 54, SHORT - R - 22], [T3 + 2 * R + 58, SHORT - R - 108]]), 0),
      gesture: { primitive: "bow" } },
  ], advance: adv(316) });
  // x: as r at top; a transverse diagonal at the middle, and an acute
  // tail to the left at the bottom [D, decomposition I].
  glyphs.x = glyph("x", { codepoints: ["x"], components: [{ glyph: "_std" }], strokes: [
    dab(T3 + 2 * R, SHORT, "head", "a diagonally set square appended to the right"),
    diag("leg", "the transverse across the middle", T3 + 2 * R + 14, 338, -2, 148, -45, 0.55),
    diag("tail", "an acute tail to the left from the diagonal", 42, 34, -42, -46, -45, 0.3),
  ], advance: adv(302) });

  // c: the standard without its head; the hither angle cut by a
  // diagonal; a broad transverse at top projecting one stem-width to
  // the right, cut to project half as far below [D, decomposition I].
  const cStd = (x0: number): F[] => [
    cutPull(x0, SHORT, 0), footDab(x0),
    drive("arm", "the broad transverse at top", x0 + 40, SHORT + 6, x0 + S + 57),
  ];
  glyphs.c = glyph("c", { codepoints: ["c"], strokes: cStd(0), advance: adv(258) });
  // e: c's standard, with a broad limb descending right from the
  // diagonal of one square, and a small diagonal back to the stem [D/I].
  glyphs.e = glyph("e", { codepoints: ["e"], strokes: [
    ...cStd(0),
    diag("eye", "a broad limb descending to the right", S + 12, SHORT + 28, S + 84, SHORT - 36, 45),
  ], advance: adv(258) });
  // t: like c, but the top diagonal converges to a fine point [D/I].
  glyphs.t = glyph("t", { codepoints: ["t"], strokes: [
    pull(0, SHORT, 0), footDab(0),
    diag("head", "the top converging to a fine point", -2, SHORT - 22, 48, SHORT + 32, 45),
    drive("arm", "the broad transverse at top", -8, SHORT + 6, S + 92),
  ], advance: adv(270) });

  // long s: like L (below) but of short height, with a broad limb at
  // top right of the diagonal's length [D/I]. This is the text s;
  // the curved short s follows as an alternate.
  glyphs.s = glyph("s", { codepoints: ["s", "ſ"], strokes: [
    cutPull(0, SHORT, 0), footDab(0),
    drive("arm", "a broad limb to the right at top", 58, SHORT - 32, S + 84),
  ], advance: adv(236) });
  // f: the long s with a transverse limb at short-letter height,
  // double as long as broad [D/I].
  glyphs.f = glyph("f", { codepoints: ["f"], strokes: [
    cutPull(0, TALL - 100, 0), footDab(0),
    drive("bar", "a transverse limb at the height of the shorter letters", 26, SHORT, S + 128),
    diag("bar", "its point projecting below on the hither side", 26, SHORT, 2, SHORT - 48, -45, 0.5),
  ], advance: adv(298) });

  // ---- tall letters (seven squares) --------------------------------------
  const tallStem = (x0: number): F[] => [
    cutPull(x0, TALL, 0), footDab(x0),
  ];
  glyphs.l = glyph("l", { codepoints: ["l"], strokes: tallStem(0), advance: adv(141) });
  // b: the tall first upright (seventh square cut from its lower hither
  // angle) with the bowl standard to its right [D/I].
  glyphs.b = glyph("b", { codepoints: ["b"], strokes: [
    cutPull(0, TALL, 0), footDab(0),
    ...stdStrokes(P),
  ], advance: adv(308) });
  // q: b turned upside down [D] — authored directly: a short standard
  // at left (head only), the right limb descending two squares with
  // its foot diamond at the bottom.
  glyphs.q = glyph("q", { codepoints: ["q"], strokes: [
    pull(0, SHORT, 0), headDab(0, SHORT),
    pull(P, SHORT, -200), headDab(P, SHORT), footDab(P, -200),
    drive("arm", "the joining limb at the bottom", 60, 6, P + 40),
  ], advance: adv(P + 2 * R + T3) });
  // h: the near limb like L; the far like I, but its foot diamond is
  // replaced by a fourth square in line and a fifth cut by a diagonal [D/I].
  glyphs.h = glyph("h", { codepoints: ["h"], strokes: [
    ...tallStem(0),
    pull(P, SHORT, 0), headDab(P, SHORT),
    diag("foot", "the fifth square cut off on the far side by its diagonal", P + 10, 64, P + 94, 4, -45),
  ], advance: adv(306) });
  // d: below like b; the anterior limb ascends to the full height and a
  // broken limb of conjunct squares rests across the top [D/I].
  glyphs.d = glyph("d", { codepoints: ["d"], strokes: [
    ...tallStem(0), ...stdStrokes(P),
    drive("arm", "the broken limb across the top", 34, TALL - 84, P + 66),
  ], advance: adv(318) });
  // o: as d, and the same at the top as at the bottom, turned upside
  // down [D] — two standards joined by diagonal limbs top and bottom [I].
  glyphs.o = glyph("o", { codepoints: ["o"], components: [{ glyph: "_std" }, { glyph: "_std", dx: P }], strokes: [
    drive("arm", "the joining limb at top", 28, SHORT + 34, P + 72),
    drive("arm", "the joining limb at bottom", 28, -34, P + 72),
  ], advance: adv(P + 2 * R + T3) });
  // p: the anterior limb like L inverted (descending, head diamond,
  // cut foot); the posterior like I but amputated diagonally at the
  // bottom, with a broad transverse whose point projects s/2 left [D/I].
  glyphs.p = glyph("p", { codepoints: ["p"], strokes: [
    pull(0, SHORT, -200), headDab(0, SHORT),
    pull(P, SHORT, 0), headDab(P, SHORT),
    drive("arm", "a broad transverse limb at the bottom", P - 2, 16, P + 125),
  ], advance: adv(377) });
  // k: the near limb like L; a diagonal square appended right, an
  // oblique line to the stem, and a broad oblique limb cut at bottom [D/I].
  glyphs.k = glyph("k", { codepoints: ["k"], strokes: [
    ...tallStem(0),
    dab(T3 + 2 * R, TALL - 62, "head", "a diagonal square appended to the right"),
    diag("leg", "a broad limb obliquely drawn", T3 + 2 * R, TALL - 62 - R, T3 + 2 * R + 128, 330, -45),
  ], advance: adv(352) });

  // ---- the interpretive remainder (module facts exact; decomposition [I])
  // a: below like n; the posterior's top part inclined left with a
  // circle sweeping down to the anterior limb [D/I].
  glyphs.a = glyph("a", { codepoints: ["a"], strokes: [
    ...stdStrokes(0),
    pull(P, SHORT - 70, 0), footDab(P),
    { ...cstroke(PEN, "bowl", "a circle sweeping downwards to the left",
        cspine([[P + 98, SHORT - 70], [P + 72, SHORT + 66], [P + 2, SHORT + 52], [P - 20, SHORT - 40]]), 0),
      gesture: { primitive: "bow" } },
  ], advance: adv(350) });
  // g: the first limb below like I with another diagonal square joined
  // angle to angle beneath it; the far standard entire; diagonals and
  // a transverse at top [D/I — his most composite letter].
  glyphs.g = glyph("g", { codepoints: ["g"], strokes: [
    ...stdStrokes(0), ...stdStrokes(P),
    dab(2 * T3, -2 * R, "foot", "another diagonal square at the bottom, angle to angle"),
    { ...cstroke(PEN, "tail", "the tail curving down from the far limb",
        cspine([[P + 94, -16], [P + 80, -118], [P + 16, -178], [P - 30, -140]]), 0),
      gesture: { primitive: "bow" } },
  ], advance: adv(346) });
  // y: as n, but the far bottom diamond is replaced by a right square,
  // the fifth split by a diagonal, and a diagonal line of one side's
  // length produced from its tip [D/I].
  glyphs.y = glyph("y", { codepoints: ["y"], strokes: [
    ...stdStrokes(0),
    pull(P, SHORT, -S), headDab(P, SHORT),
    { ...stroke(PEN, "tail", "the fifth square split by a diagonal, its tip in front, and a diagonal line produced of one side's length",
        spine([[P + 8, -38], [P + 92, -102], [P + 92 + 71, -102 - 71]], ["line", "line"]), -45),
      gesture: { primitive: "pull" },
      points: [{ node: 0, widthFactor: 1 }, { node: 1, widthFactor: 0.8 }, { node: 2, widthFactor: 0.55 }] },
  ], advance: adv(380) });
  // z: three diagonal squares set atop one another, the lowest with a
  // rounded extension whose tip verges to the left [D/I].
  glyphs.z = glyph("z", { codepoints: ["z"], strokes: [
    dab(50, SHORT - R, "head", "the first diagonal square, touching the height"),
    dab(50, SHORT - 3 * R, "stem", "the second diagonal square"),
    dab(50, SHORT - 5 * R, "foot", "the third diagonal square"),
    { ...cstroke(PEN, "tail", "a rounded extension, its tip verging to the left",
        cspine([[92, SHORT - 6 * R + 20], [108, 30], [76, -58], [18, -92]]), 0),
      gesture: { primitive: "bow" } },
  ], advance: adv(178) });
  // the curved, or short, s: two oblique squares at mid height, angles
  // touching; broad limbs up and down from them, cut so their tips face
  // the middle; a diagonal descending right-to-left cutting both [D/I].
  glyphs.sRound = glyph("sRound", { strokes: [
    pull(17, SHORT, 300 - R, "a broad vertical limb to the height"),
    dab(50, 300, "spine", "the near oblique square at the middle height"),
    dab(50 + 2 * R, 300, "spine", "the farther oblique square, angles touching"),
    pull(17 + 2 * R, 300 + R, 0, "a broad limb falling downwards"),
    diag("spine", "a diagonal downwards, cutting off both oblique limbs", 196, 452, 58, 148, -45),
  ], advance: adv(283) });
  // j: not Dürer's (his alphabet has none) — the i standard on a
  // descending stem, our completion in his manner, as Adams supplies one.
  glyphs.j = glyph("j", { codepoints: ["j"], ductusKind: "translated", strokes: [
    pull(0, SHORT, -200), headDab(0, SHORT), footDab(0, -200), crescent(0, SHORT),
  ], advance: adv(2 * R + T3) });

  const encoding: Record<string, string> = {};
  for (const g of Object.values(glyphs)) for (const cp of g.codepoints ?? []) encoding[cp] = g.name;
  const moves = [...new Set(Object.values(glyphs).flatMap((g) => g.strokes.map((s) => s.move).filter((m): m is string => !!m)))];

  return {
    format: "strokefont",
    version: 1,
    name: "Dürer Textura",
    designer: "StrokeCore",
    sourceNote: "The Text or Quadrate letters of Albrecht Dürer, Of the Just Shaping of Letters (1525), Book III: a module square whose side is the stem width; short letters five squares stacked, tall letters seven; oblique (diagonal) squares centred on the stack edges at the third-points; standards at a pitch of s + 2s/3. Stack count and diamond placement follow Dürer's skeleton plate where the translated prose differs (see docs/sources/durer-1525-notes.md). Versals are not included: Dürer gives them only as a plate in the elegant variant. The j is an editorial completion in his manner.",
    unitsPerEm: 1000,
    referenceTool: PEN,
    construction: { grid: { kind: "square-lattice", module: S, stack: { short: 5, tall: 7 }, diamondCentre: { top: 1 / 3, bottom: 2 / 3 } } },
    ladder: { xHeight: 5, ascender: 2, descender: 2, capHeight: 7 },
    slant: 0,
    tools: [
      { name: PEN, tip: { kind: "rect", width: S, thickness: 18 }, direction: "manner" },
      { name: SQ, tip: { kind: "rect", width: S, thickness: S }, direction: "any" },
    ],
    moves,
    primitives: { dab: { size: S, angle: 45 } },
    glyphs,
    encoding,
    bearings: { defaultLeft: 17, defaultRight: 17 },
  };
}
