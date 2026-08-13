import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface CalloutProps {
  text: string;
  position?: "top" | "center" | "bottom";
  brandColor?: string;
}

export const Callout: React.FC<CalloutProps> = ({
  text,
  position = "top",
  brandColor = "#E0701E",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Slide in from right
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 150 },
    from: 120,
    to: 0,
  });

  // Fade out near end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = interpolate(frame, [0, 6], [0, 1], {
    extrapolateRight: "clamp",
  }) * fadeOut;

  const verticalPosition: Record<string, string> = {
    top:    "18%",
    center: "45%",
    bottom: "72%",
  };

  return (
    <div
      style={{
        position: "absolute",
        top: verticalPosition[position] || "18%",
        right: 0,
        transform: `translateX(${slideIn}px)`,
        opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: 40,
        width: "100%",
      }}
    >
      <div
        style={{
          background: "rgba(10,10,10,0.88)",
          border: `3px solid ${brandColor}`,
          borderRadius: 16,
          padding: "16px 28px",
          maxWidth: "70%",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Accent dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: brandColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: 40,
            color: "#FFFFFF",
            direction: "rtl",
            lineHeight: 1.3,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
