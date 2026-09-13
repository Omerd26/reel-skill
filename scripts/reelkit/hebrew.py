"""Hebrew text knowledge shared by captions, validation, understanding and QA."""
from __future__ import annotations

import re

# ── Whisper token repair ─────────────────────────────────────────────────────
_NUM_FRAG = re.compile(r"^[-–—]?[\d][\d,.٫٬]*$|^[,.][\d]+$")


def _continues_number(prev: str, nxt: str) -> bool:
    """"-1" + ",000" and "5" + ".1" are one number; "3." then "5" is two."""
    if not prev or not nxt or not _NUM_FRAG.match(nxt):
        return False
    if nxt[0] in ",." and prev[-1].isdigit():
        return True
    return prev[-1] == "," and nxt.isdigit() and len(nxt) == 3


def merge_number_tokens(words: list) -> list:
    """Whisper splits "1,000" into ["-1", ",000"] — separate RTL spans lay out
    right-to-left and the number reads BACKWARDS ("000,1"). Collapse runs of
    numeric fragments into one token, and glue a lone "%" to the number before
    it. A trailing sentence period ("3.") is a fragment of nothing, so a run
    only merges when the pieces actually continue each other."""
    if not words:
        return words
    out, i, n = [], 0, len(words)
    while i < n:
        wt = (words[i].get("word") or "").strip()
        if wt == "%" and out and any(c.isdigit() for c in out[-1]["word"]) and not out[-1]["word"].endswith("%"):
            out[-1] = {**out[-1], "word": out[-1]["word"] + "%", "end": words[i]["end"]}
            i += 1
        elif _NUM_FRAG.match(wt):
            frags, j = [words[i]], i + 1
            while j < n and _continues_number((frags[-1].get("word") or "").strip(),
                                              (words[j].get("word") or "").strip()):
                frags.append(words[j])
                j += 1
            if len(frags) > 1:
                joined = "".join((f["word"] or "").strip() for f in frags).lstrip("-–—")
                out.append({**frags[0], "word": joined, "start": frags[0]["start"],
                            "end": frags[-1]["end"],
                            "probability": min(f.get("probability", 1.0) for f in frags)})
            else:
                out.append(frags[0])
            i = j
        else:
            out.append(words[i])
            i += 1
    return out


# ── Token classes ─────────────────────────────────────────────────────────────
HEB = re.compile(r"[֐-׿]")
LATIN = re.compile(r"[A-Za-z]")
DIGIT = re.compile(r"\d")
EDGE_PUNCT = ",;:\"'“”„()[]"


def display_word(token: str) -> str:
    """What a caption shows: sentence punctuation removed, meaning kept.
    "לכולם," → "לכולם", "3." → "3", "5.1" stays, "?" and "!" stay."""
    t = token.strip()
    t = t.strip(EDGE_PUNCT)
    while t.endswith(".") and not re.search(r"\d\.\d+$", t):
        t = t[:-1]
    t = t.rstrip(",;:")
    return t or token.strip()


def word_class(token: str) -> str:
    t = display_word(token)
    if DIGIT.search(t) and not HEB.search(t):
        return "num"
    for ch in t:
        if HEB.match(ch):
            return "heb"
        if LATIN.match(ch):
            return "latin"
    return "heb" if HEB.search(t) else ("num" if DIGIT.search(t) else "other")


def is_ltr(token: str) -> bool:
    return word_class(token) in ("latin", "num")


PREFIXES = "ובלמהשכ"


def strip_prefix(word: str) -> list[str]:
    """Candidate stems: "ולעשרת" → ["ולעשרת", "לעשרת", "עשרת"]."""
    w = display_word(word)
    out = [w]
    k = 0
    while k < 2 and len(w) > 2 and w[0] in PREFIXES:
        w = w[1:]
        out.append(w)
        k += 1
    return out


# Prepositions / connectors that must not END a caption group — their meaning
# is in the word that follows.
GLUE_FORWARD = {
    "עם", "על", "של", "אל", "את", "בלי", "לפי", "כדי", "בין", "מול", "תחת",
    "לתוך", "מתוך", "אחרי", "לפני", "בזכות", "בגלל", "כמו", "ללא", "עבור",
    "זה", "זאת", "אלה", "יש", "אין", "הכי", "יותר", "פחות", "כל", "כמה",
    "אבל", "אז", "כי", "ולכן", "או", "גם", "רק", "עוד", "אם", "איך", "למה", "מה",
    "ה", "ו", "ב", "ל", "מ", "ש", "כ", "שלא", "לא", "ממש", "הרבה", "מאוד",
    "the", "a", "an", "of", "to", "in", "on", "with", "for",
}
BREAK_BEFORE = {"אבל", "אז", "כי", "ולכן", "עכשיו", "בעצם", "למעשה", "השאלה", "והנה", "תחשבו"}
STOP = GLUE_FORWARD | {"אני", "אתה", "הוא", "היא", "אנחנו", "אתם", "הם", "שלי", "שלך",
                       "שלו", "שלה", "שלנו", "שלכם", "ולא", "הזה", "הזאת", "פה", "כאן"}

