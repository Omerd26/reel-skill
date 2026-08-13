/**
 * BeforeAfterSlider — visual metaphor for "transformation", "what changed",
 * "compare results".
 *
 * Two stacked panels inside a glass card with a vertical divider/handle
 * that animates left → right (or right → left in RTL). On the left side
 * of the divider: "before" label + value. On the right: "after". The
 * divider line glows; the handle is a small grippy bar. As the slider
 * moves, the after side reveals more.
 *
 * Use cases:
 *   - "לפני: 12 שעות בשבוע. אחרי: 30 דקות." → before/after time
 *   - "before AI: manual. after: automatic." → process flip
 *   - "before vs after our system" → A vs B with slider
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

export interface BeforeAfterSliderScene {
  type: "before_after_slider";
  id: string;
  start: number;
  end: number;
  /** "Before" content. */
  before: { label: string; value: string; tone?: Tone };
  /** "After" content. */
  after: { label: string; value: string; tone?: Tone };
  /** Optional outer eyebrow. e.g. "TRANSFORMATION", "התוצאה". */
  eyebrow?: string;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: BeforeAfterSliderScene;
}

export const BeforeAfterSlider: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beforeTone: Tone = scene.before.tone ?? "danger";
  const afterTone: Tone = scene.after.tone ?? "success";
  const beforeAccent = toneColor(beforeTone);
  const afterAccent = toneColor(afterTone);
  const afterGlow = toneGlow(afterTone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });

  // Slider animates from 90% (showing mostly "before") to 25% (showing
  // mostly "after"). Sweep 0.65s → 1.50s.
  const sliderT = interpolate(
    frame,
    [Math.round(0.65 * fps), Math.round(1.50 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide") },
  );
  const sliderPos = 0.85 - 0.60 * sliderT; // 0.85 → 0.25

  // After's value glows brighter as it gains more screen real estate
  const afterRevealT = 1 - sliderPos; // 0.15 → 0.75

  const STAGE_W = 580;
  const STAGE_H = 220;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material="liquid"
            padding="24px 28px"
            rtl={false}
            style={{ minWidth: STAGE_W + 56 }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={afterTone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 14, marginBottom: 14, textAlign: "center" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Stage */}
            <div
              style={{
                position: "relative",
                width: STAGE_W,
                height: STAGE_H,
                margin: "0 auto",
                borderRadius: RADIUS.lg,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {/* Before panel — full width underneath */}
              <Panel
                title={scene.before.label}
                value={scene.before.value}
                accent={beforeAccent}
                glow={toneGlow(beforeTone)}
                side="before"
              />

              {/* After panel — clipped to slider position */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  clipPath: `inset(0 0 0 ${sliderPos * 100}%)`,
                  willChange: "clip-path",
                }}
              >
                <Panel
                  title={scene.after.label}
                  value={scene.after.value}
                  accent={afterAccent}
                  glow={afterGlow}
                  side="after"
                  intensity={afterRevealT}
                />
              </div>

              {/* Divider + handle */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${sliderPos * 100}%`,
                  width: 2,
                  marginLeft: -1,
                  background: afterAccent,
                  boxShadow: `0 0 12px ${afterGlow}, 0 0 24px ${afterGlow}`,
                  willChange: "left",
                }}
              />
              {/* Handle bar */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${sliderPos * 100}%`,
                  transform: "translate(-50%, -50%)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(10px)",
                  border: `2px solid ${afterAccent}`,
                  boxShadow: `0 0 20px ${afterGlow}, inset 0 1px 0 rgba(255,255,255,0.30)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  willChange: "left",
                }}
              >
                <div style={{ width: 2, height: 12, background: afterAccent, borderRadius: 1 }} />
                <div style={{ width: 2, height: 12, background: afterAccent, borderRadius: 1 }} />
              </div>
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }}>
            <HaloGlow
              tone={afterTone}
              size={680}
              intensity={0.4}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Panel ────────────────────────────────────────────────────────────────────

const Panel: React.FC<{
  title: string;
  value: string;
  accent: string;
  glow: string;
  side: "before" | "after";
  intensity?: number;
}> = ({ title, value, accent, glow, side, intensity = 1 }) => {
  // Each side pins its content to its OWN half so the BEFORE label can't
  // overlap with the AFTER label when both panels render (the AFTER panel
  // is just a clip-path mask over the BEFORE panel, so their text would
  // otherwise stack at the same centerline).
  const isBefore = side === "before";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(135deg, ${accent}11, ${accent}33)`,
        borderLeft: side === "after" ? `4px solid ${accent}` : "none",
        borderRight: side === "before" ? `4px solid ${accent}` : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: isBefore ? "flex-start" : "flex-end",
        justifyContent: "flex-start",
        gap: 10,
        padding: isBefore ? "26px 20px 20px 36px" : "26px 36px 20px 20px",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: 14,
          fontWeight: 700,
          color: accent,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          opacity: 0.9,
          maxWidth: "46%",
          textAlign: isBefore ? "left" : "right",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: 48,
          fontWeight: 900,
          color: COLORS.text,
          letterSpacing: "-0.02em",
          textShadow: side === "after" ? `0 0 ${22 * intensity}px ${glow}` : "none",
          textAlign: isBefore ? "left" : "right",
          lineHeight: 1.05,
          maxWidth: "46%",
        }}
      >
        {value}
      </div>
    </div>
  );
};

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}
