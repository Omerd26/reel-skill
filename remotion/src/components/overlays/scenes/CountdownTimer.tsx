/**
 * CountdownTimer — visual metaphor for "time pressure", "limited offer", "urgency".
 *
 * Circular countdown ring inside a glass card. The ring drains from full to
 * empty over the visible duration; the center label shows seconds remaining
 * in tabular-nums monospace. Color shifts: brand → warn → danger as time
 * approaches zero. Pulse on the last 3 seconds.
 *
 * Use cases:
 *   - "המבצע מסתיים בעוד..." → 60→0 countdown
 *   - "הרשמה היום בלבד" → 24h or 1h countdown
 *   - "live in 10 seconds" → 10→0 with pulse finale
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
} from "../../../design/tokens";

export interface CountdownTimerScene {
  type: "countdown_timer";
  id: string;
  start: number;
  end: number;
  /** Starting value (e.g. 60 for "60 seconds left", 24 for "24 hours"). */
  from_value: number;
  /** Ending value. Default 0. */
  to_value?: number;
  /** Unit label below the number (e.g. "שעות", "MIN", "SEC"). */
  unit?: string;
  /** Eyebrow above (e.g. "נשארו", "ENDS IN"). */
  eyebrow?: string;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: CountdownTimerScene;
}

export const CountdownTimer: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const toValue = scene.to_value ?? 0;

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Countdown progresses linearly from frame 0.5s to 0.5s before end
  const startFrames = Math.round(0.50 * fps);
  const endFrames = Math.round((scene.end - scene.start - 0.30) * fps);
  const progress = interpolate(
    frame,
    [startFrames, Math.max(startFrames + 1, endFrames)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("linear") },
  );
  const currentValue = Math.round(scene.from_value + (toValue - scene.from_value) * progress);

  // Tone shifts: 0-50% brand, 50-80% warn, 80-100% danger
  const tone = progress < 0.5 ? "brand" : progress < 0.8 ? "warn" : "danger";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);

  // Final-3s pulse: if the simulated value is ≤ 3, scale-breath
  const isPulsing = currentValue <= 3 && currentValue > 0;
  const pulsePhase = (frame % Math.max(1, fps * 0.5)) / (fps * 0.5);
  const pulseScale = isPulsing ? 1 + 0.08 * Math.sin(pulsePhase * Math.PI * 2) : 1;

  // Ring geometry
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * progress;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="24px 28px" rtl={false} style={{ minWidth: 260 }}>
            {scene.eyebrow && (
              <Eyebrow tone={tone} script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"} style={{ fontSize: 18, marginBottom: 14, textAlign: "center" }}>
                {scene.eyebrow}
              </Eyebrow>
            )}

            <div
              style={{
                position: "relative",
                width: size,
                height: size,
                margin: "0 auto",
                transform: `scale(${pulseScale})`,
                willChange: "transform",
              }}
            >
              <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={accent}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ filter: `drop-shadow(0 0 ${10 + 12 * progress}px ${accentGlow})` }}
                />
              </svg>

              {/* Center number */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    ...TYPE.numberLockup,
                    fontSize: 76,
                    color: accent,
                    textShadow: `0 0 18px ${accentGlow}`,
                    lineHeight: 1,
                  }}
                >
                  {currentValue}
                </span>
                {scene.unit && (
                  <span
                    style={{
                      ...TYPE.meta,
                      fontSize: 18,
                      color: COLORS.textSecondary,
                      marginTop: 4,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {scene.unit}
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.4 + progress * 0.3, pointerEvents: "none" }}>
            <HaloGlow tone={tone} size={420} intensity={0.4} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}
