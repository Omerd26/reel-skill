import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Img,
  OffthreadVideo,
} from "remotion";
import { SceneStage, CameraRig, type CameraPose } from "./SceneStage";
import { ScreenJourneyBRoll, BlueprintMapBRoll, TwinPhonesFunnelBRoll } from "./BRollJourneys";
import * as Icons from "lucide-react";
import { getBrandIcon } from "./BrandIcons";
import { KenBurns, getKenBurnsDirection, resolveImageSrc } from "./KenBurns";
import {
  SpotlightReveal,
  ShockwaveCounter,
  SplitTransform,
  CardStackBuild,
  UrgencyClock,
  AnalyticsDashboard,
  WorkflowPipeline,
  TextSlam,
} from "./BRollPremium";
import {
  ParticleAtmosphere,
  ParticleBurst,
  ParticleVortex,
} from "./BRollParticles";
import {
  CinematicChaos,
  CinematicSplit,
  CinematicConvergence,
} from "./BRollCinematic";
import {
  UISearchBar,
  UIBrowserTabs,
  UIiMessage,
  UIChecklistApp,
} from "./BRollCreativeUI";
import {
  UIInstagramPost,
  UIScreenTime,
  VisualScale,
  VisualStreak,
} from "./BRollVisualEngine";
import {
  UIPhoneLockscreen,
  UINotesApp,
  UIAnalyticsGraph,
} from "./BRollCreativePack2";
import {
  UIVoiceMemo,
  UIEmailInbox,
  VisualRocket,
  VisualDomino,
} from "./BRollCreativePack3";
import {
  UIChatGPTChat,
  UISafariURL,
  UITerminalCommand,
  UIAppStoreInstall,
  UISettingsToggle,
} from "./BRollPack4_Tech";
import {
  UIStripeDashboard,
  UIApplePay,
  UICalculatorMoney,
  VisualCashRegister,
  VisualMoneyCounter,
} from "./BRollPack5_Money";
import {
  UIFollowerCounter,
  UILiveViewers,
  UIReviewStack,
  UITestimonialCard,
  VisualCrowdGather,
  VisualRippleEffect,
  VisualRatingStars,
} from "./BRollPack6_Social";
import {
  UIFinderFiles,
  UIiMovieTimeline,
  UIZoomMeeting,
  UIAppleWatchRings,
  UICalendarFill,
} from "./BRollPack7_Apple";
import {
  UIWhiteboard,
  UIKeynoteSlide,
  VisualDiagramBuild,
  VisualStopSign,
  UISystemAlert,
} from "./BRollPack8_Education";
import {
  VisualHourglass,
  VisualSpotlightIsolate,
  VisualThumbsUpBurst,
  VisualPuzzleComplete,
  VisualDoorOpen,
} from "./BRollPack9_Metaphors";
// 3D scenes loaded lazily to avoid WebGL init when not used
const Scene3DCards = React.lazy(() => import("./BRoll3D").then(m => ({ default: m.Scene3DCards })));
const Scene3DSphere = React.lazy(() => import("./BRoll3D").then(m => ({ default: m.Scene3DSphere })));
const Scene3DMorph = React.lazy(() => import("./BRoll3D").then(m => ({ default: m.Scene3DMorph })));

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BRollItem {
  text: string;
  icon?: string;          // lucide-react icon name e.g. "Zap", "CheckCircle"
  emoji?: string;         // fallback if no icon
  highlight_at?: number;  // seconds — when this item gets hero highlight
  sub_text?: string;
  value?: string;         // for progress bars e.g. "87"
}

export interface BRollSceneData {
  type:
    | "narrative_person"    // Person + floating items → fly in → success burst
    | "icon_showcase"       // Central brand/concept icon + orbiting icons
    | "stat_counter"        // HERO number that counts up + icon + label
    | "icon_list"           // 2-3 items with animated lucide icons
    | "flow"                // 2-3 boxes connected by animated arrows
    | "quote_hero"          // Dramatic quote reveal with animated underline
    | "progress"            // Animated progress bar(s)
    | "list_highlight"      // All items visible, each pops when spoken
    | "list"                // Items reveal one by one
    | "key_point"           // Single big text HERO
    | "steps"               // Numbered steps
    | "comparison"          // Two panels  vs 
    // ── Concept Library types ──────────────────────────────────────────────
    | "graph_spike"         // Bar chart with dramatic spike bar + glow
    | "phone_screen_stack"  // 3 overlapping phone frames at depth
    | "funnel_build"        // Bars narrowing top→bottom + outcome
    | "checklist_outcome"   // Checkbox items stroke in, outcome bursts
    | "timeline_growth"     // Horizontal line + milestone dots
    | "notification_slam"   // Notification banners slam from top
    | "percent_fill_circle" // SVG circle fills to percentage
    | "terminal_typing"     // Dark card, monospace text types char by char
    | "message_showdown"    // Two chat bubbles alternate left/right
    | "popup_checklist"     // Modal card drops in, items self-check
    // ── Premium Tier types ────────────────────────────────────────────────
    | "spotlight_reveal"    // Cinematic text reveal from darkness
    | "shockwave_counter"  // Giant number with shockwave ring effect
    | "split_transform"    // Diagonal before/after split with tension
    | "card_stack_build"   // 3D card stack building up
    | "urgency_clock"      // Ticking countdown with urgency
    | "analytics_dashboard" // Multi-metric dashboard build
    | "workflow_pipeline"  // Connected nodes with flowing data
    | "text_slam"          // Word slams in at massive scale
    // ── Particle & 3D types ───────────────────────────────────────────────
    | "particle_atmosphere" // Ambient floating particles behind text
    | "particle_burst"     // Impact moment with particle explosion
    | "particle_vortex"    // Particles spiral inward, text reveals
    | "scene_3d_cards"     // Floating 3D cards in perspective
    | "scene_3d_sphere"    // Glowing sphere with orbiting elements
    | "scene_3d_morph"     // Morphing geometric shape
    // ── Cinematic (AI-generated backgrounds) ──────────────────────────
    | "cinematic_chaos"    // Full-screen chaos bg + animated overlays
    | "cinematic_split"    // Full-screen split bg + order vs chaos
    | "cinematic_converge"  // Full-screen shield bg + vortex particles
    // ── Creative UI mockups ───────────────────────────────────────────
    | "ui_search_bar"      // Spotlight/Safari search typing a query
    | "ui_browser_tabs"    // Chrome tabs multiplying (chaos/overwhelm)
    | "ui_imessage"        // iMessage conversation typing itself
    | "ui_checklist_app"   // Todo/Reminders app with items checking off
    // ── Visual Engine scenes ──────────────────────────────────────────
    | "ui_instagram_post"  // IG post with live engagement counters
    | "ui_screen_time"     // iOS Screen Time report
    | "visual_scale"       // Tipping balance scale
    | "visual_streak"      // Daily streak counter with flame
    // ── Creative Pack 2 ───────────────────────────────────────────────
    | "ui_phone_lockscreen" // iOS lock screen with notifications stacking
    | "ui_notes_app"        // Apple Notes typing in real time
    | "ui_analytics_graph"  // Google Analytics dashboard with climbing chart
    // ── Creative Pack 3 ───────────────────────────────────────────────
    | "ui_voice_memo"       // iPhone Voice Memo with live waveform
    | "ui_email_inbox"      // Gmail inbox flooding with leads/messages
    | "visual_rocket"       // Rocket launching with countdown + exhaust
    | "visual_domino"       // Chain reaction — dominoes falling in sequence
    // ── Pack 4: Tech / AI ─────────────────────────────────────────────
    | "ui_chatgpt_chat"
    | "ui_safari_url_bar"
    | "ui_terminal_command"
    | "ui_app_store_install"
    | "ui_settings_toggle"
    // ── Pack 5: Money / Sales ─────────────────────────────────────────
    | "ui_stripe_dashboard"
    | "ui_apple_pay"
    | "ui_calculator_money"
    | "visual_cash_register"
    | "visual_money_counter"
    // ── Pack 6: Audience / Social Proof ───────────────────────────────
    | "ui_follower_counter"
    | "ui_live_viewers"
    | "ui_review_stack"
    | "ui_testimonial_card"
    | "visual_crowd_gather"
    | "visual_ripple_effect"
    | "visual_rating_stars"
    // ── Pack 7: Apple Ecosystem ────────────────────────────────────────
    | "ui_finder_files"
    | "ui_imovie_timeline"
    | "ui_zoom_meeting"
    | "ui_apple_watch_rings"
    | "ui_calendar_fill"
    // ── Pack 8: Education / Drama ─────────────────────────────────────
    | "ui_whiteboard"
    | "ui_keynote_slide"
    | "visual_diagram_build"
    | "visual_stop_sign"
    | "ui_system_alert"
    // ── Pack 9: Time / Metaphors ──────────────────────────────────────
    | "visual_hourglass"
    | "visual_spotlight_isolate"
    | "visual_thumbs_up_burst"
    | "visual_puzzle_complete"
    | "visual_door_open"
    // ── Journey types (JATHO §4.2 — long takeovers, 2026-08-09) ──────
    | "screen_journey"     // guided multi-screen tour, receipt per step
    | "blueprint_map"      // one tall vertical how-it-works canvas
    | "twin_phones_funnel" // mirrored phones, draining/gaining counters
    // ── User-uploaded photo (image_agent) ─────────────────────────────
    | "user_image"          // Photo the user attached on the upload screen,
                            // placed by image_agent based on its content +
                            // the user's own description. Renders via
                            // Ken Burns + caption overlay so a single
                            // photo still feels alive.
    // ── User-uploaded video clip ──────────────────────────────────────
    | "user_video";         // Video clip the user attached — the video twin
                            // of user_image. Same card/fullscreen displays
                            // and effects; plays the real clip via
                            // OffthreadVideo (muted unless play_audio).
  start: number;
  end: number;
  title?: string;
  items?: BRollItem[];
  primary?: string;
  secondary?: string;
  accent_color?: string;
  icon?: string;         // top-level icon for stat_counter / key_point
  suffix?: string;       // for stat_counter e.g. "%", "x", "+"
  label?: string;        // for stat_counter
  // ── Concept Library fields ────────────────────────────────────────────────
  outcome?: string;      // checklist_outcome, funnel_build: final result text
  outcome_icon?: string; // lucide icon name for outcome
  percentage?: number;   // percent_fill_circle: 0-100
  lines?: string[];      // terminal_typing: lines to type
  prompt?: string;       // terminal_typing: prefix e.g. "$ "
  left_bubble?: string;  // message_showdown: left side message
  right_bubble?: string; // message_showdown: right side message
  bars?: {               // graph_spike: explicit bar data
    value: number;
    label?: string;
    highlight?: boolean;
  }[];
  milestones?: {         // timeline_growth: each milestone dot
    label: string;
    date?: string;
    icon?: string;
  }[];
  notifications?: {      // notification_slam: each banner
    app: string;
    text: string;
    count?: string;
  }[];
  // ── Premium Tier fields ─────────────────────────────────────────────────
  countdown_from?: number; // urgency_clock: starting number
  left_label?: string;     // split_transform: left side label
  right_label?: string;    // split_transform: right side label
  bg?: string;             // background preset: dark|deep|warm|cool|spotlight|gradient-brand
  bg_image?: string;       // staticFile path for AI-generated background e.g. "bg/bg_chaos.png"
  // ── user_image fields ────────────────────────────────────────────────
  image_url?: string;      // user_image: absolute URL of the uploaded photo
  description?: string;    // user_image: the Hebrew note the user typed for it
  caption?: string;        // user_image: vision-derived one-line caption
  display?: "card" | "fullscreen";           // user_image: absent -> "fullscreen" (legacy plans)
  card_size?: "small" | "medium" | "large";  // user_image: card width 378/594/810; absent -> "medium"
  screen_position?: "top" | "center";        // user_image: card placement; absent -> "top"
  effect?: "pop" | "slide" | "fade" | "cut"; // user_image: entrance/exit; absent -> "fade"
  show_caption?: boolean;                    // user_image: absent -> true
  // ── user_video fields (shares description / caption / display /
  //    card_size / screen_position / effect / show_caption with
  //    user_image above; same absent-value defaults) ──────────────────
  video_url?: string;      // user_video: absolute URL of the uploaded clip
  play_audio?: boolean;    // user_video: absent/false -> muted (B-roll convention)
  clip_duration?: number;  // user_video: real seconds of the clip (planner
                           // guarantees scene length <= this)
  clip_width?: number;     // user_video: from ffprobe — card aspect math
  clip_height?: number;    // user_video: from ffprobe — card aspect math
}

// ── Icon helper ────────────────────────────────────────────────────────────────

