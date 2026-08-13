/**
 * DecisionCards — horizontal quality-verdict template.
 *
 * Layout reference: 3 large colored icons across the top of the frame,
 * each with a matching colored label below and an optional ✓/✗ badge in
 * the corner. The talking-head speaker sits in the lower half of the frame
 * (face fully visible) while the icons + labels make the visual argument.
 *
 * Each card carries its own color — the icon, label glow, and badge all
 * render in that color so the eye reads each card as one cohesive unit.
 *
 * Animation:
 *   1. Optional title slides up first
 *   2. Cards stagger in from left-to-right (or RTL right-to-left): each
 *      icon scales from 0.6 with a bounce-soft easing and a colored glow
 *   3. Label fades in 120ms after its icon
 *   4. Verdict badge pops in 200ms after the label
 *   5. Crown (if any) drops down on top with a bounce
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { useEntrance } from "../overlays/motion";
import { FONTS, RADIUS, easeFn } from "../../design/tokens";
import { TemplateIcon } from "./icons";
import type { DecisionCardsTemplate, DecisionCard, ItemTiming } from "./types";

const FRAME_W = 1080;
const FRAME_H = 1920;

interface Props {
  template: DecisionCardsTemplate;
  total_duration_sec: number;
}

export const DecisionCards: React.FC<Props> = ({ template, total_duration_sec }) => {
  const { fps } = useVideoConfig();
  const rtl = template.rtl ?? true;
  const accent = template.accent_color || "#FFFFFF";
  const cards = template.cards;
  const style = template.style ?? "filled-glow";

  // Timing: distribute card appearances across the first ~70% of the video
  // (leaves the last 30% to hold the final state for the speaker to wrap up).
  const timing = useResolvedCardTiming(template, total_duration_sec);

  // Title entrance
  const titleEntrance = useEntrance({
    signature: "stack-cascade",
    durationSec: 0.55,
    offsetFrames: 0,
  });

  // Layout math — divide the frame width into N equal cells. Each card
  // centers in its cell. Top of card area at y=300 so the title (if any)
  // sits above without crowding.
  const cellWidth = FRAME_W / cards.length;
  const cardTop = template.title ? 320 : 200;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Optional title */}
      {template.title && (
        <div
          style={{
            position: "absolute",
            top: 110,
            left: 0,
            right: 0,
            textAlign: "center",
            padding: "0 56px",
            direction: rtl ? "rtl" : "ltr",
            ...titleEntrance,
            fontFamily: FONTS.display,
            fontSize: 72,
            fontWeight: 900,
            color: accent,
            letterSpacing: "-0.02em",
            lineHeight: 1.0,
            textShadow: `0 0 28px ${accent}55, 0 4px 16px rgba(0,0,0,0.65)`,
          }}
        >
          {template.title}
        </div>
      )}

      {/* Cards row — visual order matches the array order (BAD→OK→GREAT
          left-to-right), independent of RTL. RTL only governs text direction
          inside each card (used by the Hebrew label rendering). */}
      {cards.map((card, i) => {
        const x = i * cellWidth;
        return (
          <DecisionCardSlot
            key={`card-${card.id}-${i}`}
            card={card}
            x={x}
            y={cardTop}
            width={cellWidth}
            appearAtSec={timing.get(card.id) ?? 0}
            fps={fps}
            style={style}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ── A single card ────────────────────────────────────────────────────────────

interface CardSlotProps {
  card: DecisionCard;
  x: number;
  y: number;
  width: number;
  appearAtSec: number;
  fps: number;
  style: NonNullable<DecisionCardsTemplate["style"]>;
}

const DecisionCardSlot: React.FC<CardSlotProps> = ({
  card,
  x,
  y,
  width,
  appearAtSec,
  fps,
  style,
}) => {
  const frame = useCurrentFrame();
  const appearFrame = Math.round(appearAtSec * fps);
  const localFrame = frame - appearFrame;
  if (localFrame < -1) return null;

  // Icon pop-in: scale + opacity with bounce
  const iconDur = 0.5;
  const iconT = interpolate(localFrame, [0, fps * iconDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });
  const iconScale = 0.55 + 0.45 * iconT;

  // Label fade-in (delayed 120ms after icon)
  const labelOffset = Math.round(0.12 * fps);
  const labelT = interpolate(
    localFrame - labelOffset,
    [0, fps * 0.35],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("confident"),
    },
  );

  // Badge pop-in (delayed 200ms after label)
  const badgeOffset = labelOffset + Math.round(0.20 * fps);
  const badgeT = interpolate(
    localFrame - badgeOffset,
    [0, fps * 0.35],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("bounce-firm"),
    },
  );

  // Crown drop (delayed 60ms after icon)
  const crownOffset = Math.round(0.06 * fps);
  const crownT = interpolate(
    localFrame - crownOffset,
    [0, fps * 0.45],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("bounce-firm"),
    },
  );

  const ICON_SIZE = 240;
  const glowSize = ICON_SIZE * iconScale * 1.3;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height: 700,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        pointerEvents: "none",
      }}
    >
      {/* Crown — optional, drops in from above */}
      {card.show_crown && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: `translateX(-50%) translateY(${(1 - crownT) * -40}px) scale(${0.7 + 0.3 * crownT})`,
            opacity: crownT,
            color: card.color,
            filter: `drop-shadow(0 0 12px ${card.color}88) drop-shadow(0 4px 8px rgba(0,0,0,0.4))`,
          }}
        >
          <TemplateIcon id="crown" size={88} color={card.color} strokeWidth={3} mode="filled" />
        </div>
      )}

      {/* Icon halo glow — behind icon */}
      {style === "filled-glow" && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 100,
            left: "50%",
            transform: `translateX(-50%) scale(${iconScale})`,
            width: glowSize,
            height: glowSize,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${card.color}66 0%, ${card.color}22 35%, transparent 65%)`,
            opacity: iconT * 0.85,
            filter: "blur(8px)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Icon — colored to card.color, BIG */}
      <div
        style={{
          position: "relative",
          marginTop: 100,
          transform: `scale(${iconScale})`,
          opacity: iconT,
          filter: style === "filled-glow"
            ? `drop-shadow(0 0 14px ${card.color}aa) drop-shadow(0 8px 16px rgba(0,0,0,0.5))`
            : `drop-shadow(0 6px 12px rgba(0,0,0,0.5))`,
          willChange: "transform, opacity",
        }}
      >
        <TemplateIcon
          id={card.icon}
          size={ICON_SIZE}
          color={card.color}
          strokeWidth={style === "outlined-soft" ? 2.4 : 3.4}
          mode={style === "flat" ? "filled" : "stroke"}
        />
        {/* Verdict badge — bottom-right of icon */}
        {card.verdict && card.verdict !== "neutral" && (
          <div
            style={{
              position: "absolute",
              bottom: -8,
              right: -10,
              width: 78,
              height: 78,
              borderRadius: "50%",
              background: card.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${0.5 + 0.5 * badgeT})`,
              opacity: badgeT,
              boxShadow: `0 0 16px ${card.color}aa, 0 4px 12px rgba(0,0,0,0.5)`,
              border: "3px solid rgba(255,255,255,0.95)",
            }}
          >
            <TemplateIcon
              id={card.verdict === "good" ? "checkmark" : "cross"}
              size={42}
              color="#FFFFFF"
              strokeWidth={4}
            />
          </div>
        )}
      </div>

      {/* Label — colored, bold, sits below the icon */}
      <div
        style={{
          marginTop: 24,
          opacity: labelT,
          transform: `translateY(${(1 - labelT) * 16}px)`,
          textAlign: "center",
          fontFamily: FONTS.display,
          fontSize: 78,
          fontWeight: 900,
          color: card.color,
          letterSpacing: "-0.02em",
          lineHeight: 1.0,
          textShadow: `0 0 24px ${card.color}66, 0 4px 12px rgba(0,0,0,0.7)`,
          padding: "0 12px",
          whiteSpace: "nowrap",
        }}
      >
        {card.label}
      </div>
    </div>
  );
};

// ── Timing resolution ────────────────────────────────────────────────────────

function useResolvedCardTiming(
  template: DecisionCardsTemplate,
  total_duration_sec: number,
): Map<string, number> {
  const out = new Map<string, number>();
  const explicit = new Map<string, ItemTiming>();
  for (const t of template.timing || []) explicit.set(t.id, t);

  if (!template.cards.length) return out;

  // Distribute cards across the first 70% of the timeline so the final
  // state holds for ~30% (gives the speaker breathing room).
  const startBudget = template.title ? 0.9 : 0.4;
  const endSec = Math.max(startBudget + 1, total_duration_sec * 0.7);
  const step = (endSec - startBudget) / Math.max(1, template.cards.length);

  template.cards.forEach((card, i) => {
    if (explicit.has(card.id)) {
      out.set(card.id, explicit.get(card.id)!.appear_at);
    } else {
      out.set(card.id, startBudget + i * step);
    }
  });

  return out;
}
