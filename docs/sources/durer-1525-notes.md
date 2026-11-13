# Source notes — Albrecht Dürer, *Of the Just Shaping of Letters* (1525)

Book III of the *Underweysung der Messung*; read in R. T. Nichol's
translation from the Latin edition of 1535 (Project Gutenberg #37103,
public domain). The last section, "Directions for the Construction of
the Text or Quadrate Letters," specifies a complete Textura alphabet
as geometry — the second of the owner's two fully-specified systems
(after drafting-room Monoline Gothic).

## The module

Everything is built from ONE square. Its side s = the stem width.

- **The I standard.** The prose says: three equal squares stacked;
  the top and bottom edges divided into thirds; an equal square set
  obliquely (diagonal vertical) with a corner on the first third-point
  of the top edge (s/3 from the left), extending more left than right;
  the stem's sides produced up to meet the diamond's sides; the same
  below, mirrored (corner on the second point, 2s/3). Above the I
  only, a tiny in-crescent drawn with a fine pen.
- **The plates correct the prose.** Dürer's own skeleton plate
  (Gutenberg image i045, measured 2026-11-10) draws the I with FIVE
  squares stacked, stem width = one square's side; the diamond's
  CENTRE sits on the stack's top/bottom edge (its left and right
  vertices lie on the edge line, its lower vertex ~2/3 into the end
  square), protruding s/√2 ≈ 0.707s beyond the stack at each end.
  Total short-letter height = 5s + √2 s ≈ 6.41s. The letter-internal
  counts in the prose itself agree with five, not three (H's far limb
  substitutes "a fourth square in line" and "the fifth and lowest";
  Y sets a square "under the other three superposed" and splits "the
  fifth"; B stacks 3 + 3 + a seventh cut). The independent Adams
  trace (below) measures the same ≈ 6.25 : 1. **Build to the plate:
  stack of 5, diamonds centred on the edges at s/3 (top) and 2s/3
  (bottom).**
- **The I as strokes (exact).** Ink = stem rectangle [0,s]×[0,5s]
  ∪ diamond(top) ∪ diamond(bottom), and the union needs no trimming:
  both stem top corners lie inside the top diamond (|Δx| = s/3 and
  2s/3 from its centre, both < s/√2), likewise at the bottom. So the
  standard is three strokes: a vertical pull with a broad nib of
  width s, plus two `dab` stamps of a square tip of side s rotated
  45°. Dürer's derivation of the alphabet from I is then literally
  our component system.
- **n, m.** Two / three standards. Plate: counter ≈ 2/3 s (prose:
  "narrower than the breadth of either"). No crescents.
- **Tall letters** (l, b, h family): seven squares set on end; l's
  seventh cut by a diagonal so the apex remains to the right; b =
  the sentence-initial V construction with three more squares on the
  first upright, the seventh cut diagonally; q = b inverted.
- **The rest, per the prose** (all derivations from the standard):
  r = I + a diagonal square at top right, angle to angle (or two
  diagonal squares meeting over the stem's midpoint); v in three
  ways (as n with the far limb's top diamond replaced by an oblique
  cut making two angles; sentence-initial v with a second limb cut
  below by an oblique line; w = v with an I standard prefixed);
  x = I + top-right diamond + a transverse diagonal limb with an
  acute tail at bottom left; c = I minus top diamond, hither angle
  cut by a diagonal, broad transverse at top projecting one stem
  width right, cut so it projects half as far below; e = c's standard
  + a broad limb descending right from the diagonal of one square,
  one-third longer than broad; t = c with the top diagonal sharpened
  to a point; long s = L shortened + a broad limb at top right of
  diagonal length; f = long s + a transverse limb at short-letter
  height, twice as long as broad; k = L + a diagonal square right,
  an oblique line to the stem, a broad oblique limb cut so the gap
  between the tips ≤ one diagonal; d = b's lower half + the anterior
  limb raised to full height, hither angle cut, a broken limb of
  ~three conjunct squares across the top; o = d mirrored top/bottom;
  p = L inverted in front + I standard behind, bottom amputated
  diagonally with a broad transverse whose point projects s/2 left;
  a = n below + anterior middle angle cut + posterior's fourth square
  inclined left with a half square joined + a circle sweeping left;
  z in three ways from diagonal squares, with a rounded descender
  extension; g = the most composite letter (two standards, extra
  bottom diamond, diagonals, transverse at top); y = n with the far
  bottom diamond replaced by a right square, the fifth split by a
  diagonal, a diagonal line of one side's length produced; short s
  from two oblique squares at mid height, limbs cut so their tips
  face the middle, joined by a descending diagonal.
- **The elegant variant** (what "is used in these days," and what
  most web summaries describe): three and a half squares stacked, a
  diagonal square substituted for the middle right square, limbs
  adjoined and cleft, counter between limbs = the limb width.
  Dürer gives it as plates, not prose — a later variation on the
  same squares convention, not the first build.
- **Versals** (capitals): one-third higher than the short letters,
  shown on the elegant plate only.

## The Adams vectorization

`Du_rerEarlyBlackletter-Ductus.otf` (owner-supplied): "Just Letters"
by Christopher Adams, © 2012–2014, **CC0 1.0** — a hand trace of
Dürer's plates (CFF outlines, UPM 1000, A–Z + a–z; Adams supplies
the w and j Dürer omits). Hand-trace wobble throughout: reference
and diff-exemplar grade, NOT geometry to copy. Its i measures
ink 606 tall × stem ≈ 101 ≈ 6 : 1, corroborating the plate's
5-squares-plus-diamonds reading against the prose's "three."
Because both the 1525 original and this trace are public domain,
its renders may live in the repo (unlike the Harris exemplars).

## The squares convention (format consequence)

This system needs the construction layer to speak in squares:
a declared square lattice (module = stem width = reference nib
width) with two element kinds — right squares stacked/offset on the
lattice, and oblique squares (the module square at 45°, named by the
lattice point its centre sits on and the third-point it is keyed
to). Glyph construction is then a recipe over shared components
(the I standard first), which is how the font will be authored:
builder helpers `standard()`, `diamondAt()`, etc., emitting the
existing composite strokes; the font file declares its ladder in
nib widths as usual (short body 5, tall 7, total minim height
5 + √2 ≈ 6.41 with diamond overshoot above the cap line and below
the baseline — the ladder lines describe the stack, the diamonds
are declared overshoot, exactly as serifs overshoot in other hands).
