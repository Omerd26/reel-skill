/**
 * MetricLockup — big number + label.
 *
 * The "stat moment" — eyebrow on top, hero number in the middle (count-up
 * animation), label + sublabel below. Tone-tinted halo behind the number.
 *
 * Adopted from may-shorts-19 scene1-intro pattern: `0 → N` count with snap,
 * eyebrow appears first (power2.out 0.35s), number counts up (power2.out
 * 0.40-0.80s), then a stamp/label clip-path reveals (power3.out 0.28s),
 * underline sweeps (power2.out 0.30s).
 *
 * Three different easings across four stages — meets the "≥3 eases per scene"
 * rule by design.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance, useAmbient } from "../motion";
import {
  GlassCard,
  ChromeText,
  Eyebrow,
  HaloGlow,
  AccentUnderline,
  resolveAnchor,
} from "../primitives";
import { TYPE, easeFn, type Tone, COLORS } from "../../../design/tokens";
import type { MetricLockupScene } from "../types";

interface Props {
  scene: MetricLockupScene;
}

export const MetricLockup: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  // Metric numbers are tall and bright — anchor top-right so the eye
  // catches them without occluding the face.
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const useCard = scene.card ?? true;
  const blurred = scene.blurred === true;

  // Number count-up.
  // Default: power2.out over 0.50s, snapping to integers.
  // run_past (JATHO §2 PAYOFF role): the counter spans ~85% of the WHOLE
  // scene duration — "proof is a process", it keeps ticking into the next
  // sentence — with a near-linear ease that stays visibly moving late.
  // blurred (JATHO §1.2 tease clone): count frozen at full value so the
  // censored number has the payoff's true SHAPE — no ticking reveal.
  const sceneFrames = Math.max(1, Math.round((scene.end - scene.start) * fps));
  const runPast = scene.run_past === true;
  const countStartFrames = Math.round(0.10 * fps);
  const countDurationFrames = runPast
    ? Math.max(1, Math.round(0.85 * sceneFrames))
    : Math.round(0.50 * fps);
  const countT = interpolate(frame, [countStartFrames, countStartFrames + countDurationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: runPast ? RUN_PAST_EASE : easeFn("confident"),
  });
  const t = blurred ? 1 : countT;
  const displayValue = Math.round(scene.value * t);

  // Blurred tease: faint deterministic breathing halo (mystery signal),
  // same rhythm as the ToggleSwitch/SettingsToggleList tease states.
  const breath = 0.5 + 0.5 * Math.sin(((frame / fps) * Math.PI * 2) / 3.4);
  const mysteryGlow = 0.16 + 0.16 * breath;

  // Eyebrow entrance (fade) at offset 0
  const eyebrowEntrance = useEntrance({
    signature: "fade",
    durationSec: 0.35,
    offsetFrames: Math.round(0.05 * fps),
  });
  // Card entrance (glass-rise) at offset 0
  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.55,
    offsetFrames: 0,
  });
  // Label clip-path reveal at offset 0.65s (tease: shown instantly — reveal
  // animations are withheld for the payoff).
  const labelOffsetFrames = Math.round(0.65 * fps);
  const labelRevealT = interpolate(
    frame,
    [labelOffsetFrames, labelOffsetFrames + Math.round(0.30 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("whip-out"),
    },
  );
  const labelT = blurred ? 1 : labelRevealT;
  // Underline sweep at offset 0.95s (tease: suppressed — no accent reveal).
  const underlineOffsetFrames = Math.round(0.95 * fps);
  const underlineSweepT = interpolate(
    frame,
    [underlineOffsetFrames, underlineOffsetFrames + Math.round(0.30 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("confident"),
    },
  );
  const underlineT = blurred ? 0 : underlineSweepT;

  // Ambient drift on the whole lockup
  const ambient = useAmbient({
    startAfterSec: 1.4,
    kind: "y-bob",
    amplitude: 3,
    periodSec: 4.5,
  });

  const display = `${scene.prefix ?? ""}${displayValue.toLocaleString("he-IL")}${scene.suffix ?? ""}`;

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        // Tease censor: number + labels unreadable, card chrome stays crisp.
        ...(blurred ? { filter: "blur(9px)", opacity: 0.55 } : null),
      }}
    >
      {scene.eyebrow && (
        <div style={{ ...eyebrowEntrance }}>
          <Eyebrow tone={tone} script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}>
            {scene.eyebrow}
          </Eyebrow>
        </div>
      )}

      {/* The hero number */}
      <div style={{ position: "relative" }}>
        <ChromeText
          role="numberLockup"
          tone={tone}
          style={{
            ...TYPE.numberLockup,
            // tight kerning + tabular nums already on the role
          }}
        >
          {display}
        </ChromeText>
      </div>

      {/* Label + sublabel + underline */}
      {scene.label && (
        <div
          style={{
            position: "relative",
            paddingBottom: 16,
            clipPath: `inset(0 ${(1 - labelT) * 100}% 0 0)`,
          }}
        >
          <div
            style={{
              ...TYPE.sectionTitle,
              fontSize: 44,
              color: COLORS.text,
              textAlign: "center",
              letterSpacing: "0.04em",
            }}
          >
            {scene.label}
          </div>
          {scene.sublabel && (
            <div
              style={{
                ...TYPE.body,
                fontSize: 24,
                color: COLORS.textSecondary,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {scene.sublabel}
            </div>
          )}
          <AccentUnderline tone={tone} progress={underlineT} thickness={4} />
        </div>
      )}
    </div>
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        {/* Halo behind the lockup — tease dims it to a faint breathing
            mystery glow; normal path renders it exactly as before. */}
        {blurred ? (
          <div style={{ opacity: mysteryGlow }}>
            <HaloGlow
              tone={tone}
              size={900}
              intensity={0.55}
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        ) : (
          <HaloGlow
            tone={tone}
            size={900}
            intensity={0.55}
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        <div
          style={{
            ...cardEntrance,
            transform: mergeTransforms(cardEntrance.transform, ambient.transform),
          }}
        >
          {/* TEASE LABEL (owner 2026-08-09): SHOUT word above the censored
              card naming WHAT is hidden — without it viewers don't realize
              something is deliberately blurred. */}
          {blurred && (
            <div
              style={{
                textAlign: "center",
                marginBottom: 12,
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 46,
                direction: "rtl",
                color: "#E0701E",
                textShadow: "0 0 24px rgba(224,112,30,0.65), 0 2px 10px rgba(0,0,0,0.8)",
              }}
            >
              {scene.tease_label || "הסוד:"}
            </div>
          )}
          {useCard ? (
            <GlassCard
              material="frosted"
              padding="48px 64px"
              rtl={false}
              style={
                blurred
                  ? {
                      background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.6)",
                    }
                  : undefined
              }
            >
              {content}
            </GlassCard>
          ) : (
            content
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Near-linear ease for run_past counters: 65% linear + 35% power2.out.
// Derivative never drops below ~0.65, so the number is still visibly
// ticking deep into the scene instead of settling early.
const RUN_PAST_EASE = (t: number): number =>
  0.65 * t + 0.35 * (1 - (1 - t) * (1 - t));

function mergeTransforms(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}
