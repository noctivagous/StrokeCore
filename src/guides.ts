// Guideline systems and the nib stack, for worked examples.
//
// A hand is ruled by its ladder (SPEC §5): heights in nib widths from
// the baseline. Every Foundational example (SPEC §10 milestone display
// requirement) shows the labelled lines — Ascender, Capital, Waist,
// Base, Descender — plus the nib stack at the left: alternating
// black/white nib-width squares from descender line to ascender line.

export interface LadderSpec {
  /** Waist line height (the x-height itself), in nib widths. */
  xHeight: number;
  /** Ascender space above the waist line, in nib widths. */
  ascender: number;
  /** Descender depth below the baseline, in nib widths. */
  descender: number;
  /** Capital height from the baseline, in nib widths. */
  capHeight: number;
}

/** Formo exemplar ladder: body 4, ascender 3, descender 3, capitals 6. */
export const FOUNDATIONAL_LADDER: LadderSpec = {
  xHeight: 4,
  ascender: 3,
  descender: 3,
  capHeight: 6,
};

export interface GuideLine {
  id: "ascender" | "capital" | "waist" | "base" | "descender";
  label: string;
  /** Height above the baseline, in nib widths (negative below). */
  yNib: number;
}

export function guideLines(ladder: LadderSpec = FOUNDATIONAL_LADDER): GuideLine[] {
  return [
    { id: "ascender", label: "Ascender Line", yNib: ladder.xHeight + ladder.ascender },
    { id: "capital", label: "Capital Line", yNib: ladder.capHeight },
    { id: "waist", label: "Waist Line", yNib: ladder.xHeight },
    { id: "base", label: "Base Line", yNib: 0 },
    { id: "descender", label: "Descender Line", yNib: -ladder.descender },
  ];
}

export interface GuidesSvgOptions {
  ladder?: LadderSpec;
  /** Pixels per nib width. */
  nibPx: number;
  /** Screen y of the baseline. */
  baselineY: number;
  /** Line span. */
  x0: number;
  x1: number;
  /** X of the nib stack column. */
  stackX: number;
  /** X where line labels start. */
  labelX: number;
  /**
   * Nib stack style: "alternating" (printed exemplars — one column of
   * black/white squares) or "checkerboard" (the Practice Maker's —
   * two columns, squares alternating columns, black in the x-height
   * zone and grey in the ascender/descender zones).
   */
  stackStyle?: "alternating" | "checkerboard";
}

/**
 * SVG fragment (screen coordinates, y down): the five labelled
 * guideline rows, the nib stack, and an X-height bracket.
 */
export function guidesSVG(o: GuidesSvgOptions): string {
  const ladder = o.ladder ?? FOUNDATIONAL_LADDER;
  const lines = guideLines(ladder);
  const y = (nib: number) => o.baselineY - nib * o.nibPx;
  const parts: string[] = [];

  for (const g of lines) {
    const gy = y(g.yNib);
    const strong = g.id === "base";
    parts.push(
      `<line x1="${o.x0}" y1="${gy}" x2="${o.x1}" y2="${gy}" stroke="${strong ? "#444" : "#bbb"}" stroke-width="${strong ? 1.2 : 0.8}"/>`,
      `<text x="${o.labelX}" y="${gy + 3.5}" font-family="Georgia, serif" font-size="11" fill="#555">${g.label}</text>`,
    );
  }

  // Nib stack: one square per nib width, descender line to ascender line.
  if ((o.stackStyle ?? "alternating") === "checkerboard") {
    // Two columns; the square's column alternates each row. Colour is
    // by zone: black within the x-height, grey in the extenders. A
    // square straddling the waist line splits at it.
    const above = ladder.xHeight + ladder.ascender;
    const rect = (col: number, topNib: number, heightNib: number, fill: string) =>
      parts.push(
        `<rect x="${o.stackX + col * o.nibPx}" y="${y(topNib)}" width="${o.nibPx}" height="${heightNib * o.nibPx}" fill="${fill}" stroke="#1a1a1a" stroke-width="0.8"/>`,
      );
    for (let row = 0; row < Math.ceil(above); row++) {
      const bot = row; // band [bot, bot+1] in nib widths above the baseline
      const top = Math.min(bot + 1, above);
      const col = row % 2;
      if (bot < ladder.xHeight && top > ladder.xHeight) {
        rect(col, top, top - ladder.xHeight, "#999999");
        rect(col, ladder.xHeight, ladder.xHeight - bot, "#1a1a1a");
      } else {
        rect(col, top, top - bot, bot >= ladder.xHeight ? "#999999" : "#1a1a1a");
      }
    }
    for (let row = 0; row < Math.ceil(ladder.descender); row++) {
      const top = -row;
      const bot = Math.max(top - 1, -ladder.descender);
      rect(1 - (row % 2), top, top - bot, "#999999");
    }
  } else {
    const total = ladder.xHeight + ladder.ascender + ladder.descender;
    for (let i = 0; i < total; i++) {
      const topNib = ladder.xHeight + ladder.ascender - i; // nib height of this square's top edge
      parts.push(
        `<rect x="${o.stackX}" y="${y(topNib)}" width="${o.nibPx}" height="${o.nibPx}" fill="${i % 2 === 0 ? "#1a1a1a" : "#ffffff"}" stroke="#1a1a1a" stroke-width="0.8"/>`,
      );
    }
  }

  // X-height bracket beside the stack.
  const bx = o.stackX - 10;
  const yTop = y(ladder.xHeight);
  const yBot = y(0);
  parts.push(
    `<line x1="${bx}" y1="${yTop}" x2="${bx}" y2="${yBot}" stroke="#888" stroke-width="0.8"/>`,
    `<line x1="${bx - 3}" y1="${yTop}" x2="${bx + 3}" y2="${yTop}" stroke="#888" stroke-width="0.8"/>`,
    `<line x1="${bx - 3}" y1="${yBot}" x2="${bx + 3}" y2="${yBot}" stroke="#888" stroke-width="0.8"/>`,
    `<text x="${bx - 5}" y="${(yTop + yBot) / 2}" font-family="Georgia, serif" font-size="11" fill="#555" text-anchor="middle" transform="rotate(-90 ${bx - 5} ${(yTop + yBot) / 2})">X-height</text>`,
  );

  return parts.join("\n");
}
