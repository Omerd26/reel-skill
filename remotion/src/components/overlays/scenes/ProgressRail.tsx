/**
 * ProgressRail — the Jatho 3-icon step rail (DM5X t015/t026/t037): a compact
 * horizontal rail of steps where the ACTIVE step enlarges + glows in brand
 * color while the others sit dim. Reappears at each step boundary as the
 * video walks a process — the recallable "where are we" device.
 *
 * NEW TYPE 2026-08-09 (owner: "עוד 15-20 סוגים חדשים").
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useEntrance } from "../motion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface ProgressRailStep {
  /** Step label — short. e.g. "צילום", "עריכה". */
  label: string;
}

export interface ProgressRailScene {
  type: "progress_rail";
  id: string;
  start: number;
  end: number;
  /** 2-5 steps. */
  steps: ProgressRailStep[];
  /** Which step is ACTIVE (0-based). Recallable: re-render later with a
   * higher index. */
  active_index?: number;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: ProgressRailScene;
}

const isHebrew = (s: string) => /[֐-׿]/.test(s);

export const ProgressRail: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const steps = scene.steps.slice(0, 5);
  const active = Math.min(scene.active_index ?? 0, steps.length - 1);

  const entrance = useEntrance({ signature: "glass-rise", durationSec: 0.4 });

  // The active chip PULSES to life a beat after entrance; a spark travels
  // the rail from step 0 to the active step first (rich-animation ask).
  const sparkT = interpolate(
    frame,
    [Math.round(0.25 * fps), Math.round(0.75 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide") },
  );
  const activateT = interpolate(
    frame,
    [Math.round(0.75 * fps), Math.round(1.05 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
  );
  const breathe = 0.75 + 0.25 * (0.5 + 0.5 * Math.sin((frame / (2.6 * fps)) * Math.PI * 2));

  const CHIP = 108;
  const GAP = 52;
  const railWidth = steps.length * CHIP + (steps.length - 1) * GAP;
  const sparkX = sparkT * (active * (CHIP + GAP) + CHIP / 2);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ ...entrance, position: "relative", width: railWidth, direction: "rtl" }}>
          {/* rail line */}
          <div
            style={{
              position: "absolute",
              top: CHIP / 2 - 3,
              right: CHIP / 2,
              left: CHIP / 2,
              height: 6,
              borderRadius: 3,
              background: "rgba(20,21,27,0.85)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          />
          {/* traveling spark (rtl: travels leftwards) */}
          <div
            style={{
              position: "absolute",
              top: CHIP / 2 - 7,
              right: CHIP / 2 + sparkX - 7,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: accent,
              opacity: sparkT < 1 ? 0.9 : 0,
              boxShadow: `0 0 18px ${accentGlow}`,
            }}
          />
          <div style={{ display: "flex", gap: GAP }}>
            {steps.map((st, i) => {
              const isActive = i === active;
              const done = i < active;
              const scale = isActive ? 1 + 0.22 * activateT * breathe : 1;
              const hebrew = isHebrew(st.label);
              return (
                <div key={i} style={{ width: CHIP, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: CHIP,
                      height: CHIP,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive
                        ? `radial-gradient(circle at 35% 30%, ${accent}, #8a4310)`
                        : done
                        ? "linear-gradient(180deg, #2A2B33 0%, #1C1D24 100%)"
                        : "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
                      border: `2px solid ${isActive ? accent : done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)"}`,
                      boxShadow: isActive
                        ? `0 0 ${30 * activateT * breathe}px ${accentGlow}, inset 0 2px 0 rgba(255,255,255,0.3)`
                        : "inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 24px rgba(0,0,0,0.45)",
                      transform: `scale(${scale})`,
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: 900,
                      fontSize: 40,
                      color: isActive ? "#FFF" : done ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.45)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: isActive ? 800 : 600,
                      fontSize: isActive ? 26 : 22,
                      color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                      direction: hebrew ? "rtl" : "ltr",
                      textShadow: "0 2px 8px rgba(0,0,0,0.85)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {st.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
