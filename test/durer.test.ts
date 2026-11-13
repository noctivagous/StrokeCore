// Dürer Textura — conformance against the module, not against a
// picture. Dürer's system is arithmetic: one square of side s = 100
// (the stem width); short letters five squares stacked, tall letters
// seven; oblique squares centred on the stack edges at the 1/3 and
// 2/3 points, protruding s/√2; standards at pitch s + 2s/3. Every
// number asserted here is one of those — the letters whose prose
// underdetermines their decomposition are checked only on the module
// facts, never on Kavi's interpretations of them.
import { describe, expect, it } from "vitest";
import { bakeFontGlyph, ductus, durerFont, loadStrokeFont } from "../src/index.js";

const font = loadStrokeFont(durerFont());
const R = 100 / Math.SQRT2; // 70.71

function inkBox(name: string) {
  const ink = bakeFontGlyph(font, name).groups.get("ink") ?? [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const poly of ink) for (const ring of poly) for (const p of ring) {
    minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/** Ink x-intervals of a glyph at height y (for the counter check). */
function spansAt(name: string, y: number): [number, number][] {
  const ink = bakeFontGlyph(font, name).groups.get("ink") ?? [];
  const xs: number[] = [];
  for (const poly of ink) for (const ring of poly) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
        xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
  }
  xs.sort((p, q) => p - q);
  const spans: [number, number][] = [];
  for (let i = 0; i < xs.length - 1; i += 2) spans.push([xs[i], xs[i + 1]]);
  return spans;
}

describe("Dürer Textura (constructed hand — the module is the spec)", () => {
  it("declares the square lattice, and the loader enforces module = nib width", () => {
    const grid = font.file.construction?.grid;
    expect(grid?.kind).toBe("square-lattice");
    expect(grid?.module).toBe(100);
    expect(grid?.stack).toEqual({ short: 5, tall: 7 });
    const bad = durerFont();
    bad.construction = { grid: { kind: "square-lattice", module: 90, stack: { short: 5 } } };
    expect(() => loadStrokeFont(bad)).toThrow(/module/);
  });

  it("the standard's ink is the module arithmetic exactly (n, m)", { timeout: 60000 }, () => {
    const n = inkBox("n");
    expect(Math.abs(n.w - (500 / 3 + 2 * R + 100 / 3))).toBeLessThanOrEqual(3); // pitch + diamonds
    expect(Math.abs(n.maxY - (500 + R))).toBeLessThanOrEqual(3);                // head diamond protrudes s/√2
    expect(Math.abs(n.minY + R)).toBeLessThanOrEqual(3);                        // foot diamond likewise
    const m = inkBox("m");
    expect(Math.abs(m.w - (2 * (500 / 3) + 2 * R + 100 / 3))).toBeLessThanOrEqual(3);
  });

  it("stems are one module wide and the counter is two-thirds of one", { timeout: 60000 }, () => {
    const spans = spansAt("n", 250);
    expect(spans.length).toBe(2);
    expect(Math.abs(spans[0][0] - 0)).toBeLessThanOrEqual(2);
    expect(Math.abs(spans[0][1] - 100)).toBeLessThanOrEqual(2);
    expect(Math.abs(spans[1][0] - 500 / 3)).toBeLessThanOrEqual(2);
    expect(Math.abs(spans[1][1] - (500 / 3 + 100))).toBeLessThanOrEqual(2);
    expect(Math.abs(spans[1][0] - spans[0][1] - 200 / 3)).toBeLessThanOrEqual(3);
  });

  it("cut tops land their apex on the line (l tall, s short)", { timeout: 60000 }, () => {
    expect(Math.abs(inkBox("l").maxY - 700)).toBeLessThanOrEqual(3);
    expect(Math.abs(inkBox("s").maxY - 500)).toBeLessThanOrEqual(3);
  });

  it("the descender letters reach the declared depths", { timeout: 60000 }, () => {
    // q: foot diamond centred two squares below the baseline
    expect(Math.abs(inkBox("q").minY - (-200 - R))).toBeLessThanOrEqual(3);
    // p: flat foot exactly two squares below
    expect(Math.abs(inkBox("p").minY - -200)).toBeLessThanOrEqual(2);
  });

  it("the i's ductus spells the construction: pull, two dabs, the crescent", () => {
    const steps = ductus(font, "i");
    expect(steps.map((s) => s.gesture?.primitive)).toEqual(["pull", "dab", "dab", "flick"]);
  });

  it("every encoded glyph bakes to non-empty ink", { timeout: 120000 }, () => {
    for (const [ch, name] of Object.entries(font.file.encoding)) {
      const ink = bakeFontGlyph(font, name).groups.get("ink") ?? [];
      expect(ink.length, `${ch} (${name}) bakes`).toBeGreaterThan(0);
    }
  });
});