function LucideIcon({
  name,
  size = 48,
  color = "#FFFFFF",
  strokeWidth = 2,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  // Check brand icons first (Instagram, TikTok, YouTube, etc.)
  const BrandIcon = getBrandIcon(name);
  if (BrandIcon) return <BrandIcon size={size} color={color} />;
  // Fall back to lucide-react
  const Icon = (Icons as Record<string, any>)[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

// ── Color helper ───────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : "224,112,30";
}

/**
 * Background fade for a B-Roll scene. Fades IN over the first `fadeInEnd`
 * frames, holds at full, then fades OUT.
 *
 * The fade-out is intentionally LONGER + EARLIER than the old hard 8-frame
 * (0.27s) tail. The user reported B-Roll sitting full-screen ~1.5s after
 * the content animation had already settled, then snapping off. A ~22-frame
 * (~0.75s @30fps) fade that starts earlier makes the scene clear gracefully
 * instead of lingering static then cutting. The fade-out length is clamped
 * to never exceed 40% of the scene and never start before the fade-in
 * finished — so very short scenes (min Sequence duration = 1s) still produce
 * a monotonically-increasing keyframe list that `interpolate` accepts.
 */
function brollBgOpacity(
  frame: number,
  durationFrames: number,
  fadeInEnd: number = 10,
): number {
  const fadeOutLen = Math.min(22, Math.floor(durationFrames * 0.4));
  const fadeOutStart = Math.max(fadeInEnd + 1, durationFrames - fadeOutLen);
  return interpolate(
    frame,
    [0, fadeInEnd, fadeOutStart, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
}

// ── Shared background ─────────────────────────────────────────────────────────

const BRollBg: React.FC<{ opacity: number }> = ({ opacity }) => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(160deg, rgba(8,8,18,0.88) 0%, rgba(0,0,0,0.94) 100%)",
      opacity,
    }}
  />
);

// ── Shared title pill ─────────────────────────────────────────────────────────

/**
 * TitlePill — the name survives (23 call sites), the pill is DEAD.
 *
 * Owner, 2026-08-08, after the first reference-grade rebuild: "אני לא אוהב
 * את הריבועים האלה, תפטר מהם בכל סוגי העריכה, ותעשה כותרות מושכות." The
 * reference reels (benla.vi / devinjatho — see ../design/BROLL_STYLE_SPEC.md
 * Part 4) never box their type either: text is BIG, free-floating, with
 * size/color hierarchy and glow doing the work a box used to fake.
 *
 * New treatment: 72px Heebo 900 white, the single most meaningful word
 * (a number if present, else the longest word) in the brand accent with a
 * glow halo, a soft dark text-shadow for legibility on any stage, and a
 * 3-frame directional-blur entrance streak instead of a slide.
 */
const TitlePill: React.FC<{ title: string; brandColor: string; top?: number }> = ({
  title,
  brandColor,
  top = 200,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const entranceBlur = interpolate(frame, [0, 8], [14, 0], { extrapolateRight: "clamp" });
  const rgb = hexToRgb(brandColor);

  // Pick ONE accent word: prefer a token containing a digit, else the longest.
  const words = title.split(/\s+/).filter(Boolean);
  let accentIdx = words.findIndex((w) => /\d/.test(w));
  if (accentIdx < 0 && words.length > 1) {
    accentIdx = words.reduce((best, w, i) => (w.length > words[best].length ? i : best), 0);
  }

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 50,
        right: 50,
        textAlign: "center",
        direction: "rtl",
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [-24, 0])}px)`,
        filter: entranceBlur > 0.5 ? `blur(${entranceBlur * 0.4}px)` : undefined,
        fontFamily: "'Heebo', sans-serif",
        fontWeight: 900,
        fontSize: 72,
        lineHeight: 1.15,
        color: "#FFFFFF",
        textShadow: "0 4px 30px rgba(0,0,0,0.85), 0 1px 6px rgba(0,0,0,0.6)",
        letterSpacing: "-0.01em",
      }}
    >
      {words.map((w, i) => (
        <React.Fragment key={i}>
          {i > 0 ? " " : ""}
          {i === accentIdx ? (
            <span
              style={{
                color: brandColor,
                textShadow: `0 0 24px rgba(${rgb},0.55), 0 0 60px rgba(${rgb},0.25), 0 4px 30px rgba(0,0,0,0.85)`,
              }}
            >
              {w}
            </span>
          ) : (
            w
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 1. STAT COUNTER — Hero number counts up + icon + label
// ══════════════════════════════════════════════════════════════════════════════

const StatCounterBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = brollBgOpacity(frame, durationFrames);

  // Count-up spring — ROBUST number extraction (2026-08-09, owner's NaN
  // screenshot): the designer sometimes puts TEXT in primary ("זמן צפייה").
  // A counter may NEVER render NaN: digits → animated comma-grouped
  // count-up; no digits → the text itself becomes the hero (no counting).
  const numMatch = /[\d][\d,.]*/.exec(scene.primary || "");
  const targetNum = numMatch ? parseFloat(numMatch[0].replace(/,/g, "")) : NaN;
  const hasNumber = Number.isFinite(targetNum);
  const countProgress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 80, mass: 1.2 },
  });
  const currentNum = hasNumber ? Math.round(targetNum * Math.min(countProgress, 1)) : 0;
  const numberText = hasNumber
    ? (targetNum >= 1000 ? currentNum.toLocaleString("en-US") : String(currentNum))
    : (scene.primary || "").trim();
  const heroIsHebrewText = !hasNumber && /[֐-׿]/.test(numberText);

  // Icon bounce
  const iconScale = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 10, stiffness: 200 },
  });

  // Label fade
  const labelOpacity = interpolate(frame, [18, 30], [0, 1], { extrapolateRight: "clamp" });
  const labelY = interpolate(frame, [18, 30], [20, 0], { extrapolateRight: "clamp" });

  const rgb = hexToRgb(brandColor);

  return (
    <AbsoluteFill>
      <BRollBg opacity={bgOpacity} />

      {/* Glow ring */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 340,
          height: 340,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${rgb},0.22) 0%, transparent 70%)`,
          transform: "translate(-50%, -55%)",
          opacity: bgOpacity,
        }}
      />

      {/* Icon */}
      {scene.icon && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -210%) scale(${iconScale})`,
            background: `rgba(${rgb}, 0.22)`,
            borderRadius: "50%",
            padding: 28,
            border: `3px solid rgba(${rgb}, 0.5)`,
          }}
        >
          <LucideIcon name={scene.icon} size={72} color={brandColor} strokeWidth={1.8} />
        </div>
      )}

      {/* Big number */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          textAlign: "center",
          transform: hasNumber
            ? "translateY(-50%)"
            : `translateY(-50%) scale(${0.9 + 0.1 * Math.min(countProgress, 1)})`,
          fontFamily: "'Heebo', sans-serif",
          fontWeight: 900,
          fontSize: hasNumber ? 200 : 110,
          color: "#FFFFFF",
          lineHeight: 1.1,
          opacity: bgOpacity,
          direction: heroIsHebrewText ? "rtl" : "ltr",
          padding: hasNumber ? 0 : "0 60px",
        }}
      >
        {numberText}
        {hasNumber && scene.suffix && (
          <span style={{ fontSize: 100, color: brandColor }}>{scene.suffix}</span>
        )}
      </div>

      {/* Label */}
      {scene.label && (
        <div
          style={{
            position: "absolute",
            bottom: "38%",
            left: 60,
            right: 60,
            textAlign: "center",
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: 52,
            color: "rgba(255,255,255,0.85)",
            direction: "rtl",
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
          }}
        >
          {scene.label}
        </div>
      )}

      {/* Title pill */}
      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={160} />}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 2. ICON LIST — 2-3 items with animated lucide icons, staggered entry
// ══════════════════════════════════════════════════════════════════════════════

const IconListBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = scene.items || [];

  const bgOpacity = brollBgOpacity(frame, durationFrames);

  const rgb = hexToRgb(brandColor);
  const STAGGER = 14; // frames between items

  return (
    <AbsoluteFill>
      <BRollBg opacity={bgOpacity} />

      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={170} />}

      {/* Items */}
      <div
        style={{
          position: "absolute",
          top: scene.title ? 350 : 220,
          bottom: 500,
          left: 48,
          right: 48,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 32,
        }}
      >
        {items.map((item, idx) => {
          const delay = idx * STAGGER + 6;
          const itemProgress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 14, stiffness: 200 },
          });
          const iconBounce = spring({
            frame: Math.max(0, frame - delay - 4),
            fps,
            config: { damping: 8, stiffness: 280 },
          });

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 28,
                opacity: itemProgress,
                transform: `translateX(${interpolate(itemProgress, [0, 1], [80, 0])}px)`,
                background: `rgba(${rgb}, 0.12)`,
                borderRadius: 24,
                padding: "22px 28px",
                borderRight: `5px solid ${brandColor}`,
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  background: brandColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: `scale(${iconBounce})`,
                  boxShadow: `0 0 24px rgba(${rgb},0.45)`,
                }}
              >
                {item.icon ? (
                  <LucideIcon name={item.icon} size={44} color="#FFF" strokeWidth={2} />
                ) : (
                  <span style={{ fontSize: 40 }}>{item.emoji || ""}</span>
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, direction: "rtl" }}>
                <div
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 800,
                    fontSize: 44,
                    color: "#FFFFFF",
                    lineHeight: 1.25,
                  }}
                >
                  {item.text}
                </div>
                {item.sub_text && (
                  <div
                    style={{
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: 400,
                      fontSize: 30,
                      color: `rgba(${rgb},0.9)`,
                      marginTop: 4,
                    }}
                  >
                    {item.sub_text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 3. FLOW — 2-3 connected boxes with animated arrows between them
// ══════════════════════════════════════════════════════════════════════════════

const FlowBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const steps = scene.items || [];

  const bgOpacity = brollBgOpacity(frame, durationFrames);

  const rgb = hexToRgb(brandColor);
  const STEP_DELAY = 16;

  return (
    <AbsoluteFill>
      <BRollBg opacity={bgOpacity} />

      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={160} />}

      {/* Flow boxes — vertical stack with arrows */}
      <div
        style={{
          position: "absolute",
          top: scene.title ? 350 : 220,
          bottom: 480,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {steps.map((step, idx) => {
          const delay = idx * STEP_DELAY + 4;
          const boxProgress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 14, stiffness: 220 },
          });
          const arrowProgress = spring({
            frame: Math.max(0, frame - delay - 6),
            fps,
            config: { damping: 16, stiffness: 180 },
          });

          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={idx}>
              {/* Box */}
              <div
                style={{
                  width: "100%",
                  background: idx === 0
                    ? brandColor
                    : `rgba(${rgb}, ${0.15 + idx * 0.08})`,
                  borderRadius: 20,
                  padding: "28px 36px",
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  flexDirection: "row-reverse",
                  border: idx !== 0 ? `2px solid rgba(${rgb},0.4)` : "none",
                  transform: `scale(${boxProgress}) translateX(${interpolate(boxProgress,[0,1],[idx%2===0?-40:40,0])}px)`,
                  opacity: boxProgress,
                  transformOrigin: "center",
                }}
              >
                {/* Icon */}
                {step.icon && (
                  <div
                    style={{
                      background: idx === 0 ? "rgba(0,0,0,0.25)" : brandColor,
                      borderRadius: "50%",
                      width: 64,
                      height: 64,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <LucideIcon
                      name={step.icon}
                      size={36}
                      color="#FFF"
                      strokeWidth={2}
                    />
                  </div>
                )}
                <div style={{ flex: 1, direction: "rtl" }}>
                  <div
                    style={{
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: 800,
                      fontSize: 42,
                      color: "#FFFFFF",
                    }}
                  >
                    {step.text}
                  </div>
                  {step.sub_text && (
                    <div
                      style={{
                        fontFamily: "'Heebo', sans-serif",
                        fontWeight: 400,
                        fontSize: 28,
                        color: "rgba(255,255,255,0.7)",
                        marginTop: 4,
                      }}
                    >
                      {step.sub_text}
                    </div>
                  )}
                </div>
              </div>

              {/* Arrow between boxes */}
              {!isLast && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 52,
                    opacity: arrowProgress,
                    transform: `scaleY(${arrowProgress})`,
                    transformOrigin: "top center",
                  }}
                >
                  <svg width="48" height="52" viewBox="0 0 48 52">
                    <line
                      x1="24" y1="0" x2="24" y2="36"
                      stroke={brandColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <polygon
                      points="12,30 24,48 36,30"
                      fill={brandColor}
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 4. QUOTE HERO — Dramatic quote with animated underline + icon
// ══════════════════════════════════════════════════════════════════════════════

const QuoteHeroBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = brollBgOpacity(frame, durationFrames);

  const quoteMarkScale = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 10, stiffness: 180 },
  });

  const textScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 14, stiffness: 150 },
  });

  // Underline draws in
  const underlineWidth = interpolate(frame, [20, 38], [0, 100], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const rgb = hexToRgb(brandColor);

  return (
    <AbsoluteFill>
      <BRollBg opacity={bgOpacity} />

      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: "50%",
          width: 500,
          height: 400,
          background: `radial-gradient(ellipse, rgba(${rgb},0.18) 0%, transparent 70%)`,
          transform: "translate(-50%, -50%)",
          opacity: bgOpacity,
        }}
      />

      {/* Quote mark */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: `translate(-50%, 0) scale(${quoteMarkScale})`,
          fontFamily: "Georgia, serif",
          fontSize: 140,
          color: brandColor,
          lineHeight: 1,
          opacity: bgOpacity * 0.6,
        }}
      >
        "
      </div>

      {/* Main text */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: 60,
          right: 60,
          textAlign: "center",
          transform: `scale(${textScale})`,
          transformOrigin: "center",
          opacity: bgOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 68,
            color: "#FFFFFF",
            direction: "rtl",
            lineHeight: 1.3,
          }}
        >
          {scene.primary}
        </div>

        {/* Animated underline */}
        <div
          style={{
            height: 5,
            background: brandColor,
            marginTop: 20,
            marginLeft: "auto",
            marginRight: "auto",
            borderRadius: 3,
            width: `${underlineWidth}%`,
            boxShadow: `0 0 16px rgba(${rgb},0.7)`,
          }}
        />

        {/* Secondary label */}
        {scene.secondary && (
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 500,
              fontSize: 36,
              color: `rgba(${rgb},0.9)`,
              marginTop: 20,
              direction: "rtl",
              opacity: interpolate(frame, [30, 42], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            — {scene.secondary}
          </div>
        )}
      </div>

      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={120} />}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 5. PROGRESS — Animated progress bars with label + percentage
// ══════════════════════════════════════════════════════════════════════════════

const ProgressBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = scene.items || [];

  const bgOpacity = brollBgOpacity(frame, durationFrames);

  const rgb = hexToRgb(brandColor);
  const STAGGER = 14;

  return (
    <AbsoluteFill>
      <BRollBg opacity={bgOpacity} />

      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={170} />}

      <div
        style={{
          position: "absolute",
          top: scene.title ? 370 : 240,
          bottom: 500,
          left: 64,
          right: 64,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 52,
        }}
      >
        {items.map((item, idx) => {
          const delay = idx * STAGGER + 6;
          const pct = Math.min(100, Math.max(0, parseFloat(item.value || "75")));

          const barProgress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 18, stiffness: 90 },
          });

          const labelOpacity = interpolate(frame, [delay, delay + 10], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });

          const currentPct = Math.round(pct * Math.min(barProgress, 1));

          return (
            <div key={idx} style={{ opacity: labelOpacity }}>
              {/* Label + percentage */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                  direction: "rtl",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {item.icon && (
                    <LucideIcon name={item.icon} size={36} color={brandColor} strokeWidth={2} />
                  )}
                  <span
                    style={{
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: 700,
                      fontSize: 42,
                      color: "#FFFFFF",
                    }}
                  >
                    {item.text}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 900,
                    fontSize: 48,
                    color: brandColor,
                  }}
                >
                  {currentPct}%
                </span>
              </div>

              {/* Bar track */}
              <div
                style={{
                  height: 24,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {/* Bar fill */}
                <div
                  style={{
                    height: "100%",
                    width: `${pct * Math.min(barProgress, 1)}%`,
                    background: `linear-gradient(90deg, ${brandColor}, rgba(${rgb},0.7))`,
                    borderRadius: 12,
                    boxShadow: `0 0 16px rgba(${rgb},0.5)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 6. KEY POINT — Single big text HERO (enhanced with icon)
