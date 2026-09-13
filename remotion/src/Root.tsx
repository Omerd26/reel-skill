import React from "react";
import { Composition } from "remotion";
import { ReelComposition, calculateDuration } from "./ReelComposition";
import { EditedReel, calculateEditDuration } from "./compositions/EditedReel";
import { ProductDemo, DEMO_DURATION, DEMO_FPS } from "./compositions/ProductDemo";
import { SocialAd, AD_DURATION, AD_FPS, type SocialAdProps } from "./compositions/SocialAd";
import { ProofAd, PROOF_DURATION, PROOF_FPS, type ProofAdProps } from "./compositions/ProofAd";
import { BeforeAfterAd, BA_DURATION, BA_FPS, type BeforeAfterAdProps } from "./compositions/BeforeAfterAd";
import { FounderColdOpen, FCO_DURATION, FCO_FPS, type FounderColdOpenProps } from "./compositions/FounderColdOpen";
import { ThreeThingsAd, THREE_THINGS_DURATION, THREE_THINGS_FPS, type ThreeThingsAdProps } from "./compositions/ThreeThingsAd";
import { StyleWallAd, SW_DURATION, SW_FPS, type StyleWallAdProps } from "./compositions/StyleWallAd";
import { BRollPreview, calculatePreviewDuration } from "./compositions/BRollPreview";
import {
  OverlayPreview,
  calculateOverlayPreviewDuration,
} from "./compositions/OverlayPreview";
import {
  TemplatePreview,
  calculateTemplatePreviewDuration,
} from "./compositions/TemplatePreview";
import {
  TemplatedReel,
  calculateTemplatedReelDuration,
} from "./compositions/TemplatedReel";
import {
  CampaignAd,
  calculateCampaignDuration,
  type CampaignAdProps,
} from "./compositions/CampaignAd";
import type { ReelProps } from "./types";
import type { EditedReelProps } from "./compositions/EditedReel";
import type { BRollPreviewProps } from "./compositions/BRollPreview";
import type { OverlayPreviewProps } from "./compositions/OverlayPreview";
import type { TemplatePreviewProps } from "./compositions/TemplatePreview";
import type { TemplatedReelProps } from "./compositions/TemplatedReel";
import type { AnyOverlayScene } from "./components/overlays/types";
import type { AnyTemplate } from "./components/templates/types";
import { SceneThumbnail, type SceneThumbnailProps } from "./SceneThumbnail";

// ── Sample overlay scenes — 14-scene catalog demo (4 visual-metaphor) ────────
//
// All overlays anchor to the TOP zone — never over the speaker silhouette.
// Each scene runs ~2.0–3.5s (within MOTION_PHILOSOPHY's 1.5–4s band) with
// 0.4s gaps for transition breathing room. Order demonstrates the visual-
// metaphor framework: each scene picks a metaphor that matches the spoken
// meaning instead of a static title.

// Each scene gets a 2.6s slot with 0.4s gap. This is a showcase demo
// covering all 16 visual-metaphor scene types (the 4 original + 12 new).
const SHOW_DUR = 2.6;
const GAP = 0.4;
const slot = (i: number) => ({ start: i * (SHOW_DUR + GAP) + 0.2, end: i * (SHOW_DUR + GAP) + SHOW_DUR + 0.2 });

