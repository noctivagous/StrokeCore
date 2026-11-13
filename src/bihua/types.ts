// Bihua Foundation — character and stroke record types (docs/BIHUA.md).
// Coordinates are the 1024-unit character grid of the source data,
// y-up, matching the core's font-unit convention.

import type { Pt } from "../types.js";

/** Where a stroke's spine geometry came from. A fit is an estimate. */
export type SpineProvenance = "authored" | "fitted-from-median";

/** One 笔形 (stroke form) segment of a written stroke, for teaching. */
export interface BihuaSegment {
  /** The 永字八法 method this segment realises, when it does (侧, 勒, …). */
  bafa?: string;
  /** Form id from forms.ts (e.g. "heng"). */
  form: string;
  /** Inclusive node-index span of the parent stroke's spine. */
  span: [number, number];
}

/** One written stroke of a character: an ordered spine + brush profile. */
export interface BihuaStroke {
  /** Form id of the stroke as written (may be a compound, e.g. "hengzhegou"). */
  form: string;
  /** Spine nodes (the stroke's centreline), in writing order. */
  spine: Pt[];
  /** 笔法: brush pressure 0..1 at each spine node, same length as spine. */
  pressure: number[];
  /** The 八法 segments this stroke contains, in writing order. */
  segments: BihuaSegment[];
  provenance: SpineProvenance;
  /** Converter metadata for fitted strokes (F2): how the label was earned. */
  fit?: {
    /** Classifier confidence, 0..1. */
    confidence: number;
    /** HanGlyph constraint-equation check over the fitted spine. */
    validator: "pass" | "fail" | "no-spec";
    /** The constraint relations that failed, when validator is "fail". */
    failedRelations?: string[];
    /** True when a human should look at this stroke before the record is trusted. */
    review: boolean;
  };
}

/** A character as a construction: strokes in 笔顺 (stroke order). */
export interface BihuaCharacter {
  char: string;
  pinyin: string;
  gloss: string;
  /** Grid size the coordinates live on (1024 for Make Me a Hanzi data). */
  grid: number;
  strokes: BihuaStroke[];
  /** Provenance of the pressure profiles (the 笔法 layer). */
  pressureProvenance: "authored" | "fitted";
  /** Human-readable source note for the record as a whole. */
  source: string;
}
