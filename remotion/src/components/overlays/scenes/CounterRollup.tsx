/**
 * CounterRollup — odometer-style rolling digits (Jatho payoff grammar §2:
 * counters run PAST the sentence — 540K→640K keeps climbing while he talks).
 * Each digit column physically rolls like a slot machine; the count spans
 * ~85% of the scene so it's still moving late.
 *
 * NEW TYPE 2026-08-09. De-boxed: free-floating chrome digits + glow.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface CounterRollupScene {
  type: "counter_rollup";
  id: string;
  start: number;
  end: number;
  /** Target value (integer). Only ever use a SPOKEN number. */
  value: number;
  /** Starting value. Default 0. */
  from_value?: number;
  /** Label under the counter — e.g. "צפיות". */
  label?: string;
  /** Long payoff roll (spans ~85% of the scene). Default: land fast and hold. */
  run_past?: boolean;
  /** Prefix/suffix — e.g. "₪", "%". */
  prefix?: string;
  suffix?: string;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: CounterRollupScene;
}

const DIGIT_H = 96;

/** One rolling digit column — a vertical strip of 0-9 that translates. */
const DigitReel: React.FC<{ digit: number; progress: number; accent: string }> = ({ digit, progress, accent }) => {
  // The reel spins several full turns early, then settles on the target.
  const spins = 1;
  const pos = progress < 1 ? (spins * 10 + digit) * progress : digit;
  // At rest the strip must sit EXACTLY on one digit — any fraction leaves two
  // half-rows visible and the number reads as garbage.
  const offset = progress >= 1 ? digit * DIGIT_H : (pos % 10) * DIGIT_H;
  const blur = progress < 0.75 ? (1 - progress) * 5 : 0;
  return (
    <div
      style={{
        width: 62,
        height: DIGIT_H,
        overflow: "hidden",
        position: "relative",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -(offset % (10 * DIGIT_H)),
          left: 0,
          right: 0,
          filter: blur > 0.4 ? `blur(${blur}px)` : undefined,
        }}
      >
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              height: DIGIT_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 84,
              lineHeight: 1,
              color: "#FFFFFF",
              fontVariantNumeric: "tabular-nums",
              textShadow: `0 3px 12px rgba(0,0,0,0.9), 0 0 26px ${accent}44`,
            }}
          >
            {i % 10}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CounterRollup: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");

  const sceneFrames = Math.max(1, Math.round((scene.end - scene.start) * fps)) || durationInFrames;
  // The number must LAND and then be READ. Measured: rolling to 85% of the
  // scene left the value unreadable two-thirds of the way in — the viewer
  // only ever saw the blur. Land by ~55% (and never later than 2.0s), then
  // hold clean. `run_past` opts back into the long payoff roll.
  const rollEnd = scene.run_past
    ? Math.round(0.85 * sceneFrames)
    : Math.min(Math.round(0.55 * sceneFrames), Math.round(2.0 * fps));
  const t = interpolate(frame, [Math.round(0.15 * fps), Math.max(rollEnd, Math.round(0.5 * fps))], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide"),
  });
  const from = scene.from_value ?? 0;
  const current = Math.round(from + (scene.value - from) * t);
  const digits = Math.abs(current).toLocaleString("en-US");
  const breathe = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin((frame / (2.4 * fps)) * Math.PI * 2));

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              direction: "ltr",
              gap: 2,
              filter: `drop-shadow(0 0 ${18 * breathe}px ${accentGlow})`,
            }}
          >
            {scene.prefix && (
              <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 66, color: accent, marginRight: 6, textShadow: "0 3px 10px rgba(0,0,0,0.9)" }}>
                {scene.prefix}
              </span>
            )}
            {digits.split("").map((ch, i) =>
              /\d/.test(ch) ? (
                <DigitReel key={i} digit={parseInt(ch, 10)} progress={t} accent={accent} />
              ) : (
                <span
                  key={i}
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 900,
                    fontSize: 84,
                    color: "#FFFFFF",
                    textShadow: "0 3px 12px rgba(0,0,0,0.9)",
                    margin: "0 2px",
                  }}
                >
                  {ch}
                </span>
              ),
            )}
            {scene.suffix && (
              <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 66, color: accent, marginLeft: 6, textShadow: "0 3px 10px rgba(0,0,0,0.9)" }}>
                {scene.suffix}
              </span>
            )}
          </div>
          {scene.label && (
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 800,
                fontSize: 32,
                color: "rgba(255,255,255,0.9)",
                direction: "rtl",
                textShadow: "0 2px 10px rgba(0,0,0,0.9)",
              }}
            >
              {scene.label}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
