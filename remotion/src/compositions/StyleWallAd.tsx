import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Loop,
} from "remotion";
import "@fontsource/heebo/700.css";
import "@fontsource/heebo/800.css";
import "@fontsource/heebo/900.css";

/**
 * StyleWallAd — 10s vertical ad reframing the pitch from "one transformation"
 * to breadth/customization: "8 styles, pick yours."
 *
 * Beats:
 *   0-3s   (f0-90)    GRID: all 8 real DrEdit output-style clips slam into a
 *                     2x4 grid, staggered spring scale-ins. Static hold once
 *                     in (headline reads).
 *   3-5s   (f90-150)  COLLAPSE: 7 tiles shrink+fade out toward the frame
 *                     edges/corners; 1 winning tile grows to full-bleed. As
 *                     it nears full-bleed, its short low-res tile clip
 *                     cross-fades (opacity + audio) into the real finished
 *                     reel — two stacked videos, never a hard source cut.
 *   5-10s  (f150-300) PAYOFF: the winning tile plays on full-bleed as a
 *                     normal "after" reel. Corner brand badge visible
 *                     throughout; small end-flash CTA in the final ~1s.
 *
 * Fixed 300f/10s @30fps — no calculateMetadata, matches the live "cards" ad.
 * GL-safe: absolute positioning + opacity + volume only, no WebGL/3D.
 * Assets: remotion/public/examples/*.mp4 (8 tile clips) + public/demo/style_wall_full.mp4.
 */

const ORANGE = "#E0701E";
const BG = "#0A0A0C";
const FONT = "'Heebo', sans-serif";

export const SW_FPS = 30;
export const SW_WIDTH = 1080;
export const SW_HEIGHT = 1920;
export const SW_DURATION = 300; // exactly 10s @30fps, fixed

export interface StyleWallAdProps {
  finalReel: string; // staticFile-relative path to the full-quality revealed reel
}

// ── grid geometry ────────────────────────────────────────────────────────

const GRID_COLS = 2;
const GRID_ROWS = 4;
const CELL_W = SW_WIDTH / GRID_COLS; // 540
const CELL_H = SW_HEIGHT / GRID_ROWS; // 480
const GAP = 6;
const TILE_LOOP_LEN = 90; // source clips are ~3s @30fps

// the 8 real DrEdit output-style example clips, staged in public/examples/
const TILE_SRCS = [
  "examples/broll_200.mp4",
  "examples/broll_counter.mp4",
  "examples/broll_menu.mp4",
  "examples/broll_website.mp4",
  "examples/overlay_phone.mp4",
  "examples/overlay_pill.mp4",
  "examples/overlay_textslam.mp4",
  "examples/overlay_top.mp4",
];

const WINNER_INDEX = 5; // overlay_pill.mp4's grid slot is the one that "wins"

// ── phase boundaries (frames) ───────────────────────────────────────────

const COLLAPSE_START = 90; // 3s
const COLLAPSE_END = 150; // 5s
const CROSSFADE_START = 115; // reel starts revealing itself as the tile grows
const CROSSFADE_END = 150; // fully revealed exactly as the tile hits full-bleed

function cellRect(i: number) {
  const col = i % GRID_COLS;
  const row = Math.floor(i / GRID_COLS);
  return {
    left: col * CELL_W + GAP / 2,
    top: row * CELL_H + GAP / 2,
    width: CELL_W - GAP,
    height: CELL_H - GAP,
  };
}

// ── shared: brand badge + end-flash CTA (verbatim pattern) ─────────────

const CornerBadge: React.FC = () => (
  <div style={{ position: "absolute", left: 24, bottom: 24, zIndex: 5, display: "flex", alignItems: "center", gap: 7, background: "rgba(8,8,10,0.55)", borderRadius: 999, padding: "5px 12px 5px 6px" }}>
    <svg width={22} height={22} viewBox="0 0 34 34" style={{ display: "block" }}>
      <rect x={1.5} y={1.5} width={31} height={31} rx={9} fill={ORANGE} />
      <path d="M13 10.5 L24.5 17 L13 23.5 Z" fill="#ffffff" />
    </svg>
    <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: "rgba(255,255,255,0.92)" }}>DrEdit</span>
  </div>
);

const EndFlashCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const IN_START = 270;
  const IN_END = 284;
  const OUT_START = 292;
  const OUT_END = 300;
  const flashIn = interpolate(frame, [IN_START, IN_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flashOut = interpolate(frame, [OUT_START, OUT_END], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = flashIn * flashOut;
  if (op <= 0.002) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, textAlign: "center", direction: "rtl", opacity: op, zIndex: 45 }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#fff", textShadow: `0 0 20px rgba(224,112,30,0.6), 0 2px 8px rgba(0,0,0,0.85)` }}>
        נסה חינם על הסרטון שלך · <span style={{ color: "#FFC48A" }}>dredit.co</span>
      </span>
    </div>
  );
};

// ── loser tile: grid slam in, then shrinks/fades out toward its corner ──

