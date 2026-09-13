#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
render.py <video> <plan.json|-> <capdir> <out.mp4>
מרכיב את שכבות ה-PNG (כתוביות + הוק) על הווידאו ומייצא באיכות אינסטגרם.

• בזרימה החדשה הווידאו הוא work/base.mp4 (כבר חתוך), ו-plan הוא "-": בלי חיתוכים.
• plan.json ישן עם cuts עדיין נתמך — החיתוך נעשה כאן, לפי אותם גבולות.
לא דורש libass. לא דורש bash מודרני.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile


def ffmpeg_bin():
    for c in ("ffmpeg", os.path.expanduser("~/.local/bin/ffmpeg"), "/opt/homebrew/bin/ffmpeg",
              "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"):
        p = shutil.which(c) or (c if os.path.isfile(c) and os.access(c, os.X_OK) else None)
        if p:
            return p
    raise RuntimeError("ffmpeg לא מותקן. הרץ install.sh")


def compose(raw, cuts, ovs, out):
    ff = ffmpeg_bin()
    cuts = sorted(cuts or [], key=lambda c: float(c["start"]))
    parts = []
    if cuts:
        for i, c in enumerate(cuts):
            a, b = float(c["start"]), float(c["end"])
            parts.append(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{i}]")
            parts.append(f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS[a{i}]")
        chain = "".join(f"[v{i}][a{i}]" for i in range(len(cuts)))
        parts.append(f"{chain}concat=n={len(cuts)}:v=1:a=1[vbase][aout]")
    else:
        parts.append("[0:v]null[vbase]")
        parts.append("[0:a]anull[aout]")

    inputs, cur = [], "[vbase]"
    for k, o in enumerate(ovs):
        inputs += ["-i", o["png"]]
        nxt = f"[vo{k}]" if k < len(ovs) - 1 else "[vout]"
        parts.append(
            f"{cur}[{k+1}:v]overlay=0:0:enable='between(t,{o['start']},{o['end']})'{nxt}")
        cur = nxt
    if not ovs:
        parts.append("[vbase]null[vout]")

    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as fh:
        fh.write(";".join(parts))
        script = fh.name

    cmd = [ff, "-hide_banner", "-loglevel", "warning", "-y", "-i", raw] + inputs + [
        "-filter_complex_script", script,
        "-map", "[vout]", "-map", "[aout]",
        "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-profile:v", "high", "-level", "4.1", "-preset", "slow",
        "-crf", "18", "-maxrate", "9M", "-bufsize", "12M",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-map_metadata", "-1", "-fflags", "+bitexact",
        "-movflags", "+faststart", out]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True)
    finally:
        os.unlink(script)
    if r.returncode != 0:
        raise RuntimeError("❌ הרינדור נכשל:\n" + r.stderr[-2500:])


def main():
    if len(sys.argv) < 5:
        sys.exit("usage: render.py <video> <plan.json|-> <capdir> <out.mp4>")
    raw, plan_p, capdir, out = sys.argv[1:5]
    plan = {} if plan_p == "-" else json.load(open(plan_p, encoding="utf-8"))
    ov_p = os.path.join(capdir, "overlays.json")
    ovs = json.load(open(ov_p, encoding="utf-8")) if os.path.exists(ov_p) else []
    # captions.json (groups) is already on the edited timeline — never cut again
    cuts = [] if "groups" in plan else (plan.get("cuts") or [])
    try:
        compose(raw, cuts, ovs, out)
    except RuntimeError as ex:
        sys.exit(str(ex))
    print(f"✅ {out}")
    probe = shutil.which("ffprobe") or "/opt/homebrew/bin/ffprobe"
    if os.path.exists(probe):
        subprocess.run([probe, "-v", "error", "-show_entries", "format=duration",
                        "-show_entries", "stream=width,height", "-of", "default=nw=1", out])
    print("⚠️  להעביר כמסמך, לא כסרטון בוואטסאפ — אחרת נדחס.")


if __name__ == "__main__":
    main()
