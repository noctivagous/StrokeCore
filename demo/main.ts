import {
  bakeGlyph,
  bakeStroke,
  broadEdgeNib,
  flatBrush,
  multiPolygonArea,
  pointedBrush,
  toSVGPath,
} from "../src/index.js";
import { glyphBrushA, glyphH, glyphX, swellStroke } from "../src/fixtures.js";
import type { Stroke } from "../src/index.js";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const angleEl = $<HTMLInputElement>("angle");
const widthEl = $<HTMLInputElement>("width");
const thickEl = $<HTMLInputElement>("thick");
const brushParamEl = $<HTMLInputElement>("brushParam");
const spineEl = $<HTMLInputElement>("showSpine");
const stampsEl = $<HTMLInputElement>("showStamps");
const psEl = $<HTMLInputElement>("showPS");
const stage = $<SVGSVGElement>("stage");
const info = $<HTMLDivElement>("info");
const ductusLabel = $<HTMLSpanElement>("ductusLabel");

type View = "x" | "H" | "swell" | "A";
let glyphName: View = "x";
let ductusStep = -1; // -1 = whole glyph

function currentStrokes(): Stroke[] {
  const w = Number(widthEl.value);
  const t = Number(thickEl.value);
  const angle = Number(angleEl.value);
  const param = Number(brushParamEl.value);
  switch (glyphName) {
    case "x":
      return glyphX(broadEdgeNib("demo nib", w, t), angle);
    case "H":
      return glyphH(broadEdgeNib("demo nib", w, t), angle);
    case "swell":
      // Brush slider = peak pressure (0–100 → 0–1).
      return [swellStroke(pointedBrush("pointed brush", w + 4, 40), param / 100)];
    case "A":
      // Brush slider = mid-stem twist, scaled to 0–40°.
      return glyphBrushA(flatBrush("flat brush", Math.max(8, w - 4), t), (param / 100) * 40);
  }
}

function render() {
  const strokes = currentStrokes();
  const baked = bakeGlyph(strokes);
  const ink = baked.groups.get("ink")!;
  const parts: string[] = [];

  // PostScript comparison: the same spines through a conventional stroke
  // (round-agnostic width, butt caps forced perpendicular to the path).
  // Only meaningful for the straight-spine nib glyphs.
  if (psEl.checked && (glyphName === "x" || glyphName === "H")) {
    for (const s of strokes) {
      const [a, b] = s.spine.nodes;
      parts.push(
        `<line x1="${a.x}" y1="${-a.y}" x2="${b.x}" y2="${-b.y}" ` +
          `stroke="#c0392b" stroke-opacity="0.45" stroke-width="${widthEl.value}" stroke-linecap="butt"/>`,
      );
    }
  }

  if (ductusStep >= 0) {
    strokes.forEach((s, i) => {
      const d = toSVGPath(baked.perStroke[i].outline);
      const fill = i === ductusStep ? "#1a1a1a" : "#d8d8d8";
      parts.push(`<path d="${d}" fill="${fill}" fill-rule="evenodd"/>`);
    });
    const s = strokes[ductusStep];
    ductusLabel.textContent = `Stroke ${ductusStep + 1} of ${strokes.length}: ${s.id} — ${s.move ?? s.role ?? ""} (${s.tool.name})`;
  } else {
    parts.push(
      `<path d="${toSVGPath(ink)}" fill="#1a1a1a" fill-rule="evenodd"/>`,
    );
    ductusLabel.textContent = "Whole glyph — strokes fused into one outline.";
  }

  if (stampsEl.checked) {
    baked.perStroke.forEach((b) => {
      b.tips.forEach((tip, i) => {
        if (i % 5 !== 0 && i !== b.tips.length - 1) return;
        const d = tip.map((p) => `${p.x},${-p.y}`).join(" ");
        parts.push(`<polygon points="${d}" fill="none" stroke="#0e7c86" stroke-width="0.5"/>`);
      });
    });
  }

  if (spineEl.checked) {
    for (const s of strokes) {
      const pts = s.spine.nodes.map((n) => `${n.x},${-n.y}`).join(" ");
      const a = s.spine.nodes[0];
      parts.push(
        `<polyline points="${pts}" fill="none" stroke="#e67e22" stroke-width="0.7" stroke-dasharray="3 2"/>` +
          `<circle cx="${a.x}" cy="${-a.y}" r="1.6" fill="#e67e22"/>`,
      );
    }
  }

  stage.innerHTML = parts.join("\n");
  const separate = baked.perStroke
    .map((b) => Math.round(multiPolygonArea(b.outline)))
    .join(" + ");
  info.textContent =
    `Fused outline: ${ink.length} polygon(s), ink area ${Math.round(multiPolygonArea(ink))} units² ` +
    `(separate strokes: ${separate}). Stored data: ${strokes.length} spine(s) + 1 tool (${strokes[0].tool.name}). No outlines.`;
}

function setGlyph(name: View) {
  glyphName = name;
  ductusStep = -1;
  if (name === "H" && angleEl.value === "30") angleEl.value = "0";
  if (name === "x" && angleEl.value === "0") angleEl.value = "30";
  $<HTMLSpanElement>("angleVal").textContent = angleEl.value;
  $<HTMLSpanElement>("brushParamLabel").textContent =
    name === "swell" ? "Brush: peak pressure" : name === "A" ? "Brush: stem twist" : "Brush: peak pressure / twist";
  render();
}

for (const el of [angleEl, widthEl, thickEl, brushParamEl]) {
  el.addEventListener("input", () => {
    $<HTMLSpanElement>("angleVal").textContent = angleEl.value;
    $<HTMLSpanElement>("widthVal").textContent = widthEl.value;
    $<HTMLSpanElement>("thickVal").textContent = thickEl.value;
    $<HTMLSpanElement>("brushParamVal").textContent = brushParamEl.value;
    render();
  });
}
for (const el of [spineEl, stampsEl, psEl]) el.addEventListener("change", render);
$<HTMLButtonElement>("glyphX").addEventListener("click", () => setGlyph("x"));
$<HTMLButtonElement>("glyphH").addEventListener("click", () => setGlyph("H"));
$<HTMLButtonElement>("glyphSwell").addEventListener("click", () => setGlyph("swell"));
$<HTMLButtonElement>("glyphA").addEventListener("click", () => setGlyph("A"));
$<HTMLButtonElement>("ductusPrev").addEventListener("click", () => {
  ductusStep = Math.max(0, ductusStep - 1);
  render();
});
$<HTMLButtonElement>("ductusNext").addEventListener("click", () => {
  const n = currentStrokes().length;
  ductusStep = ductusStep < 0 ? 0 : Math.min(n - 1, ductusStep + 1);
  render();
});
$<HTMLButtonElement>("ductusAll").addEventListener("click", () => {
  ductusStep = -1;
  render();
});

// Expose for screenshot tooling.
(window as unknown as { bakeStroke: typeof bakeStroke }).bakeStroke = bakeStroke;
render();
