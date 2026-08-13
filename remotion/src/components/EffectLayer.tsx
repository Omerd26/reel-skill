/**
 * EffectLayer.tsx — Dynamic visual effects for Instagram Reels
 *
 * 15 parameterized effect types driven entirely by JSON props.
 * Claude generates the JSON; this component renders it.
 * No re-bundling required — all types are pre-built.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, staticFile, Img } from "remotion";
import { SupportIcon } from "./SupportIcon";
import type { IconEntrance, IconStyle, GradientPreset, IconShape } from "./SupportIcon";

// ── Types ─────────────────────────────────────────────────────────────────────

export type EffectPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type AnimationIn =
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "scale-pop"
  | "fade"
  | "none";

interface EffectBase {
  type: string;
  start: number; // seconds (handled by Sequence in EditedReel)
  end: number;
  position?: EffectPosition;
  animation_in?: AnimationIn;
  z_index?: number;
}

export interface CounterEffect extends EffectBase {
  type: "counter";
  from: number;
  to: number;
  suffix?: string; // "%" | "K" | "+" | ""
  prefix?: string; // "$" | ""
  font_size?: number;
  color?: string;
  label?: string;
  background?: "frosted" | "solid" | "none";
  background_color?: string;
  icon?: string;                    // lucide icon beside counter
  icon_size?: number;               // default 40
}

export interface ProgressBarEffect extends EffectBase {
  type: "progress_bar";
  label?: string;
  from_pct: number; // 0-100
  to_pct: number;
  color?: string;
  track_color?: string;
  height?: number;
  width?: number;
  show_percentage?: boolean;
  border_radius?: number;
}

export interface ListRevealEffect extends EffectBase {
  type: "list_reveal";
  items: string[];
  item_delay_seconds?: number;
  icon?: string;
  font_size?: number;
  color?: string;
  background?: "frosted" | "solid" | "none";
}

export interface EmojiBurstEffect extends EffectBase {
  type: "emoji_burst";
  emoji: string;
  count?: number;
  duration_seconds?: number;
}

export interface TextCardEffect extends EffectBase {
  type: "text_card";
  title?: string;
  body: string;
  style?: "frosted" | "solid" | "outline" | "minimal";
  background_color?: string;
  border_color?: string;
  font_size?: number;
  title_font_size?: number;
  width?: number;
  text_align?: "right" | "center" | "left";
  icon?: string;                    // lucide-react icon name — appears left of title
  icon_size?: number;               // default 40
  icon_color?: string;              // default: border_color or BRAND
}

export interface StatHighlightEffect extends EffectBase {
  type: "stat_highlight";
  number: string; // static string, use counter for animated
  label: string;
  sublabel?: string;
  accent_color?: string;
  background?: "frosted" | "solid" | "none";
  icon?: string;                    // lucide icon above the number
  icon_size?: number;               // default 44
}

export interface BeforeAfterEffect extends EffectBase {
  type: "before_after";
  left_label?: string;
  right_label?: string;
  split_animated?: boolean;
  left_color?: string;
  right_color?: string;
  left_icon?: string;
  right_icon?: string;
}

export interface ChecklistEffect extends EffectBase {
  type: "checklist";
  items: Array<{ text: string; checked: boolean }>;
  item_delay_seconds?: number;
  font_size?: number;
}

export interface QuoteCardEffect extends EffectBase {
  type: "quote_card";
  text: string;
  author?: string;
  style?: "minimal" | "bordered" | "frosted";
  accent_color?: string;
}

export interface HighlightBarEffect extends EffectBase {
  type: "highlight_bar";
  text: string;
  bar_color?: string;
  text_color?: string;
  font_size?: number;
  icon?: string;                    // lucide icon left of text
  icon_size?: number;               // default 36
}

export interface CountdownEffect extends EffectBase {
  type: "countdown";
  seconds: number;
  label?: string;
  color?: string;
  style?: "digital" | "minimal";
}

export interface StepIndicatorEffect extends EffectBase {
  type: "step_indicator";
  current: number;
  total: number;
  label?: string;
  color?: string;
  style?: "dots" | "numbers" | "bar";
}

export interface PullQuoteEffect extends EffectBase {
  type: "pull_quote";
  word: string;
  translation?: string;
  font_size?: number;
  color?: string;
  animate?: "scale-in" | "fade";
}

export interface CTAEffect extends EffectBase {
  type: "cta";
  text: string;
  subtext?: string;
  button_text?: string;
  style?: "frosted" | "solid";
  color?: string;
  icon?: string;                    // lucide icon above CTA text
  icon_size?: number;               // default 44
}

export interface PercentageEffect extends EffectBase {
  type: "percentage";
  value: number; // 0-100
  label?: string;
  style?: "circle" | "bar";
  color?: string;
  animate?: boolean;
}

export interface BarChartEffect extends EffectBase {
  type: "bar_chart";
  bars: Array<{ label: string; value: number; color?: string }>;
  max_value?: number;          // auto-computed if omitted
  bar_width?: number;          // px per bar (default 80)
  show_values?: boolean;       // show number above bar (default true)
  title?: string;
  value_suffix?: string;       // "K" | "%" | ""
  bar_color?: string;          // fallback color for bars without .color
  background?: "frosted" | "solid" | "none";
}

export interface TypewriterEffect extends EffectBase {
  type: "typewriter";
  text: string;
  chars_per_second?: number;   // default 12
  font_size?: number;
  color?: string;
  cursor?: boolean;            // show blinking cursor (default true)
  background?: "frosted" | "solid" | "none";
}

export interface NeonTextEffect extends EffectBase {
  type: "neon_text";
  text: string;
  color?: string;              // default electric cyan "#00FFFF"
  font_size?: number;
  pulse?: boolean;             // glow intensity oscillates (default true)
  second_line?: string;
}

export interface WaveformEffect extends EffectBase {
  type: "waveform";
  bars?: number;               // default 24
  color?: string;
  height?: number;             // max bar height in px (default 120)
  width?: number;              // total component width (default 600)
  style?: "symmetric" | "top"; // symmetric = mirrored top+bottom
  speed?: number;              // animation speed multiplier (default 1)
}

export interface ConfettiEffect extends EffectBase {
  type: "confetti";
  count?: number;              // default 35
  colors?: string[];           // default rainbow palette
  spread?: number;             // horizontal spread 0-1 (default 1)
  shapes?: ("rect" | "circle" | "star")[];
}

// === PLATFORM ICONS ===

export type PlatformIconId =
  | "stories" | "reels" | "carousel" | "post"
  | "tiktok" | "youtube_shorts" | "youtube"
  | "facebook" | "twitter" | "linkedin" | "whatsapp"
  | "podcast" | "email" | "website" | "play";

export interface PlatformIconEffect extends EffectBase {
  type: "platform_icon";
  icon: PlatformIconId;
  label?: string;
  sublabel?: string;
  size?: number;            // icon size px (default 110)
  style?: "circle" | "pill" | "square" | "naked";
  background?: "frosted" | "solid" | "none";
  accent_color?: string;
}

export interface IconGroupEffect extends EffectBase {
  type: "icon_group";
  icons: Array<{
    icon: PlatformIconId;
    label?: string;
    active_at?: number;   // ABSOLUTE seconds in video when this icon highlights
    color?: string;       // icon tint when active (default white)
  }>;
  size?: number;           // px per icon (default 96)
  spacing?: number;        // gap between icons px (default 28)
  reveal_style?: "all-at-once" | "sequential";
  active_color?: string;  // glow/ring color for active icon (default BRAND)
  style?: "circle" | "naked";
  background?: "frosted" | "none";
}

// === ICON POINT — clean single icon + label for editorial emphasis ===

export interface IconPointEffect extends EffectBase {
  type: "icon_point";
  icon?: string;              // lucide-react icon name (fallback)
  icon_src?: string;          // Remotion staticFile path to PNG (preferred — from Noun Project)
  icon_query?: string;        // search term used to find the icon
  size?: number;              // icon size px (default 200)
  color?: string;             // icon color for lucide fallback
  entrance?: IconEntrance;    // "fade-settle" default
  icon_style?: IconStyle;     // only used for lucide fallback
  gradient?: GradientPreset;
  icon_shape?: IconShape;
  label?: string;
  sublabel?: string;
  label_size?: number;
  layout?: "vertical" | "horizontal";
  background?: "frosted" | "pill" | "none";
  glow?: boolean;
}

export type AnyEffect =
  | CounterEffect
  | ProgressBarEffect
  | ListRevealEffect
  | EmojiBurstEffect
  | TextCardEffect
  | StatHighlightEffect
  | BeforeAfterEffect
  | ChecklistEffect
  | QuoteCardEffect
  | HighlightBarEffect
  | CountdownEffect
  | StepIndicatorEffect
  | PullQuoteEffect
  | CTAEffect
  | PercentageEffect
  | BarChartEffect
  | TypewriterEffect
  | NeonTextEffect
  | WaveformEffect
  | ConfettiEffect
  | PlatformIconEffect
  | IconGroupEffect
  | IconPointEffect;

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND = "#E0701E";
const FROSTED = {
  background: "rgba(20,20,20,0.78)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1.5px solid rgba(255,255,255,0.16)",
} as React.CSSProperties;
const FONT = "'Heebo', sans-serif";

// ── Position resolver ─────────────────────────────────────────────────────────

function resolvePosition(pos: EffectPosition | undefined): React.CSSProperties {
  switch (pos) {
    case "top-left":      return { top: "8%",  left: 40 };
    case "top-center":    return { top: "8%",  left: "50%", transform: "translateX(-50%)" };
    case "top-right":     return { top: "8%",  right: 40 };
    case "center-left":   return { top: "42%", left: 40,  transform: "translateY(-50%)" };
    case "center-right":  return { top: "42%", right: 40, transform: "translateY(-50%)" };
    case "center-bottom": return { top: "58%", left: "50%", transform: "translateX(-50%)" };  // above captions, center
    case "bottom-left":   return { bottom: "24%", left: 40 };
    case "bottom-center": return { bottom: "28%", left: "50%", transform: "translateX(-50%)" };
    case "bottom-right":  return { bottom: "24%", right: 40 };
    default:              return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }
}

// ── Animation hook ────────────────────────────────────────────────────────────

function useAnimIn(
  frame: number,
  fps: number,
  totalFrames: number,
  animIn: AnimationIn = "scale-pop"
): React.CSSProperties {
  const fadeOut = interpolate(frame, [totalFrames - fps * 0.4, totalFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (animIn === "none") return { opacity: fadeOut };

  if (animIn === "scale-pop") {
    const sc = spring({ frame, fps, config: { damping: 12, stiffness: 220 } });
    const scaleVal = interpolate(sc, [0, 1], [0.55, 1]);
    const opIn = interpolate(frame, [0, fps * 0.2], [0, 1], { extrapolateRight: "clamp" });
    return { opacity: Math.min(opIn, fadeOut), transform: `scale(${scaleVal})` };
  }

  const opIn = interpolate(frame, [0, fps * 0.25], [0, 1], { extrapolateRight: "clamp" });
  const opacity = Math.min(opIn, fadeOut);

  const SLIDE = 120;
  const slideFrame = interpolate(frame, [0, fps * 0.3], [SLIDE, 0], { extrapolateRight: "clamp" });
  const slideUp    = interpolate(frame, [0, fps * 0.3], [-60, 0], { extrapolateRight: "clamp" });
  const slideDown  = interpolate(frame, [0, fps * 0.3], [60, 0],  { extrapolateRight: "clamp" });

  switch (animIn) {
    case "slide-left":  return { opacity, transform: `translateX(${slideFrame}px)` };
    case "slide-right": return { opacity, transform: `translateX(${-slideFrame}px)` };
    case "slide-up":    return { opacity, transform: `translateY(${slideUp}px)` };
    case "slide-down":  return { opacity, transform: `translateY(${slideDown}px)` };
    case "fade":        return { opacity };
    default:            return { opacity };
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

const CounterComp: React.FC<{ e: CounterEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in);

  const progress = interpolate(frame, [0, durationInFrames * 0.8], [0, 1], {
    extrapolateRight: "clamp",
    easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  });
  const val = Math.round(e.from + (e.to - e.from) * progress);
  const display = `${e.prefix ?? ""}${val.toLocaleString("he-IL")}${e.suffix ?? ""}`;
  const color = e.color ?? BRAND;
  const bg = e.background === "frosted" ? FROSTED : e.background === "solid"
    ? { background: e.background_color ?? "rgba(0,0,0,0.85)" } : {};

  return (
    <div style={{ ...anim, display: "flex", flexDirection: "column", alignItems: "center",
      padding: "28px 44px", borderRadius: 24, ...bg }}>
      {e.icon && (
        <div style={{ marginBottom: 12 }}>
          <SupportIcon name={e.icon} size={e.icon_size ?? 40} color={color}
            entrance="fade-settle" strokeWidth={2} />
        </div>
      )}
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: e.font_size ?? 130, color,
        lineHeight: 1, textShadow: `0 0 40px ${color}55` }}>
        {display}
      </span>
      {e.label && (
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 38, color: "#fff",
          marginTop: 8, direction: "rtl" }}>
          {e.label}
        </span>
      )}
    </div>
  );
};

const ProgressBarComp: React.FC<{ e: ProgressBarEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "slide-up");

  const fillP = interpolate(frame, [fps * 0.3, durationInFrames * 0.85], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const pct = e.from_pct + (e.to_pct - e.from_pct) * fillP;
  const color = e.color ?? BRAND;
  const w = e.width ?? 820;
  const h = e.height ?? 22;
  const r = e.border_radius ?? h / 2;

  return (
    <div style={{ ...anim, display: "flex", flexDirection: "column", alignItems: "center",
      gap: 16, direction: "rtl" }}>
      {e.label && (
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 36, color: "#fff" }}>
          {e.label}
          {e.show_percentage && (
            <span style={{ color, marginRight: 12 }}>{Math.round(pct)}%</span>
          )}
        </span>
      )}
      <div style={{ width: w, height: h, borderRadius: r,
        background: e.track_color ?? "rgba(255,255,255,0.2)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: r,
          background: color, transition: "none",
          boxShadow: `0 0 12px ${color}88` }} />
      </div>
    </div>
  );
};

const ListRevealComp: React.FC<{ e: ListRevealEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "slide-right");
  const delay = (e.item_delay_seconds ?? 0.6) * fps;
  const bg = e.background === "frosted" ? FROSTED
    : e.background === "solid" ? { background: "rgba(0,0,0,0.8)" } : {};

  return (
    <div style={{ ...anim, display: "flex", flexDirection: "column", gap: 18,
      padding: e.background !== "none" ? "24px 36px" : 0,
      borderRadius: 20, maxWidth: 700, ...bg }}>
      {e.items.map((item, i) => {
        const itemFrame = Math.max(0, frame - i * delay);
        const opacity = interpolate(itemFrame, [0, fps * 0.35], [0, 1], { extrapolateRight: "clamp" });
        const tx = interpolate(itemFrame, [0, fps * 0.35], [-50, 0], { extrapolateRight: "clamp" });
        return (
          <div key={i} style={{ opacity, transform: `translateX(${tx}px)`,
            display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 16 }}>
            {e.icon && <span style={{ fontSize: 36 }}>{e.icon}</span>}
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: e.font_size ?? 40,
              color: e.color ?? "#fff", direction: "rtl",
              textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
              {item}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Seeded random for stable emoji positions across frames
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const EmojiBurstComp: React.FC<{ e: EmojiBurstEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const count = e.count ?? 8;

  return (
    <div style={{ position: "relative", width: 600, height: 800 }}>
      {Array.from({ length: count }).map((_, i) => {
        const startF = (i / count) * fps * 0.5;
        const f = Math.max(0, frame - startF);
        const progress = interpolate(f, [0, durationInFrames * 0.9], [0, 1], {
          extrapolateRight: "clamp",
        });
        const xBase = seededRand(i * 17) * 540 + 30;
        const yTravel = 400 + seededRand(i * 31) * 300;
        const opacity = interpolate(progress, [0, 0.15, 0.75, 1], [0, 1, 1, 0]);
        const y = 700 - yTravel * progress;
        const scale = interpolate(progress, [0, 0.2, 1], [0.4, 1.2, 0.8]);
        return (
          <span key={i} style={{
            position: "absolute", left: xBase, top: y,
            fontSize: 52, opacity, transform: `scale(${scale})`,
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
          }}>
            {e.emoji}
          </span>
        );
      })}
    </div>
  );
};

const TextCardComp: React.FC<{ e: TextCardEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "scale-pop");

  const styleMap: Record<string, React.CSSProperties> = {
    frosted: { ...FROSTED },
    solid: { background: e.background_color ?? "rgba(10,10,10,0.88)" },
    outline: { background: "transparent", border: `2.5px solid ${e.border_color ?? BRAND}` },
    minimal: { background: "transparent" },
  };
  const cardStyle = styleMap[e.style ?? "frosted"] ?? FROSTED;
  const align = e.text_align ?? "right";

  const iconColor = e.icon_color ?? e.border_color ?? BRAND;
  return (
    <div style={{ ...anim, ...cardStyle, padding: "24px 36px",
      borderRadius: 20, maxWidth: e.width ?? 780, direction: "rtl" }}>
      {(e.title || e.icon) && (
        <div style={{ display: "flex", alignItems: "center", gap: 14,
          marginBottom: 10, justifyContent: align === "center" ? "center" : "flex-start" }}>
          {e.icon && (
            <SupportIcon name={e.icon} size={e.icon_size ?? 40} color={iconColor}
              entrance="fade" delay={0.08} strokeWidth={1.8} />
          )}
          {e.title && (
            <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: e.title_font_size ?? 44,
              color: iconColor }}>
              {e.title}
            </span>
          )}
        </div>
      )}
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: e.font_size ?? 38,
        color: "#fff", lineHeight: 1.45, textAlign: align,
        textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>
        {e.body}
      </div>
    </div>
  );
};

const StatHighlightComp: React.FC<{ e: StatHighlightEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "scale-pop");
  const color = e.accent_color ?? BRAND;
  const bg = e.background === "frosted" ? FROSTED
    : e.background === "none" ? {} : { background: "rgba(0,0,0,0.82)" };

  return (
    <div style={{ ...anim, ...bg, padding: "28px 48px", borderRadius: 24,
      display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl" }}>
      {e.icon && (
        <div style={{ marginBottom: 10 }}>
          <SupportIcon name={e.icon} size={e.icon_size ?? 44} color={color}
            entrance="fade-settle" strokeWidth={1.8} />
        </div>
      )}
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 120, color,
        lineHeight: 1, textShadow: `0 0 32px ${color}66` }}>
        {e.number}
      </span>
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: "#fff", marginTop: 4 }}>
        {e.label}
      </span>
      {e.sublabel && (
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 30, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
          {e.sublabel}
        </span>
      )}
    </div>
  );
};

const BeforeAfterComp: React.FC<{ e: BeforeAfterEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "scale-pop");

  const dividerX = e.split_animated
    ? interpolate(frame, [fps * 0.3, fps * 0.9], [50, 50], { extrapolateRight: "clamp" })
    : 50;

  return (
    <div style={{ ...anim, display: "flex", borderRadius: 20, overflow: "hidden",
      width: 740, height: 200, border: "2px solid rgba(255,255,255,0.2)" }}>
      <div style={{ flex: 1, background: e.left_color ?? "rgba(220,50,50,0.85)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {e.left_icon && <span style={{ fontSize: 48 }}>{e.left_icon}</span>}
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, color: "#fff",
          direction: "rtl" }}>{e.left_label ?? "לפני"}</span>
      </div>
      <div style={{ width: 4, background: "rgba(255,255,255,0.9)", flexShrink: 0 }} />
      <div style={{ flex: 1, background: e.right_color ?? "rgba(50,180,80,0.85)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {e.right_icon && <span style={{ fontSize: 48 }}>{e.right_icon}</span>}
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, color: "#fff",
          direction: "rtl" }}>{e.right_label ?? "אחרי"}</span>
      </div>
    </div>
  );
};

const ChecklistComp: React.FC<{ e: ChecklistEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = (e.item_delay_seconds ?? 0.7) * fps;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {e.items.map((item, i) => {
        const f = Math.max(0, frame - i * delay);
        const opacity = interpolate(f, [0, fps * 0.35], [0, 1], { extrapolateRight: "clamp" });
        const tx = interpolate(f, [0, fps * 0.35], [-60, 0], { extrapolateRight: "clamp" });
        const icon = item.checked ? "✅" : "❌";
        return (
          <div key={i} style={{ opacity, transform: `translateX(${tx}px)`,
            display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 40 }}>{icon}</span>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: e.font_size ?? 40,
              color: "#fff", direction: "rtl", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
              {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const QuoteCardComp: React.FC<{ e: QuoteCardEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "scale-pop");
  const color = e.accent_color ?? BRAND;
  const cardStyle: React.CSSProperties = e.style === "frosted" ? { ...FROSTED }
    : e.style === "bordered" ? { background: "rgba(0,0,0,0.8)", border: `3px solid ${color}` }
    : { background: "transparent" };

  return (
    <div style={{ ...anim, ...cardStyle, padding: "30px 40px", borderRadius: 20,
      maxWidth: 800, direction: "rtl", position: "relative" }}>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 80, color,
        lineHeight: 0.6, display: "block", marginBottom: 8 }}>"</span>
      <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 42, color: "#fff",
        lineHeight: 1.5, margin: 0 }}>
        {e.text}
      </p>
      {e.author && (
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 30,
          color: "rgba(255,255,255,0.65)", marginTop: 12, display: "block" }}>
          — {e.author}
        </span>
      )}
    </div>
  );
};

const HighlightBarComp: React.FC<{ e: HighlightBarEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "fade");

  const barWidth = interpolate(frame, [fps * 0.1, fps * 0.6], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ ...anim, display: "inline-flex", alignItems: "center", gap: 14, direction: "rtl" }}>
      {e.icon && (
        <SupportIcon name={e.icon} size={e.icon_size ?? 36} color={e.text_color ?? "#fff"}
          entrance="fade" delay={0.05} strokeWidth={2} />
      )}
      <div style={{ position: "relative", display: "inline-block" }}>
        <div style={{
          position: "absolute", inset: -6, background: e.bar_color ?? BRAND,
          borderRadius: 8, width: `${barWidth}%`, zIndex: 0,
        }} />
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: e.font_size ?? 56,
          color: e.text_color ?? "#fff", position: "relative", zIndex: 1,
          padding: "4px 12px" }}>
          {e.text}
        </span>
      </div>
    </div>
  );
};

const CountdownComp: React.FC<{ e: CountdownEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "scale-pop");

  const elapsed = frame / fps;
  const remaining = Math.max(0, Math.ceil(e.seconds - elapsed));
  const color = e.color ?? BRAND;

  return (
    <div style={{ ...anim, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontFamily: e.style === "digital" ? "monospace" : FONT,
        fontWeight: 900, fontSize: 130, color, lineHeight: 1,
        textShadow: `0 0 40px ${color}55` }}>
        {remaining}
      </span>
      {e.label && (
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 36, color: "#fff",
          direction: "rtl" }}>{e.label}</span>
      )}
    </div>
  );
};

const StepIndicatorComp: React.FC<{ e: StepIndicatorEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "slide-up");
  const color = e.color ?? BRAND;

  if (e.style === "bar") {
    const pct = (e.current / e.total) * 100;
    return (
      <div style={{ ...anim, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        {e.label && <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 34, color: "#fff", direction: "rtl" }}>{e.label}</span>}
        <div style={{ width: 600, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.2)" }}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 7, background: color }} />
        </div>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, color: "rgba(255,255,255,0.7)" }}>
          שלב {e.current} מתוך {e.total}
        </span>
      </div>
    );
  }

  // dots or numbers
  return (
    <div style={{ ...anim, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {e.label && <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 36, color: "#fff", direction: "rtl" }}>{e.label}</span>}
      <div style={{ display: "flex", gap: 16 }}>
        {Array.from({ length: e.total }).map((_, i) => {
          const active = i + 1 === e.current;
          const done   = i + 1 < e.current;
          if (e.style === "numbers") {
            return (
              <div key={i} style={{ width: 54, height: 54, borderRadius: "50%",
                background: active ? color : done ? `${color}66` : "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: "#fff" }}>{i + 1}</span>
              </div>
            );
          }
          return (
            <div key={i} style={{ width: active ? 32 : 18, height: 18, borderRadius: 9,
              background: active ? color : done ? `${color}88` : "rgba(255,255,255,0.25)",
              transition: "none" }} />
          );
        })}
      </div>
    </div>
  );
};

const PullQuoteComp: React.FC<{ e: PullQuoteEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const color = e.color ?? BRAND;

  let style: React.CSSProperties = {};
  if (e.animate === "scale-in") {
    const sc = spring({ frame, fps, config: { damping: 10, stiffness: 180 } });
    const scV = interpolate(sc, [0, 1], [0.4, 1]);
    const op = interpolate(frame, [0, fps * 0.25], [0, 1], { extrapolateRight: "clamp" });
    style = { transform: `scale(${scV})`, opacity: op };
  } else {
    const op = interpolate(frame, [0, fps * 0.35], [0, 1], { extrapolateRight: "clamp" });
    const fadeOut = interpolate(frame, [durationInFrames - fps * 0.4, durationInFrames - 2], [1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
    style = { opacity: Math.min(op, fadeOut) };
  }

  return (
    <div style={{ ...style, display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl" }}>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: e.font_size ?? 140,
        color, lineHeight: 1, textShadow: `0 0 60px ${color}66` }}>
        {e.word}
      </span>
      {e.translation && (
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 44, color: "rgba(255,255,255,0.8)", marginTop: 8 }}>
          {e.translation}
        </span>
      )}
    </div>
  );
};

const CTAComp: React.FC<{ e: CTAEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "slide-up");
  const color = e.color ?? BRAND;
  const cardStyle: React.CSSProperties = e.style === "solid"
    ? { background: color } : { ...FROSTED };

  return (
    <div style={{ ...anim, ...cardStyle, padding: "28px 48px", borderRadius: 24,
      display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl",
      minWidth: 600 }}>
      {e.icon && (
        <div style={{ marginBottom: 14 }}>
          <SupportIcon name={e.icon} size={e.icon_size ?? 44} color="#fff"
            entrance="fade-settle" strokeWidth={1.8} />
        </div>
      )}
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 48, color: "#fff",
        lineHeight: 1.3 }}>{e.text}</span>
      {e.subtext && (
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 34,
          color: "rgba(255,255,255,0.75)", marginTop: 8 }}>{e.subtext}</span>
      )}
      {e.button_text && (
        <div style={{ marginTop: 20, background: color, borderRadius: 50,
          padding: "12px 36px" }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#fff" }}>
            {e.button_text}
          </span>
        </div>
      )}
    </div>
  );
};

const PercentageComp: React.FC<{ e: PercentageEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "scale-pop");
  const color = e.color ?? BRAND;

  const animatedVal = e.animate
    ? interpolate(frame, [fps * 0.2, durationInFrames * 0.8], [0, e.value], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
        easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      })
    : e.value;

  if (e.style === "circle") {
    const R = 100;
    const circ = 2 * Math.PI * R;
    const dashOffset = circ * (1 - animatedVal / 100);
    return (
      <div style={{ ...anim, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <svg width={260} height={260} viewBox="0 0 260 260">
          <circle cx={130} cy={130} r={R} fill="none"
            stroke="rgba(255,255,255,0.15)" strokeWidth={18} />
          <circle cx={130} cy={130} r={R} fill="none"
            stroke={color} strokeWidth={18}
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 130 130)" />
          <text x={130} y={130} textAnchor="middle" dominantBaseline="central"
            fontFamily={FONT} fontWeight={900} fontSize={60} fill={color}>
            {Math.round(animatedVal)}%
          </text>
        </svg>
        {e.label && (
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 36, color: "#fff", direction: "rtl" }}>
            {e.label}
          </span>
        )}
      </div>
    );
  }

  // bar style
  return (
    <div style={{ ...anim, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {e.label && (
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 38, color: "#fff", direction: "rtl" }}>
          {e.label}
        </span>
      )}
      <div style={{ width: 800, height: 26, borderRadius: 13, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
        <div style={{ width: `${animatedVal}%`, height: "100%", background: color,
          borderRadius: 13, boxShadow: `0 0 16px ${color}88` }} />
      </div>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, color }}>
        {Math.round(animatedVal)}%
      </span>
    </div>
  );
};

// ── Swishy-inspired components ────────────────────────────────────────────────

const BarChartComp: React.FC<{ e: BarChartEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "slide-up");

  const maxVal = e.max_value ?? Math.max(...e.bars.map((b) => b.value));
  const barW = e.bar_width ?? 80;
  const totalW = e.bars.length * barW + (e.bars.length - 1) * 16;
  const chartH = 240;
  const delay = fps * 0.18;
  const bg = e.background === "frosted" ? FROSTED
    : e.background === "solid" ? { background: "rgba(0,0,0,0.82)" } : {};

  return (
    <div style={{ ...anim, ...bg, padding: "24px 32px", borderRadius: 20, direction: "rtl" }}>
      {e.title && (
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: "#fff",
          textAlign: "center", marginBottom: 18, direction: "rtl" }}>
          {e.title}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: chartH }}>
        {e.bars.map((bar, i) => {
          const barFrame = Math.max(0, frame - i * delay);
          const growP = interpolate(barFrame, [0, fps * 0.55], [0, 1], {
            extrapolateRight: "clamp",
            easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
          });
          const barH = (bar.value / maxVal) * (chartH - 60) * growP;
          const color = bar.color ?? e.bar_color ?? BRAND;
          const displayVal = e.value_suffix
            ? `${bar.value}${e.value_suffix}`
            : bar.value.toLocaleString();

          return (
            <div key={i} style={{ display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "flex-end", width: barW, height: chartH }}>
              {e.show_values !== false && (
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color,
                  marginBottom: 6, opacity: growP }}>
                  {displayVal}
                </span>
              )}
              <div style={{ width: barW, height: barH, borderRadius: "8px 8px 0 0",
                background: `linear-gradient(to top, ${color}cc, ${color})`,
                boxShadow: `0 0 18px ${color}66`, minHeight: growP > 0 ? 4 : 0 }} />
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 24,
                color: "rgba(255,255,255,0.75)", marginTop: 8, direction: "rtl",
                maxWidth: barW, textAlign: "center", lineHeight: 1.2 }}>
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ width: totalW + 64, height: 2, background: "rgba(255,255,255,0.25)",
        marginTop: 4, borderRadius: 2 }} />
    </div>
  );
};

const TypewriterComp: React.FC<{ e: TypewriterEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "fade");

  const cps = e.chars_per_second ?? 12;
  const visibleChars = Math.min(Math.floor(frame / fps * cps), e.text.length);
  const visible = e.text.slice(0, visibleChars);
  const showCursor = e.cursor !== false;
  // Blink: visible half the time, rate = 1.5 Hz
  const cursorOn = Math.floor(frame / (fps / 3)) % 2 === 0;
  const color = e.color ?? "#fff";
  const bg = e.background === "frosted" ? FROSTED
    : e.background === "solid" ? { background: "rgba(0,0,0,0.82)" } : {};

  return (
    <div style={{ ...anim, ...bg, padding: "20px 32px", borderRadius: 16,
      maxWidth: 800, direction: "rtl" }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: e.font_size ?? 52,
        color, lineHeight: 1.4, textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
        {visible}
        {showCursor && (
          <span style={{ opacity: cursorOn ? 1 : 0, color: BRAND, marginRight: 2 }}>|</span>
        )}
      </span>
    </div>
  );
};

const NeonTextComp: React.FC<{ e: NeonTextEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "scale-pop");
  const color = e.color ?? "#00FFFF";

  // Pulse: glow intensity oscillates between 60% and 100%
  const glowStrength = e.pulse !== false
    ? 0.8 + 0.2 * Math.sin((frame / fps) * Math.PI * 2.5)
    : 1;

  const textGlow = `
    0 0 8px ${color}ff,
    0 0 22px ${color}dd,
    0 0 46px ${color}${Math.round(glowStrength * 255).toString(16).padStart(2, "0")},
    0 0 90px ${color}${Math.round(glowStrength * 140).toString(16).padStart(2, "0")}
  `.trim();

  return (
    <div style={{ ...anim, display: "flex", flexDirection: "column",
      alignItems: "center", direction: "rtl" }}>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: e.font_size ?? 96,
        color, lineHeight: 1.1, textShadow: textGlow,
        letterSpacing: 2 }}>
        {e.text}
      </span>
      {e.second_line && (
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: (e.font_size ?? 96) * 0.55,
          color: "rgba(255,255,255,0.85)", marginTop: 8,
          textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
          {e.second_line}
        </span>
      )}
    </div>
  );
};

const WaveformComp: React.FC<{ e: WaveformEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barCount = e.bars ?? 24;
  const maxH = e.height ?? 120;
  const totalW = e.width ?? 600;
  const barW = Math.floor((totalW - (barCount - 1) * 4) / barCount);
  const color = e.color ?? BRAND;
  const speed = e.speed ?? 1;
  const symmetric = e.style === "symmetric";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, width: totalW,
      height: symmetric ? maxH * 2 + 4 : maxH }}>
      {Array.from({ length: barCount }).map((_, i) => {
        const seed1 = seededRand(i * 13 + 7);
        const seed2 = seededRand(i * 29 + 3);
        // Animate height: base + wave that moves across bars
        const wave = Math.abs(Math.sin((frame / fps) * speed * Math.PI * 2 + i * 0.45));
        const wave2 = Math.abs(Math.sin((frame / fps) * speed * Math.PI * 1.3 + i * 0.3 + 1.2));
        const h = Math.max(8, (seed1 * 0.4 + seed2 * 0.15 + wave * 0.3 + wave2 * 0.15) * maxH);
        const opacity = 0.6 + 0.4 * seededRand(i * 7);

        if (symmetric) {
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4 }}>
              <div style={{ width: barW, height: h, borderRadius: barW / 2,
                background: color, opacity, boxShadow: `0 0 8px ${color}88` }} />
              <div style={{ width: barW, height: h, borderRadius: barW / 2,
                background: color, opacity, boxShadow: `0 0 8px ${color}88` }} />
            </div>
          );
        }

        return (
          <div key={i} style={{ width: barW, height: h, borderRadius: barW / 2,
            background: `linear-gradient(to top, ${color}, ${color}aa)`,
            opacity, boxShadow: `0 0 6px ${color}66`, alignSelf: "flex-end" }} />
        );
      })}
    </div>
  );
};

const ConfettiComp: React.FC<{ e: ConfettiEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const count = e.count ?? 35;
  const spread = e.spread ?? 1;
  const palette = e.colors ?? [
    "#FF6B6B", "#FFE66D", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98FB98", "#FF8C69", "#87CEEB",
  ];
  const shapes = e.shapes ?? ["rect", "circle", "rect"];

  return (
    <div style={{ position: "relative", width: 800, height: 900, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const startF = seededRand(i * 11) * fps * 0.6;
        const f = Math.max(0, frame - startF);
        if (f <= 0) return null;

        const xBase = (seededRand(i * 7 + 1) - 0.5) * 800 * spread + 400;
        const yStart = -40 - seededRand(i * 3) * 100;
        const fallSpeed = 500 + seededRand(i * 5) * 400; // px per second
        const drift = (seededRand(i * 17) - 0.5) * 200;
        const rotation = f / fps * (200 + seededRand(i * 13) * 400) * (seededRand(i) > 0.5 ? 1 : -1);
        const y = yStart + (f / fps) * fallSpeed;
        const x = xBase + drift * Math.sin(f / fps * 2);

        const opacity = interpolate(f, [0, fps * 0.2, durationInFrames * 0.8, durationInFrames * 0.95],
          [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        if (y > 950) return null;

        const color = palette[i % palette.length];
        const size = 12 + seededRand(i * 23) * 14;
        const shape = shapes[i % shapes.length];

        const shapeStyle: React.CSSProperties = shape === "circle"
          ? { width: size, height: size, borderRadius: "50%", background: color }
          : shape === "star"
          ? { width: 0, height: 0, fontSize: size + 4, lineHeight: 1 }
          : { width: size, height: size * 0.55, background: color, borderRadius: 2 };

        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            transform: `rotate(${rotation}deg)`,
            opacity,
            ...shapeStyle,
          }}>
            {shape === "star" && <span style={{ fontSize: size + 4, color }}>★</span>}
          </div>
        );
      })}
    </div>
  );
};

// ── Platform SVG icon library ─────────────────────────────────────────────────

function PlatformSVG({ icon, size = 64, color = "#fff" }: {
  icon: PlatformIconId; size?: number; color?: string;
}): React.ReactElement {
  const s = size;
  const gid = `grad-${icon}`;

  switch (icon) {
    case "stories":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" overflow="visible">
          <defs>
            <linearGradient id={gid} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#FFCB2D"/>
              <stop offset="30%"  stopColor="#FF4F3B"/>
              <stop offset="65%"  stopColor="#D300C5"/>
              <stop offset="100%" stopColor="#7638FA"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#${gid})`} strokeWidth="9" strokeLinecap="round"/>
          {/* Camera body */}
          <rect x="31" y="37" width="38" height="26" rx="6" fill={color} opacity="0.93"/>
          {/* Lens */}
          <circle cx="50" cy="50" r="8" fill="rgba(20,20,20,0.55)"/>
          <circle cx="50" cy="50" r="5.5" fill={color}/>
          {/* Viewfinder bump */}
          <rect x="53" y="32" width="9" height="6" rx="2.5" fill={color} opacity="0.75"/>
        </svg>
      );

    case "reels":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          {/* Film strip frame */}
          <rect x="18" y="18" width="64" height="64" rx="10" fill="none" stroke={color} strokeWidth="5"/>
          {/* Film perforations */}
          <rect x="20" y="20" width="9" height="11" rx="2" fill={color} opacity="0.55"/>
          <rect x="71" y="20" width="9" height="11" rx="2" fill={color} opacity="0.55"/>
          <rect x="20" y="69" width="9" height="11" rx="2" fill={color} opacity="0.55"/>
          <rect x="71" y="69" width="9" height="11" rx="2" fill={color} opacity="0.55"/>
          {/* Play triangle */}
          <polygon points="40,32 40,68 72,50" fill={color} opacity="0.9"/>
        </svg>
      );

    case "carousel":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          {/* Back cards (stacked behind) */}
          <rect x="30" y="16" width="52" height="56" rx="7" fill={color} opacity="0.25"/>
          <rect x="22" y="22" width="52" height="56" rx="7" fill={color} opacity="0.45"/>
          {/* Front card */}
          <rect x="14" y="28" width="52" height="56" rx="7" fill={color} opacity="0.92"/>
          {/* Simple image icon inside */}
          <circle cx="30" cy="45" r="7" fill="rgba(0,0,0,0.35)"/>
          <polygon points="20,72 40,55 55,66 65,55 72,72" fill="rgba(0,0,0,0.35)"/>
          {/* Pagination dots */}
          <circle cx="32" cy="93" r="4.5" fill={color}/>
          <circle cx="47" cy="93" r="3" fill={color} opacity="0.45"/>
          <circle cx="60" cy="93" r="3" fill={color} opacity="0.45"/>
        </svg>
      );

    case "post":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="14" y="14" width="72" height="72" rx="10" fill="none" stroke={color} strokeWidth="5"/>
          <circle cx="34" cy="36" r="8" fill={color} opacity="0.75"/>
          <polygon points="16,80 40,52 58,66 72,50 86,80" fill={color} opacity="0.75"/>
        </svg>
      );

    case "tiktok":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          {/* TikTok note silhouette */}
          <path d={
            "M62 12 L62 62 " +
            "C62 74 52 82 42 78 C32 74 28 64 34 56 C40 48 52 48 58 54 " +
            "L58 40 C44 34 28 42 24 56 C20 70 30 84 46 88 C62 92 76 80 76 62 " +
            "L76 28 C82 34 90 36 90 36 L90 20 C80 20 70 16 62 12 Z"
          } fill={color}/>
        </svg>
      );

    case "youtube_shorts":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="10" y="22" width="80" height="56" rx="14" fill="#FF0000"/>
          <polygon points="40,34 40,66 68,50" fill="white"/>
          {/* Lightning bolt for Shorts */}
          <polygon points="62,12 56,30 64,30 58,48 72,26 64,26 70,12" fill="#FFD600"/>
        </svg>
      );

    case "youtube":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="8" y="22" width="84" height="56" rx="15" fill="#FF0000"/>
          <polygon points="40,33 40,67 70,50" fill="white"/>
        </svg>
      );

    case "facebook":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="8" y="8" width="84" height="84" rx="20" fill="#1877F2"/>
          {/* Bold f */}
          <path d="M57 38 L57 30 C57 27 59 25 62 25 L68 25 L68 15 L60 15 C50 15 44 21 44 31 L44 38 L36 38 L36 48 L44 48 L44 78 L57 78 L57 48 L65 48 L67 38 Z"
            fill="white"/>
        </svg>
      );

    case "twitter":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="8" y="8" width="84" height="84" rx="18" fill="#000"/>
          {/* X */}
          <line x1="24" y1="24" x2="76" y2="76" stroke="white" strokeWidth="12" strokeLinecap="round"/>
          <line x1="76" y1="24" x2="24" y2="76" stroke="white" strokeWidth="12" strokeLinecap="round"/>
        </svg>
      );

    case "linkedin":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="8" y="8" width="84" height="84" rx="16" fill="#0A66C2"/>
          {/* in */}
          <rect x="22" y="38" width="13" height="40" rx="2" fill="white"/>
          <circle cx="28" cy="26" r="8" fill="white"/>
          <path d="M42 38 L55 38 L55 44 C58 40 64 36 72 36 C84 36 86 46 86 54 L86 78 L73 78 L73 58 C73 52 72 46 66 46 C60 46 55 52 55 58 L55 78 L42 78 Z"
            fill="white"/>
        </svg>
      );

    case "whatsapp":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="#25D366"/>
          {/* Phone handset */}
          <path d={
            "M30 34 C30 32 32 28 38 28 C42 28 46 34 47 38 L43 44 " +
            "C46 49 52 55 57 58 L62 54 C66 54 72 58 72 62 C72 66 68 70 66 70 " +
            "C60 72 40 68 30 34 Z"
          } fill="white"/>
        </svg>
      );

    case "podcast":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          {/* Mic body */}
          <rect x="37" y="14" width="26" height="42" rx="13" fill={color}/>
          {/* Sound arc */}
          <path d="M22 50 C22 68 34 78 50 78 C66 78 78 68 78 50"
            fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"/>
          {/* Stand */}
          <line x1="50" y1="78" x2="50" y2="91" stroke={color} strokeWidth="6" strokeLinecap="round"/>
          <line x1="34" y1="91" x2="66" y2="91" stroke={color} strokeWidth="6" strokeLinecap="round"/>
        </svg>
      );

    case "email":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="10" y="24" width="80" height="56" rx="9" fill="none" stroke={color} strokeWidth="5.5"/>
          <polyline points="10,30 50,60 90,30" fill="none" stroke={color} strokeWidth="5.5" strokeLinejoin="round"/>
        </svg>
      );

    case "website":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="5.5"/>
          <line x1="8"  y1="50" x2="92" y2="50" stroke={color} strokeWidth="4.5"/>
          <line x1="50" y1="8"  x2="50" y2="92" stroke={color} strokeWidth="4"/>
          {/* Latitude lines */}
          <path d="M20 30 Q50 20 80 30" fill="none" stroke={color} strokeWidth="3.5"/>
          <path d="M20 70 Q50 80 80 70" fill="none" stroke={color} strokeWidth="3.5"/>
        </svg>
      );

    case "play":
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="6"/>
          <polygon points="40,28 40,72 74,50" fill={color}/>
        </svg>
      );

    default:
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="6"/>
          <text x="50" y="62" textAnchor="middle" fontSize="42" fill={color}>?</text>
        </svg>
      );
  }
}

