// Fraktur minuscules (Phase 3, ductus set 3) — Harris pp. 76–77.
// Square-cut broad-edge at 40°, ladder 5/2/2 (nib 100 → body 500,
// ascender 700, descender -200). Spikes come from strokes extending
// past joins; f/p/q descenders twist the pen 40° toward vertical.
import type { FontGlyph, StrokeFontFile } from "../font.js";
import { L, arc, resetIds, spine, stemBare, stroke } from "./authoring.js";
import type { FileStroke } from "../font.js";

const T = "fraktur nib";
const A40 = 40;

function glyph(name: string, g: Partial<FontGlyph> & { strokes: FontGlyph["strokes"] }): FontGlyph {
  g.strokes.forEach((s, i) => (s.id = `${name}-${i + 1}`));
  return { name, ductusKind: "native", ...g } as FontGlyph;
}

/** Fraktur stem: a diagonal entry (the spike head), a straight pull, a plain foot. */
const fStem = (x: number, top: number, bot: number): FileStroke =>
  stroke(T, "stem", "stem with its spiked entry", spine(
    [[x - 36, top + 16], [x, top - 4], [x, bot + 6]],
    [[x - 12, top + 10, x, top + 2], "line"],
  ), A40);

const diamondFoot = (x: number): FileStroke =>
  stroke(T, "foot", "diamond foot", L(x - 2, 14, x + 88, -16), A40);

const minimStrokes = (): FileStroke[] => [fStem(110, 500, 0), diamondFoot(110)];
const ascStemStrokes = (): FileStroke[] => [fStem(110, 700, 0), diamondFoot(110)];

/** Bowl on the left (for d, q) and right (for b, p), body height. */
const bowlL = (): FileStroke[] => [
  stroke(T, "bowl", "left curve", spine([[118, 500], [64, 250], [118, 0]], [[58, 380, 58, 120], [70, 60, 96, 6]]), A40),
  stroke(T, "bowl", "top arc", arc(118, 500, 190, 514, 300, 488, 320, 420), A40),
  stroke(T, "bowl", "bottom arc", arc(320, 96, 310, 30, 200, -6, 118, 0), A40),
];
const bowlR = (): FileStroke[] => [
  stroke(T, "bowl", "top arc", arc(112, 486, 210, 514, 330, 488, 350, 404), A40),
  stroke(T, "bowl", "right curve and bottom arc", spine([[350, 404], [355, 110], [116, 2]], [[360, 260, 360, 180], [330, 40, 180, 2]]), A40),
];
const archF = (toX: number): FileStroke =>
  stroke(T, "arch", "fractured arch", spine([[toX - 108, 428], [toX - 60, 500], [toX, 492]], [[toX - 96, 486, toX - 78, 500], "line"]), A40);

