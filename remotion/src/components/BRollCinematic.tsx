/**
 * BRollCinematic.tsx — Full-screen cinematic B-roll scenes.
 *
 * These scenes use AI-generated backgrounds as the primary visual,
 * with animated overlays that enhance — not replace — the image.
 * Text is minimal and positioned at safe zones.
 *
 * Philosophy: the GENERATED IMAGE is the hero. Overlays add motion and life.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import {
  SPRING_PRESETS,
  useSceneLifecycle,
  hexToRgb,
  noise,
} from "./BRollMotion";

// ── Shared props ──────────────────────────────────────────────────────────────

export interface CinematicSceneProps {
  brandColor: string;
  durationFrames: number;
  bgImage: string; // staticFile path e.g. "bg/bg_clock_chaos.png"
  primary?: string;
  secondary?: string;
  icon?: string;
}

// ── Reusable particles overlay ────────────────────────────────────────────────

const FloatingParticles: React.FC<{
  count: number;
  color: string;
  opacity: number;
  speed: number;
}> = ({ count, color, opacity, speed }) => {
  const frame = useCurrentFrame();
  const rgb = hexToRgb(color);
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: noise(i * 7.3, 0.5),
        y: noise(i * 3.7, 1.2),
        size: 2 + noise(i * 11.1, 2.3) * 5,
        phase: noise(i * 2.1, 4.7) * Math.PI * 2,
        spd: 0.3 + noise(i * 5.9, 3.1) * 1.2,
        op: 0.2 + noise(i * 8.3, 5.5) * 0.5,
      })),
    [count],
  );

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const t = frame * 0.006 * p.spd * speed;
        const x = ((p.x + Math.sin(t + p.phase) * 0.04) % 1) * 1080;
        const y = ((p.y - t * 0.015 + 10) % 1) * 1920;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: `rgba(${rgb},${p.op})`,
              boxShadow:
                p.size > 4
                  ? `0 0 ${p.size * 2}px rgba(${rgb},${p.op * 0.3})`
                  : "none",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 1: CINEMATIC CHAOS
// Full-screen AI-generated chaos background + animated overlay elements.
// Spinning clock hands, flying debris rectangles, particle burst.
// ══════════════════════════════════════════════════════════════════════════════

export const CinematicChaos: React.FC<CinematicSceneProps> = ({
  brandColor,
  durationFrames,
  bgImage,
  primary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  // Ken Burns — slow zoom in on bg
  const zoom = interpolate(frame, [0, durationFrames], [1.0, 1.08], {
    extrapolateRight: "clamp",
  });

  // Spinning clock overlay
  const clockRotation = frame * 6;

  // Flying debris
  const debris = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        startX: 300 + noise(i, 1) * 500,
        startY: 700 + noise(i, 2) * 600,
        angle: noise(i, 3) * Math.PI * 2,
        speed: 1 + noise(i, 4) * 3,
        w: 40 + noise(i, 5) * 100,
        h: 15 + noise(i, 6) * 25,
        rot: noise(i, 7) * 360,
      })),
    [],
  );

  // Shockwave ring
  const shockProg = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 30, stiffness: 60 },
  });
  const ringSize = interpolate(shockProg, [0, 1], [50, 700]);
  const ringOpacity = interpolate(shockProg, [0, 0.2, 1], [0, 0.5, 0]);

  // Vignette pulse
  const vignettePulse = 0.6 + Math.sin(frame * 0.08) * 0.1;

  return (
    <AbsoluteFill style={{ background: "#000", opacity: lifecycle }}>
      {/* Full-screen AI background with Ken Burns */}
      <div
        style={{
          position: "absolute",
          inset: -40,
          transform: `scale(${zoom})`,
          transformOrigin: "50% 45%",
        }}
      >
        <Img
          src={staticFile(bgImage)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Dark overlay for contrast */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)`,
        }}
      />

      {/* Animated vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 50% 40% at 50% 45%, transparent 0%, rgba(0,0,0,${vignettePulse}) 100%)`,
        }}
      />

      {/* Spinning clock hands overlay */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.6 * lifecycle,
        }}
      >
        {/* Hour hand */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 5,
            height: 120,
            background: brandColor,
            transformOrigin: "2.5px 0px",
            transform: `rotate(${clockRotation}deg)`,
            borderRadius: 3,
            boxShadow: `0 0 20px rgba(${rgb},0.6)`,
          }}
        />
        {/* Minute hand */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 3,
            height: 80,
            background: "#FFF",
            transformOrigin: "1.5px 0px",
            transform: `rotate(${clockRotation * 3}deg)`,
            borderRadius: 2,
            opacity: 0.5,
          }}
        />
        {/* Center dot */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: brandColor,
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 30px rgba(${rgb},0.8)`,
          }}
        />
      </div>

      {/* Flying debris rectangles */}
      {debris.map((d, i) => {
        const t = frame * 0.02 * d.speed;
        const dist = t * 80;
        const x = d.startX + Math.cos(d.angle) * dist;
        const y = d.startY + Math.sin(d.angle) * dist;
        const fadeOut = interpolate(
          frame,
          [durationFrames * 0.5, durationFrames * 0.8],
          [0.5, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: d.w,
              height: d.h,
              background: `rgba(${rgb},0.15)`,
              border: `1px solid rgba(${rgb},0.25)`,
              borderRadius: 3,
              transform: `rotate(${d.rot + frame * d.speed}deg)`,
              opacity: fadeOut * lifecycle,
            }}
          />
        );
      })}

      {/* Shockwave ring */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "50%",
          width: ringSize,
          height: ringSize,
          borderRadius: "50%",
          border: `2px solid rgba(${rgb},${ringOpacity})`,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Floating particles */}
      <FloatingParticles count={30} color={brandColor} opacity={0.4} speed={0.8} />

      {/* Text label — bottom safe zone, small */}
      {primary && (
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            left: 0,
            right: 0,
            textAlign: "center",
            opacity:
              interpolate(frame, [10, 20], [0, 1], {
                extrapolateRight: "clamp",
                extrapolateLeft: "clamp",
              }) * lifecycle,
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              padding: "12px 36px",
              borderRadius: 14,
              border: `1px solid rgba(${rgb},0.3)`,
            }}
          >
            <span
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 38,
                color: "#FFFFFF",
                direction: "rtl",
              }}
            >
              {primary}
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 2: CINEMATIC SPLIT
// Full-screen AI-generated split background + animated overlay elements.
// Left: jittering/shaking chaos overlays. Right: clean bars building up.
// ══════════════════════════════════════════════════════════════════════════════

export const CinematicSplit: React.FC<
  CinematicSceneProps & { leftLabel?: string; rightLabel?: string }
> = ({ brandColor, durationFrames, bgImage, primary, secondary, leftLabel, rightLabel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 10, 10);

  const leftText = leftLabel || secondary || "לפני";
  const rightText = rightLabel || primary || "אחרי";

  // Slow zoom
  const zoom = interpolate(frame, [0, durationFrames], [1.0, 1.05]);

  // Left side — subtle shake/jitter
  const shakeX = Math.sin(frame * 0.3) * 3;
  const shakeY = Math.cos(frame * 0.4) * 2;

  // Right side — checkmarks appearing
  const checkCount = 5;

  // Split line glow pulse
  const glowPulse = 0.5 + Math.sin(frame * 0.1) * 0.3;

  return (
    <AbsoluteFill style={{ background: "#000", opacity: lifecycle }}>
      {/* Full-screen AI background */}
      <div
        style={{
          position: "absolute",
          inset: -20,
          transform: `scale(${zoom})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Img
          src={staticFile(bgImage)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Subtle darkening overlay */}
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.25)" }} />

      {/* Left side chaos overlays — jittering elements */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "45%",
          bottom: 0,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Red X marks appearing */}
        {[380, 520, 660, 800, 940].map((y, i) => {
          const xProg = spring({
            frame: Math.max(0, frame - 6 - i * 6),
            fps,
            config: SPRING_PRESETS.slam,
          });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                right: 40,
                top: y,
                opacity: xProg * 0.7 * lifecycle,
                transform: `scale(${xProg})`,
                fontSize: 42,
              }}
            >
              
            </div>
          );
        })}
      </div>

      {/* Right side order overlays — checkmarks building up */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "45%",
          bottom: 0,
        }}
      >
        {[380, 520, 660, 800, 940].map((y, i) => {
          const checkProg = spring({
            frame: Math.max(0, frame - 16 - i * 5),
            fps,
            config: SPRING_PRESETS.pop,
          });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 40,
                top: y,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: brandColor,
                transform: `scale(${checkProg})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 16px rgba(${rgb},0.5)`,
                opacity: lifecycle,
              }}
            >
              <span style={{ color: "#FFF", fontSize: 20, fontWeight: 900 }}></span>
            </div>
          );
        })}
      </div>

      {/* Center split line glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          width: 3,
          transform: "translateX(-50%) skewX(-3deg)",
          background: brandColor,
          boxShadow: `0 0 ${20 + glowPulse * 30}px rgba(${rgb},${glowPulse})`,
          opacity: interpolate(frame, [4, 14], [0, 0.8], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }) * lifecycle,
        }}
      />

      {/* Floating particles */}
      <FloatingParticles count={20} color={brandColor} opacity={0.3} speed={0.4} />

      {/* Labels — outside panels, never clipped */}
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          left: 0,
          width: "46%",
          textAlign: "center",
          zIndex: 5,
          opacity:
            interpolate(frame, [8, 18], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }) * lifecycle,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            padding: "10px 24px",
            borderRadius: 12,
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            direction: "rtl",
          }}
        >
          {leftText}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          right: 0,
          width: "46%",
          textAlign: "center",
          zIndex: 5,
          opacity:
            interpolate(frame, [18, 28], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }) * lifecycle,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: `rgba(${rgb},0.25)`,
            backdropFilter: "blur(6px)",
            padding: "10px 24px",
            borderRadius: 12,
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 28,
            color: "#FFFFFF",
            direction: "rtl",
            boxShadow: `0 0 20px rgba(${rgb},0.2)`,
          }}
        >
          {rightText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 3: CINEMATIC CONVERGENCE
// Full-screen AI shield background + animated particles spiraling inward
// + structure reveal at center.
// ══════════════════════════════════════════════════════════════════════════════

export const CinematicConvergence: React.FC<CinematicSceneProps> = ({
  brandColor,
  durationFrames,
  bgImage,
  primary,
  icon,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 10, 10);

  // Ken Burns — zoom into center
  const zoom = interpolate(frame, [0, durationFrames], [1.0, 1.12]);

  // Convergence progress
  const converge = interpolate(frame, [0, durationFrames * 0.6], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Vortex particles
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        angle: (i / 40) * Math.PI * 2,
        startR: 350 + noise(i, 10) * 300,
        speed: 0.5 + noise(i, 20) * 1,
        size: 3 + noise(i, 30) * 5,
        phase: noise(i, 40) * Math.PI * 2,
        op: 0.2 + noise(i, 50) * 0.5,
      })),
    [],
  );

  // Center structure reveal
  const structReveal = spring({
    frame: Math.max(0, frame - Math.round(durationFrames * 0.5)),
    fps,
    config: SPRING_PRESETS.pop,
  });

  // Orbital ring
  const ringRotation = frame * 0.4;

  // Glow intensity
  const glowIntensity = 20 + converge * 40 + Math.sin(frame * 0.08) * 10;

  const CX = 540;
  const CY = 850;

  return (
    <AbsoluteFill style={{ background: "#000", opacity: lifecycle }}>
      {/* Full-screen AI background */}
      <div
        style={{
          position: "absolute",
          inset: -50,
          transform: `scale(${zoom})`,
          transformOrigin: "50% 44%",
        }}
      >
        <Img
          src={staticFile(bgImage)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Subtle darkening */}
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.15)" }} />

      {/* Vortex particles spiraling in */}
      {particles.map((p, i) => {
        const currentR = p.startR * (1 - converge * 0.88);
        const spin = frame * 0.02 * p.speed + p.phase + p.angle;
        const x = CX + Math.cos(spin) * currentR;
        const y = CY + Math.sin(spin) * currentR;
        const trailLen = Math.min(currentR * 0.03, 10);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size + trailLen,
              height: p.size,
              borderRadius: p.size / 2,
              background: `rgba(${rgb},${p.op * (1 - converge * 0.3) * lifecycle})`,
              transform: `translate(-50%, -50%) rotate(${(spin * 180) / Math.PI}deg)`,
              boxShadow: `0 0 ${p.size * 2}px rgba(${rgb},${p.op * 0.3})`,
            }}
          />
        );
      })}

      {/* Center glow builds up */}
      <div
        style={{
          position: "absolute",
          top: CY,
          left: CX,
          width: 200 + converge * 150,
          height: 200 + converge * 150,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${rgb},${converge * 0.2}) 0%, transparent 70%)`,
          transform: "translate(-50%, -50%)",
          filter: `blur(${glowIntensity}px)`,
        }}
      />

      {/* Center shield/structure reveals */}
      <div
        style={{
          position: "absolute",
          top: CY,
          left: CX,
          transform: `translate(-50%, -50%) scale(${structReveal})`,
          opacity: structReveal * lifecycle,
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: `3px solid ${brandColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 50px rgba(${rgb},0.5), inset 0 0 30px rgba(${rgb},0.1)`,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(4px)",
          }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80">
            <polyline
              points="18,42 34,58 62,24"
              fill="none"
              stroke={brandColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Orbital ring */}
      <div
        style={{
          position: "absolute",
          top: CY,
          left: CX,
          width: 280,
          height: 280,
          borderRadius: "50%",
          border: `2px solid rgba(${rgb},${structReveal * 0.2})`,
          transform: `translate(-50%, -50%) rotate(${ringRotation}deg)`,
        }}
      />

      {/* Text label — bottom */}
      {primary && (
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: structReveal * lifecycle,
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
              padding: "12px 36px",
              borderRadius: 14,
              border: `1px solid rgba(${rgb},0.3)`,
            }}
          >
            <span
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 38,
                color: "#FFFFFF",
                direction: "rtl",
              }}
            >
              {primary}
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