// ══════════════════════════════════════════════════════════════════════════════

const KeyPointBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = brollBgOpacity(frame, durationFrames);

  const iconScale = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 10, stiffness: 220 },
  });

  const textScale = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  const barWidth = interpolate(frame, [14, 28], [0, 100], { extrapolateRight: "clamp" });

  const rgb = hexToRgb(brandColor);

  return (
    <AbsoluteFill>
      <BRollBg opacity={bgOpacity} />

      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "50%",
          width: 600,
          height: 500,
          background: `radial-gradient(ellipse, rgba(${rgb},0.20) 0%, transparent 65%)`,
          transform: "translate(-50%, -50%)",
          opacity: bgOpacity,
        }}
      />

      {/* Icon above text */}
      {scene.icon && (
        <div
          style={{
            position: "absolute",
            top: "28%",
            left: "50%",
            transform: `translate(-50%, 0) scale(${iconScale})`,
            background: brandColor,
            borderRadius: "50%",
            padding: 26,
            boxShadow: `0 0 40px rgba(${rgb},0.5)`,
          }}
        >
          <LucideIcon name={scene.icon} size={72} color="#FFF" strokeWidth={1.8} />
        </div>
      )}

      {/* Main text */}
      <div
        style={{
          position: "absolute",
          top: scene.icon ? "52%" : "44%",
          left: 60,
          right: 60,
          textAlign: "center",
          transform: `translateY(-50%) scale(${textScale})`,
          transformOrigin: "center",
          opacity: bgOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 72,
            color: "#FFFFFF",
            direction: "rtl",
            lineHeight: 1.25,
          }}
        >
          {scene.primary}
        </div>

        {/* Animated brand underline */}
        <div
          style={{
            height: 5,
            background: brandColor,
            marginTop: 18,
            marginLeft: "auto",
            marginRight: "auto",
            borderRadius: 3,
            width: `${barWidth}%`,
            boxShadow: `0 0 14px rgba(${rgb},0.6)`,
          }}
        />
      </div>

      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={130} />}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 7. COMPARISON — Two panels side by side with icons
// ══════════════════════════════════════════════════════════════════════════════

const ComparisonBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = brollBgOpacity(frame, durationFrames);

  const leftProgress = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 14, stiffness: 180 } });
  const rightProgress = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 14, stiffness: 180 } });
  const dividerScale = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 16, stiffness: 200 } });

  return (
    <AbsoluteFill>
      <BRollBg opacity={bgOpacity} />

      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={160} />}

      {/* Two panels */}
      <div
        style={{
          position: "absolute",
          top: scene.title ? 360 : 220,
          bottom: 460,
          left: 40,
          right: 40,
          display: "flex",
          flexDirection: "row",
          gap: 0,
          alignItems: "stretch",
        }}
      >
        {/* Left:  Bad */}
        <div
          style={{
            flex: 1,
            background: "rgba(239,68,68,0.15)",
            borderRadius: "20px 0 0 20px",
            border: "2px solid rgba(239,68,68,0.4)",
            borderRight: "none",
            padding: "36px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            opacity: leftProgress,
            transform: `translateX(${interpolate(leftProgress, [0, 1], [-60, 0])}px)`,
          }}
        >
          <div style={{ fontSize: 72 }}>●</div>
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 800,
              fontSize: 40,
              color: "rgba(255,255,255,0.9)",
              direction: "rtl",
              textAlign: "center",
            }}
          >
            {scene.secondary}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 4,
            background: "rgba(255,255,255,0.15)",
            transform: `scaleY(${dividerScale})`,
            transformOrigin: "center",
            alignSelf: "stretch",
          }}
        />

        {/* Right:  Good */}
        <div
          style={{
            flex: 1,
            background: `rgba(${hexToRgb(brandColor)},0.18)`,
            borderRadius: "0 20px 20px 0",
            border: `2px solid rgba(${hexToRgb(brandColor)},0.5)`,
            borderLeft: "none",
            padding: "36px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            opacity: rightProgress,
            transform: `translateX(${interpolate(rightProgress, [0, 1], [60, 0])}px)`,
          }}
        >
          <div style={{ fontSize: 72 }}>●</div>
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 800,
              fontSize: 40,
              color: "#FFFFFF",
              direction: "rtl",
              textAlign: "center",
            }}
          >
            {scene.primary}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 8. LIST HIGHLIGHT — all visible, pops on highlight_at
// ══════════════════════════════════════════════════════════════════════════════

