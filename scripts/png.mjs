// Render demo/shots/*.svg to PNG (visual checks). Run: node scripts/png.mjs
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
for (const name of ["x", "h", "x-postscript", "h-guides", "h-guides-checker", "swell", "a-brush"]) {
  const svg = readFileSync(new URL(`../demo/shots/${name}.svg`, import.meta.url), "utf8");
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 940 } }).render().asPng();
  writeFileSync(new URL(`../demo/shots/${name}.png`, import.meta.url), png);
  console.log(name + ".png", png.length);
}
