// Imperial Capitals (Phase 3, ductus set 2) — Harris pp. 113–119:
// Trajan in form, flat-brush in construction (Catich's tradition).
// Cap height 720 = 8 brush widths (brush 90 wide). The captions'
// quantified twists ("twist the brush from 30° to 90°", "turn the
// brush over and twist from 150° to 90°") are twistDeg keyframes.
import type { FontGlyph, StrokeFontFile } from "../font.js";
import { L, arc, resetIds, spine, stroke } from "./authoring.js";
import type { FileStroke } from "../font.js";

const T = "imperial brush";
const CAP = 720;

function glyph(name: string, g: Partial<FontGlyph> & { strokes: FontGlyph["strokes"] }): FontGlyph {
  g.strokes.forEach((s, i) => (s.id = `${name}-${i + 1}`));
  return { name, ductusKind: "native", ...g } as FontGlyph;
}

const stemStroke = (x: number, top = CAP, bot = 0): FileStroke =>
  stroke(T, "stem", "pull the stem down", L(x, top, x, bot), 0);

/** A serif drawn as a short horizontal stroke with a brush twist. */
const serif = (x1: number, y1: number, x2: number, y2: number, from: number, to: number, move: string): FileStroke => ({
  ...stroke(T, "serif", move, L(x1, y1, x2, y2), 0),
  points: [{ node: 0, twistDeg: from }, { node: 1, twistDeg: to }],
});

const capStemStrokes = (): FileStroke[] => [
  stemStroke(110),
  serif(58, 710, 162, 709, 30, 0, "top serif"),
  serif(58, 10, 162, 11, -30, 0, "foot serif"),
];

const eArms = (): FileStroke[] => [
  { ...stroke(T, "arm", "top arm: twist the brush from 30 to 90 degrees to create the top serif", L(110, 706, 432, 706), 0),
    points: [{ node: 0, twistDeg: 30 }, { node: 1, twistDeg: 90 }] },
  stroke(T, "arm", "middle arm", L(110, 366, 372, 366), 0),
];
const eFoot = (): FileStroke => ({
  ...stroke(T, "arm", "foot: turn the brush over and twist from 150 to 90 degrees", L(110, 14, 446, 14), 0),
  points: [{ node: 0, twistDeg: 150 }, { node: 1, twistDeg: 90 }],
});

const cArc = (): FileStroke =>
  stroke(T, "bowl", "main arc of the C", spine(
    [[470, 650], [76, 372], [316, 2]],
    [[320, 736, -64, 640], [-64, 168, 150, 26]],
  ), 0);

const pBowl = (): FileStroke[] => [
  stroke(T, "bowl", "top arc of the bowl", arc(112, 708, 260, 724, 448, 668, 452, 540), 0),
  stroke(T, "bowl", "bowl curving back to the stem", arc(452, 540, 448, 408, 300, 344, 114, 336), 0),
];

