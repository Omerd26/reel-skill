/**
 * BlurReveal — a row of N small items above the speaker's head. All start
 * blurred + dimmed; each one sharpens (blur→0, opacity→1, with a pop) at its
 * cue time as the speaker discusses it, and stays sharp afterwards. By the end
 * all N read clearly. Kept small + high so it never covers the face.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { FONTS, RADIUS, easeFn } from "../../design/tokens";
import { TemplateIcon } from "./icons";
import type { BlurRevealTemplate } from "./types";

const FRAME_W = 1080;

interface Props {
  template: BlurRevealTemplate;
  total_duration_sec: number;
}

export const BlurReveal: React.FC<Props> = ({ template }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const accent = template.accent_color;
  const rtl = template.rtl ?? true;
  const numbered = template.numbered ?? true;
  const rowY = template.row_y ?? 150;
  const items = template.items;
  const n = items.length;

  const rowInTop = interpolate(frame, [0, Math.round(0.5 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("glass-rise"),
  });

  // ── Column layout — ranked leaderboard pills stacked vertically ────────────
  if (template.layout === "column") {
    const colX = template.col_x ?? 50;
    const colTop = template.col_top ?? 220;
    const colW = template.col_w ?? 540;
    const colH = template.col_h ?? 108;
    const gap = template.col_gap ?? 14;
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {template.title && (
          <div
            style={{
              position: "absolute",
              top: template.title_y ?? 110,
              left: colX,
              width: colW,
              textAlign: "center",
              direction: rtl ? "rtl" : "ltr",
              opacity: rowInTop,
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontFamily: FONTS.display,
                fontSize: 48,
                fontWeight: 900,
                color: "#fff",
                background: accent,
                padding: "12px 26px",
                borderRadius: RADIUS.md,
                letterSpacing: "-0.02em",
                boxShadow: `0 8px 24px ${accent}66, 0 4px 14px rgba(0,0,0,0.5)`,
              }}
            >
              {template.title}
            </span>
          </div>
        )}
        {items.map((item, i) => (
          <ColumnPill
            key={item.id}
            item={item}
            number={numbered ? item.number ?? i + 1 : undefined}
            x={colX}
            y={colTop + i * (colH + gap)}
            w={colW}
            h={colH}
            accent={accent}
            rtl={rtl}
            rowIn={rowInTop}
            fps={fps}
            frame={frame}
          />
        ))}
      </AbsoluteFill>
    );
  }

  // Row geometry — fit N cells centered, inset from the edges.
  const CELL_W = 234;
  const GAP = 16;
  const rowW = n * CELL_W + (n - 1) * GAP;
  const startX = (FRAME_W - rowW) / 2;

  const cellX = (i: number) => {
    const visualIndex = rtl ? n - 1 - i : i; // item 0 sits at the right in RTL
    return startX + visualIndex * (CELL_W + GAP);
  };

  // Whole-row gentle entrance (fade the blurred placeholders in at the very
  // start so they don't pop from nothing).
  const rowIn = interpolate(frame, [0, Math.round(0.5 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("glass-rise"),
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {items.map((item, i) => (
        <BlurCell
          key={item.id}
          item={item}
          number={numbered ? item.number ?? i + 1 : undefined}
          x={cellX(i)}
          y={rowY}
          cellW={CELL_W}
          accent={accent}
          rtl={rtl}
          rowIn={rowIn}
          fps={fps}
          frame={frame}
        />
      ))}
    </AbsoluteFill>
  );
};

const BlurCell: React.FC<{
  item: BlurRevealTemplate["items"][number];
  number?: number;
  x: number;
  y: number;
  cellW: number;
  accent: string;
  rtl: boolean;
  rowIn: number;
  fps: number;
  frame: number;
}> = ({ item, number, x, y, cellW, accent, rtl, rowIn, fps, frame }) => {
  const revealF = Math.round(item.reveal_at * fps);
  const dur = Math.round(0.45 * fps);
  const local = frame - revealF;

  // reveal progress 0 (blurred) → 1 (sharp)
  const r = interpolate(local, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });

  const blurPx = (1 - r) * 11;        // 11px blurred → 0 sharp
  const contentOp = (0.65 + 0.35 * r);      // blurred contents are still legible
  const pop = 1 + 0.14 * Math.max(0, Math.sin(Math.min(1, Math.max(0, local / dur)) * Math.PI)); // brief pop during reveal
  const cellScale = (r < 1 ? 0.94 + 0.06 * r : 1) * (r >= 1 ? 1 : pop);

  const ICON_D = 88;
  const CARD_H = 150;

  return (
    <div
      style={{
        position: "absolute",
        top: y - 14,
        left: x,
        width: cellW,
        height: CARD_H,
        opacity: rowIn,
        transform: `scale(${cellScale.toFixed(3)})`,
        willChange: "transform, opacity",
      }}
    >
      {/* Crisp dark backing — stays sharp so the blurred contents always read
          against bright backgrounds. Brightens slightly once revealed. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          background: r > 0.5 ? "rgba(11,12,16,0.82)" : "rgba(11,12,16,0.66)",
          border: `2px solid ${r > 0.5 ? accent : "rgba(255,255,255,0.12)"}`,
          boxShadow: r > 0.5 ? `0 0 22px ${accent}66, 0 8px 20px rgba(0,0,0,0.5)` : "0 8px 18px rgba(0,0,0,0.45)",
        }}
      />

      {/* Blurred-until-revealed contents */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: contentOp,
          filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : "none",
          willChange: "filter, opacity",
        }}
      >
        <div
          style={{
            width: ICON_D,
            height: ICON_D,
            borderRadius: "50%",
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 12px rgba(0,0,0,0.5)`,
            border: "3px solid rgba(255,255,255,0.28)",
          }}
        >
          <TemplateIcon id={item.icon} size={48} color="#fff" strokeWidth={2.6} mode="stroke" />
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 24,
            fontWeight: 900,
            color: "#fff",
            textAlign: "center",
            lineHeight: 1.1,
            direction: rtl ? "rtl" : "ltr",
            textShadow: "0 2px 6px rgba(0,0,0,0.7)",
            padding: "0 6px",
          }}
        >
          {item.label}
        </div>
      </div>

      {/* Number badge — always crisp on top */}
      {number != null && (
        <div
          style={{
            position: "absolute",
            top: -12,
            [rtl ? "right" : "left"]: -12,
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "#fff",
            color: accent,
            border: `3px solid ${accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.display,
            fontSize: 22,
            fontWeight: 900,
            boxShadow: "0 3px 10px rgba(0,0,0,0.45)",
            opacity: rowIn,
          }}
        >
          {number}
        </div>
      )}
    </div>
  );
};

