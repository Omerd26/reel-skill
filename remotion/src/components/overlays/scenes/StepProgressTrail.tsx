/**
 * StepProgressTrail — visual metaphor for "the steps", "phase by phase",
 * "the process from A to Z".
 *
 * A horizontal trail of N steps (3-5) inside a glass card. Each step has
 * a circular node with a number, a label below, and a connecting line to
 * the next. Steps activate left-to-right (or right-to-left in RTL): the
 * node fills with the brand color and a ✓ replaces the number once
 * complete. The active step glows; future steps are dim.
 *
 * Distinct from FlowArrow (which is hub-and-leaves) — this is a strict
 * left-to-right sequence with named phases.
 *
 * Use cases:
 *   - "ארבעה שלבים פשוטים" → 4 steps activating
 *   - "follow these 3 steps" → step 1 → 2 → 3 with checkmarks
 *   - "the journey from idea to launch" → idea → build → ship
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
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface StepProgressTrailScene {
  type: "step_progress_trail";
  id: string;
  start: number;
  end: number;
  /** Step labels — 2-5 work best. */
  steps: string[];
  /** Optional eyebrow. e.g. "THE PROCESS", "התהליך". */
  eyebrow?: string;
  /** Tone — colors active nodes + glow. Default "brand". */
  tone?: Tone;
  /** Per-step reveal interval in ms. Default 450. */
  step_interval_ms?: number;
  anchor?: OverlayAnchor;
  rtl?: boolean;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: StepProgressTrailScene;
}

export const StepProgressTrail: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const steps = scene.steps.slice(0, 5);
  const rtl = scene.rtl ?? steps.some((s) => isHebrew(s));
  const intervalMs = scene.step_interval_ms ?? 450;

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material="liquid"
            padding="28px 36px"
            rtl={false}
            style={{ minWidth: 560 }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 14, marginBottom: 22, textAlign: "center" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Trail */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 0,
                direction: rtl ? "rtl" : "ltr",
              }}
            >
              {steps.map((label, i) => {
                const startSec = 0.55 + i * (intervalMs / 1000);
                const startFrame = Math.round(startSec * fps);
                const nodeT = interpolate(
                  frame,
                  [startFrame, startFrame + Math.round(0.35 * fps)],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
                );
                const checkT = interpolate(
                  frame,
                  [startFrame + Math.round(0.30 * fps), startFrame + Math.round(0.55 * fps)],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
                );

                return (
                  <React.Fragment key={`step-${i}`}>
                    <Step
                      number={i + 1}
                      label={label}
                      nodeT={nodeT}
                      checkT={checkT}
                      accent={accent}
                      accentGlow={accentGlow}
                    />
                    {i < steps.length - 1 && (
                      <Connector
                        startFrame={startFrame + Math.round(0.20 * fps)}
                        endFrame={startFrame + Math.round(0.45 * fps)}
                        accent={accent}
                        accentGlow={accentGlow}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }}>
            <HaloGlow
              tone={tone}
              size={620}
              intensity={0.4}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Step ────────────────────────────────────────────────────────────────────

const Step: React.FC<{
  number: number;
  label: string;
  nodeT: number;
  checkT: number;
  accent: string;
  accentGlow: string;
}> = ({ number, label, nodeT, checkT, accent, accentGlow }) => {
  const filled = nodeT > 0.5;
  const showCheck = checkT > 0.4;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        flex: "0 0 auto",
        minWidth: 92,
      }}
    >
      {/* Node */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: filled
            ? `linear-gradient(135deg, ${accent}, ${darken(accent, 0.25)})`
            : "rgba(255,255,255,0.06)",
          border: `2px solid ${filled ? accent : "rgba(255,255,255,0.18)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${0.7 + 0.3 * nodeT})`,
          boxShadow: filled
            ? `0 0 ${14 * checkT}px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.25)`
            : "none",
          willChange: "transform, background",
          position: "relative",
        }}
      >
        {/* Number / check crossfade */}
        <span
          style={{
            position: "absolute",
            fontFamily: FONTS.body,
            fontSize: 22,
            fontWeight: 800,
            color: filled ? "#FFFFFF" : COLORS.textSecondary,
            opacity: 1 - checkT,
          }}
        >
          {number}
        </span>
        <div style={{ position: "absolute", opacity: checkT, transform: `scale(${0.5 + 0.5 * checkT})` }}>
          <svg width={22} height={22} viewBox="0 0 24 24">
            <path
              d="M 5 13 L 10 18 L 20 7"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Label */}
      <span
        style={{
          fontFamily: FONTS.body,
          fontSize: 14,
          fontWeight: showCheck ? 700 : 500,
          color: showCheck ? COLORS.text : COLORS.textSecondary,
          textAlign: "center",
          maxWidth: 110,
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
    </div>
  );
};

// ── Connector ───────────────────────────────────────────────────────────────

const Connector: React.FC<{
  startFrame: number;
  endFrame: number;
  accent: string;
  accentGlow: string;
}> = ({ startFrame, endFrame, accent, accentGlow }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("glide"),
  });
  return (
    <div
      style={{
        flex: 1,
        height: 3,
        marginTop: 28,
        borderRadius: 2,
        background: "rgba(255,255,255,0.10)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: accent,
          transform: `scaleX(${t})`,
          transformOrigin: "left center",
          boxShadow: `0 0 6px ${accentGlow}`,
          willChange: "transform",
        }}
      />
    </div>
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
