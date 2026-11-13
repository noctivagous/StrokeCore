// F2 converter tests: taxonomy coverage, HanGlyph validators, and
// ground-truth conversion of the two characters whose records were
// authored by hand in F1 （永 and 木） — the converter must earn the
// same labels from the same medians on its own.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  bakeCharacter,
  convertCharacter,
  maobiStyle,
  specForms,
  taxonomyForms,
  validateForm,
  type MmhCharData,
} from "../src/bihua/index.js";
import { fittedGuo, fittedXin, fittedYong } from "../src/bihua/index.js";
import { mu } from "../src/bihua/index.js";
import { yong } from "../src/bihua/index.js";

function fixture(ch: string): MmhCharData {
  return JSON.parse(
    readFileSync(new URL(`../scripts/fixtures/hanzi-writer/${ch}.json`, import.meta.url), "utf8"),
  ) as MmhCharData;
}

describe("41-stroke taxonomy (docs/HANGLYPH.md)", () => {
  it("covers all 41 HanGlyph codes exactly once", () => {
    const forms = taxonomyForms();
    expect(forms).toHaveLength(41);
    expect(new Set(forms.map((f) => f.hanglyph)).size).toBe(41);
  });
  it("has executable constraint specs for most of the taxonomy", () => {
    expect(specForms().length).toBeGreaterThanOrEqual(34);
  });
});

describe("HanGlyph constraint validators", () => {
  it("passes a well-formed 横折钩 key-point set", () => {
    const r = validateForm("hengzhegou", {
      points: [
        { x: 100, y: 800 }, { x: 500, y: 810 }, { x: 505, y: 300 }, { x: 380, y: 350 },
      ],
      cornerSharp: [true, true],
    });
    expect(r.status).toBe("pass");
  });
  it("fails the same points when the hook end sits below its base", () => {
    const r = validateForm("hengzhegou", {
      points: [
        { x: 100, y: 800 }, { x: 500, y: 810 }, { x: 505, y: 300 }, { x: 380, y: 250 },
      ],
      cornerSharp: [true, true],
    });
    expect(r.status).toBe("fail");
    expect(r.failed.join(" ")).toContain("y3>y2");
  });
  it("distinguishes 竖折 (sharp) from 竖弯 (curved) on the corner alone", () => {
    const pts = [{ x: 300, y: 900 }, { x: 305, y: 300 }, { x: 700, y: 295 }];
    expect(validateForm("shuzhe", { points: pts, cornerSharp: [true] }).status).toBe("pass");
    expect(validateForm("shuzhe", { points: pts, cornerSharp: [false] }).status).toBe("fail");
    expect(validateForm("shuwan", { points: pts, cornerSharp: [false] }).status).toBe("pass");
  });
  it("allows a 横 its 抗肩 rise and a 竖 its lean, but not a fall or a bow", () => {
    const rising = [{ x: 100, y: 500 }, { x: 700, y: 560 }];
    expect(validateForm("heng", { points: rising, cornerSharp: [] }).status).toBe("pass");
    const falling = [{ x: 100, y: 560 }, { x: 700, y: 480 }];
    expect(validateForm("heng", { points: falling, cornerSharp: [] }).status).toBe("fail");
    const leaning = [{ x: 400, y: 900 }, { x: 480, y: 200 }];
    expect(validateForm("shu", { points: leaning, cornerSharp: [] }).status).toBe("pass");
  });
});

describe("converter ground truth", () => {
  it("earns 永's authored labels from its medians, all validators green", () => {
    const rec = convertCharacter({ char: "永", pinyin: "yǒng", gloss: "forever" }, fixture("永"));
    expect(rec.strokes.map((s) => s.form)).toEqual(yong.strokes.map((s) => s.form));
    for (const s of rec.strokes) {
      expect(s.provenance).toBe("fitted-from-median");
      expect(s.fit?.validator).toBe("pass");
      expect(s.fit?.review).toBe(false);
      expect(s.pressure).toHaveLength(s.spine.length);
    }
  });
  it("earns 木's authored labels from its medians", () => {
    const rec = convertCharacter({ char: "木", pinyin: "mù", gloss: "tree" }, fixture("木"));
    expect(rec.strokes.map((s) => s.form)).toEqual(mu.strokes.map((s) => s.form));
  });
  it("preserves stroke counts and flags honestly across the batch", () => {
    for (const ch of ["人", "大", "天", "土", "士", "日", "月", "明", "水", "火", "山", "四", "女", "好", "心", "我", "國"]) {
      const data = fixture(ch);
      const rec = convertCharacter({ char: ch, pinyin: "", gloss: "" }, data);
      expect(rec.strokes).toHaveLength(data.medians.length);
      for (const s of rec.strokes) expect(s.fit).toBeDefined();
    }
  });
  it("the committed fitted modules are the converter's own output shape", () => {
    expect(fittedYong.strokes).toHaveLength(5);
    expect(fittedYong.strokes.map((s) => s.form)).toEqual(["dian", "hengzhegou", "hengpie", "pie", "na"]);
    expect(fittedGuo.strokes).toHaveLength(11);
    expect(fittedXin.strokes.map((s) => s.form)).toEqual(["zuodian", "wogou", "dian", "changdian"]);
  });
  it("fitted records bake under the maobi style", { timeout: 120_000 }, () => {
    for (const rec of [fittedYong, fittedXin, fittedGuo]) {
      const bake = bakeCharacter(rec, maobiStyle);
      expect(bake.area).toBeGreaterThan(0);
    }
  });
});
