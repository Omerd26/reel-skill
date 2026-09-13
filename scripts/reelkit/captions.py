"""Caption groups — ONE representation for both render tiers.

work/captions.json
{
  "version": 1, "timeline": "base", "edit_id": "...", "keeps_frames": [[a,b],...],
  "duration": 41.7, "styles": ["highlight", "fast"],
  "groups": [
    {"id": "g001", "start": 0.20, "end": 1.31,
     "words": [{"word": "שלום", "start": 0.2, "end": 0.64}, ...],
     "emph": [1],            # indices of emphasised words (0 or 1 of them)
     "break_after": null,    # force the line break after word index N (2-line groups)
     "hold": 0.15,           # optional: seconds the caption stays after its last word
     "text": "שלום לכולם"    # read-only convenience; `words` is the truth
    }
  ]
}

The builder proposes groups by MEANING (bonds that must not break: English
runs, versions like "GPT 5.1", number + unit, prefixes; soft bonds: prepositions,
construct pairs) AND by MEASURED WIDTH for every target style. Claude then
reviews and edits the file; `check()` validates edits. Renderers never regroup.
"""
from __future__ import annotations

import re
from functools import lru_cache

from . import FPS, SKILL_ROOT
from .hebrew import (BREAK_BEFORE, GLUE_FORWARD, MEASURE, SCALES, STOP, TENS, UNITS,
                     display_word, merge_number_tokens, strip_prefix, word_class)
from .timeline import base_to_src, remap_words

# Layout of each caption style, mirrored from remotion/src/components/Captions.tsx
# and scripts/make_captions.py. word_pad = horizontal margin around each word
# span (flex layouts); None = plain text with spaces. width_factor covers the
# browser's Heebo 900 being ~2% wider than the bundled ExtraBold + the stroke.
PROFILES = {
    "highlight":  {"font_size": 70, "word_pad": 32, "max_width": 1024, "max_lines": 2, "width_factor": 1.04},
    "cinematic":  {"font_size": 72, "word_pad": 8,  "max_width": 1016, "max_lines": 2, "width_factor": 1.03},
    "classic":    {"font_size": 50, "word_pad": None, "max_width": 837, "max_lines": 2, "width_factor": 1.02},
    "white_card": {"font_size": 52, "word_pad": None, "max_width": 829, "max_lines": 2, "width_factor": 1.02},
    "tiktok":     {"font_size": 88, "word_pad": None, "max_width": 1000, "max_lines": 1, "width_factor": 1.03, "per_word": True},
    "fast":       {"font_size": 66, "word_pad": None, "max_width": 860, "max_lines": 2, "width_factor": 1.03},
}
MAX_WORDS = 6
LONG_PAUSE = 1.0      # a group never spans a pause this long
TAIL_HOLD = 0.15
MIN_SHOW = 0.40
FRAME = 1 / FPS

# Nouns in construct state that lean on the next word ("סוף הסרטון", "תחילת השבוע")
CONSTRUCT_HEADS = {"סוף", "תחילת", "אמצע", "סיום", "מספר", "סוג", "צורת", "דרך", "זמן", "שם",
                   "ראש", "בית", "חדר", "יום", "שנת", "חודש", "כמות", "רמת", "איכות", "מחיר"}

COMPOUNDS = {
    ("בית", "ספר"), ("עורך", "דין"), ("תמונת", "פרופיל"), ("בן", "אדם"), ("בני", "אדם"),
    ("כרטיס", "אשראי"), ("רשתות", "חברתיות"), ("בינה", "מלאכותית"), ("סוף", "סוף"),
    ("יום", "יום"), ("דף", "נחיתה"), ("קהל", "יעד"), ("שיחת", "מכירה"),
}


# ── measurement ──────────────────────────────────────────────────────────────
@lru_cache(maxsize=4)
def _font(size: int):
    try:
        from PIL import ImageFont
    except ImportError:
        return None
    fp = SKILL_ROOT / "assets" / "fonts" / "Heebo-ExtraBold.ttf"
    try:
        return ImageFont.truetype(str(fp), size, layout_engine=ImageFont.Layout.BASIC)
    except Exception:
        return None


