#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
split_captions.py <transcript.json> [--out work/plan.json] [--head-trim] 

מפצל תמלול לכרטיסי כתוביות לפי חוקי references/captions-hebrew.md:
2-4 מילים, ≤34 תווים, לא שוברים מילת יחס/סמיכות, שוברים בהפסקות דיבור.

זו נקודת פתיחה מכנית — **Claude עובר על התוצאה ומשפר**: בוחר את מילת
ההדגשה הנכונה, מאחד/מפצל כרטיסים שנשמעים שבורים, ומתקן שבירות סמיכות
שהיוריסטיקה פספסה.
"""
import argparse, json, re, sys

MAX_CHARS = 34
MAX_WORDS = 4
MIN_WORDS = 2
GAP_BREAK = 0.32          # הפסקת דיבור שמצדיקה כרטיס חדש
MIN_CARD_SEC = 0.55

# מילים שלעולם לא נשארות בסוף כרטיס (המשמעות תלויה במה שאחריהן)
GLUE_FORWARD = {
    "עם", "על", "של", "אל", "את", "בלי", "לפי", "כדי", "בין", "מול", "תחת",
    "לתוך", "מתוך", "אחרי", "לפני", "בזכות", "בגלל", "כמו", "ללא", "עבור",
    "זה", "זאת", "אלה", "יש", "אין", "הכי", "יותר", "פחות", "כל", "כמה",
    "אבל", "אז", "כי", "ולכן", "או", "גם", "רק", "עוד",
}
# פותחות משפט — טוב לשבור לפניהן
BREAK_BEFORE = {"אבל", "אז", "כי", "ולכן", "עכשיו", "בעצם", "למעשה", "השאלה"}

STOP = GLUE_FORWARD | {"אני", "אתה", "הוא", "היא", "אנחנו", "אתם", "הם", "שלי",
                       "שלך", "שלו", "שלה", "שלנו", "שלכם", "מה", "איך", "ולא"}


def pick_emphasis(words):
    """מילת ההדגשה: מספר אם יש, אחרת המילה הארוכה ביותר שאינה מילת קישור."""
    for w in words:
        if any(c.isdigit() for c in w):
            return w
    cands = [w for w in words if w.strip(".,!?:;") not in STOP and len(w) >= 4]
    return max(cands, key=len) if cands else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcript")
    ap.add_argument("--out", default="work/plan.json")
    ap.add_argument("--no-cuts", action="store_true", help="בלי חיתוך ראש/זנב")
    a = ap.parse_args()

    tr = json.load(open(a.transcript, encoding="utf-8"))
    words = [w for w in tr.get("words", []) if (w.get("word") or "").strip()]
    if not words:
        sys.exit("אין מילים בתמלול")
    duration = float(tr.get("duration") or words[-1]["end"])

    cards, cur = [], []
    for i, w in enumerate(words):
        txt = (w["word"] or "").strip()
        cur.append(w)
        joined = " ".join((x["word"] or "").strip() for x in cur)
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["start"] - w["end"]) if nxt else 99.0
        nxt_txt = (nxt["word"] or "").strip() if nxt else ""

        must_break = (
            not nxt
            or len(joined) + len(nxt_txt) + 1 > MAX_CHARS
            or len(cur) >= MAX_WORDS
        )
        good_break = (
            len(cur) >= MIN_WORDS
            and (gap >= GAP_BREAK or nxt_txt in BREAK_BEFORE)
        )
        # לא משאירים מילת יחס/קישור בסוף כרטיס
        if txt.strip(".,!?:;") in GLUE_FORWARD and nxt and len(cur) < MAX_WORDS \
           and len(joined) + len(nxt_txt) + 1 <= MAX_CHARS:
            continue

        if must_break or good_break:
            cards.append(cur)
            cur = []
    if cur:
        cards.append(cur)

    # איחוד כרטיסים קצרים מדי (זמן על המסך)
    merged = []
    for c in cards:
        if merged:
            prev = merged[-1]
            dur = c[-1]["end"] - c[0]["start"]
            joined_len = len(" ".join((x["word"] or "").strip() for x in prev + c))
            if dur < MIN_CARD_SEC and joined_len <= MAX_CHARS and len(prev) + len(c) <= MAX_WORDS:
                merged[-1] = prev + c
                continue
        merged.append(c)

    captions = []
    for idx, c in enumerate(merged):
        toks = [(x["word"] or "").strip() for x in c]
        text = " ".join(toks)
        start = round(c[0]["start"], 2)
        # זנב של 0.12ש' לקריאה — אבל לעולם לא נכנסים לכרטיס הבא.
        # שתי כתוביות שמוצגות יחד = שתי שכבות PNG על המסך בו-זמנית.
        nxt_start = merged[idx + 1][0]["start"] if idx + 1 < len(merged) else None
        end = c[-1]["end"] + 0.12
        if nxt_start is not None:
            end = min(end, nxt_start - 0.02)
        captions.append({
            "start": start,
            "end": round(max(start + 0.2, end), 2),
            "text": text,
            "emph": pick_emphasis(toks),
        })

    plan = {"captions": captions}
    if not a.no_cuts:
        head = max(0.0, round(words[0]["start"] - 0.15, 2))
        tail = min(duration, round(words[-1]["end"] + 0.35, 2))
        plan["cuts"] = [{"start": head, "end": tail}]
        # הזזת הכתוביות לציר החתוך
        for cap in captions:
            cap["start"] = round(max(0.0, cap["start"] - head), 2)
            cap["end"] = round(max(0.05, cap["end"] - head), 2)

    json.dump(plan, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    over = [c["text"] for c in captions if len(c["text"]) > MAX_CHARS]
    print(f"{len(captions)} כרטיסי כתוביות → {a.out}")
    if over:
        print(f"⚠️  {len(over)} כרטיסים חורגים מ-{MAX_CHARS} תווים: {over[:3]}")
    print("→ עכשיו עבור על הכרטיסים: הדגשות, שבירות סמיכות, וכרטיסים שנשמעים חתוכים.")


if __name__ == "__main__":
    main()
