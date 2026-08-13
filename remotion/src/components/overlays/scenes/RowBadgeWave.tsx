/**
 * RowBadgeWave — small per-row verdict stamps sweeping down a list, one wave
 * per clause (Jatho DX0M t011-t013: FAKE/REAL chips land row by row). NOT
 * the banned frame-filling stamp_slam — these are ≤120px row chips.
 *
 * NEW TYPE 2026-08-09. Verdict chips are typographic (✓/✗ drawn as SVG
 * strokes, no emoji).
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useEntrance } from "../motion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface RowBadgeItem {
  label: string;
  /** "yes" = green check chip, "no" = red cross chip. */
  verdict: "yes" | "no";
  /** Optional chip text override — e.g. "עובד", "מת". */
  chip_text?: string;
}

export interface RowBadgeWaveScene {
  type: "row_badge_wave";
  id: string;
  start: number;
  end: number;
  rows: RowBadgeItem[];
  headline?: string;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: RowBadgeWaveScene;
}

export const RowBadgeWave: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const rows = scene.rows.slice(0, 4);
  const entrance = useEntrance({ signature: "glass-rise", durationSec: 0.4 });
  const accent = toneColor(scene.tone ?? "brand");

  const stampAt = (i: number) => Math.round((0.7 + i * 0.4) * fps);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ ...entrance, display: "flex", flexDirection: "column", gap: 12, width: 560 }}>
          {scene.headline && (
            <div
              style={{
                textAlign: "center",
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 34,
                color: "#FFFFFF",
                direction: "rtl",
                textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                marginBottom: 4,
              }}
            >
              <span style={{ color: accent, textShadow: `0 0 20px ${toneGlow(scene.tone ?? "brand")}` }}>
                {scene.headline}
              </span>
            </div>
          )}
          {rows.map((r, i) => {
            const rowEnter = interpolate(
              frame,
              [Math.round(i * 0.1 * fps), Math.round((i * 0.1 + 0.32) * fps)],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glass-rise") },
            );
            const stampT = interpolate(
              frame,
              [stampAt(i), stampAt(i) + Math.round(0.22 * fps)],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
            );
            const good = r.verdict === "yes";
            const chipColor = good ? "#2FA35C" : "#C43D3D";
            const dim = stampT > 0.5 && !good;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 18,
                  padding: "15px 22px",
                  borderRadius: 18,
                  direction: "rtl",
                  background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
                  border: `1.5px solid ${stampT > 0.5 ? (good ? "rgba(47,163,92,0.6)" : "rgba(196,61,61,0.55)") : "rgba(255,255,255,0.14)"}`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 14px 32px rgba(0,0,0,0.45)",
                  opacity: rowEnter * (dim ? 0.65 : 1),
                  transform: `translateY(${(1 - rowEnter) * 24}px)`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 700,
                    fontSize: 28,
                    color: dim ? "rgba(255,255,255,0.55)" : "#FFFFFF",
                    textDecoration: dim ? "line-through" : "none",
                    textDecorationColor: "rgba(255,255,255,0.5)",
                  }}
                >
                  {r.label}
                </span>
                {/* verdict chip — slams with rotation, ≤120px */}
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 16px",
                    borderRadius: 12,
                    background: chipColor,
                    transform: `scale(${stampT}) rotate(${(1 - stampT) * (good ? 10 : -10)}deg)`,
                    opacity: stampT,
                    boxShadow: "0 8px 18px rgba(0,0,0,0.5)",
                    flexShrink: 0,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
                    {good ? <polyline points="20 6 9 17 4 12" /> : <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>}
                  </svg>
                  {r.chip_text && (
                    <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 20, color: "#FFF" }}>
                      {r.chip_text}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
