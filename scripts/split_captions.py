#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
split_captions.py <transcript.json> [--out work/plan.json] [--no-cuts]

תאימות לזרימה הישנה (plan.json של המסלול המהיר). הזרימה החדשה: reel captions.

מפצל תמלול לכרטיסי כתוביות עם אותו בונה שמשמש את שני המסלולים
(scripts/reelkit/captions.py): לפי משמעות (שמות באנגלית, גרסאות, מספר+יחידה,
מילות יחס) ולפי רוחב מדוד, לא לפי ספירת מילים.

⚠️ הזמנים ב-plan.json הם בציר הגולמי, ו-make_captions.py ממפה אותם לפי cuts.
הגרסה הקודמת הזיזה אותם כאן *וגם* שם — הכרטיס הראשון נעלם והשאר הוקדמו
בגודל חיתוך הראש (נמדד 13.9.2026).
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reelkit.captions import build, to_cards, document  # noqa: E402


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

    groups = build(words, ["highlight", "fast"], duration)
    cards = to_cards(document(groups, ["highlight", "fast"], None, duration))
    plan = {"captions": [{k: c[k] for k in ("start", "end", "text", "emph", "break_after")} for c in cards]}
    if not a.no_cuts:
        head = max(0.0, round(words[0]["start"] - 0.15, 2))
        tail = min(duration, round(words[-1]["end"] + 0.35, 2))
        plan["cuts"] = [{"start": head, "end": tail}]
        # זמני הכתוביות נשארים בציר הגולמי — make_captions.py ממפה לפי cuts
        for c in plan["captions"]:
            c["end"] = min(c["end"], tail)

    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    json.dump(plan, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(plan['captions'])} כרטיסי כתוביות → {a.out}")
    print("→ עכשיו עבור על הכרטיסים: הדגשות, שבירות סמיכות, וכרטיסים שנשמעים חתוכים.")


if __name__ == "__main__":
    main()
