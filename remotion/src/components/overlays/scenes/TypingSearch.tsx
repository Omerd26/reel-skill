/**
 * TypingSearch — a search bar live-types a query letter-by-letter, then a
 * suggestions dropdown cascades in and the top result highlights (the
 * Google-moment from Jatho DM5X: typing STARTS before the word "Google" is
 * even spoken — a plant device). Real-UI object: dark panel allowed.
 *
 * NEW TYPE 2026-08-09.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useEntrance } from "../motion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface TypingSearchScene {
  type: "typing_search";
  id: string;
  start: number;
  end: number;
  /** The query being typed. */
  query: string;
  /** 1-3 suggestion rows; the FIRST one highlights at the end. */
  suggestions?: string[];
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: TypingSearchScene;
}

const isHebrew = (s: string) => /[֐-׿]/.test(s);

export const TypingSearch: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const entrance = useEntrance({ signature: "glass-rise", durationSec: 0.35 });
  const suggestions = (scene.suggestions ?? []).slice(0, 3);
  const hebrew = isHebrew(scene.query);

  // Type-on: 2.4 frames/char starting 0.5s in (string slicing).
  const typeStart = Math.round(0.5 * fps);
  const charsShown = Math.max(0, Math.min(scene.query.length, Math.floor((frame - typeStart) / 2.4)));
  const typed = scene.query.slice(0, charsShown);
  const doneTyping = charsShown >= scene.query.length;
  const doneFrame = typeStart + Math.ceil(scene.query.length * 2.4);
  const caretOn = Math.floor(frame / 8) % 2 === 0;

  // Suggestions cascade after typing completes.
  const sugT = (i: number) =>
    interpolate(frame, [doneFrame + Math.round((0.15 + i * 0.14) * fps), doneFrame + Math.round((0.35 + i * 0.14) * fps)], [0, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glass-rise"),
    });
  // Top result highlight sweep at the end.
  const hlT = interpolate(
    frame,
    [doneFrame + Math.round(0.75 * fps), doneFrame + Math.round(1.0 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide") },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ ...entrance, width: 600 }}>
          {/* search bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "18px 24px",
              borderRadius: 999,
              direction: hebrew ? "rtl" : "ltr",
              background: "linear-gradient(180deg, #1F2028 0%, #16171D 100%)",
              border: `2px solid ${doneTyping ? accent : "rgba(255,255,255,0.2)"}`,
              boxShadow: doneTyping
                ? `0 18px 44px rgba(0,0,0,0.5), 0 0 22px ${accentGlow}`
                : "0 16px 38px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* magnifier glyph */}
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={doneTyping ? accent : "rgba(255,255,255,0.55)"} strokeWidth="2.6" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 700,
                fontSize: 30,
                color: "#FFFFFF",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {typed}
              <span
                style={{
                  display: "inline-block",
                  width: 3.5,
                  height: 32,
                  marginRight: hebrew ? 3 : 0,
                  marginLeft: hebrew ? 0 : 3,
                  verticalAlign: "-4px",
                  background: accent,
                  opacity: doneTyping ? (caretOn ? 0 : 0) : caretOn ? 1 : 0.15,
                }}
              />
            </div>
          </div>
          {/* suggestions */}
          {suggestions.length > 0 && (
            <div
              style={{
                marginTop: 10,
                borderRadius: 20,
                overflow: "hidden",
                background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 20px 46px rgba(0,0,0,0.55)",
                direction: hebrew ? "rtl" : "ltr",
              }}
            >
              {suggestions.map((s, i) => {
                const t = sugT(i);
                const isTop = i === 0;
                return (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 24px",
                      borderTop: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                      opacity: t,
                      transform: `translateY(${(1 - t) * 12}px)`,
                      background: isTop && hlT > 0 ? `rgba(224,112,30,${0.16 * hlT})` : "transparent",
                      boxShadow: isTop && hlT > 0.5 ? `inset ${hebrew ? "-4px" : "4px"} 0 0 ${accent}` : undefined,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.4" strokeLinecap="round">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.5" y2="16.5" />
                    </svg>
                    <span
                      style={{
                        fontFamily: "'Heebo', sans-serif",
                        fontWeight: isTop && hlT > 0.5 ? 800 : 600,
                        fontSize: 24,
                        color: isTop && hlT > 0.5 ? "#FFFFFF" : "rgba(255,255,255,0.75)",
                      }}
                    >
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