const OVERLAY_PREVIEW_SCENES: AnyOverlayScene[] = [

  // 1 — MetricLockup
  {
    id: "02-metric-90",
    type: "metric_lockup",
    ...slot(1),
    transcript_phrase: "תשעים אחוז",
    rationale: "Hero number.",
    eyebrow: "המציאות",
    value: 90,
    suffix: "%",
    label: "נכשלים",
    tone: "brand",
    card: true,
    anchor: "top-right",
  },

  // 2 — ToggleSwitch (lock)
  {
    id: "03-toggle-unlock",
    type: "toggle_switch",
    ...slot(2),
    transcript_phrase: "הדרך הכי קלה לפתוח",
    rationale: "Lock unlocks.",
    variant: "lock",
    from_state: "סגור",
    to_state: "פתוח",
    eyebrow: "הדרך הכי קלה",
    tone: "brand",
    anchor: "top-right",
  },

  // 3 — TapInteraction
  {
    id: "04-tap-easy",
    type: "tap_interaction",
    ...slot(3),
    transcript_phrase: "בלחיצה אחת",
    rationale: "Single-tap metaphor.",
    button_label: "פתח",
    eyebrow: "בלחיצה אחת",
    done_label: "בוצע",
    tone: "brand",
    anchor: "top-right",
  },

  // 4 — ProgressFill (speed)
  {
    id: "05-progress-speed",
    type: "progress_fill",
    ...slot(4),
    transcript_phrase: "וזה קורה מהר",
    rationale: "Speedometer.",
    variant: "speed",
    from_pct: 0,
    to_pct: 100,
    eyebrow: "מהירות",
    tone: "brand",
    anchor: "top-right",
  },

  // 5 — ComparisonBoard
  {
    id: "06-comparison",
    type: "comparison_board",
    ...slot(5),
    transcript_phrase: "חובבני לעומת מקצועי",
    rationale: "Contrast.",
    left: { eyebrow: "ללא שיטה", title: "תוכן אקראי", tone: "danger" },
    right: { eyebrow: "עם שיטה", title: "מערכת", tone: "success" },
    divider_label: "VS",
    highlight: "right",
    anchor: "top-center",
  },

  // 6 — StampSlam
  {
    id: "07-stamp",
    type: "stamp_slam",
    ...slot(6),
    transcript_phrase: "STOP",
    rationale: "Punch.",
    text: "STOP",
    rotation: -4,
    tone: "danger",
    doubleStroke: true,
    anchor: "top-center",
  },

  // 7 — FlowArrow (chain)
  {
    id: "08-flow-automate",
    type: "flow_arrow",
    ...slot(7),
    transcript_phrase: "הכל אוטומטי",
    rationale: "Chain reaction.",
    variant: "chain",
    nodes: ["טריגר", "פעולה", "סיום"],
    eyebrow: "אוטומציה",
    tone: "brand",
    anchor: "top-center",
  },

  // 8 — FlowArrow (send)
  {
    id: "09-flow-publish",
    type: "flow_arrow",
    ...slot(8),
    transcript_phrase: "ופוסט מתפרסם",
    rationale: "Publish.",
    variant: "send",
    label: "פרסם",
    eyebrow: "פרסום",
    tone: "brand",
    anchor: "top-right",
  },

  // 9 — NotificationCard
  {
    id: "10-notification",
    type: "notification_card",
    ...slot(9),
    transcript_phrase: "התראה — לקוחות חדשים",
    rationale: "iOS notification.",
    app_name: "OMER.DIGITAL",
    app_icon_letter: "O",
    app_icon_color: "#E0701E",
    title: "12 לקוחות חדשים",
    body: "המערכת מייצרת לידים אוטומטית",
    time_label: "now",
    rtl: true,
    anchor: "top-right",
  },

  // 10 — BadgeStack
  {
    id: "11-badges",
    type: "badge_stack",
    ...slot(10),
    transcript_phrase: "מה כלול",
    rationale: "Capability summary.",
    headline: "כל מה שצריך",
    items: [
      { text: "תוכן אוטומטי", tone: "brand", dot: true },
      { text: "תזמון חכם", tone: "info", dot: true },
      { text: "אנליטיקס", tone: "success", dot: true },
      { text: "ללא קוד", tone: "neutral", dot: true },
    ],
    layout: "wrap",
    anchor: "top-center",
  },

  // 11 — CountdownTimer (NEW)
  {
    id: "12-countdown",
    type: "countdown_timer",
    ...slot(11),
    transcript_phrase: "המבצע מסתיים",
    rationale: "Urgency.",
    eyebrow: "נשארו",
    from_value: 24,
    to_value: 0,
    unit: "שעות",
    anchor: "top-right",
  },

  // 12 — CalendarSlot (NEW)
  {
    id: "13-calendar",
    type: "calendar_slot",
    ...slot(12),
    transcript_phrase: "כל יום שני",
    rationale: "Recurrence — Mondays highlight.",
    eyebrow: "תזמון",
    month_label: "אפריל",
    highlight_days: [4, 11, 18, 25],
    tone: "brand",
    anchor: "top-right",
  },

  // 13 — TabSwitcher (NEW)
  {
    id: "14-tabs",
    type: "tab_switcher",
    ...slot(13),
    transcript_phrase: "תבחר את הסגנון",
    rationale: "Choice between options.",
    eyebrow: "בחר סגנון",
    tabs: ["מינימלי", "פרימיום", "אגרסיבי"],
    start_index: 0,
    end_index: 1,
    tone: "brand",
    anchor: "top-right",
  },

  // 14 — DropdownMenu (NEW)
  {
    id: "15-dropdown",
    type: "dropdown_menu",
    ...slot(14),
    transcript_phrase: "המון אפשרויות",
    rationale: "Options menu.",
    eyebrow: "אפשרויות",
    trigger_label: "סגנון תוכן",
    items: ["טכני", "סיפורי", "פרסומי", "חינוכי"],
    selected_index: 1,
    tone: "brand",
    anchor: "top-right",
  },

  // 15 — SwipeChoice (NEW)
  {
    id: "16-swipe",
    type: "swipe_choice",
    ...slot(15),
    transcript_phrase: "תגיד כן",
    rationale: "Approve swipe.",
    eyebrow: "בחירה",
    card_title: "פוסט יומי",
    card_subtitle: "אוטומטי לחלוטין",
    direction: "right",
    anchor: "top-right",
  },

  // 16 — ChartReveal (bar) (NEW)
  {
    id: "17-chart-bar",
    type: "chart_reveal",
    ...slot(16),
    transcript_phrase: "גידול של 300 אחוז",
    rationale: "Growth bars.",
    eyebrow: "גידול שנתי",
    variant: "bar",
    values: [12, 24, 38, 52, 78, 100],
    x_labels: ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ"],
    unit: "K",
    tone: "success",
    anchor: "top-right",
  },

  // 17 — ChartReveal (line) (NEW)
  {
    id: "18-chart-line",
    type: "chart_reveal",
    ...slot(17),
    transcript_phrase: "ביצועים שמדברים",
    rationale: "Line chart climbing.",
    eyebrow: "ביצועים",
    variant: "line",
    values: [10, 18, 30, 28, 52, 70, 95],
    x_labels: ["", "", "", "", "", "", ""],
    tone: "brand",
    anchor: "top-right",
  },

  // 18 — EmojiReact (NEW)
  {
    id: "19-emoji",
    type: "emoji_react",
    ...slot(18),
    transcript_phrase: "הקהילה מגיבה",
    rationale: "Social proof.",
    eyebrow: "תגובות",
    emojis: ["🔥", "❤️", "👍"],
    count_to: 1248,
    label: "REACTIONS",
    tone: "brand",
    anchor: "top-right",
  },

  // 19 — LiveStatus (NEW)
  {
    id: "20-live",
    type: "live_status",
    ...slot(19),
    transcript_phrase: "שידור חי",
    rationale: "Real-time indicator.",
    label: "LIVE",
    tone: "danger",
    viewers_to: 1284,
    viewer_label: "WATCHING",
    anchor: "top-left",
  },

  // 20 — StreamingFeed (NEW)
  {
    id: "21-feed",
    type: "streaming_feed",
    ...slot(20),
    transcript_phrase: "תגובות זורמות",
    rationale: "Continuous activity.",
    eyebrow: "פעילות",
    events: [
      { user: "דנה", message: "הצטרפתי 🔥", avatar_color: "#E0701E", avatar_letter: "ד" },
      { user: "Yair P.", message: "Great content!", avatar_color: "#4FC3F7" },
      { user: "מיכל", message: "כבר יישמתי את זה", avatar_color: "#4ADE80" },
      { user: "Tomer R.", message: "Subscribed.", avatar_color: "#FBBF24" },
      { user: "אורן", message: "מחכה לשיעור הבא", avatar_color: "#EF4444" },
    ],
    per_event_sec: 0.6,
    tone: "brand",
    anchor: "top-right",
  },

  // 21 — PriceTag (NEW)
  {
    id: "22-price",
    type: "price_tag",
    ...slot(21),
    transcript_phrase: "במקום חמש מאות, רק תשעים ותשע",
    rationale: "Discount flip.",
    eyebrow: "מחיר היום בלבד",
    old_price: "₪500",
    new_price: "₪99",
    badge: "−80%",
    tone: "brand",
    anchor: "top-right",
  },

  // 22 — SearchAutocomplete (NEW)
  {
    id: "23-search",
    type: "search_autocomplete",
    ...slot(22),
    transcript_phrase: "מחפשים פתרון אוטומטי",
    rationale: "Search with autocomplete.",
    eyebrow: "חיפוש",
    query: "AI marketing automation",
    suggestions: [
      "AI marketing automation tools",
      "AI marketing automation 2026",
      "AI marketing for SaaS",
      "AI marketing easy",
    ],
    selected_index: 0,
    tone: "brand",
    anchor: "top-right",
  },

  // 23 — TerminalFeed (NEW)
  {
    id: "24-terminal",
    type: "terminal_feed",
    ...slot(23),
    transcript_phrase: "המערכת רצה אוטומטית",
    rationale: "Code-driven proof.",
    eyebrow: "מערכת",
    title: "omer.digital ~ deploy",
    cps: 40,
    lines: [
      { text: "$ deploy --auto" },
      { text: "  building schedule…", status: "ok" },
      { text: "  rendering content…", status: "ok" },
      { text: "  publishing…", status: "ok" },
      { text: "✓ done in 4.2s", status: "ok" },
    ],
    tone: "brand",
    anchor: "top-right",
  },

  // 24 — MetricComparison (NEW from @softgirlnocode reel)
  {
    id: "25-metric-compare",
    type: "metric_comparison",
    ...slot(24),
    transcript_phrase: "Cowork ממלא מהר יותר מ-Code",
    rationale: "Two ring metrics side-by-side — direct visual comparison.",
    eyebrow: "CONTEXT WINDOW",
    title: "Cowork vs Code",
    left:  { title: "Claude Cowork", eyebrow: "Context window", pct: 77, caption: "fills faster",  tone: "brand" },
    right: { title: "Claude Code",   eyebrow: "Context window", pct: 44, caption: "stays lighter", tone: "info"  },
    material: "warm",
    corner_badge: "MCP TAX",
    anchor: "top-center",
  },

  // 25 — AppIconNetwork (NEW)
  {
    id: "26-app-network",
    type: "app_icon_network",
    ...slot(25),
    transcript_phrase: "המערכת מחוברת ל-Drive, Notion, Gmail דרך MCP",
    rationale: "Tools constellation — system setup illustration.",
    eyebrow: "CONNECTED THROUGH MCP",
    title: "Cowork setup",
    hub: { glyph: "M", name: "MCP", sublabel: "hub", tone: "brand" },
    leaves: [
      { glyph: "D", name: "GDrive", sublabel: "files & docs", tone: "info" },
      { glyph: "N", name: "Notion", sublabel: "tool", tone: "success" },
      { glyph: "@", name: "Gmail", sublabel: "tool", tone: "warn" },
    ],
    corner_badge: "TOOLS ATTACHED",
    material: "warm",
    anchor: "top-center",
  },

  // 26 — KeyValueTable (NEW)
  {
    id: "27-kv-table",
    type: "key_value_table",
    ...slot(26),
    transcript_phrase: "ה-tool injection נראה ככה",
    rationale: "Schema rows — what the API actually receives.",
    eyebrow: "COMPUTED PAYLOAD",
    title: "Tool context",
    rows: [
      { key: "TOOL",         value: "notion.search",                kind: "code" },
      { key: "INPUT_SCHEMA", value: "query, page_size, filter",     kind: "list" },
      { key: "ACTIONS",      value: "search, fetch, update",         kind: "list" },
      { key: "RESPONSE",     value: "documents, metadata, ids",      kind: "list" },
    ],
    corner_badge: "Injected into context",
    material: "warm",
    anchor: "top-right",
  },

  // 27 — SettingsToggleList (NEW)
  {
    id: "28-settings",
    type: "settings_toggle_list",
    ...slot(27),
    transcript_phrase: "כבי את ה-MCPs שאת לא משתמשת",
    rationale: "Settings panel — disable unused connectors.",
    eyebrow: "PRACTICAL FIX",
    title: "Unused MCP",
    body: "Disable the connectors you are not using inside a project.",
    rows: [
      { label: "Notion MCP", from_state: "on",  to_state: "off" },
      { label: "Drive MCP",  from_state: "on",  to_state: "off" },
      { label: "Email MCP",  from_state: "on",  to_state: "off" },
    ],
    corner_badge: "Cleaner state",
    material: "warm",
    anchor: "top-center",
  },

  // ── Round 4 (2026-05-08) — 20 new scenes ──────────────────────────────────

  // 28 — TrendArrow
  {
    id: "29-trend",
    type: "trend_arrow",
    ...slot(28),
    transcript_phrase: "גידול של 47%",
    rationale: "Big up arrow + percent.",
    eyebrow: "גידול שנתי",
    delta_pct: 47,
    label: "מכירות",
    tone: "success",
  },
  // 29 — StarRating
  {
    id: "30-stars",
    type: "star_rating",
    ...slot(29),
    transcript_phrase: "4.9 כוכבים",
    rationale: "5-star rating with score.",
    eyebrow: "דירוג ממוצע",
    score: 4.9,
    sample_text: "מ-1,247 לקוחות",
  },
  // 30 — FollowerCountUp
  {
    id: "31-followers",
    type: "follower_count_up",
    ...slot(30),
    transcript_phrase: "100K עוקבים",
    rationale: "IG-style ticker.",
    eyebrow: "FOLLOWERS",
    handle: "@omer.digital",
    count_to: 100000,
    platform: "Instagram",
    delta_text: "+2.3K this week",
    avatar_letter: "ע",
  },
  // 31 — CodeBlock
  {
    id: "32-code",
    type: "code_block",
    ...slot(31),
    transcript_phrase: "Just run: npm install dredit",
    rationale: "Single command demo.",
    eyebrow: "ONE COMMAND",
    code: "npm install dredit",
    prompt: "$",
    language: "bash",
  },
  // 32 — CopiedToClipboard
  {
    id: "33-copy",
    type: "copied_to_clipboard",
    ...slot(32),
    transcript_phrase: "השתמש בקוד SAVE40",
    rationale: "Promo code copy interaction.",
    eyebrow: "קוד מבצע",
    value: "SAVE40",
    sublabel: "40% הנחה עד יום שישי",
  },
  // 33 — HighlightSweep
  {
    id: "34-highlight",
    type: "highlight_sweep",
    ...slot(33),
    transcript_phrase: "הסוד הוא העקביות",
    rationale: "Marker highlight on the key word.",
    eyebrow: "תזכרו",
    text: "הסוד הוא העקביות",
    highlight: "העקביות",
  },
  // 34 — SpotlightCircle
  {
    id: "35-spotlight",
    type: "spotlight_circle",
    ...slot(34),
    transcript_phrase: "התמקדו רק בזה",
    rationale: "Spotlight on one word.",
    eyebrow: "התמקדו",
    subject: "מהירות",
    sublabel: "הדבר היחיד שחשוב",
  },
  // 35 — HourglassDrop
  {
    id: "36-hourglass",
    type: "hourglass_drop",
    ...slot(35),
    transcript_phrase: "5 שעות עריכה ידנית",
    rationale: "Time-cost metaphor.",
    eyebrow: "זמן ידני",
    label: "5 שעות",
  },
  // 36 — DigitalClockFlip
  {
    id: "37-clock",
    type: "digital_clock_flip",
    ...slot(36),
    transcript_phrase: "כל שעה בלילה",
    rationale: "Clock ticking forward.",
    eyebrow: "כל הלילה",
    mode: "clock",
    from_value: 22 * 60,
    to_value: 26 * 60, // wraps to 02:00
    sublabel: "AM Tel Aviv",
  },
  // 37 — KeyboardShortcut
  {
    id: "38-shortcut",
    type: "keyboard_shortcut",
    ...slot(37),
    transcript_phrase: "Cmd+K לחיפוש",
    rationale: "iOS-style key combo.",
    eyebrow: "SHORTCUT",
    keys: ["⌘", "K"],
    action: "Search anywhere",
  },
  // 38 — AIThinkingPulse
  {
    id: "39-thinking",
    type: "ai_thinking_pulse",
    ...slot(38),
    transcript_phrase: "ה-AI מעבד",
    rationale: "Streaming-state indicator.",
    eyebrow: "AI AT WORK",
    label: "Thinking…",
    glyph: "✦",
  },
  // 39 — TokenStreamingText
  {
    id: "40-stream",
    type: "token_streaming_text",
    ...slot(39),
    transcript_phrase: "Claude עונה",
    rationale: "AI response streaming word-by-word.",
    eyebrow: "AI RESPONSE",
    speaker: "Claude",
    text: "כדי להתחיל, פשוט תפעיל את הקובץ ותתן ל-AI להוביל את התהליך.",
    wps: 5,
    rtl: true,
  },
  // 40 — PromptInputCard
  {
    id: "41-prompt",
    type: "prompt_input_card",
    ...slot(40),
    transcript_phrase: "שאל את ה-AI",
    rationale: "Type → send → confirmed.",
    eyebrow: "ASK CLAUDE",
    speaker: "Claude",
    prompt: "סדר לי את הלו״ז להיום",
    show_sent: true,
    rtl: true,
  },
  // 41 — StepProgressTrail
  {
    id: "42-steps",
    type: "step_progress_trail",
    ...slot(41),
    transcript_phrase: "ארבעה שלבים פשוטים",
    rationale: "1→2→3→4 phase trail.",
    eyebrow: "התהליך",
    steps: ["רעיון", "תסריט", "צילום", "פרסום"],
    rtl: true,
  },
  // 42 — LayersStack
  {
    id: "43-layers",
    type: "layers_stack",
    ...slot(42),
    transcript_phrase: "שלוש שכבות",
    rationale: "3D stack revealing what's underneath.",
    eyebrow: "WHAT'S UNDERNEATH",
    layers: ["Strategy", "Content", "Distribution"],
    sublabels: ["The plan", "The work", "The reach"],
  },
  // 43 — BeforeAfterSlider
  {
    id: "44-beforeafter",
    type: "before_after_slider",
    ...slot(43),
    transcript_phrase: "לפני: 12 שעות. אחרי: 30 דקות.",
    rationale: "Time transformation with slider.",
    eyebrow: "THE DIFFERENCE",
    before: { label: "Before", value: "12 hrs", tone: "danger" },
    after:  { label: "After",  value: "30 min", tone: "success" },
  },
  // 44 — ComparisonGap
  {
    id: "45-gap",
    type: "comparison_gap",
    ...slot(44),
    transcript_phrase: "הם ב-12, אנחנו ב-87",
    rationale: "Dramatic gap visualization.",
    eyebrow: "ההפרש",
    loser:  { label: "Industry avg", value: 12, unit: "%", tone: "danger"  },
    winner: { label: "Our system",   value: 87, unit: "%", tone: "success" },
  },
  // 45 — FunnelStages
  {
    id: "46-funnel",
    type: "funnel_stages",
    ...slot(45),
    transcript_phrase: "מסע הלקוח",
    rationale: "Funnel with conversion %.",
    eyebrow: "CONVERSION FUNNEL",
    stages: [
      { label: "Visitors", value: 1000 },
      { label: "Trial",    value: 400 },
      { label: "Paid",     value: 80 },
      { label: "Renew",    value: 64 },
    ],
    show_drops: true,
  },
  // 46 — LeaderboardPodium
  {
    id: "47-podium",
    type: "leaderboard_podium",
    ...slot(46),
    transcript_phrase: "שלושת המובילים השנה",
    rationale: "Top 3 podium.",
    eyebrow: "TOP 3 PERFORMERS",
    title: "Best of 2026",
    entries: [
      { name: "Yair P.",  score: "94pt", sublabel: "Marketing" },
      { name: "Sarah K.", score: "88pt", sublabel: "Content" },
      { name: "Tomer R.", score: "81pt", sublabel: "Sales" },
    ],
  },
  // Final — LowerThirdPremium (legit use of above-captions)
  {
    id: "48-lower-third",
    type: "lower_third_premium",
    ...slot(47),
    transcript_phrase: "עומר דרייזין",
    rationale: "Speaker tag-out.",
    primary: "עומר דרייזין",
    secondary: "@omer.digital",
    avatar_letter: "ע",
    avatar_color: "#E0701E",
    variant: "pill",
    anchor: "above-captions",
  },
];

