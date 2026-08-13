/**
 * TierRating — rating/tier-list video template.
 *
 * Layout reference (matches the @yuval.perez Hebrew tier board screenshot):
 *   - Title floats centered above the board
 *   - Board is a 2-column grid: left column = tier label cells (colored),
 *     right column = item cells (dark, with bold white SVG icons)
 *   - Rows stack vertically: best tier (top) → worst (bottom)
 *   - Icons pop into the correct row as the speaker mentions each one
 *
 * Sizes are dialed for 1080×1920 vertical with the speaker visible. Board
 * anchors at top:480 by default — the title sits above the speaker's head,
 * and the board covers the lower body (which is fine for talking-head Reels).
 */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { useEntrance } from "../overlays/motion";
import { FONTS, RADIUS, easeFn } from "../../design/tokens";
import { TemplateIcon } from "./icons";
import type { TierRatingTemplate, TierItem, ItemTiming } from "./types";

const FRAME_W = 1080;

interface Props {
  template: TierRatingTemplate;
  total_duration_sec: number;
}

export const TierRating: React.FC<Props> = (props) => {
  const layout = props.template.layout ?? "bottom-board";
  if (layout === "right-panel") return <TierRightPanel {...props} />;
  if (layout === "top-strip") return <TierTopStrip {...props} />;
  return <TierBottomBoard {...props} />;
};

