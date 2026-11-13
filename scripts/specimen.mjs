// Phase 3 specimen sheets: each ductus set's alphabet on its own
// guideline system (labelled lines + nib stack), per the milestone's
// display requirement. Run after build: node scripts/specimen.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { guidesSVG, layoutText, loadStrokeFont, toSVGPath } from "../dist/index.js";
import { foundationalFont } from "../dist/fonts/foundational.js";
import { imperialFont } from "../dist/fonts/imperial.js";
import { frakturFont } from "../dist/fonts/fraktur.js";
import { gothicFont } from "../dist/fonts/gothic.js";
import { durerFont } from "../dist/fonts/durer.js";

mkdirSync(new URL("../demo/shots", import.meta.url), { recursive: true });

const NIB_PX = 13;
const STACK_W = 70;
const LABEL_W = 185;

function sheet(name, file, rows, title) {
  const font = loadStrokeFont(file);
  const refTip = file.tools.find((t) => t.name === file.referenceTool).tip;
  const nibW = refTip.kind === "pointed" ? refTip.maxWidth : refTip.width;
  const scale = NIB_PX / nibW;
  const ascNib = file.ladder.xHeight + file.ladder.ascender;
  const rowH = (ascNib + file.ladder.descender) * NIB_PX + 34;
  const laid = rows.map((r) => layoutText(font, r));
  const width = Math.ceil(Math.max(...laid.map((l) => l.width * scale))) + STACK_W + LABEL_W;
  const height = Math.ceil(rows.length * rowH + 46);
  const parts = [
    `<rect x="0" y="0" width="${width}" height="${height}" fill="white"/>`,
    `<text x="${STACK_W}" y="30" font-family="Georgia, serif" font-size="19" fill="#1a1a1a">${title}</text>`,
  ];
  rows.forEach((row, i) => {
    const baselineY = 46 + i * rowH + ascNib * NIB_PX;
    parts.push(guidesSVG({
      ladder: file.ladder, nibPx: NIB_PX, baselineY,
      x0: STACK_W, x1: width - LABEL_W, stackX: 26, labelX: width - LABEL_W + 14,
      stackStyle: "checkerboard",
    }));
    for (const p of laid[i].placements) {
      const ink = p.bake.groups.get("ink");
      parts.push(`<path d="${toSVGPath(ink)}" transform="translate(${STACK_W + 8 + p.x * scale} ${baselineY}) scale(${scale})" fill="#1a1a1a" fill-rule="evenodd"/>`);
    }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${parts.join("\n")}\n</svg>`;
  writeFileSync(new URL(`../demo/shots/${name}.svg`, import.meta.url), svg);
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1180 } }).render().asPng();
  writeFileSync(new URL(`../demo/shots/${name}.png`, import.meta.url), png);
  console.log(name, "width", Math.round(Math.max(...laid.map((l) => l.width))), "units");
}

sheet("specimen-foundational", foundationalFont(),
  ["abcdefg", "hijklmn", "opqrstu", "vwxyz&", "foundational hand"],
  "Foundational — minuscules (ladder 4/3/3, nib at 30°)");

sheet("specimen-imperial", imperialFont(),
  ["ABCDEFG", "HIJKLMN", "OPQRSTU", "VWXYZ", "IMPERIAL"],
  "Imperial Capitals — flat brush (Catich/Harris)");

sheet("specimen-fraktur", frakturFont(),
  ["abcdefg", "hijklmn", "opqrstu", "vwxyzſ", "fraktur"],
  "Fraktur — minuscules (ladder 5/2/2, nib at 40°)");

sheet("specimen-durer", durerFont(),
  ["abcdefgh", "ijklmnop", "qrstuvwx", "yz"],
  "Dürer Textura — the module square (stacks of 5 and 7, oblique squares)");

sheet("specimen-gothic", gothicFont(),
  ["ABCDEFG", "HIJKLMN", "OPQRSTU", "VWXYZ", "0123456789"],
  "Monoline Gothic — drafting lettering (6-unit grid, circle tip d = h/10)");
