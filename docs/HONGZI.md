# Prior art: Hóng-Zì, a Chinese METAFONT (comparison note)

Studied 2026-11-12 at the owner's direction ("mine Hóng-Zì's sources
into Bihua as the comparison note"). Sources: Hóng-Zì 0.51
(2006-03-28, the final release), downloaded from the project's own
site, hongzi.sourceforge.net (live), plus the TUGboat 26-2 (2005)
paper. Hóng-Zì is GPL v2: it is a REFERENCE, studied and cited —
no code is copied into StrokeCore. The downloaded sources are kept
outside this repo at ~/workspace/hongzi-ref/ (strokes.mf 493 lines,
radicals.mf 716, distributions.mf 165, hongzi.mf 692).

## The shape of the thing

Hóng-Zì is structured exactly as Bihua is, twenty years earlier:

| Hóng-Zì | Bihua |
| --- | --- |
| strokes.mf — "the true atoms" | src/bihua/forms.ts （笔形） + mp/bihua.mp |
| radicals.mf — ~70 components | src/bihua/components.ts （部件） |
| distributions.mf — layout operators | placements (currently raw coordinates) |
| hongzi.mf — ~130 characters as compositions | src/bihua/characters/ |

Every level takes the same parameters: (cx, cy, lx, ly) — an origin
plus the size of the box allotted to it. A character is a pure
composition expression, and expressions nest:

    %% bin1, ornamental
    Hl(H(tree)(tree))(beard)

— 彬 is a left-heavy horizontal split whose left half is itself a
horizontal split of two trees: 林 built inline, never stored.
Characters are data-shaped expressions, not programs with state.

## What the strokes level teaches

strokes.mf holds 28 definitions (~23 distinct functions). Set
against our 笔形 vocabulary:

- Direct matches: bar_v/bar_h （竖/横）, down_left （撇， plus j_stroke,
  a straighter variant), down_right （捺）, hook_v （竖钩）, hook_h,
  hook_ob （斜钩， as in 我）, raising （提）, corner_tr （横折）.
- Dots are DIRECTIONAL: point, point_sw, point_ne are separate
  functions with different peak directions and pen profiles. Our
  single dian form lets the spine direction carry this; Hóng-Zì
  says the three directions differ enough to name. Noted, not
  adopted — our pressure signature is per-form richer, and the
  fitted spines already encode direction.
- The rest of their file is COMPOUND GESTURES we deliberately do
  not make atoms of: corner_hook （月's left side), vert_raise,
  angle （红）, ell （也）, chair （几）, three / three_hook (the
  bending stroke of 这/辶-type forms), spoon_stroke （气）,
  nu_stroke （女's crossing stroke), shuo_stroke （言）, ye_stroke.
  For a font these are fine as single defs; for a learner's
  database they must stay decomposed into 笔顺 strokes. But the
  list is a field-tested catalogue of which multi-stroke gestures
  recur — prime mining targets when F4 grows components.
- Their pen is a fixed slanted nib (penpos at 45°, widths in a
  thickness unit g): a print 楷体 model. There is no pressure
  channel and no 笔顺 — output only. Our brush/style layer has no
  counterpart there, and theirs is the poorer for it.

## The finding: context-sensitivity lives inside the component

Our 林 measurement (F1) showed a placed component is not merely
resized: its internals re-proportion, and its 捺 becomes a 点 when
squeezed. Hóng-Zì's tree （木） — the same component — encodes
exactly this, as conditionals on its allotted box:

    def tree(expr cx, cy, lx, ly) =
      bar_v(cx+lx/2, cy, ly);
      bar_h(cx, cy-ly/3, lx);
      if (ly>6f): down_left(..., ly/3) else: down_left(..., .6ly) fi;
      if (lx>4f): down_right(...) else: point(...) fi;
    enddef;

When the tree is allotted a narrow box (lx ≤ 4f of a 10f frame),
its 捺 IS a point — our na-becomes-dian rule, discovered
independently in 2006, but placed at a different locus: INSIDE the
component, keyed on allotted size, where ours is a variant rule
applied at placement. Likewise down_right switches its whole
construction on aspect ratio (lx ≥ ly and lx > 3f draws the long
flat 捺； otherwise a steep short one).

Consequence for Bihua's F4 per-instance adjustment layer: both
loci are needed. Placement-level variant rules express what the
NEIGHBOURHOOD imposes; size-conditional internals express what
the component does to itself at a given allotment. F4 should give
components a conditional form: geometry that branches on the
allotted frame, with 木's two thresholds as the worked example.
(The thresholds are in frame units; ours will be ratios of the
component's natural size, so they survive scaling.)

## Distributions: adopt the algebra

distributions.mf is a complete two-part layout algebra over the
frame, with named ratio splits:

- H family （左右）: splits at 25/30/35/40/45/50/55/60/65/70%,
  plain or with a 10% gap (H, Hr, Hrr, Hl, Hll, H_, H_r, ...).
- V family （上下）: the same vertically (V, Vu, Vuu, Vd, Vdd,
  V_, V_u, ...), plus Vt for a full-height upper part over a
  baseline stroke that "occupies no space".
- I / Is （包围/内嵌）: outer at full frame, inner centred at
  60% / 40%. L: second part at 70% size in the lower right
  (an L-shaped enclosure).

This is the ideographic-description layout system （⿰ ⿱ ⿴ …)
with the ratios made explicit — and it is strictly better than
our current raw-coordinate placements, which bury the ratio in
fitted numbers. Recommendation: F4 adds a `distribute` helper to
components.ts implementing these operators over placements
(split axis, ratio, gap), so assembled characters are written as
composition expressions like Hóng-Zì's, with hand-fitted
coordinates reserved for the per-instance adjustment layer where
they belong.

## Variants by duplication — the road not taken

radicals.mf handles context forms by writing a second radical:
sun vs sun_F （日 full vs compressed), box vs boxf, grow vs bgrow,
spoon vs big_spoon. It works, and it does not scale — every
context duplicates the definition and the copies can drift. Our
variant-rule mechanism is the generalisation; this note records
that the need it answers was already visible in 2006 and that
Hóng-Zì's ~70 radicals are a checklist of which components a
working system actually needed first (water, ice, roof, woman,
tongue, field, earth, tree, king, jade, eye, heart, sun, moon,
door, horse, fire, rice, hand, metal, ...).

## What not to take

METAFONT itself as the runtime (bitmap GF output for TeX; the
256-glyph subfont problem the Tsukurimashou survey flags); the
10f em frame and f/g units (ours is the 1024 grid); penstroke
with a fixed-angle pen (see the standing oracle rule — varying
strokes are segmented draws); and the absence of 笔顺 and
provenance, which are Bihua's reason to exist.

## Deltas recorded for F4

1. Add distribution operators (H/V/I/L with ratio + gap) as the
   primary assembly mechanism in components.ts.
2. Give components size-conditional internals (branching on the
   allotted frame), 木's thresholds as the worked example;
   keep placement-level variant rules for neighbourhood effects.
3. Mine Hóng-Zì's compound-gesture list (corner_hook, three,
   spoon, ell, chair, angle, nu_stroke, shuo, ye, vert_raise) as
   component candidates when coverage grows.
4. Treat its radical inventory as a priority checklist for the
   component library.
