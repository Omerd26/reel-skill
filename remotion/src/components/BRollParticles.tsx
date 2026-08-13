/**
 * BRollParticles.tsx — Particle system scenes for premium B-roll.
 *
 * Provides reusable particle primitives and complete particle-based scenes.
 * All animation driven by useCurrentFrame() — no RAF loops or CSS animations.
 *
 * Particle types:
 *   - FloatingDust: subtle ambient particles for atmosphere
 *   - DirectionalStream: speed/momentum particles flowing in a direction
 *   - BurstExplosion: impact burst from a center point
 *   - RisingEmbers: upward-floating glowing particles
 *
 * Scene types:
 *   - particle_atmosphere: ambient particles behind content
 *   - particle_burst: impact moment with particle explosion
 *   - particle_vortex: swirling particles pulling toward center
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import * as Icons from "lucide-react";
import { getBrandIcon } from "./BrandIcons";
import {
  SPRING_PRESETS,
  useSceneLifecycle,
  hexToRgb,
  noise,
  getBgStyle,
} from "./BRollMotion";

// ── Icon helper ───────────────────────────────────────────────────────────────

function LucideIcon({
  name,
  size = 48,
  color = "#FFFFFF",
  strokeWidth = 2,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const BrandIcon = getBrandIcon(name);
  if (BrandIcon) return <BrandIcon size={size} color={color} />;
  const Icon = (Icons as Record<string, any>)[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

// ── Particle data generation ──────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;     // 0-1 initial position
  y: number;     // 0-1 initial position
  size: number;  // px
  speed: number; // multiplier
  phase: number; // animation offset
  opacity: number;
}

function generateParticles(count: number, seed: number = 42): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: noise(i * 7.3 + seed, 0.5),
    y: noise(i * 3.7 + seed, 1.2),
    size: 2 + noise(i * 11.1 + seed, 2.3) * 6,
    speed: 0.3 + noise(i * 5.9 + seed, 3.1) * 1.4,
    phase: noise(i * 2.1 + seed, 4.7) * Math.PI * 2,
    opacity: 0.15 + noise(i * 8.3 + seed, 5.5) * 0.55,
  }));
}

// ── Particle Primitives ───────────────────────────────────────────────────────

/**
 * Floating dust particles — subtle ambient atmosphere.
 * Drift slowly with gentle sine-wave motion.
 */
