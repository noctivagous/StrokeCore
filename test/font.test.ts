import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  bakeFontGlyph, ductus, glyphAdvance, layoutText, loadStrokeFont,
  foundationalFont, imperialFont, frakturFont,
} from "../src/index.js";

const fonts = [
  { name: "foundational", file: foundationalFont(), letters: "abcdefghijklmnopqrstuvwxyz&" },
  { name: "imperial", file: imperialFont(), letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { name: "fraktur", file: frakturFont(), letters: "abcdefghijklmnopqrstuvwxyzſ" },
];

describe("StrokeFont format (spec §7)", () => {
  for (const { name, file, letters } of fonts) {
    const font = loadStrokeFont(JSON.parse(JSON.stringify(file)));

    it(`${name}: loads, ladder lines derive from the reference tool`, () => {
      expect(font.referenceTool.name).toBe(file.referenceTool);
      const refTip = file.tools.find((t) => t.name === file.referenceTool)!.tip;
      const w = refTip.kind === "pointed" ? refTip.maxWidth : "width" in refTip ? refTip.width : 0;
      expect(font.lines.waist).toBe(file.ladder.xHeight * w);
      expect(font.lines.base).toBe(0);
    });

    it(`${name}: every encoded letter bakes to ink`, { timeout: 60000 }, () => {
      for (const ch of letters) {
        const glyphName = font.file.encoding[ch];
        expect(glyphName, `encoding for ${ch}`).toBeTruthy();
        const bake = bakeFontGlyph(font, glyphName);
        const ink = bake.groups.get("ink")!;
        expect(ink.length, `${name} ${ch} polygons`).toBeGreaterThan(0);
        for (const poly of ink) for (const ring of poly) expect(ring.length).toBeGreaterThan(3);
      }
    });

    it(`${name}: ductus lists strokes in hand order with tools resolved`, () => {
      const steps = ductus(font, font.file.encoding[letters[0]]);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].step).toBe(1);
      expect(steps.every((s) => s.toolName === file.referenceTool)).toBe(true);
    });

    it(`${name}: layoutText advances monotonically`, () => {
      const { placements, width } = layoutText(font, letters.slice(0, 6));
      expect(placements.length).toBe(6);
      for (let i = 1; i < placements.length; i++) expect(placements[i].x).toBeGreaterThan(placements[i - 1].x);
      expect(width).toBeGreaterThan(placements[5].x);
    });

    it(`${name}: components resolve (glyph l is pure component)`, () => {
      const adv = glyphAdvance(font, font.file.encoding[letters.includes("l") ? "l" : "I"]);
      expect(adv).toBeGreaterThan(0);
    });
  }

  it("component fan-out: Foundational stems come from _stemAsc/_stemX", () => {
    const font = loadStrokeFont(foundationalFont());
    // h = stemAsc + stemX + arch = 3 strokes
    expect(ductus(font, "h").length).toBe(3);
    // m = 3 stems + 2 arches
    expect(ductus(font, "m").length).toBe(5);
    // b = stemAsc + 2 bowl strokes
    expect(ductus(font, "b").length).toBe(3);
  });

  it("imperial components: F is E without the foot (one stroke fewer)", () => {
    const font = loadStrokeFont(imperialFont());
    expect(ductus(font, "E").length).toBe(ductus(font, "F").length + 1);
    // H = two cap stems (3 strokes each) + crossbar
    expect(ductus(font, "H").length).toBe(7);
  });

  it("the emitted JSON files parse and match the builders", () => {
    for (const [path, built] of [
      ["../fonts/foundational.strokefont.json", foundationalFont()],
      ["../fonts/imperial-capitals.strokefont.json", imperialFont()],
      ["../fonts/fraktur.strokefont.json", frakturFont()],
    ] as const) {
      const text = readFileSync(new URL(path, import.meta.url), "utf8");
      const font = loadStrokeFont(text);
      expect(Object.keys(font.file.glyphs).length).toBe(Object.keys(built.glyphs).length);
    }
  });

  it("loader rejects a bad file", () => {
    expect(() => loadStrokeFont({ format: "nope" })).toThrow();
  });
});
