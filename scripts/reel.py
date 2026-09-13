#!/usr/bin/env python3
"""reel — one entry point for the whole editing flow, with absolute paths and
one folder per project.

  reel doctor                              what is installed, which tier works
  reel init <video> [--project DIR]        new project, normalised source
  reel transcribe  -p DIR [--topic T]      words on the source timeline
  reel understand  -p DIR                  instruction/relation candidates + frames
  reel cut         -p DIR                  base video + base transcript + edit.json
  reel captions    -p DIR [--rebuild|--check|--retime|--sync-text]
  reel props       -p DIR                  create/refresh work/props.json from the project
  reel validate    -p DIR                  full pre-render check
  reel render      -p DIR [--tier full|fast]   render + automatic QA
  reel qa          -p DIR [--finalize]     QA report / final verdict
  reel status      -p DIR                  what is fresh, what is stale

Run it through the launcher next to SKILL.md ("${CLAUDE_SKILL_DIR}/reel") or
directly: python3 <skill>/scripts/reel.py …
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from reelkit import FPS, SKILL_ROOT  # noqa: E402
from reelkit import captions as cap  # noqa: E402
from reelkit.media import MediaError, fingerprint, normalize, probe  # noqa: E402
from reelkit.project import Project, ProjectError, read_json, slugify, write_json  # noqa: E402

SCRIPTS = SKILL_ROOT / "scripts"
REMOTION = SKILL_ROOT / "remotion"


def say(msg: str = "") -> None:
    try:
        print(msg, flush=True)
    except BrokenPipeError:            # output piped into `head` — keep working, stop printing
        sys.stdout = open(os.devnull, "w")


def fail(msg: str, code: int = 1) -> int:
    print(f"❌ {msg}", file=sys.stderr, flush=True)
    return code


def get_project(args) -> Project:
    root = args.project or os.environ.get("REEL_PROJECT")
    if not root:
        cwd = Path.cwd()
        if (cwd / "project.json").is_file():
            root = cwd
    if not root:
        raise ProjectError("חסר --project <תיקיית הפרויקט> (הנתיב ש-reel init הדפיס)")
    p = Project(root)
    p.load()
    return p


# ── doctor ──────────────────────────────────────────────────────────────────
def cmd_doctor(args) -> int:
    rows = []

    def row(name, ok, detail=""):
        rows.append((name, ok, detail))

    for t in ("ffmpeg", "ffprobe"):
        try:
            from reelkit.media import tool
            row(t, True, tool(t))
        except MediaError:
            row(t, False, "חסר — install.sh מתקין בלי brew")
    for mod, pkg, need in (("PIL", "pillow", True), ("bidi", "python-bidi", True),
                           ("faster_whisper", "faster-whisper", True), ("numpy", "numpy", False),
                           ("cv2", "opencv-python-headless", False)):
        import importlib.util
        if importlib.util.find_spec(mod) is not None:
            row(pkg, True)
        else:
            row(pkg, False if need else None, f"pip3 install {pkg}" + ("" if need else " (אופציונלי: בדיקות QA)"))
    node = shutil.which("node")
    nv = subprocess.run([node, "--version"], capture_output=True, text=True).stdout.strip() if node else ""
    node_ok = bool(nv) and int(nv.lstrip("v").split(".")[0]) >= 18
    row("node ≥18", node_ok, nv or "חסר — בלעדיו אין גרפיקות")
    nm = (REMOTION / "node_modules" / "@remotion" / "renderer").is_dir()
    row("remotion/node_modules", nm, "" if nm else f"cd \"{REMOTION}\" && npm install")
    font = SKILL_ROOT / "assets" / "fonts" / "Heebo-ExtraBold.ttf"
    row("font", font.is_file(), str(font))
    import tempfile
    free_gb = shutil.disk_usage(tempfile.gettempdir()).free / 1e9
    row("disk", free_gb >= 3 or None, f"{free_gb:.1f}GB פנויים" + ("" if free_gb >= 3 else
        " — רנדר מלא צריך בערך 0.5GB ועוד 2.6MB לכל פריים (דקה ≈ 5GB)"))
    for name, ok, detail in rows:
        mark = "✅" if ok else ("➖" if ok is None else "❌")
        say(f"{mark} {name}  {detail}")
    fast = all(ok for n, ok, _ in rows if n in ("ffmpeg", "ffprobe", "pillow", "python-bidi"))
    full = fast and node_ok and nm
    whisper = any(n == "faster-whisper" and ok for n, ok, _ in rows)
    say(f"\nSKILL_ROOT={SKILL_ROOT}")
    say(f"מסלול מהיר: {'זמין' if fast else 'לא זמין'} · מסלול מלא: {'זמין' if full else 'לא זמין'} · "
        f"תמלול: {'זמין' if whisper else 'לא זמין'}")
    return 0 if fast else 1


# ── init ────────────────────────────────────────────────────────────────────
def cmd_init(args) -> int:
    src = Path(args.video).expanduser().resolve()
    if not src.is_file():
        return fail(f"הקובץ לא קיים: {src}")
    root = Path(args.project).expanduser() if args.project else Path.cwd() / "reels" / slugify(args.name or src.name)
    p = Project(root)
    src_fp = fingerprint(src)
    if p.exists():
        data = p.load()
        if data.get("original", {}).get("fingerprint") == src_fp and p.source.is_file() and not args.force:
            say(f"הפרויקט כבר קיים עם אותו קובץ: {p.root}")
            say(f"PROJECT={p.root}")
            return 0
        if not args.force:
            return fail(f"ב-{p.root} יש פרויקט של קובץ אחר ({data.get('original', {}).get('path')}). "
                        "בחר --project אחר, או --force כדי להתחיל מחדש (מוחק את תוצרי העבודה הקודמים)")
        for d in (p.work, p.caps, p.qa, p.root / "source"):
            shutil.rmtree(d, ignore_errors=True)
    p.mkdirs()
    say(f"מנרמל את הווידאו (1080×1920, 30fps, קיפריים כל שנייה)...")
    t0 = time.time()
    tmp = p.source.with_name("input.partial.mp4")
    try:
        info = normalize(src, tmp)
    except MediaError as ex:
        return fail(str(ex))
    tmp.replace(p.source)
    norm = probe(p.source)
    aspect = (info.get("width") or 1) / (info.get("height") or 1)
    if info.get("rotation") in (90, -90, 270, -270):
        aspect = 1 / aspect
    data = {
        "version": 1, "created": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "original": {"path": str(src), "fingerprint": src_fp, "width": info.get("width"),
                     "height": info.get("height"), "fps": info.get("fps"), "duration": info.get("duration"),
                     "codec": info.get("video_codec"), "has_audio": info.get("has_audio")},
        "source": {"path": str(p.source), "fingerprint": fingerprint(p.source),
                   "frames": norm["frames"], "duration": round(norm["frames"] / FPS, 4)},
        "stages": {"init": {"at": time.strftime("%Y-%m-%dT%H:%M:%S")}},
    }
    p.save(data)
    say(f"✅ {norm['frames']} פריימים ({norm['frames'] / FPS:.2f}s) · {time.time() - t0:.1f}s")
    if abs(aspect - 9 / 16) > 0.03:
        say(f"⚠️  הקליפ לא אנכי (יחס {aspect:.2f}) — נחתך למרכז 9:16. בדוק שהפנים בפריים.")
    if not info.get("has_audio"):
        say("⚠️  בקליפ אין אודיו — נוסף שקט. תמלול לא יעבוד.")
    say(f"PROJECT={p.root}")
    return 0


# ── transcribe ─────────────────────────────────────────────────────────────
def cmd_transcribe(args) -> int:
    p = get_project(args)
    cmd = [sys.executable, str(SCRIPTS / "transcribe.py"), str(p.source), "--out", str(p.transcript)]
    if args.topic:
        cmd += ["--topic", args.topic]
    if args.no_vad:
        cmd.append("--no-vad")
    r = subprocess.run(cmd)
    if r.returncode != 0:
        return fail("התמלול נכשל")
    tr = read_json(p.transcript)
    p.mark("transcribe", words=len(tr.get("words") or []), source_fingerprint=p.load()["source"]["fingerprint"])
    say("→ עבור על work/transcript.json ותקן מילים שגויות (שמות, מונחים). אחר כך: reel understand")
    return 0


# ── understand ─────────────────────────────────────────────────────────────
def cmd_understand(args) -> int:
    from reelkit import understand as U
    from reelkit.media import extract_frame
    p = get_project(args)
    tr = read_json(p.transcript)
    if not tr:
        return fail("אין תמלול — הרץ reel transcribe")
    words = tr.get("words") or []
    duration = p.load()["source"]["duration"]
    cues = U.find_cues(words)
    rels = U.find_relations(words, cues)
    frames_dir = p.work / "frames"
    shutil.rmtree(frames_dir, ignore_errors=True)
    frames_dir.mkdir(parents=True)
    items = []
    faces_available = True
    for i, ft in enumerate(U.pick_frame_times(duration, cues, every=args.every)):
        fn = frames_dir / f"{i:03d}_{ft['t']:.2f}.jpg"
        if not extract_frame(p.source, ft["t"], fn):
            continue
        faces = U.detect_faces(fn)
        if faces is None:
            faces_available = False
        near = " ".join(w["word"] for w in words if abs((float(w["start"]) + float(w["end"])) / 2 - ft["t"]) < 1.2)
        items.append({**ft, "path": str(fn), "faces": faces or [], "said_near": near})
    sheets = []
    for k in range(0, len(items), 12):
        sp = frames_dir / f"sheet_{k // 12 + 1}.jpg"
        U.contact_sheet(items[k:k + 12], sp)
        sheets.append(str(sp))
    und = {"source_timeline": True, "duration": duration, "candidates": cues, "relations": rels,
           "frames": items, "sheets": sheets, "faces_detected": faces_available,
           "note": "מועמדים בלבד. Claude מחליט מה הוראה לעורך ומה תוכן לצופה, ורושם ב-requirements.json"}
    write_json(p.understanding, und)

    req = read_json(p.requirements) or {
        "brief": {"user_message": "", "topic": "", "answered": {}, "preferences": []},
        "rules": {}, "requirements": []}
    existing = {(q.get("candidate"), tuple(q.get("said_at") or [])) for q in req["requirements"]}
    n = len(req["requirements"])
    added = 0
    for c in cues:
        relevant = (c["addressed_to_guess"] in ("editor", "unclear") or c["kind_guess"] in ("memory", "retake", "instruction"))
        if not relevant or (c["id"], tuple(c["said_at"])) in existing:
            continue
        n += 1
        added += 1
        req["requirements"].append({
            "id": f"R{n}", "source": "video", "candidate": c["id"], "said_at": c["said_at"],
            "quote": c["quote"], "addressed_to": c["addressed_to_guess"], "status": "unreviewed",
            "instruction": "", "target": None, "show_at": None, "position": None,
            "depends_on": [], "cut": False, "scene_ids": [], "reason": "",
        })
    write_json(p.requirements, req)
    p.mark("understand", candidates=len(cues), relations=len(rels))
    say(f"✅ {len(cues)} מועמדים להוראות/הפניות, {len(rels)} קשרים, {len(items)} פריימים")
    for c in cues:
        say(f"  {c['id']} {c['said_at'][0]:.2f}-{c['said_at'][1]:.2f}s [{c['addressed_to_guess']}] «{c['quote']}» · {', '.join(c['cues'])}")
    for rel in rels:
        say(f"  קשר: {json.dumps(rel, ensure_ascii=False)}")
    say(f"דפי פריימים (עם רשת קואורדינטות 1080×1920{' ומסגרות פנים' if faces_available else ''}):")
    for s in sheets:
        say(f"  {s}")
    say(f"→ {added} דרישות חדשות ב-work/requirements.json במצב unreviewed. צפה בפריימים והשלם כל אחת "
        "(זמנים בציר המקור).")
    return 0


# ── cut ─────────────────────────────────────────────────────────────────────
CUT_DEFAULTS = {"cut_silences": True, "trim_ends": True, "head_pad": 0.20, "tail_pad": 0.45}


def _parse_range(spec: str) -> tuple[float, float]:
    a, b = (float(x) for x in spec.split("-", 1))
    if b <= a:
        raise ValueError
    return round(a, 3), round(b, 3)


def cmd_cut(args) -> int:
    """Cut decisions are cumulative and stored in work/cuts.json: every --remove is kept
    until --restore takes it back, and settings (silence cutting, trimming, pads) stay
    as last chosen. A second `reel cut --remove` used to rebuild the list from scratch
    and silently brought the first removed stretch back."""
    from reelkit.cutting import write_base
    p = get_project(args)
    tr = read_json(p.transcript)
    if not tr:
        return fail("אין תמלול — הרץ reel transcribe")
    cuts_path = p.work / "cuts.json"
    cuts = read_json(cuts_path) or {"manual": [], "settings": dict(CUT_DEFAULTS)}
    settings = {**CUT_DEFAULTS, **(cuts.get("settings") or {})}
    manual = list(cuts.get("manual") or [])

    for spec in args.remove or []:
        try:
            a, b = _parse_range(spec)
        except ValueError:
            return fail(f"--remove בפורמט start-end בשניות (ציר המקור), קיבלתי '{spec}'")
        if not any(abs(m["start"] - a) < 0.01 and abs(m["end"] - b) < 0.01 for m in manual):
            manual.append({"start": a, "end": b, "reason": "manual", "added": time.strftime("%Y-%m-%dT%H:%M:%S")})
    for spec in args.restore or []:
        if spec == "all":
            manual = []
            continue
        try:
            a, b = _parse_range(spec)
        except ValueError:
            return fail(f"--restore בפורמט start-end (כמו ב---list) או all, קיבלתי '{spec}'")
        keep = [m for m in manual if not (abs(m["start"] - a) < 0.05 and abs(m["end"] - b) < 0.05)]
        if len(keep) == len(manual):
            return fail(f"אין חיתוך ידני {a:.2f}-{b:.2f}. הרשימה: reel cut --list")
        manual = keep
    if args.silence is not None:
        settings["cut_silences"] = args.silence
    if args.trim is not None:
        settings["trim_ends"] = args.trim
    if args.head_pad is not None:
        settings["head_pad"] = args.head_pad
    if args.tail_pad is not None:
        settings["tail_pad"] = args.tail_pad

    req_removals = []
    req = read_json(p.requirements) or {}
    for q in req.get("requirements") or []:
        if q.get("cut") and q.get("status") in ("planned", "done") and q.get("said_at"):
            s0, e0 = q.get("cut_range") or q["said_at"][:2]
            req_removals.append({"start": max(0.0, float(s0) - 0.08), "end": float(e0) + 0.08,
                                 "reason": f"requirement {q.get('id')}"})

    if args.list:
        say("הגדרות: " + json.dumps(settings, ensure_ascii=False))
        say(f"חיתוכים ידניים ({len(manual)}) — לביטול: reel cut --restore <start-end>")
        for m in manual:
            say(f"  {m['start']:.2f}-{m['end']:.2f}  (נוסף {m.get('added', '?')})")
        say(f"חיתוכים מדרישות ({len(req_removals)}) — לביטול: cut:false בדרישה")
        for r in req_removals:
            say(f"  {r['start']:.2f}-{r['end']:.2f}  {r['reason']}")
        edit = read_json(p.edit) or {}
        sil = [r for r in edit.get("removals") or [] if r["reason"] == "silence"]
        say(f"שקטים שנחתכו בחיתוך האחרון ({len(sil)}) — לביטול כולם: --no-silence")
        for r in sil:
            say(f"  {r['start']:.2f}-{r['end']:.2f}")
        return 0

    removals = req_removals + [{"start": m["start"], "end": m["end"], "reason": "manual"} for m in manual]
    old_edit = read_json(p.edit)
    say("חותך ומקודד את הווידאו הבסיסי...")
    t0 = time.time()
    try:
        edit = write_base(p.source, tr, p.base, p.base_transcript, removals,
                          trim_ends=settings["trim_ends"], cut_silences=settings["cut_silences"],
                          head_pad=settings["head_pad"], tail_pad=settings["tail_pad"])
    except (MediaError, RuntimeError) as ex:
        return fail(str(ex))
    write_json(cuts_path, {"manual": manual, "settings": settings})
    write_json(p.edit, edit)
    shutil.rmtree(p.caps, ignore_errors=True)
    p.caps.mkdir(exist_ok=True)
    p.mark("cut", edit_id=edit["edit_id"], frames=edit["base"]["frames"])
    n_sil = sum(1 for r in edit["removals"] if r["reason"] == "silence")
    say(f"✅ base.mp4: {edit['base']['frames']} פריימים = {edit['base']['duration_seconds']}s "
        f"(נחתכו {edit['removed_seconds']}s: {n_sil} שקטים, {len(manual)} ידניים, {len(req_removals)} מדרישות, ראש/זנב) "
        f"· {time.time() - t0:.1f}s")
    if n_sil == 0 and not removals:
        say("   אין שקטים ארוכים לחיתוך — הבסיס הוא המקור (עם ניקוי ראש/זנב). כל הנתיבים עודכנו.")
    if edit["dropped_words"]:
        say(f"   {edit['dropped_words']} מילים הוסרו יחד עם הקטעים שנחתכו")
    doc = read_json(p.captions)
    if doc and old_edit and doc.get("edit_id") != edit["edit_id"]:
        new_doc, dropped = cap.retime(doc, edit)
        write_json(p.captions, new_doc)
        say(f"   captions.json הוזז לחיתוך החדש ({dropped} מילים נפלו בחיתוך)")
    if p.props.is_file():
        return refresh_props(p, quiet=False)
    return 0


# ── captions ────────────────────────────────────────────────────────────────
def caption_styles(p: Project) -> list[str]:
    props = read_json(p.props) or {}
    style = props.get("captions_style", "highlight")
    styles = [style] if style in cap.PROFILES else ["highlight"]
    return styles + ["fast"]


def cmd_captions(args) -> int:
    p = get_project(args)
    edit = read_json(p.edit)
    if not edit:
        return fail("אין edit.json — הרץ reel cut לפני הכתוביות")
    base_tr = read_json(p.base_transcript) or {}
    words = base_tr.get("words") or []
    duration = edit["base"]["duration_seconds"]
    styles = caption_styles(p)
    doc = read_json(p.captions)
    if args.retime:
        if not doc:
            return fail("אין captions.json להזיז")
        doc, dropped = cap.retime(doc, edit)
        write_json(p.captions, doc)
        say(f"הוזז לחיתוך {edit['edit_id']} ({dropped} מילים נפלו)")
    elif args.sync_text:
        if not doc:
            return fail("אין captions.json")
        n = cap.sync_text(doc)
        cap.finalize_times(doc["groups"], duration)
        write_json(p.captions, doc)
        say(f"עודכנו {n} קבוצות מתוך text")
    elif doc and not args.rebuild:
        # times always follow the words — a reviewer only moves words between groups
        for g in doc.get("groups") or []:
            g["words"] = sorted(g.get("words") or [], key=lambda w: float(w["start"]))
        cap.finalize_times(doc["groups"], duration)
    if args.rebuild or not doc:
        groups = cap.build(words, styles, duration)
        doc = cap.document(groups, styles, edit, duration)
        write_json(p.captions, doc)
        say(f"✅ {len(groups)} קבוצות כתוביות → {p.captions}")
        for g in groups:
            em = [display for i, display in enumerate(g["text"].split()) if i in (g["emph"] or [])]
            say(f"  {g['id']} {g['start']:6.2f}-{g['end']:6.2f}  «{g['text']}»"
                + (f"  הדגשה: {em[0]}" if em else "") + (f"  שבירה אחרי #{g['break_after']}" if g['break_after'] is not None else ""))
    errs, warns = cap.check(doc, words, duration, edit["edit_id"], styles)
    for w in warns:
        say(f"⚠️  {w}")
    for e in errs:
        say(f"❌ {e}")
    if errs:
        return 1
    write_json(p.captions, doc)
    say(f"✅ הכתוביות תקינות ({len(doc['groups'])} קבוצות, סגנונות: {', '.join(styles)})")
    if p.props.is_file():
        refresh_props(p, quiet=True)
    return 0


# ── props ───────────────────────────────────────────────────────────────────
def refresh_props(p: Project, quiet: bool) -> int:
    from reelkit.timeline import base_to_src, src_to_base_near
    edit = read_json(p.edit)
    if not edit:
        return fail("אין edit.json — הרץ reel cut")
    base_tr = read_json(p.base_transcript) or {}
    props = read_json(p.props) or {
        "captions_style": "highlight", "brand_color": "#E0701E", "caption_offset": 0,
        "watermark": False, "hook": None, "music": None,
        "editing_plan": {"overlay_scenes": [], "broll_scenes": [], "speaker_zooms": [], "effects": []},
    }
    old_keeps = [tuple(k) for k in props.get("keeps_frames") or []]
    new_keeps = [tuple(k) for k in edit["keeps_frames"]]
    moved = 0
    if old_keeps and props.get("edit_id") and props["edit_id"] != edit["edit_id"]:
        def mv(t, side):
            s = base_to_src(float(t), old_keeps, side=side)
            return round(src_to_base_near(s, new_keeps), 3) if s is not None else float(t)

        def move_fields(obj, fields):
            # Only NUMERIC time fields move. `anchor` is a time on a zoom but a position
            # ("top-center") on an overlay — converting that string crashed the re-cut.
            for f, side in fields:
                v = obj.get(f)
                if isinstance(v, (int, float)) and not isinstance(v, bool):
                    obj[f] = mv(v, side)

        plan = props.get("editing_plan") or {}
        span = (("start", "start"), ("anchor", "start"), ("end", "end"))
        for key in ("overlay_scenes", "broll_scenes", "speaker_zooms", "effects"):
            for sc in plan.get(key) or []:
                move_fields(sc, span)
                moved += 1
        for sfx in plan.get("sfx_placements") or []:
            move_fields(sfx, (("timestamp_s", "start"),))
            moved += 1
        move_fields(props.get("hook") or {}, (("start", "start"), ("end", "end")))
    props.update({
        "video_path": edit["base"]["path"],
        "words": base_tr.get("words") or [],
        "duration_seconds": edit["base"]["duration_seconds"],
        "duration_frames": edit["base"]["frames"],
        "fps": FPS,
        "edit_id": edit["edit_id"],
        "keeps_frames": edit["keeps_frames"],
    })
    doc = read_json(p.captions)
    if doc and doc.get("edit_id") == edit["edit_id"]:
        props["caption_groups"] = cap.to_remotion(doc)
    elif doc:
        props.pop("caption_groups", None)
        say("⚠️  captions.json שייך לחיתוך אחר — הרץ reel captions --retime")
    req = read_json(p.requirements) or {}
    if req.get("rules"):
        props["rules"] = {**(props.get("rules") or {}), **req["rules"]}
    write_json(p.props, props)
    if not quiet:
        say(f"✅ props.json עודכן: video={edit['base']['path']} · {edit['base']['frames']} פריימים · "
            f"{len(props['words'])} מילים · {len(props.get('caption_groups') or [])} קבוצות כתוביות")
        if moved:
            say(f"   {moved} סצנות/זומים הוזזו מהחיתוך הקודם לחיתוך החדש — בדוק שהם עדיין על המילים הנכונות")
        dur = edit["base"]["duration_seconds"]
        late = [sc.get("id") for key in ("overlay_scenes", "broll_scenes")
                for sc in (props.get("editing_plan") or {}).get(key) or [] if float(sc.get("end", 0)) > dur]
        if late:
            say(f"⚠️  סצנות אחרי סוף הסרטון החדש: {late}")
    return 0


def cmd_props(args) -> int:
    return refresh_props(get_project(args), quiet=False)


# ── validate ────────────────────────────────────────────────────────────────
def cmd_validate(args) -> int:
    from reelkit.validate import validate
    p = get_project(args)
    if not p.props.is_file():
        return fail("אין work/props.json — הרץ reel props")
    rep = validate(p.props, p.root)
    for w in rep.warns:
        say(f"⚠️  {w}")
    for e in rep.errors:
        say(f"❌ {e}")
    props = read_json(p.props)
    plan = props.get("editing_plan") or {}
    if rep.errors:
        say(f"\n{len(rep.errors)} שגיאות — תקן והרץ שוב.")
        return 1
    say(f"✅ התוכנית תקינה ({len(plan.get('overlay_scenes') or [])} אוברליים, "
        f"{len(plan.get('broll_scenes') or [])} B-rolls, {len(rep.warns)} אזהרות)")
    return 0


# ── render ──────────────────────────────────────────────────────────────────
def render_full(p: Project, out: Path) -> int:
    node = shutil.which("node")
    if not node:
        return fail("Node לא מותקן — אין מסלול מלא. reel render --tier fast, או התקן Node 18+")
    if not (REMOTION / "node_modules" / "@remotion" / "renderer").is_dir():
        return fail(f"מנוע הגרפיקות לא מותקן: cd \"{REMOTION}\" && npm install")
    # Remotion captures every frame as a JPEG and encodes alongside; a 42s reel ran a
    # nearly full disk to ENOSPC mid-render (13.9.2026). Fail early with a clear message.
    frames = int((read_json(p.props) or {}).get("duration_frames") or 0)
    need = 0.5e9 + frames * 2.6e6          # measured: 1253 frames took ~3.1GB at peak
    import tempfile
    free = min(shutil.disk_usage(tempfile.gettempdir()).free, shutil.disk_usage(out.parent).free)
    if free < need:
        return fail(f"אין מספיק מקום פנוי בדיסק לרנדר: יש {free / 1e9:.1f}GB, צריך בערך {need / 1e9:.1f}GB. "
                    "פנה מקום (למשל רנדרים ישנים ב-reels/*/output) ונסה שוב")
    tmp = out.with_name(out.stem + ".partial.mp4")
    # Render copy: free text inside scenes gets no-break spaces between bonded words, so a
    # component that wraps by itself never splits "מוצר א'" or "Claude Code" across lines.
    render_props = p.work / "props.render.json"
    write_json(render_props, protect_scene_text(read_json(p.props)))
    cmd = [node, str(REMOTION / "render_edit.mjs"), "--props", str(render_props), "--output", str(tmp)]
    say("מרנדר (מסלול מלא)... זה לוקח כמה דקות")
    t0 = time.time()
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=str(p.root))
    last_pct, result = -1, None
    tail: list[str] = []
    for line in proc.stdout:
        line = line.rstrip()
        if "Progress:" in line:
            try:
                pct = int(line.rsplit(" ", 1)[-1].rstrip("%"))
            except ValueError:
                continue
            if pct // 20 > last_pct // 20:
                say(f"  {pct}%")
                last_pct = pct
            continue
        if line.startswith("{") and '"success"' in line:
            try:
                result = json.loads(line)
            except json.JSONDecodeError:
                pass
            continue
        tail.append(line)
        if any(k in line for k in ("Staged", "Error", "error", "Warning", "✓")):
            say(f"  {line}")
    proc.wait()
    if proc.returncode != 0 or not result or not result.get("success"):
        say("\n".join(tail[-25:]))
        return fail(f"הרנדר נכשל: {(result or {}).get('error', 'ראה פלט')}")
    from reelkit.media import finish_audio
    edit = read_json(p.edit) or {}
    fin = finish_audio(tmp, reference=(edit.get("base") or {}).get("path"))
    if fin["delay"]:
        say(f"  תוקן היסט אודיו של המנוע: {fin['delay'] * 1000:.1f}ms (השהיית מקודד AAC)")
    if fin["limited"]:
        say(f"  שיא האודיו היה {fin['peak_before']} dB — הוגבל ל-‎-1 dB כדי שלא ייחתך בהעלאה")
    tmp.replace(out)
    say(f"✅ רונדר ב-{time.time() - t0:.0f}s → {out}")
    return 0


# Short label-like fields that components wrap on their own. Fields whose words a component
# matches or animates one by one (highlight_sweep.text, word_stack, question) stay untouched.
BOND_TEXT_KEYS = {"title", "label", "headline", "eyebrow", "primary", "secondary", "sub_text",
                  "divider_label", "button_label", "done_label", "revealed_text", "locked_label",
                  "cut_label", "footnote", "caption", "description", "app_name", "value_label"}


def protect_scene_text(props: dict) -> dict:
    """Copy of props with cap.protect_bonds applied to label-like scene text
    (and to custom_layers text layers, which are rendered as one block)."""
    import copy
    out = copy.deepcopy(props)

    def walk(node, in_layer=False):
        if isinstance(node, dict):
            layer = in_layer or node.get("kind") == "text"
            for k, v in node.items():
                if isinstance(v, str) and " " in v and (k in BOND_TEXT_KEYS or (layer and k == "text")):
                    node[k] = cap.protect_bonds(v)
                elif isinstance(v, (dict, list)):
                    walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    walk(out.get("editing_plan") or {})
    return out


def render_fast(p: Project, out: Path) -> int:
    import importlib
    mc = importlib.import_module("make_captions")
    rd = importlib.import_module("render")
    props = read_json(p.props) or {}
    doc = read_json(p.captions)
    edit = read_json(p.edit)
    if not doc or doc.get("edit_id") != edit.get("edit_id"):
        return fail("captions.json חסר או שייך לחיתוך אחר — reel captions")
    shutil.rmtree(p.caps, ignore_errors=True)
    p.caps.mkdir()
    cards = [] if props.get("captions_style") == "none" else cap.to_cards(doc)
    entries = mc.render_cards(cards, props.get("hook"), p.caps, edit["base"]["duration_seconds"],
                              caption_offset=props.get("caption_offset") or 0)
    tmp = out.with_name(out.stem + ".partial.mp4")
    say("מרנדר (מסלול מהיר)...")
    t0 = time.time()
    try:
        rd.compose(edit["base"]["path"], [], entries, str(tmp))
    except RuntimeError as ex:
        return fail(str(ex))
    from reelkit.media import finish_audio
    fin = finish_audio(tmp)
    if fin["limited"]:
        say(f"  שיא האודיו היה {fin['peak_before']} dB — הוגבל ל-‎-1 dB כדי שלא ייחתך בהעלאה")
    tmp.replace(out)
    plan = props.get("editing_plan") or {}
    skipped = len(plan.get("overlay_scenes") or []) + len(plan.get("broll_scenes") or [])
    say(f"✅ רונדר ב-{time.time() - t0:.0f}s → {out}")
    if skipped or plan.get("speaker_zooms") or (props.get("music") or {}).get("src"):
        say(f"⚠️  מסלול מהיר: לא כולל {skipped} סצנות גרפיות, זומים ומוזיקה — אמור את זה למשתמש")
    return 0


def cmd_render(args) -> int:
    from reelkit.validate import validate
    p = get_project(args)
    if not p.props.is_file():
        return fail("אין work/props.json — הרץ reel props")
    rep = validate(p.props, p.root)
    if rep.errors:
        for e in rep.errors:
            say(f"❌ {e}")
        return fail(f"{len(rep.errors)} שגיאות בתוכנית — לא מרנדרים תוכנית שבורה")
    tier = args.tier
    if tier == "auto":
        tier = "full" if shutil.which("node") and (REMOTION / "node_modules" / "@remotion" / "renderer").is_dir() else "fast"
        say(f"מסלול: {tier}")
    out = Path(args.output).expanduser().resolve() if args.output else p.output_dir / "reel.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    code = render_full(p, out) if tier == "full" else render_fast(p, out)
    if code != 0:
        return code
    p.mark("render", tier=tier, output=str(out), props_mtime=p.props.stat().st_mtime)
    return run_qa(p, out, tier)


# ── qa ──────────────────────────────────────────────────────────────────────
def run_qa(p: Project, out: Path, tier: str) -> int:
    from reelkit import qa
    say("בדיקות איכות אוטומטיות...")
    report = qa.run(p, out, tier)
    for c in report["checks"]:
        icon = {"pass": "✅", "warn": "⚠️ ", "fail": "❌", "not_run": "➖"}[c["status"]]
        say(f"{icon} {c['id']}: {c['detail']}")
    s = report.get("summary", {})
    say(f"\nסיכום אוטומטי: {s.get('pass', 0)} עברו · {s.get('warn', 0)} אזהרות · {s.get('fail', 0)} נכשלו · "
        f"{s.get('not_run', 0)} לא רצו")
    say("דפי פריימים לצפייה (חובה לפתוח כל אחד):")
    for sh in report.get("sheets") or []:
        say(f"  {sh}")
    say(f"→ מלא את {p.qa / 'review.json'} (pass/fail + הערה לכל פריט), ואז: reel qa --finalize")
    p.mark("qa_auto", output=str(out), summary=s)
    return 1 if s.get("fail") else 0


def cmd_qa(args) -> int:
    from reelkit import qa
    p = get_project(args)
    if args.finalize:
        ok, summary = qa.finalize(p)
        say(summary)
        p.mark("qa_final", ok=ok)
        return 0 if ok else 1
    data = p.load()
    out = Path(args.output).resolve() if args.output else Path((data.get("stages", {}).get("render") or {}).get("output") or p.output_dir / "reel.mp4")
    tier = (data.get("stages", {}).get("render") or {}).get("tier", "full")
    return run_qa(p, out, tier)


# ── status ──────────────────────────────────────────────────────────────────
def cmd_status(args) -> int:
    p = get_project(args)
    data = p.load()
    say(f"PROJECT={p.root}")
    for k, v in (data.get("stages") or {}).items():
        say(f"  {k}: {v}")
    edit = read_json(p.edit)
    problems = []
    if edit:
        if edit["source"]["fingerprint"] != data["source"]["fingerprint"]:
            problems.append("edit.json נבנה ממקור אחר — reel cut")
        if p.base.is_file() and fingerprint(p.base) != edit["base"]["fingerprint"]:
            problems.append("base.mp4 השתנה אחרי edit.json — reel cut")
        doc = read_json(p.captions)
        if doc and doc.get("edit_id") != edit["edit_id"]:
            problems.append("captions.json שייך לחיתוך אחר — reel captions --retime")
        props = read_json(p.props)
        if props and props.get("edit_id") != edit["edit_id"]:
            problems.append("props.json שייך לחיתוך אחר — reel props")
    rend = (data.get("stages") or {}).get("render")
    if rend and p.props.is_file() and p.props.stat().st_mtime > rend.get("props_mtime", 0) + 1:
        problems.append("props.json השתנה אחרי הרנדר האחרון — הפלט לא מעודכן")
    for pr in problems:
        say(f"⚠️  {pr}")
    if not problems:
        say("✅ הכול מסונכרן")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(prog="reel", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    def with_project(sp):
        sp.add_argument("-p", "--project", help="תיקיית הפרויקט (מ-reel init)")
        return sp

    sub.add_parser("doctor").set_defaults(fn=cmd_doctor)
    sub.add_parser("root").set_defaults(fn=lambda a: say(str(SKILL_ROOT)) or 0)
    sp = sub.add_parser("init")
    sp.add_argument("video")
    sp.add_argument("--project")
    sp.add_argument("--name")
    sp.add_argument("--force", action="store_true")
    sp.set_defaults(fn=cmd_init)
    sp = with_project(sub.add_parser("transcribe"))
    sp.add_argument("--topic", default="")
    sp.add_argument("--no-vad", action="store_true")
    sp.set_defaults(fn=cmd_transcribe)
    sp = with_project(sub.add_parser("understand"))
    sp.add_argument("--every", type=float, default=2.0, help="פריים סקירה כל N שניות")
    sp.set_defaults(fn=cmd_understand)
    sp = with_project(sub.add_parser("cut"))
    sp.add_argument("--remove", action="append", help="start-end בשניות (ציר המקור); נשמר לחיתוכים הבאים")
    sp.add_argument("--restore", action="append", help="start-end של חיתוך ידני להחזיר, או all")
    sp.add_argument("--list", action="store_true", help="הצג את כל החיתוכים וההגדרות בלי לחתוך")
    sp.add_argument("--no-silence", dest="silence", action="store_false", default=None, help="בלי חיתוך שקטים (נשמר)")
    sp.add_argument("--silence", dest="silence", action="store_true", help="להחזיר חיתוך שקטים")
    sp.add_argument("--no-trim", dest="trim", action="store_false", default=None, help="בלי ניקוי ראש/זנב (נשמר)")
    sp.add_argument("--trim", dest="trim", action="store_true", help="להחזיר ניקוי ראש/זנב")
    sp.add_argument("--head-pad", type=float, default=None, help="שניות לפני המילה הראשונה (ברירת מחדל 0.20, נשמר)")
    sp.add_argument("--tail-pad", type=float, default=None,
                    help="שניות אחרי המילה האחרונה שנשארת — סיום מכוון (ברירת מחדל 0.45, נשמר)")
    sp.set_defaults(fn=cmd_cut)
    sp = with_project(sub.add_parser("captions"))
    g = sp.add_mutually_exclusive_group()
    g.add_argument("--rebuild", action="store_true")
    g.add_argument("--check", action="store_true")
    g.add_argument("--retime", action="store_true")
    g.add_argument("--sync-text", action="store_true")
    sp.set_defaults(fn=cmd_captions)
    with_project(sub.add_parser("props")).set_defaults(fn=cmd_props)
    with_project(sub.add_parser("validate")).set_defaults(fn=cmd_validate)
    sp = with_project(sub.add_parser("render"))
    sp.add_argument("--tier", choices=["auto", "full", "fast"], default="auto")
    sp.add_argument("--output")
    sp.set_defaults(fn=cmd_render)
    sp = with_project(sub.add_parser("qa"))
    sp.add_argument("--finalize", action="store_true")
    sp.add_argument("--output")
    sp.set_defaults(fn=cmd_qa)
    with_project(sub.add_parser("status")).set_defaults(fn=cmd_status)

    args = ap.parse_args()
    try:
        return int(args.fn(args) or 0)
    except (ProjectError, MediaError) as ex:
        return fail(str(ex))


if __name__ == "__main__":
    sys.exit(main())
