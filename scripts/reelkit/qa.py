"""Post-render quality control.

Two kinds of checks, never mixed up:

  AUTOMATED (qa/report.json) — measured by code: container, exact frame count,
  audio length, freezes the engine introduced, silence at the edges, loudness,
  audio offset and video offset against the base video, caption data, numbers
  against speech, requirements, and pixel heuristics (graphics touching the
  frame edge, inside Instagram's UI zones, covering a detected face).
  A check that could not run is "not_run" with the reason — never "pass".

  REVIEW (qa/review.json) — things only eyes can judge. Claude opens the
  contact sheets and marks each item pass/fail with a note. Listening items
  are marked for the OWNER: the model cannot hear audio, and must say so.
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from . import FPS, HEIGHT, WIDTH
from . import captions as cap
from .media import MediaError, extract_frame, probe, tool
from .project import Project, read_json, write_json
from .timeline import src_to_base_near


def _status(ok: bool | None, warn_only: bool = False) -> str:
    if ok is None:
        return "not_run"
    return "pass" if ok else ("warn" if warn_only else "fail")


def speaker_zoom_scale(t: float, zooms: list[dict] | None) -> float:
    """Python twin of remotion/src/components/speakerZoom.ts (both zoom shapes)."""
    for z in zooms or []:
        if all(k in z for k in ("ease_in", "hold", "ease_out")):
            s, ei, ho, eo = float(z["start"]), float(z["ease_in"]), float(z["hold"]), float(z["ease_out"])
        else:
            s = float(z["start"])
            span = max(0.3, float(z.get("end", s + 3)) - s)
            ei, ho, eo = span * 0.4, span * 0.2, span * 0.4
        peak = float(z.get("peak", 1.05))
        if t < s or t >= s + ei + ho + eo:
            continue
        ease = lambda p: 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2
        if t < s + ei:
            return 1 + (peak - 1) * ease((t - s) / max(ei, 1e-3))
        if t < s + ei + ho:
            return peak
        return 1 + (peak - 1) * (1 - ease((t - s - ei - ho) / max(eo, 1e-3)))
    return 1.0


# ── ffmpeg measurements ─────────────────────────────────────────────────────
def analyse_stream(path: Path) -> dict:
    """One decode pass: freezes, silences, loudness."""
    r = subprocess.run(
        [tool("ffmpeg"), "-hide_banner", "-nostats", "-i", str(path),
         "-vf", "scale=270:480,freezedetect=n=0.0015:d=0.4",
         "-af", "silencedetect=noise=-45dB:d=0.4,ebur128=peak=true",
         "-f", "null", "-"], capture_output=True, text=True)
    err = r.stderr
    fs = [float(x) for x in re.findall(r"freeze_start: ([\d.]+)", err)]
    fe = [float(x) for x in re.findall(r"freeze_end: ([\d.]+)", err)]
    ss = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", err)]
    se = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    summ = err[err.rfind("Summary:"):] if "Summary:" in err else ""
    lufs = re.search(r"I:\s+(-?[\d.]+) LUFS", summ)
    peak = re.search(r"Peak:\s+(-?[\d.inf]+) dBFS", summ)
    return {
        "freezes": [(a, fe[i] if i < len(fe) else None) for i, a in enumerate(fs)],
        "silences": [(a, se[i] if i < len(se) else None) for i, a in enumerate(ss)],
        "lufs": float(lufs.group(1)) if lufs else None,
        "true_peak": float(peak.group(1)) if peak and "inf" not in peak.group(1) else None,
    }


def _pcm(path: Path, seconds: float, rate: int = 8000):
    import numpy as np
    r = subprocess.run([tool("ffmpeg"), "-v", "error", "-i", str(path), "-t", f"{seconds:.2f}",
                        "-ac", "1", "-ar", str(rate), "-f", "s16le", "-"], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.int16).astype("float32")


def audio_offset_ms(output: Path, base: Path, seconds: float = 20.0) -> float | None:
    try:
        import numpy as np
    except ImportError:
        return None
    rate = 8000
    a, b = _pcm(output, seconds, rate), _pcm(base, seconds, rate)
    n = min(len(a), len(b))
    if n < rate:
        return None
    a, b = a[:n] - a[:n].mean(), b[:n] - b[:n].mean()
    if not a.any() or not b.any():
        return None
    size = 1 << (2 * n - 1).bit_length()
    corr = np.fft.irfft(np.fft.rfft(a, size) * np.conj(np.fft.rfft(b, size)), size)
    max_lag = int(0.5 * rate)
    lags = np.concatenate([corr[-max_lag:], corr[:max_lag + 1]])
    lag = int(np.argmax(lags)) - max_lag
    return round(1000 * lag / rate, 1)


def _gray_frames(path: Path, t0: float, count: int, w: int = 108, h: int = 192):
    import numpy as np
    r = subprocess.run([tool("ffmpeg"), "-v", "error", "-ss", f"{max(0, t0):.4f}", "-i", str(path),
                        "-frames:v", str(count), "-vf", f"scale={w}:{h}", "-f", "rawvideo",
                        "-pix_fmt", "gray", "-"], capture_output=True)
    arr = np.frombuffer(r.stdout, dtype=np.uint8)
    k = len(arr) // (w * h)
    return arr[:k * w * h].reshape(k, h, w).astype("float32")


def video_offset_frames(output: Path, base: Path, t: float) -> dict | None:
    """Compare the output frame at t with base frames t-2..t+2 (face region)."""
    try:
        import numpy as np  # noqa: F401
    except ImportError:
        return None
    out = _gray_frames(output, t, 1)
    ref = _gray_frames(base, t - 2 / FPS, 5)
    if len(out) < 1 or len(ref) < 5:
        return None
    region = (slice(20, 120), slice(10, 98))       # upper/middle, clear of captions
    errs = [float(((out[0][region] - r[region]) ** 2).mean()) for r in ref]
    best = min(range(5), key=lambda i: errs[i])
    spread = max(errs) - min(errs)
    return {"t": round(t, 2), "offset_frames": best - 2, "errors": [round(e, 1) for e in errs],
            "conclusive": spread > 4.0}


def graphics_mask(output_png: Path, base_png: Path, zoom: float):
    import numpy as np
    from PIL import Image
    out = np.asarray(Image.open(output_png).convert("RGB").resize((540, 960)), dtype="int16")
    b = Image.open(base_png).convert("RGB")
    if zoom > 1.0001:
        W, H = b.size
        cw, ch = W / zoom, H / zoom
        b = b.crop(((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2))
    base = np.asarray(b.resize((540, 960)), dtype="int16")
    # Tolerate 2px of misregistration (zoom compensation is not pixel-exact):
    # a pixel is "graphics" only if it is outside the base's local 5×5 range.
    pad = np.pad(base, ((2, 2), (2, 2), (0, 0)), mode="edge")
    win = np.lib.stride_tricks.sliding_window_view(pad, (5, 5), axis=(0, 1))
    lo, hi = win.min(axis=(3, 4)), win.max(axis=(3, 4))
    dist = np.maximum(lo - out, out - hi).clip(min=0).mean(axis=2)
    return dist > 40


# ── sampling plan ────────────────────────────────────────────────────────────
def sample_points(props: dict, duration: float) -> list[dict]:
    pts: list[dict] = []

    def add(t, label, kind, ref=None):
        t = round(min(max(0.0, t), duration - 1.5 / FPS), 3)
        pts.append({"t": t, "label": label, "kind": kind, "ref": ref})

    for t in (0.1, 0.6, 1.2, 2.0):
        if t < duration:
            add(t, f"פתיחה {t}s", "opening")
    hook = props.get("hook") or {}
    if hook.get("text"):
        hs = float(hook.get("start", 0) or 0)
        he = float(hook.get("end", hs + 3) or hs + 3)
        add(hs + min(1.0, (he - hs) * 0.5), "הוק", "hook")
    plan = props.get("editing_plan") or {}
    for kind, key in (("overlay", "overlay_scenes"), ("broll", "broll_scenes")):
        for sc in plan.get(key) or []:
            s, e = float(sc["start"]), float(sc["end"])
            d = e - s
            add(s + min(0.35, d * 0.2), f"{sc.get('id')} כניסה", kind, sc.get("id"))
            add(s + min(d * 0.7, d - 0.3), f"{sc.get('id')} נחת", kind, sc.get("id"))
    groups = props.get("caption_groups") or []
    tricky = [g for g in groups if any(re.search(r"[A-Za-z\d]", w["word"]) for w in g["words"])]
    step = max(1, len(groups) // 6) if groups else 1
    for g in tricky[:6] + groups[::step][:6]:
        mid = (float(g["start"]) + float(g["end"])) / 2
        add(mid, f"כתובית {g.get('id')}", "caption", g.get("id"))
    for t in (duration - 1.0, duration - 0.35, duration - 1.5 / FPS):
        if t > 0:
            add(t, f"סיום {t:.2f}s", "ending")
    seen, uniq = set(), []
    for p in sorted(pts, key=lambda x: x["t"]):
        key = (round(p["t"] * FPS), p["label"])
        if key not in seen:
            seen.add(key)
            uniq.append(p)
    return uniq


def in_windows(t: float, windows: list[tuple[float, float]]) -> bool:
    return any(a - 0.05 <= t <= b + 0.05 for a, b in windows)


# ── main entry ───────────────────────────────────────────────────────────────
def run(project: Project, output: Path, tier: str) -> dict:
    from .validate import validate

    props = read_json(project.props) or {}
    edit = read_json(project.edit) or {}
    base = Path(edit.get("base", {}).get("path") or project.base)
    checks: list[dict] = []

    def add(cid, status, detail, **extra):
        checks.append({"id": cid, "status": status, "detail": detail, **extra})

    qa_dir = project.qa
    frames_dir = qa_dir / "frames"
    for old in frames_dir.glob("*.jpg") if frames_dir.exists() else []:
        old.unlink()
    frames_dir.mkdir(parents=True, exist_ok=True)

    try:
        info = probe(output)
    except MediaError as ex:
        add("container", "fail", str(ex))
        report = {"output": str(output), "tier": tier, "checks": checks}
        write_json(qa_dir / "report.json", report)
        return report

    expected = props.get("duration_frames") or edit.get("base", {}).get("frames")
    ok_container = (info.get("video_codec") == "h264" and info.get("width") == WIDTH and
                    info.get("height") == HEIGHT and abs((info.get("fps") or 0) - FPS) < 0.01 and
                    info.get("pix_fmt") == "yuv420p" and info.get("has_audio"))
    add("container", _status(ok_container),
        f"{info.get('video_codec')} {info.get('width')}x{info.get('height')} {info.get('fps')}fps "
        f"{info.get('pix_fmt')} audio={info.get('audio_codec')}")
    frames = info.get("frames") or 0
    if expected:
        diff = frames - int(expected)
        add("exact_length", "pass" if diff == 0 else "warn" if abs(diff) == 1 else "fail",
            f"{frames} פריימים, מצופה {expected} ({diff:+d})")
    else:
        add("exact_length", "not_run", "אין duration_frames / edit.json להשוואה")
    vdur = frames / FPS
    if info.get("has_audio"):
        ad = info.get("audio_duration") or 0
        add("audio_length", _status(abs(ad - vdur) <= 0.06), f"אודיו {ad:.3f}s מול וידאו {vdur:.3f}s")
    else:
        add("audio_length", "fail", "אין ערוץ אודיו בפלט")

    plan = props.get("editing_plan") or {}
    if tier == "fast":
        # the fast tier renders captions + hook only; judge it by what it draws
        rendered_plan: dict = {}
    else:
        rendered_plan = plan
    broll_windows = [(float(s["start"]), float(s["end"])) for s in rendered_plan.get("broll_scenes") or []]
    full_custom = [(float(s["start"]), float(s["end"])) for s in rendered_plan.get("overlay_scenes") or []
                   if s.get("type") == "custom_layers" and (s.get("fullscreen") or s.get("background"))]
    static_ok = broll_windows + full_custom

    out_an = analyse_stream(output)
    base_an = analyse_stream(base) if base.is_file() else None
    if base_an is not None:
        def covered(a, b):
            return any((bs <= a + 0.1) and ((be or vdur) >= (b or vdur) - 0.1) for bs, be in base_an["freezes"])
        engine = [(a, b) for a, b in out_an["freezes"]
                  if not covered(a, b) and not in_windows(a, static_ok) and not in_windows((b or vdur) - 0.05, static_ok)]
        add("engine_freeze", _status(not engine),
            "אין הקפאות שהמנוע הוסיף" if not engine else
            f"הקפאות שלא קיימות בווידאו המקורי: {[(round(a, 2), round(b or vdur, 2)) for a, b in engine]}")
    else:
        add("engine_freeze", "not_run", "אין base.mp4 להשוואה")
    sil = out_an["silences"]
    lead = next((b for a, b in sil if a <= 0.05 and b), 0.0)
    trail = next((vdur - a for a, b in sil if (b is None or b >= vdur - 0.05) and a > 0.05), 0.0)
    base_trail = 0.0
    if base_an:
        base_dur = (edit.get("base") or {}).get("duration_seconds") or vdur
        base_trail = next((base_dur - a for a, b in base_an["silences"]
                           if (b is None or b >= base_dur - 0.05) and a > 0.05), 0.0)
    music_on = bool((props.get("music") or {}).get("src")) and tier == "full"
    add("edge_silence", _status(trail <= max(0.8, base_trail + 0.1) and lead <= 0.7, warn_only=False),
        f"שקט בהתחלה {lead:.2f}s, בסוף {trail:.2f}s (בבסיס {base_trail:.2f}s)"
        + (" · עם מוזיקה הערך הזה הוא שקט אמיתי בלבד" if music_on else ""))
    lufs, tp = out_an["lufs"], out_an["true_peak"]
    if lufs is None:
        add("loudness", "not_run", "ebur128 לא החזיר מדידה")
    else:
        ok = -20 <= lufs <= -9 and (tp is None or tp <= -0.5)
        add("loudness", _status(ok, warn_only=True),
            f"{lufs} LUFS, שיא {tp} dBFS (יעד לרשתות: בערך ‎-16 עד ‎-10, שיא מתחת ל-‎-1)")

    off = audio_offset_ms(output, base) if base.is_file() else None
    if off is None:
        add("audio_sync", "not_run", "חסר numpy או base.mp4, או שהאודיו שקט מדי למדידה")
    else:
        # positive = audio late. Viewers notice late audio from ~45-60ms, early from ~40ms
        # (EBU R37 / ITU-R BT.1359); anything above 25ms is still worth fixing.
        status = "pass" if abs(off) <= 25 else ("fail" if off > 60 or off < -40 else "warn")
        add("audio_sync", status, f"היסט האודיו מול הבסיס: {off}ms (חיובי = האודיו מאחר)")

    zooms = rendered_plan.get("speaker_zooms") or []
    busy = static_ok + [(float(s["start"]) - 0.2, float(s["end"]) + 0.2) for s in rendered_plan.get("overlay_scenes") or []]
    hook = props.get("hook") or {}
    if hook.get("text"):
        busy.append((float(hook.get("start", 0) or 0), float(hook.get("end", 3) or 3) + 0.2))
    probes, clean = [], []
    t = 0.3
    while t < vdur - 0.3:
        if not in_windows(t, busy) and abs(speaker_zoom_scale(t, zooms) - 1) < 1e-3:
            if not clean or t - clean[-1] >= max(1.0, vdur / 8):
                clean.append(round(t, 2))
        t += 0.1
    try:
        import numpy  # noqa: F401
        has_np = True
    except ImportError:
        has_np = False
    if has_np and base.is_file():
        for t in clean[:6]:
            res = video_offset_frames(output, base, t)
            if res:
                probes.append(res)
    if not has_np:
        add("video_sync", "not_run", "חסר numpy (pip3 install numpy)")
    elif not probes:
        add("video_sync", "not_run", "אין בסרטון רגע בלי גרפיקה/זום/הוק להשוואה מול הבסיס — בדוק סנכרון שפתיים בצפייה")
    else:
        conclusive = [p for p in probes if p["conclusive"]]
        bad = [p for p in conclusive if p["offset_frames"] != 0]
        if not conclusive:
            add("video_sync", "not_run", "התמונה כמעט סטטית — ההשוואה לא חד-משמעית", probes=probes)
        else:
            add("video_sync", _status(not bad),
                f"{len(conclusive)} נקודות, היסט {[p['offset_frames'] for p in conclusive]} פריימים", probes=probes)

    groups = props.get("caption_groups")
    if props.get("captions_style") == "none":
        add("captions_data", "pass", "כתוביות כבויות בכוונה")
    elif groups:
        style = props.get("captions_style", "highlight")
        styles = ["fast"] if tier == "fast" else [style if style in cap.PROFILES else "highlight"]
        errs, warns = cap.check({"groups": groups}, props.get("words"), props.get("duration_seconds"),
                                None, styles)
        add("captions_data", "pass" if not errs else "fail",
            "; ".join(errs[:4]) or f"{len(groups)} קבוצות תקינות" + (f" · {len(warns)} הערות" if warns else ""))
    else:
        add("captions_data", "warn", "אין caption_groups — חלוקה מכנית של המנוע")

    rep = validate(project.props, project.root, check_files=False)
    num_errs = [e for e in rep.errors if "לא נאמר" in e]
    add("numbers_vs_speech", _status(not num_errs), "; ".join(num_errs[:3]) or "כל המספרים שעל המסך נאמרו")
    req_errs = [e for e in rep.errors if e.startswith("דרישה") or "requirements" in e]
    if project.requirements.is_file():
        add("requirements", _status(not req_errs), "; ".join(req_errs[:3]) or "כל הדרישות משויכות לסצנות בזמן הנכון")
    else:
        add("requirements", "not_run", "אין work/requirements.json")
    if tier == "fast":
        skipped = len(plan.get("overlay_scenes") or []) + len(plan.get("broll_scenes") or [])
        add("fast_tier_scope", "warn" if skipped else "pass",
            f"מסלול מהיר: {skipped} סצנות גרפיות וזומים לא רונדרו — חובה לומר זאת למשתמש" if skipped else
            "אין סצנות גרפיות בתוכנית")

    # ── frames, sheets, pixel heuristics ─────────────────────────────────────
    points = sample_points({**props, "editing_plan": rendered_plan}, vdur)
    try:
        from .understand import contact_sheet, detect_faces
        import numpy as np  # noqa: F401
        have_np = True
    except ImportError:
        have_np = False
    edge_hits, ui_hits, face_hits, face_checked = [], [], [], 0
    base_frames = qa_dir / "_base"
    base_frames.mkdir(exist_ok=True)
    for i, p in enumerate(points):
        fn = frames_dir / f"{i:03d}_{p['t']:.2f}.jpg"
        extract_frame(output, p["t"], fn)
        p["path"] = str(fn)
        if not have_np or not base.is_file() or in_windows(p["t"], static_ok):
            continue
        bf = base_frames / f"{i:03d}.png"
        if not extract_frame(base, p["t"], bf):
            continue
        z = speaker_zoom_scale(p["t"], zooms)
        mask = graphics_mask(fn, bf, z)
        import numpy as np
        cols = mask.sum(axis=0)
        rows = mask.sum(axis=1)
        if cols[:3].sum() > 30 or cols[-3:].sum() > 30 or rows[:3].sum() > 30:
            edge_hits.append({"t": p["t"], "label": p["label"]})
        bottom = mask[780:, :].sum()                 # y > 1560 in full res
        right = mask[575:850, 475:].sum()            # button column
        if bottom > 400 or right > 600:
            ui_hits.append({"t": p["t"], "label": p["label"], "bottom_px": int(bottom), "right_px": int(right)})
        faces = detect_faces(bf)
        if faces is None:
            continue
        face_checked += 1
        p["faces"] = faces
        for fx, fy, fw, fh in faces:
            sub = mask[fy // 2:(fy + fh) // 2, fx // 2:(fx + fw) // 2]
            if sub.size and sub.mean() > 0.2 and p["kind"] != "caption":
                face_hits.append({"t": p["t"], "label": p["label"], "covered": round(float(sub.mean()), 2)})
    for f in base_frames.glob("*.png"):
        f.unlink()
    base_frames.rmdir()
    if have_np and base.is_file():
        add("edge_clip", "warn" if edge_hits else "pass",
            f"גרפיקה נוגעת בקצה המסך (ייתכן חיתוך): {edge_hits}" if edge_hits else "שום גרפיקה לא נוגעת בקצוות", hits=edge_hits)
        add("instagram_ui_zones", "warn" if ui_hits else "pass",
            f"גרפיקה באזור הכפתורים/הכיתוב של אינסטגרם: {ui_hits}" if ui_hits else "אזורי הממשק נקיים", hits=ui_hits)
        with_faces = sum(1 for p in points if p.get("faces"))
        if face_checked and with_faces:
            add("face_cover", "warn" if face_hits else "pass",
                f"גרפיקה מכסה פנים: {face_hits}" if face_hits else
                f"פנים לא מכוסות (פנים זוהו ב-{with_faces} מתוך {face_checked} פריימים)", hits=face_hits)
        elif face_checked:
            add("face_cover", "not_run", f"לא זוהו פנים באף אחד מ-{face_checked} הפריימים — בדוק בעין")
        else:
            add("face_cover", "not_run", "OpenCV לא מותקן — pip3 install opencv-python-headless (או בדוק בעין)")
    else:
        for cid in ("edge_clip", "instagram_ui_zones", "face_cover"):
            add(cid, "not_run", "חסר numpy או base.mp4")

    sheets = []
    if points:
        try:
            from .understand import contact_sheet
            for k in range(0, len(points), 12):
                sp = qa_dir / f"sheet_{k // 12 + 1}.jpg"
                contact_sheet(points[k:k + 12], sp, cols=4, thumb_w=300, grid=False)
                sheets.append(str(sp))
        except Exception as ex:  # sheets are a convenience; frames exist regardless
            add("contact_sheets", "warn", f"לא נוצרו דפי פריימים: {ex}")

    report = {"output": str(Path(output).resolve()), "tier": tier, "frames": frames,
              "expected_frames": expected, "checks": checks, "points": points, "sheets": sheets,
              "summary": {s: sum(1 for c in checks if c["status"] == s) for s in ("pass", "warn", "fail", "not_run")}}
    write_json(qa_dir / "report.json", report)
    write_json(qa_dir / "review.json", review_template(project, props, points, sheets, tier))
    return report


def review_template(project: Project, props: dict, points: list[dict], sheets: list[str], tier: str) -> dict:
    words = props.get("words") or []

    def said(a, b):
        return " ".join(w["word"] for w in words if float(w["start"]) < b and float(w["end"]) > a)

    items = []

    def item(cid, what, frames=None, who="model"):
        items.append({"id": cid, "check": what, "frames": frames or [], "who": who,
                      "status": "pending" if who == "model" else "owner", "note": ""})

    pts = lambda kind: [p["path"] for p in points if p["kind"] == kind]
    item("hebrew_rendering", "עברית נכונה בכל פריים: אותיות לא הפוכות, אותיות סופיות במקום, סדר מילים מימין לשמאל, "
         "אנגלית ומספרים קריאים משמאל לימין (Claude Code, 5.1, 10,000)", [p["path"] for p in points])
    item("captions_phrasing", "כל כתובית היא צירוף טבעי: לא נשבר באמצע סמיכות/שם/מספר, המילה החשובה בסוף, "
         "מילה מודגשת אחת — בדוק מול work/captions.json", [p["path"] for p in points if p["kind"] == "caption"])
    item("text_clipped", "שום טקסט לא חתוך בקצה, לא יוצא מכרטיס, לא נחתך בשורה שלישית", [p["path"] for p in points])
    item("contrast", "כל טקסט קריא על הרקע שמאחוריו (גם על בגדים בהירים / רקע לבן)", [p["path"] for p in points])
    item("face_and_placement", "גרפיקות לא מסתירות פנים/פה; כתוביות לא על הפה ולא באזור הכפתורים", [p["path"] for p in points])
    item("opening", "הפתיחה: ההוק קריא ומסקרן, ולא מתנגש בסצנת פתיחה", pts("opening") + pts("hook"))
    item("ending", "הסיום מכוון: לא נחתך באמצע מילה, אין פריים קפוא, אין יד שמושטת לטלפון", pts("ending"))
    plan = props.get("editing_plan") or {}
    for sc in (plan.get("overlay_scenes") or []) + (plan.get("broll_scenes") or []):
        s, e = float(sc["start"]), float(sc["end"])
        frames = [p["path"] for p in points if p.get("ref") == sc.get("id")]
        item(f"scene:{sc.get('id')}", f"הסצנה ({sc.get('type')}) מציגה בדיוק את מה שנאמר: «{said(s - 1, e)}» — "
             "המספרים והמילים על המסך תואמים, והיא נקראת בפריים 'נחת'", frames)
    req = read_json(project.requirements) or {}
    for q in req.get("requirements") or []:
        if q.get("status") in ("planned", "done"):
            item(f"requirement:{q.get('id')}", f"הדרישה «{q.get('instruction') or q.get('quote')}» נראית בפועל "
                 f"(סצנות {q.get('scene_ids')}) במקום ובזמן שהתבקשו", [])
    for g in (props.get("caption_groups") or []):
        if any(re.search(r"[A-Za-z\d]", w["word"]) for w in g["words"]):
            item(f"caption:{g.get('id')}", f"הכתובית «{' '.join(w['word'] for w in g['words'])}» מוצגת בסדר הנכון",
                 [p["path"] for p in points if p.get("ref") == g.get("id")])
    item("listen_mix", "האזנה: הדיבור ברור, המוזיקה לא מתחרה, אין קליקים בנקודות החיתוך", who="owner")
    item("listen_sync", "האזנה + צפייה: השפתיים מסונכרנות לאורך כל הסרטון", who="owner")
    return {"tier": tier, "sheets": sheets,
            "how": "פתח כל sheet (Read), סמן status: pass / fail / fixed והערה קצרה. "
                   "פריטים עם who=owner — Claude לא שומע אודיו; אמור למשתמש שהם עליו.",
            "items": items}


def finalize(project: Project) -> tuple[bool, str]:
    report = read_json(project.qa / "report.json")
    review = read_json(project.qa / "review.json")
    if not report or not review:
        return False, "אין qa/report.json או qa/review.json — הרץ קודם reel qa"
    lines = []
    fails = [c for c in report["checks"] if c["status"] == "fail"]
    pending = [i for i in review["items"] if i["status"] == "pending"]
    bad_review = [i for i in review["items"] if i["status"] == "fail"]
    lines.append("בדיקות אוטומטיות:")
    for c in report["checks"]:
        lines.append(f"  [{c['status']}] {c['id']}: {c['detail']}")
    lines.append("בדיקות צפייה (Claude):")
    for i in review["items"]:
        if i["who"] == "model":
            lines.append(f"  [{i['status']}] {i['id']}" + (f" — {i['note']}" if i.get("note") else ""))
    lines.append("לא בוצע ע\"י Claude (דורש האזנה אנושית):")
    for i in review["items"]:
        if i["who"] == "owner":
            lines.append(f"  [ממתין לך] {i['check']}")
    ok = not fails and not pending and not bad_review
    if pending:
        lines.append(f"✗ {len(pending)} פריטי צפייה עדיין pending — אסור לדווח שהבדיקה בוצעה")
    if fails or bad_review:
        lines.append(f"✗ {len(fails)} בדיקות אוטומטיות נכשלו, {len(bad_review)} פריטי צפייה נכשלו")
    summary = "\n".join(lines)
    (project.qa / "summary.txt").write_text(summary, encoding="utf-8")
    return ok, summary
