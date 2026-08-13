/**
 * CircleScribble — a rough hand-drawn ellipse draws itself around a phrase
 * (1.5 turns, marker style), then the phrase pulses. "circle THIS" energy —
 * annotation, not decoration.
 *
 * NEW TYPE 2026-08-09.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface CircleScribbleScene {
  type: "circle_scribble";
  id: string;
  start: number;
  end: number;
  /** The circled phrase. */
  text: string;
  /** Small SHOUT label above — e.g. "פה". */
  eyebrow?: string;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: CircleScribbleScene;
}

// A wobbly 1.5-turn marker ellipse (viewBox 0 0 400 160).
const SCRIBBLE =
  "M 210 22 C 90 14 22 48 26 82 C 30 122 118 146 208 142 C 306 138 376 112 372 76 " +
  "C 368 40 288 16 186 22 C 120 26 60 46 58 78";
const SCRIBBLE_LEN = 1120;

export const CircleScribble: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");

  const textT = interpolate(frame, [0, Math.round(0.3 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glass-rise"),
  });
  // The marker draws itself 0.35-1.05s (1.5 turns).
  const drawT = interpolate(frame, [Math.round(0.35 * fps), Math.round(1.05 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide"),
  });
  // Post-draw pulse.
  const pulse = drawT >= 1 ? 1 + 0.04 * Math.sin(((frame - 1.05 * fps) / (1.4 * fps)) * Math.PI * 2) : 1;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {scene.eyebrow && (
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 30,
                color: accent,
                direction: "rtl",
                textShadow: `0 0 20px ${accentGlow}, 0 2px 8px rgba(0,0,0,0.9)`,
                opacity: textT,
              }}
            >
              {scene.eyebrow}
            </div>
          )}
          <div
            style={{
              position: "relative",
              padding: "26px 48px",
              transform: `scale(${pulse})`,
            }}
          >
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 52,
                color: "#FFFFFF",
                direction: "rtl",
                textAlign: "center",
                maxWidth: 560,
                lineHeight: 1.2,
                opacity: textT,
                textShadow: "0 3px 12px rgba(0,0,0,0.92), 0 0 34px rgba(0,0,0,0.6)",
              }}
            >
              {scene.text}
            </div>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 400 160"
              preserveAspectRatio="none"
              style={{
                position: "absolute",
                inset: 0,
                overflow: "visible",
                filter: `drop-shadow(0 3px 8px rgba(0,0,0,0.6)) drop-shadow(0 0 10px ${accentGlow})`,
              }}
            >
              <path
                d={SCRIBBLE}
                fill="none"
                stroke={accent}
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={SCRIBBLE_LEN}
                strokeDashoffset={SCRIBBLE_LEN * (1 - drawT)}
                opacity={0.95}
              />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
