/**
 * LiveStatus — visual metaphor for "live", "real-time", "happening now".
 *
 * Tiny pill with a pulsing red/accent dot + "LIVE" label + optional viewer
 * count that ticks up. The dot pulses on a continuous sine cycle (looks
 * like a real broadcast indicator).
 *
 * Use cases:
 *   - "שידור חי" → red dot + LIVE
 *   - "happening now" → green dot + ON AIR
 *   - "real-time analytics" → pulse + counter
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

export interface LiveStatusScene {
  type: "live_status";
  id: string;
  start: number;
  end: number;
  /** Status label. Default "LIVE". */
  label?: string;
  /** Tone. Default "danger" (red — broadcast convention). */
  tone?: Tone;
  /** Optional viewer count. Animates from `viewers_from` to `viewers_to`. */
  viewers_to?: number;
  viewers_from?: number;
  /** Viewer label, e.g. "צופים" / "VIEWERS". */
  viewer_label?: string;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: LiveStatusScene;
}

export const LiveStatus: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "danger";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const label = scene.label ?? "LIVE";

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.40,
    fromEdge: "left",
  });

  // Pulsing dot — sine cycle 1Hz
  const pulsePeriodFrames = Math.max(1, fps);
  const pulsePhase = (frame % pulsePeriodFrames) / pulsePeriodFrames;
  const pulseIntensity = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2));
  const pulseScale = 1 + 0.15 * (0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2));

  // Viewer counter — ramps over duration
  const showViewers = scene.viewers_to !== undefined;
  const viewersFrom = scene.viewers_from ?? 0;
  const counterT = interpolate(
    frame,
    [Math.round(0.50 * fps), Math.round(2.00 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
  );
  const currentViewers = showViewers
    ? Math.round(viewersFrom + ((scene.viewers_to ?? 0) - viewersFrom) * counterT)
    : 0;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          {/* Compact pill — never use big GlassCard padding for this one */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 18px",
              borderRadius: RADIUS.pill,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))",
              backdropFilter: "blur(14px) saturate(1.12)",
              WebkitBackdropFilter: "blur(14px) saturate(1.12)",
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.30), 0 8px 22px rgba(0,0,0,0.35)`,
            }}
          >
            {/* Pulsing dot */}
            <div
              style={{
                position: "relative",
                width: 12,
                height: 12,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: accent,
                  boxShadow: `0 0 ${10 * pulseIntensity}px ${accentGlow}`,
                  transform: `scale(${pulseScale})`,
                  willChange: "transform",
                }}
              />
              {/* Outer ripple */}
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: "50%",
                  border: `2px solid ${accent}`,
                  opacity: 1 - pulsePhase,
                  transform: `scale(${1 + pulsePhase * 1.5})`,
                  willChange: "transform, opacity",
                }}
              />
            </div>

            {/* Label */}
            <span
              style={{
                ...TYPE.eyebrow,
                fontSize: 22,
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "0.14em",
                textShadow: `0 0 12px ${accentGlow}`,
              }}
            >
              {label.toUpperCase()}
            </span>

            {/* Viewer count */}
            {showViewers && (
              <>
                <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.25)" }} />
                <span
                  style={{
                    ...TYPE.meta,
                    fontSize: 18,
                    fontWeight: 700,
                    color: COLORS.text,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCount(currentViewers)}
                  {scene.viewer_label && (
                    <span
                      style={{
                        ...TYPE.meta,
                        fontSize: 12,
                        marginLeft: 6,
                        color: COLORS.textSecondary,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {scene.viewer_label}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35 * pulseIntensity, pointerEvents: "none" }}>
            <HaloGlow tone={tone} size={300} intensity={0.35} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

// silence unused-import warns
export const _UNUSED: unknown = { GlassCard };
