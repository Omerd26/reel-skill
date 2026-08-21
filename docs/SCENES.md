# קטלוג הסצנות

כל סצנה = אובייקט בתוך `editing_plan.overlay_scenes` או `editing_plan.broll_scenes`.
שדות חובה לכל סצנה: `id` (מחרוזת ייחודית), `type`, `start`, `end` (שניות).
`validate_plan.py` אוכף את הסכמות האלה — אל תמציא שדות או סוגים.

## אוברליים (על הדובר, `overlay_scenes`)

הדובר נשאר גלוי; האלמנט יושב בגובה החזה או בשליש העליון. אחד בכל רגע.

### תוכן וטקסט
| type | שדות | מתי |
|---|---|---|
| `glass_info_card` | `title` (≤80), `eyebrow`?, `body`? (≤140) | טענה/עיקרון שנאמר — סוס העבודה |
| `highlight_sweep` | `text` (≤70, מילות הדובר), `highlight` (מילה מתוך text) | פאנץ' — מרקר על המילה החשובה |
| `question_card` | `question` (שאלה שנשאלה בפועל ≤90), `accent_word`? | שאלה רטורית סביב שנייה 10 |
| `word_stack` | `words` (2-4 מילים מסלימות) | רגע רגשי — "לא"→"ממש לא" |
| `viewfinder_snap` | `target_text` (≤45), `eyebrow`? | "תזכרו את זה" — צילום מסך מנטלי |
| `circle_scribble` | `text` (≤30), `eyebrow`? (≤8) | עיגול מרקר סביב ביטוי |
| `arrow_scribble` | `label` (≤26), `direction`: down/up/left/right | חץ מצויר שמצביע |

### מספרים והוכחות (רק מספרים שנאמרו!)
| type | שדות | מתי |
|---|---|---|
| `metric_lockup` | `value` (מספר), `suffix`? (%/K/M/+), `label`?, `run_past`: true? | מספר בודד גדול |
| `counter_rollup` | `value` (שלם), `label`?, `prefix`?, `suffix`? | אומדומטר מתגלגל — מספרי שיא |
| `metric_comparison` | `left`/`right`: `{title, pct}`, `eyebrow`? | שני אחוזים זה מול זה |
| `receipt_card` | `title` (≤26), `rows`: `[{key, value}]` 2-4, `footnote`? | "קבלה" — נתונים אמיתיים בלבד |
| `retention_curve` | `headline`?, `dip_label` (≤14), `hold_label` (≤14) | גרף שמירת צופים רעיוני |

### רשימות והשוואות
| type | שדות | מתי |
|---|---|---|
| `card_grid_reveal` | `cards`: `[{number?, title, body?}]` 2-4, `headline`? | מנייה — "ארבעה דברים": כרטיס לכל פריט שנאמר, בדיוק כמספרם |
| `comparison_board` | `left`/`right`: `{title, eyebrow?, tone?}`, `divider_label`?, `highlight`: left/right | זה-מול-זה |
| `before_after_flip` | `before`/`after`: `{title, sub_text?}`, `flip_at_sec`? | כרטיס מתהפך לפני→אחרי |
| `twin_cards` | `left`/`right`: `{title, mutate_label?, counter?, counter_unit?}`, `winner` | שני רילים/מוצרים, מנצח מובהק |
| `medal_rank` | `items`: `[{label}]` 2-3 לפי דירוג, `headline`? | דירוג זהב/כסף/ארד |
| `row_badge_wave` | `rows`: `[{label, verdict: yes/no, chip_text?}]` 2-4, `headline`? | עובד/מת על רשימה |
| `settings_toggle_list` | `title`, `rows`: `[{label, from_state, to_state}]` 2-5, `eyebrow`? | "הפעילו את ההגדרות האלה" |
| `progress_rail` | `steps`: `[{label}]` 2-5, `active_index` | איפה אנחנו בתהליך |

