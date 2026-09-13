#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_captions.py <captions.json | plan.json> <outdir>
מרנדר כל כרטיס כתובית כ-PNG שקוף עם Pillow + bidi, וכותב outdir/overlays.json.

מקבל שני פורמטים:
  • work/captions.json (groups) — הפורמט המשותף לשני המסלולים, בציר הערוך. בלי remap.
  • plan.json ישן ({cuts, captions}) — הזמנים בציר הגולמי, והסקריפט ממפה לפי cuts.

למה PNG ולא libass: שליטה מלאה על עברית RTL, ועובד על כל התקנת ffmpeg
גם בלי libass.
"""
import glob
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont
from bidi.algorithm import get_display

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

W, H = 1080, 1920
BASELINE_Y = 1400          # מעל אזור הכפתורים (y>1480 מכוסה ע"י אינסטגרם)
SIDE_MARGIN = 110          # מרחק מטור הכפתורים בימין
FONT_SIZE = 66
MIN_FONT_SIZE = 52
LINE_GAP = 14
WHITE = (255, 255, 255, 255)
ORANGE = (224, 112, 30, 255)
STROKE = (0, 0, 0, 255)
STROKE_W = 5
MAX_CHARS = 34
HOOK_SIZE = 92
HOOK_TOP = 300

FONT_DIRS = [
    os.path.join(os.path.dirname(__file__), "..", "assets", "fonts"),
    os.path.expanduser("~/Library/Fonts"), "/Library/Fonts", "/usr/share/fonts",
]


def find_font():
    """הפונט המצורף לסקיל קודם לכל — כך הפלט זהה אצל כל משתמש.
    אפשר לעקוף עם משתנה סביבה: REEL_FONT=/path/to/font.ttf"""
    override = os.environ.get("REEL_FONT")
    if override and os.path.isfile(override):
        return override

    bundled = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "fonts"))
    pats = ["*[Gg]veret*.ttf", "*[Gg]veret*.otf", "Heebo-ExtraBold.ttf",
            "Heebo-Black.ttf", "Heebo-Bold.ttf"]
    for pat in pats:
        hits = glob.glob(os.path.join(bundled, pat))
        if hits:
            return sorted(hits)[0]
    for pat in pats:
        for d in FONT_DIRS:
            d = os.path.abspath(d)
            if not os.path.isdir(d) or d == bundled:
                continue
            hits = glob.glob(os.path.join(d, pat)) or glob.glob(os.path.join(d, "**", pat), recursive=True)
            if hits:
                return sorted(hits)[0]
    return None


def load_font(fp, size):
    # ⚠️ layout_engine=BASIC הוא קריטי ולא אופציונלי:
    # get_display() כבר מחזיר טקסט בסדר ויזואלי. אם Pillow הותקן עם RAQM
    # הוא יפעיל BiDi בעצמו על טקסט שכבר הפוך — היפוך כפול = ג'יבריש.
    try:
        return ImageFont.truetype(fp, size, layout_engine=ImageFont.Layout.BASIC)
    except Exception:
        return ImageFont.truetype(fp, size)


def shape(s: str) -> str:
    """סידור RTL לפני הציור. בלי זה העברית מתהפכת."""
    return get_display(s)


def wrap(words, font, draw, maxw, break_after=None):
    """שורות לפי רוחב אמיתי. break_after (אינדקס מילה) קובע שבירה מפורשת."""
    lines, cur = [], []
    for i, w in enumerate(words):
        t = " ".join(cur + [w])
        if cur and draw.textlength(shape(t), font=font) > maxw:
            lines.append(cur)
            cur = []
        cur.append(w)
        if break_after is not None and i == break_after and i < len(words) - 1:
            lines.append(cur)
            cur = []
    if cur:
        lines.append(cur)
    return [" ".join(x) for x in lines]


def draw_line(d, vis, y, font, emph_vis, fill=WHITE, accent=ORANGE, stroke=STROKE_W):
    runs = [(vis, fill)]
    if emph_vis:
        i = vis.find(emph_vis)
        if i >= 0:
            runs = [(vis[:i], fill), (emph_vis, accent), (vis[i + len(emph_vis):], fill)]
            runs = [r for r in runs if r[0]]
    # מודדים לפי מיקום מצטבר בשורה השלמה — כך רווח בקצה רץ לא נבלע
    full_w = d.textlength(vis, font=font)
    x0 = (W - full_w) / 2
    acc = ""
    for part, col in runs:
        px = x0 + d.textlength(acc, font=font)
        d.text((px, y), part, font=font, fill=col, stroke_width=stroke, stroke_fill=STROKE)
        acc += part
    return full_w


def render_card(text, emph, fp_or_font, path, break_after=None, words=None, baseline_y=BASELINE_Y):
    """מחזיר את מספר השורות וגודל הפונט שבו השתמש (מקטין במקום לחתוך שורה שלישית)."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    maxw = W - 2 * SIDE_MARGIN
    words = words or text.split()
    fp = fp_or_font if isinstance(fp_or_font, str) else getattr(fp_or_font, "path", None)
    size = FONT_SIZE
    font = load_font(fp, size) if fp else fp_or_font
    lines = wrap(words, font, d, maxw, break_after)
    while (len(lines) > 2 or any(d.textlength(shape(ln), font=font) > maxw for ln in lines)) \
            and fp and size > MIN_FONT_SIZE:
        size -= 4
        font = load_font(fp, size)
        lines = wrap(words, font, d, maxw, break_after)

    asc, desc = font.getmetrics()
    lh = asc + desc
    total = len(lines) * lh + (len(lines) - 1) * LINE_GAP
    y = baseline_y - total
    for ln in lines:
        # ⚠️ bidi מופעל פעם אחת על השורה השלמה, ואז מחפשים את המילה המודגשת בטקסט הוויזואלי.
        vis = shape(ln)
        emph_vis = shape(emph) if emph and emph in ln.split() else None
        draw_line(d, vis, y, font, emph_vis)
        y += lh + LINE_GAP
    img.save(path)
    return len(lines), size


