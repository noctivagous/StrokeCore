import { describe, expect, it } from "vitest";
import { ductus, loadStrokeFont } from "../src/font.js";
import {
  ANATOMY_PART_NAMES, BASE_PRIMITIVES, PAIRINGS, STROKE_FUNCTION_NAMES,
} from "../src/primitives.js";
import { foundationalFont } from "../src/fonts/foundational.js";

describe("the letterform vocabulary (GRAMMAR.md)", () => {
  it("base primitives have unique names and typed parameter signatures", () => {
    const names = BASE_PRIMITIVES.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    for (const p of BASE_PRIMITIVES) {
      for (const param of p.params) {
        expect(["number", "string"]).toContain(param.kind);
      }
    }
    // the gestures the grammar names as base primitives
    for (const g of ["lead", "pull", "push", "drive", "arc", "bow", "turn", "point", "flick", "dab", "twist", "swell"]) {
      expect(names).toContain(g);
    }
    // the seam decisions: hook and sweep differ only in path shape, so
    // they are patterns (named configurations), not base primitives —
    // a sweep is a bow with a guide, a hook a bow with a terminal turn
    expect(names).not.toContain("sweep");
    expect(names).not.toContain("hook");
    const bow = BASE_PRIMITIVES.find((p) => p.name === "bow");
    expect(bow?.params.map((p) => p.name)).toContain("guide");
  });

  it("every anatomy part has a pairing, and paired names exist", () => {
    for (const part of ANATOMY_PART_NAMES) {
      const pairing = PAIRINGS[part];
      expect(pairing, `pairing for ${part}`).toBeDefined();
      for (const g of pairing.gestures) expect(BASE_PRIMITIVES.map((p) => p.name)).toContain(g);
      for (const f of pairing.functions) expect(STROKE_FUNCTION_NAMES.has(f)).toBe(true);
    }
    // the owner's examples: ear is made by a flick; a dot by a dab
    expect(PAIRINGS.ear.gestures).toEqual(["flick"]);
    expect(PAIRINGS.dot.gestures).toEqual(["dab"]);
    expect(PAIRINGS.dot.functions).toEqual(["dots"]);
  });

  it("Foundational declares its primitives table and patterns, and they validate", () => {
    const font = loadStrokeFont(foundationalFont());
    expect(font.file.primitives?.arc).toEqual({ axis: 30 });
    expect(font.file.patterns?.bowlArc.primitive).toBe("arc");
    expect(font.file.patterns?.diamondDot.config).toEqual({ size: 62, angle: 30 });
    // the baseline sweep is a pattern of the bow, per the seam decision
    expect(font.file.patterns?.baselineSweep).toEqual({ primitive: "bow", config: { guide: "baseline" } });
  });

  it("Foundational's key letters pair part, gesture and purpose", () => {
    const file = foundationalFont();
    const o = file.glyphs.o.strokes;
    expect(o.every((s) => s.role === "bowl" && s.gesture?.primitive === "arc")).toBe(true);
    const g = file.glyphs.g.strokes;
    const ear = g.find((s) => s.role === "ear");
    expect(ear?.gesture?.primitive).toBe("flick");
    expect(ear?.purpose).toEqual({ function: "completes", target: "bowl" });
    const i = file.glyphs.i.strokes;
    expect(i[0].role).toBe("dot");
    expect(i[0].gesture?.primitive).toBe("dab");
    expect(i[0].purpose?.function).toBe("dots");
    const eBar = file.glyphs.e.strokes.find((s) => s.role === "bar");
    expect(eBar?.purpose).toEqual({ function: "crosses", target: "eye" });
  });

  it("the ductus carries the pairing: part, gesture, purpose, prose", () => {
    const font = loadStrokeFont(foundationalFont());
    const steps = ductus(font, "g");
    const ear = steps.find((s) => s.role === "ear");
    expect(ear?.gesture?.primitive).toBe("flick");
    expect(ear?.purpose).toEqual({ function: "completes", target: "bowl" });
    expect(ear?.move).toContain("ear");
    const oSteps = ductus(font, "o");
    expect(oSteps.map((s) => s.gesture?.primitive)).toEqual(["arc", "arc"]);
    // i's ductus ends with its dot: a dab whose purpose is dots
    const iSteps = ductus(font, "i");
    const dot = iSteps[iSteps.length - 1];
    expect(dot.role).toBe("dot");
    expect(dot.gesture?.primitive).toBe("dab");
    expect(dot.purpose?.function).toBe("dots");
  });

  it("the loader rejects vocabulary violations", () => {
    const base = foundationalFont();
    const clone = () => JSON.parse(JSON.stringify(base));
    const badTable = clone();
    badTable.primitives = { wobble: { axis: 30 } };
    expect(() => loadStrokeFont(badTable)).toThrow(/unknown base primitive 'wobble'/);
    const badParam = clone();
    badParam.primitives = { arc: { wobble: 30 } };
    expect(() => loadStrokeFont(badParam)).toThrow(/no parameter 'wobble'/);
    const badKind = clone();
    badKind.primitives = { arc: { axis: "steep" } };
    expect(() => loadStrokeFont(badKind)).toThrow(/must be a number/);
    const badPattern = clone();
    badPattern.patterns = { x: { primitive: "wobble" } };
    expect(() => loadStrokeFont(badPattern)).toThrow(/unknown base primitive 'wobble'/);
    const badGesture = clone();
    badGesture.glyphs.o.strokes[0].gesture = { primitive: "wobble" };
    expect(() => loadStrokeFont(badGesture)).toThrow(/unknown base primitive 'wobble'/);
    const badRole = clone();
    badRole.glyphs.o.strokes[0].role = "curve";
    expect(() => loadStrokeFont(badRole)).toThrow(/unknown anatomy role 'curve'/);
    const badPurpose = clone();
    badPurpose.glyphs.o.strokes[0].purpose = { function: "wobbles" };
    expect(() => loadStrokeFont(badPurpose)).toThrow(/unknown purpose function 'wobbles'/);
    const badTarget = clone();
    badTarget.glyphs.o.strokes[0].purpose = { function: "closes", target: "wobble" };
    expect(() => loadStrokeFont(badTarget)).toThrow(/unknown purpose target 'wobble'/);
  });
});
