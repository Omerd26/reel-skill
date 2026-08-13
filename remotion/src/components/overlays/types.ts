/**
 * Overlay Motion Graphics — type system.
 *
 * Premium HTML/CSS-style motion overlays that sit ON TOP of the talking-head
 * video without replacing it. Designed for transcript-synced placement and
 * face-aware safe zones.
 *
 * Distinct from B-Roll (full-screen cutaways) and from EffectLayer (legacy
 * single-element badges). Aligned with HyperFrames mental model — but
 * implemented in the project's existing Remotion stack.
 */

import type { OverlayAnchor } from "./primitives";
import type { EntranceSignature } from "./motion";
import type { Tone } from "../../design/tokens";
import type { TransitionKind } from "./transitions";
import type { VisualStyleId } from "../../design/visual-styles";

// Re-exports so scene authors can import all overlay-system types from one place.
export type { OverlayAnchor } from "./primitives";
export type { EntranceSignature } from "./motion";
export type { Tone } from "../../design/tokens";
export type { TransitionKind } from "./transitions";

// ── Base scene ───────────────────────────────────────────────────────────────

export interface OverlaySceneBase {
  /** Stable id — used for revision routing. */
  id: string;
  /** Absolute start time in seconds (master timeline). */
  start: number;
  /** Absolute end time in seconds. */
  end: number;
  /** Transcript phrase this overlay attaches to — for plan review. */
  transcript_phrase?: string;
  /** Per-word onset times within the phrase (for word-synced kinetic text). */
  word_onsets?: number[];
  /** Why this overlay was placed here — for plan review. */
  rationale?: string;
  /** Where to anchor the overlay. */
  anchor?: OverlayAnchor;
  /** Override default entrance signature for this scene type. */
  entrance?: EntranceSignature;
  /** Render layer (CSS z-index). Default 10. */
  z?: number;
  /** Visual style override (otherwise project default applies). */
  visual_style?: VisualStyleId;
  /** Transition out → next scene. Default: project default. */
  transition_out?: TransitionKind;
  /** Planner sync metadata (JATHO_PLAYBOOK §2) — word↔visual sync role.
   * Carried through for plan review; the renderer ignores it. Unknown extra
   * fields on scene dicts are tolerated: dispatch reads only `type`. */
  sync_role?: "plant" | "land" | "follow" | "payoff";
  /** Scene id this scene teases (blur-tease → payoff linkage, JATHO §1.2). */
  tease_of?: string;
  /** Scene id this scene pays off. */
  payoff_of?: string;
}

// ── 1. Glass Info Card — eyebrow + title + body ──────────────────────────────

export interface GlassInfoCardScene extends OverlaySceneBase {
  type: "glass_info_card";
  eyebrow?: string;
  title: string;
  body?: string;
  material?: "liquid" | "frosted" | "solid-dark" | "outlined";
  tone?: Tone;
  width?: "narrow" | "medium" | "wide";
  rtl?: boolean;
}

// ── 2. Comparison Board — left vs right ──────────────────────────────────────

export interface ComparisonSide {
  eyebrow?: string;
  title: string;
  body?: string;
  tone?: Tone;
}

export interface ComparisonBoardScene extends OverlaySceneBase {
  type: "comparison_board";
  left: ComparisonSide;
  right: ComparisonSide;
  divider_label?: string;
  highlight?: "left" | "right" | "none";
  material?: "liquid" | "frosted" | "solid-dark" | "outlined";
  rtl?: boolean;
}

// ── 4. Metric Lockup — big number + label ───────────────────────────────────

