# A grammar of Western stroke primitives — draft

*Status: draft for the owner's judgment. Motivated by the pixel-diff
work: fixing a letter against its exemplar means saying what is wrong
in words the file can carry — "the arc is under-pointed", "this wants
a flick, not a turn". That requires names. The East has them; the
West, so far, has not written its set down.*

## The Eastern model

Chinese calligraphy teaches its whole stroke system through one
character, 永 ("eternity"), whose eight strokes are the **eight
methods** (永字八法): 點 the dot, 橫 the horizontal, 竖 the vertical,
鉤 the hook, 提 the rising flick, 彎 the bend, 撇 the left-fall, 捺
the right-fall. Three properties make it a *grammar* and not a list:

1. **The primitives are gestures, not parts.** Each name denotes what
   the hand and brush do, and the mark that results — not a piece of
   a finished character.
2. **The set is closed and small.** Every character is a sentence in
   eight words.
3. **One key character carries the whole set** and is practised as
   such.

Our tradition has the raw material — George's *elementary strokes*,
Harris's captions ("pull the stroke to the right before commencing
the arc", "turn the brush to the horizontal before edging off"),
Johnston's stroke analyses, Catich's brush moves — but it was never
consolidated into a named, closed primitive set that a *file format*
could reference. StrokeCore needs exactly that: the `moves` a font
declares (§7) should be words of this grammar, and the composite
scaffold (§4.5) should be its spelling.

We also already have the key-character structure, discovered from the
books rather than imposed: Foundational is taught through **o**,
Imperial through **E**, Fraktur through the **minim** — one anchor
form per hand in which the hand's primitives appear in their purest
state, exactly as 永 anchors its tradition.

## The proposed primitives

Each entry: the gesture, the mark it makes, how the composite
scaffold spells it, and where the sources show it.

### Strokes proper

- **lead** — the approach: a hairline entry that positions the tool
  for the main stroke (the Foundational entry hook; the Fraktur
  spike entry). Spelled: a short spline run or line ending where the
  next primitive begins, usually at reduced width.
- **pull** — the principal downward stroke, drawn toward the body;
  makes stems. The Western 竖. Spelled: a line, or a near-vertical
  spline with a slight entasis bow.
