/**
 * BRollPreview.tsx — Standalone composition for previewing B-roll scenes.
 *
 * Renders B-roll scenes in sequence on a dark background (no source video).
 * Light leak transitions are skipped in preview mode to avoid WebGL requirement.
 */

import React from "react";
import {
  AbsoluteFill,
  Sequence,
} from "remotion";
import { BRollOverlay, BRollSceneData } from "../components/BRollOverlay";

export interface BRollPreviewProps {
  broll_scenes: BRollSceneData[];
  fps: number;
  brand_color: string;
  total_duration: number; // seconds
}

export function calculatePreviewDuration(
  totalDuration: number,
  fps: number,
): number {
  return Math.ceil(totalDuration * fps);
}

export const BRollPreview: React.FC<BRollPreviewProps> = ({
  broll_scenes,
  fps,
  brand_color,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {broll_scenes.map((scene, i) => {
        const startFrame = Math.round(scene.start * fps);
        const durationFrames = Math.max(
          fps,
          Math.round((scene.end - scene.start) * fps),
        );

        return (
          <Sequence
            key={`broll-preview-${i}`}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <BRollOverlay
              scene={scene}
              fps={fps}
              brandColor={brand_color}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
