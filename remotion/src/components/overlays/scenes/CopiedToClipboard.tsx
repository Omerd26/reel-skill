/**
 * CopiedToClipboard — visual metaphor for "copy this", "shareable",
 * "grab this snippet".
 *
 * A read-only pill with text + a clipboard-copy icon. The clipboard icon
 * morphs to a green checkmark + the word "Copied!" flashes briefly. Then
 * it reverts to ready state. Tone defaults to brand.
 *
 * Use cases:
 *   - "Use code SAVE40" → SAVE40 pill + click + copied ✓
 *   - "העתק את הקישור" → URL pill + copy flash
 *   - "the magic prompt" → prompt text + copy interaction
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

export interface CopiedToClipboardScene {
  type: "copied_to_clipboard";
  id: string;
  start: number;
  end: number;
  /** The text shown inside the pill — short. e.g. "SAVE40", "GET-LAUNCH". */
  value: string;
  /** Eyebrow above. e.g. "PROMO CODE", "קוד מבצע". */
  eyebrow?: string;
  /** Optional sublabel under the pill. e.g. "30% off until Friday". */
  sublabel?: string;
  /** Tone — colors the pill + copy state. Default "brand". */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: CopiedToClipboardScene;
}

export const CopiedToClipboard: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const successAccent = toneColor("success");
  const successGlow = toneGlow("success");
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.45,
  });

  // Copy interaction sequence:
  //   0.55s — icon press scale-down
  //   0.65s — checkmark fade in + "Copied!" tooltip
  //   1.30s — tooltip fades out
  //   1.45s — icon reverts (but glow stays — completion bias)
  const pressT = interpolate(
    frame,
    [Math.round(0.55 * fps), Math.round(0.62 * fps), Math.round(0.70 * fps)],
    [1, 0.85, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const successT = interpolate(
    frame,
    [Math.round(0.65 * fps), Math.round(0.85 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
  );
  const tooltipT = interpolate(
    frame,
    [Math.round(0.75 * fps), Math.round(0.90 * fps), Math.round(1.30 * fps), Math.round(1.45 * fps)],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="22px 30px" rtl={false} style={{ minWidth: 340 }}>
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 14, marginBottom: 12, textAlign: "center" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* The pill with value + copy icon */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderRadius: RADIUS.pill,
                background: "rgba(0,0,0,0.30)",
                border: `1.5px solid ${accent}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 ${14 + successT * 18}px ${accentGlow}`,
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontFamily: FONTS.mono,
                  fontSize: 28,
                  fontWeight: 800,
                  color: COLORS.text,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {scene.value}
              </span>

              {/* Icon — clipboard morphs to checkmark */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: successT > 0.5
                    ? `linear-gradient(135deg, ${successAccent}, ${darken(successAccent, 0.25)})`
                    : `linear-gradient(135deg, ${accent}33, ${accent}66)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${pressT})`,
                  willChange: "transform, background",
                  boxShadow: successT > 0.5 ? `0 0 12px ${successGlow}` : "none",
                  border: `1px solid ${successT > 0.5 ? successAccent : accent}`,
                  position: "relative",
                }}
              >
                {/* Clipboard icon fades out as checkmark fades in */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 1 - successT,
                  }}
                >
                  <ClipboardIcon color={accent} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: successT,
                    transform: `scale(${0.5 + 0.5 * successT})`,
                  }}
                >
                  <CheckIcon color="#0E0E10" />
                </div>
              </div>

              {/* "Copied!" tooltip — floats above the icon */}
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  right: 12,
                  padding: "4px 10px",
                  borderRadius: RADIUS.sm,
                  background: successAccent,
                  color: "#0E0E10",
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  opacity: tooltipT,
                  transform: `translateY(${(1 - tooltipT) * 4}px)`,
                  willChange: "opacity, transform",
                  boxShadow: `0 4px 12px ${successGlow}`,
                  whiteSpace: "nowrap",
                }}
              >
                Copied!
              </div>
            </div>

            {scene.sublabel && (
              <div
                style={{
                  marginTop: 10,
                  fontFamily: FONTS.body,
                  fontSize: 16,
                  color: COLORS.textSecondary,
                  textAlign: "center",
                }}
              >
                {scene.sublabel}
              </div>
            )}
          </GlassCard>

          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.4 + successT * 0.2,
              pointerEvents: "none",
            }}
          >
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

const ClipboardIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width={18} height={18} viewBox="0 0 16 16">
    <rect x={5} y={2} width={6} height={3} rx={1} fill="none" stroke={color} strokeWidth={1.4} />
    <rect x={3} y={4} width={10} height={11} rx={1.5} fill="none" stroke={color} strokeWidth={1.4} />
  </svg>
);

const CheckIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width={20} height={20} viewBox="0 0 24 24">
    <path
      d="M 5 13 L 10 18 L 20 7"
      fill="none"
      stroke={color}
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
