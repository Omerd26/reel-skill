/**
 * Template Video Formats — type system.
 *
 * Reusable short-form video templates that sit ON TOP of a talking-head clip.
 * Distinct from overlays (transient motion moments) — these are full-format
 * compositions that own the entire video duration (one template per video).
 *
 * Currently two formats:
 *   1. bracket_battle  — tournament bracket comparison ("Video Component Battle")
 *   2. tier_rating     — rating/tier board with icons     ("זמני העלאה")
 *
 * Architecture mirrors the overlay system: data-driven scene objects,
 * discriminated union, dispatcher component, transcript-sync support.
 */

import type { TemplateIconId } from "./icons";

// ── Shared types ─────────────────────────────────────────────────────────────

/** Where the template panel sits relative to the speaker. */
export type TemplateAnchor =
  | "lower-third"     // y starts ~55% — covers torso, leaves face clear
  | "bottom-half"     // y starts ~50% — large panel, covers torso/lower body
  | "top-third"       // y starts 6% — for tall speakers
  | "center"          // full-screen takeover — only when face zone is hidden
  | "auto";           // planner picks based on speaker position metadata

/** Per-item appearance timing — sync to transcript or use evenly distributed defaults. */
export interface ItemTiming {
  /** Item id (matches an item in the format's data). */
  id: string;
  /** Absolute time in seconds when this item appears. */
  appear_at: number;
  /**
   * Tier-only (two-phase): when the item name first floats above the table
   * (the moment the speaker says its name). It then drops into its row at
   * `appear_at` (the moment the speaker decides its tier). If omitted, the
   * item simply pops into its row at `appear_at`.
   */
  mention_at?: number;
  /**
   * Bracket-only: which round this timing entry applies to. Same item label
   * appears in R0 (seeded) plus once per round it wins (R1, R2, …, champion).
   * Without this field, the timing applies to all rounds of that label.
   */
  round?: number;
  /** Optional time when item moves/highlights (e.g. round-2 result). */
  highlight_at?: number;
}

// ── 1. Bracket Battle ────────────────────────────────────────────────────────

/**
 * Tournament-style bracket. Items face off in pairs, winners advance.
 *
 * The template auto-builds the bracket layout from a flat `items` array. The
 * number of items must be a power of 2 (2, 4, 8, 16) — the planner pads with
 * empty slots if it isn't.
 *
 * Rounds:
 *   N=2  → 1 round  (final only)
 *   N=4  → 2 rounds (semis + final)
 *   N=8  → 3 rounds (QF + SF + F)
 *   N=16 → 4 rounds (R16 + QF + SF + F)
 */
export interface BracketBattleTemplate {
  type: "bracket_battle";
  /** Stable id — for revision routing. */
  id: string;

  /** Big title at the top. */
  title: string;
  /** Smaller subtitle below title (optional final-matchup hint). */
  subtitle?: string;

  /**
   * Flat list of items in seed order. Index 0 plays index 1, 2 plays 3, etc.
   * Length must be a power of 2 ≥ 2. Planner pads with empty strings if not.
   */
  items: string[];

  /**
   * Winners — flat list, one per round. Round 1 winners come first, then
   * round 2 winners, etc. If omitted, no items are highlighted (neutral
   * bracket).
   *
   * Example for N=8:
   *   round 1 (4 winners) + round 2 (2 winners) + round 3 (1 champion) = 7
   */
  winners?: string[];

  /** Brand accent color — used for winner highlights & connector lines. */
  accent_color?: string;

  /**
   * Where on the frame to anchor the bracket. Default "lower-third" so the
   * speaker's face stays clear above the bracket.
   */
  anchor?: TemplateAnchor;

  /** Override the bracket panel's top Y (px). For placing it in the upper third. */
  panel_top?: number;
  /** Override the bracket panel's height (px). */
  panel_height?: number;
  /** Override the Hebrew title's top Y (px). */
  title_y?: number;

  /**
   * Per-item appearance timing. If omitted, items animate in evenly across
   * the template's duration.
   */
  timing?: ItemTiming[];

  /** RTL — Hebrew default. */
  rtl?: boolean;

  /** Aesthetic — affects card/connector styling. */
  style?: "clean-social" | "premium-glass" | "stadium-dark";
}

// ── 2. Tier / Rating Format ──────────────────────────────────────────────────

/**
 * A single tier row in a rating board.
 *
 *   - label: tier letter / name (e.g. "אא", "א", "ב", "ג", "ד" or "S", "A", "B")
 *   - color: row background color (gradient stops from rating list)
 *   - items: items dropped into this tier (rendered as icons or text chips)
 */
