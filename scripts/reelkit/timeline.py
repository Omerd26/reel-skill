"""Source ↔ edited ("base") timeline maps.

A cut is a list of keep ranges on the source, snapped to whole frames. Every
timestamp that moves between timelines goes through here, so the words, the
caption groups and the video are always cut by exactly the same boundaries.
"""
from __future__ import annotations

import hashlib
import json

from . import FPS


def snap(t: float) -> int:
    return int(round(t * FPS))


def merge_ranges(ranges: list[tuple[float, float]]) -> list[tuple[float, float]]:
    out: list[list[float]] = []
    for s, e in sorted((float(a), float(b)) for a, b in ranges if b > a):
        if out and s <= out[-1][1] + 1e-6:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return [(a, b) for a, b in out]


def build_keeps(total_frames: int, head_frame: int, tail_frame: int,
                removals: list[tuple[float, float]], min_keep_frames: int = 2) -> list[tuple[int, int]]:
    """Keep [head, tail) minus removals, in frames."""
    head_frame = max(0, min(head_frame, total_frames))
    tail_frame = max(head_frame, min(tail_frame, total_frames))
    cursor = head_frame
    keeps: list[tuple[int, int]] = []
    for s, e in merge_ranges(removals):
        a, b = max(snap(s), head_frame), min(snap(e), tail_frame)
        if b <= a:
            continue
        if a - cursor >= min_keep_frames:
            keeps.append((cursor, a))
        cursor = max(cursor, b)
    if tail_frame - cursor >= min_keep_frames:
        keeps.append((cursor, tail_frame))
    return keeps


def edit_id(keeps: list[tuple[int, int]], source_fp: str) -> str:
    raw = json.dumps({"k": keeps, "s": source_fp}, sort_keys=True).encode()
    return hashlib.sha1(raw).hexdigest()[:12]


def src_to_base(t: float, keeps: list[tuple[int, int]], eps: float = 1e-6) -> float | None:
    acc = 0
    for a, b in keeps:
        s, e = a / FPS, b / FPS
        if s - eps <= t <= e + eps:
            return round(acc / FPS + min(max(t, s), e) - s, 4)
        acc += b - a
    return None


def src_to_base_near(t: float, keeps: list[tuple[int, int]]) -> float:
    """Like src_to_base, but a time inside a removed stretch lands on the
    next kept moment (or the end, if nothing is kept after it)."""
    hit = src_to_base(t, keeps)
    if hit is not None:
        return hit
    acc = 0
    for a, b in keeps:
        if t < a / FPS:
            return round(acc / FPS, 4)
        acc += b - a
    return round(acc / FPS, 4)


def base_to_src(t: float, keeps: list[tuple[int, int]], side: str = "start") -> float | None:
    """Edited time → source time. A time ON a join is ambiguous (end of one
    segment = start of the next, and word times are rounded to 1ms): a word
    START belongs to the following segment, a word END to the preceding one.
    Getting this wrong moved a word that starts right after a cut back into
    the removed silence, and a re-cut dropped it from the captions."""
    tol = 0.004
    acc = 0.0
    n = len(keeps)
    for i, (a, b) in enumerate(keeps):
        length = (b - a) / FPS
        end = acc + length
        if side == "start" and i + 1 < n and end - tol <= t <= end + tol:
            acc = end
            continue
        if t <= end + (tol if side == "end" else 1e-6) or i + 1 == n:
            return round(a / FPS + min(max(0.0, t - acc), length), 4)
        acc = end
    return None


def remap_words(words: list[dict], keeps: list[tuple[int, int]]) -> list[dict]:
    """Move words onto the edited timeline. A word survives only if its middle
    is kept; its edges are clamped to the keep range it lives in (a word never
    stretches across a cut)."""
    out = []
    acc = 0
    ranges = []
    for a, b in keeps:
        ranges.append((a / FPS, b / FPS, acc / FPS))
        acc += b - a
    for w in words:
        ws, we = float(w["start"]), float(w["end"])
        mid = (ws + we) / 2
        for s, e, off in ranges:
            if s <= mid <= e:
                ns = off + max(ws, s) - s
                ne = off + min(we, e) - s
                if ne > ns:
                    out.append({**w, "start": round(ns, 3), "end": round(ne, 3)})
                break
    return out


def base_duration(keeps: list[tuple[int, int]]) -> tuple[int, float]:
    frames = sum(b - a for a, b in keeps)
    return frames, round(frames / FPS, 4)
