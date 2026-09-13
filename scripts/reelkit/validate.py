"""Plan validation — catches what breaks a render or misleads a viewer, BEFORE rendering.

Creative limits are DEFAULTS, not laws: they live in props["rules"] and an
explicit instruction from the user (recorded in requirements.json → rules)
overrides them. Hard errors are reserved for things that are actually broken:
missing files, wrong durations, invented numbers, unreadable scenes.
"""
from __future__ import annotations

import re
from pathlib import Path

from . import FPS, HEIGHT, SKILL_ROOT, WIDTH
from . import captions as cap
from .hebrew import merge_number_tokens, parse_digits, spoken_numbers
from .media import MediaError, fingerprint, probe
from .project import read_json

PUBLIC = SKILL_ROOT / "remotion" / "public"

DEFAULT_RULES = {
    "protect_hook_seconds": 3.5,     # no scene before this… (the face + written hook own the opening)
    "opening_max_seconds": 2.5,      # …except a scene with role "opening" that ends by this
    "min_overlays": "auto",          # auto = 4 for ≥40s, 2 for ≥20s — a target, not a quota
    "min_brolls": "auto",            # auto = 2 for ≥40s, 1 for ≥20s
    "zoom_every_seconds": 7,         # 0 = don't suggest zooms
    "min_broll_gap_seconds": 6,
    "hook_max_words": 7,
}

HOOK_VARIANTS = {"bold-stroke", "highlight-box", "minimal-clean"}
CAPTION_STYLES = {"highlight", "tiktok", "classic", "white_card", "cinematic", "none"}

OVERLAY = {
    "glass_info_card": ({"title"}, {"eyebrow", "body", "material", "tone", "width", "rtl"}),
    "highlight_sweep": ({"text", "highlight"}, {"eyebrow", "tone", "rtl"}),
    "question_card": ({"question"}, {"accent_word", "tone"}),
    "word_stack": ({"words"}, {"beat_sec", "tone"}),
    "viewfinder_snap": ({"target_text"}, {"eyebrow", "tone"}),
    "circle_scribble": ({"text"}, {"eyebrow", "tone"}),
    "arrow_scribble": ({"label"}, {"direction", "tone"}),
    "metric_lockup": ({"value"}, {"eyebrow", "prefix", "suffix", "label", "sublabel", "tone", "card", "run_past", "blurred", "tease_label"}),
    "counter_rollup": ({"value"}, {"from_value", "label", "prefix", "suffix", "tone", "run_past"}),
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
    "comment_composer": ({"keyword"}, {"prompt_text", "material", "tone"}),
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
    "custom_layers": ({"layers"}, {"background", "fullscreen"}),
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
    "user_image": ({"image_url"}, {"display", "effect", "show_caption", "card_size", "screen_position", "caption", "description"}),
    "user_video": ({"video_url"}, {"display", "effect", "show_caption", "card_size", "screen_position", "caption", "description"}),
    "custom_layers": ({"layers"}, {"background"}),
}
COMMON = {"id", "type", "start", "end", "transcript_phrase", "rationale", "anchor", "entrance",
          "z", "visual_style", "transition_out", "sync_role", "tease_of", "payoff_of", "tone",
          "role", "requirement_ids", "unspoken_numbers_ok", "items", "primary", "secondary",
          "title", "label", "suffix", "icon", "bars", "highlight_at"}
JOURNEY_MIN = {"screen_journey": 8.0, "blueprint_map": 8.0, "twin_phones_funnel": 6.0,
               "analytics_dashboard": 4.0}