export const FloatingDust: React.FC<{
  count?: number;
  color: string;
  opacity?: number;
  speed?: number;
  seed?: number;
}> = ({ count = 40, color, opacity = 1, speed = 1, seed = 42 }) => {
  const frame = useCurrentFrame();
  const particles = useMemo(() => generateParticles(count, seed), [count, seed]);
  const rgb = hexToRgb(color);

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {particles.map((p) => {
        const t = frame * 0.008 * p.speed * speed;
        const x = ((p.x + Math.sin(t + p.phase) * 0.05) % 1) * 1080;
        const y = ((p.y - t * 0.02 + 10) % 1) * 1920; // drift upward
        const pulse = 0.5 + Math.sin(frame * 0.04 + p.phase) * 0.5;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: `rgba(${rgb},${p.opacity * pulse})`,
              boxShadow: p.size > 5
                ? `0 0 ${p.size * 2}px rgba(${rgb},${p.opacity * 0.3})`
                : "none",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Directional particle stream — conveys speed and momentum.
 * Particles flow in a specified direction.
 */
export const DirectionalStream: React.FC<{
  count?: number;
  color: string;
  direction?: "up" | "down" | "left" | "right";
  speed?: number;
  opacity?: number;
}> = ({ count = 30, color, direction = "up", speed = 1, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const particles = useMemo(() => generateParticles(count, 77), [count]);
  const rgb = hexToRgb(color);

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {particles.map((p) => {
        const t = frame * 0.02 * p.speed * speed;
        let x: number, y: number;

        switch (direction) {
          case "up":
            x = p.x * 1080;
            y = ((p.y - t + 100) % 1.2 - 0.1) * 1920;
            break;
          case "down":
            x = p.x * 1080;
            y = ((p.y + t) % 1.2 - 0.1) * 1920;
            break;
          case "left":
            x = ((p.x - t + 100) % 1.2 - 0.1) * 1080;
            y = p.y * 1920;
            break;
          case "right":
            x = ((p.x + t) % 1.2 - 0.1) * 1080;
            y = p.y * 1920;
            break;
        }

        // Streak effect for speed particles
        const streakLength = direction === "up" || direction === "down"
          ? p.speed * 12 * speed
          : 0;
        const streakWidth = direction === "left" || direction === "right"
          ? p.speed * 12 * speed
          : 0;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: Math.max(p.size * 0.6, 2) + streakWidth,
              height: Math.max(p.size * 0.6, 2) + streakLength,
              borderRadius: streakLength > 0 || streakWidth > 0 ? 1 : "50%",
              background: `rgba(${rgb},${p.opacity * 0.7})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Burst explosion — particles radiate outward from center.
 * Triggered at a specific frame, then expands and fades.
 */
export const BurstExplosion: React.FC<{
  count?: number;
  color: string;
  triggerFrame?: number;
  centerX?: number;
  centerY?: number;
  maxRadius?: number;
}> = ({
  count = 24,
  color,
  triggerFrame = 0,
  centerX = 540,
  centerY = 960,
  maxRadius = 400,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const particles = useMemo(() => generateParticles(count, 99), [count]);
  const rgb = hexToRgb(color);

  if (frame < triggerFrame) return null;

  const localFrame = frame - triggerFrame;
  const burstProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 25, stiffness: 80 },
  });
  const fadeOut = interpolate(localFrame, [fps * 0.5, fps * 1.5], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut, pointerEvents: "none" }}>
      {particles.map((p) => {
        const angle = (p.id / count) * Math.PI * 2 + p.phase;
        const dist = maxRadius * burstProgress * p.speed;
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;
        const scale = 1 - burstProgress * 0.6;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size * 1.5,
              height: p.size * 1.5,
              borderRadius: "50%",
              background: `rgba(${rgb},${p.opacity})`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              boxShadow: `0 0 ${p.size * 3}px rgba(${rgb},0.5)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ── Complete Particle Scenes ──────────────────────────────────────────────────

export interface ParticleSceneProps {
  brandColor: string;
  durationFrames: number;
  title?: string;
  primary?: string;
  secondary?: string;
  icon?: string;
}

/**
 * PARTICLE ATMOSPHERE — ambient floating particles behind large text.
 * Creates depth and premium feel without being distracting.
 */
export const ParticleAtmosphere: React.FC<ParticleSceneProps> = ({
  brandColor,
  durationFrames,
  title,
  primary,
  secondary,
  icon,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 14, 12);

  const textReveal = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: SPRING_PRESETS.smooth,
  });

  return (
    <AbsoluteFill style={{ background: "#020208", opacity: lifecycle }}>
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 45%, rgba(${rgb},0.06) 0%, transparent 70%)`,
        }}
      />

      {/* Floating particles — background layer */}
      <FloatingDust count={50} color={brandColor} opacity={0.6} speed={0.5} seed={42} />

      {/* Rising embers — mid layer */}
      <DirectionalStream count={15} color={brandColor} direction="up" speed={0.3} opacity={0.4} />

      {/* Icon */}
      {icon && (
        <div
          style={{
            position: "absolute",
            top: "26%",
            left: "50%",
            transform: `translate(-50%, 0) scale(${textReveal})`,
            opacity: lifecycle,
          }}
        >
          <LucideIcon name={icon} size={60} color={brandColor} strokeWidth={1.5} />
        </div>
      )}

      {/* Main text */}
      <div
        style={{
          position: "absolute",
          top: icon ? "40%" : "36%",
          left: 60,
          right: 60,
          textAlign: "center",
          opacity: textReveal * lifecycle,
          transform: `translateY(${interpolate(textReveal, [0, 1], [25, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 72,
            color: "#FFFFFF",
            direction: "rtl",
            lineHeight: 1.2,
            textShadow: `0 0 50px rgba(${rgb},0.25)`,
          }}
        >
          {primary}
        </div>

        {secondary && (
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 500,
              fontSize: 34,
              color: `rgba(${rgb},0.8)`,
              direction: "rtl",
              marginTop: 16,
              opacity: interpolate(frame, [18, 28], [0, 1], {
                extrapolateRight: "clamp",
                extrapolateLeft: "clamp",
              }),
            }}
          >
            {secondary}
          </div>
        )}
      </div>

      {/* Title pill */}
      {title && (
        <div
          style={{
            position: "absolute",
            top: 100,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }) * lifecycle,
          }}
        >
          <span
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 800,
              fontSize: 30,
              color: brandColor,
              direction: "rtl",
            }}
          >
            {title}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * PARTICLE BURST — VISUAL-FIRST impact scene.
 * Shows animated visual chaos (spinning clock, flying rectangles, scattered elements)
 * that explodes outward. Text is a small label, not the hero.
 */
export const ParticleBurst: React.FC<ParticleSceneProps> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
  icon,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const burstTrigger = Math.round(fps * 0.15);
  const slamProgress = spring({ frame, fps, config: SPRING_PRESETS.slam });

  // Flash on impact
  const flashOpacity = interpolate(slamProgress, [0.25, 0.45, 0.65], [0, 0.4, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Spinning clock hands — visual metaphor for "burning time"
  const clockRotation = frame * 8; // spins fast — urgency
  const clockScale = spring({ frame, fps, config: SPRING_PRESETS.heavy });

  // Chaos rectangles flying outward after burst
  const chaosRects = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2 + 0.3,
      speed: 0.6 + noise(i, 1) * 0.8,
      width: 60 + noise(i, 2) * 100,
      height: 20 + noise(i, 3) * 30,
      rotation: noise(i, 4) * 360,
    })), []);

  return (
    <AbsoluteFill style={{ background: "#000", opacity: lifecycle }}>
      {/* Impact flash */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at 50% 42%, rgba(${rgb},${flashOpacity}) 0%, transparent 50%)`,
      }} />

      {/* Ambient dust */}
      <FloatingDust count={35} color={brandColor} opacity={0.4} speed={0.5} />

      {/* === VISUAL: Giant spinning clock face === */}
      <div style={{
        position: "absolute", top: "38%", left: "50%",
        transform: `translate(-50%, -50%) scale(${clockScale})`,
        opacity: lifecycle * 0.9,
      }}>
        {/* Clock circle */}
        <div style={{
          width: 320, height: 320, borderRadius: "50%",
          border: `4px solid rgba(${rgb},0.4)`,
          position: "relative",
        }}>
          {/* Tick marks */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute", top: "50%", left: "50%",
              width: 3, height: i % 3 === 0 ? 20 : 10,
              background: `rgba(${rgb},${i % 3 === 0 ? 0.7 : 0.3})`,
              transformOrigin: `1.5px ${160}px`,
              transform: `rotate(${i * 30}deg)`,
            }} />
          ))}
          {/* Spinning hands — fast! */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: 4, height: 100, background: brandColor,
            transformOrigin: "2px 0px",
            transform: `rotate(${clockRotation}deg)`,
            borderRadius: 2,
            boxShadow: `0 0 12px rgba(${rgb},0.6)`,
          }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: 3, height: 70, background: "#FFF",
            transformOrigin: "1.5px 0px",
            transform: `rotate(${clockRotation * 2.5}deg)`,
            borderRadius: 2, opacity: 0.7,
          }} />
          {/* Center dot */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: 14, height: 14, borderRadius: "50%",
            background: brandColor, transform: "translate(-50%, -50%)",
            boxShadow: `0 0 20px rgba(${rgb},0.8)`,
          }} />
        </div>
      </div>

      {/* === VISUAL: Chaos rectangles flying outward === */}
      {chaosRects.map((rect, i) => {
        const burstProg = frame > burstTrigger
          ? spring({ frame: frame - burstTrigger - i * 2, fps, config: { damping: 20, stiffness: 80 } })
          : 0;
        const dist = burstProg * (200 + rect.speed * 300);
        const x = 540 + Math.cos(rect.angle) * dist;
        const y = 730 + Math.sin(rect.angle) * dist;
        const fade = interpolate(burstProg, [0.6, 1], [1, 0], { extrapolateRight: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            width: rect.width, height: rect.height,
            background: `rgba(${rgb},${0.15 + (i % 3) * 0.1})`,
            border: `1px solid rgba(${rgb},0.3)`,
            borderRadius: 4,
            transform: `translate(-50%, -50%) rotate(${rect.rotation + frame * 2}deg)`,
            opacity: fade * lifecycle,
          }} />
        );
      })}

      {/* Particle burst */}
      <BurstExplosion count={40} color={brandColor} triggerFrame={burstTrigger} maxRadius={500} />

      {/* === Small text label at bottom — NOT the hero === */}
      {primary && (
        <div style={{
          position: "absolute", bottom: "18%",
          left: 60, right: 60, textAlign: "center",
          opacity: interpolate(frame, [12, 22], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) * lifecycle,
        }}>
          <div style={{
            fontFamily: "'Heebo', sans-serif", fontWeight: 900,
            fontSize: 44, color: "#FFFFFF", direction: "rtl",
            textShadow: `0 0 30px rgba(${rgb},0.4)`,
          }}>
            {primary}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * PARTICLE VORTEX — VISUAL-FIRST: scattered chaos shapes spiral inward
 * and converge into an ordered structure (shield/circle/checkmark).
 * Visual tells the story. Text is a small label.
 */
export const ParticleVortex: React.FC<ParticleSceneProps> = ({
  brandColor,
  durationFrames,
  primary,
  icon,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const particles = useMemo(() => generateParticles(45, 55), []);
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 10, 10);

  const convergeProgress = interpolate(frame, [0, durationFrames * 0.55], [0, 1], {
    extrapolateRight: "clamp",
  });

  const structureReveal = spring({
    frame: Math.max(0, frame - Math.round(durationFrames * 0.5)),
    fps,
    config: SPRING_PRESETS.pop,
  });

  const CX = 540;
  const CY = 820;

  // Scattered chaos shapes that converge
  const chaosShapes = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      startAngle: (i / 12) * Math.PI * 2,
      startR: 350 + noise(i, 10) * 250,
      width: 40 + noise(i, 20) * 80,
      height: 20 + noise(i, 30) * 40,
      rotation: noise(i, 40) * 360,
      color: i % 3 === 0 ? `rgba(${rgb},0.3)` : "rgba(255,255,255,0.08)",
    })), [rgb]);

  return (
    <AbsoluteFill style={{ background: "#020208", opacity: lifecycle }}>
      {/* Growing glow as convergence happens */}
      <div style={{
        position: "absolute", top: CY, left: CX,
        width: 200 + convergeProgress * 400,
        height: 200 + convergeProgress * 400,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${rgb},${convergeProgress * 0.2}) 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)",
      }} />

      {/* === VISUAL: Chaos shapes spiraling inward === */}
      {chaosShapes.map((shape, i) => {
        const currentR = shape.startR * (1 - convergeProgress * 0.9);
        const spin = frame * 0.015 * (0.5 + noise(i, 50) * 1) + shape.startAngle;
        const x = CX + Math.cos(spin) * currentR;
        const y = CY + Math.sin(spin) * currentR;
        // Shapes shrink as they converge
        const scaleDown = 1 - convergeProgress * 0.7;
        // Rotation speeds up as they approach center
        const rot = shape.rotation + frame * (1 + convergeProgress * 5);

        return (
          <div key={`shape-${i}`} style={{
            position: "absolute", left: x, top: y,
            width: shape.width * scaleDown,
            height: shape.height * scaleDown,
            background: shape.color,
            border: `1px solid rgba(${rgb},${0.2 + convergeProgress * 0.3})`,
            borderRadius: 4,
            transform: `translate(-50%, -50%) rotate(${rot}deg)`,
            opacity: (1 - convergeProgress * 0.6) * lifecycle,
          }} />
        );
      })}

      {/* Vortex particles — lots of them for visual density */}
      {particles.map((p) => {
        const baseAngle = (p.id / particles.length) * Math.PI * 2;
        const startR = 300 + p.speed * 250;
        const currentR = startR * (1 - convergeProgress * 0.9);
        const spin = frame * 0.025 * p.speed + p.phase;
        const angle = baseAngle + spin;
        const x = CX + Math.cos(angle) * currentR;
        const y = CY + Math.sin(angle) * currentR;
        const particleOpacity = p.opacity * (1 - convergeProgress * 0.3) * lifecycle;
        // Trail effect — elongate in direction of motion
        const trailLen = Math.min(currentR * 0.04, 12);

        return (
          <div key={p.id} style={{
            position: "absolute", left: x, top: y,
            width: p.size + trailLen,
            height: p.size,
            borderRadius: p.size / 2,
            background: `rgba(${rgb},${particleOpacity})`,
            transform: `translate(-50%, -50%) rotate(${angle * 180 / Math.PI}deg)`,
            boxShadow: `0 0 ${p.size * 2}px rgba(${rgb},${particleOpacity * 0.4})`,
          }} />
        );
      })}

      {/* === VISUAL: Structure reveals at center after convergence === */}
      {/* Shield / circle / checkmark — the "control" visual */}
      <div style={{
        position: "absolute", top: CY, left: CX,
        transform: `translate(-50%, -50%) scale(${structureReveal})`,
        opacity: structureReveal * lifecycle,
      }}>
        {/* Outer ring */}
        <div style={{
          width: 200, height: 200, borderRadius: "50%",
          border: `4px solid ${brandColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 60px rgba(${rgb},0.5), inset 0 0 40px rgba(${rgb},0.15)`,
        }}>
          {/* Icon inside */}
          {icon ? (
            <LucideIcon name={icon} size={90} color={brandColor} strokeWidth={1.5} />
          ) : (
            /* Default: checkmark */
            <svg width="90" height="90" viewBox="0 0 90 90">
              <polyline
                points="20,48 38,65 70,28"
                fill="none" stroke={brandColor} strokeWidth="6"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Orbital ring appears with structure */}
      <div style={{
        position: "absolute", top: CY, left: CX,
        width: 300, height: 300, borderRadius: "50%",
        border: `2px solid rgba(${rgb},${structureReveal * 0.25})`,
        transform: `translate(-50%, -50%) rotate(${frame * 0.5}deg)`,
      }} />

      {/* === Small text label at bottom === */}
      {primary && (
        <div style={{
          position: "absolute", bottom: "14%",
          left: 60, right: 60, textAlign: "center",
          opacity: structureReveal * lifecycle,
        }}>
          <div style={{
            fontFamily: "'Heebo', sans-serif", fontWeight: 900,
            fontSize: 42, color: "#FFFFFF", direction: "rtl",
            textShadow: `0 0 20px rgba(${rgb},0.3)`,
          }}>
            {primary}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
