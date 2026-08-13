import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { KenBurns, getKenBurnsDirection } from "../components/KenBurns";
import { HebrewText } from "../components/HebrewText";
import type { SceneData } from "../types";
import { STYLE_THEMES } from "../types";

interface ContentSceneProps {
  scene: SceneData;
  style: string;
  brandColor: string;
  totalScenes: number;
}

export const ContentScene: React.FC<ContentSceneProps> = ({
  scene,
  style,
  brandColor,
  totalScenes,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = STYLE_THEMES[style] || STYLE_THEMES.modern;

  // Badge fade-in
  const badgeOpacity = interpolate(frame, [0, 10], [0, 1], {
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
      {/* Background with Ken Burns - different direction per scene */}
      <KenBurns
        src={scene.image_path}
        direction={getKenBurnsDirection(scene.scene_number)}
        intensity={0.06}
      />

      {/* Bottom gradient overlay (30% height) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30%",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Scene number badge (top-right) */}
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 30,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          borderRadius: 20,
          padding: "6px 14px",
          opacity: badgeOpacity,
        }}
      >
        <span
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: 28,
            color: "#FFFFFF",
          }}
        >
          {scene.scene_number}/{totalScenes}
        </span>
      </div>

      {/* Screen text at bottom */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: "18%",
        }}
      >
        <HebrewText
          text={scene.screen_text}
          fontSize={54}
          fontWeight={800}
          color="#FFFFFF"
          shadow={theme.textShadow}
          animation="slide-up"
          delay={8}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
