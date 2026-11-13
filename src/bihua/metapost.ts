// MetaPost emission: a character record becomes a MetaPost program
// that inputs the reusable module (src/bihua/mp/bihua.mp) and draws
// each stroke as a segmented varying-width draw — the same record,
// executed by MetaFont's own machinery instead of our bake. This is
// the comparison path for docs/BIHUA.md's MetaFont levels 2–3, and
// the bridge by which 笔形/笔法 modules authored in MetaPost feed the
// foundation.

import { widthAt } from "./brush.js";
import type { BihuaCharacter } from "./types.js";

export interface MetaPostOptions {
  /** Points per grid unit (1024 grid × 0.25 = a 256pt figure). */
  scale?: number;
  /** Path/name the program inputs for the bihua module. */
  modulePath?: string;
  /** Full-pressure ink width in grid units (brush.ts widthAt). */
  maxWidth?: number;
}

const n = (v: number): string => {
  const s = v.toFixed(2);
  return s === "-0.00" ? "0.00" : s;
};

export function metaPostProgram(character: BihuaCharacter, opts: MetaPostOptions = {}): string {
  const u = opts.scale ?? 0.25;
  const modulePath = opts.modulePath ?? "bihua.mp";
  const lines: string[] = [
    `% ${character.char} (${character.pinyin}) — emitted by strokecore/bihua metapost.ts`,
    `% Source record provenance: ${character.source}`,
    `input ${modulePath};`,
    `prologues := 3;`,
    `outputformat := "svg";`,
    `outputtemplate := "%j-%c.svg";`,
    `beginfig(1);`,
    // MetaPost type declarations cover a whole family (path sp[];);
    // declaring one suffixed instance (path sp0;) is illegal.
    `path sp[];`,
  ];
  // Point names are plain z<n> with a single running index: MetaPost
  // suffixes do not accept the z<stroke>_<node> double-index shape.
  let zNext = 0;
  character.strokes.forEach((stroke, si) => {
    const pts = stroke.spine;
    const start = zNext;
    pts.forEach((p) => {
      lines.push(`z${zNext++} = (${n(p.x * u)}, ${n(p.y * u)});`);
    });
    lines.push(
      `sp${si} = ` +
        pts.map((_, pi) => `z${start + pi}`).join(" .. ") +
        `;`,
    );
    stroke.pressure.forEach((pr, pi) => {
      // :=, not =: the width array is rewritten for every stroke, and
      // a MetaPost equation cannot be re-asserted with a new value.
      lines.push(`bihua_w[${pi}] := ${n(widthAt(pr, opts.maxWidth) * u)};`);
    });
    lines.push(`draw_bihua_stroke(sp${si}, ${pts.length - 1});`);
  });
  lines.push(`endfig;`, `end`);
  return lines.join("\n") + "\n";
}

/** A check program exercising every 笔形 macro in the module, in a row. */
export function metaPostFormsProgram(opts: MetaPostOptions = {}): string {
  const modulePath = opts.modulePath ?? "bihua.mp";
  return [
    `% The stroke-form （笔形） macros of bihua.mp, one specimen each.`,
    `input ${modulePath};`,
    `prologues := 3;`,
    `outputformat := "svg";`,
    `outputtemplate := "%j-%c.svg";`,
    `beginfig(1);`,
    `path q;`,
    `q := b_dian((0, 200), 60);    bihua_w[0] := 26; bihua_w[1] := 17; draw_bihua_stroke(q, 1);`,
    `q := b_heng((120, 185), 150, 10); bihua_w[0] := 22; bihua_w[1] := 25; draw_bihua_stroke(q, 1);`,
    `q := b_shu((340, 230), 160);  bihua_w[0] := 24; bihua_w[1] := 21; draw_bihua_stroke(q, 1);`,
    `q := b_ti((420, 90), 130);    bihua_w[0] := 22; bihua_w[1] := 5;  draw_bihua_stroke(q, 1);`,
    `q := b_pie((620, 240), 130, 170); bihua_w[0] := 25; bihua_w[1] := 15; bihua_w[2] := 3; draw_bihua_stroke(q, 2);`,
    `q := b_na((700, 210), 170, 60);   bihua_w[0] := 13; bihua_w[1] := 22; bihua_w[2] := 29; draw_bihua_stroke(q, 2);`,
    `q := b_gou((60, 60), 70);      bihua_w[0] := 21; bihua_w[1] := 6;  draw_bihua_stroke(q, 1);`,
    `endfig;`,
    `end`,
    ``,
  ].join("\n");
}
