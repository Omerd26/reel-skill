/**
 * StarRating — visual metaphor for "rated", "reviews", "5 stars".
 *
 * Five stars inside a glass card that fill sequentially left-to-right (or
 * right-to-left in RTL). The score (e.g. 4.9) animates up from 0 alongside.
 * Optional sample count line beneath. Tone is warm-yellow by default
 * (review convention) but can override with brand.
 *
 * Use cases:
 *   - "4.9 כוכבים" → ⭐⭐⭐⭐⭐ (4.9/5)
 *   - "5 stars from 200 customers" → ⭐⭐⭐⭐⭐ + sample count
 *   - "highest rated" → 5/5 with brand glow
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance, useAmbient } from "../motion";
import {
  GlassCard,
  Eyebrow,
  HaloGlow,
  resolveAnchor,
  type OverlayAnchor,
} from "../primitives";
import {
  COLORS,
  FONTS,
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface StarRatingScene {
  type: "star_rating";
  id: string;
  start: number;
  end: number;
  /** Score 0-5 (one decimal allowed). e.g. 4.9, 5.0, 4.5. */
  score: number;
  /** Optional sample size text. e.g. "200+ reviews", "מ-1,200 לקוחות". */
  sample_text?: string;
  /** Optional eyebrow above. e.g. "DIRECT FROM CUSTOMERS", "דירוג ממוצע". */
  eyebrow?: string;
  /** Tone. Default "warn" (golden-yellow — review convention). */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: StarRatingScene;
}

export const StarRating: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "warn";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const score = Math.max(0, Math.min(5, scene.score));

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });
  const ambient = useAmbient({
    startAfterSec: 1.2,
    kind: "y-bob",
    amplitude: 3,
    periodSec: 4.0,
  });

  // Score counter ramps from 0 to score over 0.55–1.50s
  const scoreT = interpolate(
    frame,
    [Math.round(0.55 * fps), Math.round(1.50 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
  );
  const currentScore = score * scoreT;

  // Each star pops in sequentially — 120ms between stars
  const starStarts = [0.50, 0.62, 0.74, 0.86, 0.98];

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            ...cardEntrance,
            transform: mergeT(cardEntrance.transform, ambient.transform),
          }}
        >
          <GlassCard
            material="liquid"
            padding="26px 36px"
            rtl={false}
            style={{ minWidth: 360 }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 16, marginBottom: 14, textAlign: "center" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Stars row + score */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                {starStarts.map((startSec, i) => {
                  const t = interpolate(
                    frame,
                    [
                      Math.round(startSec * fps),
                      Math.round((startSec + 0.30) * fps),
                    ],
                    [0, 1],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: easeFn("bounce-firm"),
                    },
                  );
                  // How much of THIS star is filled by the score (0..1)
                  const fillByScore = Math.max(0, Math.min(1, score - i));
                  return (
                    <StarGlyph
                      key={`s-${i}`}
                      fill={fillByScore}
                      pop={t}
                      color={accent}
                      glow={accentGlow}
                    />
                  );
                })}
              </div>

              <div
                style={{
                  ...TYPE.numberLockup,
                  fontSize: 64,
                  fontWeight: 900,
                  color: accent,
                  letterSpacing: "-0.02em",
                  textShadow: `0 0 18px ${accentGlow}`,
                  lineHeight: 1,
                }}
              >
                {currentScore.toFixed(1)}
                <span style={{ fontSize: 32, fontWeight: 600, color: COLORS.textSecondary }}>
                  /5
                </span>
              </div>
            </div>

            {scene.sample_text && (
              <div
                style={{
                  marginTop: 10,
                  ...TYPE.body,
                  fontSize: 18,
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  fontFamily: FONTS.body,
                }}
              >
                {scene.sample_text}
              </div>
            )}
          </GlassCard>

          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.4 + scoreT * 0.2,
              pointerEvents: "none",
            }}
          >
            <HaloGlow
              tone={tone}
              size={520}
              intensity={0.45}
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Star glyph — 5-point with partial fill via clip-path ────────────────────

const StarGlyph: React.FC<{
  fill: number;
  pop: number;
  color: string;
  glow: string;
}> = ({ fill, pop, color, glow }) => (
  <div
    style={{
      position: "relative",
      width: 48,
      height: 48,
      transform: `scale(${0.4 + 0.6 * pop}) rotate(${(1 - pop) * -10}deg)`,
      opacity: pop,
      willChange: "transform, opacity",
    }}
  >
    {/* Background hollow star */}
    <svg viewBox="0 0 24 24" width={48} height={48} style={{ position: "absolute", inset: 0 }}>
      <path
        d="M 12 2 L 14.85 8.4 L 22 9.18 L 16.5 13.97 L 18.18 21 L 12 17.27 L 5.82 21 L 7.5 13.97 L 2 9.18 L 9.15 8.4 Z"
        fill="rgba(255,255,255,0.10)"
        stroke="rgba(255,255,255,0.20)"
        strokeWidth={0.5}
      />
    </svg>
    {/* Filled portion — clip-path for partial fill */}
    <svg
      viewBox="0 0 24 24"
      width={48}
      height={48}
      style={{
        position: "absolute",
        inset: 0,
        clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)`,
        filter: `drop-shadow(0 0 6px ${glow})`,
      }}
    >
      <path
        d="M 12 2 L 14.85 8.4 L 22 9.18 L 16.5 13.97 L 18.18 21 L 12 17.27 L 5.82 21 L 7.5 13.97 L 2 9.18 L 9.15 8.4 Z"
        fill={color}
      />
    </svg>
  </div>
);

function mergeT(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}
