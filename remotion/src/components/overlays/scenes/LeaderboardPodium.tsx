/**
 * LeaderboardPodium — visual metaphor for "top 3", "the winners", "best of".
 *
 * A classic Olympic-style podium inside a glass card: 3 columns of
 * different heights (2nd / 1st / 3rd from left to right is the
 * conventional layout), each with a name + score + medal color (gold /
 * silver / bronze). Columns rise from the floor in order: 3rd → 2nd → 1st.
 * The winner gets a small crown / sparkle.
 *
 * The label rows (name + score + sublabel) are aligned at a single baseline
 * ABOVE the podium row so the three names read as a clean horizontal trio
 * instead of staircasing with the column heights.
 *
 * Use cases:
 *   - "שלושת המובילים" → 3 names + scores
 *   - "best of 2026" → top 3 with crowns
 *   - "our top performers" → 3 team members ranked
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance } from "../motion";
import {
  GlassCard,
  Eyebrow,
  HaloGlow,
  resolveAnchor,
  type OverlayAnchor,
} from "../primitives";
import {
  COLORS,
  FONTS,
  RADIUS,
  easeFn,
  type Tone,
} from "../../../design/tokens";

export interface PodiumEntry {
  name: string;
  score: string;
  /** Optional sublabel under the score. e.g. "points", "USD". */
  sublabel?: string;
}

export interface LeaderboardPodiumScene {
  type: "leaderboard_podium";
  id: string;
  start: number;
  end: number;
  /** Top 3 entries — index 0 is 1st place. */
  entries: [PodiumEntry, PodiumEntry, PodiumEntry];
  /** Optional eyebrow. e.g. "TOP 3 PERFORMERS", "שלושת המובילים". */
  eyebrow?: string;
  /** Optional title above the podium. e.g. "Best of 2026". */
  title?: string;
  /** Tone override — only affects the halo. Medals are gold/silver/bronze. */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: LeaderboardPodiumScene;
}

const MEDAL = {
  gold:   { base: "#F5C842", dark: "#B88A1F", glow: "rgba(245,200,66,0.55)" },
  silver: { base: "#D4D7DB", dark: "#999CA3", glow: "rgba(212,215,219,0.45)" },
  bronze: { base: "#CD8950", dark: "#8B5A33", glow: "rgba(205,137,80,0.55)" },
};

const COL_WIDTH = 130;
const COL_GAP = 12;

export const LeaderboardPodium: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });

  const rise = (startSec: number) =>
    interpolate(
      frame,
      [Math.round(startSec * fps), Math.round((startSec + 0.45) * fps)],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easeFn("bounce-soft"),
      },
    );

  const t1 = rise(1.15);
  const t2 = rise(0.85);
  const t3 = rise(0.55);

  // Visual order: 2nd / 1st / 3rd (Olympic layout)
  const ordered: Array<{ rank: 1 | 2 | 3; entry: PodiumEntry; t: number; height: number; medal: typeof MEDAL["gold"]; isWinner?: boolean }> = [
    { rank: 2, entry: scene.entries[1], t: t2, height: 155, medal: MEDAL.silver },
    { rank: 1, entry: scene.entries[0], t: t1, height: 200, medal: MEDAL.gold, isWinner: true },
    { rank: 3, entry: scene.entries[2], t: t3, height: 120, medal: MEDAL.bronze },
  ];

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material="liquid"
            padding="26px 36px"
            rtl={false}
            style={{ minWidth: 520 }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 13, marginBottom: 8, textAlign: "center" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}
            {scene.title && (
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 24,
                  fontWeight: 800,
                  color: COLORS.text,
                  textAlign: "center",
                  marginBottom: 20,
                  letterSpacing: "-0.01em",
                }}
              >
                {scene.title}
              </div>
            )}

            {/* Label row — 3 cells, all at the same Y baseline */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: COL_GAP,
                marginBottom: 14,
              }}
            >
              {ordered.map(({ rank, entry, t, medal, isWinner }) => {
                const labelOpacity = t > 0.4 ? (t - 0.4) / 0.6 : 0;
                return (
                  <div
                    key={`lbl-${rank}`}
                    style={{
                      width: COL_WIDTH,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      opacity: labelOpacity,
                      transform: `translateY(${(1 - labelOpacity) * 6}px)`,
                      willChange: "opacity, transform",
                    }}
                  >
                    {isWinner && (
                      <div
                        style={{
                          fontSize: 20,
                          marginBottom: -2,
                          filter: `drop-shadow(0 0 8px ${medal.glow})`,
                        }}
                      >
                        👑
                      </div>
                    )}
                    <div
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 14,
                        fontWeight: 700,
                        color: COLORS.text,
                        textAlign: "center",
                        maxWidth: COL_WIDTH,
                        letterSpacing: "-0.005em",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {entry.name}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.display,
                        fontSize: isWinner ? 22 : 18,
                        fontWeight: 900,
                        color: medal.base,
                        letterSpacing: "-0.01em",
                        textShadow: `0 0 ${isWinner ? 12 : 6}px ${medal.glow}`,
                        marginTop: 2,
                      }}
                    >
                      {entry.score}
                    </div>
                    {entry.sublabel && (
                      <div
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 10,
                          fontWeight: 600,
                          color: COLORS.textTertiary,
                          letterSpacing: "0.10em",
                          textTransform: "uppercase",
                          marginTop: 2,
                        }}
                      >
                        {entry.sublabel}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Podium row — columns aligned at bottom, varying heights */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: COL_GAP,
                height: 200,
              }}
            >
              {ordered.map(({ rank, t, height, medal }) => (
                <div
                  key={`col-${rank}`}
                  style={{
                    width: COL_WIDTH,
                    height: height * t,
                    borderRadius: `${RADIUS.md}px ${RADIUS.md}px 0 0`,
                    background: `linear-gradient(180deg, ${medal.base}, ${medal.dark})`,
                    border: `1px solid ${medal.base}`,
                    boxShadow: `
                      inset 0 1px 0 rgba(255,255,255,0.30),
                      inset 0 -3px 0 rgba(0,0,0,0.25),
                      0 0 ${24 * t}px ${medal.glow}
                    `,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    paddingTop: 12,
                    willChange: "height",
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: 42,
                      fontWeight: 900,
                      color: "rgba(255,255,255,0.95)",
                      letterSpacing: "-0.02em",
                      textShadow: "0 1px 2px rgba(0,0,0,0.30)",
                      opacity: t,
                    }}
                  >
                    {rank}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35 + t1 * 0.2, pointerEvents: "none" }}>
            <HaloGlow
              tone={tone}
              size={680}
              intensity={0.4}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}
