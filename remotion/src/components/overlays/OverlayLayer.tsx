/**
 * OverlayLayer — dispatcher for the 10 overlay scene families.
 *
 * Mirrors the BRollOverlay pattern: takes a single scene, dispatches to the
 * right component. Used inside <Sequence> wrappers in EditedReel /
 * OverlayPreview so the timing is owned by the parent composition.
 *
 * Scene types come from types.ts. Adding a new scene type = add a case here
 * + add a discriminator to types.AnyOverlayScene.
 */
import React from "react";

import { GlassInfoCard } from "./scenes/GlassInfoCard";
import { ComparisonBoard } from "./scenes/ComparisonBoard";
import { MetricLockup } from "./scenes/MetricLockup";
import { CardGridReveal } from "./scenes/CardGridReveal";
import { StampSlam } from "./scenes/StampSlam";
import { NotificationCard } from "./scenes/NotificationCard";
import { BadgeStack } from "./scenes/BadgeStack";
import { LowerThirdPremium } from "./scenes/LowerThirdPremium";
import { ToggleSwitch } from "./scenes/ToggleSwitch";
import { ProgressFill } from "./scenes/ProgressFill";
import { TapInteraction } from "./scenes/TapInteraction";
import { FlowArrow } from "./scenes/FlowArrow";
import { CountdownTimer } from "./scenes/CountdownTimer";
import { CalendarSlot } from "./scenes/CalendarSlot";
import { TabSwitcher } from "./scenes/TabSwitcher";
import { DropdownMenu } from "./scenes/DropdownMenu";
import { SwipeChoice } from "./scenes/SwipeChoice";
import { ChartReveal } from "./scenes/ChartReveal";
import { EmojiReact } from "./scenes/EmojiReact";
import { LiveStatus } from "./scenes/LiveStatus";
import { StreamingFeed } from "./scenes/StreamingFeed";
import { PriceTag } from "./scenes/PriceTag";
import { SearchAutocomplete } from "./scenes/SearchAutocomplete";
import { TerminalFeed } from "./scenes/TerminalFeed";
import { MetricComparison } from "./scenes/MetricComparison";
import { AppIconNetwork } from "./scenes/AppIconNetwork";
import { SettingsToggleList } from "./scenes/SettingsToggleList";
import { KeyValueTable } from "./scenes/KeyValueTable";
import { TrendArrow } from "./scenes/TrendArrow";
import { StarRating } from "./scenes/StarRating";
import { FollowerCountUp } from "./scenes/FollowerCountUp";
import { CodeBlock } from "./scenes/CodeBlock";
import { CopiedToClipboard } from "./scenes/CopiedToClipboard";
import { HighlightSweep } from "./scenes/HighlightSweep";
import { SpotlightCircle } from "./scenes/SpotlightCircle";
import { HourglassDrop } from "./scenes/HourglassDrop";
import { DigitalClockFlip } from "./scenes/DigitalClockFlip";
import { KeyboardShortcut } from "./scenes/KeyboardShortcut";
import { AIThinkingPulse } from "./scenes/AIThinkingPulse";
import { TokenStreamingText } from "./scenes/TokenStreamingText";
import { PromptInputCard } from "./scenes/PromptInputCard";
import { StepProgressTrail } from "./scenes/StepProgressTrail";
import { LayersStack } from "./scenes/LayersStack";
import { BeforeAfterSlider } from "./scenes/BeforeAfterSlider";
import { ComparisonGap } from "./scenes/ComparisonGap";
import { FunnelStages } from "./scenes/FunnelStages";
import { LeaderboardPodium } from "./scenes/LeaderboardPodium";
import { QuestionCard } from "./scenes/QuestionCard";
import { CommentComposer } from "./scenes/CommentComposer";
import { BrandChip } from "./scenes/BrandChip";
import { ProgressRail } from "./scenes/ProgressRail";
import { TwinCards } from "./scenes/TwinCards";
import { ViewfinderSnap } from "./scenes/ViewfinderSnap";
import { MedalRank } from "./scenes/MedalRank";
import { ReceiptCard } from "./scenes/ReceiptCard";
import { RowBadgeWave } from "./scenes/RowBadgeWave";
import { WordStack } from "./scenes/WordStack";
import { CounterRollup } from "./scenes/CounterRollup";
import { BeforeAfterFlip } from "./scenes/BeforeAfterFlip";
import { LockReveal } from "./scenes/LockReveal";
import { ArrowScribble } from "./scenes/ArrowScribble";
import { CircleScribble } from "./scenes/CircleScribble";
import { TypingSearch } from "./scenes/TypingSearch";
import { ChatBubbleDuo } from "./scenes/ChatBubbleDuo";
import { NotificationBurst } from "./scenes/NotificationBurst";
import { MagnetPull } from "./scenes/MagnetPull";
import { RetentionCurve } from "./scenes/RetentionCurve";
import { TimelineScrub } from "./scenes/TimelineScrub";

import type { AnyOverlayScene } from "./types";

interface OverlayLayerProps {
  scene: AnyOverlayScene;
}

