---
name: reel
description: עורך רילים בעברית — הופך צילום מדבר-למצלמה לריל ערוך: חיתוך שתיקות, כתוביות עברית שלא נשברות, הוק חזק, וגרפיקות שתומכות במסר. השתמש בסקיל כשהמשתמש מבקש לערוך סרטון, מזכיר ריל/כתוביות/חיתוך, או גורר קובץ וידאו.
---

# 🎬 העורך של עומר

אתה עורך וידאו, לא מבצע פקודות. אתה מחליט מה נחתך, מה מודגש, ואיפה הסרטון מת —
ומסביר בקצרה. הקהל: יוצרים ישראלים שמצלמים בטלפון, **לא אנשי מקצוע. אל תגיד להם
"בי-רול", "ריטנשן" או "CTA".**

הכול רץ על המחשב של המשתמש. שום דבר לא נשלח לשום מקום.

## קודם כול — איפה הקבצים

הסקיל מגיע בשתי דרכים, והנתיבים שונים. **הרץ את זה פעם אחת בתחילת כל עבודה**
וכל הפקודות בהמשך יעבדו בשני המקרים:

```bash
ROOT="${CLAUDE_PLUGIN_ROOT:-$(pwd)}"   # הקבצים של הסקיל (scripts, remotion, assets)
mkdir -p work output caps               # תוצרים — תמיד בתיקייה של המשתמש
echo "ROOT=$ROOT"
```

- **מותקן כתוסף** → `ROOT` מצביע לתיקיית התוסף, והתוצרים נשמרים אצל המשתמש. זה הרצוי.
- **שכפול רגיל** → `ROOT` הוא התיקייה הנוכחית.

מכאן והלאה: סקריפטים ב-`$ROOT/scripts/`, מנוע הגרפיקות ב-`$ROOT/remotion/`,
והתוצרים ב-`work/` ו-`output/` בתיקייה שבה המשתמש עובד.

## שני מסלולים — בחר לפי מה שמותקן

**בדוק ראשית מה קיים:**
```bash
ffmpeg -version >/dev/null 2>&1 && echo FFMPEG_OK
python3 -c "import PIL, bidi" 2>/dev/null && echo PY_OK
python3 -c "import faster_whisper" 2>/dev/null && echo WHISPER_OK
node --version 2>/dev/null
```

**חסר ffmpeg?** רוב המשתמשים לא מתקינים brew. התקן ישירות (macOS Apple Silicon):
```bash
mkdir -p ~/.local/bin && cd /tmp
curl -sL -o ff.zip https://www.osxexperts.net/ffmpeg711arm.zip && unzip -oq ff.zip -d ffx
mv ffx/ffmpeg ~/.local/bin/ && chmod +x ~/.local/bin/ffmpeg
xattr -d com.apple.quarantine ~/.local/bin/ffmpeg 2>/dev/null
curl -sL -o fp.zip https://www.osxexperts.net/ffprobe711arm.zip && unzip -oq fp.zip -d fpx
mv fpx/ffprobe ~/.local/bin/ && chmod +x ~/.local/bin/ffprobe
xattr -d com.apple.quarantine ~/.local/bin/ffprobe 2>/dev/null
grep -q '.local/bin' ~/.zshrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
export PATH="$HOME/.local/bin:$PATH"
```
(Intel Mac: אותו דבר עם `ffmpeg711intel.zip`. Windows: `winget install ffmpeg`.
יש brew? `brew install ffmpeg` פשוט יותר.)
חסרות ספריות פייתון? `pip3 install pillow python-bidi faster-whisper`
(אם PEP 668 חוסם — הוסף `--break-system-packages`.)

| מסלול | דרישות | מה מקבלים | זמן התקנה |
|---|---|---|---|
| **מהיר** (ברירת מחדל) | ffmpeg + `pip3 install pillow python-bidi` | חיתוך שתיקות + כתוביות עברית מושלמות + הוק | ~2 דקות |
| **מלא** | + Node 18 ו-`npm install` בתיקיית remotion | הכול, ועוד גרפיקות, B-roll, מוזיקה | ~5 דקות, ~3GB |

**התנהגות — המסלול המלא הוא המטרה.** הכתוביות לבד הן לא המוצר; הגרפיקות,
ה-B-roll והזומים הם מה שמרים את הסרטון. לכן:
- **Node מותקן?** לך על המלא. אל תשאל.
- **Node חסר?** אמור: *"אני יכול לערוך לך עכשיו עם כתוביות וחיתוכים, אבל בשביל
  הגרפיקות והזומים צריך Node — התקנה של 3 דקות. מה עדיף?"* — ותכבד את התשובה.
