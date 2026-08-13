/**
 * OverlayPreview — standalone composition for previewing all overlay scenes.
 *
 * Renders the full 10-scene catalog over the ambient background (no real
 * video). This is the studio-driven "feel check" composition — scrub the
 * timeline to evaluate motion, layout, type, and transitions before wiring
 * overlays into the real EditedReel pipeline.
 *
 * Layout is the same 5-layer model as may-shorts-19, minus the talking head:
 *   1. Ambient background (radial+grid+particles+vignette+grain)
 *   2. (Future) Talking-head face wrapper — replaced here by silhouette
 *   3. (Future) Seam treatment — disabled in preview
 *   4. Overlay scenes (back-to-back on the same track)
 *   5. (Future) Captions
 */
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { OverlayLayer } from "../components/overlays/OverlayLayer";
import { AmbientBackground } from "../components/overlays/ambient-bg";
import { SafeZoneFrame } from "../components/overlays/primitives";
import type { AnyOverlayScene } from "../components/overlays/types";

export interface OverlayPreviewProps {
  overlay_scenes: AnyOverlayScene[];
  fps: number;
  brand_color: string;
  total_duration: number;
  show_safe_zones?: boolean;
  show_silhouette?: boolean;
  show_ambient_bg?: boolean;
}

export function calculateOverlayPreviewDuration(
  totalDuration: number,
  fps: number,
): number {
  return Math.ceil(totalDuration * fps);
}

export const OverlayPreview: React.FC<OverlayPreviewProps> = ({
  overlay_scenes,
  fps,
  show_safe_zones = false,
  show_silhouette = true,
  show_ambient_bg = true,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0C" }}>
      {/* Layer 1: ambient background */}
      {show_ambient_bg && <AmbientBackground />}

      {/* Layer 2: speaker silhouette (placeholder for talking head) */}
      {show_silhouette && <SpeakerSilhouette />}

      {/* Layer 4: overlay scenes — time-sliced */}
      {overlay_scenes.map((scene, i) => {
        const startFrame = Math.round(scene.start * fps);
        const durationFrames = Math.max(
          fps,
          Math.round((scene.end - scene.start) * fps),
        );
        return (
          <Sequence
            key={`overlay-${scene.id}-${i}`}
            from={startFrame}
            durationInFrames={durationFrames}
            layout="none"
          >
            <OverlayLayer scene={scene} />
          </Sequence>
        );
      })}

      {/* Dev: safe-zone outlines */}
      <SafeZoneFrame show={show_safe_zones} />
    </AbsoluteFill>
  );
};

// ── Speaker silhouette — soft elliptical fill where the head would be ────────

const SpeakerSilhouette: React.FC = () => (
  <>
    {/* Head */}
    <div
      style={{
        position: "absolute",
        top: 480,
        left: "50%",
        transform: "translateX(-50%)",
        width: 380,
        height: 460,
        borderRadius: "50%",
        background:
          "radial-gradient(ellipse at 50% 35%, rgba(255,210,180,0.22), rgba(50,40,40,0.4) 70%, transparent)",
        filter: "blur(2px)",
        opacity: 0.6,
      }}
    />
    {/* Shoulders */}
    <div
      style={{
        position: "absolute",
        top: 920,
        left: "50%",
        transform: "translateX(-50%)",
        width: 760,
        height: 480,
        borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(60,60,75,0.55), rgba(20,20,28,0.4) 70%, transparent)",
        filter: "blur(4px)",
        opacity: 0.6,
      }}
    />
  </>
);
