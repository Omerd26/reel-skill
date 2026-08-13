#!/usr/bin/env bash
# probe.sh <video> — מודד את הגולמי ומחלץ מפת שתיקות + אודיו לתמלול
set -euo pipefail
V="${1:?usage: probe.sh <video>}"
OUT="${2:-$(dirname "$V")}"

FF=$(command -v ffmpeg || echo /opt/homebrew/bin/ffmpeg)
FP=$(command -v ffprobe || echo /opt/homebrew/bin/ffprobe)
[ -x "$FF" ] || { echo "ffmpeg not found. brew install ffmpeg"; exit 1; }

echo "=== קובץ ==="
"$FP" -v error -show_entries format=duration \
  -show_entries stream=width,height,r_frame_rate,codec_name \
  -of default=nw=1 "$V"

echo
echo "=== מפת שתיקות (‎-35dB, מינימום 0.35ש׳) ==="
"$FF" -hide_banner -i "$V" -af "silencedetect=noise=-35dB:d=0.35" -f null - 2>&1 \
  | grep -E "silence_(start|end)" \
  | sed -E 's/.*silence_start: /START /; s/.*silence_end: ([0-9.]+).*/END   \1/'

echo
echo "=== בלוקי דיבור (מה שנשאר בין השתיקות) ==="
"$FF" -hide_banner -i "$V" -af "silencedetect=noise=-35dB:d=0.35" -f null - 2>&1 \
  | grep -E "silence_(start|end)" \
  | sed -E 's/.*silence_start: ([0-9.]+).*/S \1/; s/.*silence_end: ([0-9.]+).*/E \1/' \
  | awk -v dur="$("$FP" -v error -show_entries format=duration -of csv=p=0 "$V")" '
      BEGIN{prev=0; n=0}
      $1=="S"{ if ($2-prev > 0.15) printf "בלוק %d: %.2f → %.2f  (%.2fש׳)\n", ++n, prev, $2, $2-prev }
      $1=="E"{ prev=$2 }
      END{ if (dur-prev > 0.15) printf "בלוק %d: %.2f → %.2f  (%.2fש׳)\n", ++n, prev, dur, dur-prev }'

echo
"$FF" -hide_banner -loglevel error -y -i "$V" -vn -ac 1 -ar 16000 -c:a pcm_s16le "$OUT/audio.wav"
echo "=== אודיו לתמלול: $OUT/audio.wav ==="
