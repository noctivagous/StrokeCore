# StrokeCore — Phase 0 Specification (draft)

Status: draft for the owner's judgment. Nothing here is built yet.
Sources: `stroke-core.txt` (founding essay), `strokeCoreChat.md` (gap analysis),
the owner's Floating Marker code (a working stroke engine, 2021–2022), and the
design discussion of 2026-11-10 (Metafont/`penpos`, Ross F. George's Speedball
system, the Renaissance proportion tradition, Catich on Trajan).

---

## 1. Purpose and destination

StrokeCore stores letterforms and designs as **strokes**: a spine, the tool
(nib or brush) that travels it, and how that tool's tip changes as it moves.
Outlines are a *baked product* of strokes, never the stored truth.

A StrokeCore font file is simultaneously:

- a machine font (it bakes to outlines, SVG, and eventually OTF), and
- a **ductus** — hand instructions: stroke order and direction, the tool and
  its size, the nib ladder that sets the proportions, the slant.

**Destination.** StrokeCore is the lettering engine for **Banner Studio**.
Banner Studio will not load outline fonts for its lettering: it will load
StrokeFonts, lay them out on its lettering grids (straight, slanted, arc,
oval, wave, ribbon, stacked…), and stroke page elements — rules, borders,
ornaments, letterforms — through StrokeCore tools, so the designs it produces
are authentic hand-derived work rather than outline fonts decorated after the
fact. Every design decision below is checked against that use.

**Completeness ambition.** The model must cover, without special cases:

- classic letterforms: Roman capitals, book hands, Italic, Gothic,
  pointed-pen scripts (Copperplate/Spencerian), versals (built-up capitals);
- calligraphy as practised: broad-edge nib, pointed nib, flat brush,
  pointed brush, sign painter's brush;
- sign making: George's Speedball techniques for reproducing *type* styles
  by hand, built-up and double-stroke lettering, casual brush lettering;
- design work beyond letters: ornament, diagrams, patterns, rules and
  borders stroked with any tool.

## 2. Principles

1. **Data, not code.** A glyph is data (spines, tip states, construction),
   authored visually. Metafont required designers to program; that is its
   documented adoption failure and we do not repeat it.
2. **Dual representation, strokes authoritative.** Files carry the stroke
   data; baked outlines are a cache that can always be regenerated
   (Floating Marker's SVG + embedded `fmkr:FMStroke` XML already proves
   this shape).
