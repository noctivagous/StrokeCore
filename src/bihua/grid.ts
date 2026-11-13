// 田字格 (tiánzìgé, "field-character grid") analysis — the practice
// grid Chinese characters are traditionally analysed in: a square
// divided by its midlines into four quadrants (the 米字格 variant adds
// the diagonals). Proportion and balance are judged against the grid:
// where the ink's centre sits, how it spreads across the quadrants,
// how much margin it keeps. This module computes those measures for
// any baked character, so accuracy can be argued from numbers
// against a reference rendition instead of from anyone's eye.

import polygonClipping from "polygon-clipping";

const { intersection } = polygonClipping;
import { multiPolygonArea } from "../bake.js";
import type { MultiPolygon, Pt } from "../types.js";

export interface GridAnalysis {
  /** Ink area, grid units². */
  area: number;
  /** Area-weighted centre of the ink. */
  centroid: Pt;
  /** Centroid offset from the grid centre, in grid units. */
  centroidOffset: Pt;
  /** Ink share of each quadrant: [top-left, top-right, bottom-left, bottom-right]. */
  quadrantShares: [number, number, number, number];
  /** Ink bounding box within the grid. */
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
  /** Margins between the ink bbox and the grid edges. */
  margins: { left: number; right: number; bottom: number; top: number };
}

type Ring = [number, number][];

function ringSignedArea(ring: Ring): number {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return a / 2;
}

function ringCentroid(ring: Ring, signedArea: number): Pt {
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const cross = ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    cx += (ring[i][0] + ring[i + 1][0]) * cross;
    cy += (ring[i][1] + ring[i + 1][1]) * cross;
  }
  return { x: cx / (6 * signedArea), y: cy / (6 * signedArea) };
}

/** Analyse a baked character (y-up grid coordinates) in its 田字格. */
export function analyzeGrid(ink: MultiPolygon, grid: number = 1024): GridAnalysis {
  let area = 0;
  let mx = 0;
  let my = 0;
  const bbox = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const poly of ink) {
    poly.forEach((ring, ri) => {
      const sa = ringSignedArea(ring as Ring);
      // Outer rings and holes carry opposite signs in source data;
      // treat the first ring as positive ink, the rest as holes.
      const signed = ri === 0 ? Math.abs(sa) : -Math.abs(sa);
      if (signed === 0) return;
      const c = ringCentroid(ring as Ring, sa);
      area += signed;
      mx += c.x * signed;
      my += c.y * signed;
      for (const [x, y] of ring) {
        if (x < bbox.minX) bbox.minX = x;
        if (y < bbox.minY) bbox.minY = y;
        if (x > bbox.maxX) bbox.maxX = x;
        if (y > bbox.maxY) bbox.maxY = y;
      }
    });
  }
  const centroid = area > 0 ? { x: mx / area, y: my / area } : { x: grid / 2, y: grid / 2 };
  const half = grid / 2;
  const quadRect = (x0: number, y0: number): MultiPolygon =>
    [[[[x0, y0], [x0 + half, y0], [x0 + half, y0 + half], [x0, y0 + half], [x0, y0]]]];
  const quads: MultiPolygon[] = [
    quadRect(0, half), // top-left (y-up)
    quadRect(half, half), // top-right
    quadRect(0, 0), // bottom-left
    quadRect(half, 0), // bottom-right
  ];
  const total = multiPolygonArea(ink);
  const shares = quads.map((q) => {
    const inter = intersection(ink, q);
    return total > 0 ? multiPolygonArea(inter as MultiPolygon) / total : 0;
  }) as [number, number, number, number];
  return {
    area: total,
    centroid,
    centroidOffset: { x: centroid.x - half, y: centroid.y - half },
    quadrantShares: shares,
    bbox,
    margins: {
      left: bbox.minX,
      right: grid - bbox.maxX,
      bottom: bbox.minY,
      top: grid - bbox.maxY,
    },
  };
}

/** Distance between two analyses' key measures — a proportion delta. */
export function gridDelta(a: GridAnalysis, b: GridAnalysis): {
  centroidDistance: number;
  quadrantShareDelta: number;
  areaRatio: number;
} {
  const centroidDistance = Math.hypot(
    a.centroid.x - b.centroid.x,
    a.centroid.y - b.centroid.y,
  );
  const quadrantShareDelta = Math.max(
    ...a.quadrantShares.map((s, i) => Math.abs(s - b.quadrantShares[i])),
  );
  return {
    centroidDistance,
    quadrantShareDelta,
    areaRatio: b.area > 0 ? a.area / b.area : 0,
  };
}