# Overlay anchors (remotion/src/components/overlays/primitives.tsx resolveAnchor) and the
# vertical band each one occupies on the 1080×1920 canvas (after the ×1.3 overlay scale).
ANCHOR_BANDS = {
    "top-left": (200, 720), "top-right": (200, 720), "top-center": (200, 720),
    "left-rail": (220, 740), "right-rail": (220, 740), "center": (700, 1220),
    "above-captions": (800, 1300), "above-captions-left": (800, 1300), "above-captions-right": (800, 1300),
    "bottom-left": (1040, 1560), "bottom-center": (1040, 1560), "bottom-right": (1040, 1560),
}
ANCHORS = set(ANCHOR_BANDS)
# Scenes whose component defaults to the chest-level anchor; every other overlay defaults to top-center.
CHEST_DEFAULT = {"arrow_scribble", "before_after_flip", "brand_chip", "chat_bubble_duo", "circle_scribble",
                 "comment_composer", "counter_rollup", "flow_arrow", "lock_reveal", "lower_third_premium",
                 "magnet_pull", "medal_rank", "notification_burst", "progress_rail", "receipt_card",
                 "retention_curve", "row_badge_wave", "timeline_scrub", "twin_cards", "typing_search",
                 "viewfinder_snap", "word_stack"}

LAYER_KINDS = {"text", "image", "video", "shape"}
ENTERS = {"none", "fade", "pop", "slide-up", "slide-down", "slide-left", "slide-right", "draw", "type", "wipe"}
LOOPS = {"none", "pulse", "float", "spin"}
SHAPES = {"rect", "circle", "line", "arrow", "underline"}
MEDIA_KEYS = ("src", "image_url", "video_url", "icon_src")
NUMBER_EXEMPT_KEYS = {
    "id", "type", "number", "index", "active_index", "dot_count", "beat_sec", "flip_at_sec", "x", "y",
    "w", "h", "size", "weight", "stroke", "stroke_width", "radius", "peak", "volume", "start", "end",
    "enter_at", "exit_at", "z", "opacity", "rotate", "font_size", "line_height", "width", "height",
    "revealed_count", "from_pct", "from_value", "src", "image_url", "video_url", "icon_src", "color",
    "background", "plate", "stroke_color", "tone", "anchor", "variant", "entrance", "transition_out",
    "visual_style", "rationale", "requirement_ids", "role", "fit", "enter", "loop", "kind", "shape",
    "align", "direction", "card_size", "display", "effect", "layout", "material",
}
NUMBER_VALUE_KEYS = {"value", "primary", "to_pct", "pct", "counter"}
EMOJI = re.compile("[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F900-\U0001F9FF\U00002B50\U00002705\U0000274C]")


class Report:
    def __init__(self):
        self.errors: list[str] = []
        self.warns: list[str] = []
        self.info: list[str] = []

    def err(self, m): self.errors.append(m)
    def warn(self, m): self.warns.append(m)
    def note(self, m): self.info.append(m)


def resolve_media(value: str, props_dir: Path) -> Path | None:
    """Where a renderer will read a local file from (None = remote URL)."""
    if not value or value.startswith(("http://", "https://", "data:")):
        return None
    p = Path(value).expanduser()
    if p.is_absolute():
        return p
    for base in (props_dir, PUBLIC):
        if (base / p).exists():
            return base / p
    return props_dir / p


def rules_for(props: dict, duration: float) -> dict:
    rules = {**DEFAULT_RULES, **(props.get("rules") or {})}
    if rules["min_overlays"] == "auto":
        rules["min_overlays"] = 4 if duration >= 40 else 2 if duration >= 20 else 0
    if rules["min_brolls"] == "auto":
        rules["min_brolls"] = 2 if duration >= 40 else 1 if duration >= 20 else 0
    return rules


