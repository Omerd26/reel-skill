/**
 * SceneThumbnail — single-frame composition for catalog thumbnails.
 *
 * Used by render_thumbnails.mjs to produce one preview image per scene type.
 * Renders ONE scene full-screen on a dark backdrop, frozen at a frame in
 * the middle of the scene's lifetime so motion-graphics scenes show their
 * "settled" state rather than a half-completed entrance animation.
 *
 * Same composition handles both overlay and B-Roll dispatching — saves
 * managing two separate stills pipelines.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { OverlayLayer } from "./components/overlays/OverlayLayer";
import { BRollOverlay } from "./components/BRollOverlay";

interface SceneThumbnailProps {
  category: "overlay" | "broll";
  scene: Record<string, unknown>;
  fps?: number;
  brand_color?: string;
}

export const SceneThumbnail: React.FC<SceneThumbnailProps> = ({
  category,
  scene,
  fps = 30,
  brand_color = "#7c3aed",
}) => {
  return (
    <AbsoluteFill style={{
      // Dim background so light-on-dark overlays + dark-on-light B-Roll
      // both read clearly. Soft gradient adds depth without distracting.
      background: "linear-gradient(180deg, #0f0f1a 0%, #050508 100%)",
    }}>
      {category === "overlay" ? (
        // OverlayLayer dispatches by scene.type internally.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <OverlayLayer scene={scene as any} />
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <BRollOverlay scene={scene as any} fps={fps} brandColor={brand_color} />
      )}
    </AbsoluteFill>
  );
};

export type { SceneThumbnailProps };