const LoserTile: React.FC<{ index: number; src: string }> = ({ index, src }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rect = cellRect(index);
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);

  // entrance: staggered spring scale-in (the "instant grid slam")
  const delay = index * 3;
  const entry = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 10, stiffness: 240, mass: 0.7 }, from: 0, to: 1 });
  const entryOpacity = interpolate(frame - delay, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // collapse: push out toward the nearest corner/edge, shrink, fade
  const collapse = spring({ frame: Math.max(0, frame - COLLAPSE_START), fps, config: { damping: 200 }, durationInFrames: COLLAPSE_END - COLLAPSE_START });
  const colDir = col === 0 ? -1 : 1;
  const rowDir = row <= 1 ? -1 : 1;
  const left = interpolate(collapse, [0, 1], [rect.left, rect.left + colDir * 320]);
  const top = interpolate(collapse, [0, 1], [rect.top, rect.top + rowDir * 420]);
  const collapseScale = interpolate(collapse, [0, 1], [1, 0.2]);
  const collapseOpacity = interpolate(collapse, [0, 0.55, 1], [1, 1, 0]);

  if (frame >= COLLAPSE_END) return null; // fully gone; stop rendering/decoding

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: rect.width,
        height: rect.height,
        zIndex: 1,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        transform: `scale(${entry * collapseScale})`,
        opacity: entryOpacity * collapseOpacity,
        background: "#000",
      }}
    >
      <Loop durationInFrames={TILE_LOOP_LEN} style={{ width: "100%", height: "100%" }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Loop>
    </div>
  );
};

// ── winner tile: grid slam in, grows to full-bleed, source-swaps via ────
// a cross-fade (short tile clip -> real finished reel) instead of a cut ──

const WinnerTile: React.FC<{ index: number; src: string; finalReel: string }> = ({ index, src, finalReel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rect = cellRect(index);

  const delay = index * 3;
  const entry = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 10, stiffness: 240, mass: 0.7 }, from: 0, to: 1 });
  const entryOpacity = interpolate(frame - delay, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const collapse = spring({ frame: Math.max(0, frame - COLLAPSE_START), fps, config: { damping: 200 }, durationInFrames: COLLAPSE_END - COLLAPSE_START });
  const left = interpolate(collapse, [0, 1], [rect.left, 0]);
  const top = interpolate(collapse, [0, 1], [rect.top, 0]);
  const width = interpolate(collapse, [0, 1], [rect.width, SW_WIDTH]);
  const height = interpolate(collapse, [0, 1], [rect.height, SW_HEIGHT]);
  const radius = interpolate(collapse, [0, 1], [14, 0]);

  // cross-fade: short tile clip -> real finished reel, timed so the swap
  // completes exactly as the tile reaches full-bleed size (no hard cut)
  const swap = interpolate(frame, [CROSSFADE_START, CROSSFADE_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const showTileLayer = frame <= COLLAPSE_END; // unmount once fully swapped away

  // a quick, subtle "reveal" flash right as it locks to full-bleed
  const flash = interpolate(frame, [COLLAPSE_END - 4, COLLAPSE_END, COLLAPSE_END + 8], [0, 0.45, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        zIndex: 10,
        borderRadius: radius,
        overflow: "hidden",
        border: collapse < 0.98 ? "1px solid rgba(255,255,255,0.08)" : "none",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        transform: `scale(${entry})`,
        opacity: entryOpacity,
        background: "#000",
      }}
    >
      {/* layer 1: short low-res tile clip (looped), fades out on swap */}
      {showTileLayer && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - swap }}>
          <Loop durationInFrames={TILE_LOOP_LEN} style={{ width: "100%", height: "100%" }}>
            <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Loop>
        </div>
      )}
      {/* layer 2: the real finished reel, revealed + audio ramped in via the same cross-fade */}
      <div style={{ position: "absolute", inset: 0, opacity: swap }}>
        <OffthreadVideo src={staticFile(finalReel)} volume={swap} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />

      {frame >= COLLAPSE_END && <CornerBadge />}
      {frame >= COLLAPSE_END && <EndFlashCTA />}
    </div>
  );
};

// ── grid-intro headline (fades before the collapse begins) ─────────────

const GridHeadline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 210 }, from: 0, to: 1, delay: 6 });
  const out = interpolate(frame, [78, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 96, left: 40, right: 40, textAlign: "center", direction: "rtl", zIndex: 30, transform: `scale(${s})`, opacity: s * out }}>
      <div style={{ display: "inline-block", background: "rgba(6,6,8,0.72)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 20, padding: "16px 28px" }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: "#fff", lineHeight: 1.2 }}>
          <span style={{ color: ORANGE }}>8 סטיילים</span> לבחירה. אחד בשבילך.
        </span>
      </div>
    </div>
  );
};

// caption during the collapse beat — sells "this is a real finished reel"
const RevealCaption: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [96, 108, 134, 148], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (op <= 0.002) return null;
  return (
    <div style={{ position: "absolute", bottom: 90, left: 40, right: 40, textAlign: "center", direction: "rtl", zIndex: 30, opacity: op }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
        וזה כבר <span style={{ color: ORANGE }}>ריל אמיתי, מוכן.</span>
      </span>
    </div>
  );
};

export const StyleWallAd: React.FC<StyleWallAdProps> = ({ finalReel }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG }}>
      {TILE_SRCS.map((src, i) =>
        i === WINNER_INDEX ? (
          <WinnerTile key={i} index={i} src={src} finalReel={finalReel} />
        ) : (
          <LoserTile key={i} index={i} src={src} />
        )
      )}
      {frame < 90 && <GridHeadline />}
      {frame >= COLLAPSE_START && frame < COLLAPSE_END && <RevealCaption />}
    </AbsoluteFill>
  );
};
