// Foundational minuscules (Phase 3, ductus set 1) — after Jean Formo's
// exemplar (ladder 4/3/3, nib at 30°) and Harris pp. 44–45 (stroke
// splits and captions). Units: nib width = 100, so waist = 400,
// ascender = 700, descender = -300. The serif+stem of b, d, h, k is
// letter l's stem, referenced as a component — as the books teach it.
import type { FontGlyph, StrokeFontFile } from "../font.js";
import { L, arc, cspine, cstroke, resetIds, spine, stem, stemBare, stroke } from "./authoring.js";

const T = "foundational nib";

function glyph(name: string, g: Partial<FontGlyph> & { strokes: FontGlyph["strokes"] }): FontGlyph {
  g.strokes.forEach((s, i) => (s.id = `${name}-${i + 1}`));
  return { name, ductusKind: "native", ...g } as FontGlyph;
}

// The o is authored on the composite scaffold (§4.5): each side is a
// TRUE CIRCULAR ARC through three declared points — top join, side,
// bottom join — the way the letter is constructed, not a cubic whose
// control points sit off the curve. (Overlay history: Harris's o is
// broad, ink ≈ 1.17× as wide as tall, and its ink spans the ladder
// lines, so the joins sit ±32 inside the lines for the nib's
// projection and the sides at ±188.)

/** Bowl on the left of a right-hand stem (d, q): the o-bowl, joined
 * to the stem at top and bottom. Stem lands at x ≈ 278. */
// Composite bowls (§4.5): the bowl side is a true circular arc
// through three declared points, as with the o. Anchored at x = 296
// (d's stem lands at 300 via component dx, q's at 278). The pixel
// diff showed the bowl too narrow and pinched at the top: fuller
// top spline and the arc's through-point pushed out to x = 8.
const bowlLeft = () => [
  { ...cstroke(T, "bowl", "top arc and left curve of the bowl", cspine([
    [296, 368], [205, 396], [130, 392], { x: 8, y: 205, kind: "arcThrough" }, [110, 36],
  ])), gesture: { primitive: "arc" } },
  { ...cstroke(T, "bowl", "bottom arc back to the stem", cspine([[110, 36], [200, 8], [296, 32]])), gesture: { primitive: "arc" }, purpose: { function: "closes", target: "bowl" } },
];

/** Bowl on the right of a left-hand stem (b, p). Stem at x ≈ 110. */
const bowlRight = () => [
  cstroke(T, "bowl", "top arc of the bowl", cspine([
    [118, 366], { x: 430, y: 320, kind: "arcThrough" }, [452, 205],
  ])),
  cstroke(T, "bowl", "bottom arc of the bowl", cspine([
    [452, 205], { x: 428, y: 88, kind: "arcThrough" }, [118, 32],
  ])),
];

const archStrokes = (fromX: number, toX: number) => [
  cstroke(T, "arch", "arch over to the second stem", cspine([
    [fromX, 316], [fromX + 42, 370], [toX - 42, 376], [toX, 362],
  ])),
];

