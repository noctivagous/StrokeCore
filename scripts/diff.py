#!/usr/bin/env python3
"""Pixel-diff step 2: Harris ink mask vs my ink raster.

    python3 scripts/diff.py foundational a

Reads demo/diffs/<font>-<ch>-mine.png (from diff.mjs) and the exemplar
crop named in demo/diffs/<font>-<ch>-exemplar.json. Harris's ink is
extracted by colour scheme, its white removed (alpha = ink). Output
demo/diffs/<font>-<ch>.png: overlap = dark grey, Harris-only (my
misses) = crimson, mine-only (my excess) = blue. Prints IoU.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

font, ch = sys.argv[1], sys.argv[2]
base = os.path.join(os.path.dirname(__file__), "..", "demo", "diffs")
meta = json.load(open(os.path.join(base, f"{font}-{ch}-exemplar.json")))
exdir = os.path.join(os.path.dirname(__file__), "..", "demo", "overlays", "exemplars")
crop = np.asarray(Image.open(os.path.join(exdir, meta["cropFile"])).convert("RGB")).astype(int)
R, G, B = crop[:, :, 0], crop[:, :, 1], crop[:, :, 2]
if meta["scheme"] == "blue":
    # Harris's model ink is a muted slate blue (sampled (61,59,73)):
    # dark, with blue only slightly ahead. The strict mask used for
    # bbox extraction catches only the saturated fringe — for pixel
    # work the ink is: dark and blue-leaning.
    his = (R < 210) & (B > R + 4) & (B > G + 2)
else:  # crimson/red models (Imperial, Fraktur)
    his = (R > 110) & (R < 215) & (G < 85) & (R > G + 35) & (R > B + 25)

mine_rgba = np.asarray(Image.open(os.path.join(base, f"{font}-{ch}-mine.png")).convert("RGBA"))
mine = mine_rgba[:, :, 3] > 40
if mine.shape != his.shape:
    # resvg may pad by a pixel; crop to common size
    h = min(mine.shape[0], his.shape[0])
    w = min(mine.shape[1], his.shape[1])
    mine, his = mine[:h, :w], his[:h, :w]

both = his & mine
his_only = his & ~mine
mine_only = mine & ~his
iou = both.sum() / max(1, (his | mine).sum())
out = np.full((*his.shape, 3), 255, dtype=np.uint8)
out[both] = (70, 70, 70)
out[his_only] = (220, 20, 60)     # crimson: he has ink, I don't
out[mine_only] = (30, 90, 220)    # blue: I have ink, he doesn't
Image.fromarray(out).save(os.path.join(base, f"{font}-{ch}.png"))

# Side-by-side: his crop as printed beside my raster (black on white),
# equal height — the quick human check next to the measured diff.
his_img = Image.fromarray(np.where(his[..., None], crop, 255).astype(np.uint8))
mine_img = Image.new("RGB", (mine.shape[1], mine.shape[0]), (255, 255, 255))
mine_arr = np.full((*mine.shape, 3), 255, dtype=np.uint8)
mine_arr[mine] = (0, 0, 0)
mine_img = Image.fromarray(mine_arr)
H = max(his_img.height, mine_img.height)
scale = lambda im: im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
his_r, mine_r = scale(his_img), scale(mine_img)
from PIL import ImageDraw
side = Image.new("RGB", (his_r.width + 12 + mine_r.width, H + 16), (255, 255, 255))
side.paste(his_r, (0, 0))
side.paste(mine_r, (his_r.width + 12, 0))
draw = ImageDraw.Draw(side)
draw.text((2, H + 3), "HARRIS", fill=(120, 120, 120))
draw.text((his_r.width + 14, H + 3), "STROKECORE", fill=(120, 120, 120))
side.save(os.path.join(base, f"{font}-{ch}-side.png"))

score = {
    "glyph": ch,
    "iou": round(float(iou), 3),
    "hisPx": int(his.sum()),
    "minePx": int(mine.sum()),
    "missPx": int(his_only.sum()),
    "excessPx": int(mine_only.sum()),
    "exemplar": meta["cropFile"],
}
with open(os.path.join(base, f"{font}-{ch}-score.json"), "w") as fh:
    json.dump(score, fh, indent=1)
print(f"{ch}: IoU {iou:.3f}  his {his.sum()}px  mine {mine.sum()}px  miss {his_only.sum()}  excess {mine_only.sum()}")
