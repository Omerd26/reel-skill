/**
 * PriceTag — visual metaphor for "discount", "limited offer", "value".
 *
 * Two-stage price flip inside a glass card:
 *   1. Old price visible with strikethrough animating across
 *   2. New price slides up from below with chrome gradient + halo
 *   3. Discount badge pops in (e.g. "−40%" or "SAVE $200")
 *
 * Use cases:
 *   - "במקום 500 ש"ח, רק 99" → strikethrough flip + discount badge
 *   - "בלעדי היום" → price + "TODAY ONLY" badge
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

export interface PriceTagScene {
  type: "price_tag";
  id: string;
  start: number;
  end: number;
  /** Old (struck-through) price as a string. e.g. "₪500", "$199". */
  old_price?: string;
  /** New price as a string. e.g. "₪99", "$49". */
  new_price: string;
  /** Optional discount badge text. e.g. "−40%", "SAVE 200". */
  badge?: string;
  /** Eyebrow above. e.g. "מחיר היום בלבד" / "TODAY ONLY". */
  eyebrow?: string;
  /** Tone — colors new price + badge. Default "brand". */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: PriceTagScene;
}

export const PriceTag: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Strikethrough sweep on old price (0.55s → 0.85s)
  const strikeStart = Math.round(0.55 * fps);
  const strikeT = interpolate(
    frame,
    [strikeStart, strikeStart + Math.round(0.30 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("whip-out") },
  );

  // New price slides up (0.85s → 1.30s)
  const newPriceStart = Math.round(0.85 * fps);
  const newPriceT = interpolate(
    frame,
    [newPriceStart, newPriceStart + Math.round(0.45 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
  );
  const newPriceY = (1 - newPriceT) * 60;

  // Old price fades out as new comes in
  const oldFade = newPriceT < 0.4 ? 1 : interpolate(newPriceT, [0.4, 0.9], [1, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Badge pops at 1.30s
  const badgeStart = newPriceStart + Math.round(0.45 * fps);
  const badgeT = interpolate(
    frame,
    [badgeStart, badgeStart + Math.round(0.30 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="22px 30px" rtl={false} style={{ minWidth: 280, position: "relative" }}>
            {scene.eyebrow && (
              <Eyebrow tone={tone} script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"} style={{ fontSize: 16, marginBottom: 14, textAlign: "center" }}>
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Price stack */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                position: "relative",
                minHeight: 110,
              }}
            >
              {/* Old price with strikethrough */}
              {scene.old_price && (
                <div
                  style={{
                    position: "relative",
                    ...TYPE.sectionTitle,
                    fontSize: 32,
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    opacity: oldFade,
                  }}
                >
                  {scene.old_price}
                  {/* Animated strikethrough line */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      right: 0,
                      height: 3,
                      background: COLORS.danger,
                      transform: `translateY(-50%) scaleX(${strikeT})`,
                      transformOrigin: "left center",
                      borderRadius: 2,
                      boxShadow: `0 0 8px ${toneGlow("danger")}`,
                    }}
                  />
                </div>
              )}

              {/* New price */}
              <div
                style={{
                  ...TYPE.numberLockup,
                  fontSize: 84,
                  color: accent,
                  textShadow: `0 0 20px ${accentGlow}`,
                  lineHeight: 1,
                  transform: `translateY(${newPriceY}px)`,
                  opacity: newPriceT,
                  willChange: "transform, opacity",
                }}
              >
                {scene.new_price}
              </div>
            </div>

            {/* Discount badge — top-right corner */}
            {scene.badge && (
              <div
                style={{
                  position: "absolute",
                  top: -16,
                  right: -16,
                  padding: "8px 14px",
                  borderRadius: RADIUS.pill,
                  background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.25)})`,
                  border: "1.5px solid rgba(255,255,255,0.35)",
                  boxShadow: `0 4px 16px rgba(0,0,0,0.40), 0 0 ${20 * badgeT}px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.30)`,
                  transform: `scale(${badgeT}) rotate(${(1 - badgeT) * -25}deg)`,
                  opacity: badgeT,
                  willChange: "transform, opacity",
                }}
              >
                <span style={{ ...TYPE.eyebrow, fontSize: 18, fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.04em" }}>
                  {scene.badge}
                </span>
              </div>
            )}
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.4 + newPriceT * 0.2, pointerEvents: "none" }}>
            <HaloGlow tone={tone} size={500} intensity={0.5} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
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
