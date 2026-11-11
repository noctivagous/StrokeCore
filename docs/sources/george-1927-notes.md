# Source notes — Ross F. George, *Speedball: Modern Lettering for Pen, Brush & Poster Design*, 10th edition (1927)

Internet Archive: `speedball-modern-lettering-for-pen-brush-poster-design-10th-edition-1927-by-ross-f.-george`
(36 scanned pages; full OCR text layer available. The plates are the
substance — most pages are alphabet plates with captions, so these notes
combine the OCR text with the captions. Quotations are George's words,
lightly cleaned of OCR noise.)

## Why this book matters to StrokeCore

It is the primary source for the George system the spec's tool table and
"translated ductus" principle rest on — written by the man himself, a
decade after the pens launched. Several of George's stated rules map
directly onto spec concepts, and two of them correct or sharpen the spec.

## George's rules, and what they mean for the spec

1. **Letters are assemblies of elementary strokes.**
   "The art of lettering is most easily accomplished by assembly of the
   given principles, or elementary parts of each letter… each and every
   element must be produced with a single stroke of the lettering pen
   or brush." The book opens with plates of *Elementary Strokes* for
   Roman, Gothic and Text letters, and the combinations of curves,
   angles and serifs in each. → This is the font's **move vocabulary**
   (SPEC §7): a finite inventory of named elementary strokes per hand,
   from which glyphs are composed. Phase 3's font should ship its
   elementary-stroke plate as data.

2. **Match the tool to the elements, never remodel.**
   "There are certain special pens and brushes which are best adapted
   to producing the elementary parts with a single stroke… avoid waste
   of time and effort attempting letter styles with a tool not adapted
   to the production of the strokes without re-modeling." And: "study
   first the primary construction of their elements. Then determine
   just what style of pen will best produce these elementary strokes
   with the least amount of effort."
   → Tool selection is part of a glyph's design data, not a rendering
   choice made later.

3. **Thin in one stroke; thick by doubling.**
   "It should make the thinnest elements in a single stroke without
   subsequent retouching, or patching up. The thicker or wider elements
   may then be produced by doubling or tripling the strokes if a
   heavier letter is desired." And elsewhere: choose the pen so "the
   thin elements [are made] in a single stroke", with "all
   perpendiculars thick" in the Roman construction.
   → The spec's `buildUp` stroke role is George's doubling/tripling.
   A heavier weight of the same alphabet is the same ductus with
   build-up passes — a weight axis for free (§6 fuse makes the passes
   one ink shape).

4. **Tools have direction behaviour.**
   "Styles A, B or D will function successfully when moved in any
   direction, up, down or sideways, while Style C, which is a more
   flexible pen, designed particularly for Roman, Text and Manuscript
   lettering, functions best when handled in the normal lettering
   manner."
   → A Tool property the spec was missing: whether the tool is
   direction-agnostic (monoline-ish tips) or manner-bound (broad-edge:
   pulled strokes, declared angle). Added to SPEC §3.2.

5. **No replicas of type — adaptation, not copying.**
   "The modern letterer does not attempt to produce replicas of type
   faces. Type alphabets are seldom designed to meet the requirements
   of hand lettering… The appearance of an alphabet may be changed,
   but never its basic principle." And on ruled lettering: "Never use
   a T-square, ruler or compass in drawing the elements of any letter…
   A letter that is ruled is simply a mechanical draft; it may
   resemble a type, but never hand lettering."
   → Sharpens SPEC principle 4: a *translated* ductus is an
   **adaptation** of a type style to hand requirements, not a tracing
   of it. The target is the style's basic principle, re-expressed in
   elementary strokes a hand can actually make.

6. **The plates carry ductus diagrams.**
   Captions repeatedly give the tool per alphabet ("written with a
   Style A No. 5", "Gordon Text Italics — D Speedball", "made with
   size #5 Style B"), and at least one plate notes "dotted lines
   indicate the direction (and order) of strokes" (Heavy Roman,
   Style D). → The plates are a Phase 3 goldmine: alphabet + tool +
   stroke order, in exactly StrokeFont's shape. The Trajan link is
   explicit too: the "20th Century Classic Roman — showing free-hand
   2-stroke construction" was lettered with a small Style B and
   "fashioned from the early Roman letters of the 2nd century found
   on the Trajan columns."

7. **Built-up and double-stroke poster lettering is a system, not a
   trick.** Plates: Double-Stroke Poster Roman; letters built up with
   a #4 Style B; an outlining method — sketch in pencil, then ink
   "with a broad stroke pen the exact width of the narrowest element".
   → Built-up glyphs (SPEC §7 components/buildUp) have a worked
   historical method to follow, including the rule that the tool width
   equals the narrowest element.

## Practical extraction plan (when Phase 3 starts)

- Transcribe the alphabet plates into a table: alphabet name, tool
  (series + size), construction note (single / 2-stroke / built-up),
  page. The OCR text layer gives most captions; the letterforms
  themselves need the page images (JP2/PDF on the Archive item).
- The elementary-stroke plates (Roman / Gothic / Text) become the
  first move vocabularies in the spec's sense.
