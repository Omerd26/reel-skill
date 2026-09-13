#!/usr/bin/env python3
"""Hebrew word-level transcription for the reel skill (faster-whisper).

Usage:
  python3 scripts/transcribe.py <video> [--topic "..."] [--out work/transcript.json] [--no-vad]

Output JSON: {text, duration, words: [{word, start, end, probability}]}
First run downloads the ivrit-ai Hebrew model (~1.2GB) to the HF cache.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from reelkit.hebrew import merge_number_tokens  # noqa: E402  (shared with the renderers)
from reelkit.media import tool  # noqa: E402


MODEL = "ivrit-ai/whisper-large-v3-turbo-ct2"


def extract_audio(video: str) -> str:
    fd, wav = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    subprocess.run(
        [tool("ffmpeg"), "-y", "-v", "error", "-i", video,
         "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav],
        check=True,
    )
    return wav


def probe_duration(video: str) -> float:
    out = subprocess.run(
        [tool("ffprobe"), "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", video],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out or 0)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--topic", default="")
    ap.add_argument("--out", default="work/transcript.json")
    ap.add_argument("--no-vad", action="store_true")
    args = ap.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("faster-whisper לא מותקן. הרץ: pip3 install faster-whisper", file=sys.stderr)
        return 2

    wav = extract_audio(args.video)
    try:
        print("טוען מודל תמלול (בפעם הראשונה: הורדה של ~1.2GB)...", file=sys.stderr)
        model = WhisperModel(MODEL, device="cpu", compute_type="int8")
        segments, _info = model.transcribe(
            wav,
            language="he",
            word_timestamps=True,
            vad_filter=not args.no_vad,
            condition_on_previous_text=False,  # מונע לולאות חזרה וסחף זמנים
            initial_prompt=(args.topic or None),
        )
        words = []
        for seg in segments:
            for w in seg.words or []:
                token = (w.word or "").strip()
                if token:
                    words.append({
                        "word": token,
                        "start": round(w.start, 3),
                        "end": round(w.end, 3),
                        "probability": round(w.probability, 3),
                    })
        words = merge_number_tokens(words)
        result = {
            "text": " ".join(w["word"] for w in words),
            "duration": round(probe_duration(args.video), 3),
            "words": words,
        }
        os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False)
        print(f"תומלל: {len(words)} מילים, {result['duration']}s → {args.out}")
        return 0
    finally:
        os.unlink(wav)


if __name__ == "__main__":
    sys.exit(main())