@lru_cache(maxsize=20000)
def text_width(text: str, size: int) -> float:
    f = _font(size)
    if f is None:
        return len(text) * size * 0.56
    return float(f.getlength(text))


def layout_lines(words: list[str], style: str, break_after: int | None = None) -> list[list[int]]:
    """Greedy wrap exactly like a flex-wrap / text box would; returns word
    indices per line. A forced break_after is honoured first."""
    p = PROFILES[style]
    if p.get("per_word"):
        return [[i] for i in range(len(words))]
    size, pad, maxw, k = p["font_size"], p["word_pad"], p["max_width"], p["width_factor"]
    space = text_width(" ", size)

    def width(idx: list[int]) -> float:
        if not idx:
            return 0.0
        if pad is not None:
            return sum(text_width(words[i], size) * k + pad for i in idx)
        return sum(text_width(words[i], size) * k for i in idx) + space * (len(idx) - 1)

    lines: list[list[int]] = []
    cur: list[int] = []
    for i in range(len(words)):
        if cur and width(cur + [i]) > maxw:
            lines.append(cur)
            cur = []
        cur.append(i)
        if break_after is not None and i == break_after and i < len(words) - 1:
            lines.append(cur)
            cur = []
    if cur:
        lines.append(cur)
    return lines


def overflow(words: list[str], style: str, break_after: int | None = None) -> dict | None:
    """None if the group fits the style; otherwise what is wrong."""
    p = PROFILES[style]
    lines = layout_lines(words, style, break_after)
    size, k = p["font_size"], p["width_factor"]
    for i in (i for line in lines for i in line):
        if text_width(words[i], size) * k + (p["word_pad"] or 0) > p["max_width"]:
            return {"reason": "word_too_wide", "word": words[i], "lines": len(lines)}
    if len(lines) > p["max_lines"] and not p.get("per_word"):
        return {"reason": "too_many_lines", "lines": len(lines), "max": p["max_lines"]}
    return None


# ── bonds between neighbouring words ────────────────────────────────────────
INF = 1e9


def _is_number_word(w: str) -> bool:
    return any(s in UNITS or s in TENS or s in SCALES or s in ("מאה", "מאתיים", "מאות")
               for s in strip_prefix(w))


def bond_cost(a: dict, b: dict) -> float:
    """Cost of breaking a group between words a and b (higher = keep together)."""
    ta, tb = display_word(a["word"]), display_word(b["word"])
    ca, cb = word_class(a["word"]), word_class(b["word"])
    gap = float(b["start"]) - float(a["end"])
    if gap >= LONG_PAUSE:
        return -8.0                                   # the speaker stopped — break here
    raw_a = a["word"].strip()
    cost = 0.0
    if ca == "latin" and cb in ("latin", "num"):
        cost = INF                                    # "Claude Code", "GPT 5.1"
    elif ca == "num" and (tb in MEASURE or cb == "latin" and len(tb) <= 3):
        cost = INF                                    # "3 שניות", "10 K"
    elif _is_number_word(ta) and (_is_number_word(tb) or any(s in MEASURE for s in strip_prefix(tb))):
        cost = INF                                    # "עשרת אלפים", "שלושה דברים"
    elif (len(ta) == 1 and ta in "ובלמהשכ") or (ca == "heb" and raw_a.endswith("-")):
        cost = INF                                    # stray prefix "ב" / "ב-"
    elif _is_number_word(ta) and cb == "heb" and re.search(r"(ים|ות)$", tb):
        cost = 8.0                                    # "שני מוצרים", "שלושה דברים"
    elif tb in ("לי", "לך", "לו", "לה", "לנו", "לכם", "להן", "להם") and ca == "heb" and ta not in STOP:
        cost = 6.0                                    # "תעשה לי", "תדרג לי"
    elif re.fullmatch(r"[֐-׿]['׳]", tb) and ca == "heb":
        cost = INF                                    # "מוצר ב'" — a letter label
    elif ca == "heb" and cb == "num" and ta not in STOP and len(display_word(b["word"])) <= 5:
        cost = 8.0                                    # name + version: "אסטרה 6", "גרסה 5.1"
    elif any((sa, tb) in COMPOUNDS for sa in strip_prefix(ta)):
        cost = 9.0                                    # "בתמונת פרופיל"
    elif cb == "heb" and any(sa in CONSTRUCT_HEADS for sa in strip_prefix(ta)):
        cost = 8.0                                    # "סוף הסרטון"
    elif ta in GLUE_FORWARD:
        cost = 6.0
    elif ta in ("אני", "אתה", "את", "אנחנו", "אתם", "הוא", "היא", "הם") and cb == "heb":
        cost = 2.5                                    # subject pronoun belongs with its verb
    elif ca == "heb" and cb == "heb" and ta.endswith("ת") and len(ta) >= 4 \
            and ta not in STOP and tb not in STOP:
        cost = 1.5                                    # probable construct pair ("תמונת X")
    if cost >= INF:
        return INF if gap < 0.6 else 4.0              # a real pause overrides a soft rule
    if raw_a[-1:] in ",.?!:;":
        cost -= 4.0
    if gap >= 0.5:
        cost -= 5.0
    elif gap >= 0.28:
        cost -= 3.0
    if tb in BREAK_BEFORE:
        cost -= 2.0
    return cost


