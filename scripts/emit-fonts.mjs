// Emit the StrokeFont files to fonts/ (run after build).
import { mkdirSync, writeFileSync } from "node:fs";
import { foundationalFont } from "../dist/fonts/foundational.js";
import { imperialFont } from "../dist/fonts/imperial.js";
import { frakturFont } from "../dist/fonts/fraktur.js";
import { gothicFont } from "../dist/fonts/gothic.js";
import { durerFont } from "../dist/fonts/durer.js";

mkdirSync(new URL("../fonts", import.meta.url), { recursive: true });
for (const [file, font] of [
  ["foundational.strokefont.json", foundationalFont()],
  ["imperial-capitals.strokefont.json", imperialFont()],
  ["fraktur.strokefont.json", frakturFont()],
  ["monoline-gothic.strokefont.json", gothicFont()],
  ["durer-textura.strokefont.json", durerFont()],
]) {
  writeFileSync(new URL(`../fonts/${file}`, import.meta.url), JSON.stringify(font, null, 2) + "\n");
  console.log("wrote", file, Object.keys(font.glyphs).length, "glyphs");
}