export interface TierRow {
  /** Tier label shown on the leading edge of the row. */
  label: string;
  /** Background color for the tier label cell. */
  color: string;
  /** Items in this tier — each becomes an icon chip in the row. */
  items: TierItem[];
}

/**
 * A single item placed in a tier row.
 *
 * Render priority (the first that's set wins):
 *   1. image_url      → render as a logo image (e.g. Clearbit prop-firm logo)
 *   2. icon           → render as a stroke SVG (mapped from `id` if omitted)
 *   3. label          → render as a bold text chip (when neither image nor icon fits)
 *
 * `id` is always required — it's the stable handle used for timing sync and
 * revisions.
 */
export interface TierItem {
  /** Stable id — usually the item name in latin (`hook`, `microphone`). */
  id: string;
  /** Icon to render — see icons.ts for available IDs. */
  icon?: TemplateIconId;
  /** Optional small label under/next to the icon. */
  label?: string;
  /**
   * Logo / image to render as a chip. Must be either a Remotion-relative
   * path (`logos/your-brand.png`) or an absolute URL. When set, takes priority
   * over `icon`.
   */
  image_url?: string;
  /**
   * When true and `image_url` is unset, the cell renders the `label` as a
   * bold text chip (good for brand names like "FTMO", "Top Step" where an
   * abstract icon would be wrong). Auto-true when label is set + icon is unset.
   */
  text_chip?: boolean;
}

export interface TierRatingTemplate {
  type: "tier_rating";
  /** Stable id — for revision routing. */
  id: string;

  /** Big title above the board (e.g. "זמני העלאה"). */
  title?: string;

  /** Tier rows in order from best (top) to worst (bottom). */
  ratings: TierRow[];

  /** Aesthetic for the rating table. */
  table_style?: "dark" | "premium-glass" | "warm-cream";

  /** Style for the icons inside the rows. */
  icon_style?: "bold-white" | "outlined" | "filled";

  /** Brand accent color — used for title glow and active row outline. */
  accent_color?: string;

  /** Where on the frame to anchor the rating board. */
  anchor?: TemplateAnchor;

  /**
   * Board placement:
   *   "bottom-board" (default) — full-width board at the bottom of the frame
   *   "right-panel"            — vertical board on the right side, for footage
   *                              where the speaker sits on the left
   *   "top-strip"              — horizontal strip at top: icon + label column
   *                              per rank, with a row of gradient-colored
   *                              numbered circles below (1=green → N=red).
   *                              Matches the @therealbrianmark reference.
   */
  layout?: "bottom-board" | "right-panel" | "top-strip";

  /**
   * When true the table cells are fully opaque (no see-through to the footage
   * behind). Default false keeps the subtle glass look.
   */
  opaque?: boolean;

  /** right-panel board geometry overrides (px) — e.g. to place it in the
   * upper third instead of the right side. */
  board_top?: number;
  board_left?: number;
  board_right?: number;
  row_h?: number;
  /** right-panel title top Y (px). */
  title_y?: number;
  /** top-strip editorial title — small lead word above the hero. */
  title_lead?: string;
  /** top-strip editorial title — HUGE accent-colored hero word (replaces pill). */
  title_hero?: string;
  /** top-strip editorial title — small tail word below the hero. */
  title_tail?: string;
  /**
   * right-panel staging chip placement.
   *   "above" (default) — chip floats above the board, drops in as text
   *   "below"           — chip sits below the board, flies up into its rank
   *                       slot and morphs from text to its icon on arrival
   */
  staging_position?: "above" | "below";
  /** Override staging chip y (defaults: above=board_top-140, below=board_bottom+60). */
  staging_y?: number;
  /**
   * What renders in the row after placement.
   *   "text" (default) — the label as a text chip
   *   "icon"           — the item's icon (requires item.icon)
   */
  placed_render?: "text" | "icon";

  /** Per-item appearance timing. */
  timing?: ItemTiming[];

  /** RTL — Hebrew default. */
  rtl?: boolean;
}

// ── 3. Decision Cards — horizontal quality verdicts ─────────────────────────

/**
 * A single quality-verdict card. Typical use: 2-4 cards showing escalating
 * judgments (Bad → OK → Good → Excellent) with a colored icon per level.
 *
 * Unlike `TierItem` in TierRating, each card carries its OWN color so the
 * icon, label, and badge all render in the verdict's color (red for "bad",
 * green for "great", etc.). Each card is also visually huge — the format
 * leaves the bottom half of the frame for the talking-head speaker.
 */
