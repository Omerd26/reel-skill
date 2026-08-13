/**
 * ViewfinderSnap — the "mental screenshot" move Jatho uses in TWO reels
 * (Dau4 t025, DSh8 t040): camera corner brackets snap around a target
 * phrase, a focus ring tightens, then a white shutter FLASH freezes it —
 * "remember this exact thing".
 *
 * NEW TYPE 2026-08-09.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface ViewfinderSnapScene {
  type: "viewfinder_snap";
  id: string;
  start: number;
  end: number;
  /** The phrase being "captured". */
  target_text: string;
  /** Small label above — e.g. "צילום מסך מנטלי". */
  eyebrow?: string;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: ViewfinderSnapScene;
}

const isHebrew = (s: string) => /[֐-׿]/.test(s);

export const ViewfinderSnap: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");

  // Phase 1: brackets fly in from outside (0-0.4s), overshooting slightly.
  const bracketT = interpolate(frame, [0, Math.round(0.4 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm"),
  });
  // Phase 2: focus ring tightens (0.4-0.8s).
  const focusT = interpolate(frame, [Math.round(0.4 * fps), Math.round(0.8 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide"),
  });
  // Phase 3: SHUTTER FLASH at 0.9s (2 frames white) + freeze jolt.
  const flashFrame = Math.round(0.9 * fps);
  const flash = frame >= flashFrame && frame < flashFrame + 3 ? 1 - (frame - flashFrame) / 3 : 0;
  const captured = frame >= flashFrame;
  // Post-capture: subtle polaroid settle.
  const settleT = interpolate(frame, [flashFrame, flashFrame + Math.round(0.3 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft"),
  });

  const spread = 34 * (1 - bracketT) + 10 * (1 - focusT);
  const W = 560;
  const H = 190;
  const hebrew = isHebrew(scene.target_text);

  const Bracket: React.FC<{ x: "l" | "r"; y: "t" | "b" }> = ({ x, y }) => (
    <div
      style={{
        position: "absolute",
        [y === "t" ? "top" : "bottom"]: -spread,
        [x === "l" ? "left" : "right"]: -spread,
        width: 52,
        height: 52,
        borderTop: y === "t" ? `6px solid ${accent}` : "none",
        borderBottom: y === "b" ? `6px solid ${accent}` : "none",
        borderLeft: x === "l" ? `6px solid ${accent}` : "none",
        borderRight: x === "r" ? `6px solid ${accent}` : "none",
        borderRadius: 6,
        opacity: bracketT,
        filter: `drop-shadow(0 0 ${10 + 14 * focusT}px ${accentGlow})`,
      } as React.CSSProperties}
    />
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            position: "relative",
            width: W,
            transform: captured ? `scale(${1 - 0.05 * (1 - settleT)}) rotate(${-1.2 * settleT}deg)` : undefined,
          }}
        >
          {scene.eyebrow && (
            <div
              style={{
                textAlign: "center",
                marginBottom: 14,
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 26,
                color: accent,
                direction: "rtl",
                textShadow: `0 0 18px ${accentGlow}, 0 2px 8px rgba(0,0,0,0.85)`,
                opacity: bracketT,
              }}
            >
              {scene.eyebrow}
            </div>
          )}
          <div
            style={{
              position: "relative",
              width: W,
              minHeight: H,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 34px",
              borderRadius: 18,
              background: captured
                ? "linear-gradient(180deg, #22232B 0%, #17181E 100%)"
                : "rgba(12,13,17,0.55)",
              border: `1px solid ${captured ? accent : "rgba(255,255,255,0.2)"}`,
              boxShadow: captured
                ? `0 22px 50px rgba(0,0,0,0.55), 0 0 26px ${accentGlow}`
                : "0 14px 34px rgba(0,0,0,0.4)",
            }}
          >
            <Bracket x="l" y="t" />
            <Bracket x="r" y="t" />
            <Bracket x="l" y="b" />
            <Bracket x="r" y="b" />
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 800,
                fontSize: 42,
                lineHeight: 1.25,
                textAlign: "center",
                color: "#FFFFFF",
                direction: hebrew ? "rtl" : "ltr",
                textShadow: "0 2px 8px rgba(0,0,0,0.9)",
              }}
            >
              {scene.target_text}
            </div>
            {/* shutter flash */}
            <div
              style={{
                position: "absolute",
                inset: -6,
                borderRadius: 18,
                background: "#FFFFFF",
                opacity: flash * 0.9,
              }}
            />
          </div>
          {/* "captured" chip */}
          {captured && (
            <div
              style={{
                position: "absolute",
                bottom: -22,
                left: "50%",
                transform: `translateX(-50%) scale(${settleT})`,
                padding: "6px 18px",
                borderRadius: 999,
                background: accent,
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 800,
                fontSize: 20,
                color: "#FFF",
                direction: "rtl",
                boxShadow: `0 8px 20px rgba(0,0,0,0.5), 0 0 16px ${accentGlow}`,
              }}
            >
              נשמר
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