export interface MetricLockupScene extends OverlaySceneBase {
  type: "metric_lockup";
  /** Eyebrow above the number. */
  eyebrow?: string;
  /** Final number value. Animates from 0 to this. */
  value: number;
  /** Optional prefix (e.g. "$", "+"). */
  prefix?: string;
  /** Optional suffix (e.g. "%", "K", "+"). */
  suffix?: string;
  /** Label below the number. */
  label?: string;
  /** Sublabel below the label. */
  sublabel?: string;
  /** Tone — colors the number + accent. */
  tone?: Tone;
  /** Show frosted card behind? Default true. */
  card?: boolean;
  /** PAYOFF mode (JATHO §2): count-up spans ~85% of the WHOLE scene duration
   * and keeps visibly ticking late, instead of the fixed 0.5s ramp.
   * Default undefined = current behavior. */
  run_past?: boolean;
  /** Tease state (JATHO §1.2): the planner plants a censored clone of a late
   * metric payoff early — number + labels blurred/unreadable, count frozen
   * at full value (right SHAPE, censored content), faint breathing halo.
   * Default undefined = normal behavior. */
  blurred?: boolean;
  /** SHOUT word above the censored card naming WHAT is hidden
   * (default "הסוד:"). Rendered only when blurred. */
  tease_label?: string;
}

// ── 5. Card Grid Reveal — N cards cascade in ────────────────────────────────

export interface GridCard {
  eyebrow?: string;
  number?: string;     // small "01", "02" indicator
  title: string;
  body?: string;
  /** Optional simple SVG-string for an icon (mono stroke, accent-tinted). */
  icon?: "save" | "fix" | "speed" | "scale" | "secure" | "automate";
  tone?: Tone;
}

export interface CardGridRevealScene extends OverlaySceneBase {
  type: "card_grid_reveal";
  headline?: string;
  cards: GridCard[];                 // 2 or 3 cards typically
  layout?: "row" | "column";
  rtl?: boolean;
  material?: "liquid" | "frosted" | "solid-dark";
  /** Tease state (JATHO §1.2 — the censored-checklist hook): card shapes
   * crisp, contents blurred/unreadable. Default undefined = normal. */
  blurred?: boolean;
  /** SHOUT word above the censored grid naming WHAT is hidden
   * (default "הסוד:"). Rendered only when blurred. */
  tease_label?: string;
}

// ── 6. Stamp Slam — punchline emphasis ──────────────────────────────────────

export interface StampSlamScene extends OverlaySceneBase {
  type: "stamp_slam";
  text: string;
  /** Slight rotation in degrees. Default -3. */
  rotation?: number;
  /** Tone — colors stamp border + text. */
  tone?: Tone;
  /** Layered double-line (stamp style). Default true. */
  doubleStroke?: boolean;
}

// ── 7. Notification Card — iOS-style ────────────────────────────────────────

export interface NotificationCardScene extends OverlaySceneBase {
  type: "notification_card";
  app_name: string;
  app_icon_letter?: string;          // single letter / emoji rendered in icon
  app_icon_color?: string;           // accent color for icon bg
  title: string;
  body: string;
  time_label?: string;               // e.g. "now", "2m ago"
  rtl?: boolean;
}

// ── 9. Badge Stack — feature pills ──────────────────────────────────────────

export interface BadgePillItem {
  text: string;
  tone?: Tone;
  /** Optional small dot indicator (e.g. status). */
  dot?: boolean;
}

export interface BadgeStackScene extends OverlaySceneBase {
  type: "badge_stack";
  headline?: string;
  items: BadgePillItem[];
  layout?: "wrap" | "vertical" | "horizontal";
}

// ── 10. Lower Third Premium ─────────────────────────────────────────────────

export interface LowerThirdPremiumScene extends OverlaySceneBase {
  type: "lower_third_premium";
  /** The name / title text. */
  primary: string;
  /** Subtitle (role, channel, handle). */
  secondary?: string;
  /** Optional small icon / avatar URL. */
  avatar_letter?: string;            // letter-as-avatar fallback
  avatar_color?: string;
  /** Show as a frosted pill (default) or solid card. */
  variant?: "pill" | "card";
}

// ── Visual-metaphor scenes (top-bias by default — never cover the speaker) ───
//
// Per DESIGN.md "Visual Metaphor Framework", these scenes carry the spoken
// meaning visually (open/close, easy/fast, send/publish, automate). Use them
// instead of glass_info_card whenever the spoken phrase implies an action,
// state change, or process.