const TierBottomBoard: React.FC<Props> = ({ template, total_duration_sec }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const rtl = template.rtl ?? true; // Hebrew default
  const accent = template.accent_color || "#00B7C9";
  const opaque = template.opaque ?? false;

  // Title — appears first
  const titleEntrance = useEntrance({
    signature: "stack-cascade",
    durationSec: 0.55,
    offsetFrames: 0,
  });

  // Compute item timings: explicit overrides win, otherwise distribute evenly
  // across the available window after the board materializes.
  const timing = useResolvedTiming(template, total_duration_sec);

  // Two-phase staging timing (optional): when an item has `mention_at`, its
  // name floats above the board until it drops in at `appear_at`.
  const stageTiming = new Map<string, TwoPhaseTiming>();
  for (const t of template.timing || []) {
    if (t.mention_at !== undefined) {
      stageTiming.set(t.id, { mention: t.mention_at, place: t.appear_at });
    }
  }

  // Board dimensions & placement — sits low enough that the speaker's neck +
  // upper chest stay visible above the board. The board stretches from BOARD_Y
  // all the way to the bottom of the frame, so rows divide that space evenly.
  const FRAME_H = 1920;
  const BOARD_X = 0;
  const BOARD_Y = 1300;
  const BOARD_W = FRAME_W;
  const BOARD_H = FRAME_H - BOARD_Y;
  const ROW_H = BOARD_H / Math.max(1, template.ratings.length);
  const LABEL_COL_W = 130;

  // Board entrance — slides up after title
  const boardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.5,
    offsetFrames: Math.round(0.25 * fps),
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Title block — sits just above the speaker's head */}
      {template.title && (
        <div
          style={{
            position: "absolute",
            top: 330,
            left: 0,
            right: 0,
            textAlign: "center",
            padding: "0 50px",
            direction: rtl ? "rtl" : "ltr",
            ...titleEntrance,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: template.title.length > 16 ? 82 : 100,
              fontWeight: 900,
              color: accent,
              letterSpacing: "-0.02em",
              lineHeight: 1.0,
              // Thicker letters + a bright halo so the dark-blue title reads
              // crisply against the busy ceiling/whiteboard behind it.
              WebkitTextStroke: `1.5px ${accent}`,
              textShadow:
                "0 0 16px rgba(255,255,255,0.95), 0 0 34px rgba(255,255,255,0.75), 0 6px 18px rgba(0,0,0,0.45)",
            }}
          >
            {template.title}
          </div>
        </div>
      )}

      {/* Tier board */}
      <div
        style={{
          position: "absolute",
          top: BOARD_Y,
          left: BOARD_X,
          width: BOARD_W,
          height: BOARD_H,
          ...boardEntrance,
          background: opaque ? "#0B0C10" : "transparent",
          borderRadius: `${RADIUS.lg}px ${RADIUS.lg}px 0 0`,
          overflow: "hidden",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.55)",
        }}
      >
        {template.ratings.map((row, rowIdx) => (
          <TierRowBlock
            key={`row-${rowIdx}-${row.label}`}
            row={row}
            rowIndex={rowIdx}
            labelColW={LABEL_COL_W}
            rowH={ROW_H}
            timing={timing}
            accent={accent}
            iconStyle={template.icon_style ?? "bold-white"}
            tableStyle={template.table_style ?? "dark"}
            opaque={opaque}
            rtl={rtl}
            fps={fps}
          />
        ))}
      </div>

      {/* Staging chips — names that float above the board before dropping in */}
      {[...stageTiming.entries()].map(([id, tt]) => {
        const item = findItem(template, id);
        if (!item) return null;
        return (
          <StagingChip
            key={`stage-${id}`}
            label={item.label || id}
            mentionSec={tt.mention}
            placeSec={tt.place}
            centerX={FRAME_W / 2}
            y={BOARD_Y - 150}
            accent={accent}
            fps={fps}
            frame={frame}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ── A single tier row ────────────────────────────────────────────────────────

interface RowProps {
  row: TierRatingTemplate["ratings"][number];
  rowIndex: number;
  labelColW: number;
  rowH: number;
  timing: Map<string, number>;
  accent: string;
  iconStyle: NonNullable<TierRatingTemplate["icon_style"]>;
  tableStyle: NonNullable<TierRatingTemplate["table_style"]>;
  opaque: boolean;
  rtl: boolean;
  fps: number;
}

const TierRowBlock: React.FC<RowProps> = ({
  row,
  rowIndex,
  labelColW,
  rowH,
  timing,
  accent,
  iconStyle,
  tableStyle,
  opaque,
  rtl,
  fps,
}) => {
  const frame = useCurrentFrame();

  // Row entrance — staggered from top to bottom
  const rowOffset = Math.round((0.35 + rowIndex * 0.06) * fps);
  const localFrame = frame - rowOffset;
  const t = interpolate(localFrame, [0, fps * 0.45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("glass-rise"),
  });

  const dark = tableStyle === "dark";
  const cellBg = opaque
    ? dark
      ? "#0F0F12"
      : "#F8F2E4"
    : dark
    ? "rgba(15,15,18,0.94)"
    : tableStyle === "premium-glass"
    ? "rgba(20,20,28,0.65)"
    : "rgba(248,242,228,0.94)";
  const cellBorder = dark ? "rgba(40,40,46,1)" : "rgba(160,140,110,0.25)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: rtl ? "row-reverse" : "row",
        height: rowH,
        opacity: t,
        transform: `translateY(${(1 - t) * 12}px)`,
        borderBottom: `1px solid ${cellBorder}`,
      }}
    >
      {/* Tier label cell — colored, with bold tier text */}
      <div
        style={{
          width: labelColW,
          background: row.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONTS.display,
          fontSize: row.label.length > 2 ? 36 : 52,
          fontWeight: 900,
          color: "#0A0A0A",
          letterSpacing: "-0.01em",
          flexShrink: 0,
        }}
      >
        {row.label}
      </div>

      {/* Items cell — icons pop in by timing */}
      <div
        style={{
          flex: 1,
          background: cellBg,
          display: "flex",
          alignItems: "center",
          gap: 32,
          padding: "0 36px",
          direction: rtl ? "rtl" : "ltr",
          overflow: "hidden",
        }}
      >
        {row.items.map((item, i) => (
          <TierItemIcon
            key={`${row.label}-${item.id}-${i}`}
            item={item}
            appearAtSec={timing.get(item.id) ?? 0}
            accent={accent}
            iconStyle={iconStyle}
            dark={dark}
            fps={fps}
          />
        ))}
      </div>
    </div>
  );
};

// ── A single icon in a tier row ──────────────────────────────────────────────

interface TierItemProps {
  item: TierItem;
  appearAtSec: number;
  accent: string;
  iconStyle: NonNullable<TierRatingTemplate["icon_style"]>;
  dark: boolean;
  fps: number;
}

const TierItemIcon: React.FC<TierItemProps> = ({
  item,
  appearAtSec,
  accent,
  iconStyle,
  dark,
  fps,
}) => {
  const frame = useCurrentFrame();
  const appearFrame = Math.round(appearAtSec * fps);
  const localFrame = frame - appearFrame;
  if (localFrame < -1) return null;

  const dur = 0.35;
  const totalFrames = Math.round(dur * fps);
  const t = interpolate(localFrame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });

  const iconColor = dark ? "#FFFFFF" : "#0A0A0A";
  const textColor = dark ? "#FFFFFF" : "#0A0A0A";

  // Pick the render mode: image > icon > text chip.
  // Text chip mode activates when text_chip=true OR (label is set AND icon is unset AND no image).
  const useImage = !!item.image_url;
  const useTextChip = !useImage && !item.icon && !!item.label;

  const wrapStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    opacity: t,
    transform: `scale(${0.7 + 0.3 * t})`,
    willChange: "transform, opacity",
  };

  if (useImage) {
    // Logo / image chip — fixed-height image, preserves aspect ratio
    const src = item.image_url!.startsWith("http")
      ? item.image_url!
      : staticFile(item.image_url!);
    return (
      <div style={wrapStyle}>
        <Img
          src={src}
          style={{
            height: 80,
            maxWidth: 180,
            width: "auto",
            objectFit: "contain",
            borderRadius: 8,
          }}
        />
      </div>
    );
  }

  if (useTextChip) {
    // Bold text chip — for brand names where an icon would be wrong
    return (
      <div style={wrapStyle}>
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 30,
            fontWeight: 800,
            color: textColor,
            letterSpacing: "-0.01em",
            padding: "8px 18px",
            background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            border: `1.5px solid ${dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)"}`,
            borderRadius: 12,
            whiteSpace: "nowrap",
            textShadow: dark ? "0 2px 8px rgba(0,0,0,0.4)" : "none",
          }}
        >
          {item.label}
        </div>
      </div>
    );
  }

  // Default — icon rendering
  return (
    <div style={wrapStyle}>
      <TemplateIcon
        id={item.icon}
        size={86}
        color={iconColor}
        strokeWidth={iconStyle === "outlined" ? 1.8 : 2.6}
        mode={iconStyle === "filled" ? "filled" : "stroke"}
      />
      {item.label && (
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 18,
            fontWeight: 700,
            color: dark ? "rgba(255,255,255,0.85)" : "rgba(10,10,10,0.85)",
            textAlign: "center",
          }}
        >
          {item.label}
        </div>
      )}
    </div>
  );
};

