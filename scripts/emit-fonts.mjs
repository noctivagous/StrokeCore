// Emit the three Phase 3 StrokeFont files to fonts/ (run after build).
import { mkdirSync, writeFileSync } from "node:fs";
import { foundationalFont } from "../dist/fonts/foundational.js";
import { imperialFont } from "../dist/fonts/imperial.js";
import { frakturFont } from "../dist/fonts/fraktur.js";

mkdirSync(new URL("../fonts", import.meta.url), { recursive: true });
for (const [file, font] of [
  ["foundational.strokefont.json", foundationalFont()],
  ["imperial-capitals.strokefont.json", imperialFont()],
  ["fraktur.strokefont.json", frakturFont()],
]) {
  writeFileSync(new URL(`../fonts/${file}`, import.meta.url), JSON.stringify(font, null, 2) + "\n");
  console.log("wrote", file, Object.keys(font.glyphs).length, "glyphs");
}
