# Prior art: HanGlyph / CCSS (comparison note)

Studied 2026-11-12 at the owner's direction, for accuracy,
features and implementation. Sources (kept outside this repo at
~/workspace/hanglyph-ref/): the HanGlyph Reference Manual v1.0
(2003-09-13, 30 pp.), the one-page primitive-stroke table, the
v1.0 summary sheet, Yiu & Wong, "Chinese character synthesis
using METAPOST" (TUGboat 24-1, 2003), and Wong, Yiu & Ng,
"Typesetting Rare Chinese Characters in LATEX" (TUGboat 24-3,
2003). The hanglyph.com site is gone; the PDFs survive via the
Internet Archive. No CCSS code was ever public, so unlike
Hóng-Zì (docs/HONGZI.md) this is a design study, not a code
study.

HanGlyph in one paragraph: a character is a POSTFIX expression
over 41 primitive strokes, combined by five operators —
top-bottom (=), left-right (|), fully-enclosed (@),
partially-enclosed (^dir), crossing (+) — each optionally
carrying relations: dimension (< > !< !>, or a ratio), alignment
(top/bottom/left/right/centre), touching (~ / !~ with a gap
fraction), and scaling (/ratio). Macros (let) name recurring
stroke clusters; char(code) binds an expression to a codepoint
for the gaiji (unencoded-character) use case. Descriptions are
TOPOLOGICAL ONLY — no coordinates anywhere; the renderer
(CCSS, a translator to a MetaPost macro library) invents the
geometry under the constraints.

## For accuracy: the 41-stroke taxonomy and its equations

This is the most valuable material in the set for Bihua.

The 41 primitives are the standard modern stroke taxonomy
（現代漢字筆形， chosen from linguistic/graphological studies,
楷體-based), each with a Chinese name — and, in the manual's
Section 4, each is defined by a control-point diagram plus
CONSTRAINT EQUATIONS over its points. Examples:

- 橫折鉤 (j): y0 = y1 > y3 > y2 and x0 < x3 < x1 = x2
- 豎折 (b) vs 豎彎 (c): same layout, but the corner is a sharp
  right angle in the first and curved in the second — a
  distinction our single generic zhe does not yet make.
- 撇 (p): x0 > x1 > x2 and y0 > y1 > y2 (monotone curve);
  平撇 (P) and 豎撇 (q) are aspect variants of it.

Two uses for Bihua:

1. **The label set.** F2's auto-classifier and forms.ts should
   be checked against these 41. Our current vocabulary covers
   the 八法 core plus a few compounds; the table below maps all
   41 (code, name) to our status. The gaps are mostly the
   multi-bend 折 series and the hook/dot variants.
2. **Validators.** The constraint equations are machine-
   checkable. A fitted spine in F2 can be VERIFIED against its
   claimed form's equations (within tolerance) — accuracy as a
   test, not an impression. This is the natural companion to
   the 田字格 grid analysis: grid checks whole-character
   balance; HanGlyph equations check per-stroke form.

| Code | Stroke | Bihua status | Code | Stroke | Bihua status |
| --- | --- | --- | --- | --- | --- |
| d | 點 | covered （侧） | p | 撇 | covered （掠） |
| D | 左點 | gap (dot variant) | P | 平撇 | gap (aspect variant) |
| f | 長點 | gap (dot variant) | q | 豎撇 | gap (aspect variant) |
| g | 撇折點 | gap | r | 撇折 | partial (via zhe) |
| h | 橫 | covered （勒） | n | 捺 | covered （磔） |
| i | 橫折 | partial (via zhe) | v | 平捺 | gap (aspect variant) |
| j | 橫折鉤 | covered (compound) | t | 提 | covered （策） |
| k | 橫折撇 | covered (hengpie) | U | 點提 | gap |
| l | 橫折彎 | gap | N | 橫折折 | gap |
| m | 橫折彎鉤 | gap | L | 橫折折折 | gap |
| a | 橫鉤 | partial (gou generic) | J | 橫折折鉤 | gap |
| s | 豎 | covered （努） | E | 橫折提 | gap |
| b | 豎折 | partial (via zhe) | K | 橫撇彎鉤 | gap |
| c | 豎彎 | gap (curved corner) | B | 豎折折 | gap |
| w | 豎彎鉤 | gap | C | 豎折折鉤 | gap |
| e | 豎提 | partial | Q | 豎折撇 | gap |
| S | 豎鉤 | covered （趯） | M | 橫斜鉤 | partial (gou generic) |
| X | 彎鉤 | partial (gou generic) | R | 橫折折撇 | gap |
| Y | 斜鉤 | partial (gou generic) | Z | 撇點 | gap |
| W | 臥鉤 | partial (gou generic) | F | 橫折斜 | gap |
| o | 橫豎彎鉤 | gap | | | |

