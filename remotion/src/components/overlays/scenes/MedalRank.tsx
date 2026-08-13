/**
 * MedalRank — gold/silver/bronze ranking chips on 2-3 item rows (Jatho DSh8
 * t037: medal chips land on ranked items while he points at them). Rows
 * cascade in, then medals SLAM on one per beat, gold last (best-for-last
 * tension per playbook §1.3).
 *
 * NEW TYPE 2026-08-09. No emoji — the medals are drawn chips.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useEntrance } from "../motion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneGlow, type Tone } from "../../../design/tokens";

export interface MedalRankItem {
  /** Item label. */
  label: string;
}

export interface MedalRankScene {
  type: "medal_rank";
  id: string;
  start: number;
  end: number;
  /** Items ordered rank 1 → N (2-3 best). */
  items: MedalRankItem[];
  /** Optional headline above. */
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
  scene: MedalRankScene;
}

const MEDALS = [
  { fill: "linear-gradient(135deg, #FFD75E 0%, #C9971C 100%)", ring: "#FFD75E", label: "1" },
  { fill: "linear-gradient(135deg, #DDE3EA 0%, #97A1AC 100%)", ring: "#C8D0D9", label: "2" },
  { fill: "linear-gradient(135deg, #E29A63 0%, #9C5B27 100%)", ring: "#D98F55", label: "3" },
];

export const MedalRank: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const items = scene.items.slice(0, 3);
  const entrance = useEntrance({ signature: "stack-cascade", durationSec: 0.45 });

  // Medals land WORST-FIRST (bronze → gold): best-for-last tension.
  const medalAt = (rank: number) =>
    Math.round((0.8 + (items.length - 1 - rank) * 0.45) * fps);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ ...entrance, display: "flex", flexDirection: "column", gap: 14, width: 560 }}>
          {scene.headline && (
            <div
              style={{
                textAlign: "center",
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 34,
                color: "#FFFFFF",
                direction: "rtl",
                textShadow: "0 2px 10px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.6)",
                marginBottom: 4,
              }}
            >
              {scene.headline}
            </div>
          )}
          {items.map((it, rank) => {
            const slamT = interpolate(
              frame,
              [medalAt(rank), medalAt(rank) + Math.round(0.28 * fps)],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
            );
            const isGold = rank === 0;
            const rowEnter = interpolate(
              frame,
              [Math.round(rank * 0.12 * fps), Math.round((rank * 0.12 + 0.35) * fps)],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glass-rise") },
            );
            const medal = MEDALS[rank] ?? MEDALS[2];
            return (
              <div
                key={rank}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "16px 22px",
                  borderRadius: 20,
                  direction: "rtl",
                  background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
                  border: `1.5px solid ${isGold && slamT > 0.5 ? medal.ring : "rgba(255,255,255,0.14)"}`,
                  boxShadow: isGold && slamT > 0.5
                    ? `0 18px 44px rgba(0,0,0,0.5), 0 0 26px rgba(255,215,94,0.35)`
                    : "inset 0 1px 0 rgba(255,255,255,0.1), 0 14px 34px rgba(0,0,0,0.45)",
                  opacity: rowEnter,
                  transform: `translateY(${(1 - rowEnter) * 26}px) scale(${isGold ? 1 + 0.05 * slamT : 1})`,
                }}
              >
                {/* medal chip — slams in with rotation */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: medal.fill,
                    border: "3px solid rgba(255,255,255,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 900,
                    fontSize: 30,
                    color: "#2B2202",
                    transform: `scale(${slamT}) rotate(${(1 - slamT) * -30}deg)`,
                    opacity: slamT,
                    boxShadow: `0 8px 18px rgba(0,0,0,0.5)${isGold && slamT > 0.5 ? `, 0 0 22px ${accentGlow}` : ""}`,
                  }}
                >
                  {medal.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 800,
                    fontSize: 30,
                    color: isGold && slamT > 0.5 ? "#FFFFFF" : "rgba(255,255,255,0.82)",
                  }}
                >
                  {it.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
