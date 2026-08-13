/**
 * KeyValueTable — visual metaphor for "schema", "config", "API spec",
 * "structured data", "this is what it sees".
 *
 * Direct reference: @softgirlnocode reel (2026-04-25), frames at 20–24s.
 * Anatomy: a glass card with a title + N rows where each row has a small
 * uppercase KEY label on the left and a pill-style VALUE on the right.
 * Rows reveal in sequence as if data is loading.
 *
 * Use cases:
 *   - "ה-API מקבל את זה" → schema rows (TOOL, INPUT_SCHEMA, ACTIONS, RESPONSE)
 *   - "המערכת רואה כך" → key/value config snapshot
 *   - "תוכניות נטענות" → loading payload
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
  CornerBadge,
  Eyebrow,
  GlassCard,
  resolveAnchor,
  type OverlayAnchor,
} from "../primitives";
import {
  COLORS,
  FONTS,
  RADIUS,
  TYPE,
  WARM,
  easeFn,
  toneColor,
  type GlassMaterial,
  type Tone,
} from "../../../design/tokens";

export interface KeyValueRow {
  /** Left side — usually 1-2 words, all caps. */
  key: string;
  /** Right side — short value (1-6 words). */
  value: string;
  /** Optional "type" tag — overrides default styling. */
  kind?: "string" | "code" | "number" | "list";
}

export interface KeyValueTableScene {
  type: "key_value_table";
  id: string;
  start: number;
  end: number;
  /** Card title. e.g. "Tool context". */
  title: string;
  /** Eyebrow above title. e.g. "COMPUTED PAYLOAD", "STILL PRESENT". */
  eyebrow?: string;
  /** Rows of the table. 2-6 work best. */
  rows: KeyValueRow[];
  /** Optional corner badge. e.g. "Injected into context". */
  corner_badge?: string;
  corner_badge_tone?: Tone;
  /** Tone — colors values + corner badge. */
  tone?: Tone;
  /** Material. Default "warm". */
  material?: GlassMaterial;
  /** Stagger between row reveals (ms). Default 120. */
  row_stagger_ms?: number;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: KeyValueTableScene;
}

export const KeyValueTable: React.FC<Props> = ({ scene }) => {
  const material = scene.material ?? "warm";
  const isWarm = material === "warm";
  const tone: Tone = scene.tone ?? "brand";
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const rows = scene.rows.slice(0, 6);
  const staggerMs = scene.row_stagger_ms ?? 120;

  const cardEntrance = useEntrance({
    signature: "stack-cascade",
    ease: "glass-rise",
    durationSec: 0.50,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material={material}
            padding="22px 24px"
            rtl={false}
            style={{
              width: 560,
              position: "relative",
              background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.55)",
            }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone="neutral"
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{
                  fontSize: 18,
                  marginBottom: 4,
                  color: isWarm ? WARM.textTertiary : COLORS.textTertiary,
                  letterSpacing: "0.16em",
                }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            <div
              style={{
                ...TYPE.sectionTitle,
                fontSize: 32,
                fontWeight: 800,
                color: isWarm ? WARM.text : COLORS.text,
                marginBottom: 14,
                lineHeight: 1.1,
              }}
            >
              {scene.title}
            </div>

            {/* Table rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rows.map((r, i) => (
                <Row
                  key={`kv-${i}`}
                  row={r}
                  index={i}
                  tone={tone}
                  isWarm={isWarm}
                  staggerMs={staggerMs}
                />
              ))}
            </div>

            {scene.corner_badge && (
              <CornerBadge
                label={scene.corner_badge}
                corner="top-right"
                tone={scene.corner_badge_tone ?? tone}
                theme={isWarm ? "warm" : "dark"}
              />
            )}
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Row ─────────────────────────────────────────────────────────────────────

const Row: React.FC<{
  row: KeyValueRow;
  index: number;
  tone: Tone;
  isWarm: boolean;
  staggerMs: number;
}> = ({ row, index, tone, isWarm, staggerMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = toneColor(tone);

  // Sequenced reveal
  const startFrame = Math.round((0.55 + (staggerMs / 1000) * index) * fps);
  const t = interpolate(
    frame,
    [startFrame, startFrame + Math.round(0.30 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
  );

  const valueFontFamily = row.kind === "code" ? FONTS.mono : FONTS.body;
  const valueColor = isWarm ? WARM.text : COLORS.text;
  const keyColor = isWarm ? WARM.textTertiary : COLORS.textTertiary;
  const valueBg = isWarm ? WARM.pillBg : "rgba(255,255,255,0.06)";
  const valueBorder = isWarm
    ? `1px solid ${WARM.pillBorder}`
    : `1px solid ${COLORS.borderHairline}`;
  const dividerBorder = isWarm
    ? `1px solid ${WARM.divider}`
    : `1px solid ${COLORS.borderHairline}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 4px",
        borderTop: index === 0 ? "none" : dividerBorder,
        opacity: t,
        transform: `translateY(${(1 - t) * -6}px)`,
        willChange: "opacity, transform",
      }}
    >
      {/* Key (small uppercase) */}
      <div
        style={{
          flex: "0 0 130px",
          fontFamily: FONTS.mono,
          fontSize: 16,
          fontWeight: 700,
          color: keyColor,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          textAlign: "left",
        }}
      >
        {row.key}
      </div>

      {/* Value (pill) */}
      <div
        style={{
          flex: 1,
          padding: "7px 12px",
          borderRadius: RADIUS.sm,
          background: valueBg,
          border: valueBorder,
          fontFamily: valueFontFamily,
          fontSize: 20,
          fontWeight: row.kind === "code" ? 500 : 600,
          color: row.kind === "code" ? accent : valueColor,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {row.value}
      </div>
    </div>
  );
};

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}