def group_cost(words: list[dict], styles: list[str]) -> float:
    shown = [display_word(w["word"]) for w in words]
    for st in styles:
        if overflow(shown, st):
            return INF
    for x, y in zip(words, words[1:]):
        if float(y["start"]) - float(x["end"]) >= LONG_PAUSE:
            return INF
    k = len(words)
    dur = float(words[-1]["end"]) - float(words[0]["start"])
    cost = 0.0
    if k == 1:
        strong = word_class(words[0]["word"]) in ("num", "latin") or len(shown[0]) >= 6
        cost += 1.0 if strong or dur >= 0.6 else 3.5
    if k > 4:
        cost += (k - 4) * 2.0
    if dur > 3.0:
        cost += (dur - 3.0) * 4.0
    if dur < 0.45:
        cost += 2.0
    if any(len(layout_lines(shown, st)) > 1 for st in styles if not PROFILES[st].get("per_word")):
        cost += 2.5                                   # one line reads faster
    return cost


# ── building ─────────────────────────────────────────────────────────────────
def prepare_words(words: list[dict]) -> list[dict]:
    clean = [dict(w) for w in words if (w.get("word") or "").strip()]
    return merge_number_tokens(clean)


def segment(words: list[dict], styles: list[str]) -> list[list[dict]]:
    """Minimum-cost segmentation (dynamic programming over break points)."""
    n = len(words)
    best = [0.0] + [INF] * n
    back = [0] * (n + 1)
    for j in range(1, n + 1):
        for i in range(max(0, j - MAX_WORDS), j):
            if best[i] >= INF:
                continue
            gc = group_cost(words[i:j], styles)
            if gc >= INF:
                continue
            bc = bond_cost(words[j - 1], words[j]) if j < n else 0.0
            if bc >= INF:
                continue
            total = best[i] + gc + bc
            if total < best[j]:
                best[j], back[j] = total, i
    if best[n] >= INF:
        # Nothing satisfies every rule (e.g. one enormous word). Fall back to
        # one word per group rather than silently dropping text.
        return [[w] for w in words]
    out, j = [], n
    while j > 0:
        out.append(words[back[j]:j])
        j = back[j]
    return out[::-1]


def pick_emphasis(words: list[dict]) -> list[int]:
    shown = [display_word(w["word"]) for w in words]
    for i, w in enumerate(words):
        if word_class(w["word"]) == "num" or _is_number_word(shown[i]):
            return [i]
    cands = [(len(s), i) for i, s in enumerate(shown)
             if s not in STOP and len(s) >= 4 and word_class(words[i]["word"]) != "other"]
    return [max(cands)[1]] if cands else []