// ── Timing resolution ────────────────────────────────────────────────────────

/**
 * Returns a Map<item_id, appear_at_sec>. If explicit timings are provided,
 * they win. Otherwise: distribute all items evenly across the window between
 * board entrance (~0.6s) and the last 1s of the video.
 */
function useResolvedTiming(
  template: TierRatingTemplate,
  total_duration_sec: number,
): Map<string, number> {
  const out = new Map<string, number>();
  const explicit = new Map<string, ItemTiming>();
  for (const t of template.timing || []) explicit.set(t.id, t);

  // Collect all items in display order (top tier first, left-to-right)
  const flat: TierItem[] = [];
  for (const row of template.ratings) {
    for (const item of row.items) flat.push(item);
  }

  if (flat.length === 0) return out;

  const startBudget = 0.9; // wait for board + title to be on-screen
  const endBudget = 1.0;
  const startSec = startBudget;
  const endSec = Math.max(startSec + 1, total_duration_sec - endBudget);
  const step = (endSec - startSec) / flat.length;

  flat.forEach((item, i) => {
    if (explicit.has(item.id)) {
      out.set(item.id, explicit.get(item.id)!.appear_at);
    } else {
      out.set(item.id, startSec + i * step);
    }
  });

  return out;
}

// ── Right-panel layout — two-phase (mention → drop) tier board ───────────────
//
// Built for footage where the speaker sits on the LEFT and an off-screen voice
// throws indicator names. Flow per item:
//   1. name floats in a staging slot ABOVE the board (mention_at)
//   2. on the tier decision (appear_at) it drops into its row + a "ding" fires
// The board sits on the right side, fully opaque, clear of the speaker's hands.

interface TwoPhaseTiming {
  mention: number;
  place: number;
}

