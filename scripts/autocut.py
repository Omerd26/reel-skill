#!/usr/bin/env python3
"""Silence auto-cut for the reel skill — v1 (conservative).

Cuts only CLEAR dead air: stretches ≥0.9s quieter than -37dB, keeping 0.18s
of breathing room on each side. Remaps the transcript to the cut timeline.

Usage:
  python3 scripts/autocut.py <video> <transcript.json> --out remotion/public/videos/cut.mp4

Writes the cut video + work/transcript.cut.json. Exits 0 with the ORIGINAL
transcript copied if nothing worth cutting was found (caller uses input.mp4).
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys

SILENCE_DB = -37
MIN_SILENCE = 0.9
PAD = 0.18


def detect_silences(video: str) -> list[tuple[float, float]]:
    out = subprocess.run(
        ["ffmpeg", "-i", video, "-af",
         f"silencedetect=noise={SILENCE_DB}dB:d={MIN_SILENCE}", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    starts = [float(m) for m in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(m) for m in re.findall(r"silence_end: ([\d.]+)", out)]
    return list(zip(starts, ends))


def probe_duration(video: str) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", video], capture_output=True, text=True,
    ).stdout.strip()
    return float(out or 0)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("transcript")
    ap.add_argument("--out", default="remotion/public/videos/cut.mp4")
    args = ap.parse_args()

    tr = json.load(open(args.transcript, encoding="utf-8"))
    duration = tr.get("duration") or probe_duration(args.video)
    words = tr.get("words") or []

    silences = detect_silences(args.video)
    # A silence is cuttable only if NO word overlaps it (belt and braces —
    # loudness said empty, the transcript must agree).
    removals = []
    for s, e in silences:
        s2, e2 = s + PAD, e - PAD
        if e2 - s2 < 0.4:
            continue
        if any(w["start"] < e2 and s2 < w["end"] for w in words):
            continue
        # never cut the very start hook-breath or the final second
        if s2 < 1.0 or e2 > duration - 1.0:
            continue
        removals.append((round(s2, 3), round(e2, 3)))

    if not removals:
        print("אין שקטים לחיתוך — ממשיכים עם המקור")
        json.dump(tr, open("work/transcript.cut.json", "w", encoding="utf-8"), ensure_ascii=False)
        return 0

    # keep-segments = complement of removals
    keeps, cursor = [], 0.0
    for s, e in removals:
        if s - cursor > 0.05:
            keeps.append((cursor, s))
        cursor = e
    if duration - cursor > 0.05:
        keeps.append((cursor, duration))

    # concat via filter (frame-accurate, single re-encode)
    parts_v, parts_a, lines = [], [], []
    for i, (s, e) in enumerate(keeps):
        lines.append(
            f"[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS[v{i}];"
            f"[0:a]atrim=start={s}:end={e},asetpts=PTS-STARTPTS[a{i}];"
        )
        parts_v.append(f"[v{i}]")
        parts_a.append(f"[a{i}]")
    n = len(keeps)
    fc = "".join(lines) + "".join(
        v + a for v, a in zip(parts_v, parts_a)
    ) + f"concat=n={n}:v=1:a=1[outv][outa]"
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", args.video,
         "-filter_complex", fc, "-map", "[outv]", "-map", "[outa]",
         "-c:v", "libx264", "-preset", "fast", "-crf", "18",
         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
         "-c:a", "aac", "-b:a", "192k", args.out],
        check=True,
    )

    # remap words to the cut timeline
    def remap(t: float) -> float | None:
        acc = 0.0
        for s, e in keeps:
            if s <= t <= e:
                return round(acc + (t - s), 3)
            acc += e - s
        return None

    new_words = []
    for w in words:
        ns, ne = remap(w["start"]), remap(w["end"])
        if ns is not None and ne is not None and ne > ns:
            new_words.append({**w, "start": ns, "end": ne})
    new_duration = round(probe_duration(args.out), 3)
    out_tr = {
        "text": " ".join(w["word"] for w in new_words),
        "duration": new_duration,
        "words": new_words,
    }
    json.dump(out_tr, open("work/transcript.cut.json", "w", encoding="utf-8"), ensure_ascii=False)
    removed = round(duration - new_duration, 1)
    print(f"נחתכו {len(removals)} שקטים ({removed}s) → {args.out} ({new_duration}s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
