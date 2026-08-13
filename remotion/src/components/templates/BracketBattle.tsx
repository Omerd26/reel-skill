/**
 * BracketBattle — tournament-bracket video template.
 *
 * Layout reference: a single-elimination bracket with N items on the left,
 * N items on the right, narrowing toward a center "championship" slot.
 * Items appear as bold white cards on a dark backdrop. Winners get tinted
 * with the accent color (or a green tone).
 *
 * Render structure (data-driven from `BracketBattleTemplate.items`):
 *   - splits items into LEFT half (first N/2) and RIGHT half (last N/2)
 *   - draws N/4 rounds on each side, mirroring inward
 *   - winners are placed in their next-round slot once the previous match's
 *     `appear_at` time has passed
 *
 * Sizes are dialed for 1080×1920 vertical with the speaker visible above. The
 * bracket panel anchors lower-third by default (top: ~50%) so it covers the
 * torso, not the face.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { useEntrance, useAmbient, staggerOffset } from "../overlays/motion";
import { COLORS, FONTS, RADIUS, easeFn } from "../../design/tokens";
import type { BracketBattleTemplate, ItemTiming } from "./types";

// ── Layout constants — tuned for 1080×1920 ───────────────────────────────────

const FRAME_W = 1080;

interface Props {
  template: BracketBattleTemplate;
  total_duration_sec: number;
}

interface ResolvedItem {
  id: string;
  label: string;
  round: number;        // 0 = first round, depth-1 = champion
  side: "left" | "right";
  slot: number;         // index within the round on that side
  appearAtSec: number;  // when this item card materializes
  isWinner: boolean;    // highlighted with accent color
  isChampion: boolean;
}

export const BracketBattle: React.FC<Props> = ({ template, total_duration_sec }) => {
  const { fps } = useVideoConfig();
  const accent = template.accent_color || "#B7FF00";
  const rtl = template.rtl ?? false;

  const layout = useBracketLayout(template, total_duration_sec);

  // Title entrance — first 0.6s
  const titleEntrance = useEntrance({
    signature: "stack-cascade",
    durationSec: 0.55,
    offsetFrames: 0,
  });
  const subtitleEntrance = useEntrance({
    signature: "stack-cascade",
    durationSec: 0.55,
    offsetFrames: Math.round(0.15 * fps),
  });

  // Hebrew titles get a unified multi-line block — the editorial lead/hero/tail
  // lockup only reads well in English where one word can be hero-sized.
  const isHebrew = /[֐-׿]/.test(template.title);
  const titleWords = template.title.split(" ");
  const lead = titleWords.length >= 3 ? titleWords[0] : "";
  const hero = titleWords.length >= 3
    ? titleWords.slice(1, -1).join(" ")
    : titleWords.length === 2
      ? titleWords[0]
      : titleWords[0];
  const tail = titleWords.length >= 2 ? titleWords[titleWords.length - 1] : "";

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Title block — Hebrew gets a unified centered block; English uses the
          editorial lead/hero/tail lockup. */}
      {isHebrew ? (
        <div
          style={{
            position: "absolute",
            top: template.title_y ?? 250,
            left: 0,
            right: 0,
            padding: "0 60px",
            direction: "rtl",
            textAlign: "center",
            ...titleEntrance,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 76,
              fontWeight: 900,
              color: accent,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              textShadow: `0 0 28px ${accent}55, 0 4px 16px rgba(0,0,0,0.7)`,
            }}
          >
            {template.title}
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 0,
            right: 0,
            padding: "0 50px",
            direction: rtl ? "rtl" : "ltr",
            ...titleEntrance,
          }}
        >
          {lead && (
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 42,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
                lineHeight: 0.95,
                textShadow: "0 2px 12px rgba(0,0,0,0.55)",
                textAlign: rtl ? "right" : "left",
              }}
            >
              {lead}
            </div>
          )}
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 156,
              fontWeight: 900,
              color: accent,
              letterSpacing: "-0.035em",
              lineHeight: 0.9,
              textShadow: `0 0 32px ${accent}55, 0 6px 20px rgba(0,0,0,0.6)`,
              textTransform: "uppercase",
              textAlign: "center",
              margin: "4px 0",
            }}
          >
            {hero}
          </div>
          {tail && tail !== hero && (
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 48,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
                lineHeight: 0.95,
                textShadow: "0 2px 12px rgba(0,0,0,0.55)",
                textAlign: rtl ? "left" : "right",
                marginTop: -8,
              }}
            >
              {tail}
            </div>
          )}
        </div>
      )}

      {/* Subtitle — appears below the hero title, centered */}
      {template.subtitle && (
        <div
          style={{
            position: "absolute",
            top: 510,
            left: 0,
            right: 0,
            textAlign: "center",
            padding: "0 60px",
            direction: rtl ? "rtl" : "ltr",
            ...subtitleEntrance,
            fontFamily: FONTS.display,
            fontSize: 56,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
            textShadow: "0 4px 16px rgba(0,0,0,0.7)",
          }}
        >
          {template.subtitle}
        </div>
      )}

      {/* Bracket panel — sits below the subtitle, leaves face zone clear */}
      <BracketPanel
        layout={layout}
        accent={accent}
        panelTopOverride={template.panel_top}
        panelHeightOverride={template.panel_height}
      />
    </AbsoluteFill>
  );
};

