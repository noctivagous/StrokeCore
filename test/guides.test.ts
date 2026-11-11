import { describe, expect, it } from "vitest";
import { FOUNDATIONAL_LADDER, guideLines, guidesSVG } from "../src/guides.js";

describe("Foundational guideline system", () => {
  it("places the five lines at the Formo ladder heights", () => {
    const ys = Object.fromEntries(guideLines().map((g) => [g.id, g.yNib]));
    expect(ys).toEqual({ ascender: 7, capital: 6, waist: 4, base: 0, descender: -3 });
  });

  it("renders every label and a ten-square nib stack", () => {
    const svg = guidesSVG({ nibPx: 15, baselineY: 200, x0: 60, x1: 260, stackX: 30, labelX: 270 });
    for (const label of ["Ascender Line", "Capital Line", "Waist Line", "Base Line", "Descender Line", "X-height"]) {
      expect(svg).toContain(label);
    }
    // One <rect> per nib width from descender (-3) to ascender (+7).
    expect(svg.match(/<rect/g)).toHaveLength(
      FOUNDATIONAL_LADDER.xHeight + FOUNDATIONAL_LADDER.ascender + FOUNDATIONAL_LADDER.descender,
    );
  });

  it("checkerboard stack alternates columns and greys the extender zones", () => {
    const svg = guidesSVG({
      nibPx: 15, baselineY: 200, x0: 76, x1: 260, stackX: 30, labelX: 270,
      stackStyle: "checkerboard",
    });
    expect(svg.match(/<rect/g)).toHaveLength(10);
    expect(svg).toContain("#999999"); // grey extender squares
    expect(svg).toContain('x="30"'); // column 0
    expect(svg).toContain('x="45"'); // column 1 (stackX + nibPx)
  });
});