// ── Column pill — ranked leaderboard row, blurred until revealed ────────────

const ColumnPill: React.FC<{
  item: BlurRevealTemplate["items"][number];
  number?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  accent: string;
  rtl: boolean;
  rowIn: number;
  fps: number;
  frame: number;
}> = ({ item, number, x, y, w, h, accent, rtl, rowIn, fps, frame }) => {
  const revealF = Math.round(item.reveal_at * fps);
  const dur = Math.round(0.45 * fps);
  const local = frame - revealF;
  const r = interpolate(local, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });
  const blurPx = (1 - r) * 11;
  const contentOp = 0.62 + 0.38 * r;
  const pop = 1 + 0.06 * Math.max(0, Math.sin(Math.min(1, Math.max(0, local / dur)) * Math.PI));
  const cellScale = (r < 1 ? 0.97 + 0.03 * r : 1) * (r >= 1 ? 1 : pop);
  const ICON_D = h - 28;
  const NUM_D = h - 34;

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        width: w,
        height: h,
        opacity: rowIn,
        transform: `scale(${cellScale.toFixed(3)})`,
        transformOrigin: rtl ? "right center" : "left center",
        willChange: "transform, opacity",
      }}
    >
      {/* Crisp dark backing (stays sharp so blurred contents read) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 20,
          background: r > 0.5 ? "rgba(11,12,16,0.9)" : "rgba(11,12,16,0.7)",
          border: `2px solid ${r > 0.5 ? accent : "rgba(255,255,255,0.12)"}`,
          boxShadow: r > 0.5 ? `0 0 20px ${accent}55, 0 8px 20px rgba(0,0,0,0.5)` : "0 8px 18px rgba(0,0,0,0.45)",
        }}
      />
      {/* Rank number — always crisp, on the leading edge */}
      {number != null && (
        <div
          style={{
            position: "absolute",
            top: (h - NUM_D) / 2,
            [rtl ? "right" : "left"]: 14,
            width: NUM_D,
            height: NUM_D,
            borderRadius: 14,
            background: accent,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.display,
            fontSize: NUM_D * 0.55,
            fontWeight: 900,
            boxShadow: `0 4px 12px ${accent}88`,
          }}
        >
          {number}
        </div>
      )}
      {/* Blurred-until-revealed contents (icon + label) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          [rtl ? "right" : "left"]: 14 + NUM_D + 16,
          [rtl ? "left" : "right"]: 18,
          display: "flex",
          flexDirection: rtl ? "row-reverse" : "row",
          alignItems: "center",
          gap: 16,
          opacity: contentOp,
          filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : "none",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: ICON_D,
            height: ICON_D,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: `2px solid ${accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TemplateIcon id={item.icon} size={ICON_D * 0.56} color="#fff" strokeWidth={2.6} mode="stroke" />
        </div>
        <div
          style={{
            flex: 1,
            fontFamily: FONTS.display,
            fontSize: 34,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.01em",
            lineHeight: 1.05,
            textAlign: rtl ? "right" : "left",
            textShadow: "0 2px 6px rgba(0,0,0,0.7)",
          }}
        >
          {item.label}
        </div>
      </div>
    </div>
  );
};