// ── Bracket panel — draws the bracket itself ─────────────────────────────────

interface PanelProps {
  layout: BracketLayout;
  accent: string;
  panelTopOverride?: number;
  panelHeightOverride?: number;
}

const BracketPanel: React.FC<PanelProps> = ({ layout, accent, panelTopOverride, panelHeightOverride }) => {
  const { fps } = useVideoConfig();
  const { rounds, items } = layout;

  // Panel placement. The 16-item bracket needs the full height to breathe;
  // the 8-item bracket is compressed into a tight block in the mid-lower frame
  // (below the speaker's face), matching the reference's compact competition.
  // Per-video overrides let it sit in the upper third instead.
  const PANEL_TOP = panelTopOverride ?? (rounds >= 4 ? 620 : 950);
  const PANEL_HEIGHT = panelHeightOverride ?? (rounds >= 4 ? 1200 : 600);

  // Round column X positions — hand-tuned for the compact bracket style.
  // Cards are 115-150px wide; column step is ~120px so the gap between rounds
  // is large enough for the connector elbow to read clearly.
  // Column X positions (LEFT side; right side mirrors). Tuned so cards
  // taper inward and leave a center channel for the champion.
  const sideCols: number[] = [];
  if (rounds === 4) {
    // 16 items: L cards at x=5/145/290/425. Right cards mirror to
    // [945,1075] / [805,935] / [670,790] / [545,655]. Innermost gap
    // between left R3 (ends 535) and right R3 (starts 545) = 10px,
    // perfect for champion at center (540).
    sideCols.push(5, 145, 290, 425);
  } else if (rounds === 3) {
    // 8-item bracket: cards 135/115/95 wide, inset ~85px from the frame edges
    // so Instagram's side rails (typically 60-80px) don't crop the outer cards.
    // Columns leave 15-20px gaps between each card's elbow and the next round.
    sideCols.push(85, 270, 430);
  } else if (rounds === 2) {
    sideCols.push(80, 280);
  } else {
    sideCols.push(200);
  }
  // Right-side columns mirror inward
  const rightCols = sideCols.map((x) => FRAME_W - x);

  return (
    <div
      style={{
        position: "absolute",
        top: PANEL_TOP,
        left: 0,
        right: 0,
        height: PANEL_HEIGHT,
      }}
    >
      {/* Connector lines layer — drawn first so cards sit on top */}
      <BracketConnectors
        layout={layout}
        leftCols={sideCols}
        rightCols={rightCols}
        accent={accent}
        panelHeight={PANEL_HEIGHT}
      />

      {/* Item cards */}
      {items.map((item) => {
        const x =
          item.side === "left"
            ? sideCols[item.round]
            : rightCols[item.round] - cardWidthForRound(item.round, rounds);
        const y = slotY(item, rounds, PANEL_HEIGHT);
        return (
          <BracketItemCard
            key={`${item.side}-${item.round}-${item.slot}`}
            item={item}
            x={x}
            y={y}
            width={cardWidthForRound(item.round, rounds)}
            totalRounds={rounds}
            accent={accent}
            fps={fps}
          />
        );
      })}

      {/* Champion slot (center) — shown when the champion appears */}
      <ChampionSlot layout={layout} accent={accent} panelHeight={PANEL_HEIGHT} />
    </div>
  );
};

