import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export type BadgePosition = "top-right" | "top-left" | "center-right" | "center-left";

export interface AnimatedBadgeProps {
  emoji: string;
  text: string;
  position?: BadgePosition;
  brandColor?: string;
}

/**
 * AnimatedBadge – Instagram-style frosted-glass floating badge.
 *
 * Slides in from the edge with a spring animation, then gently bobs.
 * Fades out near the end of its Sequence.
 *
 * Usage:
 *   <Sequence from={startFrame} durationInFrames={durationFrames}>
 *     <AnimatedBadge emoji="🔥" text="שים לב!" position="top-right" />
 *   </Sequence>
 */
export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  emoji,
  text,
  position = "top-right",
  brandColor = "#E0701E",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const isRight = position === "top-right" || position === "center-right";

  // Slide in from the correct edge
  const slideX = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 200 },
    from: isRight ? 160 : -160,
    to: 0,
  });

  // Pop-in scale
  const scaleIn = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 260 },
    from: 0.6,
    to: 1.0,
  });

  // Gentle floating bob (starts after slide finishes ~15 frames)
  const bob = Math.sin((Math.max(0, frame - 15) / fps) * Math.PI * 1.8) * 5;

  // Fade in + out
  const fadeIn  = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames - 2],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = fadeIn * fadeOut;

  // Glow pulse on brand color (subtle)
  const glowPulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2);
  const glowOpacity = 0.25 + glowPulse * 0.1;

  const positionStyle: React.CSSProperties =
    position === "top-right"    ? { top: "14%",  right: 36 } :
    position === "top-left"     ? { top: "14%",  left:  36 } :
    position === "center-right" ? { top: "38%",  right: 36 } :
                                  { top: "38%",  left:  36 };

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyle,
        transform: `translateX(${slideX}px) scale(${scaleIn}) translateY(${bob}px)`,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 10,
        // Frosted glass look
        background: "rgba(20, 20, 20, 0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1.5px solid rgba(255,255,255,0.18)`,
        borderRadius: 50,
        padding: "12px 22px 12px 18px",
        boxShadow: [
          "0 8px 32px rgba(0,0,0,0.5)",
          `0 0 18px rgba(${hexToRgb(brandColor)},${glowOpacity})`,
          "inset 0 1px 0 rgba(255,255,255,0.12)",
        ].join(", "),
        // Ensure RTL flow for Hebrew text
        direction: "rtl",
        maxWidth: 400,
      }}
    >
      {/* Emoji */}
      <span
        style={{
          fontSize: 36,
          lineHeight: 1,
          flexShrink: 0,
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))",
        }}
      >
        {emoji}
      </span>

      {/* Text */}
      <span
        style={{
          fontFamily: "'Heebo', sans-serif",
          fontWeight: 800,
          fontSize: 32,
          color: "#FFFFFF",
          lineHeight: 1.2,
          textShadow: "0 2px 8px rgba(0,0,0,0.7)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>

      {/* Accent dot (brand color) */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: brandColor,
          flexShrink: 0,
          boxShadow: `0 0 8px ${brandColor}`,
        }}
      />
    </div>
  );
};

// ── Utility ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r},${g},${b}`;
}
