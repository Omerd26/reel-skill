/**
 * RetentionCurve — creator-analytics native: an audience-retention line
 * traces itself across a dark chart; a red DANGER dip zone flashes where
 * viewers leave, then the "hold" annotation lands on the strong section.
 * For "ככה נראה גרף שמירת צופים", "פה כולם עוזבים".
 *
 * NEW TYPE 2026-08-09. Use only story-true shapes — the curve dramatizes a
 * concept, it never claims specific analytics.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useEntrance } from "../motion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface RetentionCurveScene {
  type: "retention_curve";
  id: string;
  start: number;
  end: number;
  /** Headline — e.g. "גרף שמירת הצופים". */
  headline?: string;
  /** Annotation on the danger dip — e.g. "פה עוזבים". */
  dip_label?: string;
  /** Annotation on the holding tail — e.g. "פה מנצחים". */
  hold_label?: string;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: RetentionCurveScene;
}

// Retention shape: cliff at the start, danger dip, then a strong hold.
const CURVE = "M 0 22 C 40 26 60 58 105 66 C 150 74 165 96 210 92 C 260 88 300 84 360 86 C 420 88 470 90 520 92";
const CURVE_LEN = 560;

export const RetentionCurve: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const entrance = useEntrance({ signature: "glass-rise", durationSec: 0.4 });

  // Line traces 0.3-1.5s.
  const traceT = interpolate(frame, [Math.round(0.3 * fps), Math.round(1.5 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide"),
  });
  // Danger zone flashes as the trace passes it (~40% in).
  const dipReached = traceT > 0.38;
  const dipPulse = dipReached ? 0.5 + 0.5 * Math.sin((frame / (0.6 * fps)) * Math.PI * 2) : 0;
  // Hold annotation lands once the trace completes.
  const holdT = interpolate(frame, [Math.round(1.55 * fps), Math.round(1.85 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm"),
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            ...entrance,
            width: 600,
            borderRadius: 24,
            padding: "24px 28px 20px",
            direction: "rtl",
            background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.55)",
          }}
        >
          {scene.headline && (
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 800,
                fontSize: 30,
                color: "#FFFFFF",
                marginBottom: 14,
              }}
            >
              {scene.headline}
            </div>
          )}
          <div style={{ position: "relative", direction: "ltr" }}>
            <svg width="544" height="130" viewBox="0 0 544 130">
              {/* gridlines */}
              {[0, 1, 2, 3].map((g) => (
                <line key={g} x1="0" x2="544" y1={14 + g * 34} y2={14 + g * 34} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              ))}
              {/* danger zone (the dip band) */}
              <rect
                x="118"
                y="8"
                width="110"
                height="114"
                fill={`rgba(196,61,61,${0.10 + 0.12 * dipPulse})`}
                stroke={`rgba(196,61,61,${0.3 + 0.4 * dipPulse})`}
                strokeWidth="1.5"
                strokeDasharray="6 5"
                rx="8"
              />
              {/* area under the curve */}
              <path
                d={`${CURVE} L 520 130 L 0 130 Z`}
                fill={`url(#retgrad)`}
                opacity={0.35 * traceT}
              />
              {/* the curve traces itself */}
              <path
                d={CURVE}
                fill="none"
                stroke={accent}
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeDasharray={CURVE_LEN}
                strokeDashoffset={CURVE_LEN * (1 - traceT)}
                style={{ filter: `drop-shadow(0 0 8px ${accentGlow})` }}
              />
              {/* live tracer dot */}
              {traceT < 1 && (
                <circle
                  cx={traceT * 520}
                  cy={traceT < 0.2 ? 22 + traceT * 220 : traceT < 0.4 ? 66 + (traceT - 0.2) * 130 : 92 - Math.sin((traceT - 0.4) * 5) * 4}
                  r="8"
                  fill="#FFFFFF"
                  style={{ filter: `drop-shadow(0 0 10px ${accentGlow})` }}
                />
              )}
              <defs>
                <linearGradient id="retgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={accent} stopOpacity="0.5" />
                  <stop offset="1" stopColor={accent} stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            {/* dip annotation */}
            {scene.dip_label && dipReached && (
              <div
                style={{
                  position: "absolute",
                  left: 128,
                  top: -14,
                  padding: "5px 14px",
                  borderRadius: 12,
                  background: "#C43D3D",
                  fontFamily: "'Heebo', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  color: "#FFF",
                  direction: "rtl",
                  boxShadow: "0 8px 18px rgba(0,0,0,0.5)",
                  transform: `scale(${Math.min(1, (traceT - 0.38) * 6)})`,
                }}
              >
                {scene.dip_label}
              </div>
            )}
            {/* hold annotation */}
            {scene.hold_label && holdT > 0 && (
              <div
                style={{
                  position: "absolute",
                  right: 10,
                  top: 34,
                  padding: "5px 14px",
                  borderRadius: 12,
                  background: accent,
                  fontFamily: "'Heebo', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  color: "#FFF",
                  direction: "rtl",
                  transform: `scale(${holdT}) rotate(${(1 - holdT) * 8}deg)`,
                  boxShadow: `0 8px 18px rgba(0,0,0,0.5), 0 0 14px ${accentGlow}`,
                }}
              >
                {scene.hold_label}
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
