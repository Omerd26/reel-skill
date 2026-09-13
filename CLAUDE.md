# הוראות לפרויקט הזה

זה סקיל עריכת רילים. כשמשתמש מבקש לערוך סרטון / מזכיר ריל / גורר קובץ וידאו —
הפעל את הסקיל `reel` (`.claude/skills/reel/SKILL.md`) ועקוב אחריו שלב-שלב.

- דבר עברית עם המשתמש.
- כל פקודה דרך המפעיל: `sh .claude/skills/reel/reel <פקודה> -p <PROJECT>` — פרויקט נפרד לכל סרטון.
- לפני כל רנדר: `reel validate -p <PROJECT>` חייב לעבור. אחרי רנדר: בקרת איכות עד `reel qa --finalize`.
- אל תשנה קוד ב-`remotion/src/` אלא אם משהו באמת שבור. בקשה שאין לה סצנה → `custom_layers`.
- אל תמציא מספרים שלא נאמרו בסרטון. אל תשתמש באימוג'ים בסצנות. אל תדווח על בדיקה שלא בוצעה.

## פיתוח
- `skills/reel/` ו-`.claude/skills/reel/` זהים (SKILL.md + המפעיל `reel`). ערוך את הראשון והעתק.
- בדיקות רגרסיה: `python3 -m unittest discover -s tests -v` (הרנדר של Remotion רץ רק כשהמנוע מותקן;
  `REEL_SKIP_RENDER=1` כדי לדלג).
- הקוד המשותף לשני המסלולים: `scripts/reelkit/` (media, timeline, cutting, captions, understand, validate, qa).