export function imperialFont(): StrokeFontFile {
  resetIds();
  const glyphs: Record<string, FontGlyph> = {};

  glyphs._capStem = glyph("_capStem", { strokes: capStemStrokes() });
  glyphs._eArms = glyph("_eArms", { strokes: eArms() });
  glyphs._cArc = glyph("_cArc", { strokes: [cArc()] });
  glyphs._pBowl = glyph("_pBowl", { strokes: pBowl() });

  glyphs.I = glyph("I", { codepoints: ["I"], components: [{ glyph: "_capStem" }], strokes: [], advance: 220 });
  glyphs.E = glyph("E", { codepoints: ["E"], components: [{ glyph: "_capStem" }, { glyph: "_eArms" }], strokes: [eFoot()], advance: 520 });
  glyphs.F = glyph("F", { codepoints: ["F"], components: [{ glyph: "_capStem" }, { glyph: "_eArms" }], strokes: [], advance: 500 });
  glyphs.L = glyph("L", {
    codepoints: ["L"],
    components: [{ glyph: "_capStem" }],
    strokes: [{ ...stroke(T, "arm", "foot of the L (the E's foot, longer): turn the brush over and twist from 150 to 90 degrees", L(110, 14, 590, 14), 0),
      points: [{ node: 0, twistDeg: 150 }, { node: 1, twistDeg: 90 }] }],
    advance: 660,
  });
  glyphs.H = glyph("H", {
    codepoints: ["H"],
    components: [{ glyph: "_capStem" }, { glyph: "_capStem", dx: 408 }],
    strokes: [stroke(T, "bar", "crossbar drawn at 30 degrees, joining two I's", L(110, 366, 540, 366), 30)],
    advance: 700,
  });
  glyphs.P = glyph("P", { codepoints: ["P"], components: [{ glyph: "_capStem" }, { glyph: "_pBowl" }], strokes: [], advance: 540 });
  glyphs.R = glyph("R", {
    codepoints: ["R"],
    components: [{ glyph: "_capStem" }, { glyph: "_pBowl" }],
    strokes: [{ ...stroke(T, "leg", "tail of the R: flatten the brush to the horizontal before edging off", spine([[298, 340], [560, 84], [716, 2]], [[470, 220, 540, 130], [620, 36, 672, 6]]), 0),
      points: [{ node: 0, twistDeg: 0 }, { node: 2, twistDeg: 85 }] }],
    advance: 790,
  });
  glyphs.C = glyph("C", {
    codepoints: ["C"],
    components: [{ glyph: "_cArc" }],
    strokes: [
      serif(470, 650, 566, 672, 30, 90, "top serif: twist the brush from 30 to 90 degrees"),
      { ...stroke(T, "serif", "bottom serif: turn the brush over and twist from 150 degrees", L(316, 4, 470, 40), 0),
        points: [{ node: 0, twistDeg: 150 }, { node: 1, twistDeg: 90 }] },
    ],
    advance: 690,
  });
  glyphs.G = glyph("G", {
    codepoints: ["G"],
    components: [{ glyph: "_cArc" }],
    strokes: [
      serif(470, 650, 566, 672, 30, 90, "top serif, as the C"),
      serif(490, 330, 590, 330, 30, 90, "top serif of the stem: pull horizontally, then twist 30 to 90"),
      stemStroke(540, 330, 16),
    ],
    advance: 720,
  });
  glyphs.O = glyph("O", {
    codepoints: ["O"],
    strokes: [
      stroke(T, "bowl", "left arc of the O", arc(330, CAP, 10, 688, 10, 32, 330, 0), 0),
      stroke(T, "bowl", "right arc of the O", arc(330, 0, 650, 32, 650, 688, 330, CAP), 0),
    ],
    advance: 790,
  });
  glyphs.Q = glyph("Q", {
    codepoints: ["Q"],
    components: [{ glyph: "O" }],
    strokes: [{ ...stroke(T, "tail", "tail of the Q: sweeps well below the baseline, breaking the bilinear form; slightly turn the brush to horizontal before edging off", L(520, 150, 1500, -260), 20),
      points: [{ node: 0, twistDeg: 0 }, { node: 1, twistDeg: 70 }] }],
    advance: 1560,
  });
  glyphs.D = glyph("D", {
    codepoints: ["D"],
    components: [{ glyph: "_capStem" }],
    strokes: [
      stroke(T, "bowl", "pull to the right before commencing the arc", spine(
        [[112, 710], [700, 668], [708, 352], [114, 6]],
        [[240, 716, 660, 700], [740, 540, 740, 200], [680, 60, 260, 4]],
      ), 0),
    ],
    advance: 800,
  });
  glyphs.B = glyph("B", {
    codepoints: ["B"],
    components: [{ glyph: "_capStem" }],
    strokes: [
      stroke(T, "bowl", "upper bowl", spine([[112, 708], [330, 692], [392, 548]], [[230, 716, 340, 668], [380, 620, 392, 580]]), 0),
      stroke(T, "bowl", "joining stroke, always above the stem's centre", arc(392, 548, 380, 452, 280, 392, 114, 384), 0),
      stroke(T, "bowl", "lower bowl, one sweep, with the fillet at the stem's foot", spine([[114, 384], [368, 372], [436, 176], [114, 8]], [[280, 388, 380, 340], [448, 260, 420, 110], [380, 30, 240, 2]]), 0),
    ],
    advance: 560,
  });
  glyphs.A = glyph("A", {
    codepoints: ["A"],
    strokes: [
      stroke(T, "serif", "draw the apex first", L(330, 726, 358, 726), 25),
      stroke(T, "stem", "right leg down (the thick leg)", L(344, 718, 648, 4), 25),
      stroke(T, "stem", "left leg (always thinner than the right)", L(40, 4, 344, 718), 25),
      serif(596, 8, 668, 8, 0, -35, "right foot serif: edge off with the tip of the brush"),
      stroke(T, "bar", "crossbar (lower in modern work)", L(190, 214, 498, 214), 25),
      serif(20, 8, 88, 8, 0, 35, "left foot serif"),
    ],
    advance: 710,
  });
  glyphs.M = glyph("M", {
    codepoints: ["M"],
    strokes: [
      stroke(T, "serif", "the apex must be drawn first", L(390, 726, 418, 726), 0),
      stemStroke(68),
      stroke(T, "stem", "first inner diagonal (thick)", L(70, 712, 404, 66), 12),
      stroke(T, "stem", "second inner diagonal (thin)", L(404, 66, 738, 712), 12),
      stemStroke(740),
      serif(712, 8, 786, 8, 0, -35, "right foot: edging off"),
    ],
    advance: 860,
  });
  glyphs.N = glyph("N", {
    codepoints: ["N"],
    strokes: [
      stroke(T, "serif", "draw the apex of the letter first", L(52, 726, 84, 726), 0),
      stemStroke(68),
      stroke(T, "stem", "the diagonal is the thickest of the three strokes", L(92, 700, 700, 34), 15),
      { ...stemStroke(724), points: [{ node: 0, twistDeg: 0 }, { node: 1, twistDeg: -12 }] },
    ],
    advance: 790,
  });
  glyphs.K = glyph("K", {
    codepoints: ["K"],
    components: [{ glyph: "_capStem" }],
    strokes: [
      stroke(T, "arm", "arm, like the right fork of the V", L(208, 302, 540, 688), 18),
      stroke(T, "leg", "leg: turn the brush to the horizontal before edging off", spine([[220, 282], [580, 12], [640, 18]], ["line", [590, 24, 610, 18]]), 18),
    ],
    advance: 730,
  });
  glyphs.J = glyph("J", {
    codepoints: ["J"],
    strokes: [
      serif(218, 710, 314, 709, 30, 0, "top serif"),
      stemStroke(268, CAP, 150),
      stroke(T, "tail", "tail sweeping out to the left", arc(268, 150, 264, -24, 188, -44, 144, -14), 0),
    ],
    advance: 340,
  });
  glyphs.S = glyph("S", {
    codepoints: ["S"],
    strokes: [
      { ...stroke(T, "spine", "top curve of the S", spine([[427, 628], [300, 716], [183, 548]], [[375, 700, 332, 716], [245, 690, 208, 620]]), 0),
        points: [{ node: 2, twistDeg: 40 }] },
      serif(200, 148, 134, 66, 60, 0, "tail serif, drawn second, while the hand remembers (tip first)"),
      stroke(T, "spine", "main curve into the tail", spine([[183, 548], [324, 316], [412, 148], [208, 140]], [[252, 420, 317, 360], [404, 260, 412, 190], [360, 128, 274, 138]]), 0),
    ],
    advance: 430,
  });
  glyphs.T = glyph("T", {
    codepoints: ["T"],
    strokes: [
      { ...stroke(T, "arm", "cross stroke first: edge twisting back to 30, finishing at 90 degrees", spine([[58, 700], [330, 712], [602, 700]], ["line", "line"]), 0),
        points: [{ node: 0, twistDeg: 62 }, { node: 1, twistDeg: 30 }, { node: 2, twistDeg: 90 }] },
      stemStroke(330, 700, 0),
      serif(278, 10, 382, 11, -30, 0, "foot serif"),
    ],
    advance: 660,
  });
  glyphs.U = glyph("U", {
    codepoints: ["U"],
    strokes: [
      stemStroke(84, CAP, 190),
      stroke(T, "bowl", "bottom curve sweeping up to meet the right stem", arc(84, 190, 96, -8, 330, -12, 468, 118), 0),
      stroke(T, "stem", "right stem", L(556, CAP, 500, 100), 0),
      serif(32, 710, 136, 709, 30, 0, "top serif, left stem"),
      serif(504, 710, 608, 709, 30, 0, "top serif, right stem"),
    ],
    advance: 660,
  });
  glyphs.V = glyph("V", {
    codepoints: ["V"],
    strokes: [
      { ...stroke(T, "stem", "first stroke: begins as a vertical, finishes at the apex", L(40, CAP, 400, 4), 8),
        points: [{ node: 0, twistDeg: 0 }, { node: 1, twistDeg: 22 }] },
      stroke(T, "stem", "second stroke: slightly twist the brush to finish at its angle", L(760, CAP, 400, 4), 8),
    ],
    advance: 840,
  });
  glyphs.W = glyph("W", {
    codepoints: ["W"],
    strokes: [
      stroke(T, "stem", "first V, down", L(36, CAP, 196, 4), 8),
      stroke(T, "stem", "first V, up", L(356, CAP, 196, 4), 8),
      stroke(T, "stem", "second V, down (crossing)", L(356, 4, 516, CAP), 8),
      stroke(T, "stem", "second V, up", L(676, CAP, 516, 4), 8),
    ],
    advance: 720,
  });
  glyphs.X = glyph("X", {
    codepoints: ["X"],
    strokes: [
      stroke(T, "stem", "down diagonal (top v smaller than the bottom)", L(84, CAP, 556, 0), 12),
      stroke(T, "stem", "cross diagonal; no serif on the right inner leg", L(84, 0, 556, CAP), 12),
    ],
    advance: 640,
  });
  glyphs.Y = glyph("Y", {
    codepoints: ["Y"],
    strokes: [
      stroke(T, "stem", "left arm", L(60, CAP, 320, 330), 10),
      stroke(T, "stem", "right arm", L(580, CAP, 320, 330), 10),
      stemStroke(320, 330, 0),
    ],
    advance: 640,
  });
  glyphs.Z = glyph("Z", {
    codepoints: ["Z"],
    strokes: [
      { ...stroke(T, "arm", "top arm: twist the brush to 30 degrees and move horizontally", L(92, 706, 560, 706), 0),
        points: [{ node: 0, twistDeg: 30 }, { node: 1, twistDeg: 30 }] },
      stroke(T, "stem", "diagonal: brush held near the horizontal to create a thick diagonal", L(556, 700, 96, 22), 84),
      { ...stroke(T, "arm", "bottom arm: turn the brush over and twist from 150 to 90 degrees", L(92, 14, 560, 14), 0),
        points: [{ node: 0, twistDeg: 150 }, { node: 1, twistDeg: 90 }] },
    ],
    advance: 640,
  });

  const encoding: Record<string, string> = {};
  for (const g of Object.values(glyphs)) for (const cp of g.codepoints ?? []) encoding[cp] = g.name;

  return {
    format: "strokefont",
    version: 1,
    name: "Imperial Capitals",
    designer: "StrokeCore",
    sourceNote: "Brush-drawn Trajan capitals after David Harris, The Art of Calligraphy, pp. 113-119 (Catich's tradition). Flat brush, cap height 8 brush widths.",
    unitsPerEm: 1000,
    referenceTool: T,
    ladder: { xHeight: 5, ascender: 2, descender: 2, capHeight: 8 },
    slant: 0,
    tools: [{ name: T, tip: { kind: "flatBrush", width: 90, thickness: 20 }, direction: "any" }],
    moves: ["pull the stem down", "twist the brush from 30 to 90 degrees", "turn the brush over and twist from 150 to 90 degrees"],
    glyphs,
    encoding,
    bearings: { defaultLeft: 26, defaultRight: 26 },
  };
}