export interface DecisionCard {
  /** Stable id — for timing sync + revisions. */
  id: string;
  /** Bold colored label rendered below the icon (e.g. "גרוע", "מעולה"). */
  label: string;
  /** Card color — drives icon, label, badge, glow. */
  color: string;
  /** Which icon to render — see icons.ts for available IDs. */
  icon?: TemplateIconId;
  /**
   * Verdict — adds a corner badge to reinforce judgment:
   *   "good"    → ✓ in card color
   *   "bad"     → ✗ in card color
   *   "neutral" → no badge
   */
  verdict?: "good" | "bad" | "neutral";
  /** Show a crown above the card (typically for the best tier). */
  show_crown?: boolean;
}

export interface DecisionCardsTemplate {
  type: "decision_cards";
  /** Stable id — for revision routing. */
  id: string;

  /** Optional headline above the row of cards. */
  title?: string;

  /** 2-4 cards rendered left-to-right (or right-to-left in RTL mode). */
  cards: DecisionCard[];

  /** Brand accent color for the title. */
  accent_color?: string;

  /**
   * Per-card appearance timing. If omitted, cards animate in staggered
   * across the duration (left-to-right by default).
   */
  timing?: ItemTiming[];

  /** RTL — Hebrew default (cards still render visually left-to-right). */
  rtl?: boolean;

  /** Visual style — affects glow / drop-shadow intensity. */
  style?: "filled-glow" | "outlined-soft" | "flat";
}

// ── 4. Twin Split — duplicate-clone narrative format ────────────────────────

/**
 * One icon placement above a side. Multiple per side stack chronologically —
 * the most recent active one is shown (previous fades out as next fades in).
 */
export interface TwinIconCue {
  /** Stable id for revisions / debug routing. */
  id: string;
  /** Which side this icon belongs to. */
  side: "left" | "right";
  /** Icon id from the registry. */
  icon: TemplateIconId;
  /** When this icon should appear (sec). */
  appear_at: number;
  /** Optional caption pinned next to the icon. */
  label?: string;
}

/**
 * "כפילים" / twin-clone format. The footage shows the same person duplicated
 * left + right. Each side gets a persistent headline (e.g. one is the "good"
 * trader, one is the "bad"), and icons fly in above each head as the speaker
 * lists what each one does.
 */
export interface TwinSplitTemplate {
  type: "twin_split";
  /** Stable id — for revision routing. */
  id: string;

  /** Persistent label above the LEFT person. */
  left_label: string;
  /** Color for the left label (and left icons). */
  left_color: string;

  /** Persistent label above the RIGHT person. */
  right_label: string;
  /** Color for the right label (and right icons). */
  right_color: string;

  /** Icon cues — appear above the matching head at their cue times. */
  icons?: TwinIconCue[];

  /** Y of the persistent headlines (default 500). Override per shot. */
  headline_y?: number;
  /** Headline font size in px (default 44). */
  header_size?: number;
  /** Y of the icon zone (default 640). Override per shot. */
  icon_y?: number;
  /** Icon size in px (default 160). */
  icon_size?: number;
  /** X center of the left column (default 270). */
  left_cx?: number;
  /** X center of the right column (default 810). */
  right_cx?: number;

  /** RTL — Hebrew default. */
  rtl?: boolean;
}

// ── 5. Flag Compare — two-column "do / don't" board ─────────────────────────

/** One row in a flag-compare column: an icon + short label. */
export interface FlagItem {
  /** Stable id — for timing sync + revisions. */
  id: string;
  /** Icon to render (column color). */
  icon: TemplateIconId;
  /** Short label beside the icon. */
  label: string;
}

/**
 * "RED FLAG vs GREEN FLAG" / "חשוב vs לא חשוב" two-column board. Two stacked
 * lists separated by a dashed divider. Items rise up from below into their
 * slot as the speaker names them (each with an optional SFX). Sits in the
 * upper area of the frame, above a speaker seated lower in the shot.
 */
export interface FlagCompareTemplate {
  type: "flag_compare";
  /** Stable id — for revision routing. */
  id: string;

  /** Optional small eyebrow above the two headers (e.g. "Instagram Advice"). */
  title?: string;

  /** Left column header (e.g. "לא חשוב"). */
  left_label: string;
  /** Left column color (icons + header). */
  left_color: string;
  /** Optional emoji after the left header (e.g. "🚩"). */
  left_flag?: string;
  /** Left column rows. */
  left_items: FlagItem[];

  /** Right column header (e.g. "חשוב"). */
  right_label: string;
  /** Right column color. */
  right_color: string;
  /** Optional emoji after the right header (e.g. "🟢"). */
  right_flag?: string;
  /** Right column rows. */
  right_items: FlagItem[];

