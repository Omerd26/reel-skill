#!/usr/bin/env python3
"""Plan validator for the reel skill — catches the mistakes that produce a
broken video BEFORE a 6-minute render burns.

Usage:  python3 scripts/validate_plan.py work/props.json

Exit 0 = ready to render. Exit 1 = errors printed (fix and re-run).
Warnings never block, but read them — they're the difference between
"works" and "good".
"""
from __future__ import annotations

import json
import re
import sys

# ── Scene schemas: type → (required fields, optional fields) ────────────────
OVERLAY = {
    "glass_info_card": ({"title"}, {"eyebrow", "body", "material", "tone", "width", "rtl"}),
    "highlight_sweep": ({"text", "highlight"}, {"eyebrow", "tone", "rtl"}),
    "question_card": ({"question"}, {"accent_word", "tone"}),
    "word_stack": ({"words"}, {"beat_sec", "tone"}),
    "viewfinder_snap": ({"target_text"}, {"eyebrow", "tone"}),
    "circle_scribble": ({"text"}, {"eyebrow", "tone"}),
    "arrow_scribble": ({"label"}, {"direction", "tone"}),
    "metric_lockup": ({"value"}, {"eyebrow", "prefix", "suffix", "label", "sublabel", "tone", "card", "run_past", "blurred", "tease_label"}),
    "counter_rollup": ({"value"}, {"from_value", "label", "prefix", "suffix", "tone"}),
    "metric_comparison": ({"left", "right"}, {"eyebrow", "tone", "material"}),
    "receipt_card": ({"title", "rows"}, {"footnote", "tone"}),
    "retention_curve": (set(), {"headline", "dip_label", "hold_label", "tone"}),
    "card_grid_reveal": ({"cards"}, {"headline", "layout", "rtl", "material", "blurred", "tease_label"}),
    "comparison_board": ({"left", "right"}, {"divider_label", "highlight", "material", "rtl"}),
    "before_after_flip": ({"before", "after"}, {"flip_at_sec", "tone"}),
    "twin_cards": ({"left", "right"}, {"winner", "tone"}),
    "medal_rank": ({"items"}, {"headline", "tone"}),
    "row_badge_wave": ({"rows"}, {"headline", "tone"}),
    "settings_toggle_list": ({"title", "rows"}, {"eyebrow", "body", "corner_badge", "corner_badge_tone", "tone", "material", "rtl", "blurred", "revealed_count", "tease_label"}),
    "progress_rail": ({"steps"}, {"active_index", "tone"}),
    "notification_card": ({"app_name", "title", "body"}, {"app_icon_letter", "app_icon_color", "time_label", "rtl"}),
    "notification_burst": ({"app_name", "titles"}, {"badge_count", "tone"}),
    "chat_bubble_duo": ({"messages"}, {"tone"}),
    "typing_search": ({"query"}, {"suggestions", "tone"}),
    "comment_composer": ({"keyword"}, {"prompt_text"}),
    "toggle_switch": ({"to_state"}, {"from_state", "variant", "tone", "eyebrow", "blurred", "tease_label"}),
    "tap_interaction": ({"button_label"}, {"done_label", "eyebrow", "tone"}),
    "lock_reveal": ({"revealed_text"}, {"locked_label", "tone"}),
    "magnet_pull": (set(), {"label", "dot_count", "tone"}),
    "timeline_scrub": ({"cut_label"}, {"headline", "tone"}),
    "progress_fill": ({"to_pct"}, {"from_pct", "variant", "eyebrow", "unit", "tone", "show_check", "run_past", "blurred"}),
    "lower_third_premium": ({"primary"}, {"secondary", "avatar_letter", "avatar_color", "variant"}),
    "badge_stack": ({"items"}, {"headline", "layout"}),
    "flow_arrow": (set(), {"variant", "label", "nodes", "tone", "eyebrow"}),
    "app_icon_network": ({"hub", "leaves"}, {"title", "eyebrow", "corner_badge", "tone", "material"}),
    "key_value_table": ({"title", "rows"}, {"eyebrow", "corner_badge", "corner_badge_tone", "tone", "material"}),
}
BROLL = {
    "screen_journey": ({"items"}, {"title"}),
    "blueprint_map": ({"items"}, {"title"}),
    "twin_phones_funnel": ({"items"}, {"title"}),
    "graph_spike": ({"bars"}, {"title", "primary", "secondary"}),
    "stat_counter": ({"primary"}, {"title", "suffix", "label", "secondary", "icon"}),
    "shockwave_counter": ({"primary"}, {"title", "suffix", "label", "icon"}),
    "analytics_dashboard": ({"items"}, {"title", "primary", "secondary"}),
    "workflow_pipeline": ({"items"}, {"title", "primary", "secondary"}),
    "key_point": ({"primary"}, {"title", "secondary", "icon"}),
    "checklist_outcome": ({"items"}, {"title", "primary"}),
    "list_highlight": ({"items"}, {"title"}),
    "icon_list": ({"items"}, {"title"}),
    "text_slam": ({"primary"}, {"title", "secondary"}),
    "spotlight_reveal": ({"primary"}, {"title", "secondary"}),
}
COMMON = {"id", "type", "start", "end", "transcript_phrase", "rationale",
          "anchor", "entrance", "z", "visual_style", "transition_out",
          "sync_role", "tease_of", "payoff_of", "tone"}

EMOJI = re.compile("[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F900-\U0001F9FF\U00002B50\U00002705\U0000274C]")

errors: list[str] = []
warns: list[str] = []


