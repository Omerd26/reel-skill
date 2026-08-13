import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from "remotion";

/**
 * Resolve image path: absolute URLs pass through; relative paths use staticFile().
 */
export function resolveImageSrc(src: string): string {
  if (!src) return staticFile("scenes/placeholder.png");
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  // Relative path (e.g. "scenes/scene_1.jpg") → use staticFile
  return staticFile(src);
}

type KenBurnsDirection =
  | "zoom-in"
  | "zoom-out"
  | "pan-left"
  | "pan-right"
  | "pan-up";

interface KenBurnsProps {
  src: string;
  direction?: KenBurnsDirection;
  intensity?: number; // 0.04 = subtle, 0.12 = dramatic
}

export const KenBurns: React.FC<KenBurnsProps> = ({
  src,
  direction = "zoom-in",
  intensity = 0.06,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });

  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  switch (direction) {
    case "zoom-in":
      scale = 1 + progress * intensity;
      break;
    case "zoom-out":
      scale = 1 + intensity - progress * intensity;
      break;
    case "pan-left":
      scale = 1 + intensity * 0.5;
      translateX = -progress * intensity * 300;
      break;
    case "pan-right":
      scale = 1 + intensity * 0.5;
      translateX = progress * intensity * 300;
      break;
    case "pan-up":
      scale = 1 + intensity * 0.5;
      translateY = -progress * intensity * 200;
      break;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <Img
        src={resolveImageSrc(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        }}
      />
    </div>
  );
};

/** Pick a Ken Burns direction based on scene index for visual variety */
export function getKenBurnsDirection(sceneIndex: number): KenBurnsDirection {
  const directions: KenBurnsDirection[] = [
    "zoom-in",
    "pan-left",
    "zoom-out",
    "pan-right",
    "pan-up",
  ];
  return directions[sceneIndex % directions.length];
}
