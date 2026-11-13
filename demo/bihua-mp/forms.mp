% The stroke-form （笔形） macros of bihua.mp, one specimen each.
input bihua.mp;
prologues := 3;
outputformat := "svg";
outputtemplate := "%j-%c.svg";
beginfig(1);
path q;
q := b_dian((0, 200), 60);    bihua_w[0] := 26; bihua_w[1] := 17; draw_bihua_stroke(q, 1);
q := b_heng((120, 185), 150, 10); bihua_w[0] := 22; bihua_w[1] := 25; draw_bihua_stroke(q, 1);
q := b_shu((340, 230), 160);  bihua_w[0] := 24; bihua_w[1] := 21; draw_bihua_stroke(q, 1);
q := b_ti((420, 90), 130);    bihua_w[0] := 22; bihua_w[1] := 5;  draw_bihua_stroke(q, 1);
q := b_pie((620, 240), 130, 170); bihua_w[0] := 25; bihua_w[1] := 15; bihua_w[2] := 3; draw_bihua_stroke(q, 2);
q := b_na((700, 210), 170, 60);   bihua_w[0] := 13; bihua_w[1] := 22; bihua_w[2] := 29; draw_bihua_stroke(q, 2);
q := b_gou((60, 60), 70);      bihua_w[0] := 21; bihua_w[1] := 6;  draw_bihua_stroke(q, 1);
endfig;
end
