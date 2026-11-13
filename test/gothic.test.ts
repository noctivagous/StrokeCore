// Monoline Gothic conformance: this hand is not transcribed from an
// exemplar but CONSTRUCTED on a declared grid (Giesecke's six-unit
// system; ISO 3098 type B, d = h/10), so conformance is checked
// numerically against the standard's dimensions instead of by pixel
// diff. Letters built from lines and true circular arcs must land on
// the grid exactly (to bake tolerance: the tip is a 28-gon, so allow
// ~2 units). The figure-8 family (S, 0, 2, 3, 5, 6, 8, 9) is realised
// as splines through points sampled on the manual's declared
// ellipses, so those get a wider tolerance band.
import { describe, expect, it } from "vitest";
import { bakeFontGlyph, ductus, gothicFont, loadStrokeFont } from "../src/index.js";

const font = loadStrokeFont(gothicFont());

function inkBox(glyphName: string) {
  const ink = bakeFontGlyph(font, glyphName).groups.get("ink") ?? [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const poly of ink) for (const ring of poly) for (const p of ring) {
    minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

// Letters whose ink width is fixed exactly by the grid: 5-unit
// letters, the six-unit TOM Q. VAXY, W at 8, I at the bare stem.
const EXACT_WIDTH: Record<string, number> = {
  I: 60, H: 500, E: 500, F: 500, L: 500, N: 500, Z: 500, K: 500,
  D: 500, P: 500, R: 500, B: 500, U: 500, T: 600, A: 600, V: 600,
  X: 600, Y: 600, M: 600, O: 600, W: 800, "7": 500,
};
// Letters constructed from straight lines only: ink height must be
// exactly the 6-unit cap height, sitting on the baseline. Letters
// with circular arcs get 4 units of slack: the bake samples the spine
// and stamps a polygonal tip, so a curve's apex can land ~0.5% short
// of the true circle. (Q is the declared exception — see its own
// test; S is ellipse-family.)
const LINE_HEIGHT = "AEFHIKLMNTVWXYZ147";
const ARC_HEIGHT = "BCDGJOPRU";
const ELLIPSE_FAMILY = ["S", "0", "2", "3", "5", "6", "8", "9"];

describe("Monoline Gothic (constructed hand — conformance, not transcription)", () => {
  it("one tool only: the constant circle tip, d = h/10 = 60", () => {
    expect(font.file.tools).toHaveLength(1);
    const tip = font.file.tools[0].tip;
    expect(tip).toEqual({ kind: "ellipse", width: 60, height: 60 });
    for (const g of Object.values(font.file.glyphs))
      for (const s of g.strokes) expect(s.tool).toBe("monoline pen");
  });

  it("exact-width letters land on their unit widths", { timeout: 120000 }, () => {
    for (const [ch, w] of Object.entries(EXACT_WIDTH)) {
      const box = inkBox(font.file.encoding[ch]);
      expect(Math.abs(box.w - w), `${ch} ink width ${box.w}`).toBeLessThanOrEqual(2);
      expect(Math.abs(box.minX), `${ch} ink starts at x=0`).toBeLessThanOrEqual(2);
    }
  });

  it("line letters stand exactly 600 tall on the baseline", { timeout: 120000 }, () => {
    for (const ch of LINE_HEIGHT) {
      const box = inkBox(font.file.encoding[ch]);
      expect(Math.abs(box.h - 600), `${ch} ink height ${box.h}`).toBeLessThanOrEqual(2);
      expect(Math.abs(box.minY), `${ch} sits on the baseline`).toBeLessThanOrEqual(2);
    }
  });

  it("arc letters stand 600 tall within bake tolerance", { timeout: 120000 }, () => {
    for (const ch of ARC_HEIGHT) {
      const box = inkBox(font.file.encoding[ch]);
      expect(Math.abs(box.h - 600), `${ch} ink height ${box.h}`).toBeLessThanOrEqual(4);
      expect(Math.abs(box.minY), `${ch} sits on the baseline`).toBeLessThanOrEqual(4);
    }
  });

  it("Q is the one exception: its tail dips exactly 10 below the baseline", { timeout: 60000 }, () => {
    const box = inkBox("Q");
    expect(Math.abs(box.minY + 10)).toBeLessThanOrEqual(2);
    expect(Math.abs(box.maxY - 600)).toBeLessThanOrEqual(2);
    expect(Math.abs(box.w - 600)).toBeLessThanOrEqual(2);
  });

  it("ellipse-family letters land within tolerance of the same box", { timeout: 120000 }, () => {
    for (const ch of ELLIPSE_FAMILY) {
      const box = inkBox(font.file.encoding[ch]);
      expect(box.h, `${ch} ink height ${box.h}`).toBeGreaterThanOrEqual(572);
      expect(box.h, `${ch} ink height ${box.h}`).toBeLessThanOrEqual(622);
      expect(box.minY, `${ch} baseline`).toBeGreaterThanOrEqual(-14);
      expect(box.maxY, `${ch} cap line`).toBeLessThanOrEqual(614);
    }
  });

  it("advances are the grid width plus ISO B character spacing (2/10 h = 120)", () => {
    for (const [ch, w] of Object.entries(EXACT_WIDTH)) {
      expect(font.file.glyphs[font.file.encoding[ch]].advance).toBe(w + 120);
    }
  });

  it("ductus follows the manual's count for a straight-line letter (H = 3)", () => {
    expect(ductus(font, "H").length).toBe(3);
    expect(ductus(font, "H").map((s) => s.gesture?.primitive)).toEqual(["pull", "pull", "drive"]);
  });
});