// ── PlatformIcon component ─────────────────────────────────────────────────────

const PlatformIconComp: React.FC<{ e: PlatformIconEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "scale-pop");
  const sz = e.size ?? 110;
  const color = e.accent_color ?? "#fff";

  const containerStyle: React.CSSProperties =
    e.style === "circle"
      ? {
          borderRadius: "50%",
          width: sz * 1.4,
          height: sz * 1.4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }
      : e.style === "square"
      ? {
          borderRadius: 18,
          width: sz * 1.4,
          height: sz * 1.4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }
      : e.style === "pill"
      ? {
          borderRadius: 999,
          padding: "14px 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }
      : {};

  const bg: React.CSSProperties =
    e.background === "frosted"
      ? FROSTED
      : e.background === "solid"
      ? { background: "rgba(0,0,0,0.82)" }
      : {};

  return (
    <div style={{ ...anim, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ ...containerStyle, ...bg }}>
        <PlatformSVG icon={e.icon} size={sz} color={color} />
      </div>
      {e.label && (
        <span style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 36, color: "#fff",
          direction: "rtl", textShadow: "0 2px 10px rgba(0,0,0,0.85)",
          textAlign: "center", maxWidth: sz * 1.6,
        }}>
          {e.label}
        </span>
      )}
      {e.sublabel && (
        <span style={{
          fontFamily: FONT, fontWeight: 500, fontSize: 27,
          color: "rgba(255,255,255,0.72)", direction: "rtl", textAlign: "center",
          maxWidth: sz * 1.6, marginTop: -4,
        }}>
          {e.sublabel}
        </span>
      )}
    </div>
  );
};