const TierRightPanel: React.FC<Props> = ({ template, total_duration_sec }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const rtl = template.rtl ?? true;
  const accent = template.accent_color || "#0A3D7C";

  // Two-phase timing per item id
  const timing = new Map<string, TwoPhaseTiming>();
  for (const t of template.timing || []) {
    timing.set(t.id, { mention: t.mention_at ?? t.appear_at, place: t.appear_at });
  }

  // Board geometry — right side of the frame, clear of the left-seated speaker.
  // Many rows (e.g. a 1-8 ranking) use shorter rows + a higher top so the full
  // list fits the frame.
  const rows = template.ratings;
  const manyRows = rows.length >= 7;
  // Right edge inset ~45px so Instagram's action rail doesn't cover the labels.
  // Per-video overrides let the board live elsewhere (e.g. full-width in the
  // upper third) instead of the right side.
  const BOARD_LEFT = template.board_left ?? 470;
  const BOARD_RIGHT = template.board_right ?? 1035;
  const BOARD_TOP = template.board_top ?? (manyRows ? 540 : 600);
  const ROW_H = template.row_h ?? (manyRows ? 116 : 152);
  const LABEL_W = 100;
  const boardW = BOARD_RIGHT - BOARD_LEFT;
  const boardH = rows.length * ROW_H;
  const boardCenterX = (BOARD_LEFT + BOARD_RIGHT) / 2;

  const titleEntrance = useEntrance({
    signature: "stack-cascade",
    durationSec: 0.5,
    offsetFrames: 0,
  });
  const boardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.5,
    offsetFrames: Math.round(0.2 * fps),
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Title pill — solid so it reads over the busy whiteboard */}
      {template.title && (
        <div
          style={{
            position: "absolute",
            top: template.title_y ?? 250,
            left: BOARD_LEFT - 20,
            width: boardW + 40,
            textAlign: "center",
            direction: rtl ? "rtl" : "ltr",
            ...titleEntrance,
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: accent,
              color: "#FFFFFF",
              fontFamily: FONTS.display,
              fontSize: 44,
              fontWeight: 900,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
              padding: "16px 28px",
              borderRadius: RADIUS.md,
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            }}
          >
            {template.title}
          </div>
        </div>
      )}

      {/* Board — opaque rows */}
      <div
        style={{
          position: "absolute",
          top: BOARD_TOP,
          left: BOARD_LEFT,
          width: boardW,
          height: boardH,
          background: "#0B0C10",
          borderRadius: RADIUS.lg,
          overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.10)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.65)",
          ...boardEntrance,
        }}
      >
        {rows.map((row, rowIdx) => (
          <RightRow
            key={`r-${rowIdx}-${row.label}`}
            row={row}
            rowH={ROW_H}
            labelW={LABEL_W}
            timing={timing}
            rtl={rtl}
            fps={fps}
            frame={frame}
            placedRender={template.placed_render ?? "text"}
            accent={accent}
          />
        ))}
      </div>

      {/* Staging slot — the indicator name floats while being discussed.
          Default: ABOVE the board. "below" mode parks it under the board
          and then a FlyingChip carries it up into the row at placement. */}
      {(template.timing || []).map((t) => {
        const item = findItem(template, t.id);
        if (!item) return null;
        const tt = timing.get(t.id)!;
        const stagingBelow = template.staging_position === "below";
        const stagingY = template.staging_y ?? (stagingBelow ? BOARD_TOP + boardH + 60 : BOARD_TOP - 140);
        return (
          <StagingChip
            key={`stage-${t.id}`}
            label={item.label || t.id}
            mentionSec={tt.mention}
            placeSec={tt.place}
            centerX={boardCenterX}
            y={stagingY}
            accent={accent}
            fps={fps}
            frame={frame}
            stagingBelow={stagingBelow}
          />
        );
      })}

      {/* Fly-and-morph: chips travel from staging position UP into their
          row slot, morphing from the text label to the item's icon. */}
      {template.staging_position === "below" && template.placed_render === "icon" &&
        (template.timing || []).map((t) => {
          const item = findItem(template, t.id);
          if (!item || !item.icon) return null;
          const tt = timing.get(t.id)!;
          // Find the row this item belongs to (and its index = rank).
          let rowIdx = -1;
          rows.forEach((r, ri) => {
            if (r.items.some((it) => it.id === t.id)) rowIdx = ri;
          });
          if (rowIdx < 0) return null;
          const rowCenterY = BOARD_TOP + (rowIdx + 0.5) * ROW_H;
          const itemsCellCenterX = (BOARD_LEFT + (BOARD_RIGHT - LABEL_W)) / 2;
          const stagingY = template.staging_y ?? BOARD_TOP + boardH + 60;
          return (
            <FlyingChip
              key={`fly-${t.id}`}
              label={item.label || t.id}
              icon={item.icon}
              startX={boardCenterX}
              startY={stagingY}
              endX={itemsCellCenterX}
              endY={rowCenterY}
              placeSec={tt.place}
              accent={accent}
              fps={fps}
              frame={frame}
            />
          );
        })}
    </AbsoluteFill>
  );
};

