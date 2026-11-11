# Source notes — Jean Formo, *Foundational* exemplar (© 2007)

Reference sheet supplied by the owner (2026-11-10): Jean Formo's
Foundational minuscule exemplar, © 2007. Formo is a calligraphy teacher
(Colleagues of Calligraphy, where her exemplar is used for Foundational
practice projects). **Reference only** — the sheet is her work; our
StrokeFont will be our own construction informed by the proportions and
ductus conventions it documents, not a tracing or redistribution of it.

## What the sheet states

- **Hand:** Foundational — Edward Johnston's round hand, from the
  10th-century Ramsey Psalter (Harley MS 2904), taught in *Writing &
  Illuminating, & Lettering* (1906).
- **Pen angle:** 30°, drawn as a clock diagram ("30 degree pen angle —
  2 o'clock").
- **Pen:** 2.5 mm (the guild's practice note adds that the proportions
  are nib-relative — they use a 2 mm nib against the same exemplar).
- **Nib ladder (printed on the sheet):** body height (x-height) =
  **4 nib widths**; ascender / descender = **3 nib widths** each.
  Johnston himself most often used 4; students began at 4 and later
  worked at 4.5 — both weights are common today. Capitals are commonly
  taught at 6 nib widths (between waist line and ascender line).
- **Ductus on the page:** every glyph carries numbered strokes and
  direction arrows — the exemplar *is* a ductus sheet in StrokeCore's
  sense: stroke order and direction are part of the letterform data.
- **Per-stroke angle modifications are annotated where they occur** —
  the sheet's own note: "At times there are some pen angle
  modifications, especially on diagonal strokes. Note those changes on
  this exemplar." Concretely:
  - `v`, `w`, `y`: first diagonal at **45°**, second at **30°**
  - `x`: 45° and "30° or less" across its two forms (one marked as an
    Edward Johnston variation, as is one `g` and one `j`)
  - `z`: strokes at **30° / 0° / 30°** — the diagonal written with the
    nib effectively flat
  → This is direct historical warrant for the spec's per-stroke /
  per-point `angleDeg` overrides (§4): the hand's held angle is the
  default, and individual strokes depart from it, by declared amounts.
- A small stepped-squares diagram beside a written sample is the
  **nib stack** — the ladder drawn as stacked nib-width squares, the
  visual proportion statement our examples will reproduce (§10,
  Foundational milestone display requirements).

## The guideline set (for all Foundational examples)

From baseline, in nib widths (Formo ladder):

| Line | Height (nib widths) |
|---|---|
| Ascender line | +7 (waist 4 + ascender space 3) |
| Capital line | +6 |
| Waist line (top of x-height) | +4 |
| Base line | 0 |
| Descender line | −3 |

In font data this is `ladder: { xHeight: 4, ascender: 3, descender: 3,
capHeight: 6 }` (ascender/descender counted from waist/base lines, per
SPEC §5), reference tool a 2.5 mm broad-edge nib, slant 0 (upright).
