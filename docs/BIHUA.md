# Bihua Foundation — 笔画

A dedicated foundation inside StrokeCore whose only customer, for now,
is **HanJian** (hanjian-reader). It provides a parametric
Chinese-character stroke system — strokes as named, brush-executed
constructions — instead of the outline databases HanJian currently
ships (Make Me a Hanzi silhouettes).

Status: **F0 + F1** (this document; scaffold; the 永 pilot). Branch
`feat/bihua-foundation`. Nothing here is pushed without the owner's word.

## Naming — the domain's own terms

Not "hanzi" (that word belongs to the app side). The foundation is
named from the field's own vocabulary:

- **笔画 (bǐhuà)** — the strokes of a character. The foundation:
  `src/bihua/`, imported as `strokecore/bihua`, this document.
- **笔形 (bǐxíng)** — stroke forms: the named shapes （横， 竖， 撇， 捺…).
  The vocabulary layer, `src/bihua/forms.ts`.
- **笔顺 (bǐshùn)** — stroke order: the sequence a character is written
  in. The character-construction layer.
- **笔法 (bǐfǎ)** — brush method: entries （起笔）, exits （收笔）, pressure.
  The brush layer, `src/bihua/brush.ts`.

## Boundaries

- StrokeCore's original mission — Western letterforms, its grammar,
  fonts, bake behaviour, METAFONT calibration, Phase 3.5 — is **not**
  this foundation's business and is untouched by it. The Western work
  stays parked as it stands and may adopt pieces from here later, in
  its own time.
- This foundation consumes the core (spine sampling, tip stamping,
  union bake) as a customer. It does not bend core semantics; needs
  are named and added carefully if they arise.
- The character format here is a *character* format, distinct from the
  §7 StrokeFont format for Latin hands. Related ideas, different data,
  no forced unification.
- Character records live as typed data modules under
  `src/bihua/characters/`, following the repo's existing precedent for
  the Latin hands (`src/fonts/*.ts`), rather than a separate data
  directory — one build path, no duplication.

## MetaFont, at three levels

1. **Design discipline** — glyphs as programs: points by relation,
   pens, reusable macros. The templates are authored in this spirit.
2. **Oracle** — the MetaPost oracle (`scripts/oracle.mjs`) extends to
   the round-brush profiles. Its standing finding governs brush work:
   `penstroke` under-covers fast-varying strokes; varying strokes are
   emitted as segmented `draw`. A pressure brush is a varying stroke.
