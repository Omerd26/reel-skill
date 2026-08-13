import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { KenBurns } from "../components/KenBurns";
import { HebrewText } from "../components/HebrewText";
import type { SceneData } from "../types";
import { STYLE_THEMES } from "../types";

interface CTASceneProps {
  scene: SceneData;
  style: string;
  brandColor: string;
}

export const CTAScene: React.FC<CTASceneProps> = ({
  scene,
  style,
  brandColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const theme = STYLE_THEMES[style] || STYLE_THEMES.modern;

  // Button spring animation
  const buttonSpring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  const buttonScale = interpolate(buttonSpring, [0, 1], [0.6, 1]);
  const buttonOpacity = interpolate(frame, [18, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtle pulse on button after it appears
  const pulsePhase = Math.max(0, frame - 40);
  const pulse = 1 + Math.sin(pulsePhase * 0.15) * 0.03;

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Background with Ken Burns */}
      <KenBurns src={scene.image_path} direction="zoom-in" intensity={0.05} />

      {/* Deep gradient overlay (45% height) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "45%",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* CTA content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: "20%",
        }}
      >
        {/* CTA text */}
        <HebrewText
          text={scene.screen_text}
          fontSize={60}
          fontWeight={900}
          color="#FFFFFF"
          shadow={theme.textShadow}
          animation="slide-up"
          delay={5}
        />

        {/* @omerd button */}
        <div
          style={{
            marginTop: 40,
            opacity: buttonOpacity,
            transform: `scale(${buttonScale * pulse})`,
          }}
        >
          <div
            style={{
              backgroundColor: brandColor,
              borderRadius: 30,
              padding: "12px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 700,
                fontSize: 36,
                color: "#FFFFFF",
                direction: "ltr",
              }}
            >
              @omerd
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
