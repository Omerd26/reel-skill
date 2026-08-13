/**
 * Motion system — Hyperframes-aligned.
 *
 * Three concepts:
 *   1. `useEntrance(...)` — enters an element using a named ease + signature.
 *      No exit animation. Per Hyperframes rule: scene transitions handle exits.
 *   2. `useAmbient(...)` — soft breathing / drift loop for "breathe" phase.
 *   3. `useStaggerOffset(...)` — frame offset for cascading children.
 *
 * Key change vs. the old system: we no longer return a generic lifecycle that
 * handles entrance + exit on every scene. Exits are owned by the transition
 * layer (`transitions.tsx`). Scenes only animate IN.
 *
 * See `design/DESIGN.md` § "Motion Rules" for the full vocabulary.
 */
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties } from "react";
import { easeFn, type EaseName } from "../../design/tokens";

// ── Entrance signatures ──────────────────────────────────────────────────────
//
// Each signature is a recipe for HOW an element arrives — combinations of
// translate, scale, blur, opacity. Mapped to design intent, not just shape.
//
//   glass-rise    — soft upward translate + scale-up + blur dropoff. Default
//                   for liquid-glass cards. Apple-keynote feel.
//   side-slide    — horizontal slide in from the nearest edge with depth blur.
//                   Use for floating side panels, lower-thirds.
//   depth-pop     — scale-in from 0.82 with blur dropoff. Use for hero
//                   elements, stamps, slams — feels weighty.
//   stack-cascade — small upward translate, gentle blur. Use for list items,
//                   cards in a grid, tag clusters.
//   blur-reveal   — pure blur-out from blur(20px) → blur(0). Calmest entrance.
//                   Use for premium pull-quotes, type-only moments.
//   letter-spread — letter-spacing collapses from 0.4em → final value. Pure
//                   typographic entrance, no positional motion. Quiet and
//                   editorial.
//   fade          — pure opacity. Use sparingly, only when motion would compete.

export type EntranceSignature =
  | "glass-rise"
  | "side-slide"
  | "depth-pop"
  | "stack-cascade"
  | "blur-reveal"
  | "letter-spread"
  | "fade";

interface UseEntranceArgs {
  /** Signature — drives HOW the element arrives. Default: "glass-rise". */
  signature?: EntranceSignature;
  /** Named ease — drives HOW it feels. Default depends on signature. */
  ease?: EaseName;
  /** Duration in seconds. Default depends on signature. */
  durationSec?: number;
  /** Start offset in frames (e.g. for staggered children). */
  offsetFrames?: number;
  /** For `side-slide`, which edge to enter from. Default: "right". */
  fromEdge?: "left" | "right" | "top" | "bottom";
}

/**
 * Drives a single element's entrance. Returns CSS to spread onto the wrapper.
 * Does NOT handle exits — that's the transition layer's job.
 */
export function useEntrance({
  signature = "glass-rise",
  ease,
  durationSec,
  offsetFrames = 0,
  fromEdge = "right",
}: UseEntranceArgs = {}): CSSProperties {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dur = durationSec ?? defaultDurationFor(signature);
  const easeName = ease ?? defaultEaseFor(signature);
  const f = frame - offsetFrames;
  const totalFrames = Math.max(1, Math.round(dur * fps));

  const t = interpolate(f, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn(easeName),
  });

  return composeEntrance(signature, t, fromEdge);
}

function defaultDurationFor(sig: EntranceSignature): number {
  switch (sig) {
    case "glass-rise":    return 0.55;
    case "side-slide":    return 0.50;
    case "depth-pop":     return 0.45;
    case "stack-cascade": return 0.40;
    case "blur-reveal":   return 0.65;
    case "letter-spread": return 0.70;
    case "fade":          return 0.40;
  }
}

function defaultEaseFor(sig: EntranceSignature): EaseName {
  switch (sig) {
    case "glass-rise":    return "glass-rise";
    case "side-slide":    return "confident";
    case "depth-pop":     return "bounce-soft";
    case "stack-cascade": return "confident";
    case "blur-reveal":   return "glass-rise";
    case "letter-spread": return "glide";
    case "fade":          return "glass-rise";
  }
}

