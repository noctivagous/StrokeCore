// 部件 (bùjiàn, "components") — the repeated building blocks of
// characters （木， 氵， 扌， 心…). A stored component is NOT an outline
// or a picture: it is a construction in bihua, the same stroke
// records characters are made of, kept once and placed many times.
//
// Reuse is reliable, but never copy-paste. A placed instance carries:
//  - a PLACEMENT: translation + non-uniform scale. Side-by-side
//    structures squeeze components horizontally; stacked ones
//    flatten them vertically. The strokes survive the squeeze
//    because they are spines, not silhouettes.
//  - VARIANTS （变体）: named rules that rewrite a stroke when the
//    component takes a position — the textbook case being 木 as a
//    left component, whose final 捺 (nà) becomes a 点 (diǎn) so it
//    does not collide with its neighbour. Variants are rules on
//    bihua, declared in the placement, never silent edits.

import { truncateStroke } from "./render.js";
import type { BihuaStroke } from "./types.js";

/** A reusable component: bihua strokes in the component's own frame. */
export interface BihuaComponent {
  id: string;
  char: string;
  pinyin: string;
  gloss: string;
  strokes: BihuaStroke[];
  source: string;
}

export interface Placement {
  scaleX: number;
  scaleY: number;
  dx: number;
  dy: number;
}

/** A named rule rewriting one stroke of a placed component. */
export type VariantRule = (stroke: BihuaStroke) => BihuaStroke;

/**
 * 捺 becomes 点： the right-fall is withdrawn to a short press at its
 * head. The spine keeps the first ~35% of its arc (resampled by the
 * partial-sweep truncation), the form becomes dian, and the pressure
 * takes the dot's signature (press, then lift).
 */
export const naBecomesDian: VariantRule = (stroke) => {
  const cut = truncateStroke(stroke, 0.35);
  return {
    ...cut,
    form: "dian",
    pressure: cut.spine.map((_, i) =>
      i === 0 ? 0.95 : Math.max(0.5, 0.9 - 0.15 * i),
    ),
    segments: [{ bafa: "侧", form: "dian", span: [0, cut.spine.length - 1] }],
  };
};

export const VARIANT_RULES: Record<string, VariantRule> = {
  "na-becomes-dian": naBecomesDian,
};

/**
 * Place a component into a character frame. `variants` maps a stroke
 * form id (the form as stored in the component) to a variant-rule id
 * from VARIANT_RULES. Returns fresh stroke records in character
 * coordinates; provenance travels with each stroke.
 */
export function placeComponent(
  component: BihuaComponent,
  placement: Placement,
  variants: Record<string, string> = {},
): BihuaStroke[] {
  return component.strokes.map((original) => {
    let stroke = original;
    const ruleId = variants[original.form];
    if (ruleId) {
      const rule = VARIANT_RULES[ruleId];
      if (!rule) throw new Error(`unknown variant rule: ${ruleId}`);
      stroke = rule(stroke);
    }
    return {
      ...stroke,
      spine: stroke.spine.map((p) => ({
        x: p.x * placement.scaleX + placement.dx,
        y: p.y * placement.scaleY + placement.dy,
      })),
      pressure: [...stroke.pressure],
      segments: stroke.segments.map((s) => ({ ...s, span: [...s.span] as [number, number] })),
    };
  });
}
