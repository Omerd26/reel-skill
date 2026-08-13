/**
 * EmojiReact — visual metaphor for "social proof", "viral", "reactions".
 *
 * Stack of emoji that pop in one by one with bounce-firm easing, plus a
 * counter that ticks up beside them. The counter snaps up to the final
 * value with tabular-nums.
 *
 * Use cases:
 *   - "1000 לייקים בשעה" → ❤️🔥 + counter 0→1000
 *   - "הקהילה מגיבה" → 👍❤️🔥 + counter
 *   - "viral content" → 🔥🚀 + counter
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance } from "../motion";
import {
  GlassCard,
  Eyebrow,
  HaloGlow,
  resolveAnchor,
  type OverlayAnchor,
} from "../primitives";
import {
  COLORS,
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface EmojiReactScene {
  type: "emoji_react";
  id: string;
  start: number;
  end: number;
  /** Emojis to stack in order. 2-4 work best. */
  emojis: string[];
  /** Final counter value. */
  count_to: number;
  /** Counter starting value. Default 0. */
  count_from?: number;
  /** Counter unit. Default "" (e.g. "K", "M"). */
  unit?: string;
  /** Tone — colors counter + glow. */
  tone?: Tone;
  /** Optional label below. e.g. "תגובות" / "REACTIONS". */
  label?: string;
  /** Eyebrow above. */
  eyebrow?: string;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: EmojiReactScene;
}

export const EmojiReact: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const emojis = scene.emojis.slice(0, 5);
  const countFrom = scene.count_from ?? 0;
  const unit = scene.unit ?? "";

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Counter ramps up from 0.65s to 1.50s
  const counterStart = Math.round(0.65 * fps);
  const counterDur = Math.round(0.85 * fps);
  const t = interpolate(
    frame,
    [counterStart, counterStart + counterDur],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
  );
  const currentCount = Math.round(countFrom + (scene.count_to - countFrom) * t);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="22px 26px" rtl={false} style={{ minWidth: 280 }}>
            {scene.eyebrow && (
              <Eyebrow tone={tone} script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"} style={{ fontSize: 18, marginBottom: 14 }}>
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Emoji + counter row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: -6, position: "relative" }}>
                {emojis.map((e, i) => {
                  const startFrame = Math.round((0.55 + i * 0.10) * fps);
                  const eT = interpolate(
                    frame,
                    [startFrame, startFrame + Math.round(0.30 * fps)],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
                  );
                  return (
                    <div
                      key={`em-${i}`}
                      style={{
                        fontSize: 48,
                        marginLeft: i === 0 ? 0 : -10,
                        opacity: eT,
                        transform: `scale(${0.5 + 0.5 * eT}) rotate(${(1 - eT) * -20}deg)`,
                        textShadow: "0 4px 12px rgba(0,0,0,0.35)",
                        willChange: "transform, opacity",
                        zIndex: emojis.length - i,
                        filter: i === 0 ? `drop-shadow(0 0 10px ${accentGlow})` : "none",
                      }}
                    >
                      {e}
                    </div>
                  );
                })}
              </div>

              {/* Counter */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                <span
                  style={{
                    ...TYPE.numberLockup,
                    fontSize: 56,
                    color: accent,
                    textShadow: `0 0 14px ${accentGlow}`,
                    lineHeight: 1,
                  }}
                >
                  {formatCount(currentCount)}
                  {unit && <span style={{ fontSize: 30 }}>{unit}</span>}
                </span>
                {scene.label && (
                  <span
                    style={{
                      ...TYPE.meta,
                      fontSize: 14,
                      color: COLORS.textSecondary,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {scene.label}
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.4 + t * 0.2, pointerEvents: "none" }}>
            <HaloGlow tone={tone} size={460} intensity={0.4} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}
