/**
 * TapInteraction — visual metaphor for "easiest way", "single click", "shortcut".
 *
 * Direct port of the MOTION_PHILOSOPHY §2.4 "Faux-cursor click event" pattern:
 *   1. Cursor compress (scale 0.82, 0.07s)
 *   2. Target compress (scale 0.96, 0.07s)
 *   3. Ripple burst (scale 0→2.5, opacity 0.9→0, 0.20s)
 *   4. Cursor release (back.out(3), 0.30s)
 *   5. Target overshoot (1.02 elastic, 0.20s)
 *   6. Target settle (1.0 power2.out, 0.20s)
 *   7. Optional state label crossfade (e.g. "READY" → "DONE")
 *
 * Anchored top-right by default. The button has a clean iOS-26 look (liquid
 * glass capsule, subtle gradient, brand-tinted glow when activated).
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

export interface TapInteractionScene {
  type: "tap_interaction";
  id: string;
  start: number;
  end: number;
  /** Button label (short — 1 word ideally). e.g. "PUBLISH", "GO", "פתח". */
  button_label: string;
  /** Eyebrow above (optional). */
  eyebrow?: string;
  /** Tone — colors button + ripple + glow. Default "brand". */
  tone?: Tone;
  anchor?: OverlayAnchor;
  /** Optional post-tap state label. e.g. "DONE", "LIVE", "אישור". */
  done_label?: string;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: TapInteractionScene;
}

export const TapInteraction: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Click sequence — exact timings from MOTION_PHILOSOPHY §2.4
  const tapStart = Math.round(0.65 * fps);

  // Cursor compress: scale 1 → 0.82 over 0.07s
  const cursorScale = interpolate(
    frame,
    [tapStart, tapStart + Math.round(0.07 * fps), tapStart + Math.round(0.14 * fps), tapStart + Math.round(0.44 * fps)],
    [1, 0.82, 0.82, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("whip-in"),
    },
  );

  // Target compress + overshoot + settle
  const targetT = interpolate(
    frame,
    [
      tapStart + Math.round(0.07 * fps),                // start compress
      tapStart + Math.round(0.14 * fps),                // hit bottom
      tapStart + Math.round(0.34 * fps),                // overshoot peak
      tapStart + Math.round(0.54 * fps),                // settle
    ],
    [1.0, 0.96, 1.04, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Ripple — starts at the click instant
  const rippleStart = tapStart + Math.round(0.07 * fps);
  const rippleT = interpolate(
    frame,
    [rippleStart, rippleStart + Math.round(0.20 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("whip-out") },
  );
  const rippleScale = 0.5 + 2.0 * rippleT;
  const rippleOpacity = 0.9 * (1 - rippleT);

  // Glow ramps after the click settles
  const glowStart = tapStart + Math.round(0.30 * fps);
  const glowT = interpolate(
    frame,
    [glowStart, glowStart + Math.round(0.30 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Done label fades in after click
  const doneStart = tapStart + Math.round(0.50 * fps);
  const doneT = interpolate(
    frame,
    [doneStart, doneStart + Math.round(0.30 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material="frosted"
            padding="22px 26px"
            rtl={false}
            style={{
              minWidth: 300,
              position: "relative",
              background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.55)",
            }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 24, marginBottom: 18 }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Button + cursor stage */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 0",
              }}
            >
              {/* Ripple */}
              <div
                style={{
                  position: "absolute",
                  width: 260,
                  height: 70,
                  borderRadius: RADIUS.pill,
                  background: accent,
                  opacity: rippleOpacity,
                  transform: `scale(${rippleScale})`,
                  pointerEvents: "none",
                  filter: "blur(2px)",
                }}
              />

              {/* Button */}
              <div
                style={{
                  position: "relative",
                  padding: "18px 36px",
                  borderRadius: RADIUS.pill,
                  background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.25)})`,
                  border: "1px solid rgba(255,255,255,0.22)",
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.30), 0 6px 18px rgba(0,0,0,0.35), 0 0 ${20 * glowT}px ${accentGlow}`,
                  transform: `scale(${targetT})`,
                  willChange: "transform",
                }}
              >
                <span
                  style={{
                    ...TYPE.eyebrow,
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: "0.08em",
                  }}
                >
                  {scene.button_label.toUpperCase()}
                </span>
              </div>

              {/* Cursor */}
              <div
                style={{
                  position: "absolute",
                  right: 10,
                  bottom: -4,
                  transform: `scale(${cursorScale})`,
                  transformOrigin: "20% 20%",
                  willChange: "transform",
                  pointerEvents: "none",
                }}
              >
                <CursorIcon />
              </div>
            </div>

            {/* Done label — appears after the click */}
            {scene.done_label && (
              <div
                style={{
                  marginTop: 10,
                  textAlign: "center",
                  ...TYPE.eyebrow,
                  fontSize: 22,
                  fontWeight: 700,
                  color: accent,
                  opacity: doneT,
                  letterSpacing: "0.16em",
                  textShadow: `0 0 14px ${accentGlow}`,
                }}
              >
                {scene.done_label.toUpperCase()}
              </div>
            )}
          </GlassCard>

          {/* Halo */}
          <div
            style={{ position: "absolute", inset: 0, opacity: glowT * 0.5, pointerEvents: "none" }}
          >
            <HaloGlow
              tone={tone}
              size={420}
              intensity={0.4}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Cursor icon ──────────────────────────────────────────────────────────────

const CursorIcon: React.FC = () => (
  <svg viewBox="0 0 24 28" width={32} height={36}>
    <defs>
      <filter id="cursor-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.4" />
      </filter>
    </defs>
    <path
      d="M 2 2 L 2 22 L 8 18 L 11 24 L 14 22 L 11 16 L 18 16 Z"
      fill="#FFFFFF"
      stroke="#0A0A0C"
      strokeWidth={1.5}
      strokeLinejoin="round"
      filter="url(#cursor-shadow)"
    />
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// silence COLORS unused warn (used indirectly via tokens)
export const _COLOR_REF: unknown = COLORS;
