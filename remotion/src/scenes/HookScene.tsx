import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { KenBurns } from "../components/KenBurns";
import { HebrewText } from "../components/HebrewText";
import type { SceneData } from "../types";
import { STYLE_THEMES } from "../types";

interface HookSceneProps {
  scene: SceneData;
  style: string;
  brandColor: string;
}

export const HookScene: React.FC<HookSceneProps> = ({
  scene,
  style,
  brandColor,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = STYLE_THEMES[style] || STYLE_THEMES.modern;

  // Dark overlay fades in
  const overlayOpacity = interpolate(frame, [0, 10], [0, theme.overlayOpacity], {
    extrapolateRight: "clamp",
  });

  // Orange accent line animates width
  const lineWidth = interpolate(frame, [20, 35], [0, 120], {
    extrapolateRight: "clamp",
  });

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Background image with Ken Burns */}
      <KenBurns src={scene.image_path} direction="zoom-in" intensity={0.08} />

      {/* Dark overlay */}
      <AbsoluteFill
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      />

      {/* Centered content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Main hook text */}
        <HebrewText
          text={scene.screen_text}
          fontSize={85}
          fontWeight={900}
          color="#FFFFFF"
          shadow={theme.textShadow}
          animation="slide-up"
          delay={5}
        />

        {/* Orange accent line */}
        <div
          style={{
            width: lineWidth,
            height: 6,
            backgroundColor: brandColor,
            borderRadius: 3,
            marginTop: 24,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
