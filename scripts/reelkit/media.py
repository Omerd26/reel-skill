"""ffmpeg / ffprobe helpers: probing, fingerprints, normalisation, segment encode."""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path

from . import FPS, HEIGHT, WIDTH

# Keyframe every second, no B-frames, constant 30fps. Remotion's OffthreadVideo
# seeks by timestamp; with far-apart keyframes (iPhone HEVC, or libx264's
# default GOP of 250) it returned the same frame for 2-3 seconds — the "video
# freezes at 5-7s" bug (measured 12.9.2026). Every video the renderers read
# is encoded with these flags, including the cut output.
SEEK_FRIENDLY = [
    "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-r", str(FPS),
    "-g", str(FPS), "-keyint_min", str(FPS), "-sc_threshold", "0", "-bf", "0",
    "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-video_track_timescale", "30000", "-movflags", "+faststart",
]


class MediaError(RuntimeError):
    pass


def tool(name: str) -> str:
    """Locate ffmpeg/ffprobe, including the no-brew install location."""
    found = shutil.which(name)
    if found:
        return found
    for d in ("~/.local/bin", "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"):
        p = Path(d).expanduser() / name
        if p.is_file() and os.access(p, os.X_OK):
            return str(p)
    raise MediaError(f"{name} לא נמצא. הרץ את install.sh או התקן ffmpeg.")


def run(cmd: list[str], what: str) -> subprocess.CompletedProcess:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        tail = (r.stderr or r.stdout or "").strip()[-1500:]
        raise MediaError(f"{what} נכשל:\n{tail}")
    return r


def probe(path: str | Path) -> dict:
    """Exact facts about a media file. Frame count is counted, not estimated."""
    path = str(path)
    if not Path(path).is_file():
        raise MediaError(f"הקובץ לא קיים: {path}")
    r = run([tool("ffprobe"), "-v", "error", "-count_packets", "-show_entries",
             "format=duration:stream=index,codec_type,codec_name,width,height,"
             "r_frame_rate,avg_frame_rate,nb_read_packets,pix_fmt,has_b_frames,"
             "sample_rate,channels,duration:stream_side_data=rotation",
             "-of", "json", path], f"ffprobe {path}")
    data = json.loads(r.stdout or "{}")
    v = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), None)
    a = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None)
    out = {"path": str(Path(path).resolve()),
           "duration": float(data.get("format", {}).get("duration") or 0.0)}
    if v:
        num, _, den = (v.get("avg_frame_rate") or "0/1").partition("/")
        fps = float(num) / float(den or 1) if float(den or 1) else 0.0
        rot = 0
        for sd in v.get("side_data_list") or []:
            if "rotation" in sd:
                rot = int(sd["rotation"])
        out.update({
            "video_codec": v.get("codec_name"), "width": v.get("width"),
            "height": v.get("height"), "fps": round(fps, 3),
            "frames": int(v.get("nb_read_packets") or 0),
            "pix_fmt": v.get("pix_fmt"), "has_b_frames": int(v.get("has_b_frames") or 0),
            "video_duration": float(v.get("duration") or 0.0), "rotation": rot,
        })
    if a:
        out.update({"audio_codec": a.get("codec_name"),
                    "sample_rate": int(a.get("sample_rate") or 0),
                    "channels": int(a.get("channels") or 0),
                    "audio_duration": float(a.get("duration") or 0.0)})
    out["has_video"] = v is not None
    out["has_audio"] = a is not None
    return out


def keyframe_times(path: str | Path) -> list[float]:
    r = run([tool("ffprobe"), "-v", "error", "-select_streams", "v", "-skip_frame", "nokey",
             "-show_entries", "frame=pts_time", "-of", "csv=p=0", str(path)], "ffprobe keyframes")
    return [float(x.strip(",")) for x in r.stdout.split() if x.strip(", ")]


def fingerprint(path: str | Path) -> str:
    """Content hash. Same name + new content = new fingerprint, which is what
    lets every cache in the pipeline notice a replaced file."""
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def normalize(src: str | Path, dst: str | Path) -> dict:
    """Any phone clip → 1080×1920 CFR30 seek-friendly H.264 + AAC 48k.

    Scales to COVER the vertical frame and centre-crops, so both tiers work in
    the same pixel space (the fast tier draws 1080×1920 caption PNGs at 0,0 —
    on a 4K source they used to land in a corner)."""
    info = probe(src)
    if not info["has_video"]:
        raise MediaError("בקובץ אין וידאו")
    vf = (f"fps={FPS},scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase:flags=lanczos,"
          f"crop={WIDTH}:{HEIGHT},setsar=1")
    cmd = [tool("ffmpeg"), "-y", "-v", "error", "-i", str(src)]
    if not info["has_audio"]:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-shortest"]
    cmd += ["-vf", vf, *SEEK_FRIENDLY, str(dst)]
    run(cmd, "נרמול הווידאו")
    return info


