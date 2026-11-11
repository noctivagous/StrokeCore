# Source notes — David Harris, *The Art of Calligraphy*, Foundational Hand (pp. 43–45)

Identified from the PDF the owner supplied (2026-11-10,
`foundational-hand.pdf`, 3 pages = book pp. 43–45, in the "Caroline &
Early Gothic Scripts" section). Page 44 (the first page the owner
shared) gives prose + ductus decompositions for **a–j**; page 45
completes **k–z**, the ampersand, and an alternative g; page 43 is the
Johnston history page. Each letter appears twice: the finished letter
in blue, and beside it the **stroke breakdown in pink** — numbered
strokes with direction arrows, the ductus printed as a decomposition
diagram.

## What the page states

- **Ductus is the letterform's identity:** "Almost important in
  calligraphy as the letterforms is the manner in which the words are
  laid out on the page and the textural effect that they achieve. With
  its regularity of ductus…" — the hand is taught as *how the strokes
  go*, not what the silhouettes look like.
- **Pen angle** about 30°, "increasing to about 45° for diagonal
  strokes" — corroborates the Formo exemplar's annotated modifications
  from an independent printed source.
- **Ladder:** "Minim height is four or five nib widths, with a further
  three for ascenders and descenders." (The 4-or-5 variance again;
  Formo's 4 remains our reference, §10.)
- **The key letter is o.** "As this composite character of a, d, e, g
  and q shows, the o is the key letter of the hand" — those letters are
  built around o's construction (shown with two pencils taped
  together, drawing o's two curved strokes). And **internal spaces**:
  "the elegant oval within the letter e provides the model to which
  all other spaces in the hand should ideally conform."
- **Inter-letter spacing** is given its own section — spacing as a
  studied property of the hand, not an afterthought.
- Photo detail: a hand writing with the nib at a marked 30°, beside a
  ruled sheet with a pink nib-stack at its left edge — the same
  guideline + stack presentation as our §10 display requirement.

## The ductus diagrams — and a components precedent

Letters shown: **a b c d e f g h i j**. Each breakdown numbers its
strokes (typically 2–4) with arrows. Two things matter for StrokeCore:

1. **Cross-referenced strokes.** The b diagram is captioned "To draw
   the serif and stem of the b, see letter l"; the same note recurs
   for **d** and **h**, and i/j point to l for their serifs. Printed
   teaching treats the serif+stem as *one shared piece of ductus*
   reused across glyphs — a direct precedent for SPEC §7's glyph
   components: the Foundational font should define its serif-stem once
   (as l teaches it) and reference it from b, d, h.
2. **Named moves in prose.** c's first stroke: "Pull the first stroke
   of the c along the baseline" — strokes carry verbal instructions,
   matching §4's `move` field (the font's move vocabulary is prose a
   hand can follow, not just geometry).

Fine ductus detail per letter (exact stroke splits for a–j) is to be
transcribed from this page and the Formo exemplar together when the
Phase 3 font is built; the two sources agree on angle practice and
ladder, and complement each other (Formo: full a–z with angles
annotated; this page: stroke splits with teaching captions).

## Presentation note

Model letter (solid) **beside** its decomposition (numbered, arrowed)
is the page's whole layout — a good pattern for our ductus view:
finished form and stroke anatomy side by side, never one without the
other.

## Page 45 — the rest of the alphabet (k–z, &, alternative g)

Stroke counts and the teaching captions that matter:

- The **l cross-reference fans out further**: k's serif+stem, and the
  serifs of m, n, p, r, u all say "see letter l". With p. 44's b, d, h
  (serif+stem) and i, j (serifs), nearly half the alphabet's stems are
  taught as the l piece. Our serifStem component is the alphabet's
  single most reused stroke group.
- **l itself** (the referenced letter, taught in full): ① push the nib
  edge downwards to the left (the sharp-headed serif); ② an inward
  curve to join the main stem; ③ return to the top and pull down to
  draw the stem, finishing by pulling the stroke along the baseline
  (the foot). Pulled, not pushed — p. 43: Johnston advocated
  "sharp-headed" serifs made from *pulled* strokes, against "lumped"
  serifs made by pushed strokes.
- **o is two strokes** (left curve, right curve) — the two-pencil
  construction of p. 44, confirmed in its own diagram.
- **p** has 5 strokes, with the note "the fifth stroke of the p can
  begin to the left of the stem" — a sanctioned construction variant
  inside one letter.
- **s**: "To avoid the s tilting, stretch the first stroke
  horizontally" — a proportion instruction attached to a stroke.
- **t**: "Pull the second stroke of the t along the baseline" (the
  foot), then the crossbar.
- **z**: "Turn the pen nearer to the horizontal to broaden the second
  stroke of the z" — a mid-letter angle change given as a verbal
  instruction; matches Formo's annotated 0° diagonal for z.
- **x** is 4 strokes in this teaching (the two diagonals are not the
  whole story — joining/finishing strokes are numbered separately).
- **Ampersand** gets a full 5-stroke decomposition (& is a letterform
  with a ductus, not a symbol pasted in).
- **Alternative g**: "This alternative g may prove easier for
  beginners to pen than the traditional form" — a named variant glyph
  with its own ductus, printed alongside the main alphabet.
  → SPEC §7 must support **alternate glyphs** (a glyph + named
  alternates, each with its own strokes). Formo's sheet independently
  marks Johnston variations for g, j, x — variants are normal in this
  material, not an edge case.

## Page 43 — Johnston, in his own worksheets

- Reproduces Johnston's 1909 worksheet plates (made with Eric Gill):
  I. Foundational Hand; II. an Italic hand *derived from* the
  Foundational; III. a Roman small-letter hand also derived — hands
  derived from hands, as a family.
- Terminology: letters written with the pen's edge held at ~30° are
  **"slanted-pen"** letters; the Half Uncial manner with the edge
  horizontal is a **"straight" pen**. Our `angleMode`/held angle has
  the historical vocabulary ready-made.
- Johnston was introduced to the Ramsey Psalter by Sydney Cockerell;
  his preference was for "living letters with a formal pen" — the
  1919 study sheet shows his mature Foundational with shorter, more
  ordered ascenders than the early worksheets.
