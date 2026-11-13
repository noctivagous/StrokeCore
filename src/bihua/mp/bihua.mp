% bihua.mp — Bihua Foundation MetaPost module.
%
% The strokes and methods of Bihua as reusable MetaFont-capability
% modules: pens, parametric path macros for each named stroke form
% （笔形）, and a segmented varying-width draw — the standing oracle
% rule is that a varying stroke is emitted as segmented `draw` with a
% changing pen, never as `penstroke` (which under-covers it).
%
% Coordinates are the character's own grid, y-up; the caller scales
% (e.g. `u := 0.25; transform by u at input time — see the emitted
% programs from src/bihua/metapost.ts, which fold the scale into the
% point definitions).
%
% Usage:  input bihua.mp

% ---- brush -----------------------------------------------------------------
% The 毛笔 (maobi) at ink width w is a round pen of diameter w.
def bihua_brush(expr w) =
  pickup pencircle scaled w;
enddef;

% ---- varying-width draw ------------------------------------------------------
% Widths for the current stroke live in bihua_w[0..n] (one per node).
numeric bihua_w[];
% Draw path p (built node-to-node, so subpath (i,i+1) is segment i)
% with the pen width interpolated across each segment.
def draw_bihua_stroke(expr p, n) =
  for i = 0 upto n - 1:
    bihua_brush(bihua_w[i] + 0.5 * (bihua_w[i + 1] - bihua_w[i]));
    draw subpath (i, i + 1) of p;
  endfor
  % Round caps from the brush itself at both ends.
  bihua_brush(bihua_w[0]);
  drawdot point 0 of p;
  bihua_brush(bihua_w[n]);
  drawdot point n of p;
enddef;

% ---- stroke-form （笔形） path macros -----------------------------------------
% Each macro returns the centreline path of one named form, from an
% origin pair, sized by its own parameters. These are the reusable
% modules characters are composed from when authored in MetaPost.

% 点 dian （侧）: a press and a short drag down-right.
vardef b_dian(expr o, len) =
  o{dir -35} .. o + (0.82 len, -0.57 len)
enddef;

% 横 heng （勒）: left to right, a slight rise, ends gathered.
vardef b_heng(expr o, len, rise) =
  o{right} .. o + (len, rise)
enddef;

% 竖 shu （努）: a straight downward drive.
vardef b_shu(expr o, len) =
  o{down} .. o + (0, -len)
enddef;

% 钩 gou （趯）: the leap at a vertical's foot — out to the left, lifting.
vardef b_gou(expr o, len) =
  o{dir 165} .. o + (-len, 0.3 len)
enddef;

% 提 ti （策）: the whip-crack, up to the right, ending in a point.
vardef b_ti(expr o, len) =
  o{dir 18} .. o + (len, 0.32 len)
enddef;

% 撇 pie （掠 long / 啄 short): down-left, bowing, thinning to the tip.
vardef b_pie(expr o, len, drop) =
  o{dir -100} .. o + (-0.55 len, -0.75 drop){dir -160} .. o + (-len, -drop)
enddef;

% 捺 na （磔）: down-right, flattening into a heavy foot.
vardef b_na(expr o, len, drop) =
  o{dir -55} .. o + (0.6 len, -0.8 drop){right} .. o + (len, -drop)
enddef;

% 折 zhe: the corner joint between two directions (not one of the eight).
vardef b_zhe(expr o, dx, dy) =
  o .. o + (dx, dy)
enddef;