/** Pick black or white text for a hex background by luminance. */
function labelTextColor(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#0A0A0A";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.55 ? "#FFFFFF" : "#0A0A0A";
}

const RightRow: React.FC<{
  row: TierRatingTemplate["ratings"][number];
  rowH: number;
  labelW: number;
  timing: Map<string, TwoPhaseTiming>;
  rtl: boolean;
  fps: number;
  frame: number;
  placedRender?: "text" | "icon";
  accent: string;
}> = ({ row, rowH, labelW, timing, rtl, fps, frame, placedRender = "text", accent }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: rtl ? "row-reverse" : "row",
        height: rowH,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Tier label cell — text auto-contrasts (white on dark cells). */}
      <div
        style={{
          width: labelW,
          flexShrink: 0,
          background: row.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONTS.display,
          fontSize: 56,
          fontWeight: 900,
          color: labelTextColor(row.color),
        }}
      >
        {row.label}
      </div>

      {/* Items cell — chips pop in when placed */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          alignContent: "center",
          justifyContent: placedRender === "icon" ? "center" : (rtl ? "flex-end" : "flex-start"),
          gap: 12,
          padding: "0 18px",
          direction: rtl ? "rtl" : "ltr",
          overflow: "hidden",
        }}
      >
        {row.items.map((item, i) => (
          <RowChip
            key={`${row.label}-${item.id}-${i}`}
            label={item.label || item.id}
            icon={item.icon}
            placeSec={timing.get(item.id)?.place ?? 0}
            placedRender={placedRender}
            accent={accent}
            fps={fps}
            frame={frame}
          />
        ))}
      </div>
    </div>
  );
};

