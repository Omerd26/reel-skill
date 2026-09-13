"""Decide keep ranges and write the base video + base transcript + edit.json.

Contract (both tiers rely on it): after `cut` the base video ALWAYS exists,
is freshly encoded from the current source, and edit.json describes it with
an exact frame count. "Nothing to cut" is not a special case any more — the
old flow skipped writing cut.mp4, so a cut.mp4 left over from an earlier clip
was silently rendered instead (reproduced 13.9.2026).
"""
from __future__ import annotations

import re
import subprocess
import time
from pathlib import Path

from . import FPS
from .media import encode_keeps, fingerprint, probe, tool
from .timeline import base_duration, build_keeps, edit_id, merge_ranges, remap_words, snap

SILENCE_DB = -37
MIN_SILENCE = 0.9
PAD = 0.18
HEAD_PAD = 0.20      # air kept before the first word
TAIL_PAD = 0.45      # air kept after the last word — ends on a breath, not a hard stop


def detect_silences(video: str | Path, db: float = SILENCE_DB, min_len: float = MIN_SILENCE) -> list[tuple[float, float]]:
    out = subprocess.run(
        [tool("ffmpeg"), "-hide_banner", "-i", str(video), "-af",
         f"silencedetect=noise={db}dB:d={min_len}", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    starts = [float(m) for m in re.findall(r"silence_start: (-?[\d.]+)", out)]
    ends = [float(m) for m in re.findall(r"silence_end: ([\d.]+)", out)]
    return list(zip(starts, ends))


def plan_cut(duration: float, words: list[dict], silences: list[tuple[float, float]],
             manual_removals: list[dict] | None = None, trim_ends: bool = True,
             cut_silences: bool = True, head_pad: float = HEAD_PAD, tail_pad: float = TAIL_PAD) -> dict:
    """Pure decision step (no ffmpeg) — unit-testable."""
    removals: list[dict] = []
    if cut_silences:
        for s, e in silences:
            s2, e2 = s + PAD, e - PAD
            if e2 - s2 < 0.4:
                continue
            # loudness says empty — the transcript must agree
            if any(float(w["start"]) < e2 and s2 < float(w["end"]) for w in words):
                continue
            removals.append({"start": round(s2, 3), "end": round(e2, 3), "reason": "silence"})
    for r in manual_removals or []:
        removals.append({"start": float(r["start"]), "end": float(r["end"]),
                         "reason": r.get("reason", "manual")})

    total_frames = snap(duration)
    head, tail = 0, total_frames
    manual = [(r["start"], r["end"]) for r in removals if r["reason"] != "silence"]
    # trim to the words that SURVIVE the requested cuts — when the last sentence is an
    # aside to the editor, the video must end after the last kept word, not after the aside
    kept = [w for w in words if not any(a <= (float(w["start"]) + float(w["end"])) / 2 <= b for a, b in manual)]
    if trim_ends and kept:
        head = snap(max(0.0, float(kept[0]["start"]) - head_pad))
        tail = snap(min(duration, float(kept[-1]["end"]) + tail_pad))
    # Silence cuts only happen strictly between head and tail. One that touches the
    # trimmed edges is either already gone (not a separate cut) or would eat the
    # intentional air after the last word (the ending then felt chopped).
    removals = [r for r in removals if r["reason"] != "silence" or
                (r["start"] >= head / FPS and r["end"] <= tail / FPS)]
    keeps = build_keeps(total_frames, head, tail,
                        merge_ranges([(r["start"], r["end"]) for r in removals]))
    if not keeps:
        keeps = [(0, total_frames)]
    return {"keeps": keeps, "removals": removals, "head_frame": head, "tail_frame": tail}


def write_base(source: str | Path, transcript: dict, out_video: str | Path,
               out_transcript: str | Path, manual_removals: list[dict] | None = None,
               trim_ends: bool = True, cut_silences: bool = True,
               head_pad: float = HEAD_PAD, tail_pad: float = TAIL_PAD) -> dict:
    from .project import write_json

    src_info = probe(source)
    duration = src_info["frames"] / FPS if src_info.get("frames") else src_info["duration"]
    words = [w for w in (transcript.get("words") or []) if (w.get("word") or "").strip()]
    silences = detect_silences(source) if cut_silences else []
    plan = plan_cut(duration, words, silences, manual_removals, trim_ends, cut_silences, head_pad, tail_pad)
    keeps = plan["keeps"]

    out_video = Path(out_video)
    tmp = out_video.with_name(out_video.stem + ".partial" + out_video.suffix)
    encode_keeps(source, keeps, tmp)
    tmp.replace(out_video)

    base_info = probe(out_video)
    frames, seconds = base_duration(keeps)
    if abs(base_info["frames"] - frames) > 1:
        raise RuntimeError(f"base video has {base_info['frames']} frames, expected {frames}")
    frames = base_info["frames"]
    seconds = round(frames / FPS, 4)

    new_words = remap_words(words, keeps)
    src_fp = fingerprint(source)
    eid = edit_id(keeps, src_fp)
    base_tr = {"timeline": "base", "edit_id": eid, "duration": seconds,
               "text": " ".join(w["word"] for w in new_words), "words": new_words}
    write_json(out_transcript, base_tr)

    removed_sec = round(src_info["duration"] - seconds, 2)
    edit = {
        "version": 2,
        "created": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "fps": FPS,
        "edit_id": eid,
        "source": {"path": str(Path(source).resolve()), "fingerprint": src_fp,
                   "frames": src_info.get("frames"), "duration": src_info["duration"]},
        "keeps_frames": [list(k) for k in keeps],
        "keeps_seconds": [[round(a / FPS, 4), round(b / FPS, 4)] for a, b in keeps],
        "removals": plan["removals"],
        "base": {"path": str(out_video.resolve()), "fingerprint": fingerprint(out_video),
                 "frames": frames, "duration_seconds": seconds,
                 "audio_duration": base_info.get("audio_duration")},
        "transcript": str(Path(out_transcript).resolve()),
        "removed_seconds": removed_sec,
        "pads": {"head": head_pad, "tail": tail_pad, "trim_ends": trim_ends, "cut_silences": cut_silences},
        "dropped_words": len(words) - len(new_words),
    }
    return edit
