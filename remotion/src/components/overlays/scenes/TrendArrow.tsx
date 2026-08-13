/**
 * TrendArrow — visual metaphor for "growth", "decline", "change of N%".
 *
 * A single dramatic arrow (↑ or ↓) inside a glass card, with a big tabular-
 * nums percentage that counts up from 0 to the final delta. The arrow scales
 * in from below the value with bounce-soft, then a subtle ambient bob keeps
 * it alive. Tone auto-flips: brand for up, danger for down.
 *
 * Use cases:
 *   - "גדלנו ב-47 אחוז"          → ↑ +47%
 *   - "ירידה של 80%"             → ↓ −80%
 *   - "ה-ROI עלה פי שניים"       → ↑ +200%
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

export interface TrendArrowScene {
  type: "trend_arrow";
  id: string;
  start: number;
  end: number;
  /** Final delta percentage. Sign drives the arrow direction. e.g. 47, -80, 200. */
  delta_pct: number;
  /** Optional eyebrow above. e.g. "גידול שנתי", "YoY". */
  eyebrow?: string;
  /** Optional label below the percentage. e.g. "Sales", "Followers". */
  label?: string;
  /** Tone override (otherwise auto: up→success, down→danger). */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: TrendArrowScene;
}

export const TrendArrow: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isUp = scene.delta_pct >= 0;
  const tone: Tone = scene.tone ?? (isUp ? "success" : "danger");
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });
  const ambient = useAmbient({
    startAfterSec: 1.0,
    kind: "y-bob",
    amplitude: 3,
    periodSec: 4.0,
  });

  // Counter ramps from 0 to |delta_pct| between 0.55s and 1.45s
  const counterT = interpolate(
    frame,
    [Math.round(0.55 * fps), Math.round(1.45 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
  );
  const currentValue = Math.round(Math.abs(scene.delta_pct) * counterT);

  // Arrow scales in 0.40s after counter starts
  const arrowT = interpolate(
    frame,
    [Math.round(0.40 * fps), Math.round(0.70 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
  );
  const arrowScale = 0.5 + 0.5 * arrowT;

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
            padding="28px 36px"
            rtl={false}
            style={{ minWidth: 320, position: "relative" }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{
                  fontSize: 16,
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}
            >
              {/* The arrow */}
              <div
                style={{
                  transform: `scale(${arrowScale}) rotate(${
                    isUp ? 0 : 180
                  }deg)`,
                  willChange: "transform",
                  filter: `drop-shadow(0 0 ${14 * arrowT}px ${accentGlow})`,
                }}
              >
                <ArrowGlyph color={accent} />
              </div>

              {/* The number */}
              <div
                style={{
                  ...TYPE.numberLockup,
                  fontSize: 110,
                  fontWeight: 900,
                  color: accent,
                  letterSpacing: "-0.04em",
                  textShadow: `0 0 22px ${accentGlow}`,
                  lineHeight: 1,
                }}
              >
                {isUp ? "+" : "−"}
                {currentValue}
                <span style={{ fontSize: 70, fontWeight: 800 }}>%</span>
              </div>
            </div>

            {scene.label && (
              <div
                style={{
                  marginTop: 8,
                  ...TYPE.body,
                  fontSize: 22,
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  fontFamily: FONTS.body,
                }}
              >
                {scene.label}
              </div>
            )}
          </GlassCard>

          {/* Halo grows with the counter */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.4 + counterT * 0.25,
              pointerEvents: "none",
            }}
          >
            <HaloGlow
              tone={tone}
              size={520}
              intensity={0.5}
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

// ── Arrow glyph (large, weighted) ───────────────────────────────────────────

const ArrowGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width={84} height={108} viewBox="0 0 84 108">
    {/* Shaft + head — single path so the glow filter affects them together */}
    <path
      d="M 42 100 L 42 18 M 12 48 L 42 18 L 72 48"
      fill="none"
      stroke={color}
      strokeWidth={14}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Helpers ─────────────────────────────────────────────────────────────────

function mergeT(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}
