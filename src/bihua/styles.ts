// Rendition styles: the layer between a character record and its
// bake. A record holds 笔顺 and 笔形 — how the character is written —
// and says nothing about rendition. Modern Chinese characters are
// drawn many ways: brush calligraphy, flat-brush art lettering, and
// 黑体 (the sans-serif of Chinese type: uniform strokes, cut ends),
// among others. Each style here is a tool plus an interpretation of
// the record's pressure channel, in the same way StrokeCore's Latin
// hands are tools over one ductus.
//
// Not yet styled: 宋体/明体 (the serifed print style) is not a tool
// swap — its triangular stroke-end ornaments are construction, not
// rendition, and belong to a later style that adds them as 笔形-level
// events. Named here so its absence is a decision, not an oversight.

import { broadEdgeNib, flatBrush, pointedBrush, roundNib } from "../tool.js";
import type { Stroke, Tool } from "../types.js";
import { MAOBI_CROSS_RATIO, smoothSpine, tipLagTwists } from "./brush.js";
import type { BihuaStroke } from "./types.js";

export interface BihuaStyle {
  id: string;
  zh: string;
  pinyin: string;
  gloss: string;
  note: string;
  /** Build the core stroke for one record stroke under this style. */
  stroke: (stroke: BihuaStroke, id: string) => Stroke;
}

/** 毛笔 — pointed brush: elongated patch, pressure-coupled, tip lag. */
export function maobiStyleWithWidth(maxWidth: number): BihuaStyle {
  return {
    id: "maobi",
    zh: "毛笔",
    pinyin: "máobǐ",
    gloss: "pointed brush",
    note: "Calligraphy as written: the patch elongates along travel, swells and thins with pressure, and lags at turns.",
    stroke: (stroke, id) => {
      const twists = tipLagTwists(stroke.spine);
      return {
        id,
        tool: pointedBrush("毛笔 maobi", maxWidth, maxWidth * 1.6),
        spine: smoothSpine(stroke.spine),
        angleDeg: 0,
        angleMode: "tangentRelative",
        points: stroke.pressure.map((pressure, node) => ({
          node,
          pressure,
          twistDeg: twists[node],
        })),
      };
    },
  };
}

/** The default 毛笔： patch length 114 (oracle-calibration plateau 110–124, IoU ≈ 0.734). */
export const maobiStyle: BihuaStyle = maobiStyleWithWidth(114);

/**
 * 扁笔 — flat brush: held at a fixed angle, so a stroke's width is
 * governed first by its direction against the brush edge. But size
 * must answer pressure too, and through direction alone it does
 * not: a 撇's travel direction barely rotates as it falls, so the
 * projected width stays flat, and on a 横 the core mapping's width
 * growth and thickness shrinkage cancel in projection. A real flat
 * brush is worked by rolling it: pressing splays the fan (spread)
 * and puts more of its face down; lifting rolls it toward its
 * corner and the mark thins. So this style drives BOTH the spread
 * channel and a wide widthFactor range from the record's pressure —
 * a 撇 now tapers to its corner and a 捺 swells to its foot.
 */
export const flatBrushStyle: BihuaStyle = {
  id: "flatbrush",
  zh: "扁笔",
  pinyin: "biǎnbǐ",
  gloss: "flat brush",
  note: "Direction against a held edge sets the character of each stroke; the brush is ROLLED as it is worked — the core travel-roll law turns pressure into rotation relative to the stroke's own direction (up to 40°): pressed, the face turns square to the travel and the stroke broadens; lifted, it turns to the edge and thins. One law serves every direction — a fixed-frame roll would broaden the 横 (héng) only by thinning the 捺 (nà). The roll reads an inertia-smoothed tangent, so it swings through the 钩 (gōu) instead of snapping; spread and the width taper ride along.",
  stroke: (stroke, id) => {
    const twists = tipLagTwists(stroke.spine);
    const tool: Tool = flatBrush("扁笔 flat brush", 92, 20, 90, 0.45, { mode: "travel", maxDeg: 40 });
    return {
      id,
      tool,
      spine: smoothSpine(stroke.spine),
      // Held edge, tilted like a sign brush at rest.
      angleDeg: -18,
      angleMode: "fixed",
      points: stroke.pressure.map((pressure, node) => ({
        node,
        pressure,
        spread: pressure,
        widthFactor: 0.3 + 0.85 * pressure,
        twistDeg: twists[node] * 0.6,
      })),
    };
  },
};

/**
 * 圆珠笔 — ballpoint pen (and, near enough, pencil): the one common
 * writing tool whose mark really is a disc of near-constant size —
 * a small round tip, width answering only faintly to pressure. This
 * is where a circle tip belongs in the model: not as a brush.
 */
export const ballpointStyle: BihuaStyle = {
  id: "ballpoint",
  zh: "圆珠笔",
  pinyin: "yuánzhūbǐ",
  gloss: "ballpoint pen",
  note: "A rolling ball lays a near-monoline: slight pressure swell, round ends, no gesture in the tip itself.",
  stroke: (stroke, id) => ({
    id,
    tool: roundNib("圆珠笔 ballpoint", 46),
    spine: smoothSpine(stroke.spine),
    angleDeg: 0,
    angleMode: "tangentRelative",
    points: stroke.pressure.map((pressure, node) => ({
      node,
      widthFactor: 0.85 + 0.3 * pressure,
    })),
  }),
};

/**
 * 黑体 — the sans-serif of Chinese type: uniform width, cut ends.
 * Not a hand tool at all — a type rendition — so the record's
 * pressure is ignored and strokes end square, cut across the travel
 * (a rect tip carried along the tangent). Real 黑体 fonts often cut
 * diagonal ends horizontally instead; perpendicular cuts are this
 * model's stated approximation.
 */
export const heitiStyle: BihuaStyle = {
  id: "heiti",
  zh: "黑体",
  pinyin: "hēitǐ",
  gloss: "sans-serif type (monoline, square-cut)",
  note: "Uniform width, no pressure, square-cut ends: the character as information, not gesture.",
  stroke: (stroke, id) => ({
    id,
    tool: broadEdgeNib("黑体 monoline", 58, 58),
    spine: smoothSpine(stroke.spine),
    angleDeg: 0,
    angleMode: "tangentRelative",
    points: stroke.spine.map((_, node) => ({ node, widthFactor: 1 })),
  }),
};

export const STYLES: Record<string, BihuaStyle> = {
  maobi: maobiStyle,
  flatbrush: flatBrushStyle,
  ballpoint: ballpointStyle,
  heiti: heitiStyle,
};

export function styleById(id: string): BihuaStyle {
  const s = STYLES[id];
  if (!s) throw new Error(`unknown bihua style: ${id}`);
  return s;
}

/** Re-exported for callers that calibrate the maobi ink width. */
export { MAOBI_CROSS_RATIO };
