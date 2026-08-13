/**
 * SpotlightCircle — visual metaphor for "this is what matters", "focus here",
 * "zoom in on this".
 *
 * A glass card with a centered subject (single word/number/icon-glyph). A
 * circular spotlight beam draws around it, dimming everything outside. The
 * spotlight contracts (expand→settle) over ~0.6s so the eye is yanked toward
 * the highlighted element.
 *
 * Use cases:
 *   - "התמקדו רק בזה" → ONE WORD with spotlight
 *   - "הפיצ׳ר היחיד שחשוב" → "Speed." or "Time." with spotlight
 *   - "watch this exact thing" → big symbol/glyph with spotlight
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
  resolveAnchor,
  type OverlayAnchor,
} from "../primitives";
import {
  COLORS,
  FONTS,
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface SpotlightCircleScene {
  type: "spotlight_circle";
  id: string;
  start: number;
  end: number;
  /** The subject in the spotlight. Short — 1-2 words or a glyph. */
  subject: string;
  /** Optional eyebrow. e.g. "FOCUS", "התמקדו". */
  eyebrow?: string;
  /** Optional sublabel under the subject. */
  sublabel?: string;
  /** Tone — colors the spotlight rim + glow. Default "brand". */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: SpotlightCircleScene;
}

export const SpotlightCircle: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });

  // Spotlight: starts wide (1.6×) and contracts to natural size by 1.10s
  const spotlightT = interpolate(
    frame,
    [Math.round(0.55 * fps), Math.round(1.10 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide") },
  );
  const spotlightScale = 1.6 - 0.6 * spotlightT;

  // Subject content scales-in slightly after spotlight starts contracting
  const subjectT = interpolate(
    frame,
    [Math.round(0.75 * fps), Math.round(1.25 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
  );

  const SIZE = 260;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material="solid-dark"
            padding="32px 36px"
            rtl={false}
            style={{ minWidth: 420, position: "relative", overflow: "hidden" }}
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

            {/* Stage with the spotlight */}
            <div
              style={{
                position: "relative",
                width: SIZE + 40,
                height: SIZE + 40,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* The dimming vignette around the spotlight */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(circle at center, transparent ${
                    35 * (2 - spotlightScale)
                  }%, rgba(0,0,0,0.65) ${50 + 10 * spotlightT}%)`,
                  pointerEvents: "none",
                }}
              />

              {/* Spotlight ring */}
              <div
                style={{
                  position: "absolute",
                  width: SIZE,
                  height: SIZE,
                  borderRadius: "50%",
                  border: `2px solid ${accent}`,
                  boxShadow: `0 0 ${30 + 30 * spotlightT}px ${accentGlow}, inset 0 0 ${30 + 20 * spotlightT}px ${accent}33`,
                  transform: `scale(${spotlightScale})`,
                  willChange: "transform",
                }}
              />

              {/* Inner glow disc */}
              <div
                style={{
                  position: "absolute",
                  width: SIZE * 0.85,
                  height: SIZE * 0.85,
                  borderRadius: "50%",
                  background: `radial-gradient(circle at center, ${accent}22 0%, transparent 70%)`,
                  filter: "blur(8px)",
                  opacity: spotlightT,
                }}
              />

              {/* Subject */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  opacity: subjectT,
                  transform: `scale(${0.7 + 0.3 * subjectT})`,
                  willChange: "transform, opacity",
                }}
              >
                <div
                  style={{
                    ...TYPE.displayHeadline,
                    fontSize: 64,
                    fontWeight: 900,
                    color: COLORS.text,
                    letterSpacing: "-0.02em",
                    textAlign: "center",
                    textShadow: `0 0 ${20 * subjectT}px ${accentGlow}`,
                    fontFamily: FONTS.display,
                  }}
                >
                  {scene.subject}
                </div>
                {scene.sublabel && (
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 18,
                      fontWeight: 500,
                      color: COLORS.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    {scene.sublabel}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  );
};

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}
