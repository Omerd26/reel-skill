import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface LowerThirdProps {
  title: string;
  subtitle?: string;
  brandColor?: string;
}

export const LowerThird: React.FC<LowerThirdProps> = ({
  title,
  subtitle = "",
  brandColor = "#E0701E",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Slide up from bottom
  const slideUp = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
    from: 80,
    to: 0,
  });

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames - 3],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  }) * fadeOut;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "14%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "flex-end",
        paddingRight: 50,
        transform: `translateY(${slideUp}px)`,
        opacity,
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "stretch" }}>
        {/* Orange accent bar */}
        <div
          style={{
            width: 6,
            borderRadius: "3px 0 0 3px",
            backgroundColor: brandColor,
            marginRight: 0,
          }}
        />
        {/* Text block */}
        <div
          style={{
            background: "rgba(0,0,0,0.82)",
            padding: "14px 24px 14px 20px",
            borderRadius: "0 10px 10px 0",
            direction: "rtl",
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 44,
              color: "#FFFFFF",
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 400,
                fontSize: 30,
                color: brandColor,
                marginTop: 4,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
