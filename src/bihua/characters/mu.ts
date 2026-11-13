// 木 (mù, "tree; wood") — stored as a COMPONENT: a construction in
// bihua, placed twice to assemble 林. Spines fitted from Make Me a
// Hanzi medians (hanzi-writer-data 2.0.1, Arphic), retrieved
// 2026-11-12; pressure authored. Note the 竖 (vertical) median runs
// below y=0 in the source data — the frame is the source's own.

import type { BihuaComponent } from "../components.js";

const fitted = "fitted-from-median" as const;

export const mu: BihuaComponent = {
  id: "mu",
  char: "木",
  pinyin: "mù",
  gloss: "tree; wood",
  source:
    "Component record; spines fitted from Make Me a Hanzi medians (hanzi-writer-data 2.0.1, Arphic); pressure authored 2026-11-12.",
  strokes: [
    {
      form: "heng",
      spine: [
        { x: 228, y: 534 }, { x: 280, y: 522 }, { x: 695, y: 584 }, { x: 728, y: 584 }, { x: 766, y: 574 },
      ],
      pressure: [0.75, 0.7, 0.7, 0.78, 0.85],
      segments: [{ bafa: "勒", form: "heng", span: [0, 4] }],
      provenance: fitted,
    },
    {
      form: "shu",
      spine: [
        { x: 453, y: 825 }, { x: 506, y: 771 }, { x: 498, y: 218 }, { x: 486, y: -29 },
      ],
      pressure: [0.85, 0.82, 0.78, 0.7],
      segments: [{ bafa: "努", form: "shu", span: [0, 3] }],
      provenance: fitted,
    },
    {
      form: "pie",
      spine: [
        { x: 474, y: 519 }, { x: 459, y: 504 }, { x: 447, y: 460 }, { x: 404, y: 389 },
        { x: 332, y: 297 }, { x: 244, y: 206 }, { x: 179, y: 154 }, { x: 130, y: 124 },
      ],
      pressure: [0.85, 0.8, 0.72, 0.6, 0.45, 0.3, 0.18, 0.1],
      segments: [{ bafa: "掠", form: "pie", span: [0, 7] }],
      provenance: fitted,
    },
    {
      form: "na",
      spine: [
        { x: 528, y: 513 }, { x: 549, y: 470 }, { x: 641, y: 344 }, { x: 749, y: 220 },
        { x: 789, y: 200 }, { x: 951, y: 159 },
      ],
      pressure: [0.45, 0.55, 0.68, 0.82, 0.92, 1.0],
      segments: [{ bafa: "磔", form: "na", span: [0, 5] }],
      provenance: fitted,
    },
  ],
};
