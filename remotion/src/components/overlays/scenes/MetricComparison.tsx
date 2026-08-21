/**
 * MetricComparison — two ring-metric cards side by side.
 *
 * Direct reference: @softgirlnocode reel (2026-04-25), frame at 6s.
 * Anatomy: two glass cards anchored top-center, each containing
 *   { title } / { eyebrow } / { ring chart with center % } / { caption }.
 * Both rings fill simultaneously to the same animation curve so the
 * comparison reads instantly.
 *
 * Use cases:
 *   - "Tool A vs Tool B context window" → 77% vs 44%
 *   - "Before vs After" → 22% vs 81%
 *   - "Plan A vs Plan B retention" → 64% vs 89%
 *
 * Theme: defaults to warm (cream) per the reel — but works on dark too.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance, useAmbient } from "../motion";
import { CornerBadge, resolveAnchor, type OverlayAnchor } from "../primitives";
import {
  COLORS,
  FONTS,
  RADIUS,
  TYPE,
  WARM,
  easeFn,
  glassStyle,
  toneColor,
  toneGlow,
  type GlassMaterial,
  type Tone,
} from "../../../design/tokens";

export interface MetricComparisonSide {
  /** Subject name (small, top of card). e.g. "Claude Cowork". */
  title: string;
  /** Metric name (small uppercase under title). e.g. "Context window". */
  eyebrow?: string;
  /** Final percentage (0-100). */
  pct: number;
  /** Caption under the ring. e.g. "fills faster". */
  caption?: string;
  /** Tone — colors the ring + center value. Default "brand". */
  tone?: Tone;
}

export interface MetricComparisonScene {
  type: "metric_comparison";
  id: string;
  start: number;
  end: number;
  left: MetricComparisonSide;
  right: MetricComparisonSide;
  /** Optional shared eyebrow / title above both cards. */
  eyebrow?: string;
  title?: string;
  /** Optional corner badge on the parent. e.g. "MCP TAX", "Live data". */
  corner_badge?: string;
  corner_badge_tone?: Tone;
  /** Glass material. Default "warm" for the editorial reference look. */
  material?: GlassMaterial;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: MetricComparisonScene;
}

export const MetricComparison: React.FC<Props> = ({ scene }) => {
  const material = scene.material ?? "warm";
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const isWarm = material === "warm";

  const cardEntrance = useEntrance({
    signature: "stack-cascade",
    ease: "glass-rise",
    durationSec: 0.50,
  });
  const ambient = useAmbient({
    startAfterSec: 1.0,
    kind: "y-bob",
    amplitude: 3,
    periodSec: 4.5,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            ...cardEntrance,
            transform: mergeT(cardEntrance.transform, ambient.transform),
            position: "relative",
          }}
        >
          {/* Optional shared title section above the two cards */}
          {(scene.title || scene.eyebrow) && (
            <div
              style={{
                textAlign: "center",
                marginBottom: 14,
                color: isWarm ? WARM.text : COLORS.text,
              }}
            >
              {scene.eyebrow && (
                <div
                  style={{
                    // Was 14px tertiary-grey — measured invisible over a
                    // bright ceiling. Headers carry their own contrast.
                    fontFamily: "'Heebo', sans-serif",
                    fontSize: 30,
                    fontWeight: 900,
                    letterSpacing: "0",
                    color: "#FFFFFF",
                    direction: "rtl",
                    textShadow: "0 2px 10px rgba(0,0,0,0.92), 0 0 26px rgba(0,0,0,0.7)",
                    marginBottom: 12,
                  }}
                >
                  {scene.eyebrow}
                </div>
              )}
              {scene.title && (
                <div style={{ ...TYPE.sectionTitle, fontSize: 38, fontWeight: 800 }}>
                  {scene.title}
                </div>
              )}
            </div>
          )}

          {/* Two-card row */}
          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "stretch",
              position: "relative",
            }}
          >
            {/* RTL: `left` is the first subject the speaker names, so it
                renders on the RIGHT. Reversed order read backwards in Hebrew. */}
            <RingCard side={scene.right} material={material} />
            <RingCard side={scene.left} material={material} />

            {scene.corner_badge && (
              <CornerBadge
                label={scene.corner_badge}
                corner="top-left"
                tone={scene.corner_badge_tone ?? "brand"}
                theme={isWarm ? "warm" : "dark"}
                style={{ top: -22, left: -8 }}
              />
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── RingCard ────────────────────────────────────────────────────────────────

const RingCard: React.FC<{
  side: MetricComparisonSide;
  material: GlassMaterial;
}> = ({ side, material }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = side.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const isWarm = material === "warm";

  // Ring fills 0 → side.pct between 0.55s and 1.50s
  const t = interpolate(
    frame,
    [Math.round(0.55 * fps), Math.round(1.50 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide") },
  );
  const currentPct = side.pct * t;

  const size = 176;  // was 140 — owner 2026-08-09: bigger by default
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const C = 2 * Math.PI * radius;
  const offset = C * (1 - currentPct / 100);

  const titleColor = isWarm ? WARM.text : COLORS.text;
  const subColor = isWarm ? WARM.textSecondary : COLORS.textSecondary;
  const eyebrowColor = isWarm ? WARM.textTertiary : COLORS.textTertiary;

  return (
    <div
      style={{
        ...glassStyle(material),
        width: 264,
        padding: "20px 18px",
        borderRadius: RADIUS.lg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        position: "relative",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: 22,
          fontWeight: 700,
          color: titleColor,
          letterSpacing: "-0.005em",
        }}
      >
        {side.title}
      </div>
      {side.eyebrow && (
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 15,
            fontWeight: 500,
            color: eyebrowColor,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {side.eyebrow}
        </div>
      )}

      {/* Ring */}
      <div style={{ position: "relative", width: size, height: size, margin: "8px 0" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isWarm ? "rgba(120,100,75,0.14)" : "rgba(255,255,255,0.10)"}
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
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 ${6 + 8 * t}px ${accentGlow})` }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...TYPE.numberLockup,
            fontSize: 46,
            fontWeight: 800,
            color: titleColor,
            letterSpacing: "-0.02em",
          }}
        >
          {Math.round(currentPct)}%
        </div>
      </div>

      {side.caption && (
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: subColor,
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          {side.caption}
        </div>
      )}
    </div>
  );
};

function mergeT(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}
