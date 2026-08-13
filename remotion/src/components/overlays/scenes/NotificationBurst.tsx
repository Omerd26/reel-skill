/**
 * NotificationBurst — "הטלפון מתפוצץ": 4-6 notifications RAIN onto a stack
 * rapid-fire, each shoving the pile down, with a counter badge climbing.
 * The aspirational blowing-up moment (Jatho Dau4 ends on exactly this
 * feeling). Generic dark notification chrome.
 *
 * NEW TYPE 2026-08-09.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface NotificationBurstScene {
  type: "notification_burst";
  id: string;
  start: number;
  end: number;
  /** Sender/app label on every card — e.g. "אינסטגרם". */
  app_name: string;
  /** 3-6 notification lines, newest lands on top. */
  titles: string[];
  /** Counter badge target (e.g. 47 = "+47"). Default = titles count. */
  badge_count?: number;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: NotificationBurstScene;
}

export const NotificationBurst: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const titles = scene.titles.slice(0, 6);

  const dropAt = (i: number) => Math.round((0.25 + i * 0.38) * fps);
  const landed = titles.filter((_, i) => frame >= dropAt(i) + Math.round(0.2 * fps)).length;
  const badgeTarget = scene.badge_count ?? titles.length;
  const badgeShown = Math.min(badgeTarget, Math.max(0, Math.round((landed / titles.length) * badgeTarget)));
  // Badge pops on every increment.
  const lastLand = landed > 0 ? dropAt(landed - 1) + Math.round(0.2 * fps) : 0;
  const badgePop = interpolate(frame, [lastLand, lastLand + Math.round(0.18 * fps)], [1.35, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft"),
  });

  const CARD_H = 86;
  const VISIBLE = 4;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ position: "relative", width: 560 }}>
          {/* counter badge */}
          {landed > 0 && (
            <div
              style={{
                position: "absolute",
                top: -26,
                left: -18,
                zIndex: 10,
                minWidth: 62,
                height: 62,
                borderRadius: 31,
                padding: "0 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${accent}, #a3540f)`,
                border: "3px solid rgba(255,255,255,0.85)",
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 30,
                color: "#FFF",
                direction: "ltr",
                transform: `scale(${badgePop})`,
                boxShadow: `0 10px 24px rgba(0,0,0,0.5), 0 0 22px ${accentGlow}`,
              }}
            >
              +{badgeShown}
            </div>
          )}
          {/* the stack — newest card lands on TOP, pile shoves down */}
          <div style={{ position: "relative", height: CARD_H * VISIBLE + 40 }}>
            {titles.map((t, i) => {
              const df = dropAt(i);
              if (frame < df) return null;
              const dropT = interpolate(frame, [df, df + Math.round(0.22 * fps)], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm"),
              });
              // Depth = how many landed AFTER this one.
              const depth = titles.filter((_, j) => j > i && frame >= dropAt(j)).length;
              if (depth >= VISIBLE) return null;
              const y = depth * (CARD_H * 0.42) + (1 - dropT) * -90;
              const s = 1 - depth * 0.05;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 6 - depth,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    height: CARD_H,
                    padding: "0 20px",
                    borderRadius: 20,
                    direction: "rtl",
                    background: depth === 0
                      ? "linear-gradient(180deg, #26272F 0%, #1A1B22 100%)"
                      : "linear-gradient(180deg, #1E1F26 0%, #16171D 100%)",
                    border: `1px solid ${depth === 0 && dropT > 0.6 ? accent : "rgba(255,255,255,0.13)"}`,
                    boxShadow: depth === 0
                      ? `0 16px 36px rgba(0,0,0,0.55)${dropT > 0.6 ? `, 0 0 18px ${accentGlow}` : ""}`
                      : "0 8px 20px rgba(0,0,0,0.4)",
                    opacity: dropT * (1 - depth * 0.18),
                    transform: `translateY(${y}px) scale(${s})`,
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 13,
                      flexShrink: 0,
                      background: `linear-gradient(135deg, ${accent}, #a3540f)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: 900,
                      fontSize: 24,
                      color: "#FFF",
                    }}
                  >
                    {scene.app_name.slice(0, 1)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 20, color: "rgba(255,255,255,0.65)" }}>
                      {scene.app_name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Heebo', sans-serif",
                        fontWeight: 700,
                        fontSize: 24,
                        color: "#FFFFFF",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
