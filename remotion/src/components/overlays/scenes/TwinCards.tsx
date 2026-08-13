/**
 * TwinCards — two mini "video thumbnail" cards that MUTATE instead of being
 * replaced (Jatho DXo0 t021-t022: the same two cards gain labels + view
 * counters mid-scene — "same thing, opposite outcome"). The exit-is-a-state-
 * change law made into a scene.
 *
 * Timeline: cards pop in → beat → mutation wave (labels slam on, counters
 * roll up, the winner card lifts + glows).
 *
 * NEW TYPE 2026-08-09.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useEntrance } from "../motion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface TwinCardSide {
  /** Card title — e.g. "ריל רגיל". */
  title: string;
  /** Mutation label that slams on — e.g. "בלי הוק". */
  mutate_label?: string;
  /** Counter target rolled up during mutation — e.g. 1200. */
  counter?: number;
  /** Counter unit — e.g. "צפיות". */
  counter_unit?: string;
}

export interface TwinCardsScene {
  type: "twin_cards";
  id: string;
  start: number;
  end: number;
  left: TwinCardSide;
  right: TwinCardSide;
  /** Which card wins the mutation ("right" lifts+glows). Default right. */
  winner?: "left" | "right" | "none";
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: TwinCardsScene;
}

export const TwinCards: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const winner = scene.winner ?? "right";

  const entrance = useEntrance({ signature: "depth-pop", durationSec: 0.42 });

  // Mutation wave at 1.0s.
  const mutT = interpolate(
    frame,
    [Math.round(1.0 * fps), Math.round(1.35 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
  );
  // Counters keep rolling well past the slam (payoff grammar).
  const countT = interpolate(
    frame,
    [Math.round(1.1 * fps), Math.round(2.6 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide") },
  );

  const Card: React.FC<{ side: TwinCardSide; isWinner: boolean; flip: number }> = ({ side, isWinner, flip }) => {
    const lift = isWinner ? -14 * mutT : 4 * mutT;
    const count = side.counter !== undefined ? Math.round(side.counter * countT) : undefined;
    return (
      <div
        style={{
          width: 300,
          borderRadius: 24,
          overflow: "hidden",
          background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
          border: `2px solid ${isWinner && mutT > 0.3 ? accent : "rgba(255,255,255,0.16)"}`,
          boxShadow: isWinner && mutT > 0.3
            ? `0 24px 50px rgba(0,0,0,0.55), 0 0 ${28 * mutT}px ${accentGlow}`
            : "0 18px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          transform: `translateY(${lift}px) rotate(${flip}deg)`,
          direction: "rtl",
        }}
      >
        {/* faux video thumb area */}
        <div
          style={{
            height: 150,
            position: "relative",
            background: "linear-gradient(135deg, #23242E 0%, #191A22 60%, #14151B 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* play glyph */}
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "22px solid transparent",
              borderBottom: "22px solid transparent",
              borderLeft: `34px solid ${isWinner && mutT > 0.3 ? accent : "rgba(255,255,255,0.4)"}`,
              filter: isWinner && mutT > 0.3 ? `drop-shadow(0 0 12px ${accentGlow})` : undefined,
            }}
          />
          {/* mutation label SLAMS on */}
          {side.mutate_label && mutT > 0 && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                padding: "8px 16px",
                borderRadius: 12,
                background: isWinner ? accent : "rgba(200,45,45,0.92)",
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 24,
                color: "#FFF",
                transform: `scale(${0.4 + 0.6 * mutT}) rotate(${(1 - mutT) * -8}deg)`,
                opacity: mutT,
                boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
              }}
            >
              {side.mutate_label}
            </div>
          )}
        </div>
        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 800,
              fontSize: 27,
              color: "#FFFFFF",
            }}
          >
            {side.title}
          </div>
          {count !== undefined && (
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 36,
                color: isWinner ? accent : "rgba(255,255,255,0.75)",
                direction: "ltr",
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
                textShadow: isWinner ? `0 0 16px ${accentGlow}` : undefined,
              }}
            >
              {count.toLocaleString("en-US")}
              {side.counter_unit && (
                <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginLeft: 8 }}>
                  {side.counter_unit}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ ...entrance, display: "flex", gap: 28, direction: "rtl" }}>
          <Card side={scene.right} isWinner={winner === "right"} flip={-1.5} />
          <Card side={scene.left} isWinner={winner === "left"} flip={1.5} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