3. **Engine / modules** — the strokes and methods themselves stem
   from MetaFont capabilities, as their own reusable modules (owner
   direction, 2026-11-12). Built in F1: `src/bihua/mp/bihua.mp` — the
   brush pen, a segmented varying-width draw (never `penstroke` for a
   varying stroke), and one parametric path macro per 笔形
   (b_dian/b_heng/b_shu/b_gou/b_ti/b_pie/b_na/b_zhe) that characters
   compose when authored in MetaPost. `src/bihua/metapost.ts` emits a
   program for any character record through that module, so the same
   record renders under MetaPost and under our bake, and the two can
   be compared. **Run status (2026-11-12):** with an `mpost` binary
   present, both emitted programs (永 and the forms check) execute
   with zero errors and render recognisably (demo/bihua-mp/*-1.svg);
   the segmented joins are faintly visible in the MetaPost figure —
   the known texture of segmented draw. Two MetaPost lessons are
   baked into the emitter: type declarations cover whole families
   (`path sp[];`, never `path sp0;`), and rewritten state takes `:=`,
   not equation.

## Rendition styles

A character record holds 笔顺 and 笔形 — how the character is
written — and no rendition. Rendition is a style (`src/bihua/styles.ts`):
a tool plus an interpretation of the record's pressure channel, the
same split StrokeCore's Latin hands use. Modern Chinese draws the
same character many ways, and the styles name the tool honestly:

- **毛笔 (máobǐ)** — the pointed brush: elongated patch pointing
  along travel, shape coupled to pressure, tip lagging at turns.
- **扁笔 (biǎnbǐ)** — flat brush held at an angle: width governed by
  direction against the edge, and the brush is ROLLED as it is worked.
  The roll is a core StrokeCore capability (Tool.roll): this style
  declares the *travel* roll law — pressure rotates the face square
  to the direction of travel when pressed (broad ink) and toward the
  edge when lifted (thin ink), up to 40°, reading an inertia-smoothed
  tangent so the roll swings through a 钩 (gōu) instead of snapping
  at its direction flip. (A fixed-frame roll mode also exists in the
  core; one law had to be chosen, and the travel law is the one that
  broadens a pressed 横 (héng) and a pressed 捺 (nà) alike.) The
  art-lettering / sign style.
- **圆珠笔 (yuánzhūbǐ)** — ballpoint pen (pencil is near enough): the
  one common tool whose mark really is a disc of near-constant size.
  A circle tip lives here, not in any brush.
- **黑体 (hēitǐ)** — sans-serif type: uniform width, pressure ignored,
  square-cut ends. A type rendition, not a hand tool.

宋体/明体 (the serifed print style) is deliberately absent for now:
its stroke-end ornaments are construction, not rendition, and belong
to a later style that adds them at the 笔形 level.

## Prior art

Hóng-Zì (2003–2006), a Chinese METAFONT structured exactly as
this foundation is — strokes, radicals, distributions,
characters — was studied in full as the design reference; the
comparison, including its size-conditional components and its
layout algebra, and the F4 deltas drawn from it, are recorded in
docs/HONGZI.md. HanGlyph/CCSS (2003) is the other direct
ancestor (a description language rendered through MetaPost);
its study — the 41-stroke taxonomy with per-stroke constraint
equations, the relation system, and CCSS's three-macro
implementation — is recorded in docs/HANGLYPH.md, including
the labelled gap table for our 笔形 vocabulary and the
validators it suggests for F2. Tsukurimashou is the living
METAFONT CJK project. None is a
codebase for us: the runtime stays ours (standing decision,
2026-11-10), and what they offer is evidence about the design.

## Components （部件）

Repeated elements are stored once — as bihua constructions, never
as outlines (`src/bihua/components.ts`). An instance is a PLACEMENT
(translation + non-uniform scale) plus named VARIANT rules
(e.g. `na-becomes-dian`, the standard behaviour of 木 in left
position).

Measured on the first assembly, 林 from 木 ×2 with placements fitted
to 林's own medians (scripts/bihua-lin-diff.mjs):

- **Balance transfers.** Centroid within 18 grid units of the
  reference form; quadrant ink shares within 0.036 — the 田字格
  proportions of the assembled character are the real character's.
- **Silhouette only partially.** IoU 0.434 vs 永's 0.734 authored
  directly. Per-stroke spine distances explain it: the horizontals
  land within 3–7 units, but verticals sit 34–52 units from where
  affine placement puts them, the variant dot ~53. A component in
  context is not merely resized — its internal proportions shift
  (the vertical rebalances inside its squeezed frame, neighbours
  yield to each other). Narrowing the brush does not close the gap
  (IoU falls), so the difference is geometry, not ink weight.
- **Conclusion for the database:** reuse is reliable for structure —
  forms, order, balance — and placements must allow per-instance
  stroke adjustment (authored overrides at assembly time) to reach
  authored-character accuracy. That adjustment layer is F4 work; the
  mechanism and its limits are now measured rather than assumed.

## Provenance discipline

Every character record states, per stroke, where its geometry came
from: `authored` (written for this database) or `fitted-from-median`
(derived from Make Me a Hanzi median data — hanzi-writer-data 2.0.1,
Arphic Public License; attribution in the record). A fit is an
estimate and is never presented as a transcription. Pressure profiles
in F1 are authored （笔法 layer) over fitted spines; the record says so.

## F2 converter (built 2026-11-12)

`src/bihua/convert.ts` turns a Make Me a Hanzi median file into a
draft record: dedupe the median into a spine; detect corners
(RDP vertices turning ≥ 52°, arc-window sharpness separating 折
from 弯）; match the leg pattern against the 41-stroke taxonomy
(forms.ts now carries all 41, each with its HanGlyph code);
assign the form's pressure signature; then verify the label with
the form's HanGlyph constraint equations (`src/bihua/constraints.ts`,
37 forms with executable specs). The equations are applied with
two explicit calligraphic allowances — a 横 may rise （抗肩） and a
竖 may lean — because the manual's control points are ideals and
medians carry real hand geometry. Each stroke records confidence,
validator verdict and a review flag in its `fit` field.

Measured on the first batch (19 characters, 87 strokes;
`scripts/bihua-convert.mjs`, fixtures in
`scripts/fixtures/hanzi-writer/`): bake IoU vs the source
outlines 0.63–0.79 (the authored 永 scores 0.734 on the same
measure); the converter reproduces the hand-authored labels of
永 and 木 exactly, all validators green; 6 of 87 strokes are
queued for review. The queue is the honest residue: the 撇折
family's entry patterns （女/好/火 first strokes), one flat 撇
borderline （我）, and two validator catches inside 國. Known
limits: medians round some 折 corners toward 弯 (the sharp/curved
call is provisional near the boundary), and the 抗肩/提 boundary
can misread a strongly rising 横 as 提 （我 stroke 2). Fitted
drafts live in `src/bihua/characters/fitted/`, visibly separate
from authored records.

## Analytical test engine (built 2026-11-12)

Quality does not rest on one overlay number or one pair of eyes.
`src/bihua/analyze.ts` examines baked ink against a ground-truth
character file in five distinct ways, each aimed at a different
failure mode: IoU (whole + per stroke) for silhouette; 田字格
grid delta for balance; width profiles (ink width across the
spine at 12 arc fractions, candidate vs oracle around the same
centreline) for taper and swell — the measure that sees a flat
brush that does not taper; corner ink ratios (ink in a disc at
each detected corner, candidate vs oracle) for joints — the
measure that sees strokes looking overlapped at a turn; and
boundary distance (mean/p95 between the two outlines) for
placement drift. `scripts/bihua-analyze.mjs` prints the
scorecard per character and style. Verdict bands in the engine
are a first calibration from the F2 batch and are expected to be
argued with; the measures are the durable part. First batch
reading (maobi): placement is strong (boundary means 1–7
units), silhouette mid-band (IoU 0.63–0.80), and the width
profile is where a brush honestly departs from print — per
stroke, in numbers (e.g. short printed 横 run ~44% narrower in
profile than the brush's on 四）.

## Field-ink pilot (run 2026-11-12, scripts/bihua-field-pilot.mjs)

Question: would a metaball-style FIELD fusion (the grid-paint-labs
approach) beat the polygon union at a corner? Pilot on 永's 横折钩,
maobi: both fusions start from the identical tip stamps; the field
gives each stamp an oriented elliptical Wyvill kernel, sums it on a
4-unit grid, and takes the marching-squares contour, with one
calibration parameter (kernel scale) fitted to the straight run only.
Result: the two inks are 0.93 IoU to EACH OTHER; against the oracle
the field edges IoU (0.795 vs 0.787) and visibly smooths the corner's
outer profile (the union keeps a small knobble where the vertical's
stamps stack), while the union edges boundary distance and width
profile. Pressure-weighting the kernels changes nothing material.
The decisive reading: BOTH fusions put only 0.81–0.83 of the oracle's
ink in the corner disc — the corner's remaining distance from print
is in the STAMPS (tip size / pressure through the turn — a real turn
carries a 顿 dwell), not in the fusion. Verdict: union stays as the
bake (exact outlines are the foundation's contract); the field
remains a candidate rendition for animated ink, and future corner
work belongs to the pressure profile, not the fusion.

## Sequence

- **F0** — this charter; scaffold; `strokecore/bihua` subpath export;
  the repo gate passes unchanged.
- **F1** — 永 pilot: the eight canonical 笔形 of 永字八法 as parametric
  templates, the pointed 毛笔 and the style layer, the partial-sweep
  renderer; 永 baked,
  animated, and overlay-diffed (IoU) against the Make Me a Hanzi
  outline oracle. Exit is the owner's eye: written, not traced.
- **F2** — converter: seed further characters from medians,
  auto-classify forms, queue low-confidence fits for review.
  BUILT 2026-11-12 (see "F2 converter" above): 41-form taxonomy,
  constraint validators, 19-character fitted batch with review
  queue.
- **F3** — HanJian wiring: the inspector consumes the foundation
  through the `file:../strokecore` link; stroke names shown as strokes
  draw.
- **F4** — database growth by frequency, in the order HanJian's books
  need (Three Character Classic / Tao characters first).