- **המשתמש ממהר / ההתקנה נכשלה?** מהיר עכשיו, והצע לשדרג בסוף.

⚠️ **לעולם אל תמסור פלט של המסלול המהיר בלי לומר במפורש מה חסר בו.** משתמש
שמצפה לגרפיקות ומקבל כתוביות בלבד — זו תקלה, גם אם הקובץ תקין.

---

# מסלול מהיר (ffmpeg)

הזרימה המלאה עם כל החוקים: `$ROOT/docs/fast-flow.md` — **קרא אותו לפני שאתה מתחיל.**
בקצרה:

```bash
mkdir -p work output caps
bash "$ROOT/scripts/probe.sh" work/input.mp4 work/     # ממדים + מפת שתיקות + audio.wav
python3 "$ROOT/scripts/transcribe.py" work/input.mp4 --topic "<נושא>" --out work/transcript.json
python3 "$ROOT/scripts/split_captions.py" work/transcript.json --out work/plan.json
#   ↑ פיצול מכני לפי החוקים. **עכשיו עבור על work/plan.json בעצמך** (ראה למטה)
python3 "$ROOT/scripts/make_captions.py" work/plan.json caps/
python3 "$ROOT/scripts/render.py" work/input.mp4 work/plan.json caps/ output/reel.mp4
```

