/**
 * BRollMotion.tsx — Shared motion utilities for premium B-roll scenes.
 *
 * Provides reusable animation primitives that break out of the monotonous
 * "spring + translate" pattern. Every scene can compose these for richer motion.
 *
 * Design principles:
 *   - All animation driven by useCurrentFrame() (Remotion requirement)
 *   - No CSS transitions or Tailwind animations
 *   - Spring configs named by feel, not by number
 *   - Secondary motion (overshoot, settle, breathe) built in
 *   - Exit choreography as first-class citizen
 */

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// ── Spring Presets ────────────────────────────────────────────────────────────
// Named by feel, not by physics. Each has a distinct personality.

export const SPRING_PRESETS = {
  /** Smooth reveal — no bounce, elegant entrance */
  smooth: { damping: 200 },
  /** Snappy UI element — fast, minimal overshoot */
  snappy: { damping: 20, stiffness: 200 },
  /** Bouncy entrance — playful, attention-grabbing */
  bouncy: { damping: 8 },
  /** Heavy impact — slow, weighty, dramatic */
  heavy: { damping: 15, stiffness: 80, mass: 2 },
  /** Elastic slam — overshoots then settles, for "slam" moments */
  slam: { damping: 6, stiffness: 400, mass: 0.8 },
  /** Gentle float — slow drift, organic feel */
  float: { damping: 30, stiffness: 40, mass: 1.5 },
  /** Pop — quick scale-up with subtle bounce */
  pop: { damping: 12, stiffness: 300 },
} as const;

export type SpringPreset = keyof typeof SPRING_PRESETS;

// ── Easing Functions ──────────────────────────────────────────────────────────
// For interpolate() — more expressive than linear

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// ── Animation Hooks ───────────────────────────────────────────────────────────

/**
 * Full lifecycle animation: enter → hold → exit.
 * Returns 0..1..1..0 over the scene's duration.
 */
export function useSceneLifecycle(
  durationFrames: number,
  enterFrames = 12,
  exitFrames = 10,
) {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [0, enterFrames, durationFrames - exitFrames, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
}

/**
 * Staggered entrance — returns progress (0..1) for item at given index.
 * Uses spring for natural feel.
 */
export function useStaggeredEntry(
  index: number,
  staggerFrames = 10,
  delayBase = 6,
  preset: SpringPreset = "snappy",
) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = delayBase + index * staggerFrames;
  return spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: SPRING_PRESETS[preset],
  });
}

/**
 * Breathing/floating motion — subtle continuous movement.
 * Use for elements that should feel alive during hold phase.
 */
export function useBreathing(
  amplitude = 4,
  speed = 0.08,
  phase = 0,
) {
  const frame = useCurrentFrame();
  return Math.sin(frame * speed + phase) * amplitude;
}

/**
 * Pulse glow — intensity oscillates for emphasis.
 * Returns a value between minIntensity and maxIntensity.
 */
export function usePulseGlow(
  speed = 0.12,
  minIntensity = 0.4,
  maxIntensity = 1.0,
) {
  const frame = useCurrentFrame();
  const t = (Math.sin(frame * speed) + 1) / 2;
  return minIntensity + t * (maxIntensity - minIntensity);
}

/**
 * Delayed spring — clean helper for entrance with delay.
 */
export function useDelayedSpring(
  delayFrames: number,
  preset: SpringPreset = "smooth",
) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: SPRING_PRESETS[preset],
  });
}

// ── Visual Primitives ─────────────────────────────────────────────────────────

/** Convert hex to rgb string for rgba() usage */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : "224,112,30";
}

/** Noise function for organic variation */
export function noise(x: number, y: number = 0): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

// ── Background Presets ────────────────────────────────────────────────────────
// Break the monotony of the single dark gradient

export type BgPreset =
  | "dark"           // original dark gradient
  | "deep"           // deeper, more cinematic black
  | "warm"           // warm dark with subtle amber
  | "cool"           // cool dark with subtle blue
  | "spotlight"      // dark with central spotlight glow
  | "gradient-brand"; // dark with brand color gradient edge

export function getBgStyle(
  preset: BgPreset,
  brandColor: string,
  opacity: number,
): React.CSSProperties {
  const rgb = hexToRgb(brandColor);

  switch (preset) {
    case "deep":
      return {
        background: "linear-gradient(180deg, #020208 0%, #0A0A14 50%, #000000 100%)",
        opacity,
      };
    case "warm":
      return {
        background: "linear-gradient(160deg, rgba(18,12,8,0.95) 0%, rgba(4,2,0,0.98) 100%)",
        opacity,
      };
    case "cool":
      return {
        background: "linear-gradient(160deg, rgba(6,8,18,0.95) 0%, rgba(0,2,8,0.98) 100%)",
        opacity,
      };
    case "spotlight":
      return {
        background: `radial-gradient(ellipse 60% 50% at 50% 45%, rgba(${rgb},0.08) 0%, rgba(0,0,0,0.96) 70%)`,
        opacity,
      };
    case "gradient-brand":
      return {
        background: `linear-gradient(135deg, rgba(0,0,0,0.96) 0%, rgba(${rgb},0.12) 50%, rgba(0,0,0,0.96) 100%)`,
        opacity,
      };
    case "dark":
    default:
      return {
        background: "linear-gradient(160deg, rgba(8,8,18,0.88) 0%, rgba(0,0,0,0.94) 100%)",
        opacity,
      };
  }
}


/**
 * parseSceneNumber — robust numeric parsing for scene text props
 * (2026-08-09, owner screenshot: "10,000" rendered as "10" because
 * parseFloat stops at the comma; "10K" lost its K). Commas stripped,
 * K/M multipliers honored. Use this for EVERY numeric scene prop.
 */
export const parseSceneNumber = (v: string | undefined | null, fallback = 0): number => {
  const m = /([\d][\d,\.]*)\s*([KMkm])?/.exec(v || "");
  if (!m) return fallback;
  const n = parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return fallback;
  return n * (m[2] ? (m[2].toUpperCase() === "K" ? 1000 : 1000000) : 1);
};
