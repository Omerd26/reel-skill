#!/usr/bin/env python3
"""Silence auto-cut — compatibility wrapper. New flow: `reel cut`.

Usage:
  python3 scripts/autocut.py <video> <transcript.json> --out work/cut.mp4 [--remove 12.3-14.0]

Always writes --out (even when there is nothing to cut) plus
<out-dir>/transcript.cut.json and <out-dir>/edit.json next to it. The old
version skipped writing --out when it found no silences, so a cut.mp4 left
from an EARLIER clip was rendered instead; and it encoded with libx264's
default 250-frame GOP + B-frames, which brought back the render freeze.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from reelkit.cutting import write_base  # noqa: E402
from reelkit.project import write_json  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("transcript")
    ap.add_argument("--out", default="work/cut.mp4")
    ap.add_argument("--remove", action="append", default=[], help="start-end (seconds, source timeline)")
    ap.add_argument("--no-trim", action="store_true")
    args = ap.parse_args()

    out = Path(args.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    tr = json.load(open(args.transcript, encoding="utf-8"))
    removals = []
    for spec in args.remove:
        a, b = (float(x) for x in spec.split("-", 1))
        removals.append({"start": a, "end": b, "reason": "manual"})
    edit = write_base(args.video, tr, out, out.parent / "transcript.cut.json", removals,
                      trim_ends=not args.no_trim)
    write_json(out.parent / "edit.json", edit)
    n = sum(1 for r in edit["removals"] if r["reason"] == "silence")
    if n == 0 and not removals:
        print(f"אין שקטים לחיתוך — {out} נכתב מחדש מהמקור (ניקוי ראש/זנב בלבד)")
    else:
        print(f"נחתכו {n} שקטים ({edit['removed_seconds']}s) → {out}")
    print(f"{edit['base']['frames']} פריימים = {edit['base']['duration_seconds']}s · "
          f"transcript.cut.json + edit.json ב-{out.parent}")
    print(json.dumps({"video": str(out), "duration_seconds": edit["base"]["duration_seconds"],
                      "duration_frames": edit["base"]["frames"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
