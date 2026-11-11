// The spelled ductus: every glyph's hand order printed with the three
// lexicons paired — part (role), gesture (primitive + configuration),
// purpose (function -> target) — beside the prose move.
//   node scripts/ductus.mjs foundational        (all glyphs)
//   node scripts/ductus.mjs foundational g      (one glyph)
import { ductus, loadStrokeFont } from "../dist/index.js";
import { foundationalFont } from "../dist/fonts/foundational.js";
import { imperialFont } from "../dist/fonts/imperial.js";
import { frakturFont } from "../dist/fonts/fraktur.js";

const FONTS = { foundational: foundationalFont, imperial: imperialFont, fraktur: frakturFont };
const font = loadStrokeFont(FONTS[process.argv[2] ?? "foundational"]());
const only = process.argv[3];

const fmtConfig = (config) =>
  !config ? "" : `(${Object.entries(config).map(([k, v]) => `${k} ${v}`).join(", ")})`;

for (const [ch, glyphName] of Object.entries(font.file.encoding)) {
  if (only && ch !== only && glyphName !== only) continue;
  console.log(`${ch} — ${glyphName}`);
  for (const s of ductus(font, glyphName)) {
    const gesture = s.gesture ? ` — ${s.gesture.primitive}${fmtConfig(s.gesture.config)}` : "";
    const purpose = s.purpose ? ` — ${s.purpose.function}${s.purpose.target ? ` -> ${s.purpose.target}` : ""}` : "";
    console.log(`  ${s.step}. ${s.role ?? "?"}${gesture}${purpose} — ${s.move ?? ""}`);
  }
}
