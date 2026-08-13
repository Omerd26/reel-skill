/**
 * ChartReveal — visual metaphor for "growth", "data", "performance".
 *
 * Two variants inside a glass card:
 *   - bar  — vertical bars grow from baseline, sequenced left-to-right.
 *            Optional X-axis labels.
 *   - line — line chart strokes in left-to-right with a "head dot"
 *            traveling along, optional fill area beneath.
 *
 * Use cases:
 *   - "גידול של 300%" → bar chart bars grow tall
 *   - "המספרים מדברים" → bar chart with numeric labels
 *   - "ביצועים שנתיים" → line chart climbs
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
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface ChartRevealScene {
  type: "chart_reveal";
  id: string;
  start: number;
  end: number;
  variant?: "bar" | "line";
  /** Data values 0..max. 4-7 points work best. */
  values: number[];
  /** Optional max value for scale. Default = max(values). */
  max_value?: number;
  /** Optional X-axis labels (one per value). */
  x_labels?: string[];
  /** Optional Y-axis label or unit. */
  unit?: string;
  /** Eyebrow above. */
  eyebrow?: string;
  /** Tone — colors bars / line. Default "brand". */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: ChartRevealScene;
}

export const ChartReveal: React.FC<Props> = ({ scene }) => {
  const variant = scene.variant ?? "bar";
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

  const values = scene.values.slice(0, 8);
  const maxV = scene.max_value ?? Math.max(...values, 1);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="22px 26px" rtl={false} style={{ minWidth: 360 }}>
            {scene.eyebrow && (
              <Eyebrow tone={tone} script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"} style={{ fontSize: 18, marginBottom: 14 }}>
                {scene.eyebrow}
              </Eyebrow>
            )}

            {variant === "bar" ? (
              <BarChart values={values} maxV={maxV} accent={accent} accentGlow={accentGlow} xLabels={scene.x_labels} unit={scene.unit} />
            ) : (
              <LineChart values={values} maxV={maxV} accent={accent} accentGlow={accentGlow} xLabels={scene.x_labels} />
            )}
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }}>
            <HaloGlow tone={tone} size={500} intensity={0.4} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Bar chart ────────────────────────────────────────────────────────────────

const BarChart: React.FC<{
  values: number[];
  maxV: number;
  accent: string;
  accentGlow: string;
  xLabels?: string[];
  unit?: string;
}> = ({ values, maxV, accent, accentGlow, xLabels, unit }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barWidth = 36;
  const barGap = 12;
  const chartHeight = 160;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: barGap,
          height: chartHeight,
          padding: "8px 4px",
        }}
      >
        {values.map((v, i) => {
          const startFrame = Math.round((0.55 + i * 0.10) * fps);
          const t = interpolate(
            frame,
            [startFrame, startFrame + Math.round(0.40 * fps)],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
          );
          const height = (v / maxV) * chartHeight * t;
          return (
            <div
              key={`bar-${i}`}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              <div
                style={{
                  ...TYPE.meta,
                  fontSize: 14,
                  color: accent,
                  fontWeight: 700,
                  opacity: t,
                  height: 16,
                }}
              >
                {Math.round(v * t)}
                {unit ?? ""}
              </div>
              <div
                style={{
                  width: barWidth,
                  height,
                  borderRadius: "6px 6px 0 0",
                  background: `linear-gradient(180deg, ${accent}, ${darken(accent, 0.30)})`,
                  boxShadow: `0 0 12px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.20)`,
                  willChange: "height",
                }}
              />
            </div>
          );
        })}
      </div>
      {xLabels && (
        <div
          style={{
            display: "flex",
            gap: barGap,
            padding: "8px 4px 0",
            marginTop: 4,
            borderTop: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {xLabels.slice(0, values.length).map((l, i) => (
            <div
              key={`xl-${i}`}
              style={{
                width: barWidth,
                ...TYPE.meta,
                fontSize: 12,
                color: COLORS.textTertiary,
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Line chart ───────────────────────────────────────────────────────────────

const LineChart: React.FC<{
  values: number[];
  maxV: number;
  accent: string;
  accentGlow: string;
  xLabels?: string[];
}> = ({ values, maxV, accent, accentGlow, xLabels }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const W = 320;
  const H = 160;
  const padX = 14;
  const padY = 14;
  const stepX = (W - padX * 2) / Math.max(1, values.length - 1);

  // Build polyline path
  const points = values.map((v, i) => {
    const x = padX + i * stepX;
    const y = H - padY - (v / maxV) * (H - padY * 2);
    return { x, y };
  });
  const fullPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  // Stroke draw progress (0..1) over 0.55→1.45s
  const drawStart = Math.round(0.55 * fps);
  const drawDur = Math.round(0.90 * fps);
  const drawT = interpolate(frame, [drawStart, drawStart + drawDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("glide"),
  });

  // Approximate path length for stroke-dashoffset
  const totalLen = points.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const dx = p.x - points[i - 1].x;
    const dy = p.y - points[i - 1].y;
    return acc + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  // Head dot position
  const headIdx = Math.min(points.length - 1, drawT * (points.length - 1));
  const headFloor = Math.floor(headIdx);
  const headFrac = headIdx - headFloor;
  const headPoint = points[headFloor]
    ? {
        x: points[headFloor].x + (points[headFloor + 1] ? (points[headFloor + 1].x - points[headFloor].x) * headFrac : 0),
        y: points[headFloor].y + (points[headFloor + 1] ? (points[headFloor + 1].y - points[headFloor].y) * headFrac : 0),
      }
    : { x: padX, y: H - padY };

  return (
    <div>
      <svg width={W} height={H}>
        {/* Subtle grid */}
        <line x1={padX} y1={H - padY} x2={W - padX} y2={H - padY} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
        {/* Fill area */}
        <path
          d={`${fullPath} L ${points[points.length - 1].x.toFixed(1)} ${(H - padY).toFixed(1)} L ${points[0].x.toFixed(1)} ${(H - padY).toFixed(1)} Z`}
          fill={accent}
          fillOpacity={drawT * 0.18}
        />
        {/* Stroke */}
        <path
          d={fullPath}
          fill="none"
          stroke={accent}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLen}
          strokeDashoffset={totalLen * (1 - drawT)}
          style={{ filter: `drop-shadow(0 0 6px ${accentGlow})` }}
        />
        {/* Head dot */}
        {drawT > 0 && drawT < 1 && (
          <circle cx={headPoint.x} cy={headPoint.y} r={6} fill="#FFFFFF" stroke={accent} strokeWidth={2} style={{ filter: `drop-shadow(0 0 8px ${accentGlow})` }} />
        )}
      </svg>
      {xLabels && (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 14px", marginTop: 4 }}>
          {xLabels.slice(0, values.length).map((l, i) => (
            <span key={`lc-${i}`} style={{ ...TYPE.meta, fontSize: 12, color: COLORS.textTertiary }}>
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
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
