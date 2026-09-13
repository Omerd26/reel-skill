"""Shared fixtures: synthetic clips built with ffmpeg lavfi, fake transcripts."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from reelkit.media import MediaError, tool  # noqa: E402


def have_ffmpeg() -> bool:
    try:
        tool("ffmpeg")
        tool("ffprobe")
        return True
    except MediaError:
        return False


def have_remotion() -> bool:
    return bool(shutil.which("node")) and (ROOT / "remotion" / "node_modules" / "@remotion" / "renderer").is_dir()


def tmpdir() -> Path:
    return Path(tempfile.mkdtemp(prefix="reel-test-"))


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise AssertionError(f"command failed: {' '.join(map(str, cmd))}\n{r.stdout}\n{r.stderr}")
    return r


def tone_clip(path: Path, segments: list[tuple[str, float]], color: str = "testsrc2",
              gop: int = 250, bframes: bool = True, size: str = "1080x1920") -> Path:
    """Video with an audio track made of ("tone"|"silence", seconds) segments.
    Default encode mimics a phone/libx264 default: long GOP with B-frames."""
    parts, labels = [], []
    for i, (kind, dur) in enumerate(segments):
        if kind == "tone":
            parts.append(f"sine=f=330:sample_rate=48000:d={dur},volume=0.6[s{i}]")
        else:
            parts.append(f"anullsrc=r=48000:cl=mono,atrim=0:{dur}[s{i}]")
        labels.append(f"[s{i}]")
    total = sum(d for _, d in segments)
    fc = ";".join(parts) + ";" + "".join(labels) + f"concat=n={len(segments)}:v=0:a=1[a]"
    vsrc = f"testsrc2=size={size}:rate=30" if color == "testsrc2" else f"color={color}:size={size}:rate=30"
    cmd = [tool("ffmpeg"), "-y", "-v", "error", "-f", "lavfi", "-i", vsrc,
           "-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-t", f"{total}",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", str(gop)]
    if not bframes:
        cmd += ["-bf", "0"]
    cmd += ["-c:a", "aac", str(path)]
    run(cmd)
    return path


def words_over(segments: list[tuple[str, float]], texts: list[str]) -> list[dict]:
    """Fake word timestamps spread evenly over the tone segments."""
    spans, t = [], 0.0
    for kind, dur in segments:
        if kind == "tone":
            spans.append((t, t + dur))
        t += dur
    words, it = [], iter(texts)
    for s, e in spans:
        n = max(1, int((e - s) / 0.4))
        step = (e - s) / n
        for k in range(n):
            try:
                w = next(it)
            except StopIteration:
                return words
            words.append({"word": w, "start": round(s + k * step + 0.02, 3), "end": round(s + (k + 1) * step - 0.02, 3)})
    return words


def write_json(path: Path, data) -> Path:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    return path