def best_break(shown: list[str], words: list[dict], style: str) -> int | None:
    """For a two-line group, the most balanced break that doesn't split a bond."""
    if len(shown) < 2 or len(layout_lines(shown, style)) < 2:
        return None
    size = PROFILES[style]["font_size"]
    best, best_score = None, INF
    total = sum(text_width(s, size) for s in shown)
    left = 0.0
    for i in range(len(shown) - 1):
        left += text_width(shown[i], size)
        if bond_cost(words[i], words[i + 1]) >= INF:
            continue
        if len(layout_lines(shown, style, i)) > PROFILES[style]["max_lines"]:
            continue
        score = abs(total - 2 * left) + (200 if shown[i] in GLUE_FORWARD else 0)
        if score < best_score:
            best, best_score = i, score
    return best


def finalize_times(groups: list[dict], duration: float | None = None) -> None:
    """Group start = first word; end = last word + short hold, never into the
    next group (two captions on screen at once) and never past the video."""
    groups[:] = [g for g in groups if g.get("words")]
    for idx, g in enumerate(groups):
        ws = g["words"]
        if not ws:
            continue
        g["start"] = round(float(ws[0]["start"]), 3)
        end = float(ws[-1]["end"]) + float(g.get("hold", TAIL_HOLD))
        end = max(end, g["start"] + MIN_SHOW)
        if idx + 1 < len(groups):
            end = min(end, float(groups[idx + 1]["words"][0]["start"]) - FRAME)
        if duration:
            end = min(end, duration)
        g["end"] = round(max(end, g["start"] + FRAME), 3)
        g["text"] = " ".join(display_word(w["word"]) for w in ws)


def build(words: list[dict], styles: list[str], duration: float | None = None) -> list[dict]:
    words = prepare_words(words)
    groups = []
    for n, seg in enumerate(segment(words, styles), 1):
        shown = [display_word(w["word"]) for w in seg]
        ba = None
        for st in styles:
            if not PROFILES[st].get("per_word"):
                ba = best_break(shown, seg, st)
                if ba is not None:
                    break
        groups.append({"id": f"g{n:03d}", "start": 0, "end": 0,
                       "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in seg],
                       "emph": pick_emphasis(seg), "break_after": ba, "text": ""})
    finalize_times(groups, duration)
    return groups


def document(groups: list[dict], styles: list[str], edit: dict | None, duration: float) -> dict:
    return {"version": 1, "timeline": "base",
            "edit_id": (edit or {}).get("edit_id"),
            "keeps_frames": (edit or {}).get("keeps_frames"),
            "duration": duration, "styles": styles, "groups": groups}


# ── retime after a new cut ───────────────────────────────────────────────────
def retime(doc: dict, new_edit: dict) -> tuple[dict, int]:
    """Move reviewed groups from an old cut to a new one (old base → source →
    new base). Words that fell inside a new removal are dropped."""
    old_keeps = [tuple(k) for k in doc.get("keeps_frames") or []]
    new_keeps = [tuple(k) for k in new_edit["keeps_frames"]]
    dropped = 0
    groups = []
    for g in doc["groups"]:
        # back to source time, then through the SAME rule the cut uses for words
        src_words = []
        for w in g["words"]:
            ss = base_to_src(float(w["start"]), old_keeps) if old_keeps else float(w["start"])
            se = base_to_src(float(w["end"]), old_keeps, side="end") if old_keeps else float(w["end"])
            if ss is None or se is None:
                dropped += 1
                continue
            src_words.append({**w, "start": ss, "end": se, "_i": len(src_words)})
        kept = remap_words(src_words, new_keeps)
        dropped += len(src_words) - len(kept)
        words = [{k: v for k, v in w.items() if k != "_i"} for w in kept]
        if words:
            idx_map = {w["_i"]: n for n, w in enumerate(kept)}
            keep_emph = [idx_map[i] for i in g.get("emph") or [] if i in idx_map]
            ba = g.get("break_after")
            groups.append({**g, "words": words, "emph": keep_emph,
                           "break_after": ba if ba is not None and ba < len(words) - 1 else None})
    dur = new_edit["base"]["duration_seconds"]
    finalize_times(groups, dur)
    new_doc = {**doc, "groups": groups, "edit_id": new_edit["edit_id"],
               "keeps_frames": new_edit["keeps_frames"], "duration": dur}
    return new_doc, dropped


