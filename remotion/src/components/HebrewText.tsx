import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface HebrewTextProps {
  text: string;
  fontSize: number;
  fontWeight?: number;
  color?: string;
  shadow?: string;
  maxWidth?: string;
  animation?: "fade-in" | "slide-up" | "scale" | "none";
  delay?: number; // frames delay before animation starts
}

export const HebrewText: React.FC<HebrewTextProps> = ({
  text,
  fontSize,
  fontWeight = 700,
  color = "#FFFFFF",
  shadow = "0 2px 8px rgba(0,0,0,0.6)",
  maxWidth = "85%",
  animation = "fade-in",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delay);

  let opacity = 1;
  let translateY = 0;
  let scale = 1;

  if (animation === "fade-in") {
    opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
      extrapolateRight: "clamp",
    });
  } else if (animation === "slide-up") {
    opacity = interpolate(adjustedFrame, [0, 12], [0, 1], {
      extrapolateRight: "clamp",
    });
    translateY = interpolate(adjustedFrame, [0, 18], [40, 0], {
      extrapolateRight: "clamp",
    });
  } else if (animation === "scale") {
    const springVal = spring({
      frame: adjustedFrame,
      fps,
      config: { damping: 12, stiffness: 150 },
    });
    scale = interpolate(springVal, [0, 1], [0.7, 1]);
    opacity = interpolate(adjustedFrame, [0, 8], [0, 1], {
      extrapolateRight: "clamp",
    });
  }

  return (
    <div
      style={{
        direction: "rtl",
        textAlign: "center",
        fontFamily: "'Heebo', sans-serif",
        fontSize,
        fontWeight,
        color,
        textShadow: shadow,
        maxWidth,
        lineHeight: 1.3,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        wordWrap: "break-word",
        padding: "0 20px",
      }}
    >
      {text}
    </div>
  );
};