const ListHighlightBRoll: React.FC<{
  items: BRollItem[];
  title?: string;
  brandColor: string;
  sceneDuration: number;
}> = ({ items, title, brandColor, sceneDuration }) => {
  // REFERENCE GRADE (BROLL_STYLE_SPEC.md §2.5) — the old version showed every
  // row equally: nothing was focal. This is spotlight-dim: when a row's
  // highlight beat arrives, EVERYTHING else drops to 40% brightness + blur,
  // the active row comes forward with shadow and an orange wipe-strip, and
  // the camera micro-punches to center it. One state change per highlight
  // beat (LAW 7). Same props, no emoji internals (LAW 5).
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const durationFrames = Math.max(1, Math.round(sceneDuration * fps));

  const rows = items.slice(0, 5);
  const n = Math.max(1, rows.length);

  // Highlight schedule: honor highlight_at when present, else spread evenly
  // after the entrance.
  const beatAt = (k: number) => {
    const h = rows[k]?.highlight_at;
    if (typeof h === "number" && h >= 0) return Math.round(h * fps);
    return 20 + Math.round(((k + 0.5) / n) * (durationFrames - 40));
  };
  let activeIdx = -1;
  for (let k = 0; k < n; k++) if (frame >= beatAt(k)) activeIdx = k;

  // Layout: rows fill 84% width, ~150px tall, list occupies ~60% of height.
  const LIST_W = 907;
  const ROW_H = 150;
  const GAP = 26;
  const listTop = 620;
  const rowY = (k: number) => listTop + k * (ROW_H + GAP);

  // Camera micro-punch centering the active row.
  const poses: CameraPose[] = [{ frame: 0, x: 0, y: 0, scale: 1 }];
  for (let k = 0; k < n; k++) {
    const b = beatAt(k);
    poses.push({ frame: Math.max(1, b - 8), x: 0, y: poses[poses.length - 1].y, scale: 1.0 });
    poses.push({ frame: b, x: 0, y: 864 - (rowY(k) + ROW_H / 2) * 1.05, scale: 1.05 });
  }

  return (
    <SceneStage accent={brandColor} seed={11}>
      <CameraRig poses={poses} settleDrift={false}>
        {title && <TitlePill title={title} brandColor={brandColor} top={300} />}

        {rows.map((item, k) => {
          const b = beatAt(k);
          const isActive = k === activeIdx;
          const entrance = spring({ frame: Math.max(0, frame - 4 - k * 4), fps, config: { stiffness: 200, damping: 20 } });
          const dimT = interpolate(frame, [b, b + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const anyActive = activeIdx >= 0;
          const dimmed = anyActive && !isActive;
          const pop = spring({ frame: Math.max(0, frame - b), fps, config: { stiffness: 260, damping: 13 } });
          // Wipe strip: white bar sweeps in 5 frames, resolves into an orange strip.
          const wipeT = interpolate(frame, [b, b + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const stripOpacity = interpolate(frame, [b + 5, b + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: (1080 - LIST_W) / 2,
                top: rowY(k),
                width: LIST_W,
                height: ROW_H,
                borderRadius: 22,
                background: isActive ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: isActive
                  ? `inset 0 1px 0 rgba(255,255,255,0.22), 0 30px 70px rgba(0,0,0,0.6), 0 0 0 2px rgba(${rgb},0.7), 0 0 40px rgba(${rgb},0.25)`
                  : "inset 0 1px 0 rgba(255,255,255,0.12)",
                opacity: entrance,
                transform: `translateY(${(1 - entrance) * 28}px) scale(${isActive ? 1 + pop * 0.1 : 1})`,
                filter: dimmed ? `brightness(0.4) blur(3px)` : "none",
                transition: "none",
                display: "flex",
                alignItems: "center",
                gap: 28,
                padding: "0 36px",
                direction: "rtl",
                overflow: "hidden",
              }}
            >
              {/* index chip — number, not emoji */}
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 20,
                  flexShrink: 0,
                  background: isActive ? `rgba(${rgb},0.2)` : "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Heebo', sans-serif",
                  fontWeight: 900,
                  fontSize: 36,
                  color: isActive ? brandColor : "rgba(255,255,255,0.6)",
                }}
              >
                {k + 1}
              </div>

              <div style={{ minWidth: 0, position: "relative", flex: 1 }}>
                {/* orange strip behind the key text (resolves after the wipe) */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8%",
                      right: -8,
                      height: "84%",
                      width: "60%",
                      borderRadius: 8,
                      background: `rgba(${rgb},${0.22 * stripOpacity})`,
                    }}
                  />
                )}
                {/* white wipe bar */}
                {isActive && wipeT < 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: `${wipeT * 100}%`,
                      width: 60,
                      height: "100%",
                      background: "rgba(255,255,255,0.5)",
                      filter: "blur(8px)",
                    }}
                  />
                )}
                <div
                  style={{
                    position: "relative",
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 800,
                    fontSize: 56,
                    lineHeight: 1.15,
                    color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.75)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.text}
                </div>
                {item.sub_text && (
                  <div
                    style={{
                      position: "relative",
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: 600,
                      fontSize: 32,
                      color: "rgba(255,255,255,0.5)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.sub_text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CameraRig>
    </SceneStage>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 9. LIST — items reveal one by one
// ══════════════════════════════════════════════════════════════════════════════

const ListBRoll: React.FC<{
  items: BRollItem[];
  title?: string;
  brandColor: string;
  sceneDuration: number;
}> = ({ items, title, brandColor, sceneDuration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 10, sceneDuration - 10, sceneDuration], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const rgb = hexToRgb(brandColor);
  const showCount = Math.min(
    items.length,
    Math.ceil(interpolate(frame, [8, sceneDuration - 16], [0, items.length + 0.99], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }))
  );

  return (
    <AbsoluteFill>
      <BRollBg opacity={bgOpacity} />
      {title && <TitlePill title={title} brandColor={brandColor} top={170} />}

      <div
        style={{
          position: "absolute",
          top: title ? 340 : 200,
          bottom: 500,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 26,
          opacity: bgOpacity,
        }}
      >
        {items.slice(0, showCount).map((item, idx) => {
          const delay = Math.round((idx / Math.max(1, items.length)) * (sceneDuration - 24)) + 8;
          const itemProg = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 200 } });

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 20,
                opacity: itemProg,
                transform: `translateX(${interpolate(itemProg, [0, 1], [50, 0])}px)`,
                background: `rgba(${rgb},0.12)`,
                borderRadius: 20,
                padding: "20px 28px",
                borderRight: `5px solid ${brandColor}`,
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background: brandColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon ? (
                  <LucideIcon name={item.icon} size={36} color="#FFF" />
                ) : (
                  <span style={{ fontSize: 36 }}>{item.emoji || `${idx + 1}`}</span>
                )}
              </div>
              <div style={{ flex: 1, direction: "rtl" }}>
                <div style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 44, color: "#FFF", lineHeight: 1.25 }}>
                  {item.text}
                </div>
                {item.sub_text && (
                  <div style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 400, fontSize: 28, color: `rgba(${rgb},0.85)`, marginTop: 4 }}>
                    {item.sub_text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 10. STEPS — Numbered circles
// ══════════════════════════════════════════════════════════════════════════════

const StepsBRoll: React.FC<{
  items: BRollItem[];
  title?: string;
  brandColor: string;
  sceneDuration: number;
}> = ({ items, title, brandColor, sceneDuration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 10, sceneDuration - 10, sceneDuration], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const rgb = hexToRgb(brandColor);

  return (
    <AbsoluteFill>
      <BRollBg opacity={bgOpacity} />
      {title && <TitlePill title={title} brandColor={brandColor} top={170} />}

      <div
        style={{
          position: "absolute",
          top: title ? 340 : 200,
          bottom: 500,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 26,
          opacity: bgOpacity,
        }}
      >
        {items.map((item, idx) => {
          const delay = idx * 12 + 6;
          const p = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 220 } });

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 24,
                opacity: p,
                transform: `translateX(${interpolate(p, [0, 1], [60, 0])}px)`,
              }}
            >
              {/* Step circle */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: brandColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 0 20px rgba(${rgb},0.5)`,
                }}
              >
                {item.icon ? (
                  <LucideIcon name={item.icon} size={38} color="#FFF" />
                ) : (
                  <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 38, color: "#FFF" }}>
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Connector line (except last) */}
              <div style={{ flex: 1, direction: "rtl" }}>
                <div style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 44, color: "#FFF", lineHeight: 1.25 }}>
                  {item.text}
                </div>
                {item.sub_text && (
                  <div style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 400, fontSize: 28, color: `rgba(${rgb},0.85)`, marginTop: 4 }}>
                    {item.sub_text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// USER IMAGE — photo the user attached on the upload screen, placed by
// image_agent on the timeline based on what's in it + what they typed.
// Two display modes (image_agent resolves "auto" before emitting — no
// "auto" values ever reach render time):
//   fullscreen — full-bleed Ken-Burns hero with a soft caption ribbon at
//                the bottom. Original behavior, and the default for legacy
//                plans persisted before the display field existed.
//   card       — floating framed card over the A-roll (378/594/810 wide),
//                brand-colored border + glow, caption pill underneath.
// Entrance/exit effects: pop / slide / fade / cut, exits mirrored.
// ══════════════════════════════════════════════════════════════════════════════

const USER_IMAGE_CARD_WIDTHS: Record<"small" | "medium" | "large", number> = {
  small: 378,
  medium: 594,
  large: 810,
};

const UserImageBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const url = scene.image_url || "";

  // Backward-compatible resolution: plans persisted before these fields
  // existed carry none of them and must render EXACTLY as before —
  // fullscreen Ken Burns, 0.4s fades, caption shown.
  const display: "card" | "fullscreen" =
    scene.display === "card" ? "card" : "fullscreen";
  const effect: "pop" | "slide" | "fade" | "cut" = scene.effect ?? "fade";
  const showCaption = scene.show_caption !== false;
  const cardSize: "small" | "medium" | "large" =
    scene.card_size === "small" || scene.card_size === "large"
      ? scene.card_size
      : "medium";
  const screenPosition: "top" | "center" =
    scene.screen_position === "center" ? "center" : "top";

  // Caption rule: prefer the user's own note (they know what they wanted
  // to say), fall back to the vision-derived caption, fall back to nothing.
  // Truncation happens upstream in the planner per scene-type budget — a
  // generic 80-char client slice was causing mid-sentence cuts on captions
  // the planner had already shaped to fit. Trust the planner's length.
  // show_caption=false suppresses the caption everywhere.
  const captionText = showCaption
    ? scene.description?.trim() || scene.caption?.trim() || ""
    : "";

  // Caption rises from below on entry, settles into place. spring() gives
  // it a tiny overshoot which reads as "premium" without being distracting.
  // (Fullscreen mode only — card captions animate with the card group.)
  const captionRise = spring({
    frame: frame - Math.round(fps * 0.15),
    fps,
    config: { damping: 18, stiffness: 110, mass: 0.5 },
  });

  if (!url) {
    // Nothing to render if the URL got lost in transit. Returning null
    // lets the existing layer stack continue rather than throwing.
    return null;
  }

  // ── CARD MODE ─────────────────────────────────────────────────────────────
  if (display === "card") {
    const cardWidth = USER_IMAGE_CARD_WIDTHS[cardSize];

    // Entrance over the first ~0.35s, exit mirrored over the last ~0.35s
    // (windows shrink on very short scenes so they never overlap).
    const effectDur = Math.max(
      1,
      Math.min(Math.round(fps * 0.35), Math.floor(durationFrames / 3)),
    );

    let groupOpacity = 1;
    let groupTransform = "none";
    if (effect === "pop") {
      // Back-eased pop — same feel as ProofImage in CampaignAd.
      const backEase = Easing.out(Easing.back(1.4));
      const tIn = interpolate(frame, [0, effectDur], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: backEase,
      });
      const tOut = interpolate(
        frame,
        [durationFrames - effectDur, durationFrames],
        [1, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: backEase,
        },
      );
      const t = Math.min(tIn, tOut);
      groupOpacity = Math.max(0, Math.min(1, t));
      groupTransform = `scale(${(0.85 + 0.15 * t).toFixed(4)})`;
    } else if (effect === "slide") {
      const tIn = interpolate(frame, [0, effectDur], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      const tOut = interpolate(
        frame,
        [durationFrames - effectDur, durationFrames],
        [1, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        },
      );
      const t = Math.min(tIn, tOut);
      groupOpacity = t;
      groupTransform = `translateY(${(60 * (1 - t)).toFixed(2)}px)`;
    } else if (effect === "fade") {
      groupOpacity = interpolate(
        frame,
        [0, effectDur, durationFrames - effectDur, durationFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );
    }
    // "cut": instant on, instant off — opacity stays 1, no transform.

    const cardGroup = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          opacity: groupOpacity,
          transform: groupTransform,
        }}
      >
        <div
          style={{
            borderRadius: 22,
            overflow: "hidden",
            border: `4px solid ${brandColor}`,
            boxShadow: `0 0 30px ${brandColor}66, 0 16px 40px rgba(0,0,0,0.6)`,
            background: "#000",
          }}
        >
          <Img
            src={resolveImageSrc(url)}
            style={{
              width: cardWidth,
              height: "auto",
              maxHeight: 864,
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
        {captionText && (
          <div
            style={{
              maxWidth: "78%",
              padding: "14px 26px",
              borderRadius: 14,
              background: "rgba(10,10,10,0.78)",
              border: `1px solid ${brandColor}55`,
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              color: "#fff",
              fontFamily: "var(--font-he), system-ui",
              fontWeight: 600,
              fontSize: 32,
              textAlign: "center",
              lineHeight: 1.25,
              direction: "rtl",
              backdropFilter: "blur(6px)",
            }}
          >
            {captionText}
          </div>
        )}
      </div>
    );

    if (screenPosition === "center") {
      // The card+caption group as a whole is what gets centered.
      return (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {cardGroup}
        </AbsoluteFill>
      );
    }

    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 210,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {cardGroup}
        </div>
      </AbsoluteFill>
    );
  }

  // ── FULLSCREEN MODE (original Ken-Burns hero) ─────────────────────────────
  // Fullscreen supports only fade/cut at render time. image_agent downgrades
  // pop/slide to fade before emitting; mirror that defensively here in case
  // a stale plan slips through.
  const fsCut = effect === "cut";

  // Pick a direction based on the scene's start time so adjacent user
  // images don't all do the same Ken Burns move.
  const directionIdx = Math.round((scene.start ?? 0) / 5);
  const direction = getKenBurnsDirection(directionIdx);

  // Soft fade in/out at the edges so the cut into and out of the photo
  // feels intentional rather than a hard flash. "cut" skips them entirely.
  const fadeIn = Math.min(fps * 0.4, durationFrames / 4);
  const fadeOut = Math.min(fps * 0.4, durationFrames / 4);
  const opacity = fsCut
    ? 1
    : interpolate(
        frame,
        [0, fadeIn, durationFrames - fadeOut, durationFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );

  const captionTy = fsCut ? 0 : interpolate(captionRise, [0, 1], [40, 0]);
  const captionOp = fsCut ? 1 : interpolate(captionRise, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#000", opacity }}>
      <KenBurns src={url} direction={direction} intensity={0.06} />

      {captionText && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 130,
            display: "flex",
            justifyContent: "center",
            transform: `translateY(${captionTy}px)`,
            opacity: captionOp,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              maxWidth: "78%",
              padding: "14px 26px",
              borderRadius: 14,
              background: "rgba(10,10,10,0.78)",
              border: `1px solid ${brandColor}55`,
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              color: "#fff",
              fontFamily: "var(--font-he), system-ui",
              fontWeight: 600,
              fontSize: 32,
              textAlign: "center",
              lineHeight: 1.25,
              direction: "rtl",
              backdropFilter: "blur(6px)",
            }}
          >
            {captionText}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// USER VIDEO — clip the user attached on the upload screen; the video twin
// of UserImageBRoll with the exact same visual language. Two display modes
// (the planner resolves "auto" before emitting — no "auto" values ever
// reach render time):
//   fullscreen — full-bleed cover video over black. NO Ken Burns (real
//                video already has motion). Fade/cut only at render time;
//                pop/slide downgrade to fade defensively.
//   card       — same floating framed card (378/594/810 wide), brand
//                border + glow, caption pill underneath. Unlike Img,
//                OffthreadVideo doesn't auto-size to its media, so the
//                card height comes from the clip's real aspect ratio
//                (ffprobe dims supplied by the planner).
// Entrance/exit effects: pop / slide / fade / cut, exits mirrored.
// Audio: muted unless play_audio=true (default B-roll convention).
// ══════════════════════════════════════════════════════════════════════════════

const UserVideoBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const url = scene.video_url || "";

  // Same safe defaults as UserImageBRoll so partial/legacy plans render
  // fine: fullscreen, 0.4s fades, caption shown, muted.
  const display: "card" | "fullscreen" =
    scene.display === "card" ? "card" : "fullscreen";
  const effect: "pop" | "slide" | "fade" | "cut" = scene.effect ?? "fade";
  const showCaption = scene.show_caption !== false;
  const cardSize: "small" | "medium" | "large" =
    scene.card_size === "small" || scene.card_size === "large"
      ? scene.card_size
      : "medium";
  const screenPosition: "top" | "center" =
    scene.screen_position === "center" ? "center" : "top";
  const playAudio = scene.play_audio === true;

  // Caption rule identical to user_image: prefer the user's own note,
  // fall back to the vision-derived caption, fall back to nothing.
  // Truncation is the planner's job. show_caption=false suppresses the
  // caption everywhere.
  const captionText = showCaption
    ? scene.description?.trim() || scene.caption?.trim() || ""
    : "";

  // Fullscreen caption rises from below on entry (card captions animate
  // with the card group instead).
  const captionRise = spring({
    frame: frame - Math.round(fps * 0.15),
    fps,
    config: { damping: 18, stiffness: 110, mass: 0.5 },
  });

  if (!url) {
    // Nothing to render if the URL got lost in transit. Returning null
    // lets the existing layer stack continue rather than throwing.
    return null;
  }

  // ── CARD MODE ─────────────────────────────────────────────────────────────
  if (display === "card") {
    const cardWidth = USER_IMAGE_CARD_WIDTHS[cardSize];

    // OffthreadVideo needs an explicit box — compute height from the
    // clip's real aspect (ffprobe dims from the planner), fall back to
    // 16:9 if absent, cap at the same 864 max the image card uses. The
    // video covers that exact box.
    const aspect =
      scene.clip_width && scene.clip_height && scene.clip_width > 0
        ? scene.clip_height / scene.clip_width
        : 9 / 16;
    const cardHeight = Math.min(864, Math.round(cardWidth * aspect));

    // Entrance over the first ~0.35s, exit mirrored over the last ~0.35s
    // (windows shrink on very short scenes so they never overlap).
    const effectDur = Math.max(
      1,
      Math.min(Math.round(fps * 0.35), Math.floor(durationFrames / 3)),
    );

    let groupOpacity = 1;
    let groupTransform = "none";
    if (effect === "pop") {
      // Back-eased pop — same feel as ProofImage in CampaignAd.
      const backEase = Easing.out(Easing.back(1.4));
      const tIn = interpolate(frame, [0, effectDur], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: backEase,
      });
      const tOut = interpolate(
        frame,
        [durationFrames - effectDur, durationFrames],
        [1, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: backEase,
        },
      );
      const t = Math.min(tIn, tOut);
      groupOpacity = Math.max(0, Math.min(1, t));
      groupTransform = `scale(${(0.85 + 0.15 * t).toFixed(4)})`;
    } else if (effect === "slide") {
      const tIn = interpolate(frame, [0, effectDur], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      const tOut = interpolate(
        frame,
        [durationFrames - effectDur, durationFrames],
        [1, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        },
      );
      const t = Math.min(tIn, tOut);
      groupOpacity = t;
      groupTransform = `translateY(${(60 * (1 - t)).toFixed(2)}px)`;
    } else if (effect === "fade") {
      groupOpacity = interpolate(
        frame,
        [0, effectDur, durationFrames - effectDur, durationFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );
    }
    // "cut": instant on, instant off — opacity stays 1, no transform.

    const cardGroup = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          opacity: groupOpacity,
          transform: groupTransform,
        }}
      >
        <div
          style={{
            borderRadius: 22,
            overflow: "hidden",
            border: `4px solid ${brandColor}`,
            boxShadow: `0 0 30px ${brandColor}66, 0 16px 40px rgba(0,0,0,0.6)`,
            background: "#000",
          }}
        >
          <OffthreadVideo
            src={resolveImageSrc(url)}
            muted={!playAudio}
            startFrom={0}
            style={{
              width: cardWidth,
              height: cardHeight,
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
        {captionText && (
          <div
            style={{
              maxWidth: "78%",
              padding: "14px 26px",
              borderRadius: 14,
              background: "rgba(10,10,10,0.78)",
              border: `1px solid ${brandColor}55`,
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              color: "#fff",
              fontFamily: "var(--font-he), system-ui",
              fontWeight: 600,
              fontSize: 32,
              textAlign: "center",
              lineHeight: 1.25,
              direction: "rtl",
              backdropFilter: "blur(6px)",
            }}
          >
            {captionText}
          </div>
        )}
      </div>
    );

    if (screenPosition === "center") {
      // The card+caption group as a whole is what gets centered.
      return (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {cardGroup}
        </AbsoluteFill>
      );
    }

    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 210,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {cardGroup}
        </div>
      </AbsoluteFill>
    );
  }

  // ── FULLSCREEN MODE (full-bleed cover video) ──────────────────────────────
  // Fullscreen supports only fade/cut at render time. The planner downgrades
  // pop/slide to fade before emitting; mirror that defensively here in case
  // a stale plan slips through (any non-cut effect gets the fade ramps).
  const fsCut = effect === "cut";

  // Soft 0.4s fade in/out at the edges so the cut into and out of the clip
  // feels intentional rather than a hard flash. "cut" skips them entirely.
  const fadeIn = Math.min(fps * 0.4, durationFrames / 4);
  const fadeOut = Math.min(fps * 0.4, durationFrames / 4);
  const opacity = fsCut
    ? 1
    : interpolate(
        frame,
        [0, fadeIn, durationFrames - fadeOut, durationFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );

  const captionTy = fsCut ? 0 : interpolate(captionRise, [0, 1], [40, 0]);
  const captionOp = fsCut ? 1 : interpolate(captionRise, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#000", opacity }}>
      <OffthreadVideo
        src={resolveImageSrc(url)}
        muted={!playAudio}
        startFrom={0}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {captionText && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 130,
            display: "flex",
            justifyContent: "center",
            transform: `translateY(${captionTy}px)`,
            opacity: captionOp,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              maxWidth: "78%",
              padding: "14px 26px",
              borderRadius: 14,
              background: "rgba(10,10,10,0.78)",
              border: `1px solid ${brandColor}55`,
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              color: "#fff",
              fontFamily: "var(--font-he), system-ui",
              fontWeight: 600,
              fontSize: 32,
              textAlign: "center",
              lineHeight: 1.25,
              direction: "rtl",
              backdropFilter: "blur(6px)",
            }}
          >
            {captionText}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// NEW 1. NARRATIVE PERSON — character + items flying in + success burst
// ══════════════════════════════════════════════════════════════════════════════

const NarrativePersonBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = scene.items || [];

  const rgb = hexToRgb(brandColor);

  // Phase boundaries
  const phase2 = Math.round(durationFrames * 0.44); // items fly to person
  const phase3 = Math.round(durationFrames * 0.78); // burst

  const bgOpacity = brollBgOpacity(frame, durationFrames, 8);

  // Person icon
  const personScale = spring({ frame, fps, config: { damping: 12, stiffness: 180 } });
  // Person pulse when items arrive
  const pulseProg = phase2 > 0 && frame >= phase2
    ? spring({ frame: frame - phase2, fps, config: { damping: 8, stiffness: 320 }, from: 1, to: 1.18 })
    : 1;

  // Burst stars
  const burstStars = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <AbsoluteFill>
      <BRollBg opacity={bgOpacity} />

      {/* Glow behind person */}
      <div style={{
        position: "absolute", top: "44%", left: "50%",
        width: 320, height: 320, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${rgb},0.28) 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)",
        opacity: bgOpacity,
      }} />

      {/* Person icon (center) */}
      <div style={{
        position: "absolute", top: "44%", left: "50%",
        transform: `translate(-50%, -50%) scale(${personScale * pulseProg})`,
        opacity: bgOpacity,
      }}>
        <div style={{
          background: brandColor,
          borderRadius: "50%",
          padding: 28,
          boxShadow: `0 0 48px rgba(${rgb},0.55)`,
        }}>
          <LucideIcon name={scene.icon || "UserCircle"} size={100} color="#FFF" strokeWidth={1.6} />
        </div>
      </div>

      {/* Floating items — orbit then fly in */}
      {items.map((item, idx) => {
        const count = items.length;
        const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
        const orbitR = 230;
        const tx = Math.cos(angle) * orbitR;
        const ty = Math.sin(angle) * orbitR;

        // Phase 1: appear in orbit
        const appearProg = spring({
          frame: Math.max(0, frame - idx * 7),
          fps,
          config: { damping: 13, stiffness: 200 },
        });
        // Phase 2: fly toward center
        const flyProg = frame >= phase2
          ? spring({
              frame: frame - phase2 - idx * 5,
              fps,
              config: { damping: 12, stiffness: 260 },
            })
          : 0;

        const clampedFly = Math.min(flyProg, 1);
        const x = tx * (1 - clampedFly);
        const y = ty * (1 - clampedFly);
        const scale = appearProg * (1 - clampedFly * 0.85);
        const opacity = appearProg * (1 - clampedFly * 0.9);

        return (
          <div
            key={idx}
            style={{
              position: "absolute", top: "44%", left: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`,
              opacity,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Icon bubble */}
            <div style={{
              background: `rgba(${rgb}, 0.9)`,
              borderRadius: "50%",
              width: 90,
              height: 90,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `3px solid rgba(255,255,255,0.4)`,
              boxShadow: `0 4px 20px rgba(${rgb},0.5)`,
            }}>
              {item.icon
                ? <LucideIcon name={item.icon} size={46} color="#FFF" strokeWidth={1.8} />
                : <span style={{ fontSize: 42 }}>{item.emoji || ""}</span>
              }
            </div>
            {/* Label */}
            <div style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 800,
              fontSize: 30,
              color: "#FFFFFF",
              direction: "rtl",
              textAlign: "center",
              maxWidth: 160,
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
              background: "rgba(0,0,0,0.4)",
              borderRadius: 10,
              padding: "4px 12px",
            }}>
              {item.text}
            </div>
          </div>
        );
      })}

      {/* Success burst — stars radiating out */}
      {frame >= phase3 && burstStars.map((i) => {
        const angle = (i / burstStars.length) * Math.PI * 2;
        const burstProg = spring({
          frame: frame - phase3,
          fps,
          config: { damping: 16, stiffness: 180 },
        });
        const dist = 160 * Math.min(burstProg, 1);
        const fadeOut = interpolate(frame, [phase3 + 6, phase3 + durationFrames * 0.25], [1, 0], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute", top: "44%", left: "50%",
              transform: `translate(
                calc(-50% + ${Math.cos(angle) * dist}px),
                calc(-50% + ${Math.sin(angle) * dist}px)
              )`,
              opacity: fadeOut,
            }}
          >
            <Icons.Sparkles size={i % 2 === 0 ? 28 : 20} color={brandColor} />
          </div>
        );
      })}

      {/* Title pill */}
      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={140} />}

      {/* Label under person */}
      {scene.primary && (
        <div style={{
          position: "absolute",
          top: "68%",
          left: 60, right: 60,
          textAlign: "center",
          fontFamily: "'Heebo', sans-serif",
          fontWeight: 900,
          fontSize: 52,
          color: "#FFFFFF",
          direction: "rtl",
          opacity: interpolate(frame, [8, 20], [0, 1], { extrapolateRight: "clamp" }) * bgOpacity,
        }}>
          {scene.primary}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// NEW 2. ICON SHOWCASE — central icon (brand/concept) + orbiting related icons
// ══════════════════════════════════════════════════════════════════════════════

const IconShowcaseBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const surrounding = scene.items || [];

  const rgb = hexToRgb(brandColor);

  const bgOpacity = brollBgOpacity(frame, durationFrames, 8);

  // Central icon scales in
  const centerScale = spring({ frame, fps, config: { damping: 11, stiffness: 200 } });
  // Slow orbit rotation (full rotation in 6 seconds)
  const orbitAngle = (frame / (fps * 6)) * Math.PI * 2;

  return (
    <AbsoluteFill>
      <BRollBg opacity={bgOpacity} />

      {/* Outer glow ring */}
      <div style={{
        position: "absolute", top: scene.title ? "46%" : "42%", left: "50%",
        width: 560, height: 560, borderRadius: "50%",
        border: `2px solid rgba(${rgb},0.18)`,
        transform: "translate(-50%,-50%)",
        opacity: bgOpacity,
      }} />
      <div style={{
        position: "absolute", top: scene.title ? "46%" : "42%", left: "50%",
        width: 420, height: 420, borderRadius: "50%",
        border: `2px solid rgba(${rgb},0.12)`,
        transform: "translate(-50%,-50%)",
        opacity: bgOpacity,
      }} />

      {/* Central icon */}
      <div style={{
        position: "absolute",
        top: scene.title ? "46%" : "42%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${centerScale})`,
        background: brandColor,
        borderRadius: "50%",
        padding: 38,
        boxShadow: `0 0 60px rgba(${rgb},0.55), 0 0 120px rgba(${rgb},0.2)`,
        opacity: bgOpacity,
      }}>
        <LucideIcon name={scene.icon || "Star"} size={110} color="#FFF" strokeWidth={1.5} />
      </div>

      {/* Orbiting icons */}
      {surrounding.map((item, idx) => {
        const baseAngle = (idx / Math.max(1, surrounding.length)) * Math.PI * 2 - Math.PI / 2;
        const currentAngle = baseAngle + orbitAngle;
        const orbitR = 240;
        const x = Math.cos(currentAngle) * orbitR;
        const y = Math.sin(currentAngle) * orbitR;

        const delay = idx * 5 + 8;
        const itemScale = spring({
          frame: Math.max(0, frame - delay),
          fps,
          config: { damping: 13, stiffness: 240 },
        });

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              top: scene.title ? "46%" : "42%",
              left: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${itemScale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              opacity: bgOpacity * itemScale,
            }}
          >
            <div style={{
              background: `rgba(${rgb}, 0.15)`,
              border: `2px solid rgba(${rgb}, 0.45)`,
              borderRadius: "50%",
              width: 80,
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}>
              <LucideIcon name={item.icon || "Star"} size={42} color="#FFF" strokeWidth={1.8} />
            </div>
            {item.text && (
              <div style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 700,
                fontSize: 26,
                color: "rgba(255,255,255,0.85)",
                textAlign: "center",
                maxWidth: 110,
                textShadow: "0 2px 6px rgba(0,0,0,0.9)",
              }}>
                {item.text}
              </div>
            )}
          </div>
        );
      })}

      {/* Main label */}
      {scene.primary && (
        <div style={{
          position: "absolute",
          bottom: scene.title ? "30%" : "26%",
          left: 60, right: 60,
          textAlign: "center",
          fontFamily: "'Heebo', sans-serif",
          fontWeight: 900,
          fontSize: 56,
          color: "#FFFFFF",
          direction: "rtl",
          opacity: interpolate(frame, [10, 22], [0, 1], { extrapolateRight: "clamp" }) * bgOpacity,
        }}>
          {scene.primary}
        </div>
      )}

      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={150} />}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// NEW CONCEPT LIBRARY COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── PercentFillCircleBRoll ────────────────────────────────────────────────────
const PercentFillCircleBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pct = Math.min(100, Math.max(0, scene.percentage ?? 75));
  const radius = 160;
  const circumference = 2 * Math.PI * radius;
  const fillDelay = 10;
  const fillDuration = Math.round(durationFrames * 0.55);

  const fillProgress = spring({
    frame: Math.max(0, frame - fillDelay),
    fps,
    config: { stiffness: 55, damping: 18, mass: 1 },
  });
  const filledOffset = circumference - (circumference * pct * Math.min(fillProgress, 1)) / 100;

  const counterVal = Math.round(pct * Math.min(fillProgress, 1));

  const titleOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const circleOpacity = interpolate(frame, [5, 18], [0, 1], { extrapolateRight: "clamp" });

  const rgb = hexToRgb(brandColor);

  return (
    <AbsoluteFill style={{ background: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "relative", width: 420, height: 420, opacity: circleOpacity }}>
        <svg width="420" height="420" style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx="210" cy="210" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="18" />
          {/* Fill */}
          <circle
            cx="210" cy="210" r={radius}
            fill="none"
            stroke={brandColor}
            strokeWidth="18"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={filledOffset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 18px rgba(${rgb},0.7))` }}
          />
        </svg>
        {/* Counter in center */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            fontFamily: "'Heebo', sans-serif", fontWeight: 900,
            fontSize: 96, color: "#FFFFFF", lineHeight: 1,
            textShadow: `0 0 40px rgba(${rgb},0.8)`,
          }}>
            {counterVal}
            <span style={{ fontSize: 52, color: brandColor }}>%</span>
          </div>
          {scene.label && (
            <div style={{
              fontFamily: "'Heebo', sans-serif", fontWeight: 700,
              fontSize: 26, color: "rgba(255,255,255,0.7)",
              textAlign: "center", marginTop: 8, direction: "rtl",
            }}>
              {scene.label}
            </div>
          )}
        </div>
      </div>
      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={60} />}
    </AbsoluteFill>
  );
};

// ── PopupChecklistBRoll ───────────────────────────────────────────────────────
const PopupChecklistBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkItems = scene.items?.map(i => i.text) ?? scene.lines ?? [];
  const STAGGER = 14;

  const cardY = spring({
    frame,
    fps,
    config: { stiffness: 220, damping: 22 },
  });
  const cardTranslateY = interpolate(cardY, [0, 1], [-160, 0]);
  const cardOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  const rgb = hexToRgb(brandColor);

  return (
    <AbsoluteFill style={{ background: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center" }}>
      <div style={{
        transform: `translateY(${cardTranslateY}px)`,
        opacity: cardOpacity,
        background: "rgba(20,20,28,0.97)",
        border: `2px solid rgba(${rgb},0.35)`,
        borderRadius: 24,
        padding: "36px 44px",
        minWidth: 560, maxWidth: 700,
        boxShadow: `0 8px 60px rgba(0,0,0,0.7), 0 0 40px rgba(${rgb},0.15)`,
      }}>
        {scene.title && (
          <div style={{
            fontFamily: "'Heebo', sans-serif", fontWeight: 900,
            fontSize: 34, color: "#FFFFFF", direction: "rtl",
            marginBottom: 28, textAlign: "center",
          }}>
            {scene.title}
          </div>
        )}
        {checkItems.map((item, idx) => {
          const itemDelay = Math.round(durationFrames * 0.25) + idx * STAGGER;
          const itemProgress = spring({
            frame: Math.max(0, frame - itemDelay),
            fps,
            config: { stiffness: 240, damping: 18 },
          });
          const checkScale = interpolate(itemProgress, [0, 1], [0, 1], { extrapolateRight: "clamp" });
          const rowOpacity = interpolate(itemProgress, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div key={idx} style={{
              display: "flex", flexDirection: "row-reverse", alignItems: "center",
              gap: 16, marginBottom: 18, opacity: rowOpacity, direction: "rtl",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: checkScale > 0.5 ? brandColor : "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transform: `scale(${0.5 + checkScale * 0.5})`,
                flexShrink: 0,
                transition: "background 0.2s",
              }}>
                <span style={{ fontSize: 18, color: "#FFFFFF", fontWeight: 700 }}></span>
              </div>
              <div style={{
                fontFamily: "'Heebo', sans-serif", fontWeight: 600,
                fontSize: 26, color: "#FFFFFF",
              }}>
                {item}
              </div>
            </div>
          );
        })}
      </div>
      {!scene.title && <TitlePill title="" brandColor={brandColor} top={80} />}
    </AbsoluteFill>
  );
};

// ── ChecklistOutcomeBRoll ─────────────────────────────────────────────────────
const ChecklistOutcomeBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkItems = scene.items?.map(i => i.text) ?? [];
  const STAGGER = 18;
  const CHECKMARK_SIZE = 34;
  const checkCircumference = 2 * Math.PI * 13;

  const outcomeDelay = Math.round(durationFrames * 0.6);
  const outcomeProgress = spring({
    frame: Math.max(0, frame - outcomeDelay),
    fps,
    config: { stiffness: 300, damping: 10 },
  });
  const outcomeScale = interpolate(outcomeProgress, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const outcomeOpacity = interpolate(outcomeProgress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  const rgb = hexToRgb(brandColor);

  return (
    <AbsoluteFill style={{
      background: "rgba(0,0,0,0.82)",
      justifyContent: "center", alignItems: "center",
      flexDirection: "column", gap: 0,
    }}>
      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={70} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 640, marginTop: scene.title ? 80 : 0 }}>
        {checkItems.map((item, idx) => {
          const itemDelay = 8 + idx * STAGGER;
          const itemProgress = spring({
            frame: Math.max(0, frame - itemDelay),
            fps,
            config: { stiffness: 180, damping: 20 },
          });
          const dashOffset = interpolate(itemProgress, [0, 1], [checkCircumference, 0], { extrapolateRight: "clamp" });
          const rowOpacity = interpolate(frame - itemDelay, [0, 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

          return (
            <div key={idx} style={{
              display: "flex", flexDirection: "row-reverse", alignItems: "center",
              gap: 18, direction: "rtl", opacity: rowOpacity,
            }}>
              <svg width={CHECKMARK_SIZE} height={CHECKMARK_SIZE} viewBox="0 0 34 34" style={{ flexShrink: 0 }}>
                <circle cx="17" cy="17" r="13" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                <circle
                  cx="17" cy="17" r="13"
                  fill="none"
                  stroke={brandColor}
                  strokeWidth="2.5"
                  strokeDasharray={`${checkCircumference}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "17px 17px" }}
                />
                {itemProgress > 0.85 && (
                  <polyline
                    points="10,17 15,22 24,12"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
              <div style={{
                fontFamily: "'Heebo', sans-serif", fontWeight: 700,
                fontSize: 28, color: "#FFFFFF",
              }}>
                {item}
              </div>
            </div>
          );
        })}
      </div>

      {scene.outcome && (
        <div style={{
          marginTop: 32,
          transform: `scale(${0.7 + outcomeScale * 0.3})`,
          opacity: outcomeOpacity,
          background: brandColor,
          borderRadius: 16,
          padding: "18px 36px",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: `0 0 40px rgba(${rgb},0.6)`,
        }}>
          {scene.outcome_icon && <LucideIcon name={scene.outcome_icon} size={32} color="#FFFFFF" />}
          <div style={{
            fontFamily: "'Heebo', sans-serif", fontWeight: 900,
            fontSize: 32, color: "#FFFFFF", direction: "rtl",
          }}>
            {scene.outcome}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── MessageShowdownBRoll ──────────────────────────────────────────────────────
const MessageShowdownBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftMsg = scene.left_bubble ?? scene.items?.[0]?.text ?? "...";
  const rightMsg = scene.right_bubble ?? scene.items?.[1]?.text ?? "...";
  const STAGGER = 20;

  const leftProgress = spring({ frame: Math.max(0, frame - 8), fps, config: { stiffness: 240, damping: 20 } });
  const rightProgress = spring({ frame: Math.max(0, frame - 8 - STAGGER), fps, config: { stiffness: 240, damping: 20 } });

  const leftX = interpolate(leftProgress, [0, 1], [-300, 0], { extrapolateRight: "clamp" });
  const leftOpacity = interpolate(leftProgress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const rightX = interpolate(rightProgress, [0, 1], [300, 0], { extrapolateRight: "clamp" });
  const rightOpacity = interpolate(rightProgress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  const rgb = hexToRgb(brandColor);

  return (
    <AbsoluteFill style={{
      background: "rgba(0,0,0,0.82)",
      justifyContent: "center", alignItems: "center",
      flexDirection: "column", gap: 28,
    }}>
      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={70} />}

      {/* Left bubble */}
      <div style={{
        transform: `translateX(${leftX}px)`,
        opacity: leftOpacity,
        alignSelf: "flex-start",
        marginLeft: 60,
        background: "rgba(255,255,255,0.12)",
        border: "1.5px solid rgba(255,255,255,0.22)",
        borderRadius: "20px 20px 20px 4px",
        padding: "18px 26px",
        maxWidth: 500,
        direction: "rtl",
      }}>
        <div style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 600,
          fontSize: 26, color: "#FFFFFF",
        }}>
          {leftMsg}
        </div>
      </div>

      {/* Right bubble */}
      <div style={{
        transform: `translateX(${rightX}px)`,
        opacity: rightOpacity,
        alignSelf: "flex-end",
        marginRight: 60,
        background: brandColor,
        borderRadius: "20px 20px 4px 20px",
        padding: "18px 26px",
        maxWidth: 500,
        direction: "rtl",
        boxShadow: `0 4px 24px rgba(${rgb},0.45)`,
      }}>
        <div style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 700,
          fontSize: 26, color: "#FFFFFF",
        }}>
          {rightMsg}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── NotificationSlamBRoll ─────────────────────────────────────────────────────
const NotificationSlamBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const notifs = scene.notifications ?? scene.items?.map((item, i) => ({
    app: "DM",
    text: item.text,
    count: item.value,
  })) ?? [];

  const STAGGER = 12;
  const rgb = hexToRgb(brandColor);

  return (
    <AbsoluteFill style={{
      background: "rgba(0,0,0,0.78)",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 16,
    }}>
      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={60} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 640, marginTop: scene.title ? 60 : 0 }}>
        {notifs.map((notif, idx) => {
          const delay = idx * STAGGER;
          const bangProgress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { stiffness: 320, damping: 8 },
          });
          const translateY = interpolate(bangProgress, [0, 1], [-140, 0], { extrapolateRight: "clamp" });
          const opacity = interpolate(bangProgress, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div key={idx} style={{
              transform: `translateY(${translateY}px)`,
              opacity,
              background: "rgba(30,30,38,0.97)",
              border: `1.5px solid rgba(${rgb},0.3)`,
              borderRadius: 18,
              padding: "16px 24px",
              display: "flex",
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 18,
              direction: "rtl",
              boxShadow: "0 6px 30px rgba(0,0,0,0.5)",
            }}>
              {/* App badge */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: brandColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Heebo', sans-serif", fontWeight: 900,
                fontSize: 15, color: "#FFFFFF",
                flexShrink: 0,
                boxShadow: `0 0 12px rgba(${rgb},0.5)`,
              }}>
                {notif.app.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Heebo', sans-serif", fontWeight: 700,
                  fontSize: 14, color: brandColor, marginBottom: 3,
                }}>
                  {notif.app}
                </div>
                <div style={{
                  fontFamily: "'Heebo', sans-serif", fontWeight: 500,
                  fontSize: 22, color: "#FFFFFF",
                }}>
                  {notif.text}
                </div>
              </div>
              {notif.count && (
                <div style={{
                  background: "#FF3B30",
                  borderRadius: "50%",
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 14,
                  color: "#FFFFFF", flexShrink: 0,
                }}>
                  {notif.count}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── TerminalTypingBRoll ───────────────────────────────────────────────────────
const TerminalTypingBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = scene.lines ?? (scene.primary ? [scene.primary] : ["מריץ סקריפט..."]);
  const prefix = scene.prompt ?? "$ ";
  const allText = lines.join("\n");
  const charsPerFrame = allText.length / (durationFrames * 0.75);
  const charIndex = Math.floor(frame * charsPerFrame);

  // Build lines from charIndex
  let remaining = charIndex;
  const visibleLines: string[] = [];
  for (const line of lines) {
    if (remaining <= 0) break;
    if (remaining >= line.length) {
      visibleLines.push(line);
      remaining -= line.length;
    } else {
      visibleLines.push(line.slice(0, remaining));
      remaining = 0;
    }
  }

  const cursorVisible = Math.floor(frame / 18) % 2 === 0;
  const cardOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const rgb = hexToRgb(brandColor);

  return (
    <AbsoluteFill style={{
      background: "rgba(0,0,0,0.85)",
      justifyContent: "center",
      alignItems: "center",
    }}>
      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={60} />}

      <div style={{
        opacity: cardOpacity,
        background: "#0D1117",
        border: `1.5px solid rgba(${rgb},0.4)`,
        borderRadius: 18,
        padding: "32px 40px",
        width: 700,
        boxShadow: `0 8px 50px rgba(0,0,0,0.8), 0 0 30px rgba(${rgb},0.12)`,
      }}>
        {/* Terminal title bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 22,
          paddingBottom: 16,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28CA42" }} />
          <div style={{
            marginLeft: "auto",
            fontFamily: "monospace",
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
          }}>
            terminal
          </div>
        </div>

        {/* Lines */}
        {visibleLines.map((line, idx) => (
          <div key={idx} style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 22,
            color: idx === visibleLines.length - 1 ? brandColor : "rgba(255,255,255,0.8)",
            lineHeight: 1.7,
            direction: "ltr",
          }}>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>{prefix}</span>
            {line}
            {idx === visibleLines.length - 1 && (
              <span style={{ opacity: cursorVisible ? 1 : 0, color: brandColor }}>█</span>
            )}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── TimelineGrowthBRoll ───────────────────────────────────────────────────────
const TimelineGrowthBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const milestones = scene.milestones ?? scene.items?.map((item, i) => ({
    label: item.text,
    date: item.sub_text,
    icon: item.icon,
  })) ?? [];

  const LINE_WIDTH = 680;
  const lineProgress = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { stiffness: 80, damping: 22 },
  });
  const lineW = interpolate(lineProgress, [0, 1], [0, LINE_WIDTH], { extrapolateRight: "clamp" });

  const rgb = hexToRgb(brandColor);

  return (
    <AbsoluteFill style={{
      background: "rgba(0,0,0,0.82)",
      justifyContent: "center",
      alignItems: "center",
    }}>
      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={70} />}

      <div style={{ position: "relative", width: LINE_WIDTH, height: 200 }}>
        {/* Track line */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: LINE_WIDTH,
          height: 4,
          background: "rgba(255,255,255,0.15)",
          borderRadius: 2,
          transform: "translateY(-50%)",
        }} />
        {/* Growing fill */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: lineW,
          height: 4,
          background: brandColor,
          borderRadius: 2,
          transform: "translateY(-50%)",
          boxShadow: `0 0 16px rgba(${rgb},0.6)`,
        }} />

        {/* Milestones */}
        {milestones.map((ms, idx) => {
          const xPos = milestones.length > 1
            ? (idx / (milestones.length - 1)) * LINE_WIDTH
            : LINE_WIDTH / 2;
          const dotDelay = 8 + Math.round((xPos / LINE_WIDTH) * durationFrames * 0.5);
          const dotProgress = spring({
            frame: Math.max(0, frame - dotDelay),
            fps,
            config: { stiffness: 300, damping: 10 },
          });
          const dotScale = interpolate(dotProgress, [0, 1], [0, 1], { extrapolateRight: "clamp" });
          const labelOpacity = interpolate(dotProgress, [0.4, 1], [0, 1], { extrapolateRight: "clamp" });
          const isTop = idx % 2 === 0;

          return (
            <div key={idx} style={{
              position: "absolute",
              left: xPos,
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}>
              {/* Dot */}
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: brandColor,
                border: "3px solid rgba(255,255,255,0.9)",
                transform: `scale(${dotScale})`,
                boxShadow: `0 0 18px rgba(${rgb},0.7)`,
              }} />
              {/* Label */}
              <div style={{
                position: "absolute",
                [isTop ? "bottom" : "top"]: 30,
                left: "50%",
                transform: "translateX(-50%)",
                opacity: labelOpacity,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}>
                {ms.date && (
                  <div style={{
                    fontFamily: "'Heebo', sans-serif", fontWeight: 700,
                    fontSize: 14, color: brandColor,
                  }}>
                    {ms.date}
                  </div>
                )}
                <div style={{
                  fontFamily: "'Heebo', sans-serif", fontWeight: 700,
                  fontSize: 20, color: "#FFFFFF", direction: "rtl",
                }}>
                  {ms.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {scene.primary && (
        <div style={{
          marginTop: 40,
          fontFamily: "'Heebo', sans-serif", fontWeight: 900,
          fontSize: 40, color: "#FFFFFF", direction: "rtl",
          opacity: interpolate(frame, [Math.round(durationFrames * 0.6), Math.round(durationFrames * 0.75)], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          {scene.primary}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── FunnelBuildBRoll ──────────────────────────────────────────────────────────
const FunnelBuildBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const funnelItems = scene.items ?? [
    { text: scene.primary ?? "שלב 1" },
    { text: scene.secondary ?? "שלב 2" },
  ];

  const STAGGER = 16;
  const rgb = hexToRgb(brandColor);
  const widths = [640, 480, 340, 220];

  const outcomeDelay = Math.round(durationFrames * 0.65);
  const outcomeProgress = spring({
    frame: Math.max(0, frame - outcomeDelay),
    fps,
    config: { stiffness: 280, damping: 10 },
  });
  const outcomeOpacity = interpolate(outcomeProgress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const outcomeScale = interpolate(outcomeProgress, [0, 1], [0.6, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      background: "rgba(0,0,0,0.82)",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      gap: 10,
    }}>
      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={55} />}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: scene.title ? 50 : 0 }}>
        {funnelItems.map((item, idx) => {
          const w = widths[idx] ?? Math.max(100, 640 - idx * 140);
          const delay = idx * STAGGER;
          const p = spring({ frame: Math.max(0, frame - delay), fps, config: { stiffness: 200, damping: 22 } });
          const slideX = interpolate(p, [0, 1], [300, 0], { extrapolateRight: "clamp" });
          const opacity = interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
          const alpha = 1 - idx * 0.2;

          return (
            <div key={idx} style={{
              transform: `translateX(${slideX}px)`,
              opacity,
              width: w,
              background: `rgba(${rgb},${alpha * 0.35})`,
              border: `1.5px solid rgba(${rgb},${alpha * 0.6})`,
              borderRadius: 12,
              padding: "14px 24px",
              textAlign: "center",
              direction: "rtl",
            }}>
              <div style={{
                fontFamily: "'Heebo', sans-serif", fontWeight: 700,
                fontSize: 24, color: "#FFFFFF",
              }}>
                {item.text}
              </div>
            </div>
          );
        })}

        {/* Connector arrow */}
        <div style={{
          opacity: outcomeOpacity,
          fontSize: 32, color: brandColor, marginTop: 4,
        }}>
          ↓
        </div>

        {/* Outcome */}
        {scene.outcome && (
          <div style={{
            opacity: outcomeOpacity,
            transform: `scale(${outcomeScale})`,
            background: brandColor,
            borderRadius: 16,
            padding: "18px 40px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: `0 0 40px rgba(${rgb},0.6)`,
          }}>
            {scene.outcome_icon && <LucideIcon name={scene.outcome_icon} size={30} color="#FFFFFF" />}
            <div style={{
              fontFamily: "'Heebo', sans-serif", fontWeight: 900,
              fontSize: 30, color: "#FFFFFF", direction: "rtl",
            }}>
              {scene.outcome}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── PhoneScreenStackBRoll ─────────────────────────────────────────────────────
const PhoneScreenStackBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const STAGGER = 14;
  const phoneLabels = scene.items?.map(i => i.text) ?? ["TikTok", "Instagram", "YouTube"];
  const rgb = hexToRgb(brandColor);

  const stackConfigs = [
    { scale: 0.72, rotate: -8, tx: -110, tz: -80, delay: 0 },
    { scale: 0.82, rotate: -3, tx: -30, tz: -40, delay: STAGGER },
    { scale: 1.0,  rotate: 2,  tx: 50,  tz: 0,   delay: STAGGER * 2 },
  ];

  const floatOffset = interpolate(frame, [0, durationFrames], [0, 8], {}) -
    4 * Math.sin((frame / durationFrames) * Math.PI * 2);

  return (
    <AbsoluteFill style={{
      background: "rgba(0,0,0,0.82)",
      justifyContent: "center",
      alignItems: "center",
    }}>
      {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={70} />}

      <div style={{ position: "relative", width: 500, height: 420 }}>
        {stackConfigs.map((cfg, idx) => {
          const p = spring({
            frame: Math.max(0, frame - cfg.delay),
            fps,
            config: { stiffness: 200, damping: 20 },
          });
          const enterProgress = interpolate(p, [0, 1], [0, 1], { extrapolateRight: "clamp" });
          const opacity = interpolate(enterProgress, [0, 0.5], [0, 0.9], { extrapolateRight: "clamp" });
          const scale = interpolate(enterProgress, [0, 1], [0.4, cfg.scale], { extrapolateRight: "clamp" });
          const liftY = idx === stackConfigs.length - 1 ? floatOffset : 0;
          const label = phoneLabels[idx] ?? "";

          return (
            <div key={idx} style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) translateX(${cfg.tx * enterProgress}px) translateY(${liftY}px) rotate(${cfg.rotate * enterProgress}deg) scale(${scale})`,
              opacity,
              zIndex: idx,
            }}>
              {/* Phone frame */}
              <div style={{
                width: 180, height: 320,
                background: "#1A1A2E",
                borderRadius: 28,
                border: `2px solid rgba(${rgb},${0.3 + idx * 0.2})`,
                boxShadow: idx === stackConfigs.length - 1
                  ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(${rgb},0.35)`
                  : "0 10px 30px rgba(0,0,0,0.6)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                overflow: "hidden",
              }}>
                {/* Notch */}
                <div style={{
                  position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
                  width: 60, height: 10, background: "#111", borderRadius: 6,
                }} />
                {/* App icon */}
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: brandColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 20px rgba(${rgb},0.5)`,
                }}>
                  <LucideIcon name="Smartphone" size={32} color="#FFFFFF" />
                </div>
                <div style={{
                  fontFamily: "'Heebo', sans-serif", fontWeight: 700,
                  fontSize: 18, color: "#FFFFFF",
                }}>
                  {label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {scene.primary && (
        <div style={{
          position: "absolute",
          bottom: "14%",
          left: 60, right: 60,
          textAlign: "center",
          fontFamily: "'Heebo', sans-serif", fontWeight: 900,
          fontSize: 40, color: "#FFFFFF", direction: "rtl",
          opacity: interpolate(frame, [Math.round(durationFrames * 0.5), Math.round(durationFrames * 0.65)], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          {scene.primary}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── GraphSpikeBRoll — REFERENCE GRADE (see ../design/BROLL_STYLE_SPEC.md §2.1)
// The old version floated a 280px chart in a black void with 14px labels and
// a  emoji. This one obeys the reference laws: hero fills the frame (LAW 1),
// three camera beats (LAW 2), lives on the shared SceneStage (LAW 3/4), one
// accent bound to meaning with no emoji (LAW 5), a state change every beat
// (LAW 7), and reference-scale type (140px counter, 36px labels).
const GraphSpikeBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bars = scene.bars ?? [
    { value: 20, label: "", highlight: false },
    { value: 35, label: "", highlight: false },
    { value: 55, label: "", highlight: false },
    { value: 100, label: scene.primary ?? "", highlight: true },
  ];
  const maxVal = Math.max(...bars.map((b) => b.value));
  const rgb = hexToRgb(brandColor);
  const spikeIdx = Math.max(0, bars.findIndex((b) => b.highlight));

  // Layout: chart fills 85% width; bar area 55% of frame height (LAW 1).
  const CHART_W = 918; // 85% of 1080
  const AREA_H = 1050;
  const BASELINE_Y = 1380;
  const BAR_W = Math.min(130, (CHART_W - 28 * (bars.length - 1)) / bars.length);
  const GAP = bars.length > 1 ? (CHART_W - BAR_W * bars.length) / (bars.length - 1) : 0;

  // Three camera beats (LAW 2): punch on the small bars → whip to the spike → settle.
  const b1 = Math.round(durationFrames * 0.22);
  const b2 = b1 + 10; // 10-frame whip
  // Origin-(0,0) camera math: screen = world*scale + translate. Beat 1
  // frames the SMALL bars (world ~x400, y1150) at screen center, then whips
  // back to identity for the spike reveal.
  const camPoses: CameraPose[] = [
    { frame: 0, x: 540 - 400 * 1.25, y: 830 - 1150 * 1.25, scale: 1.25 },
    { frame: b1, x: 540 - 400 * 1.25, y: 830 - 1150 * 1.25, scale: 1.25 },
    { frame: b2, x: 0, y: 0, scale: 1.0 },
  ];

  const glowPulse = 0.75 + 0.25 * Math.sin(frame / 9);

  // Spike counter counts up through beats 2-3 (hero number, LAW 5: no emoji).
  const spikeVal = bars[spikeIdx]?.value ?? 100;
  const shown = Math.round(
    interpolate(frame, [b1, Math.round(durationFrames * 0.7)], [0, spikeVal], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const labelOpacity = interpolate(frame, [b2, b2 + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Bar heights (springs) + the polyline traced over their tops.
  const heights = bars.map((bar, idx) => {
    const p = spring({
      frame: Math.max(0, frame - idx * 6),
      fps,
      config: bar.highlight ? { stiffness: 240, damping: 9 } : { stiffness: 180, damping: 22 },
    });
    return interpolate(p, [0, 1], [0, (bar.value / maxVal) * AREA_H], { extrapolateRight: "clamp" });
  });
  const xs = bars.map((_, i) => i * (BAR_W + GAP) + BAR_W / 2);
  const linePts = xs.map((x, i) => `${x},${AREA_H - heights[i]}`).join(" ");
  const lineLen = CHART_W * 1.4;
  const lineDraw = interpolate(
    frame,
    [b2, Math.round(durationFrames * 0.75)],
    [lineLen, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <SceneStage accent={brandColor} seed={3} floorShadowAt={BASELINE_Y / 1920}>
      <CameraRig poses={camPoses}>
        {scene.title && <TitlePill title={scene.title} brandColor={brandColor} top={150} />}

        {/* Glass panel the chart lives on — a surface, not a void */}
        <div
          style={{
            position: "absolute",
            left: (1080 - CHART_W) / 2 - 40,
            top: BASELINE_Y - AREA_H - 80,
            width: CHART_W + 80,
            height: AREA_H + 140,
            borderRadius: 28,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 40px 90px -20px rgba(0,0,0,0.55)",
          }}
        >
          {[0.25, 0.5, 0.75].map((t) => (
            <div
              key={t}
              style={{
                position: "absolute",
                left: 24,
                right: 24,
                top: 80 + AREA_H * t,
                height: 1,
                background: "rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>

        {/* Chart */}
        <div
          style={{
            position: "absolute",
            left: (1080 - CHART_W) / 2,
            top: BASELINE_Y - AREA_H,
            width: CHART_W,
            height: AREA_H,
          }}
        >
          {bars.map((bar, idx) => {
            const isSpike = !!bar.highlight;
            const h = heights[idx];
            return (
              <React.Fragment key={idx}>
                <div
                  style={{
                    position: "absolute",
                    left: idx * (BAR_W + GAP),
                    bottom: 0,
                    width: BAR_W,
                    height: h,
                    borderRadius: "10px 10px 0 0",
                    background: isSpike
                      ? `linear-gradient(180deg, ${brandColor} 0%, rgba(${rgb},0.55) 100%)`
                      : "rgba(255,255,255,0.10)",
                    boxShadow: isSpike
                      ? `inset 0 1px 0 rgba(255,255,255,0.35), 0 0 ${40 * glowPulse}px rgba(${rgb},0.7), 0 0 ${110 * glowPulse}px rgba(${rgb},0.3)`
                      : "inset 0 1px 0 rgba(255,255,255,0.22)",
                  }}
                />
                {bar.label && (
                  <div
                    style={{
                      position: "absolute",
                      left: idx * (BAR_W + GAP) - 20,
                      width: BAR_W + 40,
                      top: AREA_H + 18,
                      textAlign: "center",
                      direction: "rtl",
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: 700,
                      fontSize: 36,
                      color: isSpike ? brandColor : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {bar.label}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Polyline tracing the bar tops, drawn as the bars land */}
          <svg
            width={CHART_W}
            height={AREA_H}
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
          >
            <polyline
              points={linePts}
              fill="none"
              stroke={brandColor}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={lineLen}
              strokeDashoffset={lineDraw}
              style={{ filter: `drop-shadow(0 0 12px rgba(${rgb},0.8))` }}
            />
          </svg>

          {/* The hero number — 140px, chrome gradient, orange halo, tabular */}
          <div
            style={{
              position: "absolute",
              left: spikeIdx * (BAR_W + GAP) - 180 + BAR_W / 2,
              width: 360,
              // Clamped: a full-height spike used to push the counter up into
              // the title's zone (owner: "המספר 95 מופיע על המילה זמן").
              // chart-rel 60 = world y≈390, safely under a two-line title.
              top: Math.max(60, AREA_H - heights[spikeIdx] - 190),
              textAlign: "center",
              opacity: labelOpacity,
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 140,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              background: "linear-gradient(180deg, #FFFFFF 0%, #E8E8EC 45%, #9DA2AE 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: `drop-shadow(0 0 28px rgba(${rgb},0.6))`,
            }}
          >
            {shown}
          </div>
        </div>

        {/* Payoff line */}
        {scene.secondary && (
          <div
            style={{
              position: "absolute",
              left: 80,
              right: 80,
              top: 1560,
              textAlign: "center",
              direction: "rtl",
              opacity: labelOpacity,
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 800,
              fontSize: 44,
              color: "#FFFFFF",
              textShadow: "0 2px 24px rgba(0,0,0,0.8)",
            }}
          >
            {scene.secondary}
          </div>
        )}
      </CameraRig>
    </SceneStage>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN BRollOverlay — dispatch to correct type
// ══════════════════════════════════════════════════════════════════════════════

export const BRollOverlay: React.FC<{
  scene: BRollSceneData;
  fps: number;
  brandColor: string;
}> = ({ scene, fps, brandColor }) => {
  const durationSeconds = scene.end - scene.start;
  const durationFrames = Math.round(durationSeconds * fps);
  const items = scene.items || [];

  switch (scene.type) {
    case "user_image":
      return (
        <UserImageBRoll
          scene={scene}
          brandColor={brandColor}
          durationFrames={durationFrames}
        />
      );

    case "user_video":
      return (
        <UserVideoBRoll
          scene={scene}
          brandColor={brandColor}
          durationFrames={durationFrames}
        />
      );

    case "narrative_person":
      return <NarrativePersonBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "icon_showcase":
      return <IconShowcaseBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "stat_counter":
      return <StatCounterBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;
    case "screen_journey":
      return <ScreenJourneyBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;
    case "blueprint_map":
      return <BlueprintMapBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;
    case "twin_phones_funnel":
      return <TwinPhonesFunnelBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "icon_list":
      return <IconListBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "flow":
      return <FlowBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "quote_hero":
      return <QuoteHeroBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "progress":
      return <ProgressBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "key_point":
      return <KeyPointBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "comparison":
      return <ComparisonBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "list_highlight":
      return (
        <ListHighlightBRoll
          items={items}
          title={scene.title}
          brandColor={brandColor}
          sceneDuration={durationFrames}
        />
      );

    case "list":
      return (
        <ListBRoll
          items={items}
          title={scene.title}
          brandColor={brandColor}
          sceneDuration={durationFrames}
        />
      );

    case "steps":
      return (
        <StepsBRoll
          items={items}
          title={scene.title}
          brandColor={brandColor}
          sceneDuration={durationFrames}
        />
      );

    // ── Concept Library types ──────────────────────────────────────────────
    case "percent_fill_circle":
      return <PercentFillCircleBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "popup_checklist":
      return <PopupChecklistBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "checklist_outcome":
      return <ChecklistOutcomeBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "message_showdown":
      return <MessageShowdownBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "notification_slam":
      return <NotificationSlamBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "terminal_typing":
      return <TerminalTypingBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "timeline_growth":
      return <TimelineGrowthBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "funnel_build":
      return <FunnelBuildBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "phone_screen_stack":
      return <PhoneScreenStackBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    case "graph_spike":
      return <GraphSpikeBRoll scene={scene} brandColor={brandColor} durationFrames={durationFrames} />;

    // ── Premium Tier scenes ──────────────────────────────────────────────
    case "spotlight_reveal":
      return (
        <SpotlightReveal
          brandColor={brandColor}
          durationFrames={durationFrames}
          title={scene.title}
          primary={scene.primary}
          secondary={scene.secondary}
          icon={scene.icon}
        />
      );

    case "shockwave_counter":
      return (
        <ShockwaveCounter
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          title={scene.title}
          suffix={scene.suffix}
          label={scene.label}
          icon={scene.icon}
        />
      );

    case "split_transform":
      return (
        <SplitTransform
          brandColor={brandColor}
          durationFrames={durationFrames}
          title={scene.title}
          primary={scene.primary}
          secondary={scene.secondary}
          left_label={scene.left_label}
          right_label={scene.right_label}
        />
      );

    case "card_stack_build":
      return (
        <CardStackBuild
          brandColor={brandColor}
          durationFrames={durationFrames}
          title={scene.title}
          items={items}
        />
      );

    case "urgency_clock":
      return (
        <UrgencyClock
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          secondary={scene.secondary}
          countdown_from={scene.countdown_from}
        />
      );

    case "analytics_dashboard":
      return (
        <AnalyticsDashboard
          brandColor={brandColor}
          durationFrames={durationFrames}
          title={scene.title}
          items={items}
        />
      );

    case "workflow_pipeline":
      return (
        <WorkflowPipeline
          brandColor={brandColor}
          durationFrames={durationFrames}
          title={scene.title}
          items={items}
          outcome={scene.outcome}
          outcome_icon={scene.outcome_icon}
        />
      );

    case "text_slam":
      return (
        <TextSlam
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          secondary={scene.secondary}
        />
      );

    // ── Particle scenes ──────────────────────────────────────────────
    case "particle_atmosphere":
      return (
        <ParticleAtmosphere
          brandColor={brandColor}
          durationFrames={durationFrames}
          title={scene.title}
          primary={scene.primary}
          secondary={scene.secondary}
          icon={scene.icon}
        />
      );

    case "particle_burst":
      return (
        <ParticleBurst
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          secondary={scene.secondary}
          icon={scene.icon}
        />
      );

    case "particle_vortex":
      return (
        <ParticleVortex
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          secondary={scene.secondary}
          icon={scene.icon}
        />
      );

    // ── 3D scenes (lazy-loaded, require WebGL) ─────────────────────
    case "scene_3d_cards":
      return (
        <React.Suspense fallback={<AbsoluteFill style={{ background: "#000" }} />}>
          <Scene3DCards
            brandColor={brandColor}
            durationFrames={durationFrames}
            title={scene.title}
            primary={scene.primary}
            items={items}
          />
        </React.Suspense>
      );

    case "scene_3d_sphere":
      return (
        <React.Suspense fallback={<AbsoluteFill style={{ background: "#000" }} />}>
          <Scene3DSphere
            brandColor={brandColor}
            durationFrames={durationFrames}
            title={scene.title}
            primary={scene.primary}
            items={items}
          />
        </React.Suspense>
      );

    case "scene_3d_morph":
      return (
        <React.Suspense fallback={<AbsoluteFill style={{ background: "#000" }} />}>
          <Scene3DMorph
            brandColor={brandColor}
            durationFrames={durationFrames}
            title={scene.title}
            primary={scene.primary}
            secondary={scene.secondary}
          />
        </React.Suspense>
      );

    // ── Cinematic scenes (AI-generated backgrounds) ────────────────
    case "cinematic_chaos":
      return (
        <CinematicChaos
          brandColor={brandColor}
          durationFrames={durationFrames}
          bgImage={scene.bg_image || "bg/bg_clock_chaos.png"}
          primary={scene.primary}
        />
      );

    case "cinematic_split":
      return (
        <CinematicSplit
          brandColor={brandColor}
          durationFrames={durationFrames}
          bgImage={scene.bg_image || "bg/bg_split_order.png"}
          primary={scene.primary}
          secondary={scene.secondary}
          leftLabel={scene.left_label}
          rightLabel={scene.right_label}
        />
      );

    case "cinematic_converge":
      return (
        <CinematicConvergence
          brandColor={brandColor}
          durationFrames={durationFrames}
          bgImage={scene.bg_image || "bg/bg_shield_power.png"}
          primary={scene.primary}
          icon={scene.icon}
        />
      );

    // ── Creative UI mockup scenes ───────────────────────────────────
    case "ui_search_bar":
      return (
        <UISearchBar
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          secondary={scene.secondary}
        />
      );

    case "ui_browser_tabs":
      return (
        <UIBrowserTabs
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          items={items}
        />
      );

    case "ui_imessage":
      return (
        <UIiMessage
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          items={items}
        />
      );

    case "ui_checklist_app":
      return (
        <UIChecklistApp
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          items={items}
        />
      );

    // ── Visual Engine scenes ────────────────────────────────────────
    case "ui_instagram_post":
      return (
        <UIInstagramPost
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          secondary={scene.secondary}
          items={items}
        />
      );

    case "ui_screen_time":
      return (
        <UIScreenTime
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          items={items}
        />
      );

    case "visual_scale":
      return (
        <VisualScale
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          secondary={scene.secondary}
        />
      );

    case "visual_streak":
      return (
        <VisualStreak
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          items={items}
        />
      );

    // ── Creative Pack 2 ──────────────────────────────────────────────
    case "ui_phone_lockscreen":
      return (
        <UIPhoneLockscreen
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          items={items}
        />
      );

    case "ui_notes_app":
      return (
        <UINotesApp
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          items={items}
        />
      );

    case "ui_analytics_graph":
      return (
        <UIAnalyticsGraph
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          secondary={scene.secondary}
          items={items}
        />
      );

    // ── Creative Pack 3 ──────────────────────────────────────────────
    case "ui_voice_memo":
      return (
        <UIVoiceMemo
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          secondary={scene.secondary}
        />
      );

    case "ui_email_inbox":
      return (
        <UIEmailInbox
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          items={items}
        />
      );

    case "visual_rocket":
      return (
        <VisualRocket
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          secondary={scene.secondary}
        />
      );

    case "visual_domino":
      return (
        <VisualDomino
          brandColor={brandColor}
          durationFrames={durationFrames}
          primary={scene.primary}
          items={items}
        />
      );

    // ─── Pack 4: Tech / AI ─────────────────────────────────────────────
    case "ui_chatgpt_chat":
      return <UIChatGPTChat brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} />;
    case "ui_safari_url_bar":
      return <UISafariURL brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} />;
    case "ui_terminal_command":
      return <UITerminalCommand brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;
    case "ui_app_store_install":
      return <UIAppStoreInstall brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} />;
    case "ui_settings_toggle":
      return <UISettingsToggle brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;

    // ─── Pack 5: Money / Sales ─────────────────────────────────────────
    case "ui_stripe_dashboard":
      return <UIStripeDashboard brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;
    case "ui_apple_pay":
      return <UIApplePay brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} />;
    case "ui_calculator_money":
      return <UICalculatorMoney brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} items={items} />;
    case "visual_cash_register":
      return <VisualCashRegister brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} />;
    case "visual_money_counter":
      return <VisualMoneyCounter brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} items={items} />;

    // ─── Pack 6: Audience / Social Proof ───────────────────────────────
    case "ui_follower_counter":
      return <UIFollowerCounter brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} />;
    case "ui_live_viewers":
      return <UILiveViewers brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;
    case "ui_review_stack":
      return <UIReviewStack brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;
    case "ui_testimonial_card":
      return <UITestimonialCard brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} items={items} />;
    case "visual_crowd_gather":
      return <VisualCrowdGather brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} />;
    case "visual_ripple_effect":
      return <VisualRippleEffect brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} />;
    case "visual_rating_stars":
      return <VisualRatingStars brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} />;

    // ─── Pack 7: Apple Ecosystem ────────────────────────────────────────
    case "ui_finder_files":
      return <UIFinderFiles brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} />;
    case "ui_imovie_timeline":
      return <UIiMovieTimeline brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;
    case "ui_zoom_meeting":
      return <UIZoomMeeting brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;
    case "ui_apple_watch_rings":
      return <UIAppleWatchRings brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;
    case "ui_calendar_fill":
      return <UICalendarFill brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;

    // ─── Pack 8: Education / Drama ─────────────────────────────────────
    case "ui_whiteboard":
      return <UIWhiteboard brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;
    case "ui_keynote_slide":
      return <UIKeynoteSlide brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} items={items} />;
    case "visual_diagram_build":
      return <VisualDiagramBuild brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;
    case "visual_stop_sign":
      return <VisualStopSign brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} />;
    case "ui_system_alert":
      return <UISystemAlert brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} items={items} />;

    // ─── Pack 9: Time / Metaphors ──────────────────────────────────────
    case "visual_hourglass":
      return <VisualHourglass brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} />;
    case "visual_spotlight_isolate":
      return <VisualSpotlightIsolate brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;
    case "visual_thumbs_up_burst":
      return <VisualThumbsUpBurst brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} />;
    case "visual_puzzle_complete":
      return <VisualPuzzleComplete brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} items={items} />;
    case "visual_door_open":
      return <VisualDoorOpen brandColor={brandColor} durationFrames={durationFrames} primary={scene.primary} secondary={scene.secondary} />;

    default:
      return null;
  }
};
