/**
 * SupportIcon.tsx — Clean, professional SVG icon for the regular edit layer.
 *
 * Two rendering modes:
 *   "line"   — monochrome stroke icon (default, premium feel)
 *   "filled" — white icon on a colorful gradient background (vibrant, editorial)
 *   "glass"  — white icon on a frosted colored background (subtle, modern)
 *
 * Default behavior: fade-in with optional subtle upward settle.
 * Designed to support meaning, not decorate.
 *
 * Uses lucide-react (1000+ icons) + BrandIcons fallback.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import * as LucideIcons from "lucide-react";
import { getBrandIcon } from "./BrandIcons";

export type IconEntrance = "fade" | "fade-settle" | "scale-settle" | "none";

/** Rendering style for the icon */
export type IconStyle = "line" | "filled" | "glass";

/** Pre-defined gradient presets for filled/glass modes */
export type GradientPreset =
  | "sunset"   // orange → coral
  | "ocean"    // blue → cyan
  | "forest"   // green → emerald
  | "fire"     // red → orange
  | "purple"   // purple → violet
  | "gold"     // amber → yellow
  | "rose"     // pink → rose
  | "slate"    // cool gray → slate
  | "neon"     // cyan → green
  | "royal";   // deep purple → blue

const GRADIENT_MAP: Record<GradientPreset, [string, string]> = {
  sunset:  ["#FF6B35", "#FF3864"],
  ocean:   ["#0EA5E9", "#06B6D4"],
  forest:  ["#22C55E", "#10B981"],
  fire:    ["#EF4444", "#F97316"],
  purple:  ["#8B5CF6", "#7C3AED"],
  gold:    ["#F59E0B", "#FBBF24"],
  rose:    ["#EC4899", "#F43F5E"],
  slate:   ["#64748B", "#475569"],
  neon:    ["#06B6D4", "#22C55E"],
  royal:   ["#6D28D9", "#4F46E5"],
};

/** Shape of the filled background */
export type IconShape = "circle" | "rounded" | "squircle";

export interface SupportIconProps {
  /** lucide-react icon name e.g. "TrendingUp", "Clock", "Zap" */
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Default: "fade" — clean opacity transition */
  entrance?: IconEntrance;
  /** Delay before entrance starts (in seconds) */
  delay?: number;
  /** Opacity when fully visible (default 0.92 — slightly softer than harsh 1.0) */
  maxOpacity?: number;
  /** Whether to fade out at end of sequence (default true) */
  fadeOut?: boolean;
  /** Rendering style: "line" (default), "filled" (gradient bg), "glass" (frosted bg) */
  iconStyle?: IconStyle;
  /** Gradient preset for filled/glass modes (default: "purple") */
  gradient?: GradientPreset;
  /** Custom gradient colors [from, to] — overrides preset */
  gradientColors?: [string, string];
  /** Background shape for filled/glass modes (default: "rounded") */
  shape?: IconShape;
}

export const SupportIcon: React.FC<SupportIconProps> = ({
  name,
  size = 48,
  color = "#FFFFFF",
  strokeWidth = 1.8,
  entrance = "fade",
  delay = 0,
  maxOpacity = 0.92,
  fadeOut = true,
  iconStyle = "line",
  gradient = "purple",
  gradientColors,
  shape = "rounded",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const delayFrames = delay * fps;
  const localFrame = Math.max(0, frame - delayFrames);

  // ── Entry: fast fade-up (opacity 0→1 + move up 30px→0) ──────────────────

  const ENTER_FRAMES = Math.round(fps * 0.3); // ~0.3s
  const opacityIn = interpolate(localFrame, [0, ENTER_FRAMES], [0, maxOpacity], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const entryY = interpolate(localFrame, [0, ENTER_FRAMES], [40, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ── Exit: fade-down (opacity 1→0 + drift down 0→40px) ─────────────────

  const EXIT_FRAMES = Math.round(fps * 0.3); // ~0.3s
  const exitStart = durationInFrames - EXIT_FRAMES;
  const opacityOut = fadeOut
    ? interpolate(frame, [exitStart, durationInFrames - 1], [maxOpacity, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : maxOpacity;
  const exitY = fadeOut
    ? interpolate(frame, [exitStart, durationInFrames - 1], [0, 40], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : 0;

  const opacity = frame < delayFrames ? 0 : Math.min(opacityIn, opacityOut);
  const translateY = frame >= exitStart && fadeOut ? exitY : entryY;
  const transform = `translateY(${translateY}px)`;

  // ── Resolve gradient ───────────────────────────────────────────────────────

  const [g1, g2] = gradientColors ?? GRADIENT_MAP[gradient] ?? GRADIENT_MAP.purple;

  // ── Resolve icon component ─────────────────────────────────────────────────

  const BrandIcon = getBrandIcon(name);
  const LucideIcon = BrandIcon ? null : (LucideIcons as Record<string, any>)[name];
  if (!BrandIcon && !LucideIcon) return null;

  // ── Background styles for filled/glass modes ───────────────────────────────

  const iconInnerSize = iconStyle === "line" ? size : Math.round(size * 0.52);
  const bgSize = iconStyle === "line" ? size : size;

  const shapeRadius: Record<IconShape, number | string> = {
    circle:   "50%",
    rounded:  Math.round(bgSize * 0.28),
    squircle: Math.round(bgSize * 0.22),
  };

  const bgStyle: React.CSSProperties =
    iconStyle === "filled"
      ? {
          background: `linear-gradient(135deg, ${g1}, ${g2})`,
          borderRadius: shapeRadius[shape],
          width: bgSize,
          height: bgSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 20px ${g1}44, 0 0 0 1px ${g1}22`,
        }
      : iconStyle === "glass"
      ? {
          background: `linear-gradient(135deg, ${g1}28, ${g2}18)`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1.5px solid ${g1}33`,
          borderRadius: shapeRadius[shape],
          width: bgSize,
          height: bgSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 2px 12px ${g1}22`,
        }
      : {};

  const iconColor = iconStyle === "line" ? color : "#FFFFFF";
  const iconStroke = iconStyle === "line" ? strokeWidth : 2;

  // ── Render ─────────────────────────────────────────────────────────────────

  const iconElement = BrandIcon ? (
    <BrandIcon size={iconInnerSize} color={iconColor} />
  ) : (
    <LucideIcon size={iconInnerSize} color={iconColor} strokeWidth={iconStroke} />
  );

  if (iconStyle === "line") {
    return (
      <div style={{ opacity, transform, willChange: "opacity, transform" }}>
        {iconElement}
      </div>
    );
  }

  return (
    <div style={{ opacity, transform, willChange: "opacity, transform" }}>
      <div style={bgStyle}>
        {iconElement}
      </div>
    </div>
  );
};
