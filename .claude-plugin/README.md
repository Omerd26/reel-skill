# מבנה התוסף

הריפו הזה עובד בשתי צורות, ושתיהן חייבות להישאר מסונכרנות:

| קובץ | נטען כש… |
|---|---|
| `skills/reel/SKILL.md` | הותקן כתוסף (`/plugin install`) |
| `.claude/skills/reel/SKILL.md` | שוכפל עם git ומריצים `claude` בתוכו |

**התיקיות זהות** (`SKILL.md` + המפעיל `reel`). ערוך את `skills/reel/` והעתק לשני, או הרץ
`./install.sh` שמסנכרן אוטומטית; `tests/test_docs.py` נכשל אם הם שונים.

`SKILL.md` לא מניח נתיבים ולא משתנים בין פקודות: כל פקודה היא
`sh "${CLAUDE_SKILL_DIR}/reel" <פקודה>`. `${CLAUDE_SKILL_DIR}` מוחלף בתיקיית הסקיל בשתי הצורות,
והמפעיל עולה ממנה עד שהוא מוצא `scripts/reel.py`. (הגרסה הקודמת השתמשה ב-
`ROOT="${CLAUDE_PLUGIN_ROOT:-$(pwd)}"` — אבל `CLAUDE_PLUGIN_ROOT` מוחלף כטקסט רק בצורה
`${CLAUDE_PLUGIN_ROOT}` ואינו משתנה סביבה, כך שבתוסף ROOT הצביע על תיקיית המשתמש; ומשתנים
לא נשמרים בין קריאות Bash.)
