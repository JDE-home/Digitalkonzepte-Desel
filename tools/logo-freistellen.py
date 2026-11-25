"""Stellt das Logo (tools/logo-quelle.webp, weißer Hintergrund) frei.

Jedes Pixel wird der nächsten Logo-Farbe zugeordnet; die Deckkraft ergibt sich aus dem Abstand zu Weiß.
Aufruf: python3 -I tools/logo-freistellen.py   (braucht numpy und Pillow)
Ergebnis: assets/img/logo.png (Wortmarke, transparent) und assets/img/logo-mark.png (nur das Zeichen, quadratisch).
"""
import numpy as np
from PIL import Image

SRC = "tools/logo-quelle.webp"
COLORS = {  # aus dem Logo gemessen
    "gruen": (0, 63, 44),
    "salbei": (132, 163, 143),
    "kupfer": (191, 129, 85),
    "sand": (180, 168, 154),
}
im = np.asarray(Image.open(SRC).convert("RGB")).astype(float)
white = np.array([255.0, 255.0, 255.0])
best_t = np.zeros(im.shape[:2]); best_err = np.full(im.shape[:2], 1e9); best_c = np.zeros(im.shape)
for c in COLORS.values():
    c = np.array(c, float); d = c - white
    t = np.clip(((im - white) @ d) / (d @ d), 0, 1)
    proj = white + t[..., None] * d
    err = ((im - proj) ** 2).sum(-1)
    m = err < best_err
    best_err = np.where(m, err, best_err); best_t = np.where(m, t, best_t); best_c = np.where(m[..., None], c, best_c)
alpha = np.where(best_t < 0.04, 0, np.where(best_t > 0.96, 1, best_t))
rgba = np.dstack([best_c, alpha * 255]).astype(np.uint8)
img = Image.fromarray(rgba, "RGBA")
bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
logo = img.crop(bbox)
print("Logo-Ausschnitt:", bbox, logo.size)
logo.save("assets/img/logo-full.png")
w = 960; logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS).save("assets/img/logo.png", optimize=True)
# Zeichen: linker Teil bis zum Ende der Rundung
a = np.asarray(img.getchannel("A")); cols = np.where((a > 8).any(0))[0]
gaps = np.where(np.diff(cols) > 40)[0]
mark_x1 = cols[gaps[0]] + 1 if len(gaps) else cols[-1]
mark = img.crop((cols[0], bbox[1], mark_x1, bbox[3]))
print("Zeichen:", (cols[0], bbox[1], mark_x1, bbox[3]), mark.size)
side = max(mark.size); sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
sq.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2))
sq.resize((512, 512), Image.LANCZOS).save("assets/img/logo-mark.png", optimize=True)
# Geometrie der Flächen für den SVG-Nachbau
lab = np.zeros(a.shape, int)
for i, c in enumerate(COLORS.values(), 1):
    pass
