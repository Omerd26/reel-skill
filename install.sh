#!/usr/bin/env bash
# התקנה של "העורך של עומר" — מתקין רק מה שחסר, לא נוגע במה שכבר יש.
set -uo pipefail
cd "$(dirname "$0")"

BOLD=$'\033[1m'; GREEN=$'\033[32m'; YEL=$'\033[33m'; RED=$'\033[31m'; OFF=$'\033[0m'
ok(){ printf "  ${GREEN}✓${OFF} %s\n" "$1"; }
warn(){ printf "  ${YEL}!${OFF} %s\n" "$1"; }
bad(){ printf "  ${RED}✗${OFF} %s\n" "$1"; }
step(){ printf "\n${BOLD}%s${OFF}\n" "$1"; }

OS="$(uname -s)"; ARCH="$(uname -m)"
MISSING=0

step "1/4  בודק מה כבר מותקן"
command -v python3 >/dev/null && ok "Python $(python3 -V 2>&1 | cut -d' ' -f2)" || { bad "Python 3 חסר — התקן מ-python.org"; MISSING=1; }
command -v node >/dev/null && ok "Node $(node -v)" || warn "Node חסר — בלעדיו אין גרפיקות (רק כתוביות)"

step "2/4  ffmpeg"
if command -v ffmpeg >/dev/null; then
  ok "ffmpeg כבר מותקן"
else
  if command -v brew >/dev/null; then
    echo "  מתקין דרך brew..."; brew install ffmpeg >/dev/null 2>&1 && ok "ffmpeg הותקן" || { bad "brew נכשל"; MISSING=1; }
  elif [ "$OS" = "Darwin" ]; then
    echo "  מוריד ffmpeg (בלי brew)..."
    mkdir -p "$HOME/.local/bin"; TMP=$(mktemp -d)
    if [ "$ARCH" = "arm64" ]; then FF=ffmpeg711arm; FP=ffprobe711arm; else FF=ffmpeg711intel; FP=ffprobe711intel; fi
    for pair in "$FF:ffmpeg" "$FP:ffprobe"; do
      z="${pair%%:*}"; bin="${pair##*:}"
      curl -sL --max-time 180 -o "$TMP/$bin.zip" "https://www.osxexperts.net/$z.zip" \
        && unzip -oq "$TMP/$bin.zip" -d "$TMP/$bin" \
        && mv "$(find "$TMP/$bin" -type f -name "$bin" | head -1)" "$HOME/.local/bin/$bin" \
        && chmod +x "$HOME/.local/bin/$bin" && xattr -d com.apple.quarantine "$HOME/.local/bin/$bin" 2>/dev/null
    done
    rm -rf "$TMP"
    RC="$HOME/.zshrc"; [ -n "${BASH_VERSION:-}" ] && RC="$HOME/.bashrc"
    grep -q '.local/bin' "$RC" 2>/dev/null || echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$RC"
    export PATH="$HOME/.local/bin:$PATH"
    command -v ffmpeg >/dev/null && ok "ffmpeg הותקן ל-~/.local/bin" || { bad "הורדת ffmpeg נכשלה — התקן ידנית"; MISSING=1; }
  else
    bad "התקן ffmpeg: Windows → winget install ffmpeg · Linux → apt install ffmpeg"; MISSING=1
  fi
fi

step "3/4  ספריות פייתון"
PIPFLAGS=""
python3 -c "import sys; sys.exit(0)" 2>/dev/null
if ! python3 -m pip install --dry-run pillow >/dev/null 2>&1; then PIPFLAGS="--break-system-packages"; fi
for mod in "PIL:pillow" "bidi:python-bidi" "faster_whisper:faster-whisper" "numpy:numpy"; do
  m="${mod%%:*}"; pkg="${mod##*:}"
  if python3 -c "import $m" 2>/dev/null; then ok "$pkg"
  else
    echo "  מתקין $pkg..."
    python3 -m pip install -q $PIPFLAGS "$pkg" 2>/dev/null || python3 -m pip install -q --break-system-packages "$pkg" 2>/dev/null
    python3 -c "import $m" 2>/dev/null && ok "$pkg הותקן" || { bad "$pkg נכשל — הרץ ידנית: pip3 install $pkg"; MISSING=1; }
  fi
done

# OpenCV: לא חובה — מאפשר לבדיקת האיכות לזהות פנים מוסתרות
if python3 -c "import cv2" 2>/dev/null; then ok "opencv (זיהוי פנים בבדיקות)"
else
  python3 -m pip install -q $PIPFLAGS opencv-python-headless 2>/dev/null || python3 -m pip install -q --break-system-packages opencv-python-headless 2>/dev/null
  python3 -c "import cv2" 2>/dev/null && ok "opencv הותקן" || warn "opencv לא הותקן — בדיקת 'פנים מוסתרות' תסומן כלא-רצה"
fi

step "4/4  מנוע הגרפיקות (אופציונלי)"
if command -v node >/dev/null; then
  if [ -d remotion/node_modules ]; then ok "כבר מותקן"
  else
    echo "  מתקין (2-3 דקות, פעם אחת)..."
    (cd remotion && npm install --no-audit --no-fund --silent) >/dev/null 2>&1 \
      && ok "מנוע הגרפיקות מוכן" || warn "ההתקנה נכשלה — הכתוביות עדיין יעבדו"
  fi
else
  warn "בלי Node — תקבל כתוביות וחיתוכים, בלי גרפיקות"
fi

# שני עותקי הסקיל (תוסף + שכפול) חייבים להיות זהים: SKILL.md והמפעיל reel
for f in SKILL.md reel; do
  if [ -f "skills/reel/$f" ]; then
    cmp -s "skills/reel/$f" ".claude/skills/reel/$f" 2>/dev/null || {
      mkdir -p .claude/skills/reel && cp "skills/reel/$f" ".claude/skills/reel/$f"
      warn "סונכרן $f בין שתי הצורות"
    }
  fi
done
chmod +x skills/reel/reel .claude/skills/reel/reel scripts/reel.py 2>/dev/null
python3 scripts/reel.py doctor >/dev/null 2>&1 && ok "reel doctor: המסלול המהיר זמין" || warn "reel doctor מצא חוסרים — הרץ: python3 scripts/reel.py doctor"
echo
if [ "$MISSING" = "0" ]; then
  printf "${GREEN}${BOLD}מוכן.${OFF}\n\nעכשיו הרץ:  ${BOLD}claude${OFF}\nותכתוב:     ${BOLD}תערוך לי את הסרטון הזה${OFF}  (וגרור את הקובץ)\n\n"
else
  printf "${YEL}${BOLD}חסרים דברים — ראה למעלה.${OFF} תקן והרץ שוב: ./install.sh\n\n"
fi
