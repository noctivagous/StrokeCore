// 林 (lín, "forest") — ASSEMBLED, not authored stroke by stroke:
// the stored 木 component placed twice. This character is the test
// of the component mechanism, so its placements are FITTED to 林's
// own Make Me a Hanzi medians (the honest way to check whether
// reuse + resize reproduces a real character):
//
//  - Left 木： squeezed to 0.60 × horizontally, 0.90 vertically —
//    side-by-side structures narrow their components.
//  - Its 捺 is rewritten by the na-becomes-dian variant rule, the
//    standard behaviour of 木 in left position.
//  - Right 木： 0.66 × horizontally, 0.92 vertically, no variant.
//
// Neither placement nor the variant is copied from 林's stroke data —
// the strokes come only from the 木 record. The overlay diff
// (scripts/bihua-lin-diff.mjs) measures what the assembly costs
// against 林's outline-database form.

import { placeComponent } from "../components.js";
import type { BihuaCharacter } from "../types.js";
import { mu } from "./mu.js";

export const lin: BihuaCharacter = {
  char: "林",
  pinyin: "lín",
  gloss: "forest (two trees)",
  grid: 1024,
  pressureProvenance: "authored",
  source:
    "Assembled from the 木 component ×2 (placements fitted to 林's MMH medians for the reuse test; left instance carries the na-becomes-dian variant). No stroke geometry copied from 林's own data.",
  strokes: [
    ...placeComponent(
      mu,
      { scaleX: 0.6, scaleY: 0.9, dx: -27.8, dy: 9.4 },
      { na: "na-becomes-dian" },
    ),
    ...placeComponent(mu, { scaleX: 0.66, scaleY: 0.92, dx: 330.5, dy: 37.7 }),
  ],
};