export function foundationalFont(): StrokeFontFile {
  resetIds();
  const glyphs: Record<string, FontGlyph> = {};

  glyphs._stemAsc = glyph("_stemAsc", { strokes: [{ ...stem(T, 110, 700, 0, "serif and stem (see letter l)"), gesture: { primitive: "pull" } }] });
  glyphs._stemX = glyph("_stemX", { strokes: [{ ...stem(T, 110, 400, 0), gesture: { primitive: "pull" } }] });

  glyphs.l = glyph("l", { codepoints: ["l"], components: [{ glyph: "_stemAsc" }], strokes: [], advance: 190 });
  glyphs.i = glyph("i", {
    codepoints: ["i"], components: [{ glyph: "_stemX" }],
    strokes: [{ ...stroke(T, "dot", "dot of the i (Harris dots his i and j)", L(82, 540, 110, 512)), gesture: { primitive: "dab" }, purpose: { function: "dots", target: "stem" } }],
    advance: 190,
  });
  glyphs.o = glyph("o", {
    codepoints: ["o"],
    strokes: [
      { ...cstroke(T, "bowl", "left curve of the o", cspine([[220, 368], { x: 32, y: 200, kind: "arcThrough" }, [220, 32]])), gesture: { primitive: "arc" } },
      { ...cstroke(T, "bowl", "right curve of the o", cspine([[220, 32], { x: 408, y: 200, kind: "arcThrough" }, [220, 368]])), gesture: { primitive: "arc" } },
    ],
    advance: 560,
  });

  // Harris p.44, corrected by overlay: the letter is wide (ink ≈ 0.93
  // of its height), its middle is a straight DIAGONAL from the stem
  // down-left, and the bottom is a sweep along the baseline — not a
  // closed oval bowl. 4 strokes: arc+left curve, stem, diagonal, sweep.
  glyphs.a = glyph("a", {
    codepoints: ["a"],
    strokes: [
      { ...cstroke(T, "bowl", "top arc and left curve, hooked entry", cspine([
        [356, 382], [322, 396], [262, 400], [200, 388], { x: 66, y: 215, kind: "arcThrough" }, [92, 108], [130, 24],
      ])), gesture: { primitive: "arc" } },
      { ...stem(T, 345, 400, 0, "stem down"), gesture: { primitive: "pull" } },
      { ...cstroke(T, "bowl", "diagonal stroke, a hairline", cspine([
        { x: 336, y: 268, widthFactor: 0.3 }, { x: 238, y: 186, widthFactor: 0.3 }, { x: 158, y: 84, widthFactor: 0.3 },
      ])), gesture: { primitive: "pull" }, purpose: { function: "joins", target: "stem" } },
      { ...cstroke(T, "bowl", "bottom sweep along the baseline", cspine([[110, 34], [150, 4], [225, -4], [300, 0], [345, 12]])), gesture: { primitive: "bow", config: { guide: "baseline" } }, purpose: { function: "closes", target: "bowl" } },
    ],
    advance: 430,
  });

  glyphs.c = glyph("c", {
    codepoints: ["c"],
    strokes: [
      cstroke(T, "bowl", "top arc", cspine([[300, 330], [238, 374], [168, 378], [122, 362]])),
      cstroke(T, "bowl", "pull the first stroke along the baseline", cspine([
        [122, 362], { x: 30, y: 205, kind: "arcThrough" }, [148, 38], [232, 14], [300, 46],
      ])),
    ],
    advance: 385,
  });

  // Harris p.44 ductus: 1 = the left curve AND the bottom curve as one
  // stroke; 2 = the eye arc with its underside sweep; 3 = the bar.
  glyphs.e = glyph("e", {
    codepoints: ["e"],
    strokes: [
      { ...cstroke(T, "bowl", "left curve and bottom curve in one stroke", cspine([
        [330, 348], { x: 50, y: 205, kind: "arcThrough" }, [158, 34], [252, 12], [335, 48],
      ])), gesture: { primitive: "arc" } },
      { ...cstroke(T, "eye", "eye arc with underside sweep", cspine([
        [332, 352], [268, 394], [168, 400], [96, 362], [74, 312], [150, 270], [252, 270], [335, 295],
      ])), gesture: { primitive: "arc" } },
      { ...stroke(T, "bar", "bar of the e", L(68, 214, 338, 214)), gesture: { primitive: "drive" }, purpose: { function: "crosses", target: "eye" } },
    ],
    advance: 420,
  });

  glyphs.b = glyph("b", { codepoints: ["b"], components: [{ glyph: "_stemAsc" }], strokes: bowlRight(), advance: 480 });
  glyphs.d = glyph("d", { codepoints: ["d"], components: [{ glyph: "_stemAsc", dx: 190 }], strokes: bowlLeft(), advance: 400 });

  glyphs.g = glyph("g", {
    codepoints: ["g"],
    strokes: [
      { ...cstroke(T, "bowl", "left curve of the upper bowl", cspine([
        [215, 376], { x: 58, y: 262, kind: "arcThrough" }, [215, 196],
      ])), gesture: { primitive: "arc" } },
      { ...cstroke(T, "bowl", "bottom curve of the upper bowl", cspine([[215, 196], [300, 196], [336, 238]])), gesture: { primitive: "arc" } },
      { ...cstroke(T, "ear", "top arc into the ear", cspine([[215, 376], [292, 390], [342, 354], [414, 346]])), gesture: { primitive: "flick" }, purpose: { function: "completes", target: "bowl" } },
      { ...cstroke(T, "link", "link curving down from the bowl", cspine([[336, 260], [352, 150], [322, 30], [268, -52]])), gesture: { primitive: "bow" }, purpose: { function: "joins", target: "loop" } },
      { ...cstroke(T, "loop", "lower loop, open sweep", cspine([
        [268, -52], [258, -148], [198, -222], [118, -250], [68, -200], [60, -128], [84, -100],
      ])), gesture: { primitive: "bow" } },
    ],
    advance: 470,
  });

  glyphs.h = glyph("h", { codepoints: ["h"], components: [{ glyph: "_stemAsc" }, { glyph: "_stemX", dx: 250 }], strokes: archStrokes(110, 360), advance: 470 });
  glyphs.n = glyph("n", { codepoints: ["n"], components: [{ glyph: "_stemX" }, { glyph: "_stemX", dx: 245 }], strokes: archStrokes(110, 355), advance: 460 });
  glyphs.m = glyph("m", { codepoints: ["m"], components: [{ glyph: "_stemX" }, { glyph: "_stemX", dx: 215 }, { glyph: "_stemX", dx: 490 }], strokes: [...archStrokes(110, 325), ...archStrokes(325, 600)], advance: 680 });
  glyphs.u = glyph("u", {
    codepoints: ["u"],
    strokes: [
      stemBare(T, 92, 400, 66, "left stem down"),
      cstroke(T, "bowl", "bottom curve of the u", cspine([[92, 66], [128, 8], [215, 0], [275, 16], [330, 58]])),
      stem(T, 340, 400, 62, "right stem down to the curve"),
    ],
    advance: 440,
  });

  glyphs.j = glyph("j", {
    codepoints: ["j"],
    strokes: [
      { ...stroke(T, "dot", "dot of the j (Harris dots his i and j)", L(188, 540, 216, 512)), gesture: { primitive: "dab" }, purpose: { function: "dots", target: "stem" } },
      cstroke(T, "stem", "stem curving into the descender hook", cspine([[202, 368], [184, 240], [178, 80], [158, -80], [132, -180], [112, -230]])),
    ],
    advance: 215,
  });

  glyphs.k = glyph("k", {
    codepoints: ["k"],
    components: [{ glyph: "_stemAsc" }],
    strokes: [
      { ...stroke(T, "arm", "arm rising steeply from the junction", L(222, 208, 296, 318)), gesture: { primitive: "pull" }, purpose: { function: "branches", target: "stem" } },
      { ...cstroke(T, "leg", "leg sweeping down into the foot", cspine([[196, 196], [290, 120], [380, 52], [455, 22], [520, 30]]), 30), gesture: { primitive: "bow" } },
    ],
    advance: 560,
  });

  glyphs.f = glyph("f", {
    codepoints: ["f"],
    strokes: [
      cstroke(T, "stem", "top hook of the f", cspine([[154, 668], [196, 702], [262, 698], [298, 672], [312, 642]])),
      stem(T, 156, 700, 0, "stem down"),
      stroke(T, "bar", "bar of the f", L(70, 468, 332, 468)),
    ],
    advance: 375,
  });

  glyphs.p = glyph("p", { codepoints: ["p"], strokes: [stemBare(T, 110, 400, -300), ...bowlRight()], advance: 480 });
  glyphs.q = glyph("q", { codepoints: ["q"], strokes: [...bowlLeft(), stemBare(T, 278, 400, -262, "stem down into the descender")], advance: 350 });

  glyphs.r = glyph("r", {
    codepoints: ["r"],
    components: [{ glyph: "_stemX" }],
    strokes: [cstroke(T, "arch", "shoulder of the r", cspine([[112, 308], [170, 384], [252, 400], [308, 368], [332, 300]]))],
    advance: 360,
  });

  glyphs.s = glyph("s", {
    codepoints: ["s"],
    strokes: [
      cstroke(T, "spine", "top arc of the s", cspine([[262, 366], [206, 400], [118, 394], [72, 344], [66, 316]])),
      cstroke(T, "spine", "diagonal of the s, stretched horizontally", cspine([[66, 316], [80, 255], [150, 205], [235, 158], [268, 128], [282, 104]])),
      cstroke(T, "spine", "bottom curve of the s", cspine([[282, 104], [255, 28], [175, 0], [100, 8], [58, 28], [50, 44]])),
    ],
    advance: 340,
  });

  glyphs.t = glyph("t", {
    codepoints: ["t"],
    strokes: [
      { ...cstroke(T, "stem", "stem with a curved foot", cspine([[150, 566], [140, 420], [146, 200], [158, 60], [196, 10], [244, 4]])), gesture: { primitive: "pull" } },
      { ...stroke(T, "bar", "crossbar of the t, high on the stem", L(88, 448, 402, 448)), gesture: { primitive: "drive" }, purpose: { function: "crosses", target: "stem" } },
    ],
    advance: 430,
  });

  glyphs.v = glyph("v", {
    codepoints: ["v"],
    strokes: [
      { ...stroke(T, "stem", "first diagonal, pen at 45°", L(36, 368, 225, 30)), angleDeg: 45 },
      cstroke(T, "stem", "second diagonal, curving up, pen at 30°", cspine([[225, 30], [330, 180], [455, 368]]), 30),
    ],
    advance: 500,
  });
  glyphs.w = glyph("w", {
    codepoints: ["w"],
    strokes: [
      { ...stroke(T, "stem", "first diagonal, 45°", L(36, 368, 185, 30)), angleDeg: 45 },
      { ...stroke(T, "stem", "second diagonal, 30°", L(330, 368, 185, 30)), angleDeg: 30 },
      { ...stroke(T, "stem", "third diagonal, 45°", L(330, 368, 480, 30)), angleDeg: 45 },
      cstroke(T, "stem", "fourth diagonal, curving up, 30°", cspine([[480, 30], [560, 170], [625, 368]]), 30),
    ],
    advance: 680,
  });
  glyphs.x = glyph("x", {
    codepoints: ["x"],
    strokes: [
      { ...cstroke(T, "stem", "down diagonal, bowed, 45°", cspine([[36, 372], [140, 285], [238, 192], [330, 100], [424, 30]]), 45), gesture: { primitive: "bow" } },
      { ...cstroke(T, "leg", "cross diagonal curving into its foot, 30° or less", cspine([[452, 384], [320, 252], [196, 128], [104, 36], [56, 14], [28, 20]]), 28), gesture: { primitive: "bow" } },
    ],
    advance: 500,
  });
  glyphs.y = glyph("y", {
    codepoints: ["y"],
    strokes: [
      { ...cstroke(T, "stem", "first diagonal, bowed, pen at 45°", cspine([
        [104, 372], [150, 300], [215, 205], [262, 100], [292, 14],
      ]), 45), gesture: { primitive: "bow" } },
      { ...cstroke(T, "stem", "second diagonal curving in to the junction, pen at 30°", cspine([
        [452, 368], [440, 240], [395, 110], [302, 14],
      ]), 30), gesture: { primitive: "bow" }, purpose: { function: "joins", target: "stem" } },
      { ...cstroke(T, "tail", "tail sweeping down to the left", cspine([
        [300, 10], [215, -55], [130, -115], [62, -148], [26, -128],
      ]), 30), gesture: { primitive: "bow" } },
    ],
    advance: 530,
  });
  glyphs.z = glyph("z", {
    codepoints: ["z"],
    strokes: [
      stroke(T, "bar", "top bar, pen at 30°", L(72, 386, 264, 386)),
      { ...stroke(T, "stem", "diagonal, pen turned to 0°", L(264, 386, 72, 14)), angleDeg: 0 },
      stroke(T, "bar", "bottom bar, pen at 30°", L(72, 14, 264, 14)),
    ],
    advance: 340,
  });

  glyphs.ampersand = glyph("ampersand", {
    codepoints: ["&"],
    strokes: [
      stroke(T, "loop", "upper loop", arc(238, 356, 190, 402, 108, 372, 118, 292)),
      stroke(T, "leg", "diagonal crossing", L(238, 356, 84, 36)),
      stroke(T, "tail", "lower sweep", spine([[84, 36], [168, 0], [256, 66]], [[110, -12, 140, 0], [196, 4, 232, 26]])),
      stroke(T, "bar", "finishing flick", L(196, 118, 262, 178)),
    ],
    advance: 340,
  });

  const encoding: Record<string, string> = {};
  for (const g of Object.values(glyphs)) for (const cp of g.codepoints ?? []) encoding[cp] = g.name;

  return {
    format: "strokefont",
    version: 1,
    name: "Foundational",
    designer: "StrokeCore",
    sourceNote: "Minuscules after Jean Formo's Foundational exemplar (2007) and David Harris, The Art of Calligraphy, pp. 44-45. Ladder 4/3/3, capitals 6, nib at 30 degrees.",
    unitsPerEm: 1000,
    referenceTool: T,
    ladder: { xHeight: 4, ascender: 3, descender: 3, capHeight: 6 },
    slant: 0,
    tools: [{ name: T, tip: { kind: "rect", width: 100, thickness: 18 }, direction: "manner" }],
    moves: ["pull the stem down", "left curve of the o", "arch over to the second stem"],
    primitives: {
      arc: { axis: 30 },
      turn: { radius: 24, rounding: "spline" },
      flick: { endWidthFactor: 0.25 },
      dab: { size: 62, angle: 30 },
    },
    patterns: {
      bowlArc: { primitive: "arc", config: { axis: 30 }, note: "the o's arc, reused by every bowl in the hand" },
      baselineSweep: { primitive: "bow", config: { guide: "baseline" } },
      diamondDot: { primitive: "dab", config: { size: 62, angle: 30 }, note: "Harris dots his i and j with a diamond" },
    },
    glyphs,
    encoding,
    bearings: { defaultLeft: 22, defaultRight: 22 },
  };
}