def render_hook(hook, fp, path):
    """הוק כתוב לשליש העליון (המסלול המהיר). אותו תוכן כמו ב-Remotion."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    size = HOOK_SIZE
    from reelkit.captions import protect_bonds
    # bonded pairs travel as one token ("לעשרת אלפים" never splits across lines)
    words = protect_bonds(hook["text"]).split(" ")
    font = load_font(fp, size)
    lines = wrap(words, font, d, W - 160)
    while len(lines) > 3 and size > 60:
        size -= 6
        font = load_font(fp, size)
        lines = wrap(words, font, d, W - 160)
    asc, desc = font.getmetrics()
    y = HOOK_TOP
    hl = hook.get("highlight")
    for ln in lines:
        ln = ln.replace("\u00a0", " ")
        vis = shape(ln)
        emph_vis = shape(hl) if hl and hl in ln else None
        draw_line(d, vis, y, font, emph_vis, stroke=7)
        y += asc + desc + 10
    img.save(path)


def render_cards(cards, hook, outdir, duration=None, caption_offset=0):
    """cards: [{start, end, text, words?, emph?, break_after?}] בציר הערוך.
    caption_offset: הזזה אנכית בפיקסלים (חיובי = למטה) — אותה הגדרה כמו ב-Remotion.
    כותב PNG לכל כרטיס + overlays.json ומחזיר את הרשימה."""
    baseline = max(300, min(H - 120, BASELINE_Y + int(caption_offset or 0)))
    fp = find_font()
    if not fp:
        raise RuntimeError("לא נמצא פונט עברי. שים Heebo-ExtraBold.ttf ב-assets/fonts")
    os.makedirs(outdir, exist_ok=True)
    entries = []
    if hook and (hook.get("text") or "").strip():
        hs = float(hook.get("start", 0) or 0)
        he = float(hook.get("end", hs + 3.0) or hs + 3.0)
        hp = os.path.join(outdir, "hook.png")
        render_hook(hook, fp, hp)
        entries.append({"png": hp, "start": round(hs, 3), "end": round(he, 3), "kind": "hook"})
    shrunk = []
    for i, c in enumerate(cards):
        txt = (c.get("text") or "").strip()
        if not txt:
            continue
        s, e = float(c["start"]), float(c["end"])
        if duration:
            e = min(e, duration)
        if e <= s:
            continue
        p = os.path.join(outdir, f"cap_{i:03d}.png")
        n_lines, size = render_card(txt, c.get("emph"), fp, p, c.get("break_after"), c.get("words"), baseline)
        if size < FONT_SIZE:
            shrunk.append(f"«{txt}» ({size}px)")
        entries.append({"png": p, "start": round(s, 3), "end": round(e, 3), "kind": "caption"})
    with open(os.path.join(outdir, "overlays.json"), "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=1)
    if shrunk:
        print(f"⚠️  {len(shrunk)} כרטיסים הוקטנו כדי להיכנס בשתי שורות: {shrunk[:3]}")
    return entries


# ── תאימות ל-plan.json הישן (זמנים בציר הגולמי + cuts) ─────────────────────
def build_map(cuts):
    segs, t = [], 0.0
    for c in sorted(cuts, key=lambda x: float(x["start"])):
        a, b = float(c["start"]), float(c["end"])
        if b > a:
            segs.append((a, b, t))
            t += b - a
    return segs, t


def remap(t, segs):
    for a, b, o in segs:
        if a - 1e-6 <= t <= b + 1e-6:
            return o + (t - a)
    return None


def main():
    if len(sys.argv) < 3:
        print("usage: make_captions.py <captions.json|plan.json> outdir", file=sys.stderr)
        sys.exit(1)
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    outdir = sys.argv[2]
    if "groups" in data:
        from reelkit.captions import to_cards
        cards = to_cards(data)
        entries = render_cards(cards, data.get("hook"), outdir, data.get("duration"))
        total = data.get("duration")
    else:
        cuts = data.get("cuts") or []
        segs, total = (build_map(cuts) if cuts else ([(0.0, 1e6, 0.0)], None))
        cards = []
        for c in data.get("captions") or []:
            s, e = remap(float(c["start"]), segs), remap(float(c["end"]), segs)
            if s is None or e is None or e <= s:
                continue
            cards.append({**c, "start": s, "end": e})
        entries = render_cards(cards, data.get("hook"), outdir)
        long_cards = [c["text"] for c in cards if len(c.get("text", "")) > MAX_CHARS]
        if long_cards:
            print(f"⚠️  {len(long_cards)} כרטיסים מעל {MAX_CHARS} תווים: {long_cards[:3]}")
    print(f"✅ {len(entries)} שכבות  ·  פונט: {os.path.basename(find_font() or '?')}"
          + (f"  ·  אורך פלט: {total:.2f}ש׳" if total else ""))
    print(f"   {outdir}/overlays.json")


if __name__ == "__main__":
    main()
