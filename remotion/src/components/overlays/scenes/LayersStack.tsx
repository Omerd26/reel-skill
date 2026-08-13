/**
 * LayersStack — visual metaphor for "depth", "layers", "what's underneath",
 * "the full stack".
 *
 * Stepped stack of 2–4 glass cards, each offset diagonally so the labels
 * READ CLEANLY without overlap. Cascade entrance reveals cards bottom-up.
 * One card at a time is "active" (accent border + glow) and cycles every
 * ~1.2s. No 3D rotation — keeps labels legible and avoids the collision
 * mess that the previous 3D-perspective version produced.
 *
 * Use cases:
 *   - "שלוש שכבות מתחת לפני השטח" → 3 cards labeled by layer
 *   - "the full stack: front, back, infra" → 3 stepped cards
 *   - "what's behind the curtain" → reveal stacked layers
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
  Eyebrow,
  HaloGlow,
  resolveAnchor,
  type OverlayAnchor,
} from "../primitives";
import {
  COLORS,
  FONTS,
  RADIUS,
  easeFn,
  glassStyle,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface LayersStackScene {
  type: "layers_stack";
  id: string;
  start: number;
  end: number;
  /** Layer labels — 2-4 work best. First label is the TOP of the stack. */
  layers: string[];
  /** Optional sublabels per layer. Same length as `layers`. */
  sublabels?: string[];
  /** Optional outer eyebrow. e.g. "WHAT'S UNDERNEATH". */
  eyebrow?: string;
  /** Tone — colors the active layer + glow. Default "brand". */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: LayersStackScene;
}

const CARD_W = 380;
const CARD_H = 92;
const STEP_X = 22;
const STEP_Y = 36;

export const LayersStack: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const layers = scene.layers.slice(0, 4);
  const sublabels = scene.sublabels?.slice(0, 4) ?? [];
  const n = layers.length;

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });

  // Stage size — bottom card sits at origin; top card lifts +STEP_Y*(n-1).
  const stageH = CARD_H + STEP_Y * (n - 1);
  const stageW = CARD_W + STEP_X * (n - 1);

  // Active-card cycle. Each card highlighted for ~1.2s in turn, then loops.
  const cycleSec = 1.2;
  const activeIdx = Math.floor(((frame / fps) - 0.60) / cycleSec) % n;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          {scene.eyebrow && (
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 14, letterSpacing: "0.18em" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            </div>
          )}

          <div
            style={{
              position: "relative",
              width: stageW,
              height: stageH,
            }}
          >
            {layers.map((label, i) => {
              // i=0 is the FRONT card (top of stack). Larger i = further back.
              const cascadeStartSec = 0.20 + (n - 1 - i) * 0.10;
              const inT = interpolate(
                frame,
                [Math.round(cascadeStartSec * fps), Math.round((cascadeStartSec + 0.35) * fps)],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide") },
              );
              const depth = i; // 0 = front, n-1 = back
              const xOff = depth * STEP_X;
              const yOff = depth * STEP_Y;
              const isActive = depth === activeIdx;
              const isHe = isHebrew(label);

              return (
                <div
                  key={`layer-${i}`}
                  style={{
                    position: "absolute",
                    top: yOff,
                    left: xOff,
                    width: CARD_W,
                    height: CARD_H,
                    opacity: inT * (isActive ? 1 : 0.78),
                    transform: `translateY(${(1 - inT) * 8}px) scale(${0.96 + 0.04 * inT})`,
                    transition: "opacity 220ms ease",
                    zIndex: n - depth,
                    willChange: "opacity, transform",
                  }}
                >
                  <div
                    style={{
                      ...glassStyle("liquid"),
                      borderRadius: RADIUS.lg,
                      padding: "14px 20px",
                      height: "100%",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      border: isActive
                        ? `1.5px solid ${accent}`
                        : "1px solid rgba(255,255,255,0.16)",
                      boxShadow: isActive
                        ? `0 14px 28px rgba(0,0,0,0.45), 0 0 24px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.22)`
                        : "0 8px 20px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.22)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 11,
                        fontWeight: 700,
                        color: isActive ? accent : COLORS.textTertiary,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        marginBottom: 2,
                        textAlign: isHe ? "right" : "left",
                        direction: isHe ? "rtl" : "ltr",
                      }}
                    >
                      Layer {i + 1}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.display,
                        fontSize: 22,
                        fontWeight: 800,
                        color: COLORS.text,
                        letterSpacing: "-0.005em",
                        textAlign: isHe ? "right" : "left",
                        direction: isHe ? "rtl" : "ltr",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {label}
                    </div>
                    {sublabels[i] && (
                      <div
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 12,
                          fontWeight: 500,
                          color: COLORS.textSecondary,
                          marginTop: 2,
                          textAlign: isHe ? "right" : "left",
                          direction: isHe ? "rtl" : "ltr",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {sublabels[i]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
            <HaloGlow
              tone={tone}
              size={520}
              intensity={0.35}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}
