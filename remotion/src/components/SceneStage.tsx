/**
 * SceneStage + CameraRig — the shared "reference-grade" foundation every
 * B-roll scene sits on. Born from the 4-reel reference study (see
 * ../design/BROLL_STYLE_SPEC.md): our old scenes floated small content in a
 * flat black void; the references keep a light source, texture, depth and a
 * constantly-moving virtual camera in EVERY graphic scene.
 *
 * Laws encoded here:
 *   LAW 2 — a virtual camera is always moving (CameraRig: poses + velocity-
 *           proportional directional blur + residual settle drift).
 *   LAW 3 — one light source + one texture pass, never flat dark
 *           (glow pool, drifting grid, particles, grain, breathing vignette).
 *   LAW 4 — depth (floor-shadow slot under the hero).
 *
 * Everything is deterministic (seeded noise(), frame-driven) — no
 * Math.random, render-safe on swiftshader, no WebGL.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { noise } from "./BRollMotion";

/* ── grain tile: 256px SVG feTurbulence, generated once as a data URI ── */
const GRAIN_URI = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">` +
  `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>` +
  `<feColorMatrix type="saturate" values="0"/></filter>` +
  `<rect width="256" height="256" filter="url(#n)" opacity="0.55"/></svg>`,
)}`;

export interface SceneStageProps {
  variant?: "dark" | "light";
  /** Accent hex for the glow pool (brand orange by default). */
  accent?: string;
  /** 0..1 multiplier on the glow pool strength. */
  glow?: number;
  /** Seed so two stages in one reel don't move in lockstep. */
  seed?: number;
  /** Optional floor-shadow under the hero (LAW 4) — y as 0..1 of height. */
  floorShadowAt?: number;
  children?: React.ReactNode;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [224, 112, 30];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const SceneStage: React.FC<SceneStageProps> = ({
  variant = "dark",
  accent = "#E0701E",
  glow = 1,
  seed = 0,
  floorShadowAt,
  children,
}) => {
  const frame = useCurrentFrame();
  const [ar, ag, ab] = hexToRgb(accent);

  // Slow breath cycles (120f ≈ 4s) — alive, never distracting.
  const breathe = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin((frame / 120) * Math.PI * 2));
  const vignettePulse = 0.75 + 0.15 * (0.5 + 0.5 * Math.sin((frame / 120) * Math.PI * 2 + 1.7));
  const gridDrift = (frame * 0.25) % 80;

  // 8 deterministic drifting particles (dark variant only).
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        x: 6 + noise(seed * 31 + i * 7.3) * 88,
        y: 8 + noise(seed * 17 + i * 13.1) * 80,
        phase: noise(seed * 5 + i * 3.7) * Math.PI * 2,
        speed: 0.5 + noise(seed * 41 + i * 9.9) * 0.8,
      })),
    [seed],
  );

  // Grain jitter every 2 frames, seeded.
  const grainStep = Math.floor(frame / 2);
  const grainX = Math.floor(noise(seed + grainStep * 1.31) * 256);
  const grainY = Math.floor(noise(seed + grainStep * 2.71) * 256);

  if (variant === "light") {
    /* ── whiteboard world (workflow / UI-editor scenes) ── */
    return (
      <AbsoluteFill>
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse 120% 90% at 50% 40%, #F4F5F7 0%, #E8E9EB 60%, #DCDEE2 100%)",
          }}
        />
        {/* dot grid, slow drift */}
        <AbsoluteFill
          style={{
            backgroundImage: "radial-gradient(rgba(17,24,39,0.07) 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
            backgroundPosition: `0px ${(frame * 0.2) % 32}px`,
          }}
        />
        {children}
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(160,165,172,0.45) 100%)",
          }}
        />
      </AbsoluteFill>
    );
  }

  /* ── dark stage (default) ── */
  return (
    <AbsoluteFill>
      {/* 1. base — radial only (H.264-banding rule from DESIGN.md) */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 38%, #14161D 0%, #0A0A0C 55%, #050608 100%)",
        }}
      />
      {/* 2. accent glow pool — THE light source; heroes sit inside it */}
      <AbsoluteFill
        style={{
          opacity: breathe,
          background: `radial-gradient(ellipse 70% 45% at 50% 45%, rgba(${ar},${ag},${ab},${(0.10 * glow).toFixed(3)}) 0%, transparent 65%)`,
        }}
      />
      {/* 3. drifting grid mesh */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          backgroundPosition: `0px ${gridDrift}px`,
        }}
      />
      {/* 4. particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y + Math.sin(frame / 60 * p.speed + p.phase) * 2.2}%`,
            width: 2,
            height: 2,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.30)",
          }}
        />
      ))}
      {/* 5. optional floor shadow that grounds the hero */}
      {floorShadowAt !== undefined && (
        <div
          style={{
            position: "absolute",
            left: "15%",
            top: `${floorShadowAt * 100}%`,
            width: "70%",
            height: 90,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.6)",
            filter: "blur(40px)",
          }}
        />
      )}
      {children}
      {/* 6. grain — overlay-blended, jittered */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          backgroundImage: `url("${GRAIN_URI}")`,
          backgroundPosition: `${grainX}px ${grainY}px`,
          opacity: 0.05,
          mixBlendMode: "overlay",
        }}
      />
      {/* 7. breathing vignette */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity: vignettePulse,
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(5,6,8,0.85) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ═══ CameraRig — LAW 2: the virtual camera never sits still ═══ */

export interface CameraPose {
  /** Frame (relative to the scene's local timeline) this pose is reached. */
  frame: number;
  x: number;
  y: number;
  scale: number;
  rotate?: number;
}

export interface CameraRigProps {
  poses: CameraPose[];
  /** Residual settle drift on the final hold (scale 1.03→1.00 style). */
  settleDrift?: boolean;
  children?: React.ReactNode;
}

/** Whip easing between poses: fast in, decelerating landing. */
const WHIP = Easing.bezier(0.5, 0, 0.15, 1);

export const CameraRig: React.FC<CameraRigProps> = ({ poses, settleDrift = true, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const sorted = [...poses].sort((a, b) => a.frame - b.frame);
  if (sorted.length === 0) return <AbsoluteFill>{children}</AbsoluteFill>;

  const frames = sorted.map((p) => p.frame);
  const val = (pick: (p: CameraPose) => number) =>
    sorted.length === 1
      ? pick(sorted[0])
      : interpolate(frame, frames, sorted.map(pick), {
          easing: WHIP,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  let x = val((p) => p.x);
  let y = val((p) => p.y);
  let scale = val((p) => p.scale);
  const rotate = val((p) => p.rotate ?? 0);

  // Residual drift after the last pose — nothing holds perfectly still.
  const last = sorted[sorted.length - 1];
  if (settleDrift && frame > last.frame) {
    const t = Math.min(1, (frame - last.frame) / Math.max(1, durationInFrames - last.frame));
    scale *= 1.02 - 0.02 * t;
  }

  // Velocity → directional blur (whips read as motion, not teleports).
  const dt = 2;
  const prev = Math.max(0, frame - dt);
  const vx = (val((p) => p.x) - interpolate(prev, frames, sorted.map((p) => p.x), { easing: WHIP, extrapolateLeft: "clamp", extrapolateRight: "clamp" })) / dt;
  const vy = (val((p) => p.y) - interpolate(prev, frames, sorted.map((p) => p.y), { easing: WHIP, extrapolateLeft: "clamp", extrapolateRight: "clamp" })) / dt;
  const blurX = Math.min(24, Math.abs(vx) * 0.9);
  const blurY = Math.min(24, Math.abs(vy) * 0.9);
  const moving = blurX + blurY > 2;
  const filterId = "dirblur-rig";

  return (
    <AbsoluteFill>
      {moving && (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter id={filterId}>
              <feGaussianBlur stdDeviation={`${blurX.toFixed(1)} ${blurY.toFixed(1)}`} />
            </filter>
          </defs>
        </svg>
      )}
      <AbsoluteFill
        style={{
          // ORIGIN 0 0 is load-bearing: every pose is computed as
          // screen = world × scale + translate. With the default center
          // origin the same numbers produce a skewed, off-axis look — the
          // owner's exact "התמונה עקומה, כאילו מצלמת מהצד" report on the
          // workflow zoom-out (2026-08-08).
          transformOrigin: "0 0",
          transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`,
          filter: moving ? `url(#${filterId})` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