// ── A single bracket item card ───────────────────────────────────────────────

interface ItemCardProps {
  item: ResolvedItem;
  x: number;
  y: number;
  width: number;
  totalRounds: number;
  accent: string;
  fps: number;
}

const BracketItemCard: React.FC<ItemCardProps> = ({
  item,
  x,
  y,
  width,
  totalRounds,
  accent,
  fps,
}) => {
  const frame = useCurrentFrame();
  const appearFrame = Math.round(item.appearAtSec * fps);
  const localFrame = frame - appearFrame;

  if (localFrame < -1) return null;

  // Slide in from outside the frame on each side
  const dur = 0.34;
  const totalFrames = Math.round(dur * fps);
  const t = interpolate(localFrame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("glass-rise"),
  });
  const dist = item.side === "left" ? -240 : 240;
  const tx = (1 - t) * dist;

  // Winner cards use the accent color (template-driven) so colors stay in
  // sync with the title. Round 0 cards remain white for high contrast.
  const bg = item.isWinner ? accent : "#FFFFFF";
  const fg = item.isWinner ? "#FFFFFF" : "#0A0A0A";

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height: cardHeightForRound(item.round, totalRounds),
        background: bg,
        color: fg,
        borderRadius: RADIUS.sm,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.display,
        fontSize: fontSizeForRound(item.round, totalRounds),
        fontWeight: 800,
        letterSpacing: "-0.005em",
        opacity: t,
        transform: `translate3d(${tx.toFixed(1)}px, 0, 0)`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.3)",
        textAlign: "center",
        lineHeight: 1.1,
        overflow: "hidden",
        padding: "4px 10px",
        willChange: "transform, opacity",
      }}
    >
      {item.label}
    </div>
  );
};

// ── Connector lines — drawn with SVG ─────────────────────────────────────────

interface ConnectorsProps {
  layout: BracketLayout;
  leftCols: number[];
  rightCols: number[];
  accent: string;
  panelHeight: number;
}

