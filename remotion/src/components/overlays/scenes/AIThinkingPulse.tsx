/**
 * AIThinkingPulse — visual metaphor for "the AI is thinking", "behind the
 * scenes", "computation happening".
 *
 * A small glass card with three pulsing dots + a "Thinking…" label, plus
 * an optional AI logo/glyph (like an asterisk for Claude or a simple
 * brand letter). The dots pulse in a wave (1→2→3→1…) like every AI
 * streaming UI ever. Subtle and lightweight.
 *
 * Use cases:
 *   - "ה-AI מעבד את הבקשה" → 3 dots + "Thinking"
 *   - "behind the scenes" → 3 dots + brand glyph
 *   - "while you wait" → simple animated wait state
 */
import React from "react";
import {
  AbsoluteFill,
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
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface AIThinkingPulseScene {
  type: "ai_thinking_pulse";
  id: string;
  start: number;
  end: number;
  /** Label next to the dots. Default "Thinking…". */
  label?: string;
  /** Optional brand glyph (single character). e.g. "C" for Claude, "✦", "G". */
  glyph?: string;
  /** Optional eyebrow above. e.g. "AI AT WORK", "ה-AI עובד". */
  eyebrow?: string;
  /** Tone. Default "info" (purple — AI / cool / computational). */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: AIThinkingPulseScene;
}

export const AIThinkingPulse: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "info";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const label = scene.label ?? "Thinking…";

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.40,
  });

  // Pulse cycle — 1.2s period, 3 dots offset 0/0.15/0.30s
  const periodFrames = Math.max(1, Math.round(1.2 * fps));
  const dotPhase = (offsetSec: number): number => {
    const offsetFrames = Math.round(offsetSec * fps);
    return ((frame - offsetFrames) % periodFrames) / periodFrames;
  };
  const dotIntensity = (phase: number): number => {
    // Triangular wave: peak in the middle of the cycle
    if (phase < 0) phase += 1;
    const wave = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
    return wave;
  };

  // Glyph slow pulse — synced to dot 1
  const glyphPulse = 0.85 + 0.15 * dotIntensity(dotPhase(0));

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="18px 26px" rtl={false} style={{ minWidth: 320 }}>
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 12, marginBottom: 10, textAlign: "center" }}
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
              {/* Glyph */}
              {scene.glyph && (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: RADIUS.sm,
                    background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.30)})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${glyphPulse})`,
                    willChange: "transform",
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.30), 0 0 ${10 * (glyphPulse - 0.7)}px ${accentGlow}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#FFFFFF",
                    }}
                  >
                    {scene.glyph}
                  </span>
                </div>
              )}

              {/* Dots */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {[0, 0.15, 0.30].map((offset, i) => {
                  const intensity = dotIntensity(dotPhase(offset));
                  return (
                    <div
                      key={`dot-${i}`}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: accent,
                        opacity: 0.3 + 0.7 * intensity,
                        transform: `scale(${0.7 + 0.4 * intensity})`,
                        boxShadow: `0 0 ${8 * intensity}px ${accentGlow}`,
                        willChange: "opacity, transform",
                      }}
                    />
                  );
                })}
              </div>

              {/* Label */}
              <span
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 20,
                  fontWeight: 600,
                  color: COLORS.text,
                  letterSpacing: "-0.005em",
                }}
              >
                {label}
              </span>
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
            <HaloGlow
              tone={tone}
              size={420}
              intensity={0.35}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

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
