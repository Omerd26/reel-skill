/**
 * BRoll3D.tsx — 3D scene components using @remotion/three + React Three Fiber.
 *
 * All animation driven by useCurrentFrame() — useFrame() from R3F is FORBIDDEN.
 * <Sequence> inside <ThreeCanvas> must use layout="none".
 *
 * Scenes:
 *   - scene_3d_cards: Floating 3D cards with text, arranged in perspective
 *   - scene_3d_sphere: Glowing sphere with orbiting elements
 *   - scene_3d_morph: Geometric shape that morphs/transforms
 *
 * Reusable wrapper: ThreeScene provides canvas + lights + camera defaults.
 */

import React, { useRef, useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import {
  SPRING_PRESETS,
  useSceneLifecycle,
  hexToRgb,
} from "./BRollMotion";

// ── Reusable 3D scene wrapper ─────────────────────────────────────────────────

export const ThreeScene: React.FC<{
  children: React.ReactNode;
  bgColor?: string;
  opacity?: number;
}> = ({ children, bgColor = "#020208", opacity = 1 }) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: bgColor, opacity }}>
      <ThreeCanvas width={width} height={height}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} />
        <pointLight position={[-3, 3, 3]} intensity={0.4} color="#4488ff" />
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// ── 3D Primitives ─────────────────────────────────────────────────────────────

/**
 * Animated floating 3D card with rounded edges.
 */
