// Analytical engine CLI: scorecard every fitted record (and the
// authored 永） against its Make Me a Hanzi ground truth, in a
// chosen style. Prints one row per character plus the worst
// strokes; --json writes the full scorecards.
//
// Usage: npm run build && node scripts/bihua-analyze.mjs [--style maobi|flatbrush|ballpoint|heiti] [--json out.json]

import { readFileSync, writeFileSync } from "node:fs";
import * as b from "../dist/bihua/index.js";

const styleArg = process.argv.find((a) => a.startsWith("--style="));
const style = styleArg ? b.styleById(styleArg.slice("--style=".length)) : b.maobiStyle;
const jsonArg = process.argv.find((a) => a.startsWith("--json="));

const RECORDS = [
  ["永", b.yong], ["木", b.fittedMu], ["人", b.fittedRen], ["大", b.fittedDa],
  ["天", b.fittedTian], ["土", b.fittedTu], ["士", b.fittedShi], ["日", b.fittedRi],
  ["月", b.fittedYue], ["明", b.fittedMing], ["水", b.fittedShui], ["火", b.fittedHuo],
  ["山", b.fittedShan], ["四", b.fittedSi], ["女", b.fittedNu], ["好", b.fittedHao],
  ["心", b.fittedXin], ["我", b.fittedWo], ["國", b.fittedGuo],
];

const scores = [];
console.log(`style: ${style.id}`);
console.log("char  IoU    centroidΔ  boundary  verdict  worst stroke");
for (const [ch, rec] of RECORDS) {
  const data = JSON.parse(readFileSync(new URL(`./fixtures/hanzi-writer/${ch}.json`, import.meta.url), "utf8"));
  const s = b.analyzeCharacter(rec, data, style);
  scores.push(s);
  const worstStroke = [...s.strokes].sort((m, n) => m.widthRmse - n.widthRmse).at(-1);
  console.log(
    `${ch}    ${s.iou.toFixed(3)}  ${s.grid.centroidDistance.toFixed(1).padStart(8)}  ${String(s.boundaryMean).padStart(5)}/${String(s.boundaryP95).padEnd(5)} ${s.verdict.padEnd(8)} ${worstStroke.form} wRmse ${worstStroke.widthRmse}`,
  );
}
const tally = { ok: 0, warn: 0, fail: 0 };
for (const s of scores) tally[s.verdict]++;
console.log(`\nverdicts: ${tally.ok} ok, ${tally.warn} warn, ${tally.fail} fail of ${scores.length}`);
if (jsonArg) {
  writeFileSync(jsonArg.slice("--json=".length), JSON.stringify(scores, null, 2));
  console.log("wrote", jsonArg.slice("--json=".length));
}
