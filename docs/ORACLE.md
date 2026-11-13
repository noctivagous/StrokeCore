# The MetaPost oracle

*Why this exists.* On 2026-11-10 the owner proposed reversing the
foundation: build StrokeCore on METAFONT/MetaPost and delete our
engine. The decision taken instead (owner-approved): keep our engine,
and use MetaPost as an **oracle** — an independent, exact envelope
solver against which our stamp-and-union bake is measured — and,
later, as an export back end. This file is the oracle's verdict.
Re-runnable: `node scripts/oracle.mjs` (needs `mpost` on PATH;
results land in the untracked `demo/oracle/`).

## Method

For each sampled stroke, the stroke record is translated to a
MetaPost program that sweeps the **same tip** along the **same
spine**; MetaPost computes the envelope; its SVG output is parsed
back into polygons and compared with our bake's outline for that
stroke (IoU, area delta, bbox delta), then unioned per glyph.

Translation routes, classified per stroke:

| Route | Stroke kind | MetaPost form |
|---|---|---|
| A | constant tip state | `draw spine withpen makepen(tip polygon)` |
| B | angle / widthFactor varies, tip shape constant | `penpos` per node + `penstroke`, plus full tip fills at both ends (see cap note) |
| F | dab (spine < 3 units) | swept like A — our dab is a 2-unit sweep, not a pure stamp |
| X | tip *shape* varies (pressure/spread), or tangent-relative angle | untranslatable in MetaPost's pen model — counted, never faked |

**Probed MetaPost semantics** (probe programs, 2026-11-10; MetaPost
2.02, TeX Live 2023):

- `draw … withpen` a polygonal pen gives the **full-footprint
  sweep**, endpoint pens included: a 100×18 rect at 30° over a
  500-long vertical measured exactly 95.603 × 565.589 — our bake of
  the same stroke: 95.603 × 565.588.
- `penstroke`'s end caps are the **diameter segments** through the
  end nodes, not full tip stamps (measured shortfall = half-thickness
  projection, exactly). Route B therefore adds the end stamps our
  model prescribes; the remaining divergence is interior.
- Non-polygonal pens (`pencircle`) are emitted by MetaPost's SVG
  backend as *stroked* paths, not outlines — so ellipse tips are
  emitted as 128-gon `makepen`s (finer than our bake's 28-gon: the
  difference then measures our discretization).
- SVG coordinate recovery: emitted x is `x − min(0, llcorner.x)`; y
  is flipped from `urcorner.y`. (Empirical; a first version of this
  script assumed full normalization and produced phantom x-shifts
  on translated components — the areas were right, the bboxes
  exposed it.)

## Results — sample of 2026-11-10 (28 glyphs, 111 strokes)

Routes: A 77, B 13, F 21, **X 0** — nothing in the five fonts is
inexpressible; the pressure/spread shape-channels simply do not
occur in the current corpus (the brushes vary by twist only).

Glyph IoU / area delta (MetaPost − ours):

| Font | Glyphs |
|---|---|
| Monoline Gothic | A .9954/+0.5% · E .9933 · H .9934 · O .9978 · S .9966 · 8 .9971 |
| Dürer Textura | i .9998 · **n 1.0000/0.0%** · **m 1.0000/0.0%** · l .9853 · z .9997 · g .9998 |
| Foundational | a .9994 · c .9990 · e .9993 · o .9995 · g .9992 · & .9990 |
| Imperial Capitals | E .9187 · H .9791 · O .9980 · R .9129 — deficits trace entirely to route-B strokes (below); every route-A stroke scored 1.0000 |
| Fraktur | a .9990 · e .9990 · f .8452 · m .9996 · ſ .9983 — f's deficit is its single route-B stroke |

**Route A verdict: the bake is exact.** Every constant-state stroke
in every font agrees with Knuth's analytic envelope to IoU ≥ 0.997
and |area Δ| ≤ 0.7% (the Gothic residual is the known 28-gon circle
discretization + spline sampling). The sampling/union machinery is
not a liability; the "0.5% apex shortfall" class of error is real
but bounded at ~0.3%.

**Route B verdict: a definition difference, not an error.**
`penstroke` builds its outline from the pen's diameter endpoints at
the declared nodes. Our bake sweeps the full tip footprint at every
instant — the same semantics as MetaPost's own `draw withpen`.
Where state changes slowly (Dürer's cut top, 45° of twist over a
long stem) the two agree to ~1.5%. Where it changes fast — Imperial's
twist serifs (30° over ~100 units) and Fraktur f's tapering tail —
`penstroke` under-covers by 4.5–25% of the stroke's area at
identical bounding boxes: it misses the bulges the rotating corners
sweep between nodes.

**Control experiment.** Imperial E's `_capStem-2` (penstroke IoU
0.7319) re-emitted as 24 constant-angle `draw withpen` segments:
**IoU 0.9828** against our bake. Our varying-state semantics are
MetaPost's draw semantics, sampled; penstroke is the divergent
definition.

## What this settles

1. **The foundation stays ours.** The bake implements the
   full-footprint sweep — what a real implement deposits — and is
   verified exact against the strongest available reference.
2. **Re-founding on penstroke would have changed the format's
   meaning**: every twist/taper stroke would silently lose ink.
   That — not performance — is the decisive argument against the
   reversal for the letterform layer.
3. **MetaPost's durable roles**: this oracle (re-run after any bake
   change; a route-A regression below ~0.99 is a real bug), and an
   export back end. For export, varying-state strokes should be
   emitted as segmented `draw withpen`, not `penstroke`, unless a
   font's author accepts penstroke semantics explicitly.
