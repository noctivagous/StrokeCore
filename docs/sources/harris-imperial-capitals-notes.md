# Source notes — Harris, *The Art of Calligraphy*: Imperial Capitals (pp. 113–119)

The owner's supplied PDF (2026-11-10): the "Imperial Capitals:
Construction" spread, 7 pages covering **A–Z**. This is the capitals
source for Phase 3's second ductus set — and it settles what "Roman
capitals made from calligraphy" means concretely: these are the Trajan
capitals **as a flat-brush construction**, in the tradition of Edward
Catich (*The Origin of the Serif*, cited on p. 114). Each letter is
shown twice: the finished capital in red, and a colour-coded,
numbered stroke decomposition with the brush manipulations spelled
out in captions.

## The system the pages teach

- **The tool is a flat brush, and the twist is the technique.** The
  captions quantify it constantly: "Twist the brush from 30° to 90°
  to draw the top serif"; "Turn the brush over and twist from 150° to
  90°" (E's foot, C's bottom serif, Z's bottom stroke); "Turn the
  brush to the horizontal before edging off" (K); "Flatten the brush
  to the horizontal" (R's tail); the Z's diagonal is thick *because*
  "the brush is held near to the horizontal to create a thick
  diagonal". → These are `twistDeg` keyframes with values, written as
  prose — Phase 2's twist channel is this, exactly. ("Turn over" is a
  hand instruction worth keeping in the `move` text: with a symmetric
  flat tip the footprint is the same, but the hand's action differs.)
- **Apex first.** A, M and N all begin by drawing the apex/pointed
  serif *first* — "it is essential to draw the apex first" (A); "The
  apex must be drawn first to create the angle for the downstroke"
  (M). Stroke order serves construction, not reading order.
- **Gaps are left, then filled.** A and N leave a small gap between
  strokes at the apex: on stone the chisel eradicated it; "for the
  brush-drawn letter, the gap can be left as it is or it can be filled
  in with the brush". → A `fill`-role stroke, optional, in the ductus.
- **The fillet is brush-only.** B's stem-to-bowl fillet "only occurs
  on the brush-drawn letter", always at the *bottom* of the stem,
  never the top (D likewise). A feature no outline font knows it has.
- **Key letter: E.** Catich "regards the E as the key letter in
  determining the form of the Imperial letter" — its top arm and serif
  are "the most satisfyingly natural stroke the brush makes". (The
  minuscules have o; the capitals have E. Key letters are how these
  alphabets organise themselves.)
- **Components everywhere** (all Harris's own cross-references):
  F = E without the foot · L = E's stem and foot · G = C + the upper
  half of I's stem · H = two I's joined by a crossbar drawn at 30° ·
  I "is the basis for all the serifed, stemmed letters in the hand" ·
  Q = O + tail ("the same ductus is used for the bowl of the Q as for
  the key letter O") · R's bowl = P's bowl · K's arm "is similar to
  the right fork of the V" · T's arms are the same length as E's and
  F's, its right arm "exactly the same as the top arm of the E" ·
  Z = the top arm of the T + the bottom arm of the E + a diagonal ·
  W = two V's. The capital alphabet is a component graph — §7's
  components, again, are how the material already thinks.
- **Stress axes are noted per letter** (B's right arc axis above the
  horizontal; C's left axis below; O/Q stress below centre left and
  above centre right — "compatible with the natural sweep of the
  wrist").
- **Order can be mnemonic, not spatial:** S's tail serif is drawn as
  the *second* stroke, out of place, "while the hand 'remembers'
  where the first stroke finished" — and S's tail is "the only arm
  serif that is constructed tip first".

## Per-letter stroke counts (from the diagrams)

A 5 · B 5 (strokes 2+3 may combine into one sweep; bottom bowl
alternatively a single sweep) · C 3 · D 3 · E 4 · F 3 · G 4 ·
H two stems + crossbar · I the basis stem · J = I with an extended,
edged-off tail · K 6 · M 6 (1st/2nd strokes thickest, 3rd/4th
thinnest) · N 5 · O 2 · P 3 (bowl finishes just below the centre
line; the lower bowl's curved stroke does not join the stem) ·
Q 3 · R 5 · S 3 · T 3 (cross-stroke first: twist back to 30°, finish
at 90°) · U 4 · V 4 · W 8 (two V's, crossed or joined at a single
apex) · X 5 (top v-shape slightly smaller than the bottom; *no serif
on the right inner leg*) · Y 4 · Z 3.

## Classification (for the spec)

Form: Trajan. Construction: brush, stroke by stroke. Under Catich's
thesis the originals were themselves brush-written before cutting,
so this ductus is **native** — the strongest form of the owner's
"Roman capitals made from calligraphy". It is a *different tool and
scale* from the Foundational minuscules (flat brush, cap-height
letters), so in the Phase 3 font it stands as its own ductus set —
the owner's "second ductus" — not as the minuscules' uppercase.
Johnston-manner pen capitals remain possible later if wanted.
