/**
 * BRollTransitions.tsx — Premium transition system using @remotion/light-leaks.
 *
 * Provides reusable transition presets for B-roll scene boundaries.
 * Used between: talking head → B-roll, B-roll → talking head, B-roll → B-roll.
 *
 * Design: transitions are SELECTIVE, not applied everywhere.
 * Only certain scene types merit a light leak transition.
 *
 * Usage in composition:
 *   <BRollTransition
 *     preset="warm"
 *     durationFrames={20}
 *     placement="enter"
 *   />
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from "remotion";
import { LightLeak } from "@remotion/light-leaks";

// ── Transition Presets ────────────────────────────────────────────────────────

export interface TransitionPreset {
  name: string;
  seed: number;
  hueShift: number;
  description: string;
}

export const TRANSITION_PRESETS: Record<string, TransitionPreset> = {
  warm: {
    name: "warm",
    seed: 0,
    hueShift: 0,
    description: "Warm orange/amber — premium, cinematic",
  },
  cool: {
    name: "cool",
    seed: 3,
    hueShift: 220,
    description: "Cool blue — tech, professional",
  },
  brand: {
    name: "brand",
    seed: 1,
    hueShift: 25, // orange-ish — adjust for brand color
    description: "Brand-tinted — matches accent color",
  },
  soft: {
    name: "soft",
    seed: 5,
    hueShift: 40,
    description: "Soft golden — gentle, elegant",
  },
  dramatic: {
    name: "dramatic",
    seed: 7,
    hueShift: 10,
    description: "Intense amber — dramatic reveals",
  },
  green: {
    name: "green",
    seed: 2,
    hueShift: 120,
    description: "Green tint — growth, success themes",
  },
};

/**
 * Pick the best hue shift to approximate a brand hex color.
 * Maps brand color to closest light leak hue (0-360).
 */
export function brandColorToHueShift(brandColor: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(brandColor);
  if (!result) return 25; // default orange

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return Math.round(h * 360);
}

// ── Scene type → transition eligibility ───────────────────────────────────────

/**
 * Determine if a scene type should use light leak transitions.
 * Premium/cinematic scenes get transitions; utility scenes don't.
 */
const TRANSITION_ELIGIBLE_TYPES = new Set([
  // Premium tier — always eligible
  "spotlight_reveal",
  "shockwave_counter",
  "split_transform",
  "text_slam",
  "urgency_clock",
  // Particle scenes — premium atmosphere
  "particle_atmosphere",
  "particle_burst",
  "particle_vortex",
  // 3D scenes — premium visual
  "scene_3d_cards",
  "scene_3d_sphere",
  "scene_3d_morph",
  // Some standard scenes when dramatic
  "quote_hero",
  "graph_spike",
]);

export function shouldUseTransition(sceneType: string): boolean {
  return TRANSITION_ELIGIBLE_TYPES.has(sceneType);
}

/**
 * Pick the best transition preset for a scene type.
 */
export function pickPresetForScene(
  sceneType: string,
  brandColor?: string,
): TransitionPreset {
  // Dramatic scenes get dramatic transitions
  if (["shockwave_counter", "text_slam", "particle_burst"].includes(sceneType)) {
    return TRANSITION_PRESETS.dramatic;
  }

  // Cool/tech scenes
  if (["scene_3d_cards", "scene_3d_sphere", "scene_3d_morph", "analytics_dashboard"].includes(sceneType)) {
    return TRANSITION_PRESETS.cool;
  }

  // Atmospheric scenes
  if (["spotlight_reveal", "particle_atmosphere", "particle_vortex"].includes(sceneType)) {
    return TRANSITION_PRESETS.soft;
  }

  // Default: brand-colored
  if (brandColor) {
    const hue = brandColorToHueShift(brandColor);
    return { ...TRANSITION_PRESETS.brand, hueShift: hue };
  }

  return TRANSITION_PRESETS.warm;
}

// ── Transition Components ─────────────────────────────────────────────────────

export interface BRollTransitionProps {
  /** Transition preset name or custom preset */
  preset?: string | TransitionPreset;
  /** Duration in frames (default 20 = ~0.67s at 30fps) */
  durationFrames?: number;
  /** Whether this is an enter or exit transition */
  placement: "enter" | "exit";
  /** Optional opacity multiplier */
  intensity?: number;
}

/**
 * BRollTransition — a single light leak overlay for B-roll boundaries.
 *
 * For "enter": leak reveals during the start of B-roll (leak IN).
 * For "exit": leak reveals at the end of B-roll (leak OUT).
 *
 * The LightLeak component reveals during first half, retracts during second.
 * So we just render it at the right time window.
 */
export const BRollTransition: React.FC<BRollTransitionProps> = ({
  preset = "warm",
  durationFrames = 20,
  placement,
  intensity = 0.85,
}) => {
  const resolvedPreset: TransitionPreset =
    typeof preset === "string"
      ? TRANSITION_PRESETS[preset] || TRANSITION_PRESETS.warm
      : preset;

  return (
    <AbsoluteFill style={{ opacity: intensity, pointerEvents: "none" }}>
      <LightLeak
        durationInFrames={durationFrames}
        seed={resolvedPreset.seed}
        hueShift={resolvedPreset.hueShift}
      />
    </AbsoluteFill>
  );
};

/**
 * BRollSceneWithTransitions — wraps a B-roll scene with optional
 * enter and exit light leak transitions.
 *
 * Usage in the main composition:
 *   <Sequence from={startFrame} durationInFrames={totalFrames}>
 *     <BRollSceneWithTransitions
 *       sceneType="spotlight_reveal"
 *       durationFrames={sceneFrames}
 *       brandColor="#E0701E"
 *       enterTransition={true}
 *       exitTransition={true}
 *       transitionDuration={18}
 *     >
 *       <SpotlightReveal ... />
 *     </BRollSceneWithTransitions>
 *   </Sequence>
 */
export const BRollSceneWithTransitions: React.FC<{
  children: React.ReactNode;
  sceneType: string;
  durationFrames: number;
  brandColor?: string;
  enterTransition?: boolean;
  exitTransition?: boolean;
  transitionDuration?: number;
}> = ({
  children,
  sceneType,
  durationFrames,
  brandColor,
  enterTransition = true,
  exitTransition = true,
  transitionDuration = 18,
}) => {
  const eligible = shouldUseTransition(sceneType);
  const preset = pickPresetForScene(sceneType, brandColor);

  return (
    <AbsoluteFill>
      {/* Scene content */}
      {children}

      {/* Enter transition — first N frames */}
      {eligible && enterTransition && (
        <Sequence from={0} durationInFrames={transitionDuration} layout="none">
          <BRollTransition
            preset={preset}
            durationFrames={transitionDuration}
            placement="enter"
            intensity={0.75}
          />
        </Sequence>
      )}

      {/* Exit transition — last N frames */}
      {eligible && exitTransition && (
        <Sequence
          from={durationFrames - transitionDuration}
          durationInFrames={transitionDuration}
          layout="none"
        >
          <BRollTransition
            preset={preset}
            durationFrames={transitionDuration}
            placement="exit"
            intensity={0.65}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
