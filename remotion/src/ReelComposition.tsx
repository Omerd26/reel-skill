import React from "react";
import { AbsoluteFill, Series } from "remotion";
import "@fontsource/heebo/400.css";
import "@fontsource/heebo/700.css";
import "@fontsource/heebo/800.css";
import "@fontsource/heebo/900.css";
import { HookScene } from "./scenes/HookScene";
import { ContentScene } from "./scenes/ContentScene";
import { CTAScene } from "./scenes/CTAScene";
import type { ReelProps } from "./types";

export const ReelComposition: React.FC<ReelProps> = ({
  scenes,
  fps,
  style,
  brand_color,
}) => {
  const totalScenes = scenes.length;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F0F" }}>
      <Series>
        {scenes.map((scene, index) => {
          const durationFrames = scene.duration_seconds * fps;

          return (
            <Series.Sequence
              key={index}
              durationInFrames={durationFrames}
            >
              {scene.is_hook ? (
                <HookScene
                  scene={scene}
                  style={style}
                  brandColor={brand_color}
                />
              ) : scene.is_cta ? (
                <CTAScene
                  scene={scene}
                  style={style}
                  brandColor={brand_color}
                />
              ) : (
                <ContentScene
                  scene={scene}
                  style={style}
                  brandColor={brand_color}
                  totalScenes={totalScenes}
                />
              )}
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};

/**
 * Calculate total duration in frames from scene data.
 * Used by Root.tsx to set composition duration.
 */
export function calculateDuration(
  scenes: ReelProps["scenes"],
  fps: number
): number {
  return scenes.reduce(
    (total, scene) => total + scene.duration_seconds * fps,
    0
  );
}
