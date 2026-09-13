"""Before planning: what in this video is an INSTRUCTION, and what relates to what.

This is deliberately a candidate finder, not a decider. It scans the words for
cues (singular imperatives, a vocative "עורך", deixis like "כאן לידי", memory
cues like "תזכרו את המספר"), links repeated values across time, and pulls the
frames around each cue. Claude then watches those frames and writes
work/requirements.json. Nothing here is specific to one video.
"""
from __future__ import annotations


from pathlib import Path

from . import FPS
from .hebrew import display_word, merge_number_tokens, spoken_numbers, strip_prefix

# Singular 2nd-person future forms used as commands to ONE person (the editor).
# Plural forms ("תשימו", "תזכרו") are normally addressed to the audience.
EDITOR_VERBS = {
    "תציג", "תציגי", "תשים", "תשימי", "תוסיף", "תוסיפי", "תכתוב", "תכתבי", "תחתוך", "תחתכי",
    "תוריד", "תורידי", "תעשה", "תעשי", "תגדיל", "תגדילי", "תקרב", "תקרבי", "תדגיש", "תדגישי",
    "תסמן", "תסמני", "תחליף", "תחליפי", "תזיז", "תזיזי", "תכניס", "תכניסי", "תקפיץ", "תקפיצי",
    "תקפיא", "תקפיאי", "תוציא", "תוציאי", "תשאיר", "תשאירי", "תעצור", "תעצרי", "תראה", "תראי",
    "תזכור", "תזכרי", "תעלה", "תעלי", "תצבע", "תצבעי", "תמחק", "תמחקי", "תפתח", "תפתחי",
}
AUDIENCE_VERBS = {
    "תשימו", "תזכרו", "זכרו", "תראו", "תכתבו", "תעשו", "תנסו", "תעקבו", "תגיבו", "תשמרו",
    "תשתפו", "תלחצו", "תחשבו", "דמיינו", "תקשיבו", "שימו",
}
VOCATIVES = {"עורך", "עורכת", "אדיטור", "editor", "העורך", "העורכת"}
EDIT_NOUNS = {"בעריכה", "זום", "כתובית", "כתוביות", "גרפיקה", "אנימציה", "טקסט", "חיתוך",
              "מוזיקה", "אפקט", "בירול", "b-roll", "אוברליי", "overlay", "טייק", "קאט"}
DEIXIS = {"כאן", "פה", "לידי", "מעליי", "מעלי", "מתחתיי", "מימין", "משמאל", "בצד", "ביד",
          "מעל", "מתחת", "ליד", "על המסך", "באמצע", "למעלה", "למטה"}
MEMORY = {"תזכרו", "זכרו", "תזכור", "תזכרי", "זוכרים", "זוכר", "כמו שאמרתי", "נחזור",
          "בהמשך", "בסוף", "המספר הזה", "אותו מספר", "זה שאמרתי"}
RETAKE = {"טייק", "שוב", "מההתחלה", "סליחה", "רגע", "אחורה", "נעשה שוב", "אני אגיד את זה שוב"}


def _norm(w: str) -> str:
    return display_word(w).lower()


def sentences(words: list[dict], pause: float = 0.6) -> list[tuple[int, int]]:
    """Split word indices into spoken sentences by punctuation and pauses."""
    out, start = [], 0
    for i, w in enumerate(words):
        nxt = words[i + 1] if i + 1 < len(words) else None
        end_punct = w["word"].strip()[-1:] in ".?!"
        gap = (float(nxt["start"]) - float(w["end"])) if nxt else 99
        if not nxt or end_punct or gap >= pause:
            out.append((start, i + 1))
            start = i + 1
    return out


def find_cues(words: list[dict]) -> list[dict]:
    words = merge_number_tokens([dict(w) for w in words if (w.get("word") or "").strip()])
    cands = []
    for s, e in sentences(words):
        seg = words[s:e]
        toks = [_norm(w["word"]) for w in seg]
        stems = [set(strip_prefix(t)) for t in toks]
        text = " ".join(display_word(w["word"]) for w in seg)
        joined = " " + " ".join(toks) + " "
        cues = []
        editor, audience = 0, 0
        for t, st in zip(toks, stems):
            if st & EDITOR_VERBS:
                cues.append(f"פועל ליחיד: {t}")
                editor += 2
            if st & AUDIENCE_VERBS:
                cues.append(f"פועל לרבים: {t}")
                audience += 2
            if st & VOCATIVES:
                cues.append(f"פנייה: {t}")
                editor += 3
            if st & EDIT_NOUNS:
                cues.append(f"מונח עריכה: {t}")
                editor += 1
        for d in DEIXIS:
            if f" {d} " in joined:
                cues.append(f"מיקום: {d}")
        memory = [m for m in MEMORY if f" {m} " in joined]
        for m in memory:
            cues.append(f"זיכרון/הפניה: {m}")
        retake = [r for r in RETAKE if f" {r} " in joined]
        for r in retake:
            cues.append(f"טייק חוזר?: {r}")
        if not cues:
            continue
        if editor > audience:
            addressed = "editor"
        elif audience > editor:
            addressed = "viewer"
        else:
            addressed = "unclear"
        kind = ("instruction" if editor else "memory" if memory else
                "retake" if retake else "deixis")
        cands.append({
            "id": f"C{len(cands) + 1}",
            "said_at": [round(float(seg[0]["start"]), 2), round(float(seg[-1]["end"]), 2)],
            "quote": text, "cues": cues, "addressed_to_guess": addressed, "kind_guess": kind,
            "position_words": [d for d in DEIXIS if f" {d} " in joined],
        })
    return cands


