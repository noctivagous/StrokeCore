// The StrokeFont file format and its runtime (SPEC §7).
//
// A StrokeFont is one JSON file: a ladder counted in nib widths of a
// reference tool, a tool table, a move vocabulary, and glyphs whose
// strokes — in ductus order — are the letterforms. Strokes in the file
// name their tool; loading resolves names to tools. Glyphs may reuse
// another glyph's strokes through components (the serif+stem of b, d,
// h is letter l's, per the printed teaching), and may carry named
// alternates with their own ductus.

import { bakeGlyph, multiPolygonArea, type GlyphBake } from "./bake.js";
import { expandCompositeSpine } from "./composite.js";
import {
  ANATOMY_PART_NAMES, BASE_PRIMITIVE_NAMES, STROKE_FUNCTION_NAMES, validatePrimitiveConfig,
} from "./primitives.js";
import type { Pt, Stroke, Tool } from "./types.js";
import type { LadderSpec } from "./guides.js";

/** A stroke as stored in the file: the tool is a name in the tool table. */
export type FileStroke = Omit<Stroke, "tool"> & { tool: string };

export interface GlyphRef {
  glyph: string;
  dx?: number;
  dy?: number;
  scale?: number;
}

export interface FontGlyph {
  name: string;
  codepoints?: string[];
  ductusKind: "native" | "translated";
  source?: string;
  strokes: FileStroke[];
  components?: GlyphRef[];
  alternates?: FontGlyph[];
  advance?: number;
}

/** The square-lattice construction convention (SPEC §5): a font whose
 *  letters are built from one module square. The module's side IS the
 *  stem width, which is the reference tool's nib width — the loader
 *  enforces that identity. Oblique squares are the module square at
 *  45°, centred on a stack edge at the declared fraction of the module. */
export interface SquareLattice {
  kind: "square-lattice";
  module: number;
  stack: { short: number; tall?: number };
  diamondCentre?: { top: number; bottom: number };
}

export interface StrokeFontFile {
  format: "strokefont";
  version: 1;
  name: string;
  designer?: string;
  sourceNote?: string;
  unitsPerEm: number;
  referenceTool: string;
  ladder: LadderSpec;
  slant: number;
  tools: Tool[];
  moves: string[];
  /** Hand-level configuration of the core's base primitives (§7, GRAMMAR.md):
   *  a table — one row per base primitive this hand configures, one
   *  value per parameter. Glyph strokes override it point by point. */
  primitives?: Record<string, import("./primitives.js").PrimitiveConfig>;
  /** Named, reusable primitive configurations for this hand. */
  patterns?: Record<string, import("./primitives.js").PrimitivePattern>;
  /** Declared construction scaffold, when the hand has one (§5). */
  construction?: { grid?: SquareLattice };
  glyphs: Record<string, FontGlyph>;
  encoding: Record<string, string>;
  bearings: { defaultLeft: number; defaultRight: number };
  kerning?: Record<string, number>;
}

export interface StrokeFont {
  file: StrokeFontFile;
  toolsByName: Map<string, Tool>;
  referenceTool: Tool;
  /** Ladder line heights in font units, derived from the ladder + reference tool width. */
  lines: { ascender: number; capital: number; waist: number; base: number; descender: number };
}

const tipWidth = (tool: Tool): number => {
  const t = tool.tip;
  switch (t.kind) {
    case "rect": return t.width;
    case "ellipse": return t.width;
    case "pointed": return t.maxWidth;
    case "flatBrush": case "steelBrush": return t.width;
    case "polygon": {
      const xs = t.points.map((p) => p.x);
      return Math.max(...xs) - Math.min(...xs);
    }
  }
};