const FloatingCard: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  scale?: number;
  opacity?: number;
}> = ({ position, rotation, color, scale = 1, opacity = 1 }) => {
  return (
    <mesh position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <boxGeometry args={[2.2, 3.2, 0.08]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
};

/**
 * Glowing sphere with emissive material.
 */
const GlowSphere: React.FC<{
  position: [number, number, number];
  radius: number;
  color: string;
  emissiveIntensity?: number;
  opacity?: number;
}> = ({ position, radius, color, emissiveIntensity = 0.5, opacity = 1 }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={opacity}
        roughness={0.2}
        metalness={0.3}
      />
    </mesh>
  );
};

/**
 * Wireframe orbital ring.
 */
const OrbitalRing: React.FC<{
  radius: number;
  rotation: [number, number, number];
  color: string;
  opacity?: number;
}> = ({ radius, rotation, color, opacity = 0.3 }) => {
  return (
    <mesh rotation={rotation}>
      <torusGeometry args={[radius, 0.02, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
};

// ── Complete 3D Scenes ────────────────────────────────────────────────────────

export interface ThreeDSceneProps {
  brandColor: string;
  durationFrames: number;
  title?: string;
  primary?: string;
  secondary?: string;
  icon?: string;
  items?: { text: string; icon?: string; sub_text?: string }[];
}

/**
 * SCENE 3D CARDS — Floating cards in 3D space, arranged in a fan.
 * Camera slowly drifts. Cards have slight parallax depth.
 */
export const Scene3DCards: React.FC<ThreeDSceneProps> = ({
  brandColor,
  durationFrames,
  title,
  primary,
  items = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lifecycle = useSceneLifecycle(durationFrames, 12, 10);
  const rgb = hexToRgb(brandColor);

  // Camera drift
  const camX = Math.sin(frame * 0.008) * 0.5;
  const camY = Math.cos(frame * 0.006) * 0.3;

  // Cards fan out
  const cardCount = Math.min(items.length || 3, 5);

  return (
    <AbsoluteFill style={{ opacity: lifecycle }}>
      <ThreeScene bgColor="#020208" opacity={1}>
        {/* Camera position animated */}
        <group position={[camX, camY, 6]}>
          {/* This doesn't move the camera — we use group transform for parallax */}
        </group>

        {/* Fan of cards */}
        {Array.from({ length: cardCount }).map((_, idx) => {
          const delay = 6 + idx * 8;
          const cardProgress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: SPRING_PRESETS.snappy,
          });

          const angle = ((idx - (cardCount - 1) / 2) / Math.max(1, cardCount - 1)) * 0.6;
          const depth = -idx * 0.3;
          const rotY = angle + frame * 0.002;
          const posX = Math.sin(angle) * 3;
          const posZ = depth - 2;

          return (
            <FloatingCard
              key={idx}
              position={[posX, Math.sin(frame * 0.01 + idx) * 0.2, posZ]}
              rotation={[0, rotY, angle * 0.3]}
              color={idx === cardCount - 1 ? brandColor : "#1a1a2e"}
              scale={cardProgress}
              opacity={cardProgress * 0.9}
            />
          );
        })}

        {/* Center glow sphere */}
        <GlowSphere
          position={[0, 0, -3]}
          radius={0.3}
          color={brandColor}
          emissiveIntensity={0.4 + Math.sin(frame * 0.05) * 0.2}
          opacity={lifecycle * 0.7}
        />

        {/* Orbital rings */}
        <OrbitalRing
          radius={2.5}
          rotation={[Math.PI / 3, frame * 0.005, 0]}
          color={brandColor}
          opacity={0.15}
        />
      </ThreeScene>

      {/* 2D overlay text */}
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
              fontWeight: 900,
              fontSize: 36,
              color: "#FFFFFF",
              direction: "rtl",
            }}
          >
            {title}
          </span>
        </div>
      )}

      {primary && (
        <div
          style={{
            position: "absolute",
            bottom: "22%",
            left: 60,
            right: 60,
            textAlign: "center",
            opacity: interpolate(frame, [14, 24], [0, 1], { extrapolateRight: "clamp" }) * lifecycle,
          }}
        >
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 48,
              color: "#FFFFFF",
              direction: "rtl",
              textShadow: `0 0 30px rgba(${rgb},0.4)`,
            }}
          >
            {primary}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * SCENE 3D SPHERE — Central glowing sphere with orbiting elements.
 * Conveys a hub/center/core concept.
 */
export const Scene3DSphere: React.FC<ThreeDSceneProps> = ({
  brandColor,
  durationFrames,
  title,
  primary,
  items = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lifecycle = useSceneLifecycle(durationFrames, 12, 10);
  const rgb = hexToRgb(brandColor);

  const sphereScale = spring({
    frame,
    fps,
    config: SPRING_PRESETS.heavy,
  });

  const orbitSpeed = frame * 0.01;
  const orbitItems = items.slice(0, 4);

  return (
    <AbsoluteFill style={{ opacity: lifecycle }}>
      <ThreeScene bgColor="#020208">
        {/* Central sphere */}
        <GlowSphere
          position={[0, 0.2, 0]}
          radius={1.2 * sphereScale}
          color={brandColor}
          emissiveIntensity={0.3 + Math.sin(frame * 0.04) * 0.15}
          opacity={0.85}
        />

        {/* Orbital rings */}
        <OrbitalRing
          radius={2.2}
          rotation={[Math.PI / 4, orbitSpeed, 0]}
          color={brandColor}
          opacity={0.2}
        />
        <OrbitalRing
          radius={2.8}
          rotation={[Math.PI / 3, -orbitSpeed * 0.7, Math.PI / 6]}
          color={brandColor}
          opacity={0.1}
        />

        {/* Orbiting small spheres */}
        {orbitItems.map((_, idx) => {
          const angle = (idx / orbitItems.length) * Math.PI * 2 + orbitSpeed;
          const r = 2.5;
          const x = Math.cos(angle) * r;
          const z = Math.sin(angle) * r;
          const y = Math.sin(angle * 2 + frame * 0.02) * 0.5;

          const delay = 10 + idx * 6;
          const itemScale = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: SPRING_PRESETS.pop,
          });

          return (
            <GlowSphere
              key={idx}
              position={[x, y, z]}
              radius={0.2 * itemScale}
              color="#ffffff"
              emissiveIntensity={0.3}
              opacity={0.8 * itemScale}
            />
          );
        })}

        {/* Ambient point lights */}
        <pointLight position={[3, 2, 3]} intensity={0.3} color={brandColor} />
        <pointLight position={[-3, -1, -2]} intensity={0.2} color="#ffffff" />
      </ThreeScene>

      {/* 2D overlay */}
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
              fontWeight: 900,
              fontSize: 34,
              color: "#FFFFFF",
              direction: "rtl",
            }}
          >
            {title}
          </span>
        </div>
      )}

      {primary && (
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            left: 60,
            right: 60,
            textAlign: "center",
            opacity: interpolate(frame, [16, 26], [0, 1], { extrapolateRight: "clamp" }) * lifecycle,
          }}
        >
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 50,
              color: "#FFFFFF",
              direction: "rtl",
              textShadow: `0 0 30px rgba(${rgb},0.5)`,
            }}
          >
            {primary}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * SCENE 3D MORPH — Geometric shape that rotates and transforms.
 * Abstract, premium, works for concepts like "transformation", "innovation".
 */
