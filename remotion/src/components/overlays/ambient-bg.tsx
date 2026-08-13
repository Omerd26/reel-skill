/**
 * AmbientBackground — the 5-layer "never flat" background stack.
 *
 * Used in the OverlayPreview composition (no real video) and as a fallback
 * when an overlay scene fully covers the frame (no talking head visible).
 *
 * Layer model from MOTION_PHILOSOPHY §2.1 + DESIGN.md "Backgrounds":
 *   1. Radial gradient base (warm-tinted near-black center → deep edges)
 *   2. Grid mesh (80px cells, 4-5% opacity) drifting slowly
 *   3. Drifting particle dots (deterministic positions)
 *   4. Edge vignette
 *   5. Faint film grain overlay
 *
 * "Static = death." Every layer except the gradient has slow ambient motion.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../../design/tokens";

interface AmbientBackgroundProps {
  /** Override the base color. Default near-black warm. */
  baseColor?: string;
  /** Edge color for the radial fade. Default `--bg-deep`. */
  edgeColor?: string;
  /** Tint the grid lines and particles toward this hue. Default brand orange. */
  accentTint?: string;
  /** Show grain overlay? Default true. */
  grain?: boolean;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  baseColor = COLORS.bg,
  edgeColor = COLORS.bgDeep,
  accentTint = COLORS.accentBrand,
  grain = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / Math.max(1, durationInFrames);

  // Slow grid drift — translateY shifts the grid pattern over time
  const gridDriftY = (t * 80) % 80; // wraps every 80px (one cell)
  // Slow grid drift — translateX
  const gridDriftX = ((t * 40) % 80);

  // Vignette breath — opacity wobbles 0.78 ↔ 0.92 over 4s loop
  const breathPeriodFrames = Math.max(1, Math.round(4 * fps));
  const breathPhase = (frame % breathPeriodFrames) / breathPeriodFrames;
  const breathCycle = 0.5 - 0.5 * Math.cos(breathPhase * Math.PI * 2);
  const vignetteOpacity = 0.78 + breathCycle * 0.14;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {/* Layer 1: radial gradient base */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${tintToward(
            baseColor,
            accentTint,
            0.06,
          )} 0%, ${baseColor} 45%, ${edgeColor} 90%)`,
        }}
      />

      {/* Layer 2: grid mesh, drifting */}
      <div
        style={{
          position: "absolute",
          inset: -40,
          backgroundImage: `
            linear-gradient(${withAlpha(accentTint, 0.05)} 1px, transparent 1px),
            linear-gradient(90deg, ${withAlpha(accentTint, 0.05)} 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          backgroundPosition: `${gridDriftX}px ${gridDriftY}px`,
          opacity: 0.65,
        }}
      />

      {/* Layer 3: drifting particle dots */}
      <ParticleField accentTint={accentTint} />

      {/* Layer 4: edge vignette (with breath) */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, ${edgeColor} 95%)`,
          opacity: vignetteOpacity,
        }}
      />

      {/* Layer 5: faint film grain */}
      {grain && <FilmGrain />}
    </AbsoluteFill>
  );
};

// ── ParticleField ────────────────────────────────────────────────────────────
//
// 8 dots positioned deterministically. Each drifts on its own slow loop
// with a phase offset, so they don't move in lockstep.

const PARTICLE_POSITIONS: Array<{ left: string; top: string; size: number; phase: number }> = [
  { left: "12%", top: "18%", size: 2, phase: 0.00 },
  { left: "82%", top: "9%",  size: 1, phase: 0.13 },
  { left: "40%", top: "32%", size: 2, phase: 0.27 },
  { left: "91%", top: "52%", size: 1, phase: 0.41 },
  { left: "8%",  top: "68%", size: 2, phase: 0.55 },
  { left: "62%", top: "78%", size: 1, phase: 0.69 },
  { left: "24%", top: "88%", size: 2, phase: 0.83 },
  { left: "74%", top: "28%", size: 1, phase: 0.91 },
];

const ParticleField: React.FC<{ accentTint: string }> = ({ accentTint }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const periodFrames = Math.max(1, Math.round(8 * fps));

  return (
    <>
      {PARTICLE_POSITIONS.map((p, i) => {
        const phase = ((frame / periodFrames) + p.phase) % 1;
        const cycle = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
        const opacity = 0.18 + cycle * 0.22;
        const yShift = (cycle - 0.5) * 8;
        return (
          <div
            key={`particle-${i}`}
            style={{
              position: "absolute",
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: accentTint,
              opacity,
              transform: `translateY(${yShift.toFixed(2)}px)`,
              boxShadow: `0 0 8px ${withAlpha(accentTint, 0.45)}`,
            }}
          />
        );
      })}
    </>
  );
};

// ── FilmGrain — pure CSS, deterministic ─────────────────────────────────────
//
// Three radial gradients at different tile sizes give a non-repeating grain
// look without a PNG. From MOTION_PHILOSOPHY §2.1 #11.

const FilmGrain: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      mixBlendMode: "soft-light",
      opacity: 0.45,
      backgroundImage: `
        radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)
      `,
      backgroundSize: "3px 3px, 5px 5px, 7px 7px",
      backgroundPosition: "0 0, 1px 1px, 2px 2px",
    }}
  />
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function withAlpha(hexOrColor: string, alpha: number): string {
  // Naive: works for #RRGGBB. If already rgba/etc., we just append.
  if (hexOrColor.startsWith("#") && hexOrColor.length === 7) {
    const r = parseInt(hexOrColor.slice(1, 3), 16);
    const g = parseInt(hexOrColor.slice(3, 5), 16);
    const b = parseInt(hexOrColor.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return hexOrColor;
}

function tintToward(base: string, accent: string, amount: number): string {
  // Mix base toward accent by `amount` (0..1). Returns hex.
  const parse = (s: string): [number, number, number] | null => {
    if (s.startsWith("#") && s.length === 7) {
      return [
        parseInt(s.slice(1, 3), 16),
        parseInt(s.slice(3, 5), 16),
        parseInt(s.slice(5, 7), 16),
      ];
    }
    return null;
  };
  const b = parse(base);
  const a = parse(accent);
  if (!b || !a) return base;
  const mix = (x: number, y: number) => Math.round(x * (1 - amount) + y * amount);
  const r = mix(b[0], a[0]);
  const g = mix(b[1], a[1]);
  const bl = mix(b[2], a[2]);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}
