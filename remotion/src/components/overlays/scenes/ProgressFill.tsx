/**
 * ProgressFill — visual metaphor for "easier", "faster", "growth", "completion".
 *
 * A small premium glass card showing a horizontal progress bar that fills
 * from `from_pct` to `to_pct` (default 0→100) over the scene duration. A
 * counter on the side ticks up in lockstep. When complete, a checkmark
 * pops in (success metaphor) and a glow ramps under the bar.
 *
 * Variants:
 *   - bar    — horizontal bar (default)
 *   - ring   — circular ring (percentage / completion)
 *   - speed  — speedometer arc (faster, urgency)
 *
 * Use cases:
 *   - "...שעולה לך 5 דקות במקום שעה"  → bar 0→100% with time label
 *   - "מחיש את התהליך"                → speed arc full sweep
 *   - "השלמה אוטומטית"                → ring 0→100% + checkmark
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

export interface ProgressFillScene {
  type: "progress_fill";
  id: string;
  start: number;
  end: number;
  variant?: "bar" | "ring" | "speed";
  from_pct?: number;       // default 0
  to_pct: number;          // 0..100
  /** Optional eyebrow label (e.g. "השלמה", "מהירות"). */
  eyebrow?: string;
  /** Optional unit label (e.g. "%", "x", "min"). Default "%". */
  unit?: string;
  /** Tone — bar fill + glow color. Default "brand". */
  tone?: Tone;
  anchor?: OverlayAnchor;
  /** Show the checkmark when complete? Default true. */
  show_check?: boolean;
  /** PAYOFF mode (JATHO §2): the fill spans ~85% of the WHOLE scene
   * duration — keeps visibly filling into the next sentence — instead of
   * the fixed 0.9s ramp. Default undefined = current behavior. */
  run_past?: boolean;
  /** TEASE state (JATHO §1.2, playbook "show the SHAPE, censor the
   * CONTENT"): fill frozen at its full value so the silhouette is
   * complete, inner content blurred/unreadable, check suppressed,
   * breathing mystery glow. Default undefined = current behavior. */
  blurred?: boolean;
  /** SHOUT word above the censored card naming WHAT is hidden
   * (default "הסוד:"). Rendered only when blurred. */
  tease_label?: string;
  transcript_phrase?: string;
  rationale?: string;
  /** Planner sync metadata (JATHO §2) — carried through, ignored here. */
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: ProgressFillScene;
}

