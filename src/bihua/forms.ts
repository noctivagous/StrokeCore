// 笔形 (bǐxíng, "stroke forms") — the named vocabulary of Chinese
// character strokes. The canonical core is 永字八法 (the eight methods
// of 永): every entry below that carries a `bafa` field is one of the
// eight, under its traditional method name. Compound forms written as
// single strokes (横折钩, 横撇) follow — they are compositions of the
// eight, listed because 笔顺 counts them as one stroke.

export interface BihuaForm {
  id: string;
  zh: string;
  pinyin: string;
  gloss: string;
  /** Traditional 永字八法 method name, for the canonical eight. */
  bafa?: string;
  /** Code in HanGlyph's 41-stroke taxonomy (docs/HANGLYPH.md), when the form is one of the 41. */
  hanglyph?: string;
  /** Typical pressure at entry / middle / exit, 0..1 — the form's 笔法 signature. */
  pressureSignature: [number, number, number];
  note: string;
}

export const BAFA_ORDER = ["侧", "勒", "努", "趯", "策", "掠", "啄", "磔"] as const;

export const FORMS: Record<string, BihuaForm> = {
  dian: {
    id: "dian", zh: "点", pinyin: "diǎn", gloss: "dot",
    hanglyph: "d",
    bafa: "侧",
    pressureSignature: [1.0, 0.8, 0.6],
    note: "A press and a short drag; in 永 it sits on top like a bird pecking (侧, 'inclined').",
  },
  heng: {
    id: "heng", zh: "横", pinyin: "héng", gloss: "horizontal",
    hanglyph: "h",
    bafa: "勒",
    pressureSignature: [0.75, 0.7, 0.85],
    note: "Written left to right with a rein-in (勒, as in bridling a horse): press at both ends, lighter between.",
  },
  shu: {
    id: "shu", zh: "竖", pinyin: "shù", gloss: "vertical",
    hanglyph: "s",
    bafa: "努",
    pressureSignature: [0.8, 0.8, 0.7],
    note: "A straight downward drive (努, 'exert force'); steady pressure, no sideways waver.",
  },
  gou: {
    id: "gou", zh: "钩", pinyin: "gōu", gloss: "hook",
    bafa: "趯",
    pressureSignature: [0.7, 0.5, 0.2],
    note: "The flick at a vertical's foot (趯, 'leap'): gather, then kick out and lift fast.",
  },
  ti: {
    id: "ti", zh: "提", pinyin: "tí", gloss: "rising flick",
    hanglyph: "t",
    bafa: "策",
    pressureSignature: [0.75, 0.5, 0.15],
    note: "A whip-crack upward to the right (策, the horsewhip): press in, lift out to a point.",
  },
  pie: {
    id: "pie", zh: "撇", pinyin: "piě", gloss: "left-fall",
    hanglyph: "p",
    bafa: "掠",
    pressureSignature: [0.85, 0.5, 0.1],
    note: "A long sweep down-left that thins to the tip (掠, 'skimming past').",
  },
  pieShort: {
    id: "pieShort", zh: "撇", pinyin: "piě", gloss: "short left-fall",
    bafa: "啄",
    pressureSignature: [0.85, 0.6, 0.2],
    note: "The short, quick left-fall (啄, a bird's peck) — same family as 掠, half the journey.",
  },
  na: {
    id: "na", zh: "捺", pinyin: "nà", gloss: "right-fall (press)",
    hanglyph: "n",
    bafa: "磔",
    pressureSignature: [0.45, 0.75, 1.0],
    note: "Down-right with growing pressure, ending in a flat heavy foot (磔, 'tearing open').",
  },
  zhe: {
    id: "zhe", zh: "折", pinyin: "zhé", gloss: "turn",
    pressureSignature: [0.8, 0.9, 0.8],
    note: "The corner where a stroke changes direction; the brush presses and turns on the spot. Not one of the eight — a joint between them.",
  },
  hengzhegou: {
    id: "hengzhegou", zh: "横折钩", pinyin: "héng-zhé-gōu", gloss: "horizontal, turn, hook",
    hanglyph: "j",
    pressureSignature: [0.75, 0.8, 0.2],
    note: "One written stroke composing 勒 (横) + 折 + 努 (竖) + 趯 (钩).",
  },
  hengpie: {
    id: "hengpie", zh: "横撇", pinyin: "héng-piě", gloss: "horizontal + left-fall",
    hanglyph: "k",
    pressureSignature: [0.7, 0.75, 0.1],
    note: "One written stroke composing a rising 横 (realising 策) + 掠 (撇).",
  },

  // — The rest of the 41-stroke taxonomy (HanGlyph codes; docs/HANGLYPH.md).
  // These complete the classifier's label set: each is one written stroke.
  zuodian: {
    id: "zuodian", zh: "左点", pinyin: "zuǒ-diǎn", gloss: "left dot",
    hanglyph: "D",
    pressureSignature: [1.0, 0.8, 0.6],
    note: "A dot that leans down-left, as at the start of 心.",
  },
  changdian: {
    id: "changdian", zh: "长点", pinyin: "cháng-diǎn", gloss: "long dot",
    hanglyph: "f",
    pressureSignature: [0.9, 0.8, 0.7],
    note: "An elongated dot, less curved than 点 — the last stroke of 不.",
  },
  piedian: {
    id: "piedian", zh: "撇点", pinyin: "piě-diǎn", gloss: "left-fall dot",
    hanglyph: "Z",
    pressureSignature: [0.9, 0.7, 0.5],
    note: "A short straight dot slanting down-left, as at the top right of 学.",
  },
  piezhedian: {
    id: "piezhedian", zh: "撇折点", pinyin: "piě-zhé-diǎn", gloss: "left-fall, turn, dot",
    hanglyph: "g",
    pressureSignature: [0.85, 0.8, 0.7],
    note: "A short 撇 turning into a 长点 — the first stroke of 女.",
  },
  dianti: {
    id: "dianti", zh: "点提", pinyin: "diǎn-tí", gloss: "dot + rise",
    hanglyph: "U",
    pressureSignature: [0.9, 0.6, 0.2],
    note: "A dot that lifts into a 提 — the last stroke of the water radical 氵's partner in 冰/清.",
  },
  hengzhe: {
    id: "hengzhe", zh: "横折", pinyin: "héng-zhé", gloss: "horizontal, turn down",
    hanglyph: "i",
    pressureSignature: [0.75, 0.9, 0.75],
    note: "横 turning sharply down into 竖 — one stroke, as in 口.",
  },
  henggou: {
    id: "henggou", zh: "横钩", pinyin: "héng-gōu", gloss: "horizontal + hook",
    hanglyph: "a",
    pressureSignature: [0.75, 0.8, 0.3],
    note: "横 ending in a short pointed hook down-left, as in 皮.",
  },
  hengzhewan: {
    id: "hengzhewan", zh: "横折弯", pinyin: "héng-zhé-wān", gloss: "horizontal, curved turn",
    hanglyph: "l",
    pressureSignature: [0.75, 0.85, 0.7],
    note: "横 bending (not breaking) down — the corner is curved, unlike 横折.",
  },
  hengzhewangou: {
    id: "hengzhewangou", zh: "横折弯钩", pinyin: "héng-zhé-wān-gōu", gloss: "horizontal, curved turn, hook",
    hanglyph: "m",
    pressureSignature: [0.75, 0.85, 0.3],
    note: "横折弯 ending in a hook — the enclosing stroke of 乙/吃-type forms.",
  },
  hengzhezhe: {
    id: "hengzhezhe", zh: "横折折", pinyin: "héng-zhé-zhé", gloss: "horizontal, turn, turn",
    hanglyph: "N",
    pressureSignature: [0.75, 0.85, 0.75],
    note: "横， down, 横 again — all straight, as in 凹.",
  },
  hengzhezhezhe: {
    id: "hengzhezhezhe", zh: "横折折折", pinyin: "héng-zhé-zhé-zhé", gloss: "horizontal, three turns",
    hanglyph: "L",
    pressureSignature: [0.75, 0.85, 0.8],
    note: "横 with three straight turns, as in 凸.",
  },
  hengzhezhegou: {
    id: "hengzhezhegou", zh: "横折折钩", pinyin: "héng-zhé-zhé-gōu", gloss: "horizontal, two turns, hook",
    hanglyph: "J",
    pressureSignature: [0.75, 0.85, 0.3],
    note: "横折折 ending in a hook, as in 乃/仍.",
  },
  hengzheti: {
    id: "hengzheti", zh: "横折提", pinyin: "héng-zhé-tí", gloss: "horizontal, turn, rise",
    hanglyph: "E",
    pressureSignature: [0.75, 0.85, 0.25],
    note: "横 down a step, then 提 up-right, as in 计.",
  },
  hengpiewangou: {
    id: "hengpiewangou", zh: "横撇弯钩", pinyin: "héng-piě-wān-gōu", gloss: "horizontal, left-fall curve, hook",
    hanglyph: "K",
    pressureSignature: [0.7, 0.6, 0.3],
    note: "横 into a curving 撇 that ends in a hook, as in 队.",
  },
  hengxiegou: {
    id: "hengxiegou", zh: "横斜钩", pinyin: "héng-xié-gōu", gloss: "horizontal + slant hook",
    hanglyph: "M",
    pressureSignature: [0.75, 0.6, 0.3],
    note: "横 curving down into a slanted hook, as in 飞/风.",
  },
  hengzhezhepie: {
    id: "hengzhezhepie", zh: "横折折撇", pinyin: "héng-zhé-zhé-piě", gloss: "horizontal, two turns, left-fall",
    hanglyph: "R",
    pressureSignature: [0.75, 0.85, 0.15],
    note: "横折折 ending in a pointed 撇， as in 廷/建.",
  },
  hengzhexie: {
    id: "hengzhexie", zh: "横折斜", pinyin: "héng-zhé-xié", gloss: "horizontal + slant",
    hanglyph: "F",
    pressureSignature: [0.75, 0.8, 0.4],
    note: "横 then a straight slant down-left, shorter than a 撇， as in 子/鱼.",
  },
  hengshuwangou: {
    id: "hengshuwangou", zh: "横竖弯钩", pinyin: "héng-shù-wān-gōu", gloss: "horizontal + vertical-curve hook",
    hanglyph: "o",
    pressureSignature: [0.75, 0.85, 0.3],
    note: "横 followed by a 竖弯钩 — one stroke, as in 九/几.",
  },
  shuzhe: {
    id: "shuzhe", zh: "竖折", pinyin: "shù-zhé", gloss: "vertical, turn right",
    hanglyph: "b",
    pressureSignature: [0.8, 0.9, 0.8],
    note: "竖 turning sharply right into 横 — the corner is a right angle, as in 山.",
  },
  shuwan: {
    id: "shuwan", zh: "竖弯", pinyin: "shù-wān", gloss: "vertical, curved turn",
    hanglyph: "c",
    pressureSignature: [0.8, 0.85, 0.75],
    note: "竖 bending right — the corner is curved, unlike 竖折； as in 四.",
  },
  shuwangou: {
    id: "shuwangou", zh: "竖弯钩", pinyin: "shù-wān-gōu", gloss: "vertical curve + hook",
    hanglyph: "w",
    pressureSignature: [0.8, 0.85, 0.3],
    note: "竖弯 ending in an upright hook, as in 见/儿.",
  },
  shuti: {
    id: "shuti", zh: "竖提", pinyin: "shù-tí", gloss: "vertical + rise",
    hanglyph: "e",
    pressureSignature: [0.8, 0.7, 0.2],
    note: "竖 lifting into a 提 at its foot, as in 衣/根.",
  },
  shugou: {
    id: "shugou", zh: "竖钩", pinyin: "shù-gōu", gloss: "vertical + hook",
    hanglyph: "S",
    pressureSignature: [0.8, 0.75, 0.2],
    note: "竖 ending in the 趯 leap — the hook at a vertical's foot, as in 丁/寸.",
  },
  shuzhezhe: {
    id: "shuzhezhe", zh: "竖折折", pinyin: "shù-zhé-zhé", gloss: "vertical, two turns",
    hanglyph: "B",
    pressureSignature: [0.8, 0.85, 0.75],
    note: "竖， 横， 竖 — all straight, as in 鼎.",
  },
  shuzhezhegou: {
    id: "shuzhezhegou", zh: "竖折折钩", pinyin: "shù-zhé-zhé-gōu", gloss: "vertical, two turns, hook",
    hanglyph: "C",
    pressureSignature: [0.8, 0.85, 0.3],
    note: "竖折折 ending in a hook, as in 马/弓.",
  },
  shuzhepie: {
    id: "shuzhepie", zh: "竖折撇", pinyin: "shù-zhé-piě", gloss: "vertical, turn, left-fall",
    hanglyph: "Q",
    pressureSignature: [0.8, 0.85, 0.15],
    note: "竖折 ending in a 撇， as in 专.",
  },
  pingpie: {
    id: "pingpie", zh: "平撇", pinyin: "píng-piě", gloss: "flat left-fall",
    hanglyph: "P",
    pressureSignature: [0.85, 0.55, 0.15],
    note: "A shallow, wide 撇 — its width far exceeds its height, as in 看.",
  },
  shupie: {
    id: "shupie", zh: "竖撇", pinyin: "shù-piě", gloss: "vertical left-fall",
    hanglyph: "q",
    pressureSignature: [0.85, 0.55, 0.12],
    note: "A steep, narrow 撇 — its height far exceeds its width, as in 月.",
  },
  piezhe: {
    id: "piezhe", zh: "撇折", pinyin: "piě-zhé", gloss: "left-fall, turn",
    hanglyph: "r",
    pressureSignature: [0.85, 0.8, 0.5],
    note: "撇 turning into a 提-like rise, as in 么/丝.",
  },
  pingna: {
    id: "pingna", zh: "平捺", pinyin: "píng-nà", gloss: "flat right-fall",
    hanglyph: "v",
    pressureSignature: [0.45, 0.7, 0.95],
    note: "A shallow, wide 捺 — it can stretch to underlie other parts, as in 走.",
  },
  wangou: {
    id: "wangou", zh: "弯钩", pinyin: "wān-gōu", gloss: "curved hook",
    hanglyph: "X",
    pressureSignature: [0.8, 0.6, 0.25],
    note: "A long curving stroke ending in a hook — the spine of 狗/家's radical.",
  },
  xiegou: {
    id: "xiegou", zh: "斜钩", pinyin: "xié-gōu", gloss: "slant hook",
    hanglyph: "Y",
    pressureSignature: [0.7, 0.65, 0.3],
    note: "A curved slant down-right ending in an upright hook, as in 我/气.",
  },
  wogou: {
    id: "wogou", zh: "卧钩", pinyin: "wò-gōu", gloss: "lying hook",
    hanglyph: "W",
    pressureSignature: [0.8, 0.65, 0.3],
    note: "A shallow lying curve ending in a hook — the heart's base in 心/感.",
  },
};

export function formById(id: string): BihuaForm {
  const f = FORMS[id];
  if (!f) throw new Error(`unknown bihua form: ${id}`);
  return f;
}

/** The 41 forms of the standard stroke taxonomy (HanGlyph codes), in table order. */
export function taxonomyForms(): BihuaForm[] {
  return Object.values(FORMS).filter((f) => f.hanglyph !== undefined);
}

/** The eight canonical forms, in 永字八法 order. */
export function bafaForms(): BihuaForm[] {
  return BAFA_ORDER.map((b) => {
    const f = Object.values(FORMS).find((x) => x.bafa === b);
    if (!f) throw new Error(`no form realises bafa ${b}`);
    return f;
  });
}
