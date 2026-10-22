"""Draw the flat source illustrations that get turned into binary art.

Each subject is drawn in brand palette colors (with a lighter and darker shade
per color for lighting) on a transparent background, lit from the upper left.
Output: art-src/<name>.png. Replace any of these with a real photo or
illustration later; prepare-art.py handles both.
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "art-src"
OUT.mkdir(exist_ok=True)
S = 4  # supersample factor
W = H = 600

# token -> (light, base, dark) shades, light-mode values
C = {
    "ink":   ("#5a5a5a", "#2F2F2F", "#1c1c1c"),
    "sky":   ("#a9c8ec", "#6FA3DC", "#4f7fb8"),
    "field": ("#c2cf9c", "#9DAF6E", "#748550"),
    "coral": ("#f7b394", "#EF7A4F", "#c85a33"),
}


def canvas():
    img = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def box(x0, y0, x1, y1):
    return [x0 * S, y0 * S, x1 * S, y1 * S]


def save(img, name):
    img.resize((W, H), Image.LANCZOS).save(OUT / f"{name}.png")
    print("drew", name)


def plate(d, cx, cy, r, food=None):
    d.ellipse(box(cx - r, cy - r, cx + r, cy + r), fill=C["sky"][1])
    d.ellipse(box(cx - r * .78, cy - r * .78, cx + r * .78, cy + r * .78), fill=C["sky"][0])
    d.arc(box(cx - r, cy - r, cx + r, cy + r), 200, 290, fill=C["sky"][0], width=6 * S)
    if food:
        food(d, cx, cy, r)


def mug():
    img, d = canvas()
    d.ellipse(box(70, 470, 530, 560), fill=C["sky"][1])           # saucer
    d.ellipse(box(110, 482, 490, 540), fill=C["sky"][2])
    d.ellipse(box(370, 250, 520, 430), fill=C["coral"][1])         # handle
    d.ellipse(box(400, 285, 485, 395), fill=(0, 0, 0, 0))
    d.rounded_rectangle(box(130, 200, 420, 520), radius=40 * S, fill=C["coral"][1])
    d.rectangle(box(330, 230, 420, 500), fill=C["coral"][2])       # shade side
    d.rectangle(box(165, 240, 195, 470), fill=C["coral"][0])       # highlight
    d.ellipse(box(130, 170, 420, 240), fill=C["ink"][1])           # coffee
    d.ellipse(box(150, 182, 280, 215), fill=C["ink"][0])
    save(img, "mug")


def fruit_bowl():
    img, d = canvas()
    d.ellipse(box(150, 140, 300, 290), fill=C["coral"][1])         # orange
    d.ellipse(box(175, 165, 215, 205), fill=C["coral"][0])
    d.ellipse(box(280, 120, 430, 270), fill=C["field"][1])         # apple
    d.ellipse(box(305, 145, 345, 185), fill=C["field"][0])
    d.line(box(355, 125, 370, 85), fill=C["ink"][1], width=8 * S)
    for i, (x, y) in enumerate([(250, 210), (290, 230), (330, 215), (270, 250), (310, 255), (350, 245)]):
        d.ellipse(box(x, y, x + 50, y + 50), fill=C["sky"][2 if i % 2 else 1])  # keycap grapes
    d.chord(box(90, 140, 510, 520), 0, 180, fill=C["sky"][1])      # bowl
    d.chord(box(90, 300, 510, 520), 0, 180, fill=C["sky"][2])
    d.rectangle(box(220, 500, 380, 530), fill=C["sky"][2])
    d.rectangle(box(130, 340, 160, 420), fill=C["sky"][0])
    save(img, "fruit-bowl")


def board():
    img, d = canvas()
    d.rounded_rectangle(box(70, 260, 470, 500), radius=30 * S, fill=C["field"][1])   # board
    d.rounded_rectangle(box(470, 340, 560, 420), radius=30 * S, fill=C["field"][1])
    d.ellipse(box(505, 365, 535, 395), fill=(0, 0, 0, 0))
    d.rectangle(box(70, 450, 470, 500), fill=C["field"][2])
    for x in (140, 200, 260):                                       # carrot slices
        d.ellipse(box(x, 370, x + 50, 420), fill=C["coral"][1])
        d.ellipse(box(x + 15, 385, x + 35, 405), fill=C["coral"][0])
    d.polygon([(320 * S, 300 * S), (460 * S, 120 * S), (480 * S, 135 * S), (360 * S, 330 * S)], fill=C["sky"][1])  # knife blade
    d.polygon([(320 * S, 300 * S), (460 * S, 120 * S), (465 * S, 126 * S), (330 * S, 308 * S)], fill=C["sky"][0])
    d.rounded_rectangle(box(285, 315, 345, 345), radius=10 * S, fill=C["ink"][1])
    d.polygon([(290 * S, 320 * S), (230 * S, 400 * S), (255 * S, 415 * S), (340 * S, 335 * S)], fill=C["ink"][1])
    save(img, "board")


def dish():
    img, d = canvas()

    def food(d, cx, cy, r):
        d.ellipse(box(cx - 120, cy - 70, cx + 40, cy + 90), fill=C["coral"][1])
        d.ellipse(box(cx - 100, cy - 50, cx - 40, cy + 0), fill=C["coral"][0])
        for (x, y) in [(40, -90), (80, -40), (60, 20), (100, 40), (20, 70)]:
            d.ellipse(box(cx + x - 30, cy + y - 30, cx + x + 30, cy + y + 30), fill=C["field"][1 if x % 40 else 2])
    plate(d, 300, 300, 250, food)
    d.rounded_rectangle(box(20, 120, 40, 480), radius=8 * S, fill=C["ink"][1])     # fork
    d.rounded_rectangle(box(560, 120, 580, 480), radius=8 * S, fill=C["ink"][1])   # knife
    save(img, "dish")


def table():
    img, d = canvas()
    d.rounded_rectangle(box(40, 150, 560, 450), radius=24 * S, fill=C["field"][1])
    d.rectangle(box(40, 420, 560, 450), fill=C["field"][2])
    for cx in (130, 250, 370, 490):
        for cy, flip in ((215, 0), (385, 1)):
            if (cx // 120 + flip) % 2:
                plate(d, cx, cy, 52, lambda d, x, y, r: d.ellipse(box(x - 22, y - 18, x + 22, y + 18), fill=C["coral"][1]))
            else:
                plate(d, cx, cy, 52)
    d.ellipse(box(270, 270, 330, 330), fill=C["ink"][1])           # candle/vase centre
    d.ellipse(box(285, 280, 305, 300), fill=C["ink"][0])
    save(img, "table")


def jar():
    img, d = canvas()
    d.rounded_rectangle(box(150, 170, 450, 540), radius=60 * S, fill=C["sky"][1])
    d.rounded_rectangle(box(340, 200, 450, 520), radius=40 * S, fill=C["sky"][2])
    d.rounded_rectangle(box(180, 300, 420, 510), radius=40 * S, fill=C["coral"][1])  # jam
    d.rectangle(box(190, 230, 220, 480), fill=C["sky"][0])
    d.rounded_rectangle(box(170, 100, 430, 180), radius=16 * S, fill=C["ink"][1])     # sealed lid
    d.rectangle(box(170, 140, 430, 152), fill=C["ink"][0])
    d.rounded_rectangle(box(250, 370, 350, 450), radius=10 * S, fill=C["ink"][1])     # lock label
    d.arc(box(270, 320, 330, 400), 180, 360, fill=C["ink"][1], width=14 * S)
    save(img, "jar")


def bell():
    img, d = canvas()
    d.ellipse(box(60, 440, 540, 540), fill=C["ink"][1])            # base
    d.ellipse(box(90, 445, 510, 505), fill=C["ink"][0])
    d.chord(box(110, 170, 490, 650), 180, 360, fill=C["coral"][1])  # dome
    d.chord(box(330, 170, 490, 650), 270, 360, fill=C["coral"][2])
    d.chord(box(160, 230, 260, 560), 190, 250, fill=C["coral"][0])
    d.rectangle(box(285, 130, 315, 180), fill=C["ink"][1])          # plunger
    d.ellipse(box(255, 100, 345, 145), fill=C["ink"][1])
    save(img, "bell")


def empty_plate():
    img, d = canvas()
    plate(d, 300, 300, 240)
    for (x, y, r) in [(250, 260, 10), (330, 300, 7), (290, 350, 12), (360, 250, 6), (230, 330, 5)]:
        d.ellipse(box(x - r, y - r, x + r, y + r), fill=C["coral"][1])
    save(img, "empty-plate")


for f in (mug, fruit_bowl, board, dish, table, jar, bell, empty_plate):
    f()
