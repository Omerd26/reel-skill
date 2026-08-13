/**
 * ArrowScribble — a hand-drawn arrow that DRAWS ITSELF (stroke-dashoffset)
 * pointing at something on screen, with a free-typography label at its
 * tail. The editor's-marker annotation grammar — energy without a box.
 *
 * NEW TYPE 2026-08-09.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface ArrowScribbleScene {
  type: "arrow_scribble";
  id: string;
  start: number;
  end: number;
  /** Label at the arrow's tail. */
  label: string;
  /** Which way the arrow points. Default "down" (at the speaker/subject). */
  direction?: "down" | "up" | "left" | "right";
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: ArrowScribbleScene;
}

// A wobbly hand-drawn arrow path (viewBox 0 0 200 160), pointing DOWN.
const ARROW_PATH = "M 100 8 C 88 40 112 62 98 92 C 92 106 96 120 100 134";
const HEAD_PATH = "M 78 112 C 86 122 94 130 100 140 C 108 128 114 120 124 114";
const PATH_LEN = 190;
const HEAD_LEN = 110;

const ROT: Record<string, number> = { down: 0, up: 180, left: 90, right: -90 };

export const ArrowScribble: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const dir = scene.direction ?? "down";

  // Label pops first, then the arrow draws itself (0.25-0.7s), then the
  // head strokes on, then the whole thing does an insistence wiggle.
  const labelT = interpolate(frame, [0, Math.round(0.28 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm"),
  });
  const drawT = interpolate(frame, [Math.round(0.25 * fps), Math.round(0.7 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide"),
  });
  const headT = interpolate(frame, [Math.round(0.65 * fps), Math.round(0.85 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide"),
  });
  // Insistence wiggle every ~1.6s after drawn.
  const wiggleBase = frame - Math.round(1.1 * fps);
  const wiggle =
    wiggleBase > 0 && wiggleBase % Math.round(1.6 * fps) < Math.round(0.3 * fps)
      ? Math.sin((wiggleBase % Math.round(0.3 * fps)) * 1.4) * 5
      : 0;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 44,
              color: "#FFFFFF",
              direction: "rtl",
              textAlign: "center",
              maxWidth: 640,
              lineHeight: 1.2,
              opacity: labelT,
              transform: `scale(${0.6 + 0.4 * labelT}) rotate(-2deg)`,
              textShadow: `0 3px 12px rgba(0,0,0,0.9), 0 0 24px ${accentGlow}`,
            }}
          >
            {scene.label}
          </div>
          <svg
            width="170"
            height="140"
            viewBox="0 0 200 160"
            style={{
              transform: `rotate(${ROT[dir] + wiggle}deg)`,
              filter: `drop-shadow(0 4px 10px rgba(0,0,0,0.7)) drop-shadow(0 0 12px ${accentGlow})`,
            }}
          >
            <path
              d={ARROW_PATH}
              fill="none"
              stroke={accent}
              strokeWidth={9}
              strokeLinecap="round"
              strokeDasharray={PATH_LEN}
              strokeDashoffset={PATH_LEN * (1 - drawT)}
            />
            <path
              d={HEAD_PATH}
              fill="none"
              stroke={accent}
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={HEAD_LEN}
              strokeDashoffset={HEAD_LEN * (1 - headT)}
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