def find_relations(words: list[dict], cues: list[dict]) -> list[dict]:
    """Same value said at different moments, and memory cues pointing forward."""
    words = merge_number_tokens([dict(w) for w in words if (w.get("word") or "").strip()])
    nums = spoken_numbers(words)
    rel = []
    by_val: dict[float, list[dict]] = {}
    for n in nums:
        by_val.setdefault(n["value"], []).append(n)
    for val, hits in by_val.items():
        if len(hits) > 1:
            rel.append({"type": "repeated_value", "value": val,
                        "moments": [[h["start"], h["end"], h["text"]] for h in hits]})
    for c in cues:
        if not any(x.startswith("זיכרון") for x in c["cues"]):
            continue
        s, e = c["said_at"]
        inside = [n for n in nums if s - 0.05 <= n["start"] <= e + 0.05]
        later_refs = [c2 for c2 in cues if c2["said_at"][0] > e and
                      (c2["kind_guess"] in ("instruction", "deixis") or
                       any(x.startswith("זיכרון") for x in c2["cues"]))]
        rel.append({"type": "remember_then_use", "cue": c["id"], "said_at": c["said_at"],
                    "values": [n["value"] for n in inside],
                    "possible_later_uses": [r["id"] for r in later_refs]})
    return rel


def pick_frame_times(duration: float, cues: list[dict], every: float = 2.0, cap: int = 36) -> list[dict]:
    times: dict[float, str] = {}
    n = max(1, min(cap, int(duration // every) + 1))
    for i in range(n):
        t = round(min(duration - 1 / FPS, i * duration / n + 0.05), 2)
        times.setdefault(t, "סקירה")
    for c in cues:
        s, e = c["said_at"]
        for label, t in (("תחילת", s), ("אמצע", (s + e) / 2), ("סוף", e), ("אחרי", e + 0.6)):
            if 0 <= t < duration:
                times[round(t, 2)] = f"{c['id']} {label}"
    return [{"t": t, "label": lbl} for t, lbl in sorted(times.items())]


def detect_faces(image_path: str | Path) -> list[list[int]] | None:
    """Face boxes [x, y, w, h] in the 1080×1920 frame; None if OpenCV is missing."""
    try:
        import cv2  # type: ignore
    except ImportError:
        return None
    img = cv2.imread(str(image_path))
    if img is None:
        return []
    h, w = img.shape[:2]
    scale = 1080 / w
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = casc.detectMultiScale(gray, 1.1, 6, minSize=(int(w * 0.12), int(w * 0.12)))
    return [[int(x * scale), int(y * scale), int(fw * scale), int(fh * scale)] for x, y, fw, fh in faces]


def contact_sheet(items: list[dict], out: str | Path, cols: int = 4, thumb_w: int = 270,
                  grid: bool = True) -> None:
    """Frames in a grid with their timestamp/label, plus a coordinate grid in
    1080×1920 units so a position ("here, next to me") can be read off."""
    from PIL import Image, ImageDraw, ImageFont
    from bidi.algorithm import get_display
    from . import SKILL_ROOT
    thumb_h = int(thumb_w * 1920 / 1080)
    label_h = 44
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), (18, 18, 22))
    fp = SKILL_ROOT / "assets" / "fonts" / "Heebo-ExtraBold.ttf"
    try:
        font = ImageFont.truetype(str(fp), 18, layout_engine=ImageFont.Layout.BASIC)
        small = ImageFont.truetype(str(fp), 11, layout_engine=ImageFont.Layout.BASIC)
    except Exception:
        font = small = ImageFont.load_default()
    d = ImageDraw.Draw(sheet)
    k = thumb_w / 1080
    for i, it in enumerate(items):
        x0, y0 = (i % cols) * thumb_w, (i // cols) * (thumb_h + label_h)
        try:
            im = Image.open(it["path"]).convert("RGB").resize((thumb_w, thumb_h))
        except Exception:
            im = Image.new("RGB", (thumb_w, thumb_h), (60, 0, 0))
        sheet.paste(im, (x0, y0 + label_h))
        if grid:
            for gx in range(0, 1081, 270):
                d.line([(x0 + gx * k, y0 + label_h), (x0 + gx * k, y0 + label_h + thumb_h)], fill=(255, 255, 0), width=1)
                d.text((x0 + gx * k + 2, y0 + label_h + 2), str(gx), font=small, fill=(255, 255, 0))
            for gy in range(0, 1921, 240):
                d.line([(x0, y0 + label_h + gy * k), (x0 + thumb_w, y0 + label_h + gy * k)], fill=(255, 255, 0), width=1)
                d.text((x0 + 2, y0 + label_h + gy * k + 2), str(gy), font=small, fill=(255, 255, 0))
        for fx, fy, fw, fh in it.get("faces") or []:
            d.rectangle([x0 + fx * k, y0 + label_h + fy * k, x0 + (fx + fw) * k, y0 + label_h + (fy + fh) * k],
                        outline=(0, 255, 120), width=2)
        d.text((x0 + 6, y0 + 4), f"{it['t']:.2f}s", font=font, fill=(255, 255, 255))
        lbl = get_display(str(it.get("label", ""))[:30])
        d.text((x0 + 6, y0 + 24), lbl, font=small, fill=(200, 200, 200))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=88)