const BracketConnectors: React.FC<ConnectorsProps> = ({
  layout,
  leftCols,
  rightCols,
  accent,
  panelHeight,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const { rounds } = layout;

  // Connector "draw in" timing — driven by the round's appearance window
  const startFrame = Math.round(layout.bracketStartSec * fps);
  const endFrame = Math.round((layout.bracketStartSec + 0.6) * fps);
  const drawT = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("glass-rise"),
  });

  // Generate connector paths
  const paths: string[] = [];

  for (const side of ["left", "right"] as const) {
    const cols = side === "left" ? leftCols : rightCols;
    for (let r = 0; r < rounds - 1; r++) {
      // For each pair on round r, draw a connector to round r+1
      const itemsInRound = Math.pow(2, rounds - 1 - r);
      const itemsInNextRound = itemsInRound / 2;
      const cardW = cardWidthForRound(r, rounds);

      for (let slot = 0; slot < itemsInRound; slot += 2) {
        // y-positions for the two items in this pair (in round r) — use the
        // exact card center so connectors meet cards perfectly.
        const topItem: ResolvedItem = {
          id: "",
          label: "",
          round: r,
          side,
          slot,
          appearAtSec: 0,
          isWinner: false,
          isChampion: false,
        };
        const bottomItem: ResolvedItem = { ...topItem, slot: slot + 1 };
        const cardH = cardHeightForRound(r, rounds);
        const yTop = slotY(topItem, rounds, panelHeight) + cardH / 2;
        const yBottom = slotY(bottomItem, rounds, panelHeight) + cardH / 2;

        // Card right-edge x (for left side, card ends at cols[r] + cardW;
        // for right side, card starts at cols[r] - cardW, so left edge is
        // at cols[r] - cardW and the connector exits from cols[r] - cardW)
        const exitX =
          side === "left" ? cols[r] + cardW : cols[r] - cardW;
        const advanceX = side === "left" ? exitX + 30 : exitX - 30;
        const yMid = (yTop + yBottom) / 2;

        // Bracket-style connector: two horizontals + one vertical + one horizontal advance
        paths.push(
          `M ${exitX} ${yTop} L ${advanceX} ${yTop} L ${advanceX} ${yBottom} L ${exitX} ${yBottom}`,
        );
        // Advance line into the next round. It must penetrate the next card
        // from its OUTER edge (the edge facing this round) so the line visibly
        // touches the card on BOTH sides. cols[r+1] is the left card's left
        // edge / the right card's right edge — i.e. the outer edge — so a small
        // inward offset puts the line just inside the card.
        const nextExitX =
          side === "left" ? cols[r + 1] + 14 : cols[r + 1] - 14;
        paths.push(`M ${advanceX} ${yMid} L ${nextExitX} ${yMid}`);
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${FRAME_W} ${panelHeight}`}
      width={FRAME_W}
      height={panelHeight}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="#FFFFFF"
          strokeWidth={10}
          strokeOpacity={drawT}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={1000}
          strokeDashoffset={(1 - drawT) * 1000}
          style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.5))" }}
        />
      ))}
    </svg>
  );
};

// ── Champion slot (center) ───────────────────────────────────────────────────

const ChampionSlot: React.FC<{
  layout: BracketLayout;
  accent: string;
  panelHeight: number;
}> = ({ layout, accent, panelHeight }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const champ = layout.champion;
  if (!champ) return null;

  const appearFrame = Math.round(champ.appearAtSec * fps);
  const localFrame = frame - appearFrame;
  if (localFrame < -1) return null;

  const dur = 0.5;
  const totalFrames = Math.round(dur * fps);
  const t = interpolate(localFrame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });
  const scale = 0.6 + 0.4 * t;
  const y = panelHeight / 2 - 50;

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: "50%",
        transform: `translateX(-50%) scale(${scale})`,
        opacity: t,
        padding: "14px 30px",
        background: accent,
        color: "#FFFFFF",
        borderRadius: RADIUS.md,
        fontFamily: FONTS.display,
        fontSize: 32,
        fontWeight: 900,
        letterSpacing: "-0.01em",
        boxShadow: `0 0 32px ${accent}aa, 0 6px 20px rgba(0,0,0,0.5)`,
        whiteSpace: "nowrap",
      }}
    >
      {champ.label}
    </div>
  );
};

// ── Layout math — flat items → bracket layout (data-driven) ─────────────────

interface BracketLayout {
  rounds: number;
  items: ResolvedItem[];
  champion: ResolvedItem | null;
  bracketStartSec: number;
}

function useBracketLayout(
  template: BracketBattleTemplate,
  total_duration_sec: number,
): BracketLayout {
  // Pad to next power of 2
  const N = nextPow2(Math.max(2, template.items.length));
  const padded = [...template.items];
  while (padded.length < N) padded.push("");
  const rounds = Math.log2(N);

  const winnersList = template.winners || [];

  // Timing: distribute round appearances across the video. Round 0 lands first.
  // Reserve title (~0.8s) and outro (~1.0s).
  const titleBudget = 0.8;
  const outroBudget = 1.0;
  const available = Math.max(2.0, total_duration_sec - titleBudget - outroBudget);
  const bracketStartSec = titleBudget;
  const perRoundBudget = available / (rounds + 0.5); // champion gets the last half-slot

  // Build timing map from explicit `timing` if present.
  // Same label may appear in multiple rounds (R0 seeded + R1/R2 advances) at
  // different moments — round-scoped keys win, label-only is the fallback.
  const timingByItem = new Map<string, ItemTiming>();
  for (const t of template.timing || []) {
    const key = t.round !== undefined ? `${t.id}@r${t.round}` : t.id;
    timingByItem.set(key, t);
  }
  const lookupTiming = (label: string, round: number): number | undefined =>
    timingByItem.get(`${label}@r${round}`)?.appear_at ??
    timingByItem.get(label)?.appear_at;

  // Connectors draw in just before the first explicit item appearance — so
  // the bracket scaffold doesn't sit empty during the speaker's intro.
  const explicitStarts = (template.timing || []).map((t) => t.appear_at);
  const dynamicStart =
    explicitStarts.length > 0
      ? Math.max(0.5, Math.min(...explicitStarts) - 0.6)
      : titleBudget;

  const items: ResolvedItem[] = [];
  let winnersConsumed = 0;
  let prevRoundWinners: string[] = padded; // round 0 = all original items

  for (let r = 0; r < rounds; r++) {
    const itemsInRound = N / Math.pow(2, r);
    const sideCount = itemsInRound / 2;
    const roundStart = bracketStartSec + r * perRoundBudget;
    const perItem = (perRoundBudget * 0.85) / Math.max(1, itemsInRound);

    const roundItems = prevRoundWinners.slice();
    for (let slotIdx = 0; slotIdx < itemsInRound; slotIdx++) {
      const label = roundItems[slotIdx] ?? "";
      const side: "left" | "right" = slotIdx < sideCount ? "left" : "right";
      const slot = side === "left" ? slotIdx : slotIdx - sideCount;
      const id = `${label || "_empty"}@r${r}s${slotIdx}`;
      const baseAppear = roundStart + slotIdx * perItem;
      const appearAtSec = lookupTiming(label, r) ?? baseAppear;
      const isWinner =
        r > 0 && label !== "" && true; // any item that *advanced* into r>0 is a winner of the prev round
      items.push({
        id,
        label,
        round: r,
        side,
        slot,
        appearAtSec,
        isWinner,
        isChampion: false,
      });
    }

    // Compute next round's winners
    const nextWinners: string[] = [];
    const sliceCount = itemsInRound / 2;
    for (let pairIdx = 0; pairIdx < sliceCount; pairIdx++) {
      const w = winnersList[winnersConsumed + pairIdx];
      const a = roundItems[pairIdx * 2];
      const b = roundItems[pairIdx * 2 + 1];
      nextWinners.push(w && (w === a || w === b) ? w : a); // default to first if no winner specified
    }
    winnersConsumed += sliceCount;
    prevRoundWinners = nextWinners;
  }

  // Champion = the single item that survived all rounds
  let champion: ResolvedItem | null = null;
  if (prevRoundWinners[0]) {
    const champAppear = bracketStartSec + rounds * perRoundBudget;
    champion = {
      id: `champion@${prevRoundWinners[0]}`,
      label: prevRoundWinners[0],
      round: rounds,
      side: "left",
      slot: 0,
      appearAtSec: lookupTiming(prevRoundWinners[0], rounds) ?? champAppear,
      isWinner: true,
      isChampion: true,
    };
  }

  return { rounds, items, champion, bracketStartSec: dynamicStart };
}

function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

function cardWidthForRound(round: number, totalRounds: number): number {
  // 16-item bracket needs compact cards to fit vertically; 8-item bracket can
  // breathe with wider cards for longer labels (especially Hebrew).
  if (totalRounds <= 3) {
    if (round === 0) return 135;
    if (round === 1) return 115;
    return 95;
  }
  if (round === 0) return 130;
  if (round === 1) return 130;
  if (round === 2) return 120;
  return 110;
}

function cardHeightForRound(round: number, totalRounds: number = 4): number {
  // 8-item bracket has only 4 round-0 cards per side → afford much taller pills.
  if (totalRounds <= 3) {
    if (round === 0) return 56;
    if (round === 1) return 60;
    return 64;
  }
  if (round === 0) return 28;
  if (round === 1) return 30;
  if (round === 2) return 32;
  return 34;
}

function fontSizeForRound(round: number, totalRounds: number = 4): number {
  if (totalRounds <= 3) {
    if (round === 0) return 19;
    if (round === 1) return 20;
    return 22;
  }
  if (round === 0) return 14;
  if (round === 1) return 14;
  if (round === 2) return 15;
  return 16;
}

function slotY(item: ResolvedItem, rounds: number, panelHeight: number): number {
  // Correct bracket math: each item in round R, slot S sits at the vertical
  // midpoint of its two children in round R-1. Using `(slot + 0.5) / count`
  // makes this fall out naturally — round 0 cards equally divide the panel,
  // and round R+1 slot S lands exactly between round R slots 2S and 2S+1.
  const itemsInThisRound = Math.pow(2, rounds - 1 - item.round);
  const yCenter = ((item.slot + 0.5) / itemsInThisRound) * panelHeight;
  return yCenter - cardHeightForRound(item.round, rounds) / 2;
}
