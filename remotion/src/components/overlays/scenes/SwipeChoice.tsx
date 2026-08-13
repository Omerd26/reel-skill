/**
 * SwipeChoice — visual metaphor for "yes/no", "approve/reject", "Tinder choice".
 *
 * A card sits centered, then swipes either right (approve / yes) or left
 * (reject / no). The background hint reveals the green ✓ or red ✗ as the
 * card tilts. Card exits the frame with rotation.
 *
 * Use cases:
 *   - "תגיד כן" → card swipes right, ✓ green
 *   - "פסול את זה" → card swipes left, ✗ red
 *   - "אני בוחר את זה" → card swipes right
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
} from "../../../design/tokens";

export interface SwipeChoiceScene {
  type: "swipe_choice";
  id: string;
  start: number;
  end: number;
  /** Card title (1-2 short words). e.g. "פוסט יומי" / "DAILY POST". */
  card_title: string;
  /** Card subtitle (optional). */
  card_subtitle?: string;
  /** Direction the card swipes. "right" = yes/approve, "left" = no/reject. */
  direction: "right" | "left";
  /** Eyebrow above. Optional. */
  eyebrow?: string;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: SwipeChoiceScene;
}

export const SwipeChoice: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isYes = scene.direction === "right";
  const tone = isYes ? "success" : "danger";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const isHeb = isHebrew(scene.card_title);

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Card swipe — starts at 0.7s, takes 0.5s
  const swipeStart = Math.round(0.70 * fps);
  const swipeDuration = Math.round(0.50 * fps);
  const t = interpolate(
    frame,
    [swipeStart, swipeStart + swipeDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("whip-out") },
  );
  const direction = isYes ? 1 : -1;
  const cardX = direction * 240 * t;
  const cardRotation = direction * 18 * t;
  const cardOpacity = t < 0.7 ? 1 : interpolate(t, [0.7, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Background hint reveals as card moves
  const hintOpacity = Math.min(1, t * 1.6);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="frosted" padding="22px 26px" rtl={isHeb} style={{ minWidth: 320 }}>
            {scene.eyebrow && (
              <Eyebrow tone={tone} script={isHeb ? "hebrew" : "latin"} style={{ fontSize: 18, marginBottom: 14, textAlign: "center" }}>
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Stage */}
            <div
              style={{
                position: "relative",
                width: 280,
                height: 220,
                margin: "0 auto",
                overflow: "hidden",
                borderRadius: RADIUS.lg,
              }}
            >
              {/* Background hint (✓ or ✗) */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: RADIUS.lg,
                  background: `linear-gradient(135deg, ${withAlpha(accent, 0.30)}, ${withAlpha(accent, 0.05)})`,
                  border: `2px solid ${accent}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: hintOpacity,
                  boxShadow: `inset 0 0 30px ${withAlpha(accent, 0.20)}, 0 0 22px ${accentGlow}`,
                }}
              >
                <svg width={88} height={88} viewBox="0 0 24 24">
                  {isYes ? (
                    <path
                      d="M 5 13 L 10 18 L 20 7"
                      fill="none"
                      stroke={accent}
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: `drop-shadow(0 0 8px ${accentGlow})` }}
                    />
                  ) : (
                    <>
                      <line
                        x1={6}
                        y1={6}
                        x2={18}
                        y2={18}
                        stroke={accent}
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 8px ${accentGlow})` }}
                      />
                      <line
                        x1={18}
                        y1={6}
                        x2={6}
                        y2={18}
                        stroke={accent}
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 8px ${accentGlow})` }}
                      />
                    </>
                  )}
                </svg>
              </div>

              {/* The choice card */}
              <div
                style={{
                  position: "absolute",
                  inset: 16,
                  borderRadius: RADIUS.md,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.30)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.30), 0 12px 28px rgba(0,0,0,0.35)",
                  transform: `translateX(${cardX}px) rotate(${cardRotation}deg)`,
                  opacity: cardOpacity,
                  willChange: "transform, opacity",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    ...TYPE.sectionTitle,
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    textAlign: "center",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {scene.card_title}
                </div>
                {scene.card_subtitle && (
                  <div
                    style={{
                      ...TYPE.body,
                      fontSize: 16,
                      color: COLORS.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    {scene.card_subtitle}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35 + hintOpacity * 0.25, pointerEvents: "none" }}>
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

function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
