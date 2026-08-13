/**
 * ComparisonGap — visual metaphor for "the difference is huge", "we beat
 * them by a mile", "us vs them, but visualized".
 *
 * Two horizontal bars inside a glass card — one small (loser), one large
 * (winner). A glowing "gap visualization" between them: a vertical span
 * with a label like "GAP" or "+X%" emphasizing the difference. Bars grow
 * left-to-right with bounce-soft; the gap label fades in last.
 *
 * Distinct from MetricComparison (two equal-weight rings) — this one
 * dramatizes the disparity. Use it when the gap IS the story.
 *
 * Use cases:
 *   - "הם ב-12, אנחנו ב-87"     → small bar (12), big bar (87), gap label "+75"
 *   - "old way 3hrs, new way 4min" → tiny bar vs huge bar, gap label
 *   - "industry avg vs us"      → average vs us with dramatic gap
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

export interface ComparisonGapScene {
  type: "comparison_gap";
  id: string;
  start: number;
  end: number;
  /** Smaller side. */
  loser: { label: string; value: number; unit?: string; tone?: Tone };
  /** Larger side. */
  winner: { label: string; value: number; unit?: string; tone?: Tone };
  /** Optional gap label. e.g. "+75%", "GAP", "7x more". If omitted, auto-computed. */
  gap_label?: string;
  /** Optional eyebrow. e.g. "THE DIFFERENCE", "ההפרש". */
  eyebrow?: string;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: ComparisonGapScene;
}

export const ComparisonGap: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const loserTone: Tone = scene.loser.tone ?? "danger";
  const winnerTone: Tone = scene.winner.tone ?? "success";
  const loserAccent = toneColor(loserTone);
  const winnerAccent = toneColor(winnerTone);
  const winnerGlow = toneGlow(winnerTone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const maxV = Math.max(scene.loser.value, scene.winner.value, 1);
  const loserPct = scene.loser.value / maxV;
  const winnerPct = scene.winner.value / maxV;

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });

  // Bars grow sequentially: loser first (0.55s), then winner (0.85s)
  const loserT = interpolate(
    frame,
    [Math.round(0.55 * fps), Math.round(1.10 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
  );
  const winnerT = interpolate(
    frame,
    [Math.round(0.85 * fps), Math.round(1.60 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
  );
  // Gap label fades in last
  const gapT = interpolate(
    frame,
    [Math.round(1.55 * fps), Math.round(1.95 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
  );

  // Auto-compute gap_label if missing
  const autoGapLabel = (() => {
    if (scene.gap_label) return scene.gap_label;
    const diff = scene.winner.value - scene.loser.value;
    if (scene.loser.value === 0) return `${scene.winner.value}${scene.winner.unit ?? ""}`;
    const ratio = scene.winner.value / scene.loser.value;
    if (ratio >= 2) return `${ratio.toFixed(1)}×`;
    if (scene.winner.value > 0) {
      const pct = (diff / scene.loser.value) * 100;
      return `+${Math.round(pct)}%`;
    }
    return `+${diff}`;
  })();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="26px 32px" rtl={false} style={{ minWidth: 580 }}>
            {scene.eyebrow && (
              <Eyebrow
                tone={winnerTone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 14, marginBottom: 18, textAlign: "center" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Two bars stack */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>
              <BarRow
                label={scene.loser.label}
                value={scene.loser.value}
                unit={scene.loser.unit}
                pct={loserPct * loserT}
                accent={loserAccent}
                glow={toneGlow(loserTone)}
              />
              <BarRow
                label={scene.winner.label}
                value={scene.winner.value}
                unit={scene.winner.unit}
                pct={winnerPct * winnerT}
                accent={winnerAccent}
                glow={winnerGlow}
                isWinner
              />

              {/* Gap label — floats between the bars (right-aligned) */}
              <div
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: `translateY(-50%) scale(${0.7 + 0.3 * gapT})`,
                  opacity: gapT,
                  willChange: "transform, opacity",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    background: `linear-gradient(135deg, ${winnerAccent}, ${darken(winnerAccent, 0.25)})`,
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    boxShadow: `0 6px 16px rgba(0,0,0,0.40), 0 0 ${24 * gapT}px ${winnerGlow}, inset 0 1px 0 rgba(255,255,255,0.30)`,
                    ...TYPE.eyebrow,
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#FFFFFF",
                    letterSpacing: "-0.005em",
                    textTransform: "none",
                    fontFamily: FONTS.display,
                  }}
                >
                  {autoGapLabel}
                </div>
              </div>
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35 + gapT * 0.3, pointerEvents: "none" }}>
            <HaloGlow
              tone={winnerTone}
              size={680}
              intensity={0.45}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── BarRow ──────────────────────────────────────────────────────────────────

const BarRow: React.FC<{
  label: string;
  value: number;
  unit?: string;
  pct: number; // 0..1
  accent: string;
  glow: string;
  isWinner?: boolean;
}> = ({ label, value, unit, pct, accent, glow, isWinner }) => (
  <div>
    {/* Label + value row */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 6,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.body,
          fontSize: 16,
          fontWeight: 700,
          color: isWinner ? COLORS.text : COLORS.textSecondary,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONTS.display,
          fontSize: isWinner ? 32 : 22,
          fontWeight: 900,
          color: accent,
          letterSpacing: "-0.02em",
          textShadow: isWinner ? `0 0 12px ${glow}` : "none",
        }}
      >
        {value.toLocaleString()}
        {unit && <span style={{ fontSize: "0.6em", marginLeft: 2 }}>{unit}</span>}
      </span>
    </div>

    {/* The bar */}
    <div
      style={{
        position: "relative",
        height: isWinner ? 28 : 18,
        borderRadius: 14,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${pct * 100}%`,
          background: `linear-gradient(90deg, ${accent}, ${lighten(accent, 0.15)})`,
          boxShadow: isWinner ? `0 0 12px ${glow}, inset 0 1px 0 rgba(255,255,255,0.25)` : "inset 0 1px 0 rgba(255,255,255,0.15)",
          borderRadius: 14,
          willChange: "width",
        }}
      />
    </div>
  </div>
);

// ── Helpers ─────────────────────────────────────────────────────────────────

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}

function darken(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lighten(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) + 255 * amount));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) + 255 * amount));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) + 255 * amount));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
