/**
 * WordStack — hook-grammar word stacking (Jatho Dau4 t001-t002: "NO" →
 * "NO NO" → "NO NO NO" slamming in with red glow). Each word SLAMS onto the
 * stack one per beat with a jolt, growing the emotional pressure.
 *
 * NEW TYPE 2026-08-09. De-boxed free typography (law 2).
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface WordStackScene {
  type: "word_stack";
  id: string;
  start: number;
  end: number;
  /** Words in slam order (1-4). Repeat the same word for the "NO NO NO"
   * pressure move, or escalate ("לא", "ממש לא", "בחיים לא"). */
  words: string[];
  /** Seconds between slams. Default 0.45. */
  beat_sec?: number;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: WordStackScene;
}

const isHebrew = (s: string) => /[֐-׿]/.test(s);

export const WordStack: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "danger";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const words = scene.words.slice(0, 4);
  const beat = scene.beat_sec ?? 0.45;

  // Global 1-frame jolt on each slam (the whole stack kicks).
  const slamFrames = words.map((_, i) => Math.round((0.1 + i * beat) * fps));
  const jolt = slamFrames.some((sf) => frame >= sf && frame < sf + 2) ? 5 : 0;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            transform: `translateY(${jolt}px)`,
          }}
        >
          {words.map((w, i) => {
            const sf = slamFrames[i];
            const t = interpolate(frame, [sf, sf + Math.round(0.18 * fps)], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm"),
            });
            const size = 64 + i * 14; // each slam BIGGER — pressure rises
            const hebrew = isHebrew(w);
            const breathe = 0.8 + 0.2 * (0.5 + 0.5 * Math.sin(((frame - sf) / (2.2 * fps)) * Math.PI * 2));
            return (
              <div
                key={i}
                style={{
                  fontFamily: "'Heebo', sans-serif",
                  fontWeight: 900,
                  fontSize: size,
                  lineHeight: 1.05,
                  color: i === words.length - 1 ? accent : "#FFFFFF",
                  direction: hebrew ? "rtl" : "ltr",
                  letterSpacing: hebrew ? "0" : "0.02em",
                  opacity: t,
                  transform: `scale(${0.4 + 0.6 * t}) rotate(${(1 - t) * (i % 2 === 0 ? -6 : 6)}deg)`,
                  textShadow:
                    i === words.length - 1
                      ? `0 0 ${28 * breathe}px ${accentGlow}, 0 3px 12px rgba(0,0,0,0.9)`
                      : "0 3px 12px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.6)",
                }}
              >
                {w}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
