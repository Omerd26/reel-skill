/**
 * StampSlam — punchline emphasis.
 *
 * The "STOP", "DEAD", "WRONG" moment. Heavy uppercase text, slight rotation
 * (-3deg by default), double-stroke border for stamp feel. Lands HARD with
 * `bounce-firm` (back.out 2.4) — the Hyperframes "click release" feel.
 *
 * Per may-shorts-18 lesson: stamp must land AFTER its target text is fully
 * visible. The planner is responsible for offsetting `start` ≥ target+0.1s.
 *
 * Scale: hero size — fills 60-80% of frame width. This is a register-shift
 * moment, not a supporting graphic.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { useEntrance, useAmbient } from "../motion";
import { ChromeText, HaloGlow, resolveAnchor } from "../primitives";
import { TYPE, COLORS, toneColor, type Tone } from "../../../design/tokens";
import type { StampSlamScene } from "../types";

interface Props {
  scene: StampSlamScene;
}

export const StampSlam: React.FC<Props> = ({ scene }) => {
  const tone: Tone = scene.tone ?? "danger";
  const rotation = scene.rotation ?? -3;
  const doubleStroke = scene.doubleStroke ?? true;
  // Stamps are punctuation moments — center is allowed ONLY for full-screen
  // takeover. Default top-center so the stamp lands above the speaker.
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const stampEntrance = useEntrance({
    signature: "depth-pop",
    ease: "bounce-firm",
    durationSec: 0.32,
    offsetFrames: 0,
  });
  // Halo arrives just before the stamp lands, gives the "warm-up" feel
  const haloEntrance = useEntrance({
    signature: "blur-reveal",
    durationSec: 0.50,
    offsetFrames: 0,
  });
  // Subtle ambient breath after stamp settles
  const ambient = useAmbient({
    startAfterSec: 0.5,
    kind: "scale-breath",
    amplitude: 0.015,
    periodSec: 3.0,
  });

  const accent = toneColor(tone);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        {/* Halo */}
        <div style={{ ...haloEntrance, position: "absolute", inset: 0 }}>
          <HaloGlow
            tone={tone}
            size={1100}
            intensity={0.7}
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        {/* Stamp */}
        <div
          style={{
            ...stampEntrance,
            transform: mergeTransforms(
              stampEntrance.transform,
              `rotate(${rotation}deg)`,
              ambient.transform,
            ),
          }}
        >
          <div
            style={{
              padding: "32px 56px",
              border: doubleStroke
                ? `6px double ${accent}`
                : `5px solid ${accent}`,
              borderRadius: 14,
              background: "rgba(0,0,0,0.20)",
              boxShadow: `0 0 60px ${require_alpha(accent, 0.45)}, inset 0 0 30px ${require_alpha(accent, 0.18)}`,
            }}
          >
            <ChromeText
              role="heroKinetic"
              tone={tone}
              style={{
                ...TYPE.heroKinetic,
                fontSize: 130,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: COLORS.text,
              }}
            >
              {scene.text}
            </ChromeText>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function mergeTransforms(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function require_alpha(color: string, alpha: number): string {
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}
