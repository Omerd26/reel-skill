/**
 * FunnelStages — visual metaphor for "the customer journey", "the conversion
 * funnel", "where you lose people".
 *
 * A vertical funnel of N stages inside a glass card. Each stage row has:
 *   [label on one side] [horizontal bar — narrows by value] [count on other side]
 * The bar's WIDTH narrows from top to bottom (the funnel effect), but the
 * label + count text live OUTSIDE the bar so they always stay readable
 * even when the lowest stage is 5% of the top value.
 *
 * Use cases:
 *   - "the funnel" → Visitors → Trial → Paid → Renew
 *   - "where you lose them" → 1000 → 400 → 80 → 20
 *   - "המסע של הלקוח" → 4 שלבים בעברית
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

export interface FunnelStage {
  label: string;
  value: number;
}

export interface FunnelStagesScene {
  type: "funnel_stages";
  id: string;
  start: number;
  end: number;
  /** Stages top → bottom. 3-5 work best. */
  stages: FunnelStage[];
  /** Optional eyebrow. e.g. "CONVERSION FUNNEL", "מסע ההמרה". */
  eyebrow?: string;
  /** Show drop-ratio labels between stages? Default true. */
  show_drops?: boolean;
  /** Tone. Default "brand". */
  tone?: Tone;
  anchor?: OverlayAnchor;
  rtl?: boolean;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: FunnelStagesScene;
}

const ROW_W = 520;
const LABEL_W = 110;
const COUNT_W = 90;
const BAR_TRACK_W = ROW_W - LABEL_W - COUNT_W - 32;

export const FunnelStages: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const stages = scene.stages.slice(0, 5);
  const rtl = scene.rtl ?? stages.some((s) => isHebrew(s.label));
  const showDrops = scene.show_drops ?? true;

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });

  const topValue = Math.max(...stages.map((s) => s.value), 1);
  const STAGE_GAP_SEC = 0.32;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material="liquid"
            padding="26px 28px"
            rtl={false}
            style={{ width: ROW_W + 56 }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 14, marginBottom: 18, textAlign: "center" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 0 }}>
              {stages.map((stage, i) => {
                const startSec = 0.55 + i * STAGE_GAP_SEC;
                const startFrame = Math.round(startSec * fps);
                const t = interpolate(
                  frame,
                  [startFrame, startFrame + Math.round(0.40 * fps)],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: easeFn("bounce-soft"),
                  },
                );
                // Bar width as fraction of track (minimum 12% so it's visible).
                const widthFrac = Math.max(0.12, stage.value / topValue);
                const barWidth = BAR_TRACK_W * widthFrac * t;
                const counterValue = Math.round(stage.value * t);
                const isLabelHe = isHebrew(stage.label);

                return (
                  <React.Fragment key={`stg-${i}`}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        height: 48,
                        flexDirection: rtl ? "row-reverse" : "row",
                      }}
                    >
                      <div
                        style={{
                          width: LABEL_W,
                          fontFamily: FONTS.body,
                          fontSize: 14,
                          fontWeight: 700,
                          color: COLORS.text,
                          letterSpacing: "-0.005em",
                          textAlign: rtl ? "right" : "left",
                          direction: isLabelHe ? "rtl" : "ltr",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          opacity: t,
                        }}
                      >
                        {stage.label}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: rtl ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: barWidth,
                            height: "100%",
                            background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.30)})`,
                            borderRadius: 6,
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 0 ${10 * t}px ${accentGlow}`,
                            willChange: "width",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          width: COUNT_W,
                          fontFamily: FONTS.display,
                          fontSize: 22,
                          fontWeight: 900,
                          color: accent,
                          letterSpacing: "-0.01em",
                          textShadow: `0 0 8px ${accentGlow}`,
                          textAlign: rtl ? "left" : "right",
                          opacity: t,
                        }}
                      >
                        {counterValue.toLocaleString()}
                      </div>
                    </div>

                    {showDrops && i < stages.length - 1 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          marginLeft: rtl ? 0 : LABEL_W + 16,
                          marginRight: rtl ? LABEL_W + 16 : 0,
                          marginTop: 2,
                          marginBottom: 2,
                        }}
                      >
                        <DropLabel
                          from={stages[i].value}
                          to={stages[i + 1].value}
                          startFrame={Math.round(((startSec + STAGE_GAP_SEC) - 0.10) * fps)}
                          accent={accent}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
            <HaloGlow
              tone={tone}
              size={600}
              intensity={0.4}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const DropLabel: React.FC<{
  from: number;
  to: number;
  startFrame: number;
  accent: string;
}> = ({ from, to, startFrame, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(
    frame,
    [startFrame, startFrame + Math.round(0.25 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const ratio = from > 0 ? to / from : 0;
  const pctText = `${Math.round(ratio * 100)}%`;
  return (
    <div
      style={{
        padding: "3px 10px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.30)",
        border: "1px solid rgba(255,255,255,0.10)",
        fontFamily: FONTS.mono,
        fontSize: 10,
        fontWeight: 700,
        color: COLORS.textSecondary,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        opacity: t,
        transform: `translateY(${(1 - t) * 4}px)`,
        willChange: "opacity, transform",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ color: accent, fontWeight: 800 }}>↓</span>
      {pctText}
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