### UI ודרמטיזציות
| type | שדות | מתי |
|---|---|---|
| `notification_card` | `app_name`, `title`, `body`, `time_label`? | התראה שממחישה תוצאה |
| `notification_burst` | `app_name`, `titles` (3-5), `badge_count`? | "הטלפון מתפוצץ" |
| `chat_bubble_duo` | `messages`: `[{text, side: in/out}]` 2-3 | שיחה שהדובר מתאר |
| `typing_search` | `query` (≤30), `suggestions`? (עד 3) | רגע חיפוש |
| `comment_composer` | `keyword`, `prompt_text`? | CTA "תגיבו X" — מדגים את הפעולה |
| `toggle_switch` | `from_state`, `to_state`, `variant`: switch/lock/panel | מעבר מצב |
| `tap_interaction` | `button_label` (≤14), `done_label`?, `eyebrow`? | "בלחיצה אחת" |
| `lock_reveal` | `revealed_text` (≤40), `locked_label`? | סוד שנפתח |
| `magnet_pull` | `label`?, `dot_count`? (5-10) | משיכת קהל |
| `timeline_scrub` | `headline`?, `cut_label` (≤10) | עריכה שקורית לבד |
| `progress_fill` | `to_pct` (0-100), `variant`: bar/ring/speed, `eyebrow`?, `run_past`? | התקדמות/מהירות |
| `lower_third_premium` | `primary` (שם), `secondary`? | הצגת הדובר |

## B-rolls (מסך מלא, `broll_scenes`)

הדובר נעלם — לכן רק כשזה מרוויח: הדגמה, הוכחה, מטאפורה, מסע. מרווח ≥6ש' בין שניים.

| type | שדות | מתי |
|---|---|---|
| `screen_journey` | `title`, `items`: `[{text: כותרת מסך, sub_text: הפעולה, value: אישור}]` 2-5 | **מסע — מינימום 8ש', מומלץ 10-16** |
| `blueprint_map` | `title`, `items`: `[{text, sub_text: "bad"/"good"?}]` 3-5 | **מסע — מינימום 8ש', מומלץ 12** |
| `twin_phones_funnel` | `title`, `items`: בדיוק 2 `[{text, value: אחוז}]` | מנגנון X% מול Y% — מינימום 6ש' |
| `graph_spike` | `title`, `bars`: `[{value, label, highlight}]`, `primary`, `secondary` | צמיחה דרמטית |
| `stat_counter` | `title` (ההקשר! למשל "מ-1,000 ל-10,000"), `primary` (המספר המלא), `suffix`?, `label` | מספר-שיא מלא-מסך |
| `shockwave_counter` | כמו stat_counter + גלי הדף | הרגע הכי דרמטי |
| `analytics_dashboard` | `title`, `items`: מדדים (רק מספרים שנאמרו) | מבט על נתונים |
| `workflow_pipeline` | `title`, `items`: שלבי תהליך | תהליך עבודה (עולם בהיר) |
| `key_point` | `primary` (משפט אחד גדול) | הצהרה שדורשת מסך |
| `checklist_outcome` | `items` + תוצאה | רשימת עשייה שמסתכמת |

> ⚠️ **סצנות מסע חייבות חלון ארוך.** המצלמה עוברת בין השלבים אחד-אחד;
> בחלון קצר היא לא מספיקה והמסך נשאר ריק. נמדד: `blueprint_map` עם 3 שלבים
> ב-6 שניות הראה **צומת אחד** ו-75% מסך ריק. תן לה 12 שניות, או בחר סוג קצר.
> `validate_plan.py` חוסם את זה.

## כמה זמן נותנים לכל סצנה

| סוג | מינימום | טיפוסי |
|---|---|---|
| אוברליי טקסט (`highlight_sweep`, `glass_info_card`) | 2.5ש' | 3-4ש' |
| אוברליי מספר (`counter_rollup`, `metric_lockup`, `metric_comparison`) | **3ש'** | 3.5-4.5ש' |
| רשימה/גריד (`card_grid_reveal`, `row_badge_wave`, `medal_rank`) | 3.5ש' | עד סוף המנייה בדיבור |
| B-roll קצר (`key_point`, `stat_counter`, `graph_spike`) | 3ש' | 3-5ש' |
| **סצנות מסע** (`screen_journey`, `blueprint_map`) | **8ש'** | 10-16ש' |

**למה למספרים צריך 3 שניות:** הספירה עולה במשך ~1.5ש'. בחלון של 2ש' הצופה
רואה רק את הריצה, אף פעם לא את המספר. תן לו לנחות ולשבת.

## סדר עדיפות כשמתלבטים

1. רגע מנייה ("שלושה דברים") → `card_grid_reveal`
2. לפני/אחרי → `before_after_flip`
3. מספר-שיא → `counter_rollup` (אוברליי) או `stat_counter` (מסך מלא, עם title הקשר)
4. הסבר תהליך/אלגוריתם → `blueprint_map`
5. הדרכת מסכים → `screen_journey`
6. פאנץ' מילולי → `highlight_sweep` או `word_stack`
7. סתם "משהו יפה" → אל. עדיף כלום מסצנה שלא תומכת.
