// The pixel-diff testing environment (docs/DIFFENV.md).
//
// For every glyph that has an isolated Harris model exemplar, this:
//   1. bakes MY glyph solid black (scripts/diff.mjs) at the exemplar
//      crop's exact pixel size — uniform scale from ink height, ink
//      bottoms aligned, so both rasters sit on the same baseline
//      (the descender line for descenders);
//   2. runs the pixel diff (scripts/diff.py): Harris's ink extracted
//      by colour, white removed (alpha = ink), tri-colour composite
//      (overlap grey / his-only crimson / mine-only blue) + IoU +
//      a side-by-side and a machine-readable score per glyph;
//   3. aggregates demo/diffs/report-<font>.json and a contact sheet
//      demo/diffs/index-<font>.html, worst glyph first.
//
//   npm run diffenv                  foundational, all glyphs
//   npm run diffenv -- fraktur       one font
//   npm run diffenv -- foundational a e o   named glyphs only
//   (pass --no-build to skip the build + fonts:emit preflight)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const TAGS = {
  foundational: ["fnd44", "fnd45L", "fnd45R"],
  imperial: ["ic1", "ic2", "ic3", "ic4", "ic5", "ic6", "ic7"],
  fraktur: ["fk76", "fk77L", "fk77R"],
};
const root = new URL("../", import.meta.url);
const exDir = new URL("demo/overlays/exemplars/", root);
const diffDir = new URL("demo/diffs/", root);
mkdirSync(diffDir, { recursive: true });

const args = process.argv.slice(2).filter((a) => a !== "--no-build");
const noBuild = process.argv.includes("--no-build");
const fontKey = args[0] ?? "foundational";
if (!TAGS[fontKey]) { console.error(`unknown font ${fontKey} (have: ${Object.keys(TAGS).join(", ")})`); process.exit(1); }

// Discover glyphs that have an isolated model exemplar.
const discover = () => {
  const found = new Map();
  for (const t of TAGS[fontKey]) {
    const mapFile = new URL(`${t}-map.json`, exDir);
    if (!existsSync(mapFile)) {
      console.error(`missing exemplar map ${t}-map.json — run scripts/exemplars.py first (docs/DIFFENV.md)`);
      process.exit(1);
    }
    const map = JSON.parse(readFileSync(mapFile, "utf8"));
    for (const [ch, kinds] of Object.entries(map)) if (kinds.model && !found.has(ch)) found.set(ch, kinds.model);
  }
  return [...found.keys()];
};
const wanted = args.length > 1 ? args.slice(1) : discover();

if (!noBuild) {
  console.log("building + emitting fonts…");
  execFileSync("npm", ["run", "build"], { stdio: "inherit" });
  execFileSync("npm", ["run", "fonts:emit"], { stdio: "inherit" });
}

const run = (cmd, argv) => execFileSync(cmd, argv, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
const rows = [], skipped = [];
for (const ch of wanted) {
  try {
    run("node", ["scripts/diff.mjs", fontKey, ch]);
    const out = run("python3", ["scripts/diff.py", fontKey, ch]).trim();
    const score = JSON.parse(readFileSync(new URL(`${fontKey}-${ch}-score.json`, diffDir), "utf8"));
    rows.push(score);
    console.log(out);
  } catch {
    skipped.push(ch);
    console.log(`${ch}: skipped (no model exemplar)`);
  }
}
rows.sort((a, b) => a.iou - b.iou);

const report = {
  font: fontKey,
  alignment: "ink bbox to ink bbox: uniform scale from ink height, ink bottoms aligned (baseline-anchored; descender line for descenders)",
  generatedAt: new Date().toISOString(),
  glyphs: rows,
  skipped,
};
writeFileSync(new URL(`report-${fontKey}.json`, diffDir), JSON.stringify(report, null, 1));

const esc = (s) => s.replace(/&/g, "&amp;");
const cells = rows.map((r) => `
<figure>
  <img src="${fontKey}-${esc(r.glyph)}.png" alt="diff ${esc(r.glyph)}">
  <img src="${fontKey}-${esc(r.glyph)}-side.png" alt="Harris beside mine ${esc(r.glyph)}">
  <figcaption><b>${esc(r.glyph)}</b> IoU ${r.iou.toFixed(3)} · miss ${r.missPx} · excess ${r.excessPx}<br>
  <span>his ${r.hisPx}px · mine ${r.minePx}px</span></figcaption>
</figure>`).join("");
const html = `<!doctype html>
<meta charset="utf-8">
<title>StrokeCore diff environment — ${fontKey}</title>
<style>
  body { font-family: sans-serif; margin: 24px; color: #222; }
  h1 { font-size: 20px; } p.key span { padding: 1px 7px; border-radius: 3px; color: #fff; }
  .grid { display: flex; flex-wrap: wrap; gap: 18px; }
  figure { margin: 0; width: 300px; }
  figure img { max-width: 300px; display: block; margin-bottom: 6px; image-rendering: pixelated; border: 1px solid #ddd; }
  figcaption { font-size: 13px; } figcaption span { color: #777; }
</style>
<h1>${fontKey} — glyph vs Harris, worst first</h1>
<p class="key">Diff key: <span style="background:#464646">overlap</span>
<span style="background:#dc143c">Harris only — my misses</span>
<span style="background:#1e5adc">mine only — my excess</span></p>
<p>Alignment: ${report.alignment}. Side-by-side: Harris (left) beside mine (right), equal height.
How to read a diff: docs/DIFFENV.md.</p>
<div class="grid">${cells}
</div>
${skipped.length ? `<p>Skipped (no model exemplar): ${skipped.map(esc).join(", ")}</p>` : ""}
`;
writeFileSync(new URL(`index-${fontKey}.html`, diffDir), html);

const mean = rows.reduce((s, r) => s + r.iou, 0) / Math.max(1, rows.length);
console.log(`\n${fontKey}: ${rows.length} glyphs, mean IoU ${mean.toFixed(3)}, worst ${rows[0]?.glyph} ${rows[0]?.iou.toFixed(3)}, best ${rows[rows.length - 1]?.glyph} ${rows[rows.length - 1]?.iou.toFixed(3)}`);
console.log(`report: demo/diffs/report-${fontKey}.json · contact sheet: demo/diffs/index-${fontKey}.html`);
