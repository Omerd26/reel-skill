/**
 * HourglassDrop — visual metaphor for "time passing", "this takes time",
 * "the long way".
 *
 * An hourglass silhouette inside a glass card. Sand at the top drains
 * downward through the neck; a thin sand-trail connects the two chambers.
 * The bottom fills as the top empties. Optional label text (e.g. "1 שעה
 * עבודה" / "15 min").
 *
 * Different from CountdownTimer (which is a numeric countdown ring) —
 * this is a *qualitative* time metaphor, no number ticking.
 *
 * Use cases:
 *   - "לוקח שעה לעשות את זה ידני" → hourglass + "1 hour"
 *   - "5 hours of editing" → hourglass + label
 *   - "תהליך ידני ארוך" → hourglass without label (mood)
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
  FONTS,
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface HourglassDropScene {
  type: "hourglass_drop";
  id: string;
  start: number;
  end: number;
  /** Optional center label. e.g. "1 שעה", "5 min", "long way". */
  label?: string;
  /** Optional eyebrow. e.g. "TIME COST", "זמן". */
  eyebrow?: string;
  /** Tone — colors the sand + glow. Default "warn" (golden sand). */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: HourglassDropScene;
}

export const HourglassDrop: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "warn";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });

  // Sand drain progress 0→1 between 0.55s and end-0.3s. We want the visible
  // window of the scene to make the hourglass feel "in progress".
  const drainStart = Math.round(0.55 * fps);
  const drainEnd = Math.round((scene.end - scene.start - 0.30) * fps);
  const t = interpolate(
    frame,
    [drainStart, Math.max(drainStart + 1, drainEnd)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("linear"),
    },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="28px 32px" rtl={false} style={{ minWidth: 280 }}>
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 14, marginBottom: 14, textAlign: "center" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Hourglass SVG */}
            <div
              style={{
                position: "relative",
                width: 140,
                height: 200,
                margin: "0 auto",
              }}
            >
              <Hourglass progress={t} accent={accent} accentGlow={accentGlow} />
            </div>

            {scene.label && (
              <div
                style={{
                  marginTop: 12,
                  ...TYPE.sectionTitle,
                  fontSize: 28,
                  fontWeight: 800,
                  color: accent,
                  textAlign: "center",
                  letterSpacing: "-0.005em",
                  fontFamily: FONTS.display,
                  textShadow: `0 0 14px ${accentGlow}`,
                }}
              >
                {scene.label}
              </div>
            )}
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }}>
            <HaloGlow
              tone={tone}
              size={460}
              intensity={0.4}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Hourglass SVG ────────────────────────────────────────────────────────────
//
// 140×200. Two triangles + a thin neck. Top triangle has sand at
// `1 - progress` height; bottom has sand at `progress` height.

const Hourglass: React.FC<{
  progress: number;
  accent: string;
  accentGlow: string;
}> = ({ progress, accent, accentGlow }) => {
  // Clamp progress to avoid pixel jitter at extremes
  const p = Math.max(0, Math.min(1, progress));
  // The sand height inside the top half (top triangle goes from y=10 to y=100,
  // neck at y=100). Top sand sits as a trapezoid from y=(10 + p*90) to y=100.
  const topSandY = 10 + p * 90;
  // Bottom sand rises from y=190 upward as p increases (y=190 to y=100).
  const bottomSandHeight = p * 90;
  const bottomSandY = 190 - bottomSandHeight;

  return (
    <svg width={140} height={200} viewBox="0 0 140 200">
      <defs>
        {/* Subtle sand color gradient */}
        <linearGradient id="hg-sand" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity={0.95} />
          <stop offset="100%" stopColor={accent} stopOpacity={0.65} />
        </linearGradient>
      </defs>

      {/* Top + bottom triangles (glass body) */}
      <path
        d="M 20 10 L 120 10 L 75 100 L 65 100 Z"
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth={1.5}
      />
      <path
        d="M 75 100 L 65 100 L 20 190 L 120 190 Z"
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth={1.5}
      />

      {/* Caps */}
      <rect x={10} y={6} width={120} height={8} rx={2} fill="rgba(255,255,255,0.18)" />
      <rect x={10} y={186} width={120} height={8} rx={2} fill="rgba(255,255,255,0.18)" />

      {/* Top sand (drains) — clipped to top triangle shape */}
      <defs>
        <clipPath id="hg-top-clip">
          <path d="M 20 10 L 120 10 L 75 100 L 65 100 Z" />
        </clipPath>
        <clipPath id="hg-bottom-clip">
          <path d="M 75 100 L 65 100 L 20 190 L 120 190 Z" />
        </clipPath>
      </defs>
      <rect
        x={0}
        y={topSandY}
        width={140}
        height={200 - topSandY}
        fill="url(#hg-sand)"
        clipPath="url(#hg-top-clip)"
      />

      {/* Sand falling — a thin column from neck to bottom-sand top */}
      {p > 0.02 && p < 0.98 && (
        <rect
          x={68}
          y={100}
          width={4}
          height={Math.max(0, bottomSandY - 100)}
          fill={accent}
          opacity={0.85}
          rx={1}
          style={{ filter: `drop-shadow(0 0 4px ${accentGlow})` }}
        />
      )}

      {/* Bottom sand (fills) — clipped to bottom triangle */}
      <rect
        x={0}
        y={bottomSandY}
        width={140}
        height={bottomSandHeight}
        fill="url(#hg-sand)"
        clipPath="url(#hg-bottom-clip)"
      />

      {/* Frame highlight on the glass */}
      <path
        d="M 20 10 L 120 10"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
};

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}