- **push** — the upward stroke, drawn away (Fraktur t "begins with
  an upward stroke"; rising stems and the ſ's rising stroke).
- **drive** — the horizontal stroke: arms, bars, feet, crossbars.
  The Western 橫. Spelled: a line, often carrying a twist (below).
- **arc** — the true circular curve: bowls, the C, the O. Spelled:
  a three-point arc (`arcThrough`) — the only primitive whose
  geometry is a named curve. An arc carries an **axis** (its stress):
  Harris annotates it on nearly every curved letter ("the axis of
  the arc is above the horizontal").
- **bow** — the free curve that is not an arc: shoulders, the s's
  spine, swelled curves. Spelled: a spline run. A long, shallow bow
  that runs along a guide line is a **sweep** (baseline sweeps, the
  Q's tail, the g's descender loop) — a bow qualified by its guide.
- **turn** — a rounded change of direction *within* a stroke (the
  u's bottom, the J's hook bottom). Spelled: a `round` composite
  point with a radius.
- **point** — the hard change of direction: a cusp or apex (the A's
  apex, "drawn first"; the fractured joins of Fraktur). Spelled: a
  `corner` composite point.
- **hook** — a curve that ends by turning back against its own
  direction (the J's tail, the f's head, the y's tail). A bow or arc
  plus a turn, named because the tradition treats it as one move.
- **flick** — the edged exit: the stroke leaves the page by tapering
  to the tool's corner or edge ("edging off"; Fraktur hairline tails
  drawn with the nib's corner; the R's leg finish). Spelled: a line
  or bow whose width factor falls to hairline at the end point.
- **dab** — the dot: i and j diamonds, the punctum. The Western 點.
  Spelled: a very short drive or pull at full pressure.

### Tool events (the Western addition)

The Eastern set assumes the soft brush; the Western hands add the
rigid nib and the flat brush, whose signature events are rotations
and pressure changes *as* strokes:

- **twist** — rotation of the tool during a stroke (Imperial's
  quantified twists: the top serif is *made* by twisting 30°→90°;
  the foot by turning the brush over, 150°→90°). Spelled: a
  `twistDeg` keyframe pair. A twist at a stroke's head or foot makes
  the serif — which is why this grammar has no "serif stroke": a
  serif is a drive or pull *with its terminal twist*, Harris's
  "manipulated stroke".
- **swell** — the pressure event of pointed tools: a pull whose
  width breathes (Phase 2's pointed brush). The pointed hand's stem
  is pull + swell.

### Terminals

Ends are named separately from strokes, because the traditions name
them: **head** (the top finish of a stem — flat, serifed by twist,
or spiked in Fraktur), **foot** (the baseline finish — foot serif,
or Fraktur's **diamond**). A letter's spelling gives its terminals
explicitly where a hand teaches them.

## Qualifiers — the grammar's adverbs

Primitives take the penpos channels as qualifiers, uniformly:
**angle** (held, or from–to when twisting), **axis** (for arcs),
**weight** (George's doubling and tripling — a stroke *built up* by
repetition is the same word said twice, not a new word), **hairline**
(reduced width factor), **manner** (direction constraint of the
tool, §3.2). Nothing here is a new primitive; that restraint is what
keeps the set closed.

## Spelling examples

- Foundational **o** = arc + arc. (The key letter is two words.)
- Foundational **a** = arc(+lead) · pull · drive-as-diagonal ·
  sweep. (Harris's split: the "diagonal" is a drive said at an
  angle — the grammar records the qualifier, not a new word.)
- Imperial **E** = pull · drive(twist 30→90, head) · drive ·
  drive(turn-over twist 150→90, foot). Catich's key letter is the
  pull and the drive with their two twists — four words carry it.
- Fraktur **n** = pull(diamond foot) · turn · pull(diamond foot),
  the minim said twice with a turn between — the fractured arch is
  a point-turn, which is why Fraktur's arch is spelled with `point`
  where Foundational's is spelled with `turn`.

## Primitives are parametric

A primitive is not a fixed shape; it is a named *template with a
parameter signature*. The word says what the hand is doing; the
parameters say how, this time, in this hand. Configuration lives at
three levels:

1. **The hand configures its words.** A font declares its defaults:
   Foundational's arc is broad with a low stress axis, Fraktur's
   turn is fractured to a point, Imperial's drive carries its serif
   twists. Same grammar, different dialect — the configuration *is*
   much of what makes a hand itself.
2. **The glyph configures the instance.** This arc's through-point,
   this turn's radius, this pull's length — set on the composite
   points, where §4.5 already keeps them.
3. **The stroke configures the event.** Angle, twist from–to,
   pressure, width factor — the penpos channels, varying *along* the
   primitive, not just at its ends.

Parameter signatures, per primitive (the configurable slots):

| primitive | parameters |
|---|---|
| lead | length, width (usually hairline), meeting point |
| pull / push | length, bow (entasis), terminal kinds |
| drive | length, twist from–to, terminal kinds |
| arc | through-point (centre/radius follow), axis, sweep (endpoints) |
| bow | point count and placement, bow offset where chorded |
| sweep | guide line, length, rise/fall |
| turn | radius, rounding (arc / spline / bevel) |
| point | angle of the cusp, miter behaviour |
| hook | radius of the return, exit direction |
| flick | taper length, end width (to hairline) |
| dab | size, angle (the diamond's cut) |
| twist | from–to, where along the stroke |
| swell | pressure profile (peak, position) |

This is also what the pixel-diff process actually diagnoses. A diff
against the exemplar separates three kinds of error, and they have
different fixes:

- **Vocabulary error** — wrong primitive (a turn where the hand
  makes a point; a bow where it makes an arc). Fix: respell.
- **Configuration error** — right primitive, wrong parameters (arc
  through-point too far in; turn radius too large; twist range too
  small). Fix: reconfigure.
- **Resolution error** — right primitive, right configuration, not
  enough points to say it (a bow spelled with two spline points
  where the exemplar's curve needs four). Fix: add points.

A diff that shows a smooth miss along a curve's outside is a
configuration error on the through-point; a diff that shows a notch
at a join is a vocabulary or radius error; a diff that wobbles along
an otherwise right curve is resolution. The grammar is what makes
the diff *legible*.

## Three lexicons, paired (decided 2026-11-10)

StrokeCore the engine strokes any object; the grammar is the
*letterform* layer on top of it. The Western tradition turns out to
have named strokes inside individual schools — Copperplate's eight
basic strokes (entrance, underturn, overturn, compound curve, oval,
ascending/descending loop), Spencerian's seven Principles
(straight line, right/left curve, extended loop, direct/reversed
oval, capital stem — originally eight), George's elementary
strokes, the broad-edge pull/push and branching stroke — but never
one cross-hand set, and its dominant vocabulary, letter anatomy,
names what a letter *has*, not what the hand *does*. The completion
(decided by the owner) is to keep all three lexicons and **pair
them in the files**:

- **Parts** — what the letter has: stem, bowl, arm, leg, tail, ear,
  bar, arch, shoulder, eye, loop, neck, spine, serif, head, foot,
  dot, spike. A stroke's `role` names its part.
- **Gestures** — what the hand does: the base primitives above,
  which live in the core (`src/primitives.ts`). A stroke's
  `gesture` names its primitive and its configuration.
- **Functions** — what the stroke is doing for the letter: forms,
  completes, closes, joins, crosses, branches, fills, dots — a verb
  plus the part it acts on. A stroke's `purpose` carries it:
  `{function: "completes", target: "serif"}` is a stroke tagged as
  *completing a serif*.

The pairing, characteristically:

| part | gestures | functions |
|---|---|---|
| stem | pull, drive | forms |
| bowl | arc, bow | forms, closes |
| arm | drive, pull | forms, completes |
| leg | pull, bow | forms |
| tail | bow, flick | forms |
| ear | flick | completes |
| bar | drive | crosses, joins |
| arch | bow, arc | branches, joins |
| shoulder | bow | branches |
| eye | arc, bow | closes |
| loop | bow, arc | forms, closes |
| link | bow | joins |
| spine | bow | forms |
| serif | drive, pull | completes, forms |
| head | drive, pull | completes |
| foot | bow, drive | completes |
| dot | dab | dots |
| spike | pull, point | forms |

Hand-level configuration is a **table** in the font file (§7
`primitives`): one row per base primitive the hand configures, one
value per parameter — the hand's dialect, declared. Named reusable
configurations are **patterns** (§7 `patterns`): Foundational
declares `bowlArc`, `baselineSweep`, `diamondDot`. The loader
validates all of it: unknown primitives, parameters, parts,
functions and targets are rejected. Worked example — Foundational's
g: bowl by arcs, **ear by a flick whose purpose is
completes → bowl**, link by a bow (joins → loop), lower loop by a
sweep; the i's dot is a dab whose purpose is dots → stem.

## Decisions on the open questions (Kavi's solutions, 2026-11-10)

**1. Naming register — adopt, don't coin.** Rule, applied in order:
(1) if the trade already has the word, use it — typography's
anatomy glossary for parts, the lettering schools' teaching words
for gestures; (2) coin only for a recurring thing no trade word
names; (3) never coin over an existing word. The East's terms are
themselves ordinary words (press, lift, sweep) hardened into terms
of art by use, not by invention — plainness *is* the register.
Typography's glossary has already corrected this draft once: the
g's connector is the **link** (Monotype: "Link / Neck"), and its
terminal vocabulary — ball, beak, finial, spur, serif — is now the
`form` parameter of the head/foot terminals rather than new words.

**2. The seams — one criterion settles both.** A word is a *base
primitive* only if it differs in **tool behaviour or authoring
semantics**, not merely in path shape; path-shape variants are
**patterns** (named configurations), which is what patterns are
for. By that test: arc stays (three points determine a circle —
different semantics from a free bow), flick stays (it configures
the tool's exit — taper and end width — not the path), dab stays
(placement, not travel). **Hook demotes**: geometrically it is a
bow ending in a turn; the hand's "return" is real, but it is a
configuration, so hook = pattern (bow + terminal turn, small
radius). **Sweep demotes**: a sweep is a bow *bound to a guide
line* — the binding is a parameter (`guide` on the bow), not a new
motor gesture. Both words remain in the spoken vocabulary as
patterns; nothing is lost, and the base set stays closed at ten
gestures. Foundational's `baselineSweep` is now literally a pattern
of the bow.

**3. Moves are NOT restricted.** `moves` and per-stroke `move` are
the *teaching layer*: Harris's captions ("pull the first stroke of
the c along the baseline") are source data, and restricting them
to grammar words would falsify the sources to satisfy the system.
The grammar binds where binding is checkable — `role`, `gesture`,
`purpose`, all loader-validated — and the prose stays free beside
it, as commentary. Three layers, three jobs: prose teaches,
gesture spells, purpose explains.

**Typography's remaining terms — sites, not strokes.** Apex,
vertex, crotch name *junctions*; counter and aperture name
*spaces*. A stroke cannot be a counter, so they do not enter the
parts lexicon; they are reserved as the naming vocabulary of the
construction layer (§5), where a point can sit at an apex and a
bowl can be measured by its counter. And typography's crossbar /
cross-stroke distinction (joins two stems vs crosses one) needs no
new noun here: it is exactly `bar` + purpose joins vs crosses —
the function lexicon paying for itself.

## Open questions for the owner

1–3. Decided as above (Kavi's solutions, built; owner's ratification
   pending).
4. **Where configuration lives in the format.** DECIDED (owner,
   2026-11-10): the explicit block — a per-font `primitives` table
   in §7 configuring the core's base primitives for the hand, with
   named `patterns` alongside it. Built: `src/primitives.ts`,
   loader validation, Foundational's table + patterns. See "Three
   lexicons, paired" above.
