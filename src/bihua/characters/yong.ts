// 永 (yǒng, "forever; eternal") — the pilot character (F1).
//
// Spines are FITTED FROM MEDIAN data: the per-stroke centreline
// polylines of hanzi-writer-data 2.0.1 (Make Me a Hanzi, Arphic Public
// License), retrieved 2026-11-12. They are estimates, recorded as such
// per stroke — not transcriptions. Pressure profiles and the 八法
// segment mapping are AUTHORED for this record （笔法 layer).

import type { BihuaCharacter } from "../types.js";

const fitted = "fitted-from-median" as const;

export const yong: BihuaCharacter = {
  char: "永",
  pinyin: "yǒng",
  gloss: "forever; eternal (originally: long, of flowing water)",
  grid: 1024,
  pressureProvenance: "authored",
  source:
    "Spines fitted from Make Me a Hanzi medians (hanzi-writer-data 2.0.1, Arphic); pressure + segment mapping authored 2026-11-12.",
  strokes: [
    {
      form: "dian",
      spine: [
        { x: 428, y: 824 }, { x: 503, y: 781 }, { x: 533, y: 756 }, { x: 539, y: 741 },
      ],
      pressure: [1.0, 0.85, 0.7, 0.6],
      segments: [{ bafa: "侧", form: "dian", span: [0, 3] }],
      provenance: fitted,
    },
    {
      form: "hengzhegou",
      spine: [
        { x: 309, y: 579 }, { x: 358, y: 580 }, { x: 462, y: 613 }, { x: 482, y: 608 },
        { x: 508, y: 581 }, { x: 505, y: 121 }, { x: 500, y: 59 }, { x: 478, y: 24 },
        { x: 355, y: 78 },
      ],
      pressure: [0.75, 0.7, 0.72, 0.85, 0.8, 0.78, 0.75, 0.7, 0.25],
      segments: [
        { bafa: "勒", form: "heng", span: [0, 3] },
        { bafa: "努", form: "shu", span: [3, 7] },
        { bafa: "趯", form: "gou", span: [7, 8] },
      ],
      provenance: fitted,
    },
    {
      form: "hengpie",
      spine: [
        { x: 110, y: 391 }, { x: 149, y: 384 }, { x: 198, y: 387 }, { x: 322, y: 418 },
        { x: 339, y: 417 }, { x: 367, y: 402 }, { x: 345, y: 333 }, { x: 273, y: 208 },
        { x: 201, y: 129 }, { x: 125, y: 78 },
      ],
      pressure: [0.7, 0.68, 0.68, 0.72, 0.75, 0.8, 0.62, 0.45, 0.28, 0.12],
      segments: [
        { bafa: "策", form: "heng", span: [0, 5] },
        { bafa: "掠", form: "pie", span: [5, 9] },
      ],
      provenance: fitted,
    },
    {
      form: "pie",
      spine: [
        { x: 725, y: 621 }, { x: 743, y: 596 }, { x: 749, y: 578 }, { x: 743, y: 570 },
        { x: 656, y: 489 }, { x: 569, y: 421 }, { x: 569, y: 415 },
      ],
      pressure: [0.85, 0.8, 0.78, 0.72, 0.5, 0.3, 0.18],
      segments: [{ bafa: "啄", form: "pieShort", span: [0, 6] }],
      provenance: fitted,
    },
    {
      form: "na",
      spine: [
        { x: 532, y: 441 }, { x: 551, y: 399 }, { x: 568, y: 378 }, { x: 678, y: 259 },
        { x: 750, y: 194 }, { x: 801, y: 163 }, { x: 954, y: 145 },
      ],
      pressure: [0.45, 0.55, 0.62, 0.78, 0.88, 0.95, 1.0],
      segments: [{ bafa: "磔", form: "na", span: [0, 6] }],
      provenance: fitted,
    },
  ],
};