export type { ToggleSwitchScene } from "./scenes/ToggleSwitch";
export type { ProgressFillScene } from "./scenes/ProgressFill";
export type { TapInteractionScene } from "./scenes/TapInteraction";
export type { FlowArrowScene } from "./scenes/FlowArrow";
export type { CountdownTimerScene } from "./scenes/CountdownTimer";
export type { CalendarSlotScene } from "./scenes/CalendarSlot";
export type { TabSwitcherScene } from "./scenes/TabSwitcher";
export type { DropdownMenuScene } from "./scenes/DropdownMenu";
export type { SwipeChoiceScene } from "./scenes/SwipeChoice";
export type { ChartRevealScene } from "./scenes/ChartReveal";
export type { EmojiReactScene } from "./scenes/EmojiReact";
export type { LiveStatusScene } from "./scenes/LiveStatus";
export type { StreamingFeedScene, FeedEvent } from "./scenes/StreamingFeed";
export type { PriceTagScene } from "./scenes/PriceTag";
export type { SearchAutocompleteScene } from "./scenes/SearchAutocomplete";
export type { TerminalFeedScene, TerminalLine } from "./scenes/TerminalFeed";
export type { MetricComparisonScene, MetricComparisonSide } from "./scenes/MetricComparison";
export type { AppIconNetworkScene, AppIconLeaf } from "./scenes/AppIconNetwork";
export type { SettingsToggleListScene, SettingsToggleRow } from "./scenes/SettingsToggleList";
export type { KeyValueTableScene, KeyValueRow } from "./scenes/KeyValueTable";
// ── Round 4 (2026-05-08): 20 more scenes ─────────────────────────────────────
export type { TrendArrowScene } from "./scenes/TrendArrow";
export type { StarRatingScene } from "./scenes/StarRating";
export type { FollowerCountUpScene } from "./scenes/FollowerCountUp";
export type { CodeBlockScene } from "./scenes/CodeBlock";
export type { CopiedToClipboardScene } from "./scenes/CopiedToClipboard";
export type { HighlightSweepScene } from "./scenes/HighlightSweep";
export type { SpotlightCircleScene } from "./scenes/SpotlightCircle";
export type { HourglassDropScene } from "./scenes/HourglassDrop";
export type { DigitalClockFlipScene } from "./scenes/DigitalClockFlip";
export type { KeyboardShortcutScene } from "./scenes/KeyboardShortcut";
export type { AIThinkingPulseScene } from "./scenes/AIThinkingPulse";
export type { TokenStreamingTextScene } from "./scenes/TokenStreamingText";
export type { PromptInputCardScene } from "./scenes/PromptInputCard";
export type { StepProgressTrailScene } from "./scenes/StepProgressTrail";
export type { LayersStackScene } from "./scenes/LayersStack";
export type { BeforeAfterSliderScene } from "./scenes/BeforeAfterSlider";
export type { ComparisonGapScene } from "./scenes/ComparisonGap";
export type { FunnelStagesScene, FunnelStage } from "./scenes/FunnelStages";
export type { LeaderboardPodiumScene, PodiumEntry } from "./scenes/LeaderboardPodium";
// ── Jatho Round 1 (2026-08-08): question re-hook + CTA pre-visualization ─────
export type { QuestionCardScene } from "./scenes/QuestionCard";
export type { CommentComposerScene } from "./scenes/CommentComposer";
export type { BrandChipScene } from "./scenes/BrandChip";
export type { ProgressRailScene } from "./scenes/ProgressRail";
export type { TwinCardsScene } from "./scenes/TwinCards";
export type { ViewfinderSnapScene } from "./scenes/ViewfinderSnap";
export type { MedalRankScene } from "./scenes/MedalRank";
export type { ReceiptCardScene } from "./scenes/ReceiptCard";
export type { RowBadgeWaveScene } from "./scenes/RowBadgeWave";
export type { WordStackScene } from "./scenes/WordStack";
export type { CounterRollupScene } from "./scenes/CounterRollup";
export type { BeforeAfterFlipScene } from "./scenes/BeforeAfterFlip";
export type { LockRevealScene } from "./scenes/LockReveal";
export type { ArrowScribbleScene } from "./scenes/ArrowScribble";
export type { CircleScribbleScene } from "./scenes/CircleScribble";
export type { TypingSearchScene } from "./scenes/TypingSearch";
export type { ChatBubbleDuoScene } from "./scenes/ChatBubbleDuo";
export type { NotificationBurstScene } from "./scenes/NotificationBurst";
export type { MagnetPullScene } from "./scenes/MagnetPull";
export type { RetentionCurveScene } from "./scenes/RetentionCurve";
export type { TimelineScrubScene } from "./scenes/TimelineScrub";