  /** Per-item appearance timing (id → appear_at). */
  timing?: ItemTiming[];

  /** RTL — Hebrew default. */
  rtl?: boolean;
}

// ── 6. Format Showcase — "N viral formats" image reveal ─────────────────────

/** One format card: a phone-screenshot example + a label, shown when named. */
export interface FormatCard {
  /** Stable id. */
  id: string;
  /** Public-relative image path (e.g. "formats/fmt_ranking.jpg"). */
  image: string;
  /** Label shown on the card (e.g. "דירוג ABC"). */
  label: string;
  /** When the speaker starts discussing this format (sec). */
  appear_at: number;
}

/**
 * "Here are N viral formats" explainer. Opens with all cards shown together
 * (intro montage), then — as the speaker names each format — that format's
 * screenshot pops up large above the speaker's head with its label. Branded
 * accent color frames every card.
 */
export interface FormatShowcaseTemplate {
  type: "format_showcase";
  /** Stable id — for revision routing. */
  id: string;

  /** Intro title shown while all cards are on screen (e.g. "5 פורמטים ויראליים"). */
  title?: string;

  /** Brand accent color (borders, labels, title). */
  accent_color: string;

  /** The format cards, in the order they're discussed. */
  formats: FormatCard[];

  /** RTL — Hebrew default. */
  rtl?: boolean;
}

// ── 7. Content Funnel — 3-stage funnel with active-stage emphasis ───────────

/** One funnel stage (top → bottom). */
export interface FunnelSection {
  /** Stable id. */
  id: string;
  /** Stage label (e.g. "עליון"). */
  label: string;
  /** Short goal sub-label (e.g. "קהל קר → צפיות"). */
  sub?: string;
  /** Icon to render in the band. */
  icon?: TemplateIconId;
  /** When this stage becomes the emphasized (enlarged, pulled-forward) one. */
  active_at: number;
  /** Reward label shown by the intro burst (e.g. "עוקבים", "אמון", "כסף"). */
  reward_text?: string;
  /** Optional number the reward label counts up to during the burst. */
  reward_count?: number;
}

/**
 * Content marketing funnel. A 3-band funnel sits on screen the whole video;
 * as the speaker discusses each stage (top/middle/bottom) that band enlarges,
 * brightens to the brand color and pulls forward while the others recede.
 * Optionally all bands light up together at `combine_at` (the "use all three"
 * outro).
 */
export interface ContentFunnelTemplate {
  type: "content_funnel";
  /** Stable id — for revision routing. */
  id: string;

  /** Small title/eyebrow (e.g. "משפך התוכן"). */
  title?: string;

  /** Brand accent color. */
  accent_color: string;

  /** Stages in top→bottom order. */
  sections: FunnelSection[];

  /** When all stages light up together (outro). */
  combine_at?: number;

  /** RTL — Hebrew default. */
  rtl?: boolean;
}

// ── 8. Concept Callouts — single-speaker numbered concept cards ──────────────

/** One concept card. */
export interface ConceptCallout {
  /** Stable id. */
  id: string;
  /** Icon to render in the card. */
  icon: TemplateIconId;
  /** Hebrew label (e.g. "פומו"). */
  label: string;
  /** When this concept is introduced (sec). */
  appear_at: number;
  /** When to fade this card out. Default: when the next card appears. */
  until?: number;
  /** Optional explicit number override. */
  number?: number;
  /** Second icon for contrast cards (e.g. "creator ≠ business"). */
  icon2?: TemplateIconId;
  /** Second label for contrast cards. */
  label2?: string;
  /** Symbol between the two halves of a contrast card. Default "≠". */
  separator?: string;
  /**
   * Visual variant — choose how this callout renders:
   *   "default"       — single icon + label card
   *   "comparison"    — two-icon contrast card (use icon2/label2/separator)
   *   "growth"        — center icon with users floating in + an awareness counter
   *   "strikethrough" — icon + a label that gets struck through with a red ✗
   *   "dm"            — Instagram-style chat bubble mockup with the label as
   *                     the message being typed/sent
   */
  variant?: "default" | "comparison" | "growth" | "strikethrough" | "dm";
}

/**
 * Lightweight overlay for a single talking head — as the speaker introduces
 * each concept in a list (e.g. "4 reasons why..."), a numbered card pops up
 * above their head with an icon + label. Cards crossfade from one to the
 * next. Optionally an intro title pill.
 */
export interface ConceptCalloutsTemplate {
  type: "concept_callouts";
  /** Stable id — for revision routing. */
  id: string;

  /** Brand accent (card border, badge, title). */
  accent_color: string;