export const ProgressFill: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = scene.variant ?? "bar";
  const tone: Tone = scene.tone ?? "brand";
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const fromPct = scene.from_pct ?? 0;
  const toPct = scene.to_pct;
  const unit = scene.unit ?? "%";
  const showCheck = scene.show_check ?? true;

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Fill timing.
  // Default: 0.55s → 1.45s (0.9s duration).
  // run_past: spans ~85% of the whole scene with a near-linear ease that
  // stays visibly moving late — a payoff that keeps filling.
  const sceneFrames = Math.max(1, Math.round((scene.end - scene.start) * fps));
  const runPast = scene.run_past === true;
  const isBlurred = scene.blurred === true;
  const fillStart = Math.round(0.55 * fps);
  const fillDuration = runPast
    ? Math.max(1, Math.round(0.85 * sceneFrames))
    : Math.round(0.90 * fps);
  const fillT = interpolate(
    frame,
    [fillStart, fillStart + fillDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: runPast ? RUN_PAST_EASE : easeFn("glide"),
    },
  );
  // Tease: the silhouette is COMPLETE from frame 0 (the shape is the
  // promise); the blur below censors the readout.
  const t = isBlurred ? 1 : fillT;
  const currentPct = fromPct + (toPct - fromPct) * t;
  // Breathing mystery glow, deterministic (3.4s period like MetricLockup).
  const teaseGlow = isBlurred
    ? 0.16 + 0.16 * (0.5 + 0.5 * Math.sin((frame / (3.4 * fps)) * Math.PI * 2))
    : 0;

  // Check pop after fill completes
  const checkStart = fillStart + fillDuration + Math.round(0.10 * fps);
  const checkT = interpolate(
    frame,
    [checkStart, checkStart + Math.round(0.30 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          {/* TEASE LABEL (owner 2026-08-09: "לא ממש ברור מה רואים... אולי
              איזה כיתוב מעל שיבינו מה אנחנו מסתירים"): a SHOUT word above
              the censored card that names WHAT is hidden. */}
          {isBlurred && (
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
          <GlassCard
            material="liquid"
            padding="22px 26px"
            rtl={false}
            style={{
              minWidth: variant === "ring" ? 220 : 320,
              // TEASE: solid dark panel instead of glass (owner: "הזכוכית
              // אולי פחות מתאים") — the blurred orange shape needs a dark
              // ground to read as "something censored", not a smudge.
              ...(isBlurred
                ? {
                    background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.6)",
                  }
                : {}),
            }}
          >
            {/* TEASE: card chrome stays crisp; inner content blurred so
                the SHAPE reads but the value doesn't (JATHO §1.2). */}
            <div style={isBlurred ? { filter: "blur(9px)", opacity: 0.55 } : undefined}>
              {scene.eyebrow && (
                <Eyebrow
                  tone={tone}
                  script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                  style={{ fontSize: 18, marginBottom: 14 }}
                >
                  {scene.eyebrow}
                </Eyebrow>
              )}

              {variant === "bar" && (
                <BarVariant pct={currentPct} unit={unit} tone={tone} checkT={showCheck && !isBlurred ? checkT : 0} />
              )}
              {variant === "ring" && (
                <RingVariant pct={currentPct} unit={unit} tone={tone} checkT={showCheck && !isBlurred ? checkT : 0} />
              )}
              {variant === "speed" && (
                <SpeedVariant pct={currentPct} tone={tone} />
              )}
            </div>
          </GlassCard>

          {/* Halo glow ramps with progress; tease breathes instead */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: isBlurred ? teaseGlow : t * 0.5,
              pointerEvents: "none",
            }}
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

// Near-linear ease for run_past fills: 65% linear + 35% power2.out — the
// bar/ring/needle is still visibly moving deep into the scene.
const RUN_PAST_EASE = (t: number): number =>
  0.65 * t + 0.35 * (1 - (1 - t) * (1 - t));

// ── Variants ─────────────────────────────────────────────────────────────────

const BarVariant: React.FC<{ pct: number; unit: string; tone: Tone; checkT: number }> = ({
  pct, unit, tone, checkT,
}) => {
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Counter line */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span
          style={{
            ...TYPE.numberLockup,
            fontSize: 84,
            color: accent,
            textShadow: `0 0 18px ${accentGlow}`,
          }}
        >
          {Math.round(pct)}
        </span>
        <span
          style={{
            ...TYPE.meta,
            fontSize: 32,
            color: COLORS.textSecondary,
          }}
        >
          {unit}
        </span>
        {checkT > 0 && (
          <CheckmarkPop t={checkT} accent={accent} accentGlow={accentGlow} />
        )}
      </div>

      {/* Track + fill */}
      <div
        style={{
          position: "relative",
          height: 14,
          borderRadius: 7,
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.10)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${accent}, ${lighten(accent, 0.2)})`,
            boxShadow: `0 0 12px ${accentGlow}`,
          }}
        />
      </div>
    </div>
  );
};

const RingVariant: React.FC<{ pct: number; unit: string; tone: Tone; checkT: number }> = ({
  pct, unit, tone, checkT,
}) => {
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const size = 180;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        margin: "0 auto",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 ${10 + 14 * (pct / 100)}px ${accentGlow})` }}
        />
      </svg>

      {/* Center number */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        <span
          style={{
            ...TYPE.numberLockup,
            fontSize: 60,
            color: accent,
            textShadow: `0 0 14px ${accentGlow}`,
            lineHeight: 1,
          }}
        >
          {Math.round(pct)}
        </span>
        <span
          style={{
            ...TYPE.meta,
            fontSize: 18,
            color: COLORS.textSecondary,
            marginTop: 2,
          }}
        >
          {unit}
        </span>
        {checkT > 0 && (
          <div style={{ position: "absolute", top: -10, right: -10 }}>
            <CheckmarkPop t={checkT} accent={accent} accentGlow={accentGlow} />
          </div>
        )}
      </div>
    </div>
  );
};

const SpeedVariant: React.FC<{ pct: number; tone: Tone }> = ({ pct, tone }) => {
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const size = 220;
  // Arc from -135deg to +135deg, total 270deg sweep
  const ARC_TOTAL = 270;
  const ARC_START = -225; // SVG path start angle
  const sweepAngle = (pct / 100) * ARC_TOTAL;

  // Build SVG arc paths
  const cx = size / 2;
  const cy = size / 2 + 20;
  const radius = 80;
  const trackPath = describeArc(cx, cy, radius, ARC_START, ARC_START + ARC_TOTAL);
  const fillPath = describeArc(cx, cy, radius, ARC_START, ARC_START + sweepAngle);

  // Needle angle (degrees from horizontal)
  const needleAngle = ARC_START + sweepAngle + 90;

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size}>
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={fillPath}
          fill="none"
          stroke={accent}
          strokeWidth={14}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 16px ${accentGlow})` }}
        />
        {/* Needle */}
        <g
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - radius - 6}
            stroke="#FFFFFF"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={8} fill="#FFFFFF" />
        </g>
      </svg>
      {/* Big number */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <span
          style={{
            ...TYPE.numberLockup,
            fontSize: 48,
            color: accent,
            textShadow: `0 0 14px ${accentGlow}`,
          }}
        >
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
};

// ── Sub-components ───────────────────────────────────────────────────────────

const CheckmarkPop: React.FC<{ t: number; accent: string; accentGlow: string }> = ({
  t, accent, accentGlow,
}) => {
  const scale = 0.4 + 0.6 * t;
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: t,
        transform: `scale(${scale})`,
        boxShadow: `0 0 16px ${accentGlow}`,
      }}
    >
      <svg viewBox="0 0 24 24" width={22} height={22}>
        <path
          d="M5 13 L10 18 L20 7"
          fill="none"
          stroke="#0A0A0C"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

function lighten(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) + 255 * amount));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) + 255 * amount));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) + 255 * amount));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// SVG arc path helper — angles in degrees, 0=right, 90=down (SVG convention)
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  const sweep = endAngle > startAngle ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweep} ${end.x} ${end.y}`;
}
