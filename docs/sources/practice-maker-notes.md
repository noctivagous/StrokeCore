# Source notes — the owner's Calligraphy Practice Maker ("LetterformPortal")

The owner's earlier app: https://noctivagous.github.io/calligraphy-practice-maker/
— a worksheet generator that imports font files (.ttf/.otf/.woff/.woff2,
opentype.js) and lays out practice sheets. Read from the live site's
source (index.html + js/practiceSheetMaker.js + js/settersAndGetters.js,
~4,900 lines of JS). Its composition and parameters are a field test of
what a StrokeFont consumer actually needs.

## What it does

- Loads a font, converts the chosen characters to **paths with kerning**
  (`convertTextToPathsWithKerning`), and composes **practice blocks**:
  ruled rows, each carrying the full guideline set, characters set into
  the row.
- **Arrangements:** Rows Alternating With Blank (model row, then a blank
  row to copy into) · Rows with Extra Space Between Characters · a Row
  for Each Character (repeated) · a Page for Each Character · Row for
  Each Character (exemplar at left, practice space after).
- **Page:** Letter / Legal / A4 / A3, portrait or landscape; output is
  SVG → PDF (jsPDF + svg2pdf).
- **Guides:** horizontal lines for ascender, capital, waistline,
  *midline*, baseline, descender (labels toggleable); optional vertical
  grid lines; **slant guides** with a settable angle and spacing in
  nib widths; an x-height background band with colour/opacity; SVG
  filters and transforms applicable to the glyph paths.

## Its parameter model (the instructive part)

- **Nib width is the master unit** (default 2.4 mm; everything else
  derives from it). X-height is set in nib widths ("nibWidthsTall").
- Ascender / capital / descender are set as **multipliers of x-height**
  (defaults ≈ 0.45 / 0.6 / 0.45), *not* of the nib — the two anchorings
  coexist: ladder in nib widths for the x-height, ratios of x-height
  for the extenders. StrokeFont's §5 ladder (all in nib widths) covers
  both by conversion.
- **The nib guide**: a *two-column checkerboard* stack at the left of
  each block — squares alternate columns so counting is easy, black in
  the x-height zone, grey (#999) in ascender and descender zones. A
  different, arguably better stack than the single alternating column
  of printed exemplars; worth offering as a style in `guides.ts`.
- **Fonts carry sidecar metadata.** Each catalog font's `<option>`
  declares `fontGlyphNibWidth`, `ascenderRatio`, `capHeightRatio`,
  `descenderDepthRatio`, because the font files don't. The app then
  calibrates: `scaleFactor = fontGlyphNibWidth / userNibWidth`, so the
  font's baked-in stroke weight matches the student's real nib. The
  catalog leans on calligraphy-made fonts — including two literally
  named for ductus: `DraftingGothic-Ductus.otf`,
  `DurerEarlyBlackletter-Ductus.otf`.

## What StrokeCore takes from it

1. **Self-declaring fonts (validates SPEC §7).** Everything the
   practice maker bolts on as HTML attributes — design nib width,
   ladder ratios — a StrokeFont declares in the file itself. No sidecar.
2. **No calibration fudge.** An outline font bakes its nib in, so the
   practice maker must rescale it to the student's nib and accept the
   distortion. A StrokeFont bakes at the student's actual nib width
   from the same ductus — the rescale factor becomes 1 by construction.
3. **Practice sheets are a second consumer** (alongside Banner Studio,
   SPEC §8): arrangements (model/blank alternation, per-character rows
   and pages), slant guides, and PDF-ready SVG are layout concerns the
   core must *serve* (glyphs + ladder + ductus on demand) without
   owning.
4. **Ductus display has a practice use the spec should honour:** in a
   StrokeFont practice sheet, the model row can show stroke order —
   the one thing an imported outline font can never give the student.
