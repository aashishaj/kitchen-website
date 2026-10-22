"""Turn source images (art-src/*.png) into binary-art grids (public/art/*.json).

Steps, per the brief: remove background, crop with breathing room, boost
contrast, snap each pixel to the nearest brand palette color, run Sobel edge
detection, then resize to a grid of cells about 0.6 wide by 1 tall.

Output JSON (compact, one character per cell, row-major):
  cols, rows   grid size
  tokens       palette token names; colors are resolved from CSS at runtime
  c            "1" dense, "0" mid tone, " " background
  k            token index per cell
  o            opacity level 0-9 (maps to 0.35-0.9)
  e            "1" on outlines
Run with: python3 scripts/prepare-art.py [name ...]
"""
import json
import random
import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art-src"
OUT = ROOT / "public" / "art"
OUT.mkdir(parents=True, exist_ok=True)

# Columns per piece: the smallest grid that still reads.
COLS = {"mug": 64, "table": 72}
DEFAULT_COLS = 60
CELL_ASPECT = 0.6  # cell width / height

TOKENS = ["ink", "sky", "field", "coral"]
# light-mode shades per token: light, base, dark
SHADES = {
    "ink": ["#5a5a5a", "#2F2F2F", "#1c1c1c"],
    "sky": ["#a9c8ec", "#6FA3DC", "#4f7fb8"],
    "field": ["#c2cf9c", "#9DAF6E", "#748550"],
    "coral": ["#f7b394", "#EF7A4F", "#c85a33"],
}


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


PALETTE = [(t, i, rgb(h)) for t in TOKENS for i, h in enumerate(SHADES[t])]


def snap(px):
    """Nearest palette shade -> (token index, shade 0 light..2 dark)."""
    best = min(PALETTE, key=lambda p: sum((a - b) ** 2 for a, b in zip(px, p[2])))
    return TOKENS.index(best[0]), best[1]


def remove_background(img):
    img = img.convert("RGBA")
    if img.getextrema()[3][0] < 255:
        return img  # already has transparency
    # Flood out a plain background: anything close to the corner color.
    bg = img.getpixel((0, 0))[:3]
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) < 30:
                px[x, y] = (r, g, b, 0)
    return img


def crop(img, pad=0.06):
    x0, y0, x1, y1 = img.getchannel("A").point(lambda a: 255 if a > 40 else 0).getbbox()
    p = int(max(x1 - x0, y1 - y0) * pad)
    return img.crop((max(0, x0 - p), max(0, y0 - p), min(img.width, x1 + p), min(img.height, y1 + p)))


def sobel(gray):
    kx = ImageFilter.Kernel((3, 3), [-1, 0, 1, -2, 0, 2, -1, 0, 1], 1, 128)
    ky = ImageFilter.Kernel((3, 3), [-1, -2, -1, 0, 0, 0, 1, 2, 1], 1, 128)
    gx, gy = gray.filter(kx), gray.filter(ky)
    w, h = gray.size
    a, b = gx.load(), gy.load()
    out = Image.new("L", gray.size)
    o = out.load()
    for y in range(h):
        for x in range(w):
            o[x, y] = min(255, int((abs(a[x, y] - 128) ** 2 + abs(b[x, y] - 128) ** 2) ** 0.5 * 2))
    return out


def prepare(name):
    img = crop(remove_background(Image.open(SRC / f"{name}.png")))
    rgb_img = ImageEnhance.Contrast(img.convert("RGB")).enhance(1.1)
    alpha = img.getchannel("A")

    cols = COLS.get(name, DEFAULT_COLS)
    rows = round(cols * img.height / img.width * CELL_ASPECT)

    # Edges on a mid-size copy: outlines of the silhouette and between colors.
    mid = (cols * 4, rows * 4)
    edge_src = Image.composite(rgb_img.convert("L"), Image.new("L", img.size, 255), alpha)
    edges = sobel(edge_src.resize(mid, Image.LANCZOS)).resize((cols, rows), Image.BOX)

    small = rgb_img.resize((cols, rows), Image.LANCZOS)
    small_a = alpha.resize((cols, rows), Image.BOX)

    rng = random.Random(name)
    c, k, o, e = [], [], [], []
    for y in range(rows):
        for x in range(cols):
            if small_a.getpixel((x, y)) < 110:
                c.append(" "); k.append("0"); o.append("0"); e.append("0")
                continue
            ti, shade = snap(small.getpixel((x, y)))
            is_edge = edges.getpixel((x, y)) > 70
            # Darker shades are denser; highlights stay light so the object looks lit.
            density = {0: 0.25, 1: 0.7, 2: 0.95}[shade]
            c.append("1" if is_edge or rng.random() < density else "0")
            k.append(str(ti))
            o.append(str(round(density * 9)))
            e.append("1" if is_edge else "0")

    data = {"cols": cols, "rows": rows, "tokens": TOKENS,
            "c": "".join(c), "k": "".join(k), "o": "".join(o), "e": "".join(e)}
    (OUT / f"{name}.json").write_text(json.dumps(data, separators=(",", ":")))
    filled = sum(ch != " " for ch in c)
    print(f"{name}: {cols}x{rows}, {filled} cells")


names = sys.argv[1:] or sorted(p.stem for p in SRC.glob("*.png"))
for n in names:
    prepare(n)
