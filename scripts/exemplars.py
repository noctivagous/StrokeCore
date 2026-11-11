#!/usr/bin/env python3
"""Extract exemplar letter crops from the Harris page renders.

Detection is by connected components of coloured ink (blue/navy model
letters, pink ductus decompositions), grouped into letters: a small
component sitting above a larger one is a dot (Harris dots his i and
j); components in a row within 25px merge (a letter whose printed
strokes don't quite touch); ductus decompositions print stroke 1 in
isolation beside the assembled letter, so when units outnumber
letters they are paired and the assembled (right) unit is used.

Usage: exemplars.py <page.png> <letters> <outdir> <tag> [mx0 mx1 dx0 dx1]
"""
import json, os, sys
from PIL import Image
import numpy as np
from scipy import ndimage

page_path, outdir, tag = sys.argv[1], sys.argv[3], sys.argv[4]
letters = sys.argv[2].split(",") if "," in sys.argv[2] else list(sys.argv[2])
cols = [float(v) for v in sys.argv[5:9]] if len(sys.argv) > 8 else [0.545, 0.665, 0.70, 0.905]
scheme = sys.argv[9] if len(sys.argv) > 9 else "foundational"
img = Image.open(page_path).convert("RGB")
W, H = img.size
a = np.asarray(img).astype(int)
R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]

if scheme == "fraktur":
    # Models are dark red; decompositions pink and purple.
    blue = (R > 110) & (R > G + 35) & (R > B + 25)
    pink = ((R > 150) & (B > 90) & (R > G + 30)) | ((B > 100) & (B > R + 20) & (R > 60) & (G < R))
elif scheme == "imperial":
    # Models deep red; decompositions in many saturated colours.
    blue = (R > 110) & (R < 215) & (G < 85) & (R > G + 35) & (R > B + 25)
    mx = np.maximum(np.maximum(R, G), B)
    mn = np.minimum(np.minimum(R, G), B)
    deep_red = (R > 110) & (G < 85) & (R > G + 35) & (R > B + 25)
    pink = ((mx - mn) > 70) & (mx < 250) & ~deep_red
else:
    blue = (B > 55) & (B > R + 15) & (B > G + 8) & (R < 150)
    pink = (R > 150) & (B > 90) & (R > G + 30)

def units_for(mask, x0, x1, merge_gap=25):
    sub = mask[:, x0:x1]
    lab, n = ndimage.label(sub, structure=np.ones((3, 3), int))
    comps = []
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        if sl is None:
            continue
        area = int((lab[sl] == i).sum())
        if area < 120:
            continue
        ys, xs = sl
        comps.append([x0 + xs.start, ys.start, x0 + xs.stop - 1, ys.stop - 1, area])
    # Dots: merge a small comp directly above a larger one (x-overlap).
    comps.sort(key=lambda c: c[1])
    merged = True
    while merged:
        merged = False
        for i, c in enumerate(comps):
            for j, d in enumerate(comps):
                if i == j:
                    continue
                xover = min(c[2], d[2]) - max(c[0], d[0])
                is_dot = (c[3] - c[1]) < 45 and (c[2] - c[0]) < 62 and c[4] < 0.3 * d[4]
                if is_dot and xover > 0.5 * min(c[2] - c[0], d[2] - d[0]) and 0 < d[1] - c[3] < 95:
                    d[0], d[1] = min(c[0], d[0]), min(c[1], d[1])
                    d[2], d[3] = max(c[2], d[2]), max(c[3], d[3])
                    d[4] += c[4]
                    comps.pop(i)
                    merged = True
                    break
            if merged:
                break
    # Rows by y-centre proximity (median height scale).
    comps.sort(key=lambda c: (c[1] + c[3]) / 2)
    rows = []
    for c in comps:
        cy = (c[1] + c[3]) / 2
        placed = False
        for row in rows:
            rcy = sum((r[1] + r[3]) / 2 for r in row) / len(row)
            if abs(cy - rcy) < 110:
                row.append(c)
                placed = True
                break
        if not placed:
            rows.append([c])
    units = []
    for row in rows:
        row.sort(key=lambda c: c[0])
        cur = None
        for c in row:
            if cur is not None and c[0] - cur[2] < merge_gap:
                cur[0] = min(cur[0], c[0]); cur[1] = min(cur[1], c[1])
                cur[2] = max(cur[2], c[2]); cur[3] = max(cur[3], c[3])
            else:
                if cur:
                    units.append(cur)
                cur = list(c)
        if cur:
            units.append(cur)
    return [u[:4] for u in units]

