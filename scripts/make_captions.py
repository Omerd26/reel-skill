#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_captions.py plan.json outdir
מרנדר כל כרטיס כתובית כ-PNG שקוף עם Pillow + bidi, ופולט שרשרת overlay ל-ffmpeg.

למה PNG ולא libass: שליטה מלאה על עברית RTL, ועובד על כל התקנת ffmpeg
גם בלי libass. זו אותה גישה שכבר עובדת ב-carousel_generator_v3.py.
"""
import json, os, sys, glob
from PIL import Image, ImageDraw, ImageFont
from bidi.algorithm import get_display

W, H = 1080, 1920
BASELINE_Y = 1400          # מעל אזור הכפתורים (y>1480 מכוסה ע"י אינסטגרם)
SIDE_MARGIN = 110          # מרחק מטור הכפתורים בימין
FONT_SIZE = 66
LINE_GAP = 14
WHITE = (255, 255, 255, 255)
ORANGE = (224, 112, 30, 255)
STROKE = (0, 0, 0, 255)
STROKE_W = 5
MAX_CHARS = 34

FONT_DIRS = [
    os.path.join(os.path.dirname(__file__), "..", "assets", "fonts"),
    os.path.expanduser("~/Downloads/omer digital/instagram-automation/assets/fonts"),
    os.path.expanduser("~/Library/Fonts"), "/Library/Fonts", "/usr/share/fonts",
]


def find_font():
    """Gveret Levin אם קיים, אחרת Heebo ExtraBold, אחרת ברירת מחדל."""
    pats = ["*[Gg]veret*.ttf", "*[Gg]veret*.otf", "Heebo-ExtraBold.ttf", "Heebo-Black.ttf", "Heebo-Bold.ttf"]
    for pat in pats:
        for d in FONT_DIRS:
            d = os.path.abspath(d)
            if not os.path.isdir(d):
                continue
            hits = glob.glob(os.path.join(d, pat)) or glob.glob(os.path.join(d, "**", pat), recursive=True)
            if hits:
                return hits[0]
    return None


def shape(s: str) -> str:
    """סידור RTL לפני הציור. בלי זה העברית מתהפכת."""
    return get_display(s)


def wrap(text, font, draw, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(shape(t), font=font) <= maxw or not cur:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    return lines[:2]


def render_card(text, emph, font, path):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    maxw = W - 2 * SIDE_MARGIN
    lines = wrap(text, font, d, maxw)

    asc, desc = font.getmetrics()
    lh = asc + desc
    total = len(lines) * lh + (len(lines) - 1) * LINE_GAP
    y = BASELINE_Y - total

    for ln in lines:
        # ⚠️ bidi מופעל פעם אחת על השורה השלמה. לפצל קודם ואז להפעיל bidi
        # על כל חלק בנפרד הופך את העברית פעמיים ומקבלים ג'יבריש.
        vis = shape(ln)
        runs = [(vis, WHITE)]
        if emph:
            vis_e = shape(emph)
            i = vis.find(vis_e)
            if i >= 0:
                runs = [(vis[:i], WHITE), (vis_e, ORANGE), (vis[i + len(vis_e):], WHITE)]
                runs = [r for r in runs if r[0]]

        widths = [d.textlength(p, font=font) for p, _ in runs]
        # הרצים כבר בסדר ויזואלי — מציירים משמאל לימין
        x = (W - sum(widths)) / 2
        for (part, col), pw in zip(runs, widths):
            d.text((x, y), part, font=font, fill=col,
                   stroke_width=STROKE_W, stroke_fill=STROKE)
            x += pw
        y += lh + LINE_GAP

    img.save(path)


def build_map(cuts):
    segs, t = [], 0.0
    for c in sorted(cuts, key=lambda x: float(x["start"])):
        a, b = float(c["start"]), float(c["end"])
        if b > a:
            segs.append((a, b, t)); t += b - a
    return segs, t


def remap(t, segs):
    for a, b, o in segs:
        if a - 1e-6 <= t <= b + 1e-6:
            return o + (t - a)
    return None


def main():
    if len(sys.argv) < 3:
        print("usage: make_captions.py plan.json outdir", file=sys.stderr); sys.exit(1)
    plan = json.load(open(sys.argv[1], encoding="utf-8"))
    outdir = sys.argv[2]; os.makedirs(outdir, exist_ok=True)

    fp = find_font()
    if not fp:
        print("⚠️  לא נמצא פונט עברי. שים Heebo-ExtraBold.ttf ב-assets/fonts", file=sys.stderr)
        sys.exit(2)
    font = ImageFont.truetype(fp, FONT_SIZE)

    cuts = plan.get("cuts") or []
    segs, total = (build_map(cuts) if cuts else ([(0.0, 1e6, 0.0)], 1e6))

    entries, warns = [], []
    for i, c in enumerate(plan.get("captions") or []):
        txt = (c.get("text") or "").strip()
        if not txt:
            continue
        s, e = remap(float(c["start"]), segs), remap(float(c["end"]), segs)
        if s is None or e is None or e <= s:
            continue
        if len(txt) > MAX_CHARS:
            warns.append(f"  כרטיס {i+1}: {len(txt)} תווים — «{txt}»")
        p = os.path.join(outdir, f"cap_{i:03d}.png")
        render_card(txt, c.get("emph"), font, p)
        entries.append({"png": p, "start": round(s, 3), "end": round(e, 3)})

    json.dump(entries, open(os.path.join(outdir, "overlays.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    print(f"✅ {len(entries)} כרטיסים  ·  פונט: {os.path.basename(fp)}  ·  אורך פלט: {total:.2f}ש׳")
    print(f"   {outdir}/overlays.json")
    if warns:
        print(f"⚠️  {len(warns)} כרטיסים מעל {MAX_CHARS} תווים — לא ייקראו בזמן:")
        print("\n".join(warns))


if __name__ == "__main__":
    main()
