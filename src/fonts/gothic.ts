// Monoline Gothic — the drafting room's lettering (Giesecke et al.,
// Engineering Drawing; ISO 3098 lettering type B and its CAD variant
// CB). The basic case of the whole StrokeCore model: ONE tool, a
// circle tip of constant diameter — no angle, no pressure, no twist —
// and every letter constructed on a declared grid, so the geometry is
// specified by the system, never estimated by eye.
//
// The grid: cap height 6 units (1 unit = 100). Line width d = h/10
// (ISO 3098 type B), so the ladder in tip units is capHeight 10,
// x-height 7. Letter widths in units, from the manual: I has no
// width; W is 8; the six-unit letters spell TOM Q. VAXY; everything
// else is 5. Spines are inset d/2 = 30 from the ink box, so the baked
// ink spans the grid exactly. Stroke order and direction follow the
// manual's rules: horizontals left to right; vertical, inclined and
// curved strokes downward; curved letters drawn top to bottom in one
// stroke on each side. Construction geometry is likewise the manual's:
// O, Q, C, G on the circle; D, P, R, B bowls semicircular; J and U
// bottoms semi-ellipses; S, 2, 3, 8 on the figure 8 (a small ellipse
// over a larger one); 6 and 9 on the elliptical zero.
import type { FontGlyph, StrokeFontFile } from "../font.js";
import { L, cspine, cstroke, resetIds, stroke } from "./authoring.js";
import type { CompositePoint } from "../composite.js";

const T = "monoline pen";
const TOP = 570, BOT = 30, MID = 300; // spine lines (ink: 600 / 0 / 300)

function glyph(name: string, g: Partial<FontGlyph> & { strokes: FontGlyph["strokes"] }): FontGlyph {
  g.strokes.forEach((s, i) => (s.id = `${name}-${i + 1}`));
  return { name, ductusKind: "native", ...g } as FontGlyph;
}

/** Straight stroke: pull for verticals/diagonals, drive for horizontals. */
const ln = (role: string, move: string, x1: number, y1: number, x2: number, y2: number) => ({
  ...stroke(T, role, move, L(x1, y1, x2, y2)),
  gesture: { primitive: y1 === y2 ? "drive" : "pull" },
});
/** Circular-arc stroke through declared points (three-point arcs). */
const arcS = (role: string, move: string, pts: (CompositePoint | [number, number])[]) => ({
  ...cstroke(T, role, move, cspine(pts)),
  gesture: { primitive: "arc" },
});
/** Points sampled on a declared ellipse, for the figure-8 family. */
const ell = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    pts.push([Math.round(cx + rx * Math.cos(a)), Math.round(cy + ry * Math.sin(a))]);
  }
  return pts;
};
/** Spline stroke through declared points (ellipse-sampled curves). */
const bowS = (role: string, move: string, pts: [number, number][], closed = false) => ({
  ...cstroke(T, role, move, cspine(pts, closed)),
  gesture: { primitive: "bow" },
});
const AT = (x: number, y: number): CompositePoint => ({ x, y, kind: "arcThrough" });