// ── Sample template for TemplatePreview — bracket_battle default ────────────
//
// The TemplatePreview composition demonstrates the bracket_battle format with
// "Video Component Battle" (16 items, 4 rounds). Switch defaultProps.template
// to a tier_rating sample to preview that format instead — both share the same
// composition + TemplateLayer dispatcher.

const TEMPLATE_PREVIEW_DEFAULT: AnyTemplate = {
  type: "bracket_battle",
  id: "bracket-video-components",
  title: "Video Component Battle",
  subtitle: "Caption or Hooks",
  items: [
    "Hashtags",
    "Captions",
    "Hooks",
    "Editing",
    "Idea",
    "Value",
    "Posting Time",
    "Topic",
    "Script",
    "Music",
    "Structure",
    "Length",
    "Format",
    "CTA",
    "Level of Awareness",
    "Angle",
  ],
  winners: [
    // round 1 — 8 winners from 16
    "Captions", "Hooks", "Idea", "Topic", "Script", "Structure", "Format", "Level of Awareness",
    // round 2 — 4 winners from 8
    "Captions", "Idea", "Script", "Format",
    // round 3 — 2 winners from 4
    "Captions", "Script",
    // round 4 — champion
    "Captions",
  ],
  accent_color: "#B7FF00",
  anchor: "lower-third",
  rtl: false,
};