def walk(obj, key=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from walk(v, k)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk(v, key)
    else:
        yield key, obj


def _numbers_in_scene(sc: dict) -> list[str]:
    found = []
    for k, v in walk(sc):
        if k in NUMBER_EXEMPT_KEYS:
            continue
        if isinstance(v, str) and not v.startswith("#"):
            found += [m.group(0) for m in re.finditer(r"\d[\d,]*(?:\.\d+)?", v)]
        elif isinstance(v, (int, float)) and not isinstance(v, bool) and k in NUMBER_VALUE_KEYS:
            found.append(str(v))
    return found


def check_layers(sc: dict, sid: str, props_dir: Path, r: Report) -> None:
    layers = sc.get("layers")
    if not isinstance(layers, list) or not layers:
        r.err(f"custom_layers '{sid}': layers חייב להיות רשימה לא ריקה")
        return
    dur = float(sc["end"]) - float(sc["start"])
    for i, ly in enumerate(layers):
        where = f"custom_layers '{sid}' שכבה {i}"
        kind = ly.get("kind")
        if kind not in LAYER_KINDS:
            r.err(f"{where}: kind '{kind}' לא מוכר ({', '.join(sorted(LAYER_KINDS))})")
            continue
        for f in ("x", "y"):
            if not isinstance(ly.get(f), (int, float)):
                r.err(f"{where}: חסר {f} (פיקסלים בקנבס 1080×1920)")
        x, y = ly.get("x", 0), ly.get("y", 0)
        w, h = ly.get("w", 0) or 0, ly.get("h", 0) or 0
        if isinstance(x, (int, float)) and isinstance(y, (int, float)):
            if not (-200 <= x <= WIDTH + 200 and -200 <= y <= HEIGHT + 200):
                r.err(f"{where}: המיקום ({x},{y}) מחוץ לקנבס")
            elif x < 0 or y < 0 or x + w > WIDTH or y + h > HEIGHT:
                r.warn(f"{where}: יוצאת מגבולות המסך — ייחתך")
        if kind == "text" and not str(ly.get("text") or "").strip():
            r.err(f"{where}: שכבת טקסט בלי text")
        if kind in ("image", "video"):
            if not ly.get("src"):
                r.err(f"{where}: חסר src")
            if not (w and h):
                r.err(f"{where}: חסרים w/h לתמונה/וידאו")
        if kind == "shape" and ly.get("shape") not in SHAPES:
            r.err(f"{where}: shape חייב להיות אחד מ-{sorted(SHAPES)}")
        if ly.get("enter", "fade") not in ENTERS:
            r.err(f"{where}: enter '{ly.get('enter')}' לא מוכר ({sorted(ENTERS)})")
        if ly.get("loop", "none") not in LOOPS:
            r.err(f"{where}: loop '{ly.get('loop')}' לא מוכר")
        ea, xa = float(ly.get("enter_at") or 0), ly.get("exit_at")
        if ea < 0 or ea >= dur:
            r.err(f"{where}: enter_at={ea} מחוץ למשך הסצנה ({dur:.2f}s)")
        if xa is not None and not (ea < float(xa) <= dur + 1e-6):
            r.err(f"{where}: exit_at={xa} חייב להיות אחרי enter_at ועד סוף הסצנה")


def check_scene(sc: dict, kind: str, schemas: dict, duration: float, words: list[dict],
                nums: list[dict], rules: dict, props_dir: Path, hook: dict | None, r: Report) -> None:
    sid = sc.get("id", "<ללא id>")
    st = sc.get("type")
    if not st or st not in schemas:
        r.err(f"{kind} '{sid}': סוג לא קיים '{st}' — ראה docs/SCENES.md")
        return
    req, opt = schemas[st]
    for f in req:
        v = sc.get(f)
        if v is None or (isinstance(v, (list, dict, str)) and len(v) == 0):
            r.err(f"{kind} '{sid}' ({st}): חסר שדה חובה '{f}'")
    unknown = set(sc) - req - opt - COMMON
    if unknown:
        r.warn(f"{kind} '{sid}' ({st}): שדות לא מוכרים {sorted(unknown)} — ייתכן שיתעלמו")
    try:
        s, e = float(sc["start"]), float(sc["end"])
    except (KeyError, TypeError, ValueError):
        r.err(f"{kind} '{sid}': start/end חסרים או לא מספריים")
        return
    if e <= s:
        r.err(f"{kind} '{sid}': end ({e}) לא אחרי start ({s})")
    if s < 0:
        r.err(f"{kind} '{sid}': start שלילי")
    protect = float(rules["protect_hook_seconds"] or 0)
    if s < protect:
        if sc.get("role") == "opening":
            if e > float(rules["opening_max_seconds"]) + 1e-6:
                r.err(f"{kind} '{sid}': סצנת פתיחה חייבת להסתיים עד {rules['opening_max_seconds']}s "
                      f"(נגמרת ב-{e}s). אפשר לשנות ב-rules.opening_max_seconds אם הבריף מבקש")
            if hook and hook.get("text"):
                hs, he = hook_window(hook)
                if s < he and hs < e:
                    r.warn(f"{kind} '{sid}': סצנת הפתיחה חופפת להוק הכתוב ({hs}-{he}s) — "
                           "הזז את hook.start, או ודא בפריים שהם לא מתנגשים")
        else:
            r.err(f"{kind} '{sid}': מתחיל ב-{s}s — עד {protect}s שמור לפנים ולהוק (ברירת מחדל). "
                  "פתיחה מונפשת? סמן role:\"opening\". הבריף מבקש אחרת? rules.protect_hook_seconds")
    if e > duration + 1 / FPS:
        r.err(f"{kind} '{sid}': נגמר ב-{e}s אחרי סוף הסרטון ({duration}s)")
    if e - s < 1.5 and sc.get("role") != "opening":
        r.warn(f"{kind} '{sid}': קצר מדי ({round(e - s, 1)}s) — מתחת ל-1.5s לא נקלט")
    need = JOURNEY_MIN.get(st)
    if need and (e - s) < need:
        n_items = len(sc.get("items") or [])
        r.err(f"{kind} '{sid}' ({st}): {round(e - s, 1)}s קצר מדי לסצנת מסע"
              f"{f' עם {n_items} שלבים' if n_items else ''} — צריך לפחות {need:.0f}s, "
              "אחרת המצלמה לא מספיקה לעבור והמסך נשאר ריק")
    if st == "custom_layers":
        check_layers(sc, sid, props_dir, r)
    if "anchor" in sc and sc["anchor"] not in ANCHORS:
        r.err(f"{kind} '{sid}': anchor '{sc['anchor']}' לא קיים — אפשרויות: {sorted(ANCHORS)}")
    for k, v in walk(sc):
        if isinstance(v, str) and EMOJI.search(v):
            r.err(f"{kind} '{sid}': אימוג'י בשדה {k} — אסור")
        if k in MEDIA_KEYS and isinstance(v, str):
            p = resolve_media(v, props_dir)
            if p is not None and not p.is_file():
                r.err(f"{kind} '{sid}': הקובץ {v} לא קיים (חיפשתי ב-{p})")
    # numbers on screen must be numbers that were said
    if not sc.get("unspoken_numbers_ok"):
        for raw in _numbers_in_scene(sc):
            vals = parse_digits(raw)
            if not vals:
                continue
            val = vals[0]
            hits = [n for n in nums if abs(n["value"] - val) < 1e-6]
            if not hits:
                r.err(f"{kind} '{sid}': המספר '{raw}' לא נאמר בסרטון. מספר מההודעה של המשתמש? "
                      "סמן unspoken_numbers_ok:true וכתוב rationale")
            elif not any(s - 12 <= h["start"] <= e + 3 for h in hits) and not sc.get("requirement_ids"):
                r.warn(f"{kind} '{sid}': '{raw}' נאמר ב-{hits[0]['start']}s — רחוק מהסצנה ({s}-{e}s). "
                       "ודא שזה הקשר נכון (למשל חזרה למספר שביקשו לזכור)")


def hook_window(hook: dict) -> tuple[float, float]:
    hs = float(hook.get("start", 0) or 0)
    he = float(hook.get("end", hs + 3.0) or hs + 3.0)
    return hs, he


def validate(props_path: str | Path, project_root: str | Path | None = None,
             check_files: bool = True) -> Report:
    r = Report()
    props_path = Path(props_path).resolve()
    props = read_json(props_path)
    if props is None:
        r.err(f"לא נמצא {props_path}")
        return r
    props_dir = props_path.parent
    project_root = Path(project_root).resolve() if project_root else (
        props_dir.parent if (props_dir.parent / "project.json").is_file() else None)

    for f in ("video_path", "words", "duration_seconds", "fps", "editing_plan"):
        if f not in props:
            r.err(f"props: חסר שדה '{f}'")
    fps = int(props.get("fps") or FPS)
    if fps != FPS:
        r.err(f"props.fps={fps} — המנוע והחיתוך עובדים ב-{FPS}")
    duration = float(props.get("duration_seconds") or 0)
    frames = props.get("duration_frames")
    if frames is not None and abs(int(frames) - round(duration * fps)) > 1:
        r.err(f"duration_frames={frames} לא תואם duration_seconds={duration}")
    frames = int(frames) if frames is not None else int(round(duration * fps))
    words = props.get("words") or []
    merged = merge_number_tokens([dict(w) for w in words if (w.get("word") or "").strip()])
    nums = spoken_numbers(merged)
    rules = rules_for(props, duration)
    unknown_rules = set(props.get("rules") or {}) - set(DEFAULT_RULES)
    if unknown_rules:
        r.warn(f"rules: מפתחות לא מוכרים {sorted(unknown_rules)}")

    # ── files and exact duration ────────────────────────────────────────────
    vp = props.get("video_path") or ""
    video = resolve_media(vp, props_dir)
    if check_files and vp:
        if video is None or not video.is_file():
            r.err(f"video_path '{vp}' לא נמצא (חיפשתי ב-{video}). אחרי חיתוך הווידאו הוא work/base.mp4 — הרץ reel props")
        else:
            try:
                info = probe(video)
                vf = info.get("frames") or 0
                if frames > vf:
                    r.err(f"המשך בתוכנית ({frames} פריימים) ארוך מהווידאו ({vf}) — יהיה פריים קפוא בסוף. הרץ reel props")
                elif vf - frames > 1:
                    r.err(f"הווידאו ארוך מהתוכנית ב-{vf - frames} פריימים — הסוף ייחתך. הרץ reel props")
                if not info.get("has_audio"):
                    r.warn("לווידאו אין ערוץ אודיו")
                if info.get("has_b_frames") or (info.get("fps") and abs(info["fps"] - FPS) > 0.01):
                    r.err("הווידאו לא מנורמל (B-frames או fps שונה) — ברנדר הוא ייתקע. השתמש ב-work/base.mp4 מ-reel cut")
                r.note(f"וידאו: {video} · {vf} פריימים")
            except MediaError as ex:
                r.err(str(ex))
        if project_root:
            edit = read_json(project_root / "work" / "edit.json")
            if edit and video and video.is_file() and Path(edit["base"]["path"]).resolve() == video.resolve():
                if fingerprint(video) != edit["base"]["fingerprint"]:
                    r.err("work/base.mp4 השתנה מאז edit.json — הרץ שוב reel cut")
    music = props.get("music")
    if check_files and music and music.get("src"):
        mp = resolve_media(music["src"], props_dir)
        if mp is not None and not mp.is_file():
            r.err(f"music.src '{music['src']}' לא קיים")
        vol = float(music.get("volume", 0.1))
        if not 0 <= vol <= 0.35:
            r.warn(f"music.volume={vol} — מעל 0.35 המוזיקה תתחרה בדיבור")

    if not words:
        r.err("props.words ריק — הכתוביות לא ייבנו")
    elif duration:
        last = max(float(w.get("end", 0)) for w in words)
        if last > duration + 0.05:
            r.err(f"מילה אחרונה ב-{last}s אחרי סוף הסרטון ({duration}s) — התמלול לא שייך לווידאו הזה (חיתוך?)")

    style = props.get("captions_style", "highlight")
    if style not in CAPTION_STYLES:
        r.err(f"captions_style '{style}' לא קיים ({sorted(CAPTION_STYLES)})")
    off = props.get("caption_offset") or 0
    if not isinstance(off, (int, float)) or not -900 <= off <= 300:
        r.err(f"caption_offset={off} — מספר פיקסלים בין ‎-900 (למעלה) ל-300 (למטה); מעבר לזה הכתוביות יוצאות מהמסך")
    elif off > 80:
        r.warn(f"caption_offset={off} מוריד את הכתוביות לאזור הכיתוב והכפתורים של אינסטגרם")
    groups = props.get("caption_groups")
    if style != "none":
        if groups:
            edit_id = None
            if project_root:
                edit = read_json(project_root / "work" / "edit.json")
                edit_id = edit.get("edit_id") if edit else None
            doc = {"groups": groups, "edit_id": props.get("edit_id")}
            styles = [style] if style in cap.PROFILES else ["highlight"]
            errs, warns = cap.check(doc, words, duration, edit_id, styles)
            r.errors += [f"כתוביות: {x}" for x in errs]
            r.warns += [f"כתוביות: {x}" for x in warns]
        else:
            r.warn("אין caption_groups — המנוע יחלק את הכתוביות מכנית. הרץ reel captions + reel props")

    hook = props.get("hook")
    if hook:
        if "style" in hook and "variant" not in hook:
            r.warn(f"hook.style הוא שם ישן — השתמש ב-hook.variant (המנוע מקבל את שניהם)")
        variant = hook.get("variant", hook.get("style", "bold-stroke"))
        if variant not in HOOK_VARIANTS:
            r.err(f"hook.variant '{variant}' לא קיים — אפשרויות: {sorted(HOOK_VARIANTS)}")
        text = (hook.get("text") or "").strip()
        if hook.get("highlight") and hook["highlight"] not in text:
            r.warn(f"hook.highlight '{hook['highlight']}' לא מופיע בטקסט ההוק — לא יודגש")
        if text and len(text.split()) > int(rules["hook_max_words"]):
            r.warn(f"ההוק {len(text.split())} מילים — מעל {rules['hook_max_words']} קשה לקרוא בשלוש שניות")
        hs, he = hook_window(hook)
        if he <= hs or he > duration:
            r.err(f"hook.start/end ({hs}-{he}) לא תקינים")
        if text and EMOJI.search(text):
            r.err("אימוג'י בהוק — אסור")
        for raw in re.findall(r"\d[\d,]*(?:\.\d+)?", text):
            v = parse_digits(raw)
            if v and not any(abs(n["value"] - v[0]) < 1e-6 for n in nums) and not hook.get("unspoken_numbers_ok"):
                r.err(f"בהוק מופיע '{raw}' שלא נאמר בסרטון")
    elif duration >= 8:
        r.warn("אין הוק כתוב — מפסידים את השניות החשובות ביותר (אם הבריף ביקש בלי — התעלם)")

    plan = props.get("editing_plan") or {}
    ov = plan.get("overlay_scenes") or []
    br = plan.get("broll_scenes") or []
    ids = [sc.get("id") for sc in ov + br]
    dup = {i for i in ids if i and ids.count(i) > 1}
    if dup:
        r.err(f"id כפול לסצנות: {sorted(dup)}")
    for sc in ov:
        check_scene(sc, "overlay", OVERLAY, duration, words, nums, rules, props_dir, hook, r)
    for sc in br:
        check_scene(sc, "broll", BROLL, duration, words, nums, rules, props_dir, hook, r)

    def overlaps(a, b):
        try:
            return float(a["start"]) < float(b["end"]) and float(b["start"]) < float(a["end"])
        except (KeyError, TypeError, ValueError):
            return False

    for i, a in enumerate(ov):
        for b in ov[i + 1:]:
            if overlaps(a, b):
                r.err(f"אוברליים חופפים: '{a.get('id')}' ו-'{b.get('id')}' — רק אלמנט אחד בכל רגע")
    for i, a in enumerate(br):
        for b in br[i + 1:]:
            if overlaps(a, b):
                r.err(f"B-rolls חופפים: '{a.get('id')}' ו-'{b.get('id')}'")
    for a in ov:
        for b in br:
            if overlaps(a, b):
                r.err(f"אוברליי '{a.get('id')}' מתחת ל-B-roll '{b.get('id')}' — יוסתר")
    ordered = sorted((b for b in br if "start" in b), key=lambda s: float(s["start"]))
    for a, b in zip(ordered, ordered[1:]):
        gap = float(b["start"]) - float(a["end"])
        if 0 <= gap < float(rules["min_broll_gap_seconds"]):
            r.warn(f"רק {round(gap, 1)}s בין '{a.get('id')}' ל-'{b.get('id')}' (ברירת מחדל ≥{rules['min_broll_gap_seconds']}s)")

    if len(ov) < rules["min_overlays"]:
        r.warn(f"{len(ov)} אוברליים ל-{duration:.0f}ש' (ברירת מחדל {rules['min_overlays']}). "
               "בסדר אם אין עוד רגעים שגרפיקה באמת מסבירה — אל תוסיף קישוט; אם זו החלטה, קבע rules.min_overlays")
    if len(br) < rules["min_brolls"]:
        r.warn(f"{len(br)} B-rolls ל-{duration:.0f}ש' (ברירת מחדל {rules['min_brolls']}) — אותו עיקרון")
    zooms = plan.get("speaker_zooms") or []
    if rules["zoom_every_seconds"] and duration >= 20 and not zooms:
        r.warn(f"אין speaker_zooms — הסרטון ייראה סטטי (ברירת מחדל: אחד כל ~{rules['zoom_every_seconds']}s)")
    for z in zooms:
        try:
            zs = float(z["start"])
            ze = float(z["end"]) if "end" in z else zs + float(z["ease_in"]) + float(z["hold"]) + float(z["ease_out"])
        except (KeyError, TypeError, ValueError):
            r.err(f"speaker_zoom לא תקין: {z} — פורמט: {{start, end, peak}}")
            continue
        if ze <= zs or ze > duration + 1 / FPS:
            r.err(f"speaker_zoom {zs}-{ze} מחוץ לסרטון או הפוך")
        if not 1.0 <= float(z.get("peak", 1.05)) <= 1.25:
            r.warn(f"speaker_zoom peak={z.get('peak')} — מעל 1.25 הפנים ייחתכו")

    if project_root:
        check_requirements(project_root, props, ov + br, r)
        check_face_zones(project_root, props, ov, r)
    return r


def check_face_zones(project_root: Path, props: dict, overlays: list[dict], r: Report) -> None:
    """Warn when an overlay's anchor band would sit on the speaker's face, using the face
    boxes `reel understand` detected (source timeline, mapped through the cut)."""
    und = read_json(project_root / "work" / "understanding.json") or {}
    frames = [f for f in und.get("frames") or [] if f.get("faces")]
    if not frames:
        return
    from .timeline import src_to_base
    keeps = [tuple(k) for k in props.get("keeps_frames") or []]
    faces_at = []
    for f in frames:
        t = src_to_base(float(f["t"]), keeps) if keeps else float(f["t"])
        if t is not None:
            big = max(f["faces"], key=lambda b: b[2] * b[3])      # the speaker, not a stray detection
            faces_at.append((t, big))
    for sc in overlays:
        st = sc.get("type")
        if st == "custom_layers" or "start" not in sc:
            continue
        anchor = sc.get("anchor") or ("above-captions" if st in CHEST_DEFAULT else "top-center")
        band = ANCHOR_BANDS.get(anchor)
        if not band:
            continue
        s, e = float(sc["start"]), float(sc["end"])
        near = [b for t, b in faces_at if s - 1.5 <= t <= e + 1.5] or [b for _, b in faces_at]
        hits = []
        for fx, fy, fw, fh in near:
            inner_top, inner_bottom = fy + fh * 0.2, fy + fh * 0.9      # eyes → chin
            overlap = min(band[1], inner_bottom) - max(band[0], inner_top)
            if overlap > 0.25 * (inner_bottom - inner_top):
                hits.append((fy, fy + fh))
        if hits and len(hits) >= max(1, len(near) // 2):
            fy0 = min(h[0] for h in hits)
            fy1 = max(h[1] for h in hits)
            implicit = "" if sc.get("anchor") else " (ברירת המחדל של הסוג)"
            r.warn(f"overlay '{sc.get('id')}' ({st}): anchor '{anchor}'{implicit} נופל על הפנים "
                   f"(פנים ב-y≈{fy0}-{fy1}). בחר anchor אחר, למשל top-center / top-right, או custom_layers עם מיקום")


def check_requirements(project_root: Path, props: dict, scenes: list[dict], r: Report) -> None:
    req = read_json(project_root / "work" / "requirements.json")
    if req is None:
        r.warn("אין work/requirements.json — לא תועד מה התבקש בהודעה ובסרטון (reel understand)")
        return
    by_id = {s.get("id"): s for s in scenes}
    edit = read_json(project_root / "work" / "edit.json") or {}
    removals = edit.get("removals") or []
    keeps = [tuple(k) for k in edit.get("keeps_frames") or []]
    from .timeline import src_to_base, src_to_base_near
    hook = props.get("hook") or {}
    # requirements.json is written before the cut, so its times are SOURCE times
    to_base = (lambda t: src_to_base_near(float(t), keeps)) if keeps else float
    for q in req.get("requirements") or []:
        rid = q.get("id", "?")
        status = q.get("status", "unreviewed")
        if status == "unreviewed":
            r.err(f"דרישה {rid} עדיין unreviewed — צפה בפריימים והחלט: planned / done / rejected (עם reason)")
            continue
        if status == "rejected" and not q.get("reason"):
            r.err(f"דרישה {rid} נדחתה בלי reason")
        if q.get("cut") and q.get("said_at") and keeps:
            s, e = q["said_at"][:2]
            mid = (float(s) + float(e)) / 2
            if src_to_base(mid, keeps) is not None:
                r.err(f"דרישה {rid} מסומנת cut אבל {s}-{e}s עדיין בסרטון — הרץ reel cut (הוא קורא את הדרישות)")
        if status in ("planned", "done"):
            sids = q.get("scene_ids") or []
            target = q.get("target")
            if not sids and target not in ("hook", "captions", "cut", "zoom", "music", "rules", "none"):
                r.err(f"דרישה {rid} ({status}) בלי scene_ids ובלי target — איך היא מתקיימת?")
            for sid in sids:
                sc = by_id.get(sid)
                if sc is None:
                    r.err(f"דרישה {rid}: הסצנה '{sid}' לא קיימת בתוכנית")
                    continue
                show = q.get("show_at")
                if show and len(show) >= 2:
                    a, b = to_base(show[0]), to_base(show[1])
                    if b <= a:
                        b = a + 0.5
                    if not (float(sc["start"]) < b and a < float(sc["end"])):
                        r.err(f"דרישה {rid}: '{sid}' ({sc['start']}-{sc['end']}s) לא בזמן שהתבקש "
                              f"(show_at {show[0]}-{show[1]}s במקור = {a:.2f}-{b:.2f}s בסרטון הערוך)")
            if target == "hook" and not hook.get("text"):
                r.err(f"דרישה {rid} מיועדת להוק אבל אין hook.text")
    brief_rules = (req.get("rules") or {})
    prop_rules = props.get("rules") or {}
    diff = {k: v for k, v in brief_rules.items() if prop_rules.get(k) != v}
    if diff:
        r.err(f"requirements.rules לא הועתקו ל-props.rules: {diff} — הרץ reel props")