/** Parse + validate a StrokeFont file (JSON text or object). */
export function loadStrokeFont(input: string | unknown): StrokeFont {
  const file = (typeof input === "string" ? JSON.parse(input) : input) as StrokeFontFile;
  if (file.format !== "strokefont") throw new Error("not a StrokeFont file (format != 'strokefont')");
  if (file.version !== 1) throw new Error(`unsupported StrokeFont version ${file.version}`);
  const toolsByName = new Map<string, Tool>();
  for (const t of file.tools) {
    if (toolsByName.has(t.name)) throw new Error(`duplicate tool name '${t.name}'`);
    toolsByName.set(t.name, t);
  }
  const referenceTool = toolsByName.get(file.referenceTool);
  if (!referenceTool) throw new Error(`referenceTool '${file.referenceTool}' not in the tool table`);
  // The squares convention (§5): the lattice module is the stem width,
  // which is the reference nib width — a declaration that disagrees
  // with the tool table is a broken file, not a style choice.
  const grid = file.construction?.grid;
  if (grid !== undefined) {
    if (grid.kind !== "square-lattice") throw new Error(`construction grid: unknown kind '${(grid as { kind: string }).kind}'`);
    if (!(grid.module > 0)) throw new Error("construction grid: module must be positive");
    if (Math.abs(grid.module - tipWidth(referenceTool)) > 1e-6)
      throw new Error(`construction grid: module ${grid.module} != reference nib width ${tipWidth(referenceTool)} (the module IS the stem width)`);
    if (!(grid.stack.short > 0)) throw new Error("construction grid: stack.short must be positive");
  }
  // The primitives table configures base primitives only, with
  // parameters from their signatures; patterns likewise (§7).
  for (const [name, config] of Object.entries(file.primitives ?? {})) {
    if (!BASE_PRIMITIVE_NAMES.has(name)) throw new Error(`primitives table: unknown base primitive '${name}'`);
    validatePrimitiveConfig(name, config, "primitives table");
  }
  for (const [name, pattern] of Object.entries(file.patterns ?? {})) {
    validatePrimitiveConfig(pattern.primitive, pattern.config, `pattern '${name}'`);
  }
  for (const g of Object.values(file.glyphs)) {
    for (const s of g.strokes) {
      if (!toolsByName.has(s.tool)) throw new Error(`glyph '${g.name}' uses unknown tool '${s.tool}'`);
      if (s.role !== undefined && !ANATOMY_PART_NAMES.has(s.role)) {
        throw new Error(`glyph '${g.name}' stroke '${s.id}' has unknown anatomy role '${s.role}'`);
      }
      if (s.gesture) validatePrimitiveConfig(s.gesture.primitive, s.gesture.config, `glyph '${g.name}' stroke '${s.id}'`);
      if (s.purpose) {
        if (!STROKE_FUNCTION_NAMES.has(s.purpose.function)) {
          throw new Error(`glyph '${g.name}' stroke '${s.id}' has unknown purpose function '${s.purpose.function}'`);
        }
        if (s.purpose.target !== undefined && !ANATOMY_PART_NAMES.has(s.purpose.target)) {
          throw new Error(`glyph '${g.name}' stroke '${s.id}' has unknown purpose target '${s.purpose.target}'`);
        }
      }
      // A stroke authored as a composite spine (§4.5) may omit the
      // expanded spine; expand it now so the bake always sees a spine.
      if (s.composite && !s.spine) {
        const expanded = expandCompositeSpine(s.composite);
        s.spine = expanded.spine;
        if (!s.points?.length && expanded.points.length) s.points = expanded.points;
      }
      if (!s.spine) throw new Error(`glyph '${g.name}' stroke '${s.id}' has neither spine nor composite`);
    }
    for (const c of g.components ?? []) {
      if (!file.glyphs[c.glyph]) throw new Error(`glyph '${g.name}' references unknown component glyph '${c.glyph}'`);
    }
  }
  const w = tipWidth(referenceTool);
  const L = file.ladder;
  return {
    file,
    toolsByName,
    referenceTool,
    lines: {
      ascender: (L.xHeight + L.ascender) * w,
      capital: L.capHeight * w,
      waist: L.xHeight * w,
      base: 0,
      descender: -L.descender * w,
    },
  };
}

const xformPt = (p: Pt, dx: number, dy: number, k: number): Pt => ({ x: p.x * k + dx, y: p.y * k + dy });

function xformStroke(s: Stroke, dx: number, dy: number, k: number): Stroke {
  return {
    ...s,
    spine: {
      nodes: s.spine.nodes.map((n) => xformPt(n, dx, dy, k)),
      segments: s.spine.segments.map((seg) =>
        seg.kind === "cubic"
          ? { kind: "cubic", c1: xformPt(seg.c1, dx, dy, k), c2: xformPt(seg.c2, dx, dy, k) }
          : seg,
      ),
    },
    composite: s.composite
      ? {
          closed: s.composite.closed,
          points: s.composite.points.map((p) => ({
            ...p,
            ...xformPt(p, dx, dy, k),
            corner: p.corner ? { ...p.corner, radius: p.corner.radius * k } : undefined,
            outgoing: p.outgoing?.bowOffset !== undefined
              ? { ...p.outgoing, bowOffset: p.outgoing.bowOffset * k }
              : p.outgoing,
          })),
        }
      : undefined,
  };
}

