/**
 * TabSwitcher — visual metaphor for "choice", "this OR that", "branching".
 *
 * iOS-style segmented control: 2-3 tabs in a frosted pill row, with an
 * accent-tinted "selector" pill that slides between them. The selected
 * tab's text turns bold + accent color. Optional "winning" tab pulses
 * after the slide settles.
 *
 * Use cases:
 *   - "אופציה א או ב" → 2 tabs, selector slides A→B
 *   - "תבחר את הסגנון שלך" → 3 tabs, selector lands on middle
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
  RADIUS,
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface TabSwitcherScene {
  type: "tab_switcher";
  id: string;
  start: number;
  end: number;
  /** Tab labels — 2 or 3 tabs work best. */
  tabs: string[];
  /** Initial tab index (0-based). Default 0. */
  start_index?: number;
  /** Final tab index (0-based) — where the selector lands. */
  end_index: number;
  /** Tone — colors selector pill + winning tab. Default "brand". */
  tone?: Tone;
  /** Optional eyebrow above. */
  eyebrow?: string;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: TabSwitcherScene;
}

export const TabSwitcher: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const tabs = scene.tabs.slice(0, 3);
  const N = tabs.length;
  const startIdx = Math.max(0, Math.min(N - 1, scene.start_index ?? 0));
  const endIdx = Math.max(0, Math.min(N - 1, scene.end_index));

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Tab geometry
  const tabWidth = 100;
  const tabHeight = 56;
  const padding = 4;
  const totalWidth = tabWidth * N + padding * 2;

  // Selector slides from startIdx → endIdx between 0.55s and 1.10s
  const slideStart = Math.round(0.55 * fps);
  const slideDuration = Math.round(0.55 * fps);
  const slideT = interpolate(
    frame,
    [slideStart, slideStart + slideDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide") },
  );
  const currentIdx = startIdx + (endIdx - startIdx) * slideT;
  const selectorX = padding + currentIdx * tabWidth;

  // Pulse on the winning tab once selector lands
  const settleStart = slideStart + slideDuration;
  const pulseT = interpolate(
    frame,
    [settleStart, settleStart + Math.round(0.30 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="22px 26px" rtl={false} style={{ minWidth: totalWidth + 60 }}>
            {scene.eyebrow && (
              <Eyebrow tone={tone} script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"} style={{ fontSize: 18, marginBottom: 14, textAlign: "center" }}>
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Segmented control */}
            <div
              style={{
                position: "relative",
                width: totalWidth,
                height: tabHeight + padding * 2,
                margin: "0 auto",
                borderRadius: RADIUS.pill,
                background: "rgba(0,0,0,0.30)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              {/* Animated selector */}
              <div
                style={{
                  position: "absolute",
                  top: padding,
                  left: selectorX,
                  width: tabWidth,
                  height: tabHeight,
                  borderRadius: RADIUS.pill,
                  background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.20)})`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 12px rgba(0,0,0,0.30), 0 0 ${20 * pulseT}px ${accentGlow}`,
                  transform: `scale(${1 + 0.04 * pulseT * Math.sin(frame * 0.3)})`,
                  willChange: "left, transform",
                }}
              />

              {/* Tab labels */}
              <div style={{ position: "relative", display: "flex", height: tabHeight }}>
                {tabs.map((label, i) => {
                  const isActive = Math.abs(currentIdx - i) < 0.5;
                  return (
                    <div
                      key={`tab-${i}`}
                      style={{
                        width: tabWidth,
                        height: tabHeight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        ...TYPE.eyebrow,
                        fontSize: 18,
                        fontWeight: isActive ? 800 : 600,
                        color: isActive ? "#FFFFFF" : COLORS.textSecondary,
                        letterSpacing: "0.04em",
                        textTransform: "none",
                        transition: "color 0.15s",
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35 + pulseT * 0.25, pointerEvents: "none" }}>
            <HaloGlow tone={tone} size={500} intensity={0.4} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
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
