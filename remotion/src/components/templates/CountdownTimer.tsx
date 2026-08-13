/**
 * CountdownTimer — a circular "N seconds to decide" countdown.
 *
 * A depleting progress ring with a big number (N → 1) popping in the center on
 * each tick, plus an optional label below. Fades in at `start_at`, runs for
 * `seconds`, then fades out. Designed to sit in a clear area above/beside the
 * speaker while they give the viewer time to answer.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { FONTS, easeFn } from "../../design/tokens";
import type { CountdownTimerTemplate } from "./types";

interface Props {
  template: CountdownTimerTemplate;
  total_duration_sec: number;
}

export const CountdownTimer: React.FC<Props> = ({ template }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const accent = template.accent_color;
  const rtl = template.rtl ?? true;
  const seconds = template.seconds ?? 3;
  const cx = template.center_x ?? 540;
  const cy = template.center_y ?? 400;
  const D = template.diameter ?? 300;
  const R = D / 2 - 14; // stroke radius (leave room for stroke width)
  const startF = Math.round(template.start_at * fps);
  const endF = startF + Math.round(seconds * fps);

  const local = frame - startF;
  const fadeF = Math.round(0.3 * fps);

  // Only render in [start - fade, end + fade].
  if (frame < startF - fadeF || frame > endF + fadeF) return null;

  // Container fade in/out.
  const fadeIn = interpolate(frame, [startF - fadeF, startF], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });
  const fadeOut = interpolate(frame, [endF, endF + fadeF], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const containerOp = Math.min(fadeIn, fadeOut);

  // Progress 0 → 1 across the countdown window (clamped).
  const progress = interpolate(local, [0, seconds * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Current number: seconds at start, ticking down, 1 in the last whole second.
  const elapsed = Math.max(0, local / fps);
  const currentNumber = Math.max(1, Math.ceil(seconds - elapsed));

  // Per-tick pop: scale punches up right after each whole-second boundary.
  const intoSecond = elapsed - Math.floor(elapsed);
  const tickPop = interpolate(intoSecond, [0, 0.18, 0.4], [1.28, 1.0, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });

  // Ring geometry — SVG circle that empties clockwise.
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference * progress;

  // Color shifts toward red/urgent as it depletes.
  const ringColor = lerpHex(accent, "#FF3B30", progress * 0.85);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: cx - D / 2,
          top: cy - D / 2,
          width: D,
          height: D,
          opacity: containerOp,
          transform: `scale(${(0.85 + 0.15 * fadeIn).toFixed(3)})`,
          willChange: "transform, opacity",
        }}
      >
        {/* Soft backing disc for legibility over any background */}
        <div
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: "50%",
            background: "rgba(11,12,16,0.78)",
            boxShadow: `0 0 36px ${accent}55, 0 12px 36px rgba(0,0,0,0.55)`,
          }}
        />

        {/* Ring */}
        <svg width={D} height={D} viewBox={`0 0 ${D} ${D}`} style={{ position: "absolute", inset: 0 }}>
          {/* track */}
          <circle cx={D / 2} cy={D / 2} r={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={14} />
          {/* depleting progress arc — starts full at top, empties clockwise */}
          <circle
            cx={D / 2}
            cy={D / 2}
            r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${D / 2} ${D / 2})`}
            style={{ filter: `drop-shadow(0 0 8px ${ringColor}aa)` }}
          />
        </svg>

        {/* Center number */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: D * 0.5,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1,
              transform: `scale(${tickPop.toFixed(3)})`,
              textShadow: `0 0 26px ${ringColor}, 0 6px 18px rgba(0,0,0,0.6)`,
              willChange: "transform",
            }}
          >
            {currentNumber}
          </div>
        </div>
      </div>

      {/* Label below the ring */}
      {template.label && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: cy + D / 2 + 6,
            textAlign: "center",
            direction: rtl ? "rtl" : "ltr",
            opacity: containerOp,
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontFamily: FONTS.display,
              fontSize: 44,
              fontWeight: 900,
              color: "#FFFFFF",
              background: accent,
              padding: "10px 26px",
              borderRadius: 16,
              letterSpacing: "-0.01em",
              boxShadow: `0 8px 22px ${accent}77, 0 4px 12px rgba(0,0,0,0.5)`,
            }}
          >
            {template.label}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Linear-interpolate two hex colors. */
function lerpHex(a: string, b: string, t: number): string {
  const pa = hex(a), pb = hex(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}
function hex(h: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  if (!m) return { r: 10, g: 61, b: 124 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
