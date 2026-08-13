/**
 * FlagCompare — two-column "do / don't" comparison board.
 *
 * Layout reference (@personalbrandlaunch "RED FLAG vs GREEN FLAG"):
 *   - Two headers at the top (left = bad/red, right = good/green) with a flag
 *   - A dashed vertical divider down the middle
 *   - Each column is a stack of [icon + label] rows
 *   - Rows rise UP from below into their slot as the speaker names them, each
 *     with a sound effect (the SFX is fired by the composition, not here)
 *
 * Sits in the UPPER area of a 1080×1920 frame so a speaker seated lower in the
 * shot stays clear. Columns are inset from the edges for Instagram safe zones.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { useEntrance } from "../overlays/motion";
import { FONTS, RADIUS, easeFn } from "../../design/tokens";
import { TemplateIcon } from "./icons";
import type { FlagCompareTemplate, FlagItem, ItemTiming } from "./types";

const FRAME_W = 1080;
const DIVIDER_X = 540;

// Column centers (inset from edges for IG safe zones).
const LEFT_CX = 290;
const RIGHT_CX = 790;

// Item stack geometry — upper area, above a lower-seated speaker.
const ITEMS_TOP = 300;
const ROW_STEP = 116;
const PILL_W = 440;

interface Props {
  template: FlagCompareTemplate;
  total_duration_sec: number;
}

export const FlagCompare: React.FC<Props> = ({ template }) => {
  const { fps } = useVideoConfig();
  const rtl = template.rtl ?? true;

  const timing = new Map<string, number>();
  for (const t of template.timing || []) timing.set(t.id, t.appear_at);

  const leftEntrance = useEntrance({ signature: "stack-cascade", durationSec: 0.5, offsetFrames: 0 });
  const rightEntrance = useEntrance({ signature: "stack-cascade", durationSec: 0.5, offsetFrames: Math.round(0.1 * fps) });

  // Divider spans from below the headers down past the longest column.
  const maxRows = Math.max(template.left_items.length, template.right_items.length);
  const dividerTop = 230;
  const dividerBottom = ITEMS_TOP + maxRows * ROW_STEP - 30;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Optional eyebrow */}
      {template.title && (
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 0,
            right: 0,
            textAlign: "center",
            ...leftEntrance,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 34,
              fontWeight: 800,
              color: "#1A1A1A",
              background: "rgba(255,255,255,0.92)",
              padding: "8px 20px",
              borderRadius: RADIUS.sm,
              letterSpacing: "-0.01em",
            }}
          >
            {template.title}
          </span>
        </div>
      )}

      {/* Headers */}
      <Header
        text={template.left_label}
        flag={template.left_flag}
        color={template.left_color}
        centerX={LEFT_CX}
        rtl={rtl}
        style={leftEntrance}
      />
      <Header
        text={template.right_label}
        flag={template.right_flag}
        color={template.right_color}
        centerX={RIGHT_CX}
        rtl={rtl}
        style={rightEntrance}
      />

      {/* Dashed divider */}
      <div
        style={{
          position: "absolute",
          left: DIVIDER_X - 2,
          top: dividerTop,
          width: 4,
          height: dividerBottom - dividerTop,
          borderLeft: "5px dashed rgba(255,255,255,0.9)",
          ...rightEntrance,
        }}
      />

      {/* Left column rows */}
      {template.left_items.map((item, i) => (
        <Pill
          key={`L-${item.id}`}
          item={item}
          color={template.left_color}
          centerX={LEFT_CX}
          y={ITEMS_TOP + i * ROW_STEP}
          appearSec={timing.get(item.id) ?? 0}
          rtl={rtl}
          fps={fps}
        />
      ))}

      {/* Right column rows */}
      {template.right_items.map((item, i) => (
        <Pill
          key={`R-${item.id}`}
          item={item}
          color={template.right_color}
          centerX={RIGHT_CX}
          y={ITEMS_TOP + i * ROW_STEP}
          appearSec={timing.get(item.id) ?? 0}
          rtl={rtl}
          fps={fps}
        />
      ))}
    </AbsoluteFill>
  );
};

const Header: React.FC<{
  text: string;
  flag?: string;
  color: string;
  centerX: number;
  rtl: boolean;
  style: React.CSSProperties;
}> = ({ text, flag, color, centerX, rtl, style }) => (
  <div
    style={{
      position: "absolute",
      top: 120,
      left: centerX - 230,
      width: 460,
      textAlign: "center",
      direction: rtl ? "rtl" : "ltr",
      ...style,
    }}
  >
    <span
      style={{
        fontFamily: FONTS.display,
        fontSize: 60,
        fontWeight: 900,
        color,
        letterSpacing: "-0.02em",
        WebkitTextStroke: "1.5px rgba(0,0,0,0.35)",
        textShadow: "0 0 14px rgba(255,255,255,0.85), 0 4px 14px rgba(0,0,0,0.4)",
      }}
    >
      {text}
      {flag ? ` ${flag}` : ""}
    </span>
  </div>
);

const Pill: React.FC<{
  item: FlagItem;
  color: string;
  centerX: number;
  y: number;
  appearSec: number;
  rtl: boolean;
  fps: number;
}> = ({ item, color, centerX, y, appearSec, rtl, fps }) => {
  const frame = useCurrentFrame();
  const appearF = Math.round(appearSec * fps);
  const local = frame - appearF;
  if (local < -1) return null;

  const dur = Math.round(0.42 * fps);
  const t = interpolate(local, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });
  // Rises up from below into its slot.
  const dy = (1 - t) * 110;

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: centerX - PILL_W / 2,
        width: PILL_W,
        height: 88,
        display: "flex",
        flexDirection: rtl ? "row-reverse" : "row",
        alignItems: "center",
        gap: 16,
        padding: "0 20px",
        background: "rgba(14,15,20,0.86)",
        border: `2px solid ${color}`,
        borderRadius: RADIUS.md,
        boxShadow: `0 8px 22px rgba(0,0,0,0.5), 0 0 16px ${color}44`,
        opacity: t,
        transform: `translateY(${dy.toFixed(1)}px)`,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        <TemplateIcon id={item.icon} size={48} color={color} strokeWidth={2.6} mode="stroke" />
      </div>
      <div
        style={{
          flex: 1,
          fontFamily: FONTS.display,
          fontSize: 28,
          fontWeight: 800,
          color: "#FFFFFF",
          letterSpacing: "-0.01em",
          lineHeight: 1.05,
          textAlign: rtl ? "right" : "left",
        }}
      >
        {item.label}
      </div>
    </div>
  );
};
