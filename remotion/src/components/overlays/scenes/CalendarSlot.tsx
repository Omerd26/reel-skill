/**
 * CalendarSlot — visual metaphor for "scheduling", "every Monday", "post in 2 weeks".
 *
 * A small month-grid (6×7) inside a glass card. One or more day cells fill
 * progressively in the brand accent color, optionally with a connecting
 * line / pattern showing recurrence ("every Monday" → all Mondays light up).
 *
 * Use cases:
 *   - "תזמון אוטומטי" → Days fill in sequence
 *   - "פוסט כל יום שני" → Every Monday cell highlights
 *   - "השבוע הזה" → Current week row fills
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
  RADIUS,
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface CalendarSlotScene {
  type: "calendar_slot";
  id: string;
  start: number;
  end: number;
  /** Days of the month (1-31) to highlight. */
  highlight_days: number[];
  /** Month label shown at the top. e.g. "אפריל" / "APR". */
  month_label?: string;
  /** Eyebrow above month. */
  eyebrow?: string;
  /** Tone — colors highlighted cells + glow. */
  tone?: Tone;
  /** Stagger reveal in ms between cells. Default 80. */
  stagger_ms?: number;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: CalendarSlotScene;
}

const DAY_LABELS_LATIN = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_LABELS_HEBREW = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export const CalendarSlot: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const isHeb = scene.month_label ? isHebrew(scene.month_label) : true;
  const dayLabels = isHeb ? DAY_LABELS_HEBREW : DAY_LABELS_LATIN;
  const staggerMs = scene.stagger_ms ?? 80;

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // 30 days, 5 rows × 7 cols (a typical month layout, starting Sunday)
  const daysInMonth = 30;
  const cellSize = 36;
  const cellGap = 6;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="22px 26px" rtl={isHeb} style={{ minWidth: 320 }}>
            {scene.eyebrow && (
              <Eyebrow tone={tone} script={isHeb ? "hebrew" : "latin"} style={{ fontSize: 18, marginBottom: 8 }}>
                {scene.eyebrow}
              </Eyebrow>
            )}
            {scene.month_label && (
              <div
                style={{
                  ...TYPE.sectionTitle,
                  fontSize: 28,
                  fontWeight: 700,
                  color: COLORS.text,
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                {scene.month_label}
              </div>
            )}

            {/* Day-of-week header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(7, ${cellSize}px)`,
                gap: cellGap,
                marginBottom: 8,
                justifyContent: "center",
              }}
            >
              {dayLabels.map((d, i) => (
                <div
                  key={`hdr-${i}`}
                  style={{
                    ...TYPE.meta,
                    fontSize: 14,
                    color: COLORS.textTertiary,
                    textAlign: "center",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(7, ${cellSize}px)`,
                gap: cellGap,
                justifyContent: "center",
              }}
            >
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isHighlighted = scene.highlight_days.includes(day);

                // Stagger: each highlighted cell reveals in order
                const highlightIndex = scene.highlight_days.indexOf(day);
                const cellStartFrame = Math.round((0.55 + (staggerMs / 1000) * Math.max(0, highlightIndex)) * fps);
                const cellT = isHighlighted
                  ? interpolate(
                      frame,
                      [cellStartFrame, cellStartFrame + Math.round(0.30 * fps)],
                      [0, 1],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
                    )
                  : 0;

                return (
                  <div
                    key={`day-${day}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: RADIUS.sm,
                      background: isHighlighted
                        ? `linear-gradient(135deg, ${accent}, ${darken(accent, 0.20)})`
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isHighlighted ? accent : "rgba(255,255,255,0.08)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...TYPE.meta,
                      fontSize: 14,
                      fontWeight: isHighlighted ? 800 : 500,
                      color: isHighlighted ? "#FFFFFF" : COLORS.textSecondary,
                      opacity: isHighlighted ? cellT : 1,
                      transform: isHighlighted ? `scale(${0.6 + 0.4 * cellT})` : "scale(1)",
                      boxShadow: isHighlighted ? `0 0 ${12 * cellT}px ${accentGlow}` : "none",
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }}>
            <HaloGlow tone={tone} size={460} intensity={0.4} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

function darken(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
