# The pixel-diff testing environment

The environment that verifies StrokeCore's central claim — *can these
strokes actually be described?* — by measuring my baked glyphs against
David Harris's printed models in *The Art of Calligraphy*, pixel by
pixel. It exists so that fixing a glyph is a measurement loop, not an
opinion: change the strokes, re-run, watch the number.

## The technique

1. **Isolate Harris's glyphs.** `scripts/exemplars.py` extracts each
   model letter from the scanned pages by ink colour (slate blue for
   Foundational models, deep red for Imperial/Fraktur), connected
   components grouping detached strokes (dots merge into i/j), and
   writes crops + bounding-box maps to `demo/overlays/exemplars/`.
2. **Set my strokes to black and rasterise.** `scripts/diff.mjs` bakes
   the glyph's fused ink solid black on transparency at the exemplar
   crop's exact pixel size.
3. **Align on the baseline, scaled.** The bake's ink bounding box is
   mapped onto the exemplar's ink bounding box: uniform scale from ink
   height, ink lefts aligned, **ink bottoms aligned — the ink bottom
   is the baseline** (the descender line for letters with descenders).
   Spine coordinates are not the ink: the nib projects ~30 units past
   a spine end, which is why glyphs are authored with spine endpoints
   inset from the ladder lines.
4. **Pixel-diff.** `scripts/diff.py` removes Harris's white (alpha =
   ink) and classifies every pixel: overlap, his-only, mine-only.

## Run it

```
npm run diffenv                        # foundational, every glyph
npm run diffenv -- fraktur             # one font
npm run diffenv -- foundational a e o  # named glyphs
npm run diffenv -- --no-build          # skip the build preflight
```

Prerequisite: the exemplar maps must exist (`scripts/exemplars.py`;
page renders live in `demo/overlays/pages/`). The run builds the
package and re-emits the font JSON first, so it always measures the
current builders.

## Outputs (all under `demo/diffs/`)

| File | What it is |
|---|---|
| `<font>-<ch>.png` | The tri-colour diff: **dark grey** overlap, **crimson** Harris-only (my misses), **blue** mine-only (my excess) |
| `<font>-<ch>-side.png` | Harris (left) beside mine (right) at equal height — the quick human check |
| `<font>-<ch>-mine.png` | My raster alone, black on transparency |
| `<font>-<ch>-score.json` | IoU and his/mine/miss/excess pixel counts |
| `report-<font>.json` | All scores, worst first, with the alignment contract stated |
| `index-<font>.html` | Contact sheet: every glyph's diff + side-by-side, worst first |

IoU = intersection over union of the two ink masks. Hand-drawn
exemplars carry ±8% per-letter scale variance, so IoU is a compass,
not a verdict — read the diff image, not just the number.

## How to read a diff

The diff separates the three error classes of the stroke grammar
(docs/GRAMMAR.md):

- **Vocabulary error** — a whole feature is crimson (a stroke Harris
  has that I don't: i's dot), or a feature's *shape* is wrong in kind
  (a closed bowl where his is open). Fix: respell — add, remove, or
  replace a primitive.
- **Configuration error** — the right feature is present but a
  parallel crimson/blue pair runs along it, or a mass sits uniformly
  offset (his stem consistently left of mine, his bowl wider). Fix:
  retune the primitive's parameters or the pattern (widths, pitches,
  through-points, angles).
- **Resolution error** — crimson/blue *fringing* along curves that are
  otherwise in place: the shape is right but the spline is too coarse
  to hold it. Fix: more points on the composite spine.

Two diagnostic habits earned the hard way:

- If a rebuild does not move IoU, stop guessing at geometry and run a
  row/column ink-band analysis on the two masks first — parallel
  features phase-shifted by a few pixels score zero overlap while
  looking "close" (y's diagonals did exactly this).
- View my raster composited on white before judging it: the mine PNGs
  are black-on-transparent and render as a black square raw.

## The loop

```
read the diff → classify (vocabulary / configuration / resolution)
→ fix the strokes in src/fonts/<font>.ts (primitives, counts, points)
→ npm run diffenv -- <font> <ch> → re-read
```

Every pass so far is in the git history with its before/after table;
the diff rasters under `demo/diffs/` are the audit trail.
