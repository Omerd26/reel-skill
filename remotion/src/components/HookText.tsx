import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// HookText — the WRITTEN HOOK shown in the first ~3s of the reel.
//
// Design spec (docs/product-perfection/hook-design-spec.md, from deep-research):
//   • Heebo Black (900), ~100-110px — deliberately ~2x the body captions (~60px)
//     so the two never look alike.
//   • Sits in the top third (top offset ~240px), clear of the face + the bottom
//     UI zone, centered, RTL.
//   • Always carries a stroke / drop-shadow / pill so it stays legible over any
//     footage (never light-on-light). Brand orange #E0701E is used as ONE
//     highlighted keyword or the pill fill — never the whole line.
//   • Animation is useCurrentFrame-driven (interpolate/spring) — NEVER CSS
//     transitions, which flicker frame-to-frame during Remotion renders.
//     Entrance ~0.4s pop+rise, hold, then a short fade-out.
//
// Three variants the owner can pick from:
//   bold-stroke   — white text, black stroke, ONE keyword orange (default).
//   highlight-box — dark text on an orange pill (punchiest, WCAG-safe).
//   minimal-clean — white text, no stroke, thin orange underline (restrained).
// ─────────────────────────────────────────────────────────────────────────────

export type HookVariant = "bold-stroke" | "highlight-box" | "minimal-clean";

export interface HookTextProps {
  hook: string;
  highlight?: string;
  variant?: HookVariant;
  brandColor?: string;
  /** Total frames the hook is on screen (used to time the fade-out). */
  durationInFrames: number;
}

export const HookText: React.FC<HookTextProps> = ({
  hook,
  highlight = "",
  variant = "bold-stroke",
  brandColor = "#E0701E",
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!hook) return null;

  // Entrance: spring scale-pop (0.9→1 with slight overshoot) + upward rise,
  // over ~0.45s. spring() is frame-driven so it renders deterministically.
  const enter = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 120 },
    durationInFrames: Math.round(fps * 0.45),
  });
  const scale = interpolate(enter, [0, 1], [0.9, 1]);
  const riseY = interpolate(enter, [0, 1], [28, 0]);
  const fadeIn = interpolate(frame, [0, Math.round(fps * 0.3)], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [Math.max(0, durationInFrames - 8), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  // Colour the ONE highlight keyword (bold-stroke / minimal-clean only —
  // highlight-box puts the whole line on a coloured pill).
  const body: React.ReactNode =
    highlight && variant !== "highlight-box" && hook.includes(highlight)
      ? hook.split(highlight).flatMap((part, i, arr) =>
          i < arr.length - 1
            ? [part, <span key={i} style={{ color: brandColor }}>{highlight}</span>]
            : [part]
        )
      : hook;

  const base: React.CSSProperties = {
    fontFamily: "'Heebo', sans-serif",
    fontWeight: 900,
    fontSize: 100,
    lineHeight: 1.08,
    letterSpacing: "-0.5px",
    textAlign: "center",
    direction: "rtl",
    color: "#ffffff",
    margin: 0,
    textWrap: "balance" as React.CSSProperties["textWrap"],
  };

  let styled: React.CSSProperties = base;
  if (variant === "bold-stroke") {
    styled = {
      ...base,
      WebkitTextStroke: "3.5px #000000",
      paintOrder: "stroke fill",
      filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.45))",
    };
  } else if (variant === "minimal-clean") {
    styled = {
      ...base,
      fontWeight: 800,
      filter: "drop-shadow(0 3px 12px rgba(0,0,0,0.55))",
      borderBottom: `6px solid ${brandColor}`,
      paddingBottom: 8,
    };
  } else if (variant === "highlight-box") {
    styled = {
      ...base,
      color: "#141414",
      background: brandColor,
      padding: "16px 26px",
      borderRadius: 18,
      boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
    };
  }

  return (
    <AbsoluteFill
      style={{ justifyContent: "flex-start", alignItems: "center", pointerEvents: "none" }}
    >
      <div
        style={{
          marginTop: 240,
          maxWidth: "86%",
          display: "flex",
          justifyContent: "center",
          transform: `translateY(${riseY}px) scale(${scale})`,
          opacity,
          willChange: "transform, opacity",
        }}
      >
        <div style={styled}>{body}</div>
      </div>
    </AbsoluteFill>
  );
};