# Words that belong to the number before them ("3 שניות", "עשרת אלפים צפיות").
MEASURE = {
    "אחוז", "אחוזים", "שניות", "שנייה", "דקות", "דקה", "שעות", "שעה", "ימים", "יום",
    "שבועות", "שבוע", "חודשים", "חודש", "שנים", "שנה", "שקל", "שקלים", "₪", "דולר",
    "דולרים", "אלף", "אלפים", "מיליון", "מיליארד", "צפיות", "עוקבים", "לייקים",
    "פעמים", "פעם", "דברים", "טיפים", "שלבים", "סרטונים", "רילים", "לקוחות", "K", "M", "%",
}

# ── Spoken numbers ────────────────────────────────────────────────────────────
UNITS = {
    "אפס": 0, "אחד": 1, "אחת": 1, "שתיים": 2, "שניים": 2, "שתי": 2, "שני": 2,
    "שלוש": 3, "שלושה": 3, "שלושת": 3, "ארבע": 4, "ארבעה": 4, "ארבעת": 4,
    "חמש": 5, "חמישה": 5, "חמשת": 5, "שש": 6, "שישה": 6, "ששת": 6,
    "שבע": 7, "שבעה": 7, "שבעת": 7, "שמונה": 8, "שמונת": 8,
    "תשע": 9, "תשעה": 9, "תשעת": 9, "עשר": 10, "עשרה": 10, "עשרת": 10,
}
TENS = {"עשרים": 20, "שלושים": 30, "ארבעים": 40, "חמישים": 50, "שישים": 60,
        "שבעים": 70, "שמונים": 80, "תשעים": 90}
HUNDREDS = {"מאה": 100, "מאתיים": 200, "מאות": 100}
SCALES = {"אלף": 1000, "אלפים": 1000, "אלפיים": 2000, "מיליון": 1_000_000,
          "מיליונים": 1_000_000, "מיליארד": 1_000_000_000}
HALF = {"חצי": 0.5}


def _lookup(word: str):
    for stem in strip_prefix(word):
        for table in (UNITS, TENS, HUNDREDS, SCALES, HALF):
            if stem in table:
                return stem, table
    return None, None


def parse_digits(text: str) -> list[float]:
    vals = []
    for m in re.finditer(r"\d[\d,]*(?:\.\d+)?\s*[KkMm]?", text):
        raw = m.group(0).strip()
        mult = 1
        if raw[-1] in "Kk":
            mult, raw = 1000, raw[:-1]
        elif raw[-1] in "Mm":
            mult, raw = 1_000_000, raw[:-1]
        try:
            vals.append(float(raw.replace(",", "")) * mult)
        except ValueError:
            pass
    return vals


def spoken_numbers(words: list[dict]) -> list[dict]:
    """Every number the speaker said, with time: digits ("10,000", "5.1") and
    Hebrew number words ("עשרת אלפים", "שלושה"). Returns [{value, start, end, text}]."""
    out = []
    i, n = 0, len(words)
    while i < n:
        w = words[i]
        token = display_word(w.get("word", ""))
        digits = parse_digits(token)
        if digits:
            val = digits[0]
            j = i + 1
            if j < n:
                stem, table = _lookup(words[j].get("word", ""))
                if table is SCALES:
                    val *= SCALES[stem]
                    j += 1
            out.append({"value": val, "start": w["start"], "end": words[j - 1]["end"],
                        "text": " ".join(display_word(x["word"]) for x in words[i:j])})
            i = j
            continue
        stem, table = _lookup(token)
        if table is None:
            i += 1
            continue
        total, current, j = 0.0, 0.0, i
        while j < n:
            stem, table = _lookup(words[j].get("word", ""))
            if table is None:
                if display_word(words[j]["word"]) == "ו" and j + 1 < n and _lookup(words[j + 1]["word"])[1]:
                    j += 1
                    continue
                break
            if table is SCALES:
                current = (current or 1) * SCALES[stem]
                total += current
                current = 0
            elif table is HALF:
                current += 0.5
            else:
                current += table[stem]
            j += 1
        total += current
        out.append({"value": total, "start": w["start"], "end": words[j - 1]["end"],
                    "text": " ".join(display_word(x["word"]) for x in words[i:j])})
        i = max(j, i + 1)
    return out