def encode_keeps(src: str | Path, keeps_frames: list[tuple[int, int]], dst: str | Path) -> None:
    """Concatenate [start_frame, end_frame) ranges of a CFR30 source.

    Video is trimmed by frame index and audio by the identical boundaries, so
    the two can never drift. A 12ms audio fade at each join removes clicks."""
    parts, chain = [], []
    fade = 0.012
    for i, (a, b) in enumerate(keeps_frames):
        s, e = a / FPS, b / FPS
        dur = e - s
        af = f"asetpts=PTS-STARTPTS"
        if len(keeps_frames) > 1 and dur > 4 * fade:
            af += f",afade=t=in:d={fade},afade=t=out:st={dur - fade:.4f}:d={fade}"
        parts.append(f"[0:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{i}]")
        parts.append(f"[0:a]atrim=start={s:.6f}:end={e:.6f},{af}[a{i}]")
        chain.append(f"[v{i}][a{i}]")
    fc = ";".join(parts) + ";" + "".join(chain) + f"concat=n={len(keeps_frames)}:v=1:a=1[v][a]"
    run([tool("ffmpeg"), "-y", "-v", "error", "-i", str(src), "-filter_complex", fc,
         "-map", "[v]", "-map", "[a]", *SEEK_FRIENDLY, str(dst)], "חיתוך הווידאו")


def extract_frame(video: str | Path, t: float, dst: str | Path, width: int | None = None) -> bool:
    vf = [] if not width else ["-vf", f"scale={width}:-2"]
    r = subprocess.run([tool("ffmpeg"), "-y", "-v", "error", "-ss", f"{max(0.0, t):.3f}",
                        "-i", str(video), "-frames:v", "1", *vf, str(dst)],
                       capture_output=True, text=True)
    return r.returncode == 0 and Path(dst).is_file()


AAC_PRIMING = 2048 / 48000     # the delay Remotion's muxer leaves uncompensated (measured 13.9.2026)


def fix_audio_delay(path: str | Path, reference: str | Path | None = None, fps: int = FPS) -> float:
    """Remotion's MP4 carries no AAC encoder-delay compensation: the 2048
    priming samples play as real audio, so speech lands ~43ms after the
    picture (measured 13.9.2026: onset 0.614s vs 0.571s in the base video).
    The surplus audio length is NOT the delay — the track is also padded to a
    whole AAC frame (a duration-based trim over-corrected by 8ms). So: measure
    the real offset against the reference (the base video) by cross-correlation,
    fall back to the known priming length. Video is copied untouched; the audio
    is trimmed, padded back to the exact video length, and re-encoded (ffmpeg
    writes proper skip-samples). Returns the seconds removed."""
    info = probe(path)
    if not info.get("has_audio") or not info.get("frames"):
        return 0.0
    vdur = info["frames"] / fps
    surplus = float(info.get("audio_duration") or 0) - vdur
    if surplus <= 0.005:
        return 0.0
    delay = min(surplus, AAC_PRIMING)
    if reference is not None:
        try:
            from .qa import audio_offset_ms
            measured = audio_offset_ms(Path(path), Path(reference))
        except Exception:
            measured = None
        if measured is not None and abs(measured / 1000 - AAC_PRIMING) <= 0.015:
            delay = measured / 1000
        elif measured is not None and abs(measured) <= 5:
            delay = 0.0
    if delay <= 0.003:
        return 0.0
    path = Path(path)
    tmp = path.with_name(path.stem + ".avfix" + path.suffix)
    run([tool("ffmpeg"), "-y", "-v", "error", "-i", str(path),
         "-map", "0:v:0", "-map", "0:a:0", "-c:v", "copy",
         "-af", f"atrim=start={delay:.4f},asetpts=PTS-STARTPTS,apad",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{vdur:.4f}",
         "-movflags", "+faststart", str(tmp)], "תיקון היסט האודיו")
    tmp.replace(path)
    return round(delay, 4)
