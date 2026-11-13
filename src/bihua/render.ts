// Rendering: full bake, and the partial sweep HanJian's stroke-order
// animation needs — a character drawn up to any point of its 笔顺.
// Rendition is chosen by style (styles.ts); the record is style-free.

import { bakeStroke, fuseOutlines, multiPolygonArea, toSVGPath } from "../bake.js";
import type { StrokeBake } from "../bake.js";
import type { BakeOptions, MultiPolygon } from "../types.js";
import { maobiStyle, type BihuaStyle } from "./styles.js";
import type { BihuaCharacter, BihuaStroke } from "./types.js";

export interface CharacterBake {
  strokes: StrokeBake[];
  fused: MultiPolygon;
  area: number;
  svgPath: string;
}

/**
 * Default sampling for the 1024 grid: the core's default step derives
 * from the pointed tip's smallest dimension and is far finer than a
 * brush stroke needs (and slow). 6 units ≈ 0.6% of the grid.
 */
export const BIHUA_BAKE_DEFAULTS: BakeOptions = { step: 6, simplifyTolerance: 0.5 };

export function bakeBihuaStroke(
  stroke: BihuaStroke,
  id: string,
  style: BihuaStyle = maobiStyle,
  options: BakeOptions = {},
): StrokeBake {
  const base = { ...BIHUA_BAKE_DEFAULTS, ...options };
  try {
    return bakeStroke(style.stroke(stroke, id), base);
  } catch (err) {
    // polygon-clipping's sweep line intermittently fails on the
    // near-coincident tip pieces a pinned corner produces (dense,
    // many-node fitted strokes are the usual trigger — 國's 横折 is
    // the case on record). Resampling at a different step/vertex
    // count changes the piece geometry and dodges the degenerate
    // configuration; the ink difference is below the simplify
    // tolerance. If every attempt fails, the original error stands.
    for (const retry of [
      { ...base, step: (base.step ?? 6) * 0.75, ellipseSegments: 22 },
      { ...base, step: (base.step ?? 6) * 1.5, ellipseSegments: 34 },
    ]) {
      try {
        return bakeStroke(style.stroke(stroke, id), retry);
      } catch {
        // fall through to the next sampling
      }
    }
    throw err;
  }
}

export function bakeCharacter(
  character: BihuaCharacter,
  style: BihuaStyle = maobiStyle,
  options: BakeOptions = {},
): CharacterBake {
  const strokes = character.strokes.map((s, i) =>
    bakeBihuaStroke(s, `${character.char}-${i + 1}`, style, options),
  );
  const fused = fuseOutlines(strokes.map((s) => s.outline));
  return { strokes, fused, area: multiPolygonArea(fused), svgPath: toSVGPath(fused) };
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Truncate a stroke at fraction t (0..1) of its spine's arc length. */
export function truncateStroke(stroke: BihuaStroke, t: number): BihuaStroke {
  if (t >= 1) return stroke;
  if (t <= 0) {
    return { ...stroke, spine: stroke.spine.slice(0, 1), pressure: stroke.pressure.slice(0, 1) };
  }
  const pts = stroke.spine;
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    lengths.push(total);
  }
  const target = total * t;
  let cut = lengths.findIndex((L) => L >= target);
  if (cut === -1) cut = lengths.length - 1;
  const prev = cut === 0 ? 0 : lengths[cut - 1];
  const segLen = lengths[cut] - prev;
  const f = segLen === 0 ? 0 : (target - prev) / segLen;
  const spine = pts.slice(0, cut + 1);
  const pressure = stroke.pressure.slice(0, cut + 1);
  spine.push({
    x: lerp(pts[cut].x, pts[cut + 1].x, f),
    y: lerp(pts[cut].y, pts[cut + 1].y, f),
  });
  pressure.push(lerp(stroke.pressure[cut], stroke.pressure[cut + 1], f));
  return { ...stroke, spine, pressure };
}

/**
 * Bake the character drawn up to `upto` — an integer stroke index plus
 * a fraction of the next stroke (e.g. 2.5 = two full strokes and half
 * of the third). This is the frame source for stroke-order animation.
 */
export function bakeCharacterPartial(
  character: BihuaCharacter,
  upto: number,
  style: BihuaStyle = maobiStyle,
  options: BakeOptions = {},
): CharacterBake {
  const whole = Math.floor(upto);
  const frac = upto - whole;
  const parts: BihuaStroke[] = character.strokes.slice(0, whole);
  if (whole < character.strokes.length && frac > 0) {
    parts.push(truncateStroke(character.strokes[whole], frac));
  }
  const strokes = parts.map((s, i) =>
    bakeBihuaStroke(s, `${character.char}-p${i + 1}`, style, options),
  );
  const fused = strokes.length ? fuseOutlines(strokes.map((s) => s.outline)) : [];
  return { strokes, fused, area: multiPolygonArea(fused), svgPath: toSVGPath(fused) };
}