3. **Layers in historical order.** Stroke (the hand) → construction and
   proportion (Dürer's layer: grids, named points, ratios) → outline
   (the fossil). A file keeps all three; a renderer may use any level.
4. **Two kinds of ductus, honestly labelled.** *Native* — the strokes are
   the design (calligraphic hands). *Translated* — a type style is the
   target and the strokes are a hand method for it (George's mode).
   A glyph records which it is, and its source if translated.
5. **The tool is physical.** Nibs and brushes correspond to buyable,
   holdable implements wherever a historical one exists (Speedball A–E
   series, flat/pointed brushes). Convenience abstractions come second.
6. **Angle is the nib's, not the path's.** The defining break with
   PostScript: a tool's angle is declared, held, or varied on its own
   terms — never silently derived from the spine's tangent. Rotated butt
   caps and broad-edge thick/thin fall out of this; there is no separate
   `capRotation` property (the cap *is* the tip at the endpoint).

## 3. The tool model

A **Tool** is a nib or a brush. Both are described by a **tip shape** and a
rule for how the tip may change along a stroke.

### 3.1 Tip shape

```
TipShape =
  | { kind: "broadEdge",  width, thickness, cornerRadius? }   // rectangle-ish
  | { kind: "square",     width }                             // Speedball A
  | { kind: "round",      diameter }                          // Speedball B, monoline
  | { kind: "oval",       width, height }                     // Speedball D
  | { kind: "pointed",    maxWidth, length }                  // pointed nib / pointed brush
  | { kind: "flatBrush",  width, thickness }                  // sign brush, Trajan brush
  | { kind: "polygon",    points: [...] }                     // custom / historical tips
```

Angles are in degrees, measured from the baseline (0° = horizontal,
counter-clockwise positive). Broad-edge zero: the edge itself horizontal.

### 3.2 Nibs (rigid tools)

A nib's tip shape is rigid. Along a stroke only its **size scale** and
**angle** may vary, and both are declared at stroke points (§4), never
assumed. Named nibs (convenience constructors over TipShape):

- `speedballNib("A" | "B" | "C" | "D", size)` — George's series:
  A square, B round, C chisel (broadEdge), D oval; sizes follow the
  maker's numbering, mapped to millimetres in the font's tool table.
- `speedballBrush("E", size)` — the steel brush; modelled as a brush (§3.3).
- Plain constructors: `broadEdgeNib(w, t)`, `roundNib(d)`, `ovalNib(w, h)`,
  `pointedNib(maxW, len)`.
- **Direction behaviour** (George's rule, 1927): a Tool declares whether
  it works in any direction (Speedball A, B, D — "up, down or sideways")
  or is manner-bound (Style C and broad-edge generally: pulled strokes
  at a declared angle, "the normal lettering manner"). Authoring tools
  and ductus display use this; the bake does not care.

### 3.3 Brushes (variable-tip tools) — implemented in Phase 2

Sequencing confirmed by the owner (2026-11-10): rigid nibs shipped in
Phase 1; brush deformation followed in Phase 2, as built: stroke points
carry `pressure` / `twistDeg` / `spread`; each brush tool declares its
pressure→tip mapping (`effectiveTip` in the code); the resolver turns
the channels into tip states, and the Phase 1 bake consumes them
unchanged.

A brush's tip **changes shape as it moves**: it swells with pressure,
thins on the lift, twists at curves (the Trajan flat brush), splays if
forced. StrokeCore does not simulate brush physics; it records the tip's
state along the stroke, which is both what an author sets and what a
hand needs to be told. Per stroke point (§4) a brush carries, in addition
to size and angle:

```
pressure   0..1   // drives tip width/length for pointed brushes,
                  // thickness/spread for flat brushes
twist      deg    // rotation of the tip beyond its declared angle —
                  // the flat-brush flexion Catich describes
spread     0..1?  // optional splay; default derived from pressure
```

Each brush Tool declares how pressure maps to its tip shape
(e.g. pointed brush: width = maxWidth × pressure curve; flat brush:
effective width grows, thickness falls). The mapping is part of the tool
definition, so the same stroke data reads correctly as hand instruction
("press here") and as machine geometry (the baked tip at that point).

## 4. Strokes and stroke points

A **Stroke** is one continuous tool movement, in ductus order.

```
Stroke {
  id
  tool: ToolRef
  role: "stem" | "bar" | "bowl" | "serif" | "swell" | "hairline"
      | "buildUp" | "fill" | "shade" | "rule" | "other"
  move?: string            // named calligraphic move: "downstroke",
                           // "compound curve", "underturn", … (free text
                           // from the font's move vocabulary)
  spine: Spine
  points: StrokePoint[]    // tip states at spine nodes, in order
  fuseGroup?: string       // strokes sharing a group bake fused (§6)
}
```

A **StrokePoint** is Metafont's `penpos`, extended for brushes — design
data declared at a node, interpolated between nodes:

```
StrokePoint {
  at: nodeRef              // which spine node this state belongs to
  widthFactor: 1.0         // tip size multiplier at this point
  angle?: deg              // absolute tip angle here; absent = hold rule
  angleMode: "fixed" | "absolute" | "tangentRelative"
  pressure?: 0..1          // brushes; nibs ignore
  twist?: deg              // brushes
}
```

Interpolation between stroke points: positions follow the spine;
width/pressure interpolate linearly in `t`; angles interpolate by the
shortest circular path. `angleMode: "fixed"` is the calligraphic default
(the hand holds the nib at, say, 30° for the whole stroke);
`"tangentRelative"` exists for monoline tools and ornament, and is never
the silent default.

**Spine.** Cubic Bézier segments and straight segments between nodes.
Nodes may be literal coordinates, references to ConstructionPoints (§5),
or turtle steps (`length + angle` from the previous node) — the essay's
construction convention. Turtle steps resolve to coordinates at load;
the file keeps the turtle form so the construction stays legible.

**Caps and joins need no properties of their own.** The start and end of
a baked stroke are the tip shape at the first/last point, at its declared
angle (this is what makes the typographic "x" work). A sharp corner
*within* one stroke is a node with a hard-corner flag; the bake (§6)
miters it with a declared limit, or the author splits the stroke — as a
hand would lift and re-place the tool.

### 4.5 Composite spines — the FMStroke scaffold

Raw cubic control points are a poor authoring surface for letterform
curves: the curve does not pass through them (a cubic reaches only
~¾ of the way to its controls), corners must be faked, and a circular
bowl cannot be stated as one. The scaffold this system authors on —
inherited from Floating Marker's FMStroke, by way of NibGlider's
NGCompositePath — is the **composite spine**: a list of *semantic
points*, each declaring what it is and what leaves it.

- **Point kinds.** `spline` (the curve flows smoothly), `corner` (a
  hard cusp), `round` (a rounded corner; with `corner.radius` and
  `corner.rounding: arc | bSpline | bevel`, the trim capped at half of
  each adjacent leg), `line`, `bowed`, and `arcThrough` (this point is
  the through point of a circular arc from the previous point to the
  next — a bowl side stated as three construction points).
- **Outgoing segments.** A point may declare its outgoing segment:
  `line`, `spline`, `bowed` (a quadratic peak at `bowOffset` from the
  chord, on the `bowFacing` side), or `arc` (the chord's arc).
- **Tip state rides on the points.** The penpos channels of §4
  (angle, width factor, pressure, twist, spread) are declared on
  composite points exactly as on spine nodes.
- **Expansion is derived, never authored.** Following FM's
  multiplicity trick, expansion emits 1 B-spline control for a spline
  point, 2 for a rounded/bowed vertex, 3 coincident for a hard corner;
  arcs resolve to true circles through their three points; the
  commands are sampled (uniform cubic B-spline, clamped open or
  periodic closed; adaptive tolerance) and resampled uniformly by arc
  length, so keyframe interpolation runs by arc position. The result
  is an ordinary §4 spine. A file stroke may store `composite` with
  or without the expanded `spine`; the loader expands when the spine
  is absent. The composite points are the authoring truth — they are
  §5's ConstructionPoints in working form — and everything below them
  may be regenerated.

Implemented: `src/composite.ts` (`expandCompositeSpine`), the
`cspine`/`cstroke` authoring helpers, loader expansion in
`src/font.ts`. First glyph on the scaffold: Foundational **o**, two
circular arcs through three points each.

## 5. Construction and proportion

Two proportion systems, both first-class, because history has both:

- **The nib ladder (tool-derived).** The font declares its ladder:
  `xHeight`, `ascender`, `descender`, `capHeight` counted in nib widths
  of the font's reference tool (e.g. Italic: 5 / 4 / 4). Metrics are
  *derived*: with the reference nib width in font units, the ladder
  fixes baseline, x-height, cap, ascender and descender lines. Slant
  (degrees) is declared beside the ladder.
- **The geometric scaffold (Dürer's layer).** A glyph may carry a
  ConstructionGrid — a square/circle scaffold divided into declared
  units (Feliciano's ten, or any other) — and ConstructionPoints: named
  anchors (`baseline-left`, `apex`, …) defined by grid position,
  ladder line, or relation to other points. Spine nodes and stroke
  attachment points may reference them, so a serif lands on the same
  declared point every time. The scaffold *describes*; per Feliciano's
  own distortions, tooling must warn, not silently bend a glyph to fit.
- **The square lattice (Dürer's Textura convention).** A font built
  from one module square declares `construction.grid`:
  `{ kind: "square-lattice", module, stack: { short, tall? },
  diamondCentre?: { top, bottom } }`. The module's side *is* the stem
  width, which is the reference tool's nib width — the loader rejects
  a declaration that disagrees with the tool table. Two element kinds
  live on the lattice: right squares (stacked to the declared heights,
  repeated at the letter's pitch) and oblique squares — the module
  square at 45°, centred on a stack edge at the declared fraction of
  the module (Dürer: ⅓ along the top edge, ⅔ along the bottom). A
  glyph's construction is then a recipe over these elements and the
  shared standards built from them, which is how the Dürer font is
  authored (see `docs/sources/durer-1525-notes.md`).

## 6. The bake: sweep and fuse

Baking a stroke = sweeping its tip along its spine and taking the
envelope; baking a glyph = the union of its strokes' envelopes, fused
where the author intends one ink shape.

**v1 algorithm (the Floating Marker method, made a library):**

1. Sample the spine adaptively: step by distance, finer where curvature
   or tip-state change is high.
2. At each sample, compute the tip polygon (shape × widthFactor ×
   pressure mapping, at the interpolated angle + twist).
3. Connect consecutive tip polygons into strip quads; add the end tips
   as caps.
4. Union all strips and caps (boolean union; Paper.js in the TS build —
   the same engine Nibglider already ships).
5. Simplify the unioned outline within a declared tolerance (font units),
   removing self-intersections and duplicate points.

This is knowingly the empirical method. Its known costs, from Floating
Marker: union is the hot spot (keep bakes cached per glyph + tool state;
bake on change, not per frame), and simplification tolerance is a quality
knob that must be stored with the bake so output is reproducible.
Analytic envelopes (the MetaFog problem) are a later optimisation, not
a v1 requirement; the file format does not depend on the algorithm.

**Verification (2026-11-10).** The bake is checked against MetaPost
as an independent exact-envelope oracle (`scripts/oracle.mjs`,
`docs/ORACLE.md`): for constant-state strokes our sweep agrees with
`draw withpen` to IoU ≥ 0.997 across all five fonts. MetaPost's
`penstroke` is a *different semantics* — an envelope through the
pen's diameter endpoints at declared nodes — and under-covers
fast-varying (twist/taper) strokes by up to a quarter of their area;
our full-footprint sweep is the model's definition, and any future
MetaPost export must emit varying strokes as segmented
`draw withpen`, not `penstroke`.

**Fuse policy.** Within a glyph, strokes in the same `fuseGroup` (default:
all ink strokes) union into one outline — required for a C-nib sans in
George's manner and for built-up letters. Strokes may opt out (hairline
details, shade strokes in Banner Studio effects) and remain separate
paths in the bake, in ductus order. The stroke data is never fused;
only the bake is.

**Export.** Baked glyphs export as SVG paths directly. OTF generation
(baked outlines → fontTools) is a later phase; hinting is out of scope.

## 7. Glyphs and the StrokeFont file

```
Glyph {
  name, codepoints: [U+...]
  ductusKind: "native" | "translated"
  source?: string          // for translated: the type style & reference
  strokes: Stroke[]        // in ductus order — this order IS the hand order
  construction?: { grid?, points: ConstructionPoint[] }
  advance?: number         // font units; absent = derived from bake
                           // + declared side bearings
  components?: GlyphRef[]  // reuse another glyph's strokes, transformed
                           // (printed precedent: Foundational teaching
                           // cross-references the serif+stem of b, d, h
                           // to letter l — see docs/sources/
                           // foundational-page44-notes.md)
  alternates?: Glyph[]     // named variant forms of this glyph, each
                           // with its own ductus (Harris prints an
                           // alternative g beside the traditional one;
                           // Formo marks Johnston variations of g, j, x)
}
```

```
StrokeFont {                  // one JSON file, extension .strokefont.json (§10)
  format: "strokefont", version: 1
  name, designer?, sourceNote?
  unitsPerEm: 1000
  referenceTool: ToolRef      // the nib the ladder is counted in
  ladder: { xHeight, ascender, descender, capHeight }   // in nib widths
  slant: deg
  tools: Tool[]               // the font's tool table (named nibs/brushes)
  moves: string[]             // the font's ductus move vocabulary
  primitives?: { [basePrimitive]: { [param]: value } }
                              // the hand's configuration TABLE over the
                              // core's base primitives (docs/GRAMMAR.md);
                              // glyph strokes override it point by point
  patterns?: { [name]: { primitive, config?, note? } }
                              // named, reusable primitive configurations
  glyphs: { [name]: Glyph }
  encoding: { [codepoint]: glyphName }
  bearings: { defaultLeft, defaultRight }
  kerning?: { [pair]: adjustment }
}
```

Each stroke in the file pairs the three letterform lexicons
(docs/GRAMMAR.md, `src/primitives.ts`): `role` — the anatomy part it
is (stem, bowl, arm, ear, tail, …); `gesture` — the base primitive
it is spelled with, configured ({primitive, config?}); `purpose` —
what it is doing for the letter, a function verb plus target part
({function: "completes", target: "serif"}). The loader validates
roles, gestures, purposes, the `primitives` table and `patterns`
against the core's base set.

The hand instructions are not a separate document: stroke order, `move`
names, tools with physical sizes, and the ladder *are* the ductus sheet.
A renderer can animate or print them (Banner Studio's "how it's made"
view is a consumer of exactly this).

## 8. The Banner Studio contract

A second consumer is practice-sheet generation (the owner's
Calligraphy Practice Maker — see `docs/sources/practice-maker-notes.md`):
it needs the same glyphs + ladder + ductus, composed as model/blank
practice rows. It stays a consumer, not part of the core; what it proves
is that a StrokeFont must self-declare its design nib width and ladder —
the practice maker bolts both onto outline fonts as sidecar metadata,
because font files don't carry them.

StrokeCore exposes, and Banner Studio consumes:

- `loadStrokeFont(file) → StrokeFont` (parse + resolve construction).
- `layoutText(font, text, options) → PlacedGlyph[]` — advances, kerning,
  slant, and baseline placement, including along Banner Studio's
  lettering-grid paths (arc, oval, wave…: the grid supplies a baseline
  curve and per-glyph rotation; StrokeCore supplies the strokes).
- `bakeGlyph(font, glyph, toolOverrides?) → SVG path data` — cached.
- `strokePath(spine, tool, points) → SVG path data` — the general
  element-stroker: any page element (rule, border, ornament, divider)
  is a spine + a tool, stroked by the same engine as the letterforms.
  This is what "the way it strokes elements on the page will come from
  StrokeCore" means mechanically.
- `ductus(font, glyph) → ordered step list` — tool, move, direction,
  ladder position per stroke, for instruction display/print.

Banner Studio keeps: layout on paper, tiling/printing, composition,
colour, glyph *effects* (shade, keyline, block…) — effects consume baked
paths and are not StrokeCore's concern.

## 9. Coverage checklist (what "complete" must not special-case)

- Roman capitals: native brush ductus (Catich) *and* Dürer-scaffold
  construction *and* George translated technique — all three in one system.
- Built-up letters: versals and Poster Roman (skeleton strokes + buildUp
  strokes + fill), double-stroke alphabets.
- Broad-edge hands: Italic, Foundational, Uncial, Gothic — fixed-angle
  nib, ladder-set proportions, slant.
- Pointed-pen scripts: pressure-driven swell/shade, hairlines —
  exercises the brush/pressure model on a nib.
- Pointed and flat brush lettering: sign casuals, Trajan brush twist.
- Sans and modern type styles as translated ductus (Speedball C/B).
- Non-letter work: stroked rules, borders, ornaments, diagrams, patterns
  (turtle + construction grids), repeated motifs along a spine.

## 10. Phases

- **Phase 0 — this spec.** Lock the tool/stroke/construction model.
- **Phase 1 — the "x" test.** TypeScript library skeleton; spine +
  fixed-angle rectangle nib + the §6 bake; render an "x" and an "H"
  from spines only, in a small demo page. No font format yet.
- **Phase 2 — the brush test.** Variable tip (pressure + twist) on the
  same harness; a flat-brush Roman "A" with a Dürer scaffold overlay,
  and a pointed-brush swell stroke. George nib table (A–E) lands here.
- **Phase 3 — the Foundational hand milestone.** *(Built 2026-11-10:
  the §7 format in `src/font.ts`; `fonts/foundational.strokefont.json`,
  `fonts/imperial-capitals.strokefont.json`,
  `fonts/fraktur.strokefont.json`; specimen sheets in demo/shots.
  First transcriptions — tuning passes remain.)* The §7 format; the
  first complete StrokeFont is **Foundational**, in two ductus sets:
  (1) the minuscules a–z + &, built to the Formo exemplar's proportions
  (see `docs/sources/formo-foundational-notes.md`) with Harris's
  stroke splits and captions as the second source: broad-edge nib at
  30°, ladder 4 / 3 / 3, per-stroke angle modifications on the
  diagonals (45°/30°/0°) as the exemplar annotates them; (2) **Roman
  capitals A–Z made from calligraphy** — the Imperial Capitals of
  Harris pp. 113–119 (see
  `docs/sources/harris-imperial-capitals-notes.md`): Trajan in form,
  **flat-brush in construction** (Catich's tradition), transcribed
  stroke by stroke with their quantified twist instructions. A
  native ductus, *not* a translation of Trajan or type (translated
  capitals come later, as the translated-ductus proof). Its own
  ductus set — different tool and scale from the minuscules —
  sharing the component discipline (E is its key letter; F, L, G,
  H, Q, T, Z are built from referenced pieces); (3) **Fraktur
  minuscules a–z + ſ**, from Harris pp. 76–77 (see
  `docs/sources/harris-fraktur-notes.md`): square-cut broad-edge at
  40°, ladder 5 / 2 / 2, hairline spikes by stroke extension past the
  join, twist ramps to near-vertical for the pointed descenders of
  f, p, q, the diamond foot as a shared finishing component.
  Fraktur capitals are out of this phase — the source pages don't
  carry them. Ductus view included. **Display requirement for this milestone's examples:** every
  rendered example shows the full guideline set, labelled — Ascender
  Line, Capital Line, Waist Line, X-height, Base Line, Descender
  Line — and the **nib stack** at the left: alternating black/white
  nib-width squares stacked from descender line to ascender line,
  broken at each guideline, so the proportion is visible at a glance.
- **Phase 3.5 — calligraphy quality (the owner's correction,
  2026-11-10: the fonts "need a lot to make the calligraphy look
  right" before any integration).** The Phase 3 transcriptions are
  structurally true and visually early, and their coordinates are
  artisanal — placed by eye. This phase replaces eyeballing with
  construction, then tunes what remains: (a) **implement the §5
  construction layer** — ConstructionGrid + ConstructionPoints in the
  format and loader, spine nodes referencing declared points, so a
  serif lands on the same point in every glyph and proportions are
  derived, not placed (proportion was always in the Roman-capitals
  tradition — the letters were made to fit the square's proportions,
  aimed at chiseled outcomes — and some, Dürer among them, later
  formalised that existing proportion into written constructions;
  the owner's formulation, replacing the looser "hand strokes
  formalised with proportion"); (b) **re-derive
  the glyphs from construction** — the Foundational o from its grid
  with the bowl family sharing its points, the Imperials on the
  square/circle scaffold, the Fraktur minims from declared units;
  (c) per-family passes in the books' own teaching order — o first,
  then E, then the minim family; (d) an overlay loop as *verification*
  — each baked glyph rendered over its source exemplar at ladder
  scale to check the construction, not as the method of placing
  points; (e) re-checking every letter's stroke splits against the
  Harris decompositions (some Phase 3 letters simplified them);
  (f) fit — advances and bearings tuned by setting words. Exit
  condition is judgment, not coverage: the specimens look like the
  hands they claim to be.
- **Phase 4 — Banner Studio integration.** Banner Studio loads the
  Phase 3 font for one lettering path end-to-end (grid layout + bake +
  print), replacing a loaded outline font for that path. *Deferred
  behind Phase 3.5 by the owner's direction.*

## 11. Open decisions (owner's word needed)

1. **File extension:** `.strokefont.json` (explicit, tool-friendly) vs
   `.strokefont` (cleaner, Floating Marker precedent is content-detected
   formats). Draft assumes `.strokefont.json`.
2. **Package home:** StrokeCore as a standalone TS package in this repo,
   consumed by Banner Studio as a dependency (recommended) vs code
   living inside Banner Studio. Draft assumes standalone.
3. **Brush model depth:** — RESOLVED by the owner (2026-11-10): Phase 2
   does **brush physics** (a flex/spring-style model) whose output is
   tip states in the §3.3/§4 form, so baked geometry and hand
   instructions stay uniform across nibs and brushes.
4. **First font (Phase 3):** — RESOLVED by the owner (2026-11-10):
   **Foundational**, per Jean Formo's exemplar as reference (ladder
   4/3/3, 30°, guideline + nib-stack display requirements in §10).
