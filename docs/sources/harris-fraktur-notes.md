# Source notes — Harris, *The Art of Calligraphy*: Fraktur (pp. 76–77)

The owner's supplied PDF (2026-11-10): the Fraktur spread — minuscules
a–z with ductus decompositions (same blue-model / pink-breakdown
presentation as the Foundational pages), plus long s (ſ), full and
half r, and printed alternatives for a, o and h. **No capitals on
these pages** — Fraktur caps need another source if wanted.

## The hand's parameters

- **Pen angle ≈ 40°**, "altered only for drawing the pointed
  descenders"; the nib is **square-cut** for Fraktur letters.
- **Ladder: minim height about 5 pen widths, with a further 2 for
  ascenders and descenders** (5 / 2 / 2 — taller and tighter than
  Foundational's 4 / 3 / 3, matching the upright, compressed texture).
- Closer in appearance to Gothic Textura than to Bastard Secretary or
  Bâtarde; the rounder Schwabacher is the contrast case.

## What the construction teaches StrokeCore

- **Spikes are emergent.** "The distinctive Fraktur spikes are made
  by extending one stroke over the previous one. The more pen lifts
  there are in a letter, the more spikes are created." Hairline spikes
  (on b, g, h, q — a Fraktur signature, absent from Schwabacher) come
  from stroke *extension past a join*, not from drawing a spike. →
  In our bake they fall out of spines that overshoot and fuse; the
  ductus just has to dare to extend its strokes.
- **Twist to near-vertical for descenders.** f: "Twist the pen from
  40° to near vertical for the descender of the f" (and its first two
  strokes are drawn *without lifting the pen*); p: twist 40° → near
  vertical; q: "*gradually* twist the pen from 40° to near vertical
  for the descender" — a twist ramp along one stroke, i.e.
  `twistDeg` keyframes at both ends, which our interpolation already
  does. (Same pattern as the Imperial capitals' quantified twists,
  in a pen hand this time.)
- **The diamond foot is a stroke.** "The final foot of the m can
  terminate with a diamond stroke" (n likewise) — the lozenge
  terminal is a discrete, reusable finishing stroke: a component,
  shared by the minim letters.
- **Corner-of-the-nib hairlines.** x and y: "Use the corner of the
  nib to draw the hairline tail." A distinct technique — partial
  contact, not a thinner tool. Authoring convention for us: a
  hairline-role stroke at reduced widthFactor on the same nib.
- **Rounded strokes inside an upright hand.** Ascenders may be one
  rounded stroke or a split serif — but "it is important to be as
  consistent as possible throughout the text": the variant choice is
  a *font-level* decision, not per-letter whim. (Alternates exist —
  a, o, h, full/half r, z's third stroke splittable, s's stroke order
  alterable with the top stroke second — but a font picks its forms.)
- **Shared ornament strokes.** The alternative h's "elephant's
  trunk" "can be used on letters b, h, k, and l"; "this curling
  hairline tail can be used on letters h, m, and n"; w "is
  constructed from a conjoined u and v". Components again — this
  material keeps organising itself that way on every page.
- **d's ascender** "curl back to the right to avoid the letter
  tilting to the left" — a balance correction built into a stroke.
- **g** is the feature letter: crossbar (shared with Schwabacher),
  strokes 2+3 in one continuous movement, tail ending in a hairline,
  a blob, a backward sweep, or (bottom line only) a loop; descenders
  generally restrained except on the last line of a text.

## Verdict for Phase 3

Feasible with the engine as built: 40° broad-edge, straight segments
and fractured curves (our cheapest spines), twist ramps (Phase 2),
spikes by extension + fuse (free), diamond foot and hairline tails as
components/conventions. The work is transcription density — many
small strokes per letter — not new machinery. Capitals are the only
gap: these pages don't carry them.