import type { ToggleSwitchScene } from "./scenes/ToggleSwitch";
import type { ProgressFillScene } from "./scenes/ProgressFill";
import type { TapInteractionScene } from "./scenes/TapInteraction";
import type { FlowArrowScene } from "./scenes/FlowArrow";
import type { CountdownTimerScene } from "./scenes/CountdownTimer";
import type { CalendarSlotScene } from "./scenes/CalendarSlot";
import type { TabSwitcherScene } from "./scenes/TabSwitcher";
import type { DropdownMenuScene } from "./scenes/DropdownMenu";
import type { SwipeChoiceScene } from "./scenes/SwipeChoice";
import type { ChartRevealScene } from "./scenes/ChartReveal";
import type { EmojiReactScene } from "./scenes/EmojiReact";
import type { LiveStatusScene } from "./scenes/LiveStatus";
import type { StreamingFeedScene } from "./scenes/StreamingFeed";
import type { PriceTagScene } from "./scenes/PriceTag";
import type { SearchAutocompleteScene } from "./scenes/SearchAutocomplete";
import type { TerminalFeedScene } from "./scenes/TerminalFeed";
import type { MetricComparisonScene } from "./scenes/MetricComparison";
import type { AppIconNetworkScene } from "./scenes/AppIconNetwork";
import type { SettingsToggleListScene } from "./scenes/SettingsToggleList";
import type { KeyValueTableScene } from "./scenes/KeyValueTable";
import type { TrendArrowScene } from "./scenes/TrendArrow";
import type { StarRatingScene } from "./scenes/StarRating";
import type { FollowerCountUpScene } from "./scenes/FollowerCountUp";
import type { CodeBlockScene } from "./scenes/CodeBlock";
import type { CopiedToClipboardScene } from "./scenes/CopiedToClipboard";
import type { HighlightSweepScene } from "./scenes/HighlightSweep";
import type { SpotlightCircleScene } from "./scenes/SpotlightCircle";
import type { HourglassDropScene } from "./scenes/HourglassDrop";
import type { DigitalClockFlipScene } from "./scenes/DigitalClockFlip";
import type { KeyboardShortcutScene } from "./scenes/KeyboardShortcut";
import type { AIThinkingPulseScene } from "./scenes/AIThinkingPulse";
import type { TokenStreamingTextScene } from "./scenes/TokenStreamingText";
import type { PromptInputCardScene } from "./scenes/PromptInputCard";
import type { StepProgressTrailScene } from "./scenes/StepProgressTrail";
import type { LayersStackScene } from "./scenes/LayersStack";
import type { BeforeAfterSliderScene } from "./scenes/BeforeAfterSlider";
import type { ComparisonGapScene } from "./scenes/ComparisonGap";
import type { FunnelStagesScene } from "./scenes/FunnelStages";
import type { LeaderboardPodiumScene } from "./scenes/LeaderboardPodium";
import type { QuestionCardScene } from "./scenes/QuestionCard";
import type { CommentComposerScene } from "./scenes/CommentComposer";
import type { BrandChipScene } from "./scenes/BrandChip";
import type { ProgressRailScene } from "./scenes/ProgressRail";
import type { TwinCardsScene } from "./scenes/TwinCards";
import type { ViewfinderSnapScene } from "./scenes/ViewfinderSnap";
import type { MedalRankScene } from "./scenes/MedalRank";
import type { ReceiptCardScene } from "./scenes/ReceiptCard";
import type { RowBadgeWaveScene } from "./scenes/RowBadgeWave";
import type { WordStackScene } from "./scenes/WordStack";
import type { CounterRollupScene } from "./scenes/CounterRollup";
import type { BeforeAfterFlipScene } from "./scenes/BeforeAfterFlip";
import type { LockRevealScene } from "./scenes/LockReveal";
import type { ArrowScribbleScene } from "./scenes/ArrowScribble";
import type { CircleScribbleScene } from "./scenes/CircleScribble";
import type { TypingSearchScene } from "./scenes/TypingSearch";
import type { ChatBubbleDuoScene } from "./scenes/ChatBubbleDuo";
import type { NotificationBurstScene } from "./scenes/NotificationBurst";
import type { MagnetPullScene } from "./scenes/MagnetPull";
import type { RetentionCurveScene } from "./scenes/RetentionCurve";
import type { TimelineScrubScene } from "./scenes/TimelineScrub";

