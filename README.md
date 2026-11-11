# StrokeCore

Storing vector paths and letterforms in a stroke-based file format:
a spine, the nib or brush that travels it, and how the tool's tip changes
as it moves. Outlines are baked from strokes, never stored as the truth —
so a font file doubles as a ductus, the hand instructions for making the
letterforms. See `stroke-core.txt` for the founding essay and
`docs/SPEC.md` for the Phase 0 specification.

## Status

- **Phase 0 — spec** (`docs/SPEC.md`): tool/nib/brush model, stroke
  points, construction & the nib ladder, the sweep-and-fuse bake,
  the StrokeFont format, and the Banner Studio contract.
- **Phase 1 — the "x" test** (this code): a TypeScript core that bakes
  glyphs from spines only — a broad-edge nib held at a declared angle,
  sampled tip stamps strip-connected and boolean-unioned into one fused
  outline. Demo glyphs: `x` (two line spines) and `H` (Speedball C-nib
  manner: full-width stems, thin bar, from the tool alone).
- **Phase 2 — brush physics** (this code): stroke points carry pressure,
  twist and spread; each brush tool declares its pressure→tip mapping
  (pointed brush swells, flat brush spreads and thins, the Speedball E
  steel brush splays), and the resolver turns those channels into tip
  states for the same bake. Proof pieces: a pointed-brush swell stroke
  and a flat-brush Roman "A" twisting through its stems, over a Dürer
  scaffold. The Speedball table is complete (A–E, with George's
  direction behaviour per tool). Guideline + nib-stack rendering
  (`src/guides.ts`, both exemplar and checkerboard stacks) is in,
  ahead of the Phase 3 Foundational font.
- **Phase 3 — the StrokeFont format + three ductus sets** (this code):
  `src/font.ts` loads/validates `.strokefont.json` files (ladder,
  tool table, components, alternates), resolves component glyphs,
  bakes any glyph, and lays out text. The fonts live in `fonts/`:
  **Foundational** minuscules a–z + & (Formo/Harris; the serif+stem
  of b, d, h, k is letter l's, referenced as a component), **Imperial
  Capitals** A–Z (Harris's brush-drawn Trajan; twists as keyframes;
  F = E without its foot, H = two I's, Q = O + tail) and **Fraktur**
  minuscules a–z + ſ (Harris; 40°, ladder 5/2/2, diamond foot).
  Specimen sheets: `node scripts/specimen.mjs` →
  `demo/shots/specimen-*.png`, each alphabet on its labelled guides
  with nib stack. First transcriptions — expect tuning passes
  (Foundational bowls want rounding; Imperial serifs are still
  dashes; the Foundational & is weak).

## Run it

```
npm install
npm run gate          # typecheck + tests + demo bundle
npm run demo:shots    # writes demo/shots/*.svg stills
node scripts/png.mjs  # renders the stills to PNG
```

Then open `demo/index.html` in a browser (after `npm run demo:bundle`):
sliders for nib angle/width/thickness, spine and tip-stamp overlays, a
PostScript-style stroke comparison, and a stroke-by-stroke ductus view.