function composeEntrance(
  sig: EntranceSignature,
  t: number,
  fromEdge: "left" | "right" | "top" | "bottom",
): CSSProperties {
  let translateX = 0;
  let translateY = 0;
  let scale = 1;
  let blurPx = 0;
  let letterSpacing: string | undefined;
  const opacity = t;

  switch (sig) {
    case "glass-rise":
      translateY = lerp(40, 0, t);
      scale = lerp(0.94, 1, t);
      blurPx = lerp(12, 0, t);
      break;

    case "side-slide": {
      const dist = lerp(120, 0, t);
      if (fromEdge === "right")  translateX = dist;
      if (fromEdge === "left")   translateX = -dist;
      if (fromEdge === "bottom") translateY = dist;
      if (fromEdge === "top")    translateY = -dist;
      blurPx = lerp(10, 0, t);
      break;
    }

    case "depth-pop":
      scale = lerp(0.82, 1, t);
      blurPx = lerp(16, 0, t);
      break;

    case "stack-cascade":
      translateY = lerp(28, 0, t);
      blurPx = lerp(8, 0, t);
      break;

    case "blur-reveal":
      blurPx = lerp(22, 0, t);
      scale = lerp(1.04, 1, t);
      break;

    case "letter-spread": {
      const tracking = lerp(0.4, 0, t);   // em units
      letterSpacing = `${tracking.toFixed(3)}em`;
      blurPx = lerp(4, 0, t);
      break;
    }

    case "fade":
      // pure opacity — no transform, no blur
      break;
  }

  const transform =
    translateX === 0 && translateY === 0 && scale === 1
      ? undefined
      : `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;

  return {
    opacity,
    transform,
    filter: blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : undefined,
    letterSpacing,
    willChange: "transform, opacity, filter",
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ── Ambient drift (the "breathe" phase) ──────────────────────────────────────
//
// After entrance settles, hold elements with one ambient motion. Without this,
// scenes feel dead during their hold time. Per Hyperframes: "Static = death."

interface UseAmbientArgs {
  /** Where the entrance finishes — ambient kicks in after this. In seconds. */
  startAfterSec?: number;
  /** Type of drift. Default: "y-bob" (gentle vertical). */
  kind?: "y-bob" | "x-bob" | "scale-breath" | "vignette-breath";
  /** Amplitude in px (or 0..1 for scale-breath). */
  amplitude?: number;
  /** Loop duration in seconds. Default: 3.5s. */
  periodSec?: number;
}

export function useAmbient({
  startAfterSec = 0.6,
  kind = "y-bob",
  amplitude = 4,
  periodSec = 3.5,
}: UseAmbientArgs = {}): CSSProperties {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startFrame = Math.round(startAfterSec * fps);
  if (frame < startFrame) return {};

  const periodFrames = Math.max(1, Math.round(periodSec * fps));
  const phase = ((frame - startFrame) % periodFrames) / periodFrames;
  // Smooth 0..1..0 cycle via cosine
  const cycle = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);

  switch (kind) {
    case "y-bob": {
      const y = lerp(-amplitude / 2, amplitude / 2, cycle);
      return { transform: `translateY(${y.toFixed(2)}px)` };
    }
    case "x-bob": {
      const x = lerp(-amplitude / 2, amplitude / 2, cycle);
      return { transform: `translateX(${x.toFixed(2)}px)` };
    }
    case "scale-breath": {
      const s = lerp(1 - amplitude / 2, 1 + amplitude / 2, cycle);
      return { transform: `scale(${s.toFixed(4)})` };
    }
    case "vignette-breath": {
      const o = lerp(0.7, 0.9, cycle);
      return { opacity: o };
    }
  }
}

// ── Stagger helpers ──────────────────────────────────────────────────────────
//
// Hyperframes rule: total stagger sequence ≤ 500ms regardless of item count.
// Stagger in ORDER OF IMPORTANCE, not DOM order.

export function staggerOffset(
  index: number,
  fps: number,
  gapMs = 90,
): number {
  return Math.round((gapMs / 1000) * fps * index);
}

/**
 * Hook variant — call inside a scene to get a frame offset for cascading.
 */
export function useStaggerOffset(index: number, gapMs = 90): number {
  const { fps } = useVideoConfig();
  return staggerOffset(index, fps, gapMs);
}

// ── Word-reveal carrier pattern ──────────────────────────────────────────────
//
// From MOTION_PHILOSOPHY §2.2. First word carries the cut's momentum (360px
// slide), subsequent words decay geometrically. Carrier uses expo.out 0.33s,
// tail uses power2.out 0.20s.

export const CARRIER_DISTANCES = [360, 120, 60, 25, 12] as const;

export function carrierDistance(wordIndex: number): number {
  if (wordIndex < CARRIER_DISTANCES.length) {
    return CARRIER_DISTANCES[wordIndex];
  }
  // After the 5th word, plateau at 12px.
  return 12;
}

export interface CarrierStyleArgs {
  wordIndex: number;
  /** Direction the words enter from. Default: "right" (RTL friendly). */
  fromEdge?: "right" | "left" | "bottom";
  /** Per-word stagger in ms. Default: 90. */
  staggerMs?: number;
  /** Where this word's onset sits in seconds (for syncing to transcript). */
  onsetSec?: number;
}

/**
 * Returns CSS for a single word in a carrier-style kinetic reveal.
 * Caller is responsible for laying out the words; we just animate them.
 */
export function useCarrierWord({
  wordIndex,
  fromEdge = "right",
  staggerMs = 90,
  onsetSec,
}: CarrierStyleArgs): CSSProperties {
  const { fps } = useVideoConfig();
  const offsetFrames =
    onsetSec !== undefined
      ? Math.round(onsetSec * fps)
      : staggerOffset(wordIndex, fps, staggerMs);

  // First word = carrier (longer duration, expo.out). Tail words shorter.
  const isCarrier = wordIndex === 0;
  const dist = carrierDistance(wordIndex);

  const baseStyle = useEntrance({
    signature: "side-slide",
    ease: isCarrier ? "glass-rise" : "confident",
    durationSec: isCarrier ? 0.33 : 0.20,
    offsetFrames,
    fromEdge,
  });

  // Override the side-slide distance with our carrier-specific distance.
  // We do this by re-deriving the transform from the t implicit in opacity.
  const t = (baseStyle.opacity as number) ?? 0;
  let translateX = 0;
  let translateY = 0;
  const tx = lerp(dist, 0, t);
  if (fromEdge === "right")  translateX = tx;
  if (fromEdge === "left")   translateX = -tx;
  if (fromEdge === "bottom") translateY = tx;

  return {
    opacity: t,
    transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
    filter: t < 0.95 ? `blur(${lerp(6, 0, t).toFixed(2)}px)` : undefined,
    willChange: "transform, opacity, filter",
  };
}
