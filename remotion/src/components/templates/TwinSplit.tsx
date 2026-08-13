/**
 * TwinSplit — duplicate-clone / "good vs bad" narrative template.
 *
 * The footage shows the same person duplicated left + right (a "twins" cut).
 * Each side gets:
 *   - a persistent headline above the person (left vs right color)
 *   - a stream of icons that swap above the head as the speaker lists
 *     what each side does
 *
 * Icons crossfade — the most recent cue for a side is the active icon. The
 * previous one fades out as the new one fades in.
 *
 * Layout reference (1080×1920):
 *   - Left column anchors at x≈270 (quarter from frame left)
 *   - Right column anchors at x≈810 (quarter from frame right)
 *   - Headline band sits at y=60–200 (above ceiling area)
 *   - Icon zone at y=240–400 (just above the heads which sit ~y=400+)
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { useEntrance } from "../overlays/motion";
import { FONTS, easeFn } from "../../design/tokens";
import { TemplateIcon } from "./icons";
import type { TwinSplitTemplate, TwinIconCue } from "./types";

const FRAME_W = 1080;

interface Props {
  template: TwinSplitTemplate;
  total_duration_sec: number;
}

export const TwinSplit: React.FC<Props> = ({ template }) => {
  const { fps } = useVideoConfig();
  const rtl = template.rtl ?? true;

  // Per-shot configurable geometry (defaults match the original seated shot).
  const leftX = template.left_cx ?? 270;
  const rightX = template.right_cx ?? FRAME_W - 270;
  const headlineY = template.headline_y ?? 500;
  const headerSize = template.header_size ?? 44;
  const iconY = template.icon_y ?? 640;
  const iconSize = template.icon_size ?? 150;

  const leftEntrance = useEntrance({
    signature: "stack-cascade",
    durationSec: 0.5,
    offsetFrames: 0,
  });
  const rightEntrance = useEntrance({
    signature: "stack-cascade",
    durationSec: 0.5,
    offsetFrames: Math.round(0.12 * fps),
  });

  const cuesBySide = splitCues(template.icons || []);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Left headline */}
      <HeadlineBlock
        text={template.left_label}
        color={template.left_color}
        centerX={leftX}
        top={headlineY}
        fontSize={headerSize}
        style={leftEntrance}
        rtl={rtl}
      />

      {/* Right headline */}
      <HeadlineBlock
        text={template.right_label}
        color={template.right_color}
        centerX={rightX}
        top={headlineY}
        fontSize={headerSize}
        style={rightEntrance}
        rtl={rtl}
      />

      {/* Icon streams */}
      <IconStream cues={cuesBySide.left} centerX={leftX} iconY={iconY} iconSize={iconSize} color={template.left_color} fps={fps} rtl={rtl} />
      <IconStream cues={cuesBySide.right} centerX={rightX} iconY={iconY} iconSize={iconSize} color={template.right_color} fps={fps} rtl={rtl} />
    </AbsoluteFill>
  );
};

// ── Persistent side headline ─────────────────────────────────────────────────

const HeadlineBlock: React.FC<{
  text: string;
  color: string;
  centerX: number;
  top: number;
  fontSize: number;
  style: React.CSSProperties;
  rtl: boolean;
}> = ({ text, color, centerX, top, fontSize, style, rtl }) => {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: centerX - 240,
        width: 480,
        textAlign: "center",
        direction: rtl ? "rtl" : "ltr",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize,
          fontWeight: 900,
          color,
          letterSpacing: "-0.015em",
          lineHeight: 1.08,
          textShadow: `0 0 18px ${color}66, 0 4px 14px rgba(0,0,0,0.7)`,
          WebkitTextStroke: "0.8px rgba(0,0,0,0.4)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ── Icon stream — crossfade per side ────────────────────────────────────────

const IconStream: React.FC<{
  cues: TwinIconCue[];
  centerX: number;
  iconY: number;
  iconSize: number;
  color: string;
  fps: number;
  rtl: boolean;
}> = ({ cues, centerX, iconY, iconSize, color, fps, rtl }) => {
  const frame = useCurrentFrame();

  if (cues.length === 0) return null;

  return (
    <>
      {cues.map((cue, i) => {
        const appearF = Math.round(cue.appear_at * fps);
        const nextAppearF =
          i + 1 < cues.length ? Math.round(cues[i + 1].appear_at * fps) : Infinity;

        // Fade in over 0.32s, hold, fade out over 0.32s starting just before the
        // next cue takes over.
        const fadeFrames = Math.round(0.32 * fps);
        const local = frame - appearF;
        if (local < -fadeFrames) return null;
        if (frame > nextAppearF + fadeFrames) return null;

        const fadeIn = interpolate(local, [0, fadeFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeFn("bounce-soft"),
        });
        const fadeOut =
          nextAppearF === Infinity
            ? 1
            : interpolate(
                frame,
                [nextAppearF - 4, nextAppearF + fadeFrames],
                [1, 0],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: easeFn("glass-rise"),
                },
              );
        const opacity = Math.min(fadeIn, fadeOut);
        const scale = 0.7 + 0.3 * fadeIn;

        return (
          <div
            key={cue.id || `${i}-${cue.icon}`}
            style={{
              position: "absolute",
              top: iconY,
              left: centerX - iconSize / 2 - 20,
              width: iconSize + 40,
              height: iconSize + (cue.label ? 70 : 0),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              opacity,
              transform: `scale(${scale})`,
              willChange: "transform, opacity",
            }}
          >
            {/* Soft glow halo behind the icon for legibility against varied bg */}
            <div
              style={{
                position: "absolute",
                top: 0,
                width: iconSize,
                height: iconSize,
                borderRadius: "50%",
                background: `radial-gradient(circle at 50% 50%, ${color}55 0%, ${color}00 70%)`,
                filter: "blur(4px)",
              }}
            />
            <TemplateIcon
              id={cue.icon}
              size={iconSize}
              color={color}
              strokeWidth={3.0}
              mode="stroke"
              style={{
                position: "relative",
                filter: `drop-shadow(0 4px 14px rgba(0,0,0,0.7)) drop-shadow(0 0 12px ${color}66)`,
              }}
            />
            {cue.label && (
              <div
                style={{
                  position: "relative",
                  marginTop: 8,
                  fontFamily: FONTS.display,
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                  textAlign: "center",
                  direction: rtl ? "rtl" : "ltr",
                  textShadow: `0 0 14px ${color}88, 0 3px 10px rgba(0,0,0,0.75)`,
                  whiteSpace: "nowrap",
                }}
              >
                {cue.label}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

function splitCues(cues: TwinIconCue[]): { left: TwinIconCue[]; right: TwinIconCue[] } {
  const left: TwinIconCue[] = [];
  const right: TwinIconCue[] = [];
  for (const c of cues) {
    if (c.side === "left") left.push(c);
    else right.push(c);
  }
  left.sort((a, b) => a.appear_at - b.appear_at);
  right.sort((a, b) => a.appear_at - b.appear_at);
  return { left, right };
}