os.makedirs(outdir, exist_ok=True)
# Hand-verified corrections where automatic grouping mis-boxes a letter
# (fnd45L r: the shoulder is a detached component the grouper drops).
OVERRIDES = {("fnd45L", "r", "model"): [136, 1711, 228, 1800]}
# Fraktur p.76: adjacent model forms (a pair, i/j) bridge in the red
# mask and merge; hand-split from a verified detection pass.
for _k, _b in {
    "a": [956, 193, 1030, 297], "a2": [1050, 192, 1124, 302],
    "b": [955, 377, 1024, 518], "c": [957, 627, 1014, 733],
    "d": [955, 808, 1031, 949], "e": [954, 1056, 1007, 1170],
    "f": [953, 1245, 1027, 1426], "g": [957, 1483, 1057, 1636],
    "h": [954, 1659, 1026, 1811], "i": [953, 1876, 988, 2026],
    "j": [1008, 1876, 1045, 2076],
}.items():
    OVERRIDES[("fk76", _k, "model")] = _b
# Imperial: p.113's inset serif diagram pollutes A's row; p.114's F and
# L merge; p.115's H and J merge. Hand-set from verified detections.
for _tag, _k, _b in [
    ("ic1", "A", [77, 153, 524, 633]), ("ic1", "B", [79, 854, 390, 1336]),
    ("ic1", "C", [41, 1571, 459, 2052]),
    ("ic2", "F", [402, 885, 655, 1359]), ("ic2", "L", [680, 885, 1046, 1359]),
    ("ic2", "G", [92, 1568, 550, 2046]),
    ("ic3", "H", [69, 165, 425, 641]), ("ic3", "J", [392, 165, 537, 641]),
    ("ic3", "K", [107, 888, 542, 1361]), ("ic3", "M", [107, 1578, 611, 2056]),
    ("ic4", "P", [117, 1585, 402, 2054]),
]:
    OVERRIDES[(_tag, _k, "model")] = _b
result = {}
for name, mask, (fx0, fx1) in [("model", blue, (cols[0], cols[1])), ("ductus", pink, (cols[2], cols[3]))]:
    x0, x1 = int(W * fx0), int(W * fx1)
    gap = 12 if (scheme == "fraktur" and name == "model") else 25
    units = units_for(mask, x0, x1, gap)
    print(tag, name, "units:", len(units), "letters:", len(letters))
    assign = units
    if name == "ductus" and len(units) > len(letters):
        assign, i = [], 0
        while i < len(units) and len(assign) < len(letters):
            if i + 1 < len(units) and abs(((units[i + 1][1] + units[i + 1][3]) / 2) - ((units[i][1] + units[i][3]) / 2)) < 60:
                assign.append(units[i + 1])
                i += 2
            else:
                assign.append(units[i])
                i += 1
    for i, ch in enumerate(letters):
        if (tag, ch, name) not in OVERRIDES and i >= len(assign):
            break
        bb = OVERRIDES.get((tag, ch, name), assign[i] if i < len(assign) else None)
        if bb is None:
            continue
        pad = 26
        crop_box = [max(0, bb[0] - pad), max(0, bb[1] - pad), min(W, bb[2] + pad), min(H, bb[3] + pad)]
        crop = img.crop(crop_box)
        fname = f"{tag}-{ch}-{name}.png"
        crop.save(os.path.join(outdir, fname))
        result.setdefault(ch, {})[name] = {"page": page_path, "bbox": bb, "crop": crop_box, "file": fname}
        print(" ", ch, name, bb)
with open(os.path.join(outdir, f"{tag}-map.json"), "w") as f:
    json.dump(result, f, indent=1)