// ── Discriminated union ──────────────────────────────────────────────────────

export type AnyOverlayScene =
  | GlassInfoCardScene
  | ComparisonBoardScene
  | MetricLockupScene
  | CardGridRevealScene
  | StampSlamScene
  | NotificationCardScene
  | BadgeStackScene
  | LowerThirdPremiumScene
  | ToggleSwitchScene
  | ProgressFillScene
  | TapInteractionScene
  | FlowArrowScene
  | CountdownTimerScene
  | CalendarSlotScene
  | TabSwitcherScene
  | DropdownMenuScene
  | SwipeChoiceScene
  | ChartRevealScene
  | EmojiReactScene
  | LiveStatusScene
  | StreamingFeedScene
  | PriceTagScene
  | SearchAutocompleteScene
  | TerminalFeedScene
  | MetricComparisonScene
  | AppIconNetworkScene
  | SettingsToggleListScene
  | KeyValueTableScene
  | TrendArrowScene
  | StarRatingScene
  | FollowerCountUpScene
  | CodeBlockScene
  | CopiedToClipboardScene
  | HighlightSweepScene
  | SpotlightCircleScene
  | HourglassDropScene
  | DigitalClockFlipScene
  | KeyboardShortcutScene
  | AIThinkingPulseScene
  | TokenStreamingTextScene
  | PromptInputCardScene
  | StepProgressTrailScene
  | LayersStackScene
  | BeforeAfterSliderScene
  | ComparisonGapScene
  | FunnelStagesScene
  | LeaderboardPodiumScene
  | QuestionCardScene
  | CommentComposerScene
  | BrandChipScene
  | ProgressRailScene
  | TwinCardsScene
  | ViewfinderSnapScene
  | MedalRankScene
  | ReceiptCardScene
  | RowBadgeWaveScene
  | WordStackScene
  | CounterRollupScene
  | BeforeAfterFlipScene
  | LockRevealScene
  | ArrowScribbleScene
  | CircleScribbleScene
  | TypingSearchScene
  | ChatBubbleDuoScene
  | NotificationBurstScene
  | MagnetPullScene
  | RetentionCurveScene
  | TimelineScrubScene;

// ── Plan-level types — what the Python planner emits ────────────────────────

export interface OverlayPlan {
  /** Meta — pulled from project DESIGN.md. */
  visual_style: VisualStyleId;
  /** Project brand color (overrides style accent if needed). */
  brand_color: string;
  /** Total duration in seconds. */
  duration: number;
  /** Frame rate. Default 30. */
  fps: number;
  /** Composition dimensions. Default 1080×1920. */
  width: number;
  height: number;
  /** Scenes in render order. Each scene's [start, end] must be valid. */
  scenes: AnyOverlayScene[];
  /** Default transition between consecutive scenes. */
  default_transition: TransitionKind;
}
