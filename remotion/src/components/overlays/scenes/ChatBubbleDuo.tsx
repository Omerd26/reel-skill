/**
 * ChatBubbleDuo — a 2-3 message chat exchange dramatized: incoming bubble
 * pops, typing-dots think, reply slides in. For "מישהו שלח לי", "התגובות
 * שאני מקבל", DM funnels. Generic dark chat chrome (no real app branding).
 *
 * NEW TYPE 2026-08-09.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useEntrance } from "../motion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface ChatBubbleMessage {
  text: string;
  /** "in" = left/gray (them), "out" = right/brand (us). */
  side: "in" | "out";
}

export interface ChatBubbleDuoScene {
  type: "chat_bubble_duo";
  id: string;
  start: number;
  end: number;
  /** 2-3 messages, shown in order with typing-dots between. */
  messages: ChatBubbleMessage[];
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: ChatBubbleDuoScene;
}

export const ChatBubbleDuo: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const entrance = useEntrance({ signature: "glass-rise", durationSec: 0.35 });
  const messages = scene.messages.slice(0, 3);

  // Each message: typing dots for 0.45s, then the bubble pops.
  const msgStart = (i: number) => Math.round((0.3 + i * 0.95) * fps);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ ...entrance, width: 560, display: "flex", flexDirection: "column", gap: 12, direction: "rtl" }}>
          {messages.map((m, i) => {
            const start = msgStart(i);
            const dotsPhase = frame >= start && frame < start + Math.round(0.45 * fps);
            const popT = interpolate(
              frame,
              [start + Math.round(0.45 * fps), start + Math.round(0.68 * fps)],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
            );
            const isOut = m.side === "out";
            if (frame < start) return null;
            return (
              <div key={i} style={{ display: "flex", justifyContent: isOut ? "flex-start" : "flex-end" }}>
                {dotsPhase ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                      padding: "16px 20px",
                      borderRadius: 22,
                      background: "linear-gradient(180deg, #23242C 0%, #191A20 100%)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {[0, 1, 2].map((d) => (
                      <div
                        key={d}
                        style={{
                          width: 11,
                          height: 11,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.55)",
                          transform: `translateY(${Math.sin((frame - start) / 3 + d * 1.1) * 3.5}px)`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      maxWidth: 420,
                      padding: "15px 22px",
                      borderRadius: 22,
                      [isOut ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 6,
                      background: isOut
                        ? `linear-gradient(135deg, ${accent}, #a3540f)`
                        : "linear-gradient(180deg, #26272F 0%, #1A1B22 100%)",
                      border: isOut ? "none" : "1px solid rgba(255,255,255,0.14)",
                      boxShadow: isOut
                        ? `0 12px 28px rgba(0,0,0,0.45), 0 0 ${16 * popT}px ${accentGlow}`
                        : "0 12px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
                      opacity: popT,
                      transform: `scale(${0.5 + 0.5 * popT}) translateY(${(1 - popT) * 14}px)`,
                      transformOrigin: isOut ? "bottom right" : "bottom left",
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: 600,
                      fontSize: 26,
                      lineHeight: 1.35,
                      color: "#FFFFFF",
                    } as React.CSSProperties}
                  >
                    {m.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