/**
 * Default props used for Remotion Studio preview.
 * In production, real props are passed from render.mjs.
 */
const DEFAULT_PROPS: ReelProps = {
  title: "תצוגה מקדימה",
  fps: 30,
  style: "modern",
  brand_color: "#E0701E",
  scenes: [
    {
      scene_number: 1,
      duration_seconds: 3,
      narration: "שאלה מסקרנת",
      screen_text: "למה 90% מהעסקים נכשלים בשיווק דיגיטלי?",
      visual_description: "Professional dark office",
      image_path: "scenes/placeholder.jpg",
      is_hook: true,
      is_cta: false,
    },
    {
      scene_number: 2,
      duration_seconds: 5,
      narration: "נקודה ראשונה",
      screen_text: "הם לא מכירים את הקהל שלהם",
      visual_description: "Marketing analytics",
      image_path: "scenes/placeholder.jpg",
      is_hook: false,
      is_cta: false,
    },
    {
      scene_number: 3,
      duration_seconds: 5,
      narration: "נקודה שנייה",
      screen_text: "הם לא עקביים עם התוכן",
      visual_description: "Content calendar",
      image_path: "scenes/placeholder.jpg",
      is_hook: false,
      is_cta: false,
    },
    {
      scene_number: 4,
      duration_seconds: 4,
      narration: "קריאה לפעולה",
      screen_text: "עקבו + שלחו REEL",
      visual_description: "Motivational background",
      image_path: "scenes/placeholder.jpg",
      is_hook: false,
      is_cta: true,
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  const defaultDuration = calculateDuration(
    DEFAULT_PROPS.scenes,
    DEFAULT_PROPS.fps
  );

  return (
    <>
      <Composition
        id="Reel"
        component={ReelComposition}
        durationInFrames={defaultDuration}
        fps={DEFAULT_PROPS.fps}
        width={1080}
        height={1920}
        defaultProps={DEFAULT_PROPS}
        calculateMetadata={async ({ props }) => {
          return {
            durationInFrames: calculateDuration(props.scenes, props.fps),
            fps: props.fps,
            width: 1080,
            height: 1920,
          };
        }}
      />
      {/* EditedReel composition for talking-head video editing */}
      <Composition
        id="EditedReel"
        component={EditedReel as React.ComponentType<Record<string, unknown>>}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          video_path: "videos/placeholder.mp4",
          words: [],
          duration_seconds: 10,
          editing_plan: { callouts: [], zoom_moments: [] },
          captions_style: "tiktok",
          fps: 30,
          brand_color: "#E0701E",
          instagram_handle: "@omerd",
        }}
        calculateMetadata={async ({ props }: { props: EditedReelProps }) => ({
          durationInFrames: calculateEditDuration(props.duration_seconds, props.fps, props.duration_frames),
          fps: props.fps,
          width: 1080,
          height: 1920,
        })}
      />
      {/* ProductDemo — ~31s landing-page product demo (upload→button→AI→result→chat→CTA) */}
      <Composition
        id="ProductDemo"
        component={ProductDemo}
        durationInFrames={DEMO_DURATION}
        fps={DEMO_FPS}
        width={1080}
        height={1920}
      />
      {/* SocialAd — ~9s paid-social ad: AI backdrop clip + Hebrew hook + CTA endcard */}
      <Composition
        id="SocialAd"
        component={SocialAd as React.ComponentType<Record<string, unknown>>}
        durationInFrames={AD_DURATION}
        fps={AD_FPS}
        width={1080}
        height={1920}
        defaultProps={{
          src: "demo/ads/ad1_pain.mp4",
          hook: "עריכת ריל\nלא צריכה חצי יום",
          accent: "חצי יום",
          sub: "DrEdit עורך לך תוך דקות",
        } as SocialAdProps}
      />
      {/* ProofAd — ~21s proof-driven ad from the real screen recording */}
      <Composition
        id="ProofAd"
        component={ProofAd as React.ComponentType<Record<string, unknown>>}
        durationInFrames={PROOF_DURATION}
        fps={PROOF_FPS}
        width={1080}
        height={1920}
        defaultProps={{
          hook: "ריל ערוך —\nבזמן שעשית קפה",
          hookAccent: "בזמן שעשית קפה",
          capUp: "מעלים קליפ. לוחצים כפתור אחד.",
          capProc: "וה-AI עורך לבד — תמלול · B-Roll · אייקונים · אפקטים",
          capRes: "וחוזרים לריל מוכן להורדה.",
          compareTop: "מה שלוקח לעורך יומיים",
          compareBottom: "אצלך — תוך דקות.",
        } as ProofAdProps}
      />
      {/* BeforeAfterAd — same 10s moment raw vs edited, wipe/cut variants */}
      <Composition
        id="BeforeAfterAd"
        component={BeforeAfterAd as React.ComponentType<Record<string, unknown>>}
        durationInFrames={BA_DURATION}
        fps={BA_FPS}
        width={1080}
        height={1920}
        defaultProps={{
          variant: "wipe",
          before: "demo/ba/before.mp4",
          after: "demo/ba/after.mp4",
        } as BeforeAfterAdProps}
        calculateMetadata={async ({ props }) => {
          const variant = (props as unknown as BeforeAfterAdProps).variant;
          // "cards" is a pure 10s showcase (no endcard) — trim to the segment.
          // "cut2" (result-first reorder) is its own fixed 225f (~7.5s) length.
          if (variant === "cards") return { durationInFrames: 300 };
          if (variant === "cut2") return { durationInFrames: 225 };
          return { durationInFrames: BA_DURATION };
        }}
      />
      {/* FounderColdOpen — Omer's own raw pitch re-cut to lead with the payoff */}
      <Composition
        id="FounderColdOpen"
        component={FounderColdOpen as React.ComponentType<Record<string, unknown>>}
        durationInFrames={FCO_DURATION}
        fps={FCO_FPS}
        width={1080}
        height={1920}
        defaultProps={{} as FounderColdOpenProps}
      />
      {/* ThreeThingsAd — rapid 3-claim listicle, all proof beats inside the 3s hook window */}
      <Composition
        id="ThreeThingsAd"
        component={ThreeThingsAd as React.ComponentType<Record<string, unknown>>}
        durationInFrames={THREE_THINGS_DURATION}
        fps={THREE_THINGS_FPS}
        width={1080}
        height={1920}
        defaultProps={{
          captionsClip: "demo/threethings_captions.mp4",
          brollClip: "examples/broll_counter.mp4",
          effectsClip: "examples/overlay_pill.mp4",
          payoffClip: "demo/threethings_payoff.mp4",
        } as ThreeThingsAdProps}
      />
      {/* StyleWallAd — 8-tile grid slam collapsing into one real finished reel */}
      <Composition
        id="StyleWallAd"
        component={StyleWallAd as React.ComponentType<Record<string, unknown>>}
        durationInFrames={SW_DURATION}
        fps={SW_FPS}
        width={1080}
        height={1920}
        defaultProps={{
          finalReel: "demo/style_wall_full.mp4",
        } as StyleWallAdProps}
      />
      {/* CampaignAd — Omer Draizin paid-social ad (spine + proof + landing) */}
      <Composition
        id="CampaignAd"
        component={CampaignAd as React.ComponentType<Record<string, unknown>>}
        durationInFrames={1290}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          spine_path: "videos/campaign/spine_hook04.mp4",
          spine_duration: 38.46,
          landing_path: "videos/campaign/landing.mp4",
          landing_duration: 5.5,
          words: [],
          video_inserts: [],
          image_overlays: [],
          diagrams: [],
          punch_ins: [],
          end_cta_text: "בדקו מה חסר לעסק שלכם",
          website: "omerdraizin.com",
          caption_offset: 0,
        }}
        calculateMetadata={async ({ props }: { props: CampaignAdProps }) => ({
          durationInFrames: calculateCampaignDuration(props.spine_duration, props.landing_duration ?? 0, 30),
          fps: 30,
          width: 1080,
          height: 1920,
        })}
      />
      {/* OverlayPreview — standalone overlay motion graphics studio */}
      <Composition
        id="OverlayPreview"
        component={OverlayPreview as React.ComponentType<Record<string, unknown>>}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          overlay_scenes: OVERLAY_PREVIEW_SCENES,
          fps: 30,
          brand_color: "#E0701E",
          total_duration: 147,
          show_safe_zones: false,
          show_silhouette: true,
          show_ambient_bg: true,
        }}
        calculateMetadata={async ({ props }: { props: OverlayPreviewProps }) => ({
          durationInFrames: calculateOverlayPreviewDuration(
            props.total_duration,
            props.fps,
          ),
          fps: props.fps,
          width: 1080,
          height: 1920,
        })}
      />
      {/* TemplatedReel — production composition: real video + template overlay */}
      <Composition
        id="TemplatedReel"
        component={TemplatedReel as React.ComponentType<Record<string, unknown>>}
        durationInFrames={2040}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          video_path: "videos/img_1926.mp4",
          total_duration: 67.86,
          fps: 30,
          template: TEMPLATE_PREVIEW_DEFAULT,
          mute_audio: false,
          start_at: 0,
        }}
        calculateMetadata={async ({ props }: { props: TemplatedReelProps }) => ({
          durationInFrames: calculateTemplatedReelDuration(
            props.total_duration,
            props.fps,
          ),
          fps: props.fps,
          width: 1080,
          height: 1920,
        })}
      />
      {/* TemplatePreview — full-video format templates (bracket / tier rating) */}
      <Composition
        id="TemplatePreview"
        component={TemplatePreview as React.ComponentType<Record<string, unknown>>}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          template: TEMPLATE_PREVIEW_DEFAULT,
          total_duration: 20,
          fps: 30,
          brand_color: "#B7FF00",
          show_safe_zones: false,
          show_silhouette: true,
          show_ambient_bg: true,
        }}
        calculateMetadata={async ({ props }: { props: TemplatePreviewProps }) => ({
          durationInFrames: calculateTemplatePreviewDuration(
            props.total_duration,
            props.fps,
          ),
          fps: props.fps,
          width: 1080,
          height: 1920,
        })}
      />
      {/* BRollPreview composition for standalone B-roll scene testing */}
      <Composition
        id="BRollPreview"
        component={BRollPreview as React.ComponentType<Record<string, unknown>>}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          broll_scenes: [],
          fps: 30,
          brand_color: "#E0701E",
          total_duration: 20,
        }}
        calculateMetadata={async ({ props }: { props: BRollPreviewProps }) => ({
          durationInFrames: calculatePreviewDuration(props.total_duration, props.fps),
          fps: props.fps,
          width: 1080,
          height: 1920,
        })}
      />
      {/* SceneThumbnail — used by render_thumbnails.mjs to render one
          still per scene type for the picker UI catalog. Width/height
          must match the design resolution scenes are authored for
          (1080×1920) — otherwise Three.js / fixed-px-positioned content
          renders at the wrong scale and the user sees only the centre
          fragment of each scene. The render script uses `scale: 0.25`
          to drop the actual image file down to 270×480 for storage. */}
      <Composition
        id="SceneThumbnail"
        component={SceneThumbnail as React.ComponentType<Record<string, unknown>>}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          category: "overlay" as const,
          scene: {} as Record<string, unknown>,
          fps: 30,
          brand_color: "#7c3aed",
        }}
      />
    </>
  );
};