"Partial (via zhe / gou generic)" means a fitted spine can carry
the geometry today, but the form is not distinguished in the
vocabulary — the classifier cannot say it, so the learner
cannot be told it.

## For features: relations, and the crossing operator

- **Touching (~ / !~).** Whether the strokes at a component
  interface touch or keep a gap (with the gap as a fraction of
  the box) is explicit in HanGlyph and ABSENT from Bihua's
  placements. It is both a rendering fact (our 林 overlay
  showed interfaces merging that should stay apart) and a
  teachable one （接 vs 離）. Candidate for F4: optional
  relation metadata on placements.
- **Dimension and alignment relations** (<, >, bottom-aligned,
  ...) are how HanGlyph distinguishes 土 from 士 (identical
  strokes; only the relative 横 lengths differ: `h h=< s+_` vs
  `h h=> s+_`). In Bihua this information lives implicitly in
  fitted coordinates; recording the SALIENT relation alongside
  a record would give the learner the distinguishing fact, not
  just the picture.
- **The crossing operator's intercept spec** positions an
  operand by shifting it until it makes n crossings with the
  other, then a fraction r into the next crossing band
  (`o1 o2 +#*.E 2 0.6`). Interleaving components （母-type,
  crossing clusters) are placed by relationship, not by
  coordinates — a placement primitive our model lacks.
- **Macro naming**: components are named pinyin + stroke
  count + variant letter (mu_4_a, mu_4_b, shui_a_3, shui_b_3),
  ~300 of them, and the manual is explicit that a "stroke
  cluster" need not be a radical. This matches Bihua's 部件
  stance (any recurring construction may be stored) and offers
  a naming discipline for the component library.

## For implementation: three macros per stroke, style at the outline layer

CCSS implements each primitive stroke as THREE MetaPost
macros — control-point, skeleton, outline — and each operator
as macros that transform control points into the character
box, then draw skeletons, then outlines. Style variation
(Yiu) happens ONLY at the outline layer, at two levels: vary
the outline macros' parameters (thickness etc.), or replace
the outline macros (a different family; skeleton untouched).
This is, independently, the architecture Bihua already has
(record / spine / bake; styles.ts restyles one record), and it
suggests the same organisation for bihua.mp as it grows:
a skeleton macro per 笔形 (which our b_* path macros already
are) with the pen/outline treatment kept separate.

## What not to take

Topology-only descriptions AS the record format. By design
they cannot determine a character's proportions — the
renderer is licensed to produce any "aesthetically balanced"
result satisfying the relations. A learner's reader needs
determinate, recognisable geometry with provenance (fitted
from real medians, verified by overlay), which is the
opposite trade. We take the taxonomy, the constraint
equations, and the relations as metadata; the records stay
geometric. (Also not taken: the gaiji/LaTeX fontmaker
pipeline, and postfix syntax — Bihua records are data, not a
language to write by hand.)

## Deltas recorded

1. forms.ts / F2 classifier: adopt the 41-stroke table above
   as the target label set; close the named gaps （豎彎 vs 豎折
   first — curvature of the corner is a real formal split).
2. F2 fitting: implement per-form constraint checks from the
   manual's equations as validators over fitted spines
   (tolerance-based, reported per stroke like the IoU table).
3. F4 placements: consider HanGlyph relation metadata
   (dimension / alignment / touching) on placements, and a
   crossing-style placement for interleaving components.
4. Component library naming: pinyin + stroke-count + variant
   letter, after HanGlyph's macro convention.
5. bihua.mp: keep skeleton (path) macros per form separate
   from pen treatment, after CCSS's three-macro organisation.

## Note on the Qin project

The owner also flagged SourceForge's "qin" project
(qinGenerator). It is a 古琴 (guqin) music-notation generator —
not a character system. Its notation, 減字譜， is itself built
by composing fragments of characters into performance
symbols, so it is a cousin of the composition idea, but it
offers nothing for stroke accuracy or Bihua's implementation,
and SourceForge's download wall kept the tarball itself out of
reach in this session. Recorded here so the lead is not lost;
no follow-up proposed.