# ── checking ─────────────────────────────────────────────────────────────────
def check(doc: dict, base_words: list[dict] | None = None, duration: float | None = None,
          edit_id: str | None = None, styles: list[str] | None = None) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warns: list[str] = []
    groups = doc.get("groups")
    if not isinstance(groups, list) or not groups:
        return ["captions.json: אין groups"], []
    styles = styles or doc.get("styles") or ["highlight"]
    if edit_id and doc.get("edit_id") and doc["edit_id"] != edit_id:
        errors.append("captions.json נבנה לחיתוך קודם (edit_id לא תואם) — הרץ: reel captions --retime")
    ref = sorted(float(w["start"]) for w in prepare_words(base_words)) if base_words else None
    prev_end = -1.0
    for g in groups:
        gid = g.get("id", "?")
        ws = g.get("words") or []
        if not ws:
            errors.append(f"{gid}: קבוצה בלי מילים")
            continue
        try:
            s, e = float(g["start"]), float(g["end"])
        except (KeyError, TypeError, ValueError):
            errors.append(f"{gid}: start/end חסרים")
            continue
        if e <= s:
            errors.append(f"{gid}: end לא אחרי start")
        if s < prev_end - 1e-3:
            errors.append(f"{gid}: מתחילה ב-{s} לפני שהקודמת נגמרה ({prev_end}) — שתי כתוביות יחד")
        prev_end = e
        if duration and e > duration + FRAME:
            errors.append(f"{gid}: נגמרת ב-{e}s אחרי סוף הסרטון ({duration}s)")
        for w in ws:
            if float(w["start"]) < s - 0.05 or float(w["end"]) > e + 0.05:
                errors.append(f"{gid}: המילה '{w.get('word')}' ({w['start']}-{w['end']}) מחוץ לזמני הקבוצה")
                break
        for a, b in zip(ws, ws[1:]):
            if float(b["start"]) < float(a["start"]):
                errors.append(f"{gid}: מילים לא בסדר זמנים")
                break
        if ref is not None:
            for w in ws:
                if w.get("manual"):
                    continue
                t = float(w["start"])
                k = _nearest(ref, t)
                if k is None or abs(ref[k] - t) > 0.06:
                    errors.append(f"{gid}: '{w.get('word')}' ב-{t}s לא תואמת אף מילה בתמלול הערוך — "
                                  "הזמנים לא שייכים לסרטון הזה (סמן manual:true אם הוספת במכוון)")
                    break
        shown = [display_word(w["word"]) for w in ws]
        ba = g.get("break_after")
        if ba is not None and not (0 <= int(ba) < len(ws) - 1):
            errors.append(f"{gid}: break_after={ba} מחוץ לטווח")
            ba = None
        for st in styles:
            ov = overflow(shown, st, ba)
            if ov:
                what = (f"המילה '{ov['word']}' רחבה מדי" if ov["reason"] == "word_too_wide"
                        else f"{ov['lines']} שורות (מקסימום {ov['max']})")
                errors.append(f"{gid} «{' '.join(shown)}»: לא נכנסת בסגנון {st} — {what}. פצל את הקבוצה")
        for a, b in zip(ws, ws[1:]):
            if float(b["start"]) - float(a["end"]) >= LONG_PAUSE:
                warns.append(f"{gid}: יש בתוכה הפסקה של {float(b['start']) - float(a['end']):.1f}s — הכתובית תעמוד על מסך שקט")
        last = display_word(ws[-1]["word"])
        if last in GLUE_FORWARD and len(ws) > 1 and ws[-1]["word"].strip()[-1:] not in ".?!":
            warns.append(f"{gid} «{' '.join(shown)}»: נגמרת במילת קישור '{last}'")
        bad_emph = [i for i in g.get("emph") or [] if not (isinstance(i, int) and 0 <= i < len(ws))]
        if bad_emph:
            errors.append(f"{gid}: emph {bad_emph} מחוץ לטווח ({len(ws)} מילים) — אחרי הזזת מילים עדכן את האינדקס")
        if len([i for i in g.get("emph") or []]) > 1:
            warns.append(f"{gid}: יותר ממילה מודגשת אחת — שתיים = אפס")
        txt = g.get("text")
        if txt and txt.split() != " ".join(shown).split():
            warns.append(f"{gid}: text ('{txt}') שונה מהמילים — הרנדר מציג את words. "
                         "ערכת רק את text? הרץ reel captions --sync-text")
    for a, b in zip(groups, groups[1:]):
        if not a.get("words") or not b.get("words"):
            continue
        if bond_cost(a["words"][-1], b["words"][0]) >= INF:
            warns.append(f"{a.get('id')}→{b.get('id')}: '{display_word(a['words'][-1]['word'])} "
                         f"{display_word(b['words'][0]['word'])}' נשבר בין שתי כתוביות (שם/מספר/גרסה)")
    if ref is not None:
        covered = sum(len(g.get("words") or []) for g in groups)
        if covered < len(ref):
            warns.append(f"{len(ref) - covered} מילים מהתמלול לא מופיעות בכתוביות — ודא שזה מכוון")
    return errors, warns