/** A glyph's full stroke list: its components' strokes, then its own. */
export function resolveGlyphStrokes(font: StrokeFont, glyphName: string, depth = 0): Stroke[] {
  if (depth > 8) throw new Error(`component cycle suspected at '${glyphName}'`);
  const glyph = font.file.glyphs[glyphName];
  if (!glyph) throw new Error(`no glyph '${glyphName}'`);
  const own: Stroke[] = glyph.strokes.map((s) => ({
    ...s,
    tool: font.toolsByName.get(s.tool)!,
  }));
  const fromComponents: Stroke[] = [];
  for (const ref of glyph.components ?? []) {
    const base = resolveGlyphStrokes(font, ref.glyph, depth + 1);
    const dx = ref.dx ?? 0;
    const dy = ref.dy ?? 0;
    const k = ref.scale ?? 1;
    for (const s of base) fromComponents.push(xformStroke(s, dx, dy, k));
  }
  return [...fromComponents, ...own];
}

export function bakeFontGlyph(font: StrokeFont, glyphName: string): GlyphBake {
  return bakeGlyph(resolveGlyphStrokes(font, glyphName));
}

/** Advance: declared, or derived from the bake plus the font's bearings. */
export function glyphAdvance(font: StrokeFont, glyphName: string, bake?: GlyphBake): number {
  const glyph = font.file.glyphs[glyphName];
  if (glyph?.advance !== undefined) return glyph.advance;
  const b = bake ?? bakeFontGlyph(font, glyphName);
  const ink = b.groups.get("ink") ?? [];
  let minX = Infinity, maxX = -Infinity;
  for (const poly of ink) for (const ring of poly) for (const p of ring) {
    minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
  }
  if (minX === Infinity) return font.file.bearings.defaultLeft + font.file.bearings.defaultRight;
  return maxX - minX + font.file.bearings.defaultLeft + font.file.bearings.defaultRight;
}

export interface PlacedGlyph {
  char: string;
  glyphName: string;
  x: number;
  advance: number;
  bake: GlyphBake;
}

/** Lay out a line of text: advances + declared kerning, glyphs baked. */
export function layoutText(font: StrokeFont, text: string): { placements: PlacedGlyph[]; width: number } {
  const placements: PlacedGlyph[] = [];
  let x = 0;
  let prev: string | null = null;
  for (const char of text) {
    if (char === " ") {
      x += font.lines.waist * 0.62;
      prev = null;
      continue;
    }
    const glyphName = font.file.encoding[char];
    if (!glyphName) continue;
    if (prev && font.file.kerning) x += font.file.kerning[`${prev}${char}`] ?? 0;
    const bake = bakeFontGlyph(font, glyphName);
    const advance = glyphAdvance(font, glyphName, bake);
    placements.push({ char, glyphName, x, advance, bake });
    x += advance;
    prev = char;
  }
  return { placements, width: x };
}

export interface DuctusStep {
  step: number;
  strokeId: string;
  move?: string;
  /** The anatomy part this stroke is (primitives.ts). */
  role?: string;
  /** What the hand does: the base primitive, configured. */
  gesture?: import("./primitives.js").StrokeGesture;
  /** What the stroke is doing for the letter: function verb + target part. */
  purpose?: import("./primitives.js").StrokePurpose;
  toolName: string;
}

/** The hand instructions for a glyph, in order — the ductus sheet.
 *  Each step pairs the three lexicons: the part (role), the gesture
 *  that makes it, and its purpose, beside the prose move. */
export function ductus(font: StrokeFont, glyphName: string): DuctusStep[] {
  return resolveGlyphStrokes(font, glyphName).map((s, i) => ({
    step: i + 1,
    strokeId: s.id,
    move: s.move,
    role: s.role,
    gesture: s.gesture,
    purpose: s.purpose,
    toolName: s.tool.name,
  }));
}

export { multiPolygonArea };