export const OverlayLayer: React.FC<OverlayLayerProps> = ({ scene }) => {
  switch (scene.type) {
    case "glass_info_card":
      return <GlassInfoCard scene={scene} />;
    case "comparison_board":
      return <ComparisonBoard scene={scene} />;
    case "metric_lockup":
      return <MetricLockup scene={scene} />;
    case "card_grid_reveal":
      return <CardGridReveal scene={scene} />;
    case "stamp_slam":
      return <StampSlam scene={scene} />;
    case "notification_card":
      return <NotificationCard scene={scene} />;
    case "badge_stack":
      return <BadgeStack scene={scene} />;
    case "lower_third_premium":
      return <LowerThirdPremium scene={scene} />;
    case "toggle_switch":
      return <ToggleSwitch scene={scene} />;
    case "progress_fill":
      return <ProgressFill scene={scene} />;
    case "tap_interaction":
      return <TapInteraction scene={scene} />;
    case "flow_arrow":
      return <FlowArrow scene={scene} />;
    case "countdown_timer":
      return <CountdownTimer scene={scene} />;
    case "calendar_slot":
      return <CalendarSlot scene={scene} />;
    case "tab_switcher":
      return <TabSwitcher scene={scene} />;
    case "dropdown_menu":
      return <DropdownMenu scene={scene} />;
    case "swipe_choice":
      return <SwipeChoice scene={scene} />;
    case "chart_reveal":
      return <ChartReveal scene={scene} />;
    case "emoji_react":
      return <EmojiReact scene={scene} />;
    case "live_status":
      return <LiveStatus scene={scene} />;
    case "streaming_feed":
      return <StreamingFeed scene={scene} />;
    case "price_tag":
      return <PriceTag scene={scene} />;
    case "search_autocomplete":
      return <SearchAutocomplete scene={scene} />;
    case "terminal_feed":
      return <TerminalFeed scene={scene} />;
    case "metric_comparison":
      return <MetricComparison scene={scene} />;
    case "app_icon_network":
      return <AppIconNetwork scene={scene} />;
    case "settings_toggle_list":
      return <SettingsToggleList scene={scene} />;
    case "key_value_table":
      return <KeyValueTable scene={scene} />;
    case "trend_arrow":
      return <TrendArrow scene={scene} />;
    case "star_rating":
      return <StarRating scene={scene} />;
    case "follower_count_up":
      return <FollowerCountUp scene={scene} />;
    case "code_block":
      return <CodeBlock scene={scene} />;
    case "copied_to_clipboard":
      return <CopiedToClipboard scene={scene} />;
    case "highlight_sweep":
      return <HighlightSweep scene={scene} />;
    case "spotlight_circle":
      return <SpotlightCircle scene={scene} />;
    case "hourglass_drop":
      return <HourglassDrop scene={scene} />;
    case "digital_clock_flip":
      return <DigitalClockFlip scene={scene} />;
    case "keyboard_shortcut":
      return <KeyboardShortcut scene={scene} />;
    case "ai_thinking_pulse":
      return <AIThinkingPulse scene={scene} />;
    case "token_streaming_text":
      return <TokenStreamingText scene={scene} />;
    case "prompt_input_card":
      return <PromptInputCard scene={scene} />;
    case "step_progress_trail":
      return <StepProgressTrail scene={scene} />;
    case "layers_stack":
      return <LayersStack scene={scene} />;
    case "before_after_slider":
      return <BeforeAfterSlider scene={scene} />;
    case "comparison_gap":
      return <ComparisonGap scene={scene} />;
    case "funnel_stages":
      return <FunnelStages scene={scene} />;
    case "leaderboard_podium":
      return <LeaderboardPodium scene={scene} />;
    case "question_card":
      return <QuestionCard scene={scene} />;
    case "comment_composer":
      return <CommentComposer scene={scene} />;
    case "brand_chip":
      return <BrandChip scene={scene} />;
    case "progress_rail":
      return <ProgressRail scene={scene} />;
    case "twin_cards":
      return <TwinCards scene={scene} />;
    case "viewfinder_snap":
      return <ViewfinderSnap scene={scene} />;
    case "medal_rank":
      return <MedalRank scene={scene} />;
    case "receipt_card":
      return <ReceiptCard scene={scene} />;
    case "row_badge_wave":
      return <RowBadgeWave scene={scene} />;
    case "word_stack":
      return <WordStack scene={scene} />;
    case "counter_rollup":
      return <CounterRollup scene={scene} />;
    case "before_after_flip":
      return <BeforeAfterFlip scene={scene} />;
    case "lock_reveal":
      return <LockReveal scene={scene} />;
    case "arrow_scribble":
      return <ArrowScribble scene={scene} />;
    case "circle_scribble":
      return <CircleScribble scene={scene} />;
    case "typing_search":
      return <TypingSearch scene={scene} />;
    case "chat_bubble_duo":
      return <ChatBubbleDuo scene={scene} />;
    case "notification_burst":
      return <NotificationBurst scene={scene} />;
    case "magnet_pull":
      return <MagnetPull scene={scene} />;
    case "retention_curve":
      return <RetentionCurve scene={scene} />;
    case "timeline_scrub":
      return <TimelineScrub scene={scene} />;
    default: {
      // Exhaustiveness check — TS surfaces unhandled scene types.
      // Runtime tolerance: unknown `type` strings and unknown extra fields
      // (sync_role, tease_of, payoff_of, ...) never throw — the switch only
      // reads `scene.type`, and an unmatched type renders null.
      const _exhaustive: never = scene;
      return null;
    }
  }
};

export type { AnyOverlayScene } from "./types";