const RowChip: React.FC<{
  label: string;
  icon?: string;
  placeSec: number;
  placedRender?: "text" | "icon";
  accent: string;
  fps: number;
  frame: number;
}> = ({ label, icon, placeSec, placedRender = "text", accent, fps, frame }) => {
  const placeF = Math.round(placeSec * fps);
  // Icon mode: the FlyingChip handles arrival; render the resting icon only
  // once the flight finishes (~0.6s after placeSec).
  const settleF = placedRender === "icon" ? Math.round((placeSec + 0.55) * fps) : placeF;
  const local = frame - settleF;
  if (local < -1) return null;

  const dur = Math.round(0.4 * fps);
  const t = interpolate(local, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });

  if (placedRender === "icon" && icon) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: t,
          transform: `scale(${0.6 + 0.4 * t})`,
        }}
      >
        <div
          style={{
            width: 70, height: 70, borderRadius: "50%",
            background: accent, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 18px ${accent}aa, 0 4px 12px rgba(0,0,0,0.5)`,
            border: "3px solid rgba(255,255,255,0.25)",
          }}
        >
          <TemplateIcon id={icon} size={40} color="#fff" strokeWidth={2.6} mode="stroke" />
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        fontFamily: FONTS.display,
        fontSize: 46,
        fontWeight: 900,
        color: "#FFFFFF",
        letterSpacing: "-0.01em",
        padding: "10px 22px",
        background: "rgba(255,255,255,0.10)",
        border: "1.5px solid rgba(255,255,255,0.20)",
        borderRadius: 14,
        whiteSpace: "nowrap",
        opacity: t,
        transform: `scale(${0.6 + 0.4 * t}) translateY(${(1 - t) * -14}px)`,
        willChange: "transform, opacity",
        textShadow: "0 2px 8px rgba(0,0,0,0.5)",
      }}
    >
      {label}
    </div>
  );
};

const StagingChip: React.FC<{
  label: string;
  mentionSec: number;
  placeSec: number;
  centerX: number;
  y: number;
  accent: string;
  fps: number;
  frame: number;
  stagingBelow?: boolean;
}> = ({ label, mentionSec, placeSec, centerX, y, accent, fps, frame, stagingBelow = false }) => {
  const mentionF = Math.round(mentionSec * fps);
  const placeF = Math.round(placeSec * fps);
  const exitDur = Math.round(0.3 * fps);
  const inDur = Math.round(0.3 * fps);

  if (frame < mentionF - 1) return null;
  // In "below" mode the FlyingChip takes over at placeSec — fade staging out
  // quickly there (no drop animation; the flying chip carries the visual).
  if (stagingBelow && frame >= placeF) return null;
  if (!stagingBelow && frame > placeF + exitDur) return null;

  const fadeIn = interpolate(frame, [mentionF, mentionF + inDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });
  // On placement (above mode only): shrink + slide DOWN toward the board.
  const drop = stagingBelow
    ? 0
    : interpolate(frame, [placeF, placeF + exitDur], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easeFn("glass-rise"),
      });
  const opacity = Math.min(fadeIn, 1 - drop);
  const scale = (0.7 + 0.3 * fadeIn) * (1 - 0.25 * drop);
  const dy = drop * 90;

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: centerX - 230,
        width: 460,
        textAlign: "center",
        opacity,
        transform: `translateY(${dy}px) scale(${scale})`,
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          display: "inline-block",
          fontFamily: FONTS.display,
          fontSize: 52,
          fontWeight: 900,
          color: "#FFFFFF",
          letterSpacing: "-0.01em",
          padding: "14px 30px",
          background: accent,
          borderRadius: RADIUS.md,
          boxShadow: `0 0 30px ${accent}88, 0 10px 30px rgba(0,0,0,0.5)`,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
};

function findItem(template: TierRatingTemplate, id: string): TierItem | null {
  for (const row of template.ratings) {
    for (const item of row.items) {
      if (item.id === id) return item;
    }
  }
  return null;
}

// ── FlyingChip — text→icon morph that flies from staging into the row ───────

const FlyingChip: React.FC<{
  label: string;
  icon: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  placeSec: number;
  accent: string;
  fps: number;
  frame: number;
}> = ({ label, icon, startX, startY, endX, endY, placeSec, accent, fps, frame }) => {
  const placeF = Math.round(placeSec * fps);
  const dur = Math.round(0.55 * fps);
  const local = frame - placeF;
  if (local < -1 || local > dur + 2) return null;

  const t = interpolate(local, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("glass-rise"),
  });
  const x = startX + (endX - startX) * t;
  const y = startY + (endY - startY) * t;

  // Text fades out in the first half, icon fades in in the second half.
  const textOp = 1 - Math.max(0, Math.min(1, (t - 0.15) / 0.35));
  const iconOp = Math.max(0, Math.min(1, (t - 0.45) / 0.4));
  const morphScale = 1 - 0.45 * t; // text shrinks; icon grows from its base

  return (
    <>
      {textOp > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: y - 36,
            left: x - 230,
            width: 460,
            textAlign: "center",
            opacity: textOp,
            transform: `scale(${(1 - 0.4 * t).toFixed(3)})`,
            willChange: "transform, opacity",
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontFamily: FONTS.display,
              fontSize: 52,
              fontWeight: 900,
              color: "#FFFFFF",
              padding: "14px 30px",
              background: accent,
              borderRadius: RADIUS.md,
              boxShadow: `0 0 30px ${accent}88, 0 10px 30px rgba(0,0,0,0.5)`,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
      )}
      {iconOp > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: y - 35,
            left: x - 35,
            width: 70, height: 70,
            borderRadius: "50%",
            background: accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: iconOp,
            transform: `scale(${(0.6 + 0.4 * iconOp).toFixed(3)})`,
            boxShadow: `0 0 18px ${accent}aa, 0 4px 12px rgba(0,0,0,0.5)`,
            border: "3px solid rgba(255,255,255,0.25)",
          }}
        >
          <TemplateIcon id={icon} size={40} color="#fff" strokeWidth={2.6} mode="stroke" />
        </div>
      )}
    </>
  );
};

// ── TierTopStrip — horizontal "Rating Content Formats" reference layout ─────
//
// Title pill at top, a row of icon+label cells per rank, then a row of
// gradient-colored numbered circles below them (1 = green, N = red). Items
// slide up from below the strip and land in their rank column at place time.

const STRIP_FRAME_W = 1080;

const TierTopStrip: React.FC<Props> = ({ template, total_duration_sec }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const rtl = template.rtl ?? true;
  const accent = template.accent_color || "#E0701E";
  const rows = template.ratings;
  const n = rows.length;

  // Two-phase timing (mention/place) per item id.
  const timing = new Map<string, TwoPhaseTiming>();
  for (const t of template.timing || []) {
    timing.set(t.id, { mention: t.mention_at ?? t.appear_at, place: t.appear_at });
  }

  // Layout
  const TITLE_Y = template.title_y ?? 90;
  const ICON_ROW_Y = template.board_top ?? 210;
  const CELL_W = template.row_h ?? 116;        // cell width (re-using row_h knob)
  const CELL_GAP = 8;
  const CIRCLE_DIAM = 78;
  const stripW = n * CELL_W + (n - 1) * CELL_GAP;
  const stripStartX = (STRIP_FRAME_W - stripW) / 2;
  const ICON_AREA_H = 200;                     // icon + label height per cell
  const NUMBER_ROW_Y = ICON_ROW_Y + ICON_AREA_H + 4;
  const STAGING_Y = NUMBER_ROW_Y + CIRCLE_DIAM + 50;

  // Column center X per rank (rank 1 = first row in `rows`).
  // For RTL: rank 1 (best) sits at the RIGHT, rank N (worst) at the LEFT.
  // For LTR: rank 1 at left, rank N at right.
  const colCenterX = (rank1Based: number): number => {
    const visualIndex = rtl ? n - rank1Based : rank1Based - 1; // 0-based visual column
    return stripStartX + visualIndex * (CELL_W + CELL_GAP) + CELL_W / 2;
  };

  // Color gradient — green (best, 1) → red (worst, N).
  const rankColor = (rank1Based: number): string => {
    const t = (rank1Based - 1) / Math.max(1, n - 1); // 0 (best) → 1 (worst)
    return lerpColor("#34C759", "#FF3B30", t);
  };

  const titleEntrance = useEntrance({ signature: "stack-cascade", durationSec: 0.5, offsetFrames: 0 });
  const stripEntrance = useEntrance({ signature: "glass-rise", durationSec: 0.5, offsetFrames: Math.round(0.2 * fps) });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Title — editorial layout if title_hero is set (small lead + HUGE
          hero in accent + small tail), else solid white pill. */}
      {template.title_hero ? (
        <div
          style={{
            position: "absolute", top: TITLE_Y, left: 0, right: 0,
            textAlign: "center", direction: rtl ? "rtl" : "ltr",
            ...titleEntrance,
          }}
        >
          {template.title_lead && (
            <div
              style={{
                fontFamily: FONTS.display, fontSize: 38, fontWeight: 800,
                color: "#FFFFFF", letterSpacing: "-0.01em", lineHeight: 1.0,
                textShadow: "0 2px 10px rgba(0,0,0,0.7), 0 0 6px rgba(0,0,0,0.55)",
                marginBottom: -4,
              }}
            >
              {template.title_lead}
            </div>
          )}
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: template.title_hero.length > 8 ? 108 : 132,
              fontWeight: 900,
              color: accent, letterSpacing: "-0.035em", lineHeight: 0.95,
              WebkitTextStroke: `1.5px ${accent}`,
              textShadow: `0 0 22px ${accent}66, 0 6px 18px rgba(0,0,0,0.55)`,
            }}
          >
            {template.title_hero}
          </div>
          {template.title_tail && (
            <div
              style={{
                fontFamily: FONTS.display, fontSize: 38, fontWeight: 800,
                color: "#FFFFFF", letterSpacing: "-0.01em", lineHeight: 1.0,
                textShadow: "0 2px 10px rgba(0,0,0,0.7), 0 0 6px rgba(0,0,0,0.55)",
                marginTop: -2,
              }}
            >
              {template.title_tail}
            </div>
          )}
        </div>
      ) : (
        template.title && (
          <div
            style={{
              position: "absolute", top: TITLE_Y, left: 0, right: 0,
              textAlign: "center", direction: rtl ? "rtl" : "ltr",
              ...titleEntrance,
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontFamily: FONTS.display, fontSize: 48, fontWeight: 900,
                color: "#1A1A1A", background: "#FFFFFF",
                padding: "14px 30px", borderRadius: 16,
                letterSpacing: "-0.01em",
                boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
              }}
            >
              {template.title}
            </span>
          </div>
        )
      )}

      {/* Numbered circles row — always visible, gradient colored */}
      <div style={{ position: "absolute", inset: 0, ...stripEntrance }}>
        {rows.map((_, i) => {
          const rank = i + 1;
          const cx = colCenterX(rank);
          const color = rankColor(rank);
          return (
            <div
              key={`circle-${rank}`}
              style={{
                position: "absolute",
                top: NUMBER_ROW_Y,
                left: cx - CIRCLE_DIAM / 2,
                width: CIRCLE_DIAM, height: CIRCLE_DIAM,
                borderRadius: "50%",
                background: color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONTS.display, fontSize: 40, fontWeight: 900,
                color: labelTextColor(color),
                border: "3px solid rgba(255,255,255,0.7)",
                boxShadow: `0 6px 14px rgba(0,0,0,0.45)`,
              }}
            >
              {rank}
            </div>
          );
        })}

        {/* Icon + label cells per rank — appear at the item's place time */}
        {rows.map((row, i) => {
          const rank = i + 1;
          const item = row.items[0];
          if (!item) return null;
          const tt = timing.get(item.id);
          if (!tt) return null;
          const cx = colCenterX(rank);
          return (
            <TopStripCell
              key={`cell-${rank}`}
              rank={rank}
              icon={item.icon}
              label={item.label || item.id}
              centerX={cx}
              y={ICON_ROW_Y}
              cellW={CELL_W}
              accent={accent}
              placeSec={tt.place}
              fps={fps}
              frame={frame}
            />
          );
        })}

        {/* Staging chips below the strip — text appears when item is mentioned */}
        {(template.timing || []).map((t) => {
          const item = findItem(template, t.id);
          if (!item) return null;
          const tt = timing.get(t.id)!;
          return (
            <StagingChip
              key={`stage-${t.id}`}
              label={item.label || t.id}
              mentionSec={tt.mention}
              placeSec={tt.place}
              centerX={STRIP_FRAME_W / 2}
              y={STAGING_Y}
              accent={accent}
              fps={fps}
              frame={frame}
              stagingBelow={true}
            />
          );
        })}

        {/* Fly-and-morph: text flies from staging up into its column */}
        {(template.timing || []).map((t) => {
          const item = findItem(template, t.id);
          if (!item || !item.icon) return null;
          const tt = timing.get(t.id)!;
          let rank = -1;
          rows.forEach((r, ri) => {
            if (r.items.some((it) => it.id === t.id)) rank = ri + 1;
          });
          if (rank < 0) return null;
          return (
            <FlyingChip
              key={`fly-${t.id}`}
              label={item.label || t.id}
              icon={item.icon}
              startX={STRIP_FRAME_W / 2}
              startY={STAGING_Y}
              endX={colCenterX(rank)}
              endY={ICON_ROW_Y + 50}
              placeSec={tt.place}
              accent={accent}
              fps={fps}
              frame={frame}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// One icon+label cell in the strip — pops in after the FlyingChip lands.
const TopStripCell: React.FC<{
  rank: number;
  icon?: string;
  label: string;
  centerX: number;
  y: number;
  cellW: number;
  accent: string;
  placeSec: number;
  fps: number;
  frame: number;
}> = ({ icon, label, centerX, y, cellW, accent, placeSec, fps, frame }) => {
  // Render once the FlyingChip's flight finishes (~0.55s after placeSec).
  const settleF = Math.round((placeSec + 0.55) * fps);
  const local = frame - settleF;
  if (local < -1) return null;
  const dur = Math.round(0.3 * fps);
  const t = interpolate(local, [0, dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft"),
  });
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: centerX - cellW / 2,
        width: cellW,
        height: 180,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        opacity: t, transform: `scale(${0.7 + 0.3 * t})`,
      }}
    >
      {/* Icon disc */}
      <div
        style={{
          width: 104, height: 104, borderRadius: "50%",
          background: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 6px 16px ${accent}aa, 0 0 20px ${accent}77`,
          border: "3px solid rgba(255,255,255,0.3)",
        }}
      >
        <TemplateIcon id={icon} size={62} color="#fff" strokeWidth={2.6} mode="stroke" />
      </div>
      {/* Label below */}
      <div
        style={{
          fontFamily: FONTS.display, fontSize: 23, fontWeight: 800,
          color: "#fff",
          textAlign: "center", lineHeight: 1.1,
          textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 4px rgba(0,0,0,0.6)",
          padding: "0 2px",
          maxHeight: 70, overflow: "hidden",
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** Linearly interpolate two hex colors at t in [0,1]. */
function lerpColor(hexA: string, hexB: string, t: number): string {
  const a = parseHex(hexA), b = parseHex(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}
function parseHex(h: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
