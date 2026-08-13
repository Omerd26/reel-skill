/**
 * KeyboardShortcut — visual metaphor for "the shortcut", "hotkey", "power-user move".
 *
 * Key cap labels inside a glass card. Each key looks like a real mechanical
 * key: rounded square, soft top highlight, drop shadow. Keys press in
 * sequence (left-to-right) with a tiny scale-down → release. After the
 * combo lands, a small "→ action" caption fades in. Apple-style by default.
 *
 * Use cases:
 *   - "⌘ + K to search" → ⌘ K + "search"
 *   - "Cmd+Shift+P לפלטה" → ⌘ ⇧ P + "command palette"
 *   - "press Enter" → single key flash
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

export interface KeyboardShortcutScene {
  type: "keyboard_shortcut";
  id: string;
  start: number;
  end: number;
  /** The keys in the combo. e.g. ["⌘", "K"] or ["⌘", "⇧", "P"]. */
  keys: string[];
  /** Optional action label that fades in after the press. e.g. "Search". */
  action?: string;
  /** Optional eyebrow. e.g. "SHORTCUT", "קיצור הקלדה". */
  eyebrow?: string;
  /** Tone — colors the key press flash + glow. Default "brand". */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: KeyboardShortcutScene;
}

export const KeyboardShortcut: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const keys = scene.keys.slice(0, 4);

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.45,
  });

  // Keys press in sequence — 0.55s, 0.75s, 0.95s, 1.15s
  // Action fades in 0.30s after the last key press
  const lastPressStart = 0.55 + (keys.length - 1) * 0.20;
  const actionStart = lastPressStart + 0.30;

  const actionT = interpolate(
    frame,
    [Math.round(actionStart * fps), Math.round((actionStart + 0.30) * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("confident"),
    },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material="liquid"
            padding="26px 32px"
            rtl={false}
            style={{ minWidth: 360 }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 14, marginBottom: 18, textAlign: "center" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Key row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {keys.map((k, i) => {
                const pressStartFrame = Math.round((0.55 + i * 0.20) * fps);
                const press = interpolate(
                  frame,
                  [
                    pressStartFrame,
                    pressStartFrame + Math.round(0.08 * fps),
                    pressStartFrame + Math.round(0.16 * fps),
                    pressStartFrame + Math.round(0.50 * fps),
                  ],
                  [1, 0.88, 1, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );
                // Highlight glow ramps after press
                const glow = interpolate(
                  frame,
                  [pressStartFrame + Math.round(0.08 * fps), pressStartFrame + Math.round(0.30 * fps)],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );

                return (
                  <React.Fragment key={`k-${i}`}>
                    <KeyCap
                      label={k}
                      pressScale={press}
                      glow={glow}
                      accent={accent}
                      accentGlow={accentGlow}
                    />
                    {i < keys.length - 1 && (
                      <span
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 24,
                          fontWeight: 400,
                          color: COLORS.textTertiary,
                          margin: "0 2px",
                        }}
                      >
                        +
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Action caption */}
            {scene.action && (
              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  opacity: actionT,
                  transform: `translateY(${(1 - actionT) * 6}px)`,
                  willChange: "opacity, transform",
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 18,
                    color: COLORS.textTertiary,
                  }}
                >
                  →
                </span>
                <span
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 22,
                    fontWeight: 700,
                    color: accent,
                    letterSpacing: "-0.005em",
                    textShadow: `0 0 12px ${accentGlow}`,
                  }}
                >
                  {scene.action}
                </span>
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

// ── KeyCap ──────────────────────────────────────────────────────────────────

const KeyCap: React.FC<{
  label: string;
  pressScale: number;
  glow: number;
  accent: string;
  accentGlow: string;
}> = ({ label, pressScale, glow, accent, accentGlow }) => {
  const isSpecial = label.length > 1 && !/^[A-Z]$/.test(label);
  const width = isSpecial ? Math.max(60, label.length * 14 + 28) : 60;

  return (
    <div
      style={{
        width,
        height: 60,
        borderRadius: RADIUS.md,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 100%)",
        border: `1px solid ${glow > 0.4 ? accent : "rgba(255,255,255,0.22)"}`,
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.35),
          inset 0 -3px 0 rgba(0,0,0,0.30),
          0 4px 8px rgba(0,0,0,0.40),
          0 0 ${glow * 16}px ${accentGlow}
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${pressScale})`,
        willChange: "transform",
      }}
    >
      <span
        style={{
          fontFamily: FONTS.body,
          fontSize: label.length > 2 ? 16 : 26,
          fontWeight: 700,
          color: glow > 0.4 ? accent : COLORS.text,
          letterSpacing: "-0.01em",
          textShadow: glow > 0.4 ? `0 0 8px ${accentGlow}` : "none",
        }}
      >
        {label}
      </span>
    </div>
  );
};

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}
