For fonts you can't just port this directly. You have to solve the stroke model first, then the font model on top of it. Here's what is still underspecified in StrokeCore.txt:

### 1. The nib model
Right now you have two ideas mixed together:

**a) Fixed nibs:** oval / rectangle / square + Speedball convenience `C, B, etc.`
We need to lock down:
- How is shape defined? Width x height? Oval radius? Is rectangle with corner radius?
- Units: is nib size in em, in points, or in nib-widths? For a ductus it has to be nib-width relative.
- What is the canonical zero-angle? For broad-edge, 0 degrees = horizontal?

**b) Variable brush:** "variable tip surface, like a brush"
That's a completely different physics model. Do you want to allow deformation of the tip along the stroke, or just rigid translation + rotation + scale?

**Decision:** For StrokeFont v1, make all nibs rigid. Brush deformation is v2.

### 2. The stroke point dynamics
You mention in the notes:

> Azimuth, angle at point, LineSegment: Angle: length:

PencilKit's `PKStrokePoint` has `location, size, opacity, force, azimuth, altitude`. You need your own:

- `t` along spine [0..1]
- `nibWidth` at t
- `nibAngle` at t (rotation of nib to spine)
- `azimuth` at t (3D tilt, do we need it for fonts or only for capture?)
- `offset` / pressure?

And how it interpolates: linear? Bezier easing? If you change nib rotation mid-stroke, do you interpolate the shortest path?

This is critical for the "x" example you start with. That example is just a butt cap with rotated edge. That's your MVP:

```
spine: line from (0,0) to (1,1)
stroke: width = 0.12em, cap = butt, capRotationStart = -15deg, capRotationEnd = -15deg
```

We need to spec `capRotation` as a first-class property, separate from nib rotation.

### 3. The spine representation
You mention `bezier splines are low level` + `TurtleGraphics + LengthPlusAngle` + `ConstructionPoints`.

Before code we need to decide:

- **Spine type:** cubic bezier path only? Or also straight turtle commands `forward(length), turn(angle)`?
- **Construction system:** Your idea of depositing ConstructionPoints/Lines for future reference is powerful for type design. Example: serif attachment point is always at `constructionPoint: "baseline-left"`. How do we store and resolve those references? Are they relative to nib ladder?
- **Grid:** Is ConstructionGrid required for v1 or future?

I would keep v1: spine = cubic bezier + construction points that are just named anchors in glyph local space.

### 4. Stroke -> outline expansion
This is the hard math. Fonts today only understand closed outlines. So StrokeCore has to be able to bake down to outlines for export.

We need to work out:
- Offset algorithm: Minkowski sum of moving, rotating, scaling rectangle/oval along a bezier. Self-intersection handling.
- Join handling: what happens when a single stroke has a sharp corner? Miter limit?
- Overlapping strokes within one glyph: do we keep them as separate shapes (like a real ductus) or fuse them into one outline like current fonts do? For Helvetica made with Speedball C nib technique, you *want* fusion.
- Winding rule for the final outline.

Without this, you can't generate an OTF.

### 5. Glyph composition model
Your hierarchy is:

```
StrokeCore
  StrokeFont
    Glyphs/scripts
    Font metrics
```

For `StrokeBasedFont` we need:

- `Glyph = [Stroke]` + `ConstructionPoints` + metadata
- How do strokes layer? Is stroke order = ductus order = rendering order?
- Built-in stroke objects: you mention "serif strokes that establish the glyph as serif". Are serifs separate strokes, or are they a property of a stroke's start/end?
- Ligatures, components: can a glyph reference another glyph's strokes?

### 6. Metrics from nib ladder
This is the most original part of your proposal:

> baseline, x-height, cap height, descender, ascender can be determined from the nib ladder

We need to formalize:

- Ladder definition: e.g. `x-height = 5 nib-widths, ascender = 4, descender = 4`
- Is the nib-width that defines the ladder the *same* nib used for the main stem, or a measuring unit?
- Slant degrees: is slant a global transform on the whole glyph, or per-stroke?
- Advance width: derived from stroke extents + side bearings, or explicit?
- Kerning: still manual or can it be derived from construction points?

Until this is a struct, you can't compute `hhea`, `OS/2`.

### 7. File format and interop
- What is the on-disk format for a StrokeFont? JSON with strokes? Your own binary? Does it embed both machine and hand instructions as you state in the doc?
- Export path: StrokeFont -> expanded outlines -> CFF2 / TrueType outlines -> OTF with `glyf`/`CFF` tables. You will need to keep hinting at bay for v1.
- Import path: Can we import existing OTF to trace as strokes for experimentation?
- Variable fonts: If `nibWidth` and `nibAngle` are parameters, you get variation almost for free. Worth designing for early.

### 8. Authoring / validation loop
You describe current process as backwards:

> since it is the outline of strokes that is being laid down with spline points the process becomes very clumsy

So what does the authoring UX need to prove this?
- Minimum: a canvas where you draw a spine and scrub nib angle/size live
- Ductus commands: inventory of common calligraphy moves `downstroke, upstroke, compound curve, dot`

### Suggested build order

**Phase 0 - Lock spec:** Write a 2-page spec for `Nib {type, width, height, angle}` and `StrokePoint {t, widthFactor, angle}`

**Phase 1 - The "x" test:** Implement extended stroke caps with rotation. Render an "x" from 2 line spines only, no outlines. This validates your PostScript critique.

**Phase 2 - Single-nib sans:** Recreate Helvetica `H, O, x` using Speedball C nib technique: one fixed rectangle nib, 3-4 strokes per glyph, fused.

**Phase 3 - Ductus font:** One calligraphic script (Italic) where file actually stores stroke order + nib ladder = both machine and human instructions.

If you want, I can draft the `Stroke`, `Nib`, and `Glyph` structs for Phase 0 from your notes so we have something concrete to implement against.
