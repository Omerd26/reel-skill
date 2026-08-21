# מבנה התוסף

הריפו הזה עובד בשתי צורות, ושתיהן חייבות להישאר מסונכרנות:

| קובץ | נטען כש… |
|---|---|
| `skills/reel/SKILL.md` | הותקן כתוסף (`/plugin install`) |
| `.claude/skills/reel/SKILL.md` | שוכפל עם git ומריצים `claude` בתוכו |

**שני הקבצים זהים.** ערוך את `skills/reel/SKILL.md` והעתק לשני, או פשוט הרץ
`./install.sh` שמסנכרן אוטומטית. `SKILL.md` עצמו לא מניח נתיבים — הוא פותח ב-
`ROOT="${CLAUDE_PLUGIN_ROOT:-$(pwd)}"` וכל הפקודות תלויות ב-`$ROOT`.