  /** Optional intro pill (e.g. "4 סיבות"). */
  title?: string;
  /** When the title appears (default 0.5). */
  title_at?: number;
  /** When the title fades out (default = first callout time). */
  title_until?: number;
  /** Bring the title back at this time (and the last card fades out here). */
  title_return_at?: number;

  /** The concept cards, in the order they're discussed. */
  callouts: ConceptCallout[];

  /** Auto-number cards 1..N (default true). */
  numbered?: boolean;

  /** Card position. */
  card_y?: number;        // default 80
  card_center_x?: number; // default 540

  /** RTL — Hebrew default. */
  rtl?: boolean;
}

// ── 9. Countdown Timer — visual "N seconds to decide" countdown ─────────────

/**
 * A circular countdown ring with a big number in the center, counting N → 1.
 * Use when the speaker gives the viewer a few seconds to decide/answer ("I'll
 * give you 3 seconds"). The ring depletes over `seconds`, the center number
 * pops on each tick, and the whole thing fades out at completion.
 */
export interface CountdownTimerTemplate {
  type: "countdown_timer";
  /** Stable id — for revision routing. */
  id: string;

  /** Brand accent color (ring + number glow). */
  accent_color: string;

  /** When the countdown begins (sec). */
  start_at: number;
  /** How many seconds to count down (default 3). */
  seconds?: number;

  /** Center position (defaults: 540, 400). */
  center_x?: number;
  center_y?: number;
  /** Ring diameter in px (default 300). */
  diameter?: number;

  /** Optional label under the ring (e.g. "להחליט"). */
  label?: string;

  /** RTL — Hebrew default. */
  rtl?: boolean;
}

// ── 10. Blur Reveal — N items above the head, blurred → sharpen one by one ──

/** One item in a blur-reveal row: icon + caption, revealed at a cue time. */
export interface BlurRevealItem {
  /** Stable id. */
  id: string;
  /** Icon to render (in a circle). */
  icon: TemplateIconId;
  /** Short caption below the icon. */
  label: string;
  /** When this item un-blurs (sec). */
  reveal_at: number;
  /** Optional explicit number override (default = position). */
  number?: number;
}

/**
 * A row of N small items sitting ABOVE the speaker's head. All start blurred
 * + dimmed; as the speaker discusses each one it sharpens (blur→0, opacity→1,
 * with a pop). Each stays clear once revealed, so by the end all N are sharp.
 * Built small + high so it never covers the face. Reference: "4 mistakes" hook.
 */
export interface BlurRevealTemplate {
  type: "blur_reveal";
  /** Stable id — for revision routing. */
  id: string;

  /** Brand accent color (icon discs, number badges). */
  accent_color: string;

  /** The items, in the order they're discussed (index 0 = first). */
  items: BlurRevealItem[];

  /** Show 1..N number badges on each icon (default true). */
  numbered?: boolean;

  /** Row vertical center (px, default 150). */
  row_y?: number;

  /**
   * Layout:
   *   "row" (default) — N cards in a horizontal row (icon over label).
   *   "column"        — N compact pills (number + icon + label) stacked
   *                     vertically. Good for a ranked leaderboard on one side.
   */
  layout?: "row" | "column";
  /** column: left edge of the stack (px, default 50). */
  col_x?: number;
  /** column: top of the stack (px, default 220). */
  col_top?: number;
  /** column: pill width (px, default 540). */
  col_w?: number;
  /** column: pill height (px, default 108). */
  col_h?: number;
  /** column: gap between pills (px, default 14). */
  col_gap?: number;
  /** Optional title pill above the stack/row. */
  title?: string;
  /** Title top Y (px). */
  title_y?: number;

  /** RTL — Hebrew default (item 0 sits at the RIGHT). */
  rtl?: boolean;
}

// ── Discriminated union ──────────────────────────────────────────────────────

export type AnyTemplate =
  | BracketBattleTemplate
  | TierRatingTemplate
  | DecisionCardsTemplate
  | TwinSplitTemplate
  | FlagCompareTemplate
  | FormatShowcaseTemplate
  | ContentFunnelTemplate
  | ConceptCalloutsTemplate
  | CountdownTimerTemplate
  | BlurRevealTemplate;

// ── Plan-level shape — what the Python planner emits ─────────────────────────

export interface TemplatePlan {
  /** Project brand color. */
  brand_color: string;
  /** Total video duration in seconds. */
  duration: number;
  /** Frame rate. Default 30. */
  fps: number;
  /** Composition dimensions. Default 1080×1920. */
  width: number;
  height: number;
  /** The single template that owns this video. */
  template: AnyTemplate;
}