// ── IconGroup component ────────────────────────────────────────────────────────

const IconGroupComp: React.FC<{ e: IconGroupEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = useAnimIn(frame, fps, durationInFrames, e.animation_in ?? "slide-up");
  const sz = e.size ?? 96;
  const spacing = e.spacing ?? 28;
  const accentColor = e.active_color ?? BRAND;

  // Determine if any icon has active_at — if so, use highlight logic
  const hasActiveAt = e.icons.some((ic) => ic.active_at != null);

  return (
    <div style={{
      ...anim,
      display: "flex",
      flexDirection: "row",
      gap: spacing,
      alignItems: "flex-end",
    }}>
      {e.icons.map((item, i) => {
        // Sequential reveal: each icon appears i*0.35s after sequence start
        const revealFrame =
          e.reveal_style === "sequential" ? Math.round(i * fps * 0.35) : 0;
        const revealed = frame >= revealFrame;

        // Active state: highlight when its absolute time is reached
        // active_at is absolute video time; e.start is absolute start of this effect
        const activeAtRelFrame =
          item.active_at != null
            ? Math.round((item.active_at - e.start) * fps)
            : null;
        const isActive =
          activeAtRelFrame != null ? frame >= activeAtRelFrame : !hasActiveAt;

        // Next icon activates at…
        const nextItem = e.icons[i + 1];
        const nextActiveRelFrame =
          nextItem?.active_at != null
            ? Math.round((nextItem.active_at - e.start) * fps)
            : null;
        // If next icon's active time has passed, this one is no longer the "current" active
        const isCurrent =
          isActive && (nextActiveRelFrame == null || frame < nextActiveRelFrame);

        const opacity = revealed ? (isActive || !hasActiveAt ? 1 : 0.38) : 0;
        const scale = isCurrent ? 1.18 : isActive ? 1.0 : 0.82;
        const iconColor = isActive ? (item.color ?? "#fff") : "rgba(255,255,255,0.55)";
        const glowShadow = isCurrent
          ? `0 0 28px ${accentColor}cc, 0 0 12px ${accentColor}66`
          : "none";

        const containerStyle: React.CSSProperties =
          e.style === "circle"
            ? {
                borderRadius: "50%",
                width: sz * 1.3,
                height: sz * 1.3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...(e.background === "frosted" ? FROSTED : {}),
                ...(isCurrent
                  ? {
                      border: `2.5px solid ${accentColor}`,
                      boxShadow: `0 0 20px ${accentColor}55`,
                    }
                  : isActive
                  ? { border: `1.5px solid rgba(255,255,255,0.25)` }
                  : { border: `1px solid rgba(255,255,255,0.1)` }),
              }
            : {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...(isCurrent ? { filter: `drop-shadow(${glowShadow})` } : {}),
              };

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              opacity,
              transform: `scale(${scale})`,
              // Note: Remotion doesn't support CSS transitions; we rely on
              // frame-by-frame interpolation via spring/interpolate instead.
              // Simple discrete jump is acceptable for icon highlight.
            }}
          >
            <div style={containerStyle}>
              <PlatformSVG icon={item.icon} size={sz} color={iconColor} />
            </div>
            {item.label && (
              <span
                style={{
                  fontFamily: FONT,
                  fontWeight: isCurrent ? 800 : 600,
                  fontSize: 28,
                  color: isCurrent ? "#fff" : "rgba(255,255,255,0.5)",
                  direction: "rtl",
                  textShadow: "0 2px 8px rgba(0,0,0,0.85)",
                  textAlign: "center",
                  maxWidth: sz * 1.4,
                }}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Icon Point — clean editorial icon + label ────────────────────────────────

const IconPointComp: React.FC<{ e: IconPointEffect }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const iconSize = e.size ?? 200;

  // ── Entry: fade-up (0.3s) ──────────────────────────────────────────────
  const ENTER = Math.round(fps * 0.3);
  const opIn = interpolate(frame, [0, ENTER], [0, 0.92], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const entryY = interpolate(frame, [0, ENTER], [40, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ── Exit: fade-down (0.3s) ─────────────────────────────────────────────
  const EXIT = Math.round(fps * 0.3);
  const exitStart = durationInFrames - EXIT;
  const opOut = interpolate(frame, [exitStart, durationInFrames - 1], [0.92, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const exitY = interpolate(frame, [exitStart, durationInFrames - 1], [0, 40], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const opacity = Math.min(opIn, opOut);
  const ty = frame >= exitStart ? exitY : entryY;

  // ── Render: prefer Noun Project PNG, fallback to lucide ────────────────
  if (e.icon_src) {
    const src = e.icon_src.startsWith("http") ? e.icon_src : staticFile(e.icon_src);
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity, transform: `translateY(${ty}px)`, willChange: "opacity, transform",
      }}>
        <Img src={src} width={iconSize} height={iconSize}
          style={{ objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }} />
      </div>
    );
  }

  // Fallback: lucide-react icon
  const color = e.color ?? "#FFFFFF";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity, transform: `translateY(${ty}px)`, willChange: "opacity, transform",
    }}>
      <SupportIcon name={e.icon ?? "Circle"} size={iconSize} color={color}
        entrance="none" strokeWidth={1.6} maxOpacity={1} fadeOut={false}
        iconStyle={e.icon_style} gradient={e.gradient} shape={e.icon_shape} />
    </div>
  );
};

// ── Dispatcher ────────────────────────────────────────────────────────────────

function renderEffect(effect: AnyEffect): React.ReactNode {
  switch (effect.type) {
    case "counter":        return <CounterComp e={effect} />;
    case "progress_bar":   return <ProgressBarComp e={effect} />;
    case "list_reveal":    return <ListRevealComp e={effect} />;
    case "emoji_burst":    return <EmojiBurstComp e={effect} />;
    case "text_card":      return <TextCardComp e={effect} />;
    case "stat_highlight": return <StatHighlightComp e={effect} />;
    case "before_after":   return <BeforeAfterComp e={effect} />;
    case "checklist":      return <ChecklistComp e={effect} />;
    case "quote_card":     return <QuoteCardComp e={effect} />;
    case "highlight_bar":  return <HighlightBarComp e={effect} />;
    case "countdown":      return <CountdownComp e={effect} />;
    case "step_indicator": return <StepIndicatorComp e={effect} />;
    case "pull_quote":     return <PullQuoteComp e={effect} />;
    case "cta":            return <CTAComp e={effect} />;
    case "percentage":     return <PercentageComp e={effect} />;
    case "bar_chart":      return <BarChartComp e={effect} />;
    case "typewriter":     return <TypewriterComp e={effect} />;
    case "neon_text":      return <NeonTextComp e={effect} />;
    case "waveform":       return <WaveformComp e={effect} />;
    case "confetti":        return <ConfettiComp e={effect} />;
    case "platform_icon":  return <PlatformIconComp e={effect} />;
    case "icon_group":     return <IconGroupComp e={effect} />;
    case "icon_point":     return <IconPointComp e={effect as IconPointEffect} />;
    default:               return null;
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export const EffectLayer: React.FC<{ effect: AnyEffect }> = ({ effect }) => {
  const pos = resolvePosition(effect.position);
  return (
    <div style={{
      position: "absolute",
      zIndex: effect.z_index ?? 15,
      ...pos,
    }}>
      {renderEffect(effect)}
    </div>
  );
};