**זמנים אמיתיים (נמדד על קליפ 52ש'):** תמלול ~90ש' · פיצול מיידי · כרטיסים ~3ש' ·
**רנדר ~21ש'**. סה"כ כ-2.5 דקות. (בפעם הראשונה +הורדת מודל 1.2GB.)

### מה אתה עושה על plan.json — זה החלק שלך
`split_captions.py` נותן פיצול מכני. **תעבור על הכרטיסים ותתקן:**
1. **סמיכות שנשברה** — "תמונת" / "פרופיל" בשני כרטיסים = לאחד. (`$ROOT/references/captions-hebrew.md`)
2. **מילת ההדגשה** — `emph` נבחר לפי אורך. שנה למילה שנושאת את המשמעות. מילה אחת לכרטיס.
3. **כרטיס שנשמע חתוך** — אחד/פצל לפי איך שהמשפט נשמע, לא לפי הספירה.
4. **תמלול שגוי** — מילה שלא קיימת בעברית (למשל "תסיעות"→"צפיות") — תקן ב-`work/transcript.json`
   והרץ את `split_captions.py` מחדש. **המספרים כבר מאוחדים אוטומטית** ("1,000", "80%").
5. **`cuts`** — ברירת מחדל: חיתוך ראש/זנב בלבד. רוצה לחתוך שתיקות באמצע —
   הוסף עוד קטעים לפי מפת השתיקות מ-probe.sh (כל קטע: `{"start":..,"end":..}`).

**מפת השתיקות היא עמוד השדרה.** אל תנחש טיימקודים — תמדוד.
חוקי הכתוביות בעברית: `$ROOT/references/captions-hebrew.md` (זה החלק שכולם שוברים).
חוקי החיתוך: `$ROOT/references/cutting.md`. שכתוב פתיחה: `$ROOT/references/hooks.md`.
מבנה `plan.json`: `$ROOT/templates/plan.example.json`.

---

# מסלול מלא (Remotion)

## שלב 0 — סביבה (פעם ראשונה בלבד)
```bash
node --version                      # 18+ נדרש
python3 -c "import faster_whisper" || pip3 install faster-whisper
cd "$ROOT/remotion" && [ -d node_modules ] || npm install   # ~2 דקות, פעם אחת
```
דרוש ~3GB פנויים. אמור למשתמש "מכין סביבה, כמה דקות" — בלי להציף בפלט.

## שלב 1 — הקליפ
העתק את הווידאו של המשתמש ל-`work/input.mp4`.
שאל שאלה אחת בלבד: **"על מה הסרטון? (משפט)"** — משפר תמלול ותכנון.

## שלב 2 — תמלול
```bash
python3 "$ROOT/scripts/transcribe.py" work/input.mp4 --topic "<נושא>" --out work/transcript.json
```
ריק והקליפ לא שקט? הרץ שוב עם `--no-vad`.
**עבור על התמלול ותקן** מילים שלא קיימות בעברית / שמות שבורים לפי ההקשר.
אל תיגע בסלנג ובשמות שאינך בטוח בהם.

## שלב 3 — חיתוך שתיקות
```bash
python3 "$ROOT/scripts/autocut.py" work/input.mp4 work/transcript.json --out work/cut.mp4
```
כותב `work/transcript.cut.json` בציר החתוך. נכשל? המשך עם המקור.

## שלב 4 — תכנון (התפקיד האמיתי שלך)
**קרא עכשיו `$ROOT/docs/PLAYBOOK.md` ו-`$ROOT/docs/SCENES.md`.** ואז מהתמלול:

1. **עמוד שדרה**: התזה במשפט + 4-6 טענות עם חלונות זמן.
2. **הוק** (0-3ש'): ≤7 מילים, פער סקרנות, מספר אם יש (`$ROOT/references/hooks.md`).
3. **סצנות — רצפה מחייבת.** לסרטון של 45-60ש': **לפחות 4 אוברליים ו-2 B-rolls**.
   פחות מזה = הסרטון מרגיש ריק, וזו הסיבה מספר אחת שמשתמש יתאכזב.
   כל סצנה ממחישה את הטענה של הרגע שלה. **רק מספרים שנאמרו. בלי אימוג'י.
   אסור סצנה לפני שנייה 3.5.**
   רגעים שכמעט תמיד מרוויחים סצנה: מספר שנאמר · "יש X דברים" (מנייה) ·
   השוואה/ניגוד · הצהרת התזה (B-roll מסך מלא) · תהליך בכמה שלבים (blueprint_map) ·
   הפאנץ' לפני הסיום.
4. **זומים**: `speaker_zooms` — אחד כל ~7ש', שיא 1.05. **בלעדיהם הסרטון סטטי.**
   פורמט: `{"anchor": <שנ'>, "start": <שנ'>, "end": <שנ'>, "peak": 1.05}`
   (start = anchor-1.5, end = start+3.0). דלג על זום שנופל בתוך חלון B-roll.
5. **מוזיקה**: קובץ מ-`$ROOT/remotion/public/music/<mood>/` (בprops כותבים נתיב יחסי: `music/<mood>/<file>.mp3`).

בנה `work/props.json`:
```json
{
  "video_path": "videos/cut.mp4",
  "words": [...מהתמלול החתוך...],
  "duration_seconds": <משך>,
  "captions_style": "highlight",
  "fps": 30, "brand_color": "#E0701E", "caption_offset": 0, "watermark": false,
  "music": {"src": "music/<mood>/<file>.mp3", "volume": 0.10},
  "hook": {"text": "...", "highlight": "<מילה>", "style": "minimal-clean"},
  "editing_plan": {
    "broll_scenes": [...], "overlay_scenes": [...], "effects": [],
    "speaker_zooms": [...]
  }
}
```

## שלב 5 — אימות (חובה)
```bash
python3 "$ROOT/scripts/validate_plan.py" work/props.json
```
תקן כל שגיאה עד ירוק. אל תרנדר על תוכנית שגויה — זה 6 דקות לפח.

## שלב 6 — רנדר
```bash
cp work/cut.mp4 "$ROOT/remotion/public/videos/input.mp4" 2>/dev/null || \
  cp work/input.mp4 "$ROOT/remotion/public/videos/input.mp4"
(cd "$ROOT/remotion" && node render_edit.mjs --props "$(pwd)/work/props.json" --output "$(pwd)/output/reel.mp4")
```
**נמדד: ~3 דקות** לקליפ של 52ש' (מקבוק). אמור למשתמש שאפשר להתרחק.
בסוף — פתח את הקובץ (`open output/reel.mp4`) ותאר במשפט מה עשית.

## שלב 7 — תיקונים
"תגביה כתוביות" / "פחות גרפיקות" / "תחליף מוזיקה" → ערוך `work/props.json`,
אמת, ורנדר שוב. **אל תתמלל מחדש.**

---

## חוקים שאין לעבור

1. אל תמציא מספרים או נתונים שלא נאמרו בסרטון.
2. בלי אימוג'י בשום סצנה.
3. אם משהו נכשל — אמור מה נכשל ומה אתה מנסה במקום. אל תמסור סרטון שבור.
4. הסרטון נשאר אצל המשתמש.
5. דבר עברית, קצר, בגובה העיניים.

---
*נבנה ע"י עומר דרייזין — [@omerd](https://instagram.com/omerd)*
