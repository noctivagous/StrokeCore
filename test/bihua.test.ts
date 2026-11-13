import { describe, expect, it } from "vitest";
import {
  BAFA_ORDER,
  FORMS,
  STYLES,
  analyzeGrid,
  bakeCharacter,
  bakeCharacterPartial,
  bafaForms,
  ballpointStyle,
  formById,
  heitiStyle,
  lin,
  maobiStyle,
  metaPostFormsProgram,
  metaPostProgram,
  mu,
  placeComponent,
  styleById,
  tipLagTwists,
  truncateStroke,
  yong,
} from "../src/bihua/index.js";

describe("bihua vocabulary", () => {
  it("covers all eight 永字八法 methods, in order", () => {
    const forms = bafaForms();
    expect(forms.map((f) => f.bafa)).toEqual([...BAFA_ORDER]);
    expect(new Set(forms.map((f) => f.id)).size).toBe(8);
  });

  it("every form has a name, reading, and pressure signature", () => {
    for (const f of Object.values(FORMS)) {
      expect(f.zh.length).toBeGreaterThan(0);
      expect(f.pinyin.length).toBeGreaterThan(0);
      expect(f.pressureSignature).toHaveLength(3);
      for (const p of f.pressureSignature) expect(p).toBeGreaterThanOrEqual(0);
      for (const p of f.pressureSignature) expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe("永 pilot character", () => {
  it("has five strokes in 笔顺 order, all with known forms", () => {
    expect(yong.char).toBe("永");
    expect(yong.strokes.map((s) => s.form)).toEqual([
      "dian",
      "hengzhegou",
      "hengpie",
      "pie",
      "na",
    ]);
    for (const s of yong.strokes) expect(() => formById(s.form)).not.toThrow();
  });

  it("every segment names a known form and spans real nodes", () => {
    const seen = new Set<string>();
    for (const s of yong.strokes) {
      expect(s.pressure).toHaveLength(s.spine.length);
      for (const seg of s.segments) {
        expect(() => formById(seg.form)).not.toThrow();
        expect(seg.span[0]).toBeGreaterThanOrEqual(0);
        expect(seg.span[1]).toBeLessThan(s.spine.length);
        if (seg.bafa) seen.add(seg.bafa);
      }
    }
    // The pilot's point: all eight methods occur in this one character.
    expect(seen).toEqual(new Set(BAFA_ORDER));
  });

  it("records provenance honestly: fitted spines, authored pressure", () => {
    for (const s of yong.strokes) expect(s.provenance).toBe("fitted-from-median");
    expect(yong.pressureProvenance).toBe("authored");
  });

  it("bakes to a non-trivial fused outline", { timeout: 60_000 }, () => {
    const bake = bakeCharacter(yong);
    expect(bake.strokes).toHaveLength(5);
    // A written 永 on a 1024 grid inks on the order of 1e5 square units.
    expect(bake.area).toBeGreaterThan(40_000);
    expect(bake.area).toBeLessThan(400_000);
    expect(bake.svgPath).toContain("M");
  });

  it("partial sweep grows monotonically with writing progress", { timeout: 60_000 }, () => {
    const areas = [0, 0.5, 1, 1.5, 2.5, 4, 5].map(
      (u) => bakeCharacterPartial(yong, u).area,
    );
    expect(areas[0]).toBe(0);
    for (let i = 1; i < areas.length; i++) {
      expect(areas[i]).toBeGreaterThan(areas[i - 1]);
    }
    const full = bakeCharacter(yong).area;
    expect(Math.abs(areas[areas.length - 1] - full)).toBeLessThan(full * 0.02);
  });

  it("truncateStroke keeps pressure aligned with the spine", () => {
    const t = truncateStroke(yong.strokes[2], 0.5);
    expect(t.pressure).toHaveLength(t.spine.length);
    expect(t.spine.length).toBeLessThan(yong.strokes[2].spine.length);
  });
});

describe("rendition styles", () => {
  it("offers maobi, flat brush, ballpoint, and heiti over one record", () => {
    expect(Object.keys(STYLES).sort()).toEqual(["ballpoint", "flatbrush", "heiti", "maobi"]);
    expect(styleById("maobi").zh).toBe("毛笔");
    expect(() => styleById("songti")).toThrow();
  });

  it("every style bakes 永 to ink, and the renditions differ", { timeout: 60_000 }, () => {
    const areas = Object.values(STYLES).map((s) => bakeCharacter(yong, s).area);
    for (const a of areas) expect(a).toBeGreaterThan(20_000);
    expect(new Set(areas.map((a) => Math.round(a))).size).toBe(areas.length);
  });

  it("the disc tip belongs to the ballpoint, not to any brush", () => {
    const core = ballpointStyle.stroke(yong.strokes[0], "x");
    expect(core.tool.tip.kind).toBe("ellipse");
    const brush = maobiStyle.stroke(yong.strokes[0], "x");
    expect(brush.tool.tip.kind).toBe("pointed");
  });

  it("heiti ignores the pressure channel; maobi obeys it", { timeout: 60_000 }, () => {
    const s = yong.strokes[4];
    const flat = { ...s, pressure: s.pressure.map(() => 0.5) };
    const area = (style: typeof maobiStyle, st: typeof s) =>
      bakeCharacter({ ...yong, strokes: [st] }, style).area;
    expect(area(heitiStyle, flat)).toBeCloseTo(area(heitiStyle, s), 0);
    expect(Math.abs(area(maobiStyle, flat) - area(maobiStyle, s))).toBeGreaterThan(500);
  });

  it("tip lag is zero on a straight run and trails a turn", () => {
    const straight = tipLagTwists([
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 },
    ]);
    expect(straight).toEqual([0, 0, 0]);
    const corner = tipLagTwists([
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: -10 },
    ]);
    // Turning -90° (clockwise): the tip trails, twist is positive.
    expect(corner[1]).toBeGreaterThan(30);
  });
});

describe("components （部件）", () => {
  it("a stored component is bihua strokes, and placement transforms them", () => {
    const placed = placeComponent(mu, { scaleX: 0.5, scaleY: 1, dx: 10, dy: 0 });
    expect(placed).toHaveLength(mu.strokes.length);
    expect(placed[0].spine[0].x).toBeCloseTo(mu.strokes[0].spine[0].x * 0.5 + 10);
    expect(placed[0].spine[0].y).toBeCloseTo(mu.strokes[0].spine[0].y);
    // The stored component itself is not mutated by placement.
    expect(mu.strokes[0].spine[0].x).toBe(228);
  });

  it("na-becomes-dian rewrites the final stroke of left-position 木", () => {
    const placed = placeComponent(
      mu,
      { scaleX: 0.6, scaleY: 0.9, dx: 0, dy: 0 },
      { na: "na-becomes-dian" },
    );
    expect(placed[3].form).toBe("dian");
    expect(placed[3].spine.length).toBeLessThan(mu.strokes[3].spine.length + 1);
    expect(() =>
      placeComponent(mu, { scaleX: 1, scaleY: 1, dx: 0, dy: 0 }, { na: "nope" }),
    ).toThrow();
  });

  it("林 is assembled from two placed 木 and bakes balanced in its grid", { timeout: 60_000 }, () => {
    expect(lin.strokes).toHaveLength(8);
    expect(lin.strokes.map((s) => s.form)).toEqual([
      "heng", "shu", "pie", "dian", "heng", "shu", "pie", "na",
    ]);
    const bake = bakeCharacter(lin);
    const g = analyzeGrid(bake.fused, 1024);
    // Horizontally centred like the reference form (centroid x ≈ 494–514).
    expect(Math.abs(g.centroid.x - 512)).toBeLessThan(40);
    const shareSum = g.quadrantShares.reduce((a, s) => a + s, 0);
    expect(shareSum).toBeGreaterThan(0.95);
    expect(shareSum).toBeLessThan(1.05);
  });
});

describe("MetaPost emission", () => {
  it("emits a program that inputs the module and draws all five strokes", () => {
    const mp = metaPostProgram(yong);
    expect(mp).toContain("input bihua.mp;");
    expect(mp).toContain('outputformat := "svg";');
    // Family declaration, never a suffixed-instance declaration.
    expect(mp).toContain("path sp[];");
    expect(mp).not.toMatch(/path sp\d+;/);
    // Width state is assigned (:=), not equated — it is rewritten per stroke.
    expect(mp).toContain("bihua_w[0] :=");
    expect(mp.match(/draw_bihua_stroke/g)).toHaveLength(5);
    expect(mp).toContain("endfig;");
  });

  it("the forms check program exercises every 笔形 macro", () => {
    const mp = metaPostFormsProgram();
    for (const macro of ["b_dian", "b_heng", "b_shu", "b_gou", "b_ti", "b_pie", "b_na"]) {
      expect(mp).toContain(macro);
    }
  });
});
