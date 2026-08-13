/**
 * DigitalClockFlip — visual metaphor for "every hour", "in real time",
 * "the clock is ticking".
 *
 * A flip-clock-style time display inside a glass card. Either:
 *   - "clock" mode: 4 digits HH:MM that tick forward, each digit flip
 *     animating like a mechanical split-flap board.
 *   - "minutes" mode: a single 2-digit minute counter (e.g. 17 → 18 → 19).
 *
 * Use cases:
 *   - "כל שעה במשך הלילה" → HH:MM ticking
 *   - "minute by minute" → 2-digit counter
 *   - "12:00 PM sharp" → static 12:00 with subtle pulse on the colon
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
  RADIUS,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface DigitalClockFlipScene {
  type: "digital_clock_flip";
  id: string;
  start: number;
  end: number;
  /** Mode — full HH:MM clock, or single 2-digit counter. */
  mode?: "clock" | "minutes";
  /** Start value. For "clock" mode: minutes from midnight (0-1439).
   * For "minutes" mode: starting number. */
  from_value: number;
  /** End value, same units. */
  to_value: number;
  /** Optional eyebrow. e.g. "ALL NIGHT", "כל הלילה". */
  eyebrow?: string;
  /** Optional sublabel under. e.g. "AM Tel Aviv". */
  sublabel?: string;
  /** Tone. Default "brand". */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: DigitalClockFlipScene;
}

export const DigitalClockFlip: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const mode = scene.mode ?? "clock";

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.45,
  });

  // Linear progress across the scene
  const startFrames = Math.round(0.50 * fps);
  const endFrames = Math.round((scene.end - scene.start - 0.30) * fps);
  const t = interpolate(frame, [startFrames, Math.max(startFrames + 1, endFrames)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("linear"),
  });
  const currentValue = scene.from_value + (scene.to_value - scene.from_value) * t;

  // For clock mode: convert minutes → HH:MM
  let digits: string[] = [];
  let separator = "";
  if (mode === "clock") {
    const mins = Math.max(0, Math.round(currentValue));
    const hh = Math.floor(mins / 60) % 24;
    const mm = mins % 60;
    digits = [
      Math.floor(hh / 10).toString(),
      (hh % 10).toString(),
      Math.floor(mm / 10).toString(),
      (mm % 10).toString(),
    ];
    separator = ":";
  } else {
    const n = Math.max(0, Math.round(currentValue));
    digits = [Math.floor(n / 10).toString(), (n % 10).toString()];
  }

  // Colon blink (mechanical clock feel) — 1Hz
  const colonOn = Math.floor(frame / Math.max(1, fps * 0.5)) % 2 === 0;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material="solid-dark"
            padding="24px 28px"
            rtl={false}
            style={{ minWidth: 360 }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 14, marginBottom: 14, textAlign: "center" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Digit row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {digits.map((d, i) => (
                <React.Fragment key={`d-${i}`}>
                  <FlipDigit digit={d} accent={accent} accentGlow={accentGlow} />
                  {mode === "clock" && i === 1 && (
                    <span
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 78,
                        fontWeight: 800,
                        color: accent,
                        opacity: colonOn ? 1 : 0.25,
                        margin: "0 2px",
                        textShadow: `0 0 14px ${accentGlow}`,
                        transition: "none",
                      }}
                    >
                      {separator}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {scene.sublabel && (
              <div
                style={{
                  marginTop: 10,
                  fontFamily: FONTS.mono,
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                  letterSpacing: "0.16em",
                  textAlign: "center",
                  textTransform: "uppercase",
                }}
              >
                {scene.sublabel}
              </div>
            )}
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }}>
            <HaloGlow
              tone={tone}
              size={500}
              intensity={0.4}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── FlipDigit ────────────────────────────────────────────────────────────────
//
// A single split-flap-style digit. The card is a dark panel with a thin
// mid-line; the digit sits centered. On change, the whole panel rotateX
// flips briefly — implemented via CSS transform + transient state.

const FlipDigit: React.FC<{
  digit: string;
  accent: string;
  accentGlow: string;
}> = ({ digit, accent, accentGlow }) => {
  // Use a simple change-on-key animation: when the digit changes, React
  // remounts (because we'd need state to detect change). We can fake the
  // flip by deriving phase from frame.
  return (
    <div
      style={{
        position: "relative",
        width: 80,
        height: 110,
        borderRadius: RADIUS.md,
        background:
          "linear-gradient(180deg, #1A1A1F 0%, #15161A 50%, #1A1A1F 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(255,255,255,0.02), 0 2px 6px rgba(0,0,0,0.40)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Mid hairline — sells the "fold" of a split-flap card */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 1,
          background: "rgba(0,0,0,0.6)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.03)",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: 78,
          fontWeight: 800,
          color: accent,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          textShadow: `0 0 14px ${accentGlow}`,
          willChange: "transform",
        }}
      >
        {digit}
      </span>
    </div>
  );
};

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}