def _nearest(sorted_vals: list[float], t: float) -> int | None:
    import bisect
    if not sorted_vals:
        return None
    i = bisect.bisect_left(sorted_vals, t)
    cands = [j for j in (i - 1, i) if 0 <= j < len(sorted_vals)]
    return min(cands, key=lambda j: abs(sorted_vals[j] - t))


def sync_text(doc: dict) -> int:
    """Apply edits made to `text` back onto `words` when the word count matches."""
    changed = 0
    for g in doc.get("groups") or []:
        txt = (g.get("text") or "").split()
        ws = g.get("words") or []
        if txt and len(txt) == len(ws) and txt != [display_word(w["word"]) for w in ws]:
            for w, t in zip(ws, txt):
                w["word"] = t
            changed += 1
    return changed


def to_cards(doc: dict) -> list[dict]:
    """Fast-tier card list (what make_captions.py draws)."""
    cards = []
    for g in doc["groups"]:
        shown = [display_word(w["word"]) for w in g["words"]]
        emph = [shown[i] for i in g.get("emph") or [] if i < len(shown)]
        cards.append({"start": g["start"], "end": g["end"], "text": " ".join(shown),
                      "words": shown, "emph": emph[0] if emph else None,
                      "emph_index": (g.get("emph") or [None])[0],
                      "break_after": g.get("break_after")})
    return cards


def to_remotion(doc: dict) -> list[dict]:
    out = []
    for g in doc["groups"]:
        emph = set(g.get("emph") or [])
        out.append({"id": g.get("id"), "start": g["start"], "end": g["end"],
                    "break_after": g.get("break_after"),
                    "words": [{"word": display_word(w["word"]), "start": w["start"], "end": w["end"],
                               **({"emphasis": True} if i in emph else {})}
                              for i, w in enumerate(g["words"])]})
    return out


NBSP = "\u00a0"


def protect_bonds(text: str) -> str:
    """Join words that must share a line (number + unit, English runs, prefix
    letters, prepositions + their word) with a no-break space. Used for hooks
    and any free text that a renderer wraps by itself."""
    toks = text.split()
    if len(toks) < 2:
        return text
    fake = [{"word": t, "start": i * 0.3, "end": i * 0.3 + 0.25} for i, t in enumerate(toks)]
    out = toks[0]
    for a, b, t in zip(fake, fake[1:], toks[1:]):
        glue = bond_cost(a, b) >= 6.0
        out += (NBSP if glue else " ") + t
    return out
