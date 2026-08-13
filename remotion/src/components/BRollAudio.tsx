/**
 * BRollAudio.tsx — Audio-reactive motion layer for B-roll scenes.
 *
 * Provides hooks that convert audio data into usable motion signals.
 * Scenes can subscribe to these signals to make animation respond to
 * the energy and rhythm of the spoken audio.
 *
 * Usage:
 *   1. Parent composition loads audio data via useWindowedAudioData()
 *   2. Passes audioData + dataOffsetInSeconds as props to B-roll scenes
 *   3. Scenes use useAudioEnergy() to get normalized motion values
 *
 * Design principles:
 *   - Audio reactivity is an ENHANCEMENT, not the core animation
 *   - Tasteful: scale ±10%, glow ±30%, not wild bouncing
 *   - Falls back gracefully when no audio data is available
 *   - Frame-accurate: uses the same frame as the parent
 */

import { useCurrentFrame, useVideoConfig } from "remotion";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AudioReactiveData {
  /** Normalized overall energy 0-1 */
  energy: number;
  /** Bass-heavy energy (low frequencies) 0-1 */
  bass: number;
  /** Mid-range energy 0-1 */
  mids: number;
  /** High frequency energy 0-1 */
  highs: number;
  /** Whether audio data is available */
  hasAudio: boolean;
}

export interface AudioSceneConfig {
  /** How much audio affects scale (0 = none, 1 = full) */
  scaleReactivity?: number;
  /** How much audio affects glow/opacity (0-1) */
  glowReactivity?: number;
  /** How much audio affects particle speed (0-1) */
  particleReactivity?: number;
  /** Smoothing factor — higher = smoother (1-10) */
  smoothing?: number;
}

const DEFAULT_CONFIG: Required<AudioSceneConfig> = {
  scaleReactivity: 0.08,    // subtle — ±8% scale
  glowReactivity: 0.3,      // moderate — ±30% glow
  particleReactivity: 0.5,  // noticeable — ±50% particle speed
  smoothing: 3,
};

// ── Audio data processing ─────────────────────────────────────────────────────

/**
 * Extract audio energy bands from frequency data.
 * frequencies: array of 0-1 values from visualizeAudio(), bass on left.
 */
export function extractBands(frequencies: number[]): Omit<AudioReactiveData, "hasAudio"> {
  if (!frequencies || frequencies.length === 0) {
    return { energy: 0, bass: 0, mids: 0, highs: 0 };
  }

  const len = frequencies.length;
  const bassEnd = Math.floor(len * 0.15);   // bottom 15% = bass
  const midsEnd = Math.floor(len * 0.5);    // 15-50% = mids
  // 50-100% = highs

  const bassSlice = frequencies.slice(0, bassEnd);
  const midsSlice = frequencies.slice(bassEnd, midsEnd);
  const highsSlice = frequencies.slice(midsEnd);

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  const bass = avg(bassSlice);
  const mids = avg(midsSlice);
  const highs = avg(highsSlice);
  const energy = bass * 0.5 + mids * 0.35 + highs * 0.15; // bass-weighted

  return { energy, bass, mids, highs };
}

// ── Smoothing buffer ──────────────────────────────────────────────────────────
// Simple exponential moving average for frame-to-frame smoothing.

const _smoothBuffers = new Map<string, number>();

function smooth(key: string, value: number, factor: number): number {
  const prev = _smoothBuffers.get(key) ?? value;
  const alpha = 1 / Math.max(1, factor);
  const result = prev + alpha * (value - prev);
  _smoothBuffers.set(key, result);
  return result;
}

// ── Motion value generators ───────────────────────────────────────────────────

/**
 * Compute audio-reactive motion modifiers for a scene.
 *
 * Returns multipliers that scenes can apply to their animations:
 *   scaleMod: multiply with existing scale (e.g. 1.0 + scaleMod = 1.05)
 *   glowMod: add to glow opacity or intensity
 *   speedMod: multiply with particle/animation speed
 *   pulseMod: 0-1 pulse value synced to bass hits
 *
 * When no audio data is available, all values are neutral (0 or 1).
 */
export function computeAudioMotion(
  audio: AudioReactiveData,
  config: AudioSceneConfig = {},
): {
  scaleMod: number;
  glowMod: number;
  speedMod: number;
  pulseMod: number;
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!audio.hasAudio) {
    return { scaleMod: 0, glowMod: 0, speedMod: 1, pulseMod: 0 };
  }

  const smoothedBass = smooth("bass", audio.bass, cfg.smoothing);
  const smoothedEnergy = smooth("energy", audio.energy, cfg.smoothing);

  return {
    scaleMod: smoothedBass * cfg.scaleReactivity,
    glowMod: smoothedEnergy * cfg.glowReactivity,
    speedMod: 1 + smoothedEnergy * cfg.particleReactivity,
    pulseMod: smoothedBass,
  };
}

// ── Fallback hook for scenes without audio data ───────────────────────────────

/**
 * Generate fake "audio" energy from frame position for scenes that
 * don't have real audio data. Uses sine-based simulation.
 * This makes scenes feel alive even without actual audio analysis.
 */
export function useFallbackAudioEnergy(): AudioReactiveData {
  const frame = useCurrentFrame();

  // Simulate natural speech cadence — varies every ~0.5-1 second
  const base = Math.sin(frame * 0.08) * 0.3 + 0.3;
  const pulse = Math.max(0, Math.sin(frame * 0.15)) * 0.4;
  const high = Math.sin(frame * 0.2 + 1.5) * 0.15 + 0.15;

  return {
    energy: base + pulse * 0.3,
    bass: base,
    mids: base * 0.8 + pulse * 0.2,
    highs: high,
    hasAudio: false,
  };
}

// ── Scene-level integration helper ────────────────────────────────────────────

/**
 * All-in-one helper for scenes to get audio-reactive values.
 *
 * If real audioData + frequencies are passed (from parent composition),
 * uses actual audio analysis. Otherwise uses fallback simulation.
 *
 * Usage in a scene component:
 *   const audio = useSceneAudio(props.frequencies);
 *   const { scaleMod, glowMod } = computeAudioMotion(audio);
 *   // Apply: transform: `scale(${1 + scaleMod})`
 */
export function useSceneAudio(
  frequencies?: number[] | null,
): AudioReactiveData {
  const fallback = useFallbackAudioEnergy();

  if (!frequencies || frequencies.length === 0) {
    return fallback;
  }

  return {
    ...extractBands(frequencies),
    hasAudio: true,
  };
}