export function gothicFont(): StrokeFontFile {
  resetIds();
  const glyphs: Record<string, FontGlyph> = {};
  const adv = (inkWidth: number) => inkWidth + 120; // ISO B character spacing a = (2/10)h

  // ---- straight-line letters -------------------------------------------
  glyphs.I = glyph("I", { codepoints: ["I"], strokes: [
    ln("stem", "stem down", 30, TOP, 30, BOT),
  ], advance: adv(60) });
  glyphs.H = glyph("H", { codepoints: ["H"], strokes: [
    ln("stem", "left stem down", 30, TOP, 30, BOT),
    ln("stem", "right stem down", 470, TOP, 470, BOT),
    ln("bar", "crossbar, left to right", 30, MID, 470, MID),
  ], advance: adv(500) });
  glyphs.E = glyph("E", { codepoints: ["E"], strokes: [
    ln("stem", "stem down", 30, TOP, 30, BOT),
    ln("arm", "top arm, left to right", 30, TOP, 470, TOP),
    ln("arm", "bottom arm, left to right", 30, BOT, 470, BOT),
    ln("arm", "middle arm, left to right", 30, MID, 400, MID),
  ], advance: adv(500) });
  glyphs.F = glyph("F", { codepoints: ["F"], strokes: [
    ln("stem", "stem down", 30, TOP, 30, BOT),
    ln("arm", "top arm, left to right", 30, TOP, 470, TOP),
    ln("arm", "middle arm, left to right", 30, MID, 400, MID),
  ], advance: adv(500) });
  glyphs.L = glyph("L", { codepoints: ["L"], strokes: [
    ln("stem", "stem down", 30, TOP, 30, BOT),
    ln("arm", "foot, left to right", 30, BOT, 470, BOT),
  ], advance: adv(500) });
  glyphs.T = glyph("T", { codepoints: ["T"], strokes: [
    ln("arm", "top bar, left to right", 30, TOP, 570, TOP),
    ln("stem", "stem down from the centre", 300, TOP, 300, BOT),
  ], advance: adv(600) });
  glyphs.A = glyph("A", { codepoints: ["A"], strokes: [
    ln("leg", "left diagonal down from the apex", 300, TOP, 30, BOT),
    ln("leg", "right diagonal down from the apex", 300, TOP, 570, BOT),
    ln("bar", "crossbar, left to right", 115, 200, 485, 200),
  ], advance: adv(600) });
  glyphs.V = glyph("V", { codepoints: ["V"], strokes: [
    ln("leg", "left diagonal down to the vertex", 30, TOP, 300, BOT),
    ln("leg", "right diagonal down to the vertex", 570, TOP, 300, BOT),
  ], advance: adv(600) });
  glyphs.X = glyph("X", { codepoints: ["X"], strokes: [
    ln("leg", "diagonal down to the right", 30, TOP, 570, BOT),
    ln("leg", "diagonal down to the left", 570, TOP, 30, BOT),
  ], advance: adv(600) });
  glyphs.Y = glyph("Y", { codepoints: ["Y"], strokes: [
    ln("leg", "left fork down to the junction", 30, TOP, 300, MID),
    ln("leg", "right fork down to the junction", 570, TOP, 300, MID),
    ln("stem", "stem down", 300, MID, 300, BOT),
  ], advance: adv(600) });
  glyphs.K = glyph("K", { codepoints: ["K"], strokes: [
    ln("stem", "stem down", 30, TOP, 30, BOT),
    ln("arm", "arm down to the stem", 460, TOP, 40, 260),
    ln("leg", "leg down to the right", 120, 230, 470, BOT),
  ], advance: adv(500) });
  glyphs.N = glyph("N", { codepoints: ["N"], strokes: [
    ln("stem", "left stem down", 30, TOP, 30, BOT),
    ln("leg", "diagonal down to the right", 30, TOP, 470, BOT),
    ln("stem", "right stem down", 470, TOP, 470, BOT),
  ], advance: adv(500) });
  glyphs.M = glyph("M", { codepoints: ["M"], strokes: [
    ln("stem", "left stem down", 30, TOP, 30, BOT),
    ln("stem", "right stem down", 570, TOP, 570, BOT),
    ln("leg", "left diagonal down to the vertex", 30, TOP, 300, MID),
    ln("leg", "right diagonal down to the vertex", 570, TOP, 300, MID),
  ], advance: adv(600) });
  glyphs.W = glyph("W", { codepoints: ["W"], strokes: [
    ln("leg", "first diagonal down", 30, TOP, 215, BOT),
    ln("leg", "second diagonal down to the same foot", 400, TOP, 215, BOT),
    ln("leg", "third diagonal down", 400, TOP, 585, BOT),
    ln("leg", "fourth diagonal down to the same foot", 770, TOP, 585, BOT),
  ], advance: adv(800) });
  glyphs.Z = glyph("Z", { codepoints: ["Z"], strokes: [
    ln("arm", "top bar, left to right", 30, TOP, 470, TOP),
    ln("leg", "diagonal down to the left", 470, TOP, 30, BOT),
    ln("arm", "bottom bar, left to right", 30, BOT, 470, BOT),
  ], advance: adv(500) });

  // ---- the circle family (O, Q, C, G on the circle, r = 270) ------------
  const oLeft = () => arcS("bowl", "left curve of the o, top to bottom", [[300, TOP], AT(109, 491), [30, MID], AT(109, 109), [300, BOT]]);
  const oRight = () => arcS("bowl", "right curve of the o, top to bottom", [[300, TOP], AT(491, 491), [570, MID], AT(491, 109), [300, BOT]]);
  glyphs.O = glyph("O", { codepoints: ["O"], strokes: [oLeft(), oRight()], advance: adv(600) });
  glyphs.Q = glyph("Q", { codepoints: ["Q"], strokes: [
    oLeft(), oRight(),
    ln("tail", "tail out of the bowl", 380, 140, 560, 20),
  ], advance: adv(600) });
  glyphs.C = glyph("C", { codepoints: ["C"], strokes: [
    arcS("bowl", "curve of the c, top to bottom", [[491, 491], AT(109, 491), [30, MID], AT(109, 109), [491, 109]]),
  ], advance: adv(600) });
  glyphs.G = glyph("G", { codepoints: ["G"], strokes: [
    arcS("bowl", "curve of the g, top to bottom", [[491, 491], AT(109, 491), [30, MID], AT(109, 109), [491, 109]]),
    ln("bar", "bar, left to right", 330, MID, 560, MID),
    ln("stem", "short stem down from the bar", 560, MID, 560, 150),
  ], advance: adv(600) });

  // ---- semicircular bowls (D, P, R, B) ----------------------------------
  // The manual's bowls are true semicircles: the diameter is a vertical
  // line inside the letter, joined to the stem by straight arms, so the
  // arc's extremes are its endpoints. (A single three-point arc through
  // the bowl's rightmost point would be a major arc — sagitta greater
  // than the radius — and would bulge past the cap and base lines.)
  glyphs.D = glyph("D", { codepoints: ["D"], strokes: [
    ln("stem", "stem down", 30, TOP, 30, BOT),
    arcS("bowl", "arms and semicircle, top to bottom", [[30, TOP], [200, TOP], AT(470, MID), [200, BOT], [30, BOT]]),
  ], advance: adv(500) });
  glyphs.P = glyph("P", { codepoints: ["P"], strokes: [
    ln("stem", "stem down", 30, TOP, 30, BOT),
    arcS("bowl", "arms and semicircle", [[30, TOP], [335, TOP], AT(470, 435), [335, MID], [30, MID]]),
  ], advance: adv(500) });
  glyphs.R = glyph("R", { codepoints: ["R"], strokes: [
    ln("stem", "stem down", 30, TOP, 30, BOT),
    arcS("bowl", "arms and semicircle", [[30, TOP], [335, TOP], AT(470, 435), [335, MID], [30, MID]]),
    ln("leg", "leg down to the right", 240, MID, 470, BOT),
  ], advance: adv(500) });
  glyphs.B = glyph("B", { codepoints: ["B"], strokes: [
    ln("stem", "stem down", 30, TOP, 30, BOT),
    arcS("bowl", "upper bowl: arms and semicircle", [[30, TOP], [300, TOP], AT(420, 450), [300, 330], [30, 330]]),
    arcS("bowl", "lower bowl, the larger: arms and semicircle", [[30, 330], [320, 330], AT(470, 180), [320, BOT], [30, BOT]]),
  ], advance: adv(500) });

  // ---- U and J (semi-elliptical bottoms) --------------------------------
  glyphs.U = glyph("U", { codepoints: ["U"], strokes: [
    ln("stem", "left stem down", 30, TOP, 30, 250),
    arcS("bowl", "bottom curve", [[30, 250], AT(250, BOT), [470, 250]]),
    ln("stem", "right stem down", 470, TOP, 470, 250),
  ], advance: adv(500) });
  glyphs.J = glyph("J", { codepoints: ["J"], strokes: [
    ln("stem", "stem down", 470, TOP, 470, 180),
    arcS("bowl", "hook curving to the left", [[470, 180], AT(250, BOT), [90, 120]]),
  ], advance: adv(500) });

  // ---- S, on the figure 8 (small ellipse over larger) -------------------
  glyphs.S = glyph("S", { codepoints: ["S"], strokes: [
    bowS("spine", "upper curve on the small ellipse", ell(250, 435, 185, 140, 40, 250, 12)),
    bowS("spine", "lower curve on the larger ellipse", ell(250, 180, 215, 155, 115, 430, 14)),
  ], advance: adv(500) });

  // ---- numerals ----------------------------------------------------------
  glyphs["1"] = glyph("1", { codepoints: ["1"], strokes: [
    ln("arm", "flag into the stem", 150, 480, 250, TOP),
    ln("stem", "stem down", 250, TOP, 250, BOT),
  ], advance: adv(500) });
  glyphs["0"] = glyph("0", { codepoints: ["0"], strokes: [
    bowS("bowl", "the elliptical zero, one closed curve", ell(250, 300, 220, 270, 90, 450, 16), true),
  ], advance: adv(500) });
  glyphs["7"] = glyph("7", { codepoints: ["7"], strokes: [
    ln("arm", "top bar, left to right", 30, TOP, 470, TOP),
    ln("leg", "diagonal down to the left", 470, TOP, 140, BOT),
  ], advance: adv(500) });
  glyphs["4"] = glyph("4", { codepoints: ["4"], strokes: [
    ln("leg", "diagonal down to the left", 330, TOP, 60, 210),
    ln("bar", "crossbar, left to right", 60, 210, 470, 210),
    ln("stem", "stem down", 330, TOP, 330, BOT),
  ], advance: adv(500) });
  glyphs["2"] = glyph("2", { codepoints: ["2"], strokes: [
    bowS("bowl", "upper curve on the small ellipse", ell(250, 435, 185, 140, 30, 230, 12)),
    ln("leg", "diagonal down to the left", 420, 400, 40, BOT),
    ln("arm", "base, left to right", 40, BOT, 470, BOT),
  ], advance: adv(500) });
  glyphs["3"] = glyph("3", { codepoints: ["3"], strokes: [
    bowS("bowl", "upper curve on the small ellipse", ell(250, 435, 190, 140, 50, 300, 12)),
    bowS("bowl", "lower curve on the larger ellipse", ell(250, 180, 220, 155, 90, 430, 14)),
  ], advance: adv(500) });
  glyphs["5"] = glyph("5", { codepoints: ["5"], strokes: [
    ln("stem", "stem down", 60, TOP, 60, 330),
    ln("arm", "top bar, left to right", 60, TOP, 460, TOP),
    bowS("bowl", "lower curve on the larger ellipse", ell(250, 180, 220, 155, 140, 430, 14)),
  ], advance: adv(500) });
  glyphs["6"] = glyph("6", { codepoints: ["6"], strokes: [
    bowS("spine", "curve down into the loop", ell(260, 370, 200, 195, 60, 200, 10)),
    bowS("bowl", "the loop, on the elliptical zero", ell(250, 180, 215, 155, -60, 300, 14)),
  ], advance: adv(500) });
  glyphs["8"] = glyph("8", { codepoints: ["8"], strokes: [
    bowS("bowl", "upper loop on the small ellipse", ell(250, 435, 185, 140, 90, 450, 14), true),
    bowS("bowl", "lower loop on the larger ellipse", ell(250, 180, 220, 155, 90, 450, 14), true),
  ], advance: adv(500) });
  glyphs["9"] = glyph("9", { codepoints: ["9"], strokes: [
    bowS("bowl", "the loop, on the elliptical zero", ell(250, 420, 215, 155, 120, 480, 14)),
    bowS("spine", "curve down from the loop", ell(240, 220, 205, 205, 80, -60, 10)),
  ], advance: adv(500) });

  const encoding: Record<string, string> = {};
  for (const g of Object.values(glyphs)) for (const cp of g.codepoints ?? []) encoding[cp] = g.name;
  const moves = [...new Set(Object.values(glyphs).flatMap((g) => g.strokes.map((s) => s.move).filter((m): m is string => !!m)))];

  return {
    format: "strokefont",
    version: 1,
    name: "Monoline Gothic",
    designer: "StrokeCore",
    sourceNote: "Single-stroke Gothic lettering of the drafting room: proportions, stroke order and construction after Giesecke et al., Engineering Drawing (six-unit grid; TOM Q. VAXY six units wide, W eight, I none) and ISO 3098 lettering type B (line width d = h/10; CAD variant CB). One circle tip, constant diameter — the basic case of the stroke model.",
    unitsPerEm: 1000,
    referenceTool: T,
    ladder: { xHeight: 7, ascender: 3, descender: 3, capHeight: 10 },
    slant: 0,
    tools: [{ name: T, tip: { kind: "ellipse", width: 60, height: 60 }, direction: "any" }],
    moves,
    glyphs,
    encoding,
    bearings: { defaultLeft: 0, defaultRight: 0 },
  };
}