def walk_strings(obj, path="") -> list[tuple[str, str]]:
    out = []
    if isinstance(obj, str):
        out.append((path, obj))
    elif isinstance(obj, dict):
        for k, v in obj.items():
            out += walk_strings(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            out += walk_strings(v, f"{path}[{i}]")
    return out


def check_scene(sc: dict, kind: str, schemas: dict, duration: float, spoken: str) -> None:
    sid = sc.get("id", "<ללא id>")
    st = sc.get("type")
    if not st or st not in schemas:
        errors.append(f"{kind} '{sid}': סוג לא קיים '{st}' — ראה docs/SCENES.md")
        return
    req, opt = schemas[st]
    for f in req:
        v = sc.get(f)
        if v is None or (isinstance(v, (list, dict, str)) and len(v) == 0):
            errors.append(f"{kind} '{sid}' ({st}): חסר שדה חובה '{f}'")
    unknown = set(sc) - req - opt - COMMON - {"items", "primary", "secondary", "title", "label", "suffix", "icon", "bars", "highlight_at"}
    if unknown:
        warns.append(f"{kind} '{sid}' ({st}): שדות לא מוכרים {sorted(unknown)} — ייתכן שיתעלמו")
    try:
        s, e = float(sc["start"]), float(sc["end"])
    except (KeyError, TypeError, ValueError):
        errors.append(f"{kind} '{sid}': start/end חסרים או לא מספריים")
        return
    if e <= s:
        errors.append(f"{kind} '{sid}': end ({e}) לא אחרי start ({s})")
    if s < 3.5:
        errors.append(f"{kind} '{sid}': מתחיל ב-{s}s — 3.5 השניות הראשונות שמורות להוק")
    if e > duration + 0.05:
        errors.append(f"{kind} '{sid}': נגמר ב-{e}s אחרי סוף הסרטון ({duration}s)")
    if e - s < 1.5:
        warns.append(f"{kind} '{sid}': קצר מדי ({round(e - s, 1)}s) — מתחת ל-1.5s לא נקלט")
    for p, text in walk_strings(sc):
        if EMOJI.search(text):
            errors.append(f"{kind} '{sid}': אימוג'י בשדה{p} — אסור")
    # spoken-number rule
    for p, text in walk_strings(sc):
        for num in re.findall(r"\d[\d,]{2,}", text):
            bare = num.replace(",", "")
            if bare not in spoken.replace(",", "") and num not in spoken:
                warns.append(f"{kind} '{sid}': המספר '{num}' לא נמצא בתמלול — ודא שנאמר")


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: validate_plan.py work/props.json", file=sys.stderr)
        return 2
    props = json.load(open(sys.argv[1], encoding="utf-8"))

    for f in ("video_path", "words", "duration_seconds", "fps", "editing_plan"):
        if f not in props:
            errors.append(f"props: חסר שדה '{f}'")
    duration = float(props.get("duration_seconds") or 0)
    words = props.get("words") or []
    spoken = " ".join(w.get("word", "") for w in words)
    if not words:
        errors.append("props.words ריק — הכתוביות לא ייבנו")
    if words and duration:
        last = max(float(w.get("end", 0)) for w in words)
        if last > duration + 0.5:
            errors.append(f"props: מילה אחרונה ב-{last}s אחרי duration ({duration}s) — התמלול לא תואם לווידאו החתוך")

    plan = props.get("editing_plan") or {}
    ov = plan.get("overlay_scenes") or []
    br = plan.get("broll_scenes") or []
    for sc in ov:
        check_scene(sc, "overlay", OVERLAY, duration, spoken)
    for sc in br:
        check_scene(sc, "broll", BROLL, duration, spoken)

    def overlaps(a, b):
        return float(a["start"]) < float(b["end"]) and float(b["start"]) < float(a["end"])

    for i, a in enumerate(ov):
        for b in ov[i + 1:]:
            if "start" in a and "start" in b and overlaps(a, b):
                errors.append(f"אוברליים חופפים: '{a.get('id')}' ו-'{b.get('id')}' — רק אלמנט אחד בכל רגע")
    for i, a in enumerate(br):
        for b in br[i + 1:]:
            if "start" in a and "start" in b and overlaps(a, b):
                errors.append(f"B-rolls חופפים: '{a.get('id')}' ו-'{b.get('id')}'")
    for a in ov:
        for b in br:
            if "start" in a and "start" in b and overlaps(a, b):
                errors.append(f"אוברליי '{a.get('id')}' מתחת ל-B-roll '{b.get('id')}' — יוסתר")
    for i, a in enumerate(sorted(br, key=lambda s: float(s.get("start", 0)))[:-1]):
        nxt = sorted(br, key=lambda s: float(s.get("start", 0)))[i + 1]
        gap = float(nxt.get("start", 0)) - float(a.get("end", 0))
        if 0 <= gap < 6:
            warns.append(f"רק {round(gap, 1)}s בין שני B-rolls — מומלץ ≥6s")

    if duration >= 20 and not ov and not br:
        warns.append("אין אף סצנה — הסרטון יהיה דיבור בלבד")
    hook = props.get("hook")
    if not hook or not (hook.get("text") or "").strip():
        warns.append("אין הוק כתוב — מפסידים את 3 השניות החשובות ביותר")

    for w in warns:
        print(f"⚠️  {w}")
    for e in errors:
        print(f"❌ {e}")
    if errors:
        print(f"\n{len(errors)} שגיאות — תקן ב-props.json והרץ שוב.")
        return 1
    print(f"✅ התוכנית תקינה ({len(ov)} אוברליים, {len(br)} B-rolls, {len(warns)} אזהרות) — אפשר לרנדר.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