export function frakturFont(): StrokeFontFile {
  resetIds();
  const glyphs: Record<string, FontGlyph> = {};

  glyphs._minim = glyph("_minim", { strokes: minimStrokes() });
  glyphs._ascStem = glyph("_ascStem", { strokes: ascStemStrokes() });

  glyphs.i = glyph("i", { codepoints: ["i"], components: [{ glyph: "_minim" }], strokes: [], advance: 240 });
  glyphs.l = glyph("l", { codepoints: ["l"], components: [{ glyph: "_ascStem" }], strokes: [], advance: 240 });
  glyphs.n = glyph("n", { codepoints: ["n"], components: [{ glyph: "_minim" }, { glyph: "_minim", dx: 195 }], strokes: [archF(305)], advance: 420 });
  glyphs.m = glyph("m", { codepoints: ["m"], components: [{ glyph: "_minim" }, { glyph: "_minim", dx: 215 }, { glyph: "_minim", dx: 430 }], strokes: [archF(325), archF(540)], advance: 680 });
  glyphs.h = glyph("h", { codepoints: ["h"], components: [{ glyph: "_ascStem" }, { glyph: "_minim", dx: 195 }], strokes: [archF(305)], advance: 420 });
  glyphs.u = glyph("u", {
    codepoints: ["u"],
    strokes: [
      fStem(110, 500, 60),
      stroke(T, "bowl", "bottom curve", arc(110, 60, 118, -10, 295, -8, 335, 52), A40),
      fStem(340, 500, 52),
      diamondFoot(340),
    ],
    advance: 460,
  });

  glyphs.a = glyph("a", {
    codepoints: ["a"],
    strokes: [
      stroke(T, "bowl", "left curve", spine([[120, 500], [62, 250], [120, 0]], [[56, 380, 56, 120], [68, 60, 96, 6]]), A40),
      stroke(T, "bowl", "top arc", arc(120, 500, 200, 514, 300, 488, 320, 414), A40),
      fStem(330, 500, 0),
      diamondFoot(330),
    ],
    advance: 410,
    alternates: [{
      name: "a (open form)", ductusKind: "native",
      strokes: [
        stroke(T, "bowl", "left curve", spine([[120, 500], [62, 250], [120, 0]], [[56, 380, 56, 120], [68, 60, 96, 6]]), A40),
        fStem(330, 420, 0),
      ],
    }],
  });

  glyphs.b = glyph("b", { codepoints: ["b"], components: [{ glyph: "_ascStem" }], strokes: bowlR(), advance: 410 });
  glyphs.p = glyph("p", {
    codepoints: ["p"],
    strokes: [
      { ...fStem(110, 500, -196), points: [{ node: 0, twistDeg: 0 }, { node: 2, twistDeg: 48 }] },
      ...bowlR(),
    ],
    advance: 410,
  });
  glyphs.d = glyph("d", {
    codepoints: ["d"],
    strokes: [
      ...bowlL(),
      stroke(T, "stem", "ascender curling back to the right", spine([[330, 420], [322, 690], [354, 700]], [[328, 540, 320, 630], [330, 690, 342, 698]]), A40),
      diamondFoot(330),
    ],
    advance: 410,
  });
  glyphs.q = glyph("q", {
    codepoints: ["q"],
    strokes: [
      ...bowlL(),
      { ...stemBare(T, 336, 500, -196, "stem twisting gradually to near vertical"), angleDeg: A40,
        points: [{ node: 0, twistDeg: 0 }, { node: 2, twistDeg: 48 }] },
    ],
    advance: 410,
  });

  glyphs.c = glyph("c", {
    codepoints: ["c"],
    strokes: [
      stroke(T, "bowl", "curve of the c", spine([[300, 452], [70, 250], [300, 36]], [[110, 420, 58, 340], [90, 90, 190, 30]]), A40),
      stroke(T, "spike", "top spike", L(240, 502, 300, 452), A40),
    ],
    advance: 370,
  });
  glyphs.e = glyph("e", {
    codepoints: ["e"],
    strokes: [
      stroke(T, "bowl", "top arc", arc(265, 448, 232, 502, 130, 492, 84, 380), A40),
      stroke(T, "bar", "bar of the e", L(80, 296, 262, 296), A40),
      stroke(T, "bowl", "bottom curve", spine([[84, 380], [86, 120], [265, 34]], [[76, 260, 76, 190], [120, 50, 180, 28]]), A40),
    ],
    advance: 340,
  });
  glyphs.o = glyph("o", {
    codepoints: ["o"],
    strokes: [
      stroke(T, "bowl", "left stroke", spine([[120, 500], [64, 250], [120, 0]], [[58, 380, 58, 120], [70, 60, 96, 6]]), A40),
      stroke(T, "bowl", "top join", arc(120, 500, 190, 512, 290, 494, 320, 440), A40),
      stroke(T, "stem", "right stroke", spine([[320, 440], [324, 120], [122, 2]], [[330, 280, 330, 200], [290, 50, 170, 6]]), A40),
    ],
    advance: 400,
  });

  glyphs.f = glyph("f", {
    codepoints: ["f"],
    strokes: [
      stroke(T, "stem", "top hook", arc(112, 690, 160, 716, 300, 700, 330, 652), A40),
      { ...stroke(T, "stem", "long stem: twist from 40 degrees to near vertical for the descender", spine([[112, 690], [110, 200], [104, -192]], ["line", "line"]), A40),
        points: [{ node: 0, twistDeg: 0 }, { node: 2, twistDeg: 50 }] },
      stroke(T, "bar", "cross stroke", L(66, 420, 290, 420), A40),
    ],
    advance: 340,
  });
  glyphs.g = glyph("g", {
    codepoints: ["g"],
    strokes: [
      stroke(T, "bowl", "left curve", spine([[120, 500], [62, 330], [120, 168]], [[56, 420, 56, 260], [68, 220, 96, 174]]), A40),
      stroke(T, "bowl", "top arc", arc(120, 500, 210, 514, 330, 488, 350, 414), A40),
      fStem(330, 500, 176),
      stroke(T, "bar", "crossbar of the g", L(58, 300, 330, 300), A40),
      stroke(T, "tail", "descender sweep of the g", spine([[330, 176], [320, -110], [230, -190], [150, -120]], [[326, 20, 322, -60], [290, -196, 190, -186], [140, -160, 138, -140]]), A40),
    ],
    advance: 410,
  });
  glyphs.j = glyph("j", {
    codepoints: ["j"],
    strokes: [
      stroke(T, "stem", "stem descending, hooking left", spine([[130, 500], [126, 120], [80, -176]], [[122, 506, 128, 380], [118, -40, 98, -140]]), A40),
      stroke(T, "dot", "the dot, a small spike", L(160, 560, 186, 512), A40),
    ],
    advance: 190,
  });
  glyphs.k = glyph("k", {
    codepoints: ["k"],
    components: [{ glyph: "_ascStem" }],
    strokes: [
      stroke(T, "arm", "arm", L(150, 268, 360, 492), A40),
      stroke(T, "leg", "leg", spine([[158, 250], [375, 6], [420, 10]], ["line", [380, 16, 396, 10]]), A40),
    ],
    advance: 450,
  });
  glyphs.r = glyph("r", {
    codepoints: ["r"],
    components: [{ glyph: "_minim" }],
    strokes: [
      stroke(T, "arch", "shoulder of the r", spine([[112, 428], [230, 502], [290, 428]], [[170, 494, 205, 502], [272, 488, 286, 460]]), A40),
      stroke(T, "arm", "small arm flick", L(290, 428, 330, 380), A40),
    ],
    advance: 360,
  });
  glyphs.s = glyph("s", {
    codepoints: ["s"],
    strokes: [
      stroke(T, "spine", "top curve of the round s", arc(262, 446, 205, 502, 92, 472, 92, 348), A40),
      stroke(T, "spine", "diagonal curve", arc(92, 348, 86, 190, 262, 150, 268, 66), A40),
      stroke(T, "spine", "bottom flick", arc(268, 66, 246, 6, 170, -4, 122, 26), A40),
    ],
    advance: 360,
  });
  glyphs.longs = glyph("longs", {
    codepoints: ["ſ"],
    strokes: [
      stroke(T, "stem", "the long s, one rising stroke", spine([[96, 636], [114, 320], [106, 4]], [[86, 640, 104, 520], [112, 180, 108, 60]]), A40),
      stroke(T, "arm", "shoulder of the long s", spine([[110, 352], [160, 338], [210, 306]], ["line", "line"]), A40),
      diamondFoot(106),
    ],
    advance: 260,
  });
  glyphs.t = glyph("t", {
    codepoints: ["t"],
    strokes: [
      stroke(T, "stem", "begin the t with an upward stroke", L(86, 452, 110, 502), A40),
      fStem(110, 560, 0),
      diamondFoot(110),
      stroke(T, "bar", "crossbar", L(44, 322, 232, 322), A40),
    ],
    advance: 280,
  });
  glyphs.v = glyph("v", {
    codepoints: ["v"],
    strokes: [
      fStem(110, 500, 40),
      stroke(T, "stem", "curve sweeping up to the right", spine([[110, 40], [190, -6], [370, 486]], [[140, 6, 170, -4], [260, 160, 330, 340]]), A40),
    ],
    advance: 430,
  });
  glyphs.w = glyph("w", {
    codepoints: ["w"],
    components: [{ glyph: "_minim" }],
    strokes: [
      stroke(T, "bowl", "bottom curve of the conjoined u", arc(110, 60, 118, -10, 260, -8, 300, 52), A40),
      fStem(305, 500, 40),
      stroke(T, "stem", "the v's rising curve", spine([[305, 40], [380, -6], [520, 486]], [[340, 6, 365, -4], [430, 160, 490, 340]]), A40),
    ],
    advance: 680,
  });
  glyphs.x = glyph("x", {
    codepoints: ["x"],
    components: [{ glyph: "_minim" }],
    strokes: [
      { ...stroke(T, "tail", "hairline tail, drawn with the corner of the nib", spine([[116, 250], [280, 20], [330, -28]], [[190, 160, 240, 70], [290, -6, 308, -20]]), A40),
        points: [{ node: 0, widthFactor: 0.28 }, { node: 1, widthFactor: 0.28 }, { node: 2, widthFactor: 0.28 }] },
    ],
    advance: 370,
  });
  glyphs.y = glyph("y", {
    codepoints: ["y"],
    strokes: [
      fStem(110, 500, 30),
      { ...stroke(T, "tail", "hairline tail with the corner of the nib", spine([[110, 30], [150, -60], [66, -186]], [[136, -16, 148, -36], [110, -140, 88, -172]]), A40),
        points: [{ node: 0, widthFactor: 0.3 }, { node: 1, widthFactor: 0.3 }, { node: 2, widthFactor: 0.3 }] },
      stroke(T, "stem", "right stroke", spine([[360, 486], [300, 200], [116, 36]], [[318, 340, 308, 260], [220, 110, 150, 60]]), A40),
    ],
    advance: 420,
  });
  glyphs.z = glyph("z", {
    codepoints: ["z"],
    strokes: [
      stroke(T, "arm", "top curve", arc(84, 430, 115, 502, 245, 508, 272, 452), A40),
      stroke(T, "stem", "diagonal curve", spine([[272, 452], [160, 250], [262, 60]], [[228, 360, 180, 300], [205, 160, 240, 100]]), A40),
      stroke(T, "tail", "tail sweeping below the line", spine([[262, 60], [205, -140], [105, -120]], [[240, -40, 222, -100], [160, -156, 124, -140]]), A40),
    ],
    advance: 350,
  });

  const encoding: Record<string, string> = {};
  for (const g of Object.values(glyphs)) for (const cp of g.codepoints ?? []) encoding[cp] = g.name;

  return {
    format: "strokefont",
    version: 1,
    name: "Fraktur",
    designer: "StrokeCore",
    sourceNote: "Minuscules after David Harris, The Art of Calligraphy, pp. 76-77. Square-cut nib at 40 degrees, ladder 5/2/2. Capitals not in the source; excluded.",
    unitsPerEm: 1000,
    referenceTool: T,
    ladder: { xHeight: 5, ascender: 2, descender: 2, capHeight: 8 },
    slant: 0,
    tools: [{ name: T, tip: { kind: "rect", width: 100, thickness: 20 }, direction: "manner" }],
    moves: ["stem with its spiked entry", "diamond foot", "twist from 40 degrees to near vertical"],
    glyphs,
    encoding,
    bearings: { defaultLeft: 18, defaultRight: 18 },
  };
}