export const Scene3DMorph: React.FC<ThreeDSceneProps> = ({
  brandColor,
  durationFrames,
  title,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lifecycle = useSceneLifecycle(durationFrames, 12, 10);
  const rgb = hexToRgb(brandColor);

  // Morph between geometries via scale oscillation
  const morphProgress = interpolate(frame, [0, durationFrames], [0, 1]);
  const breathe = Math.sin(frame * 0.04) * 0.1;

  const rotX = frame * 0.008;
  const rotY = frame * 0.012;

  const scaleSpring = spring({
    frame,
    fps,
    config: SPRING_PRESETS.heavy,
  });

  // Vertices deform slightly based on frame for organic feel
  const deformAmount = 0.15 + Math.sin(frame * 0.03) * 0.05;

  return (
    <AbsoluteFill style={{ opacity: lifecycle }}>
      <ThreeScene bgColor="#020208">
        {/* Main morphing shape */}
        <mesh
          rotation={[rotX, rotY, 0]}
          scale={[
            scaleSpring * (1 + breathe),
            scaleSpring * (1 - breathe * 0.5),
            scaleSpring * (1 + breathe * 0.3),
          ]}
        >
          <icosahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial
            color={brandColor}
            wireframe={morphProgress < 0.4}
            transparent
            opacity={0.8}
            roughness={0.2}
            metalness={0.4}
            emissive={brandColor}
            emissiveIntensity={0.15 + Math.sin(frame * 0.05) * 0.1}
          />
        </mesh>

        {/* Outer wireframe shell */}
        <mesh
          rotation={[rotX * 0.7, -rotY * 0.5, frame * 0.003]}
          scale={[scaleSpring * 2.2, scaleSpring * 2.2, scaleSpring * 2.2]}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color={brandColor}
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>

        {/* Inner glow */}
        <pointLight position={[0, 0, 0]} intensity={0.5} color={brandColor} distance={5} />
      </ThreeScene>

      {/* 2D overlay */}
      {title && (
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" }) * lifecycle,
          }}
        >
          <span
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 34,
              color: "#FFFFFF",
              direction: "rtl",
            }}
          >
            {title}
          </span>
        </div>
      )}

      {primary && (
        <div
          style={{
            position: "absolute",
            bottom: "24%",
            left: 60,
            right: 60,
            textAlign: "center",
            opacity: interpolate(frame, [14, 24], [0, 1], { extrapolateRight: "clamp" }) * lifecycle,
          }}
        >
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 52,
              color: "#FFFFFF",
              direction: "rtl",
              textShadow: `0 0 30px rgba(${rgb},0.4)`,
            }}
          >
            {primary}
          </div>
          {secondary && (
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 500,
                fontSize: 30,
                color: `rgba(${rgb},0.8)`,
                direction: "rtl",
                marginTop: 12,
              }}
            >
              {secondary}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
