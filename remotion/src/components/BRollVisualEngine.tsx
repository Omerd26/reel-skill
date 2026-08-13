/**
 * BRollVisualEngine.tsx — Visual Idea Engine scenes.
 *
 * These scenes express MEANING through recognizable visual metaphors,
 * not abstract graphics. Each one passes the "child test" —
 * a child should understand what's happening without reading text.
 *
 * New scenes:
 *   - ui_instagram_post:  IG post with live engagement counters
 *   - ui_screen_time:     iOS Screen Time report with app bars
 *   - ui_notes_app:       Apple Notes writing itself
 *   - visual_scale:       Tipping balance scale (value comparison)
 *   - visual_funnel_pour: Liquid funnel pour (wide→narrow→gold)
 *   - visual_streak:      Daily streak counter / flame (consistency)
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import {
  SPRING_PRESETS,
  useSceneLifecycle,
  hexToRgb,
  noise,
 parseSceneNumber,} from "./BRollMotion";

// ── Shared types ──────────────────────────────────────────────────────────────

export interface VisualEngineProps {
  brandColor: string;
  durationFrames: number;
  primary?: string;
  secondary?: string;
  items?: { text: string; icon?: string; sub_text?: string; value?: string }[];
}

// ── Frosted panel reusable ────────────────────────────────────────────────────

const FrostedPanel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div style={{
    background: "rgba(30,30,35,0.85)",
    backdropFilter: "blur(40px)",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.05) inset",
    ...style,
  }}>
    {children}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// UI INSTAGRAM POST — A post being built with live engagement
// ══════════════════════════════════════════════════════════════════════════════

export const UIInstagramPost: React.FC<VisualEngineProps> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 10, 10);

  // Post card drops in
  const cardDrop = spring({ frame: Math.max(0, frame - 3), fps, config: SPRING_PRESETS.snappy });

  // Engagement counters animate up after post appears
  const likeCount = Math.round(
    interpolate(frame, [fps * 0.8, durationFrames * 0.7], [0, 2847], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );
  const commentCount = Math.round(
    interpolate(frame, [fps * 1.2, durationFrames * 0.8], [0, 156], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );
  const shareCount = Math.round(
    interpolate(frame, [fps * 1.5, durationFrames * 0.85], [0, 89], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );

  // Heart burst animation
  const heartPulse = frame > fps * 0.8
    ? 1 + Math.sin((frame - fps * 0.8) * 0.2) * 0.08
    : 1;

  // Comment items appearing
  const comments = items?.map(i => i.text) || ["מדהים! ", "בול בזמן ", "שיתפתי קדימה"];

  const caption = primary || "הפוסט שהביא 3,000 לייקים ביום הראשון";

  return (
    <AbsoluteFill style={{ background: "#0A0A0F", opacity: lifecycle }}>
      <div style={{
        position: "absolute", top: "10%", left: 40, right: 40,
        opacity: cardDrop, transform: `translateY(${interpolate(cardDrop, [0, 1], [40, 0])}px)`,
      }}>
        <FrostedPanel style={{ padding: 0, overflow: "hidden" }}>
          {/* Header — profile row */}
          <div style={{
            display: "flex", flexDirection: "row-reverse", alignItems: "center",
            gap: 12, padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: `linear-gradient(135deg, ${brandColor}, #C13584, #F77737)`,
            }} />
            <div style={{ flex: 1, direction: "rtl" }}>
              <div style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 18, color: "#FFF" }}>
                {secondary || "omerd"}
              </div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 24 }}>•••</div>
          </div>

          {/* Post image area — gradient placeholder */}
          <div style={{
            width: "100%", height: 500,
            background: `linear-gradient(135deg, rgba(${rgb},0.15) 0%, rgba(${rgb},0.05) 50%, rgba(20,20,30,0.9) 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 52,
              color: "#FFFFFF", direction: "rtl", textAlign: "center",
              padding: "0 40px", lineHeight: 1.3,
              textShadow: `0 0 40px rgba(${rgb},0.3)`,
            }}>
              {caption}
            </div>
          </div>

          {/* Action buttons row */}
          <div style={{
            display: "flex", flexDirection: "row-reverse",
            padding: "14px 20px", gap: 20, alignItems: "center",
          }}>
            {/* Heart */}
            <div style={{ transform: `scale(${heartPulse})` }}>
              <svg width="30" height="30" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="#FF3040" stroke="none" />
              </svg>
            </div>
            {/* Comment */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {/* Share */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {/* Bookmark — far left */}
            <div style={{ marginLeft: "auto" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>

          {/* Engagement counters */}
          <div style={{
            padding: "0 20px 8px", direction: "rtl",
            fontFamily: "'Heebo', sans-serif",
          }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#FFF" }}>
              {likeCount.toLocaleString()} לייקים
            </span>
          </div>

          {/* Comments appearing */}
          <div style={{ padding: "4px 20px 16px" }}>
            {comments.map((c, i) => {
              const cProg = spring({
                frame: Math.max(0, frame - fps * 1.5 - i * 12), fps, config: SPRING_PRESETS.smooth,
              });
              return (
                <div key={i} style={{
                  opacity: cProg, direction: "rtl", marginBottom: 6,
                  transform: `translateY(${interpolate(cProg, [0, 1], [10, 0])}px)`,
                }}>
                  <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 600, fontSize: 15, color: "rgba(255,255,255,0.5)" }}>
                    user_{i + 1}
                  </span>
                  <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 400, fontSize: 15, color: "rgba(255,255,255,0.8)", marginRight: 8 }}>
                    {c}
                  </span>
                </div>
              );
            })}
          </div>
        </FrostedPanel>
      </div>

      {/* Floating engagement counters on the side */}
      {[
        { label: "", count: commentCount, delay: fps * 1.2, y: "35%" },
        { label: "", count: shareCount, delay: fps * 1.5, y: "45%" },
      ].map((stat, i) => {
        const sProg = spring({ frame: Math.max(0, frame - stat.delay), fps, config: SPRING_PRESETS.pop });
        return (
          <div key={i} style={{
            position: "absolute", left: 20, top: stat.y,
            opacity: sProg * lifecycle, transform: `scale(${sProg})`,
            background: "rgba(0,0,0,0.6)", borderRadius: 14,
            padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>{stat.label}</span>
            <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 22, color: "#FFF" }}>
              {stat.count}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI SCREEN TIME — iOS Screen Time showing wasted hours per app
// ══════════════════════════════════════════════════════════════════════════════

export const UIScreenTime: React.FC<VisualEngineProps> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 10, 10);

  const appData = items?.map(i => ({
    name: i.text,
    hours: parseSceneNumber(i.value || i.sub_text, 1),
    color: i.icon || brandColor,
  })) || [
    { name: "אינסטגרם", hours: 3.5, color: "#E1306C" },
    { name: "טיקטוק", hours: 2.8, color: "#00F2EA" },
    { name: "יוטיוב", hours: 2.1, color: "#FF0000" },
    { name: "ווטסאפ", hours: 1.4, color: "#25D366" },
    { name: "מייל", hours: 0.8, color: "#4285F4" },
  ];

  const totalHours = appData.reduce((s, a) => s + a.hours, 0);
  const maxHours = Math.max(...appData.map(a => a.hours));

  // Panel reveal
  const panelReveal = spring({ frame: Math.max(0, frame - 4), fps, config: SPRING_PRESETS.smooth });

  return (
    <AbsoluteFill style={{ background: "#0A0A0F", opacity: lifecycle }}>
      <div style={{
        position: "absolute", top: "27%", left: 40, right: 40, bottom: "29%",
        opacity: panelReveal, transform: `translateY(${interpolate(panelReveal, [0, 1], [30, 0])}px)`,
      }}>
        <FrostedPanel style={{ padding: "28px 24px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* Header */}
          <div style={{ direction: "rtl", marginBottom: 24 }}>
            <div style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 400, fontSize: 16, color: "rgba(255,255,255,0.4)" }}>
              זמן מסך היום
            </div>
            <div style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 56, color: "#FFF", direction: "ltr", textAlign: "right" }}>
              {interpolate(frame, [12, durationFrames * 0.4], [0, totalHours], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }).toFixed(1)}
              <span style={{ fontSize: 28, color: "rgba(255,255,255,0.5)", marginRight: 8 }}>שעות</span>
            </div>
            {primary && (
              <div style={{
                fontFamily: "'Heebo', sans-serif", fontWeight: 600, fontSize: 18,
                color: "#FF3B30", marginTop: 4,
              }}>
                ▲ {primary}
              </div>
            )}
          </div>

          {/* Hourly bar chart (like iOS) */}
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 4,
            height: 120, marginBottom: 28, padding: "0 8px",
          }}>
            {Array.from({ length: 24 }).map((_, h) => {
              const barVal = h >= 8 && h <= 22
                ? 0.2 + noise(h, 42) * 0.8
                : noise(h, 42) * 0.15;
              const barProg = spring({
                frame: Math.max(0, frame - 8 - h), fps, config: SPRING_PRESETS.snappy,
              });
              return (
                <div key={h} style={{
                  flex: 1, height: `${barVal * 100 * barProg}%`,
                  background: barVal > 0.6
                    ? `linear-gradient(180deg, ${brandColor}, rgba(${rgb},0.4))`
                    : "rgba(255,255,255,0.1)",
                  borderRadius: 3,
                }} />
              );
            })}
          </div>

          {/* App breakdown list */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
            {appData.map((app, i) => {
              const rowDelay = 20 + i * 8;
              const rowProg = spring({ frame: Math.max(0, frame - rowDelay), fps, config: SPRING_PRESETS.smooth });
              const barW = (app.hours / maxHours) * 100;
              const barFill = spring({ frame: Math.max(0, frame - rowDelay - 6), fps, config: { damping: 25, stiffness: 60 } });

              return (
                <div key={i} style={{
                  display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 12,
                  opacity: rowProg, transform: `translateX(${interpolate(rowProg, [0, 1], [20, 0])}px)`,
                }}>
                  {/* App icon circle */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: app.color, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, color: "#FFF", fontWeight: 700,
                  }}>
                    {app.name.charAt(0)}
                  </div>
                  {/* Name + bar */}
                  <div style={{ flex: 1, direction: "rtl" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 600, fontSize: 18, color: "#FFF" }}>
                        {app.name}
                      </span>
                      <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 18, color: "rgba(255,255,255,0.5)", direction: "ltr" }}>
                        {app.hours}h
                      </span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${barW * Math.min(barFill, 1)}%`,
                        background: app.color, borderRadius: 3,
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </FrostedPanel>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL SCALE — Tipping balance scale (one side heavier)
// ══════════════════════════════════════════════════════════════════════════════

export const VisualScale: React.FC<VisualEngineProps> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 10, 10);

  const leftText = secondary || "3 שעות צילום חוזר";
  const rightText = primary || "10 דקות תסריט";

  // Scale structure appears
  const structReveal = spring({ frame: Math.max(0, frame - 4), fps, config: SPRING_PRESETS.smooth });

  // Then tips to the right (right side is heavier/better)
  const tipAngle = spring({ frame: Math.max(0, frame - 20), fps, config: SPRING_PRESETS.heavy });
  const tilt = interpolate(tipAngle, [0, 1], [0, -12]); // degrees, negative = right down

  // Items drop onto plates
  const leftDrop = spring({ frame: Math.max(0, frame - 10), fps, config: SPRING_PRESETS.bouncy });
  const rightDrop = spring({ frame: Math.max(0, frame - 16), fps, config: SPRING_PRESETS.slam });

  return (
    <AbsoluteFill style={{ background: "#0A0A0F", opacity: lifecycle }}>
      {/* Subtle radial glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse 60% 40% at 50% 55%, rgba(${rgb},0.04) 0%, transparent 70%)`,
      }} />

      {/* Scale structure */}
      <div style={{
        position: "absolute", top: "30%", left: "50%",
        transform: `translate(-50%, 0) scale(${structReveal})`,
        opacity: structReveal * lifecycle,
        width: 800,
      }}>
        {/* Pivot point */}
        <div style={{
          position: "absolute", top: 0, left: "50%",
          transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "20px solid transparent", borderRight: "20px solid transparent",
          borderBottom: `30px solid rgba(${rgb},0.6)`,
        }} />

        {/* Beam — rotates */}
        <div style={{
          position: "absolute", top: 28, left: "50%",
          width: 700, height: 6,
          background: `rgba(${rgb},0.5)`,
          borderRadius: 3,
          transform: `translateX(-50%) rotate(${tilt}deg)`,
          transformOrigin: "center top",
        }}>
          {/* Left chain */}
          <div style={{
            position: "absolute", left: 30, top: 6,
            width: 2, height: 80, background: "rgba(255,255,255,0.2)",
          }} />
          {/* Right chain */}
          <div style={{
            position: "absolute", right: 30, top: 6,
            width: 2, height: 80, background: "rgba(255,255,255,0.2)",
          }} />

          {/* Left plate */}
          <div style={{
            position: "absolute", left: -30, top: 90,
            width: 160, height: 12,
            background: "rgba(255,100,100,0.3)",
            borderRadius: 6,
            border: "1px solid rgba(255,100,100,0.4)",
          }}>
            {/* Left item */}
            <div style={{
              position: "absolute", bottom: 20, left: "50%",
              transform: `translateX(-50%) translateY(${interpolate(leftDrop, [0, 1], [-60, 0])}px)`,
              opacity: leftDrop,
              background: "rgba(255,80,80,0.15)", borderRadius: 14,
              padding: "14px 22px", border: "1px solid rgba(255,80,80,0.3)",
              whiteSpace: "nowrap",
            }}>
              <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 22, color: "rgba(255,255,255,0.7)", direction: "rtl" }}>
                {leftText}
              </span>
            </div>
          </div>

          {/* Right plate */}
          <div style={{
            position: "absolute", right: -30, top: 90,
            width: 160, height: 12,
            background: `rgba(${rgb},0.3)`,
            borderRadius: 6,
            border: `1px solid rgba(${rgb},0.5)`,
          }}>
            {/* Right item — drops with slam */}
            <div style={{
              position: "absolute", bottom: 20, left: "50%",
              transform: `translateX(-50%) translateY(${interpolate(rightDrop, [0, 1], [-80, 0])}px) scale(${interpolate(rightDrop, [0, 1], [0.8, 1])})`,
              opacity: rightDrop,
              background: `rgba(${rgb},0.2)`, borderRadius: 14,
              padding: "14px 22px", border: `1px solid rgba(${rgb},0.5)`,
              whiteSpace: "nowrap",
              boxShadow: `0 0 20px rgba(${rgb},0.3)`,
            }}>
              <span style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 22, color: "#FFF", direction: "rtl" }}>
                {rightText}
              </span>
            </div>
          </div>
        </div>

        {/* Base / pillar */}
        <div style={{
          position: "absolute", top: 28, left: "50%",
          transform: "translateX(-50%)",
          width: 8, height: 200,
          background: `linear-gradient(180deg, rgba(${rgb},0.4) 0%, rgba(${rgb},0.1) 100%)`,
          borderRadius: 4,
        }} />
        <div style={{
          position: "absolute", top: 224, left: "50%",
          transform: "translateX(-50%)",
          width: 120, height: 10,
          background: `rgba(${rgb},0.3)`,
          borderRadius: 5,
        }} />
      </div>

      {/* Winner indicator */}
      <div style={{
        position: "absolute", bottom: "16%", left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(tipAngle, [0.5, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * lifecycle,
      }}>
        <span style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 28,
          color: brandColor, direction: "rtl",
        }}>
          ← שווה יותר
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL STREAK — Daily streak counter with growing flame
// ══════════════════════════════════════════════════════════════════════════════

export const VisualStreak: React.FC<VisualEngineProps> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  const streakDays = items?.map(i => i.text) || ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
  const STAGGER = 8;

  // Streak counter counts up — NaN-PROOF (2026-08-09, owner screenshot:
  // designer sent primary="∞" and parseInt made NaN). Digits → count-up;
  // no digits → the text itself is the hero (∞ works beautifully as one).
  const numMatch = /[\d][\d,]*/.exec(primary || "");
  const targetStreak = numMatch ? parseInt(numMatch[0].replace(/,/g, ""), 10) : null;
  const countProg = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 22, stiffness: 50 } });
  const currentStreak = targetStreak !== null ? Math.round(targetStreak * Math.min(countProg, 1)) : null;
  const heroText = currentStreak !== null
    ? currentStreak.toLocaleString("en-US")
    : (primary || "").trim() || "∞";

  // Flame grows with streak
  const flameScale = 0.6 + countProg * 0.5;
  const flameFlicker = 1 + Math.sin(frame * 0.2) * 0.04;

  return (
    <AbsoluteFill style={{ background: "#0A0A0F", opacity: lifecycle }}>
      {/* Warm glow behind flame */}
      <div style={{
        position: "absolute", top: "25%", left: "50%",
        width: 400, height: 400, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255,140,0,${countProg * 0.12}) 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)",
      }} />

      {/* Drawn flame (SVG — the emoji violated the no-emoji law) */}
      <div style={{
        position: "absolute", top: "22%", left: "50%",
        transform: `translate(-50%, -50%) scale(${flameScale * flameFlicker})`,
        opacity: lifecycle,
        filter: `drop-shadow(0 0 40px rgba(255,140,0,0.55))`,
      }}>
        <svg width="150" height="170" viewBox="0 0 100 115">
          <path
            d="M 50 6 C 44 28 24 36 24 62 C 24 84 36 100 50 104 C 64 100 76 84 76 62 C 76 48 68 40 62 30 C 60 42 56 46 52 48 C 56 34 54 18 50 6 Z"
            fill="url(#flameOuter)"
          />
          <path
            d="M 50 52 C 45 62 38 66 38 78 C 38 90 44 98 50 100 C 56 98 62 90 62 78 C 62 68 55 62 50 52 Z"
            fill="url(#flameInner)"
          />
          <defs>
            <linearGradient id="flameOuter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FF9D2E" />
              <stop offset="1" stopColor="#E0501E" />
            </linearGradient>
            <linearGradient id="flameInner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFE9A8" />
              <stop offset="1" stopColor="#FFB03A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Streak number */}
      <div style={{
        position: "absolute", top: "42%", left: "50%",
        transform: "translate(-50%, 0)",
        textAlign: "center", opacity: lifecycle,
      }}>
        <div style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 120,
          color: "#FFF", lineHeight: 1,
          textShadow: `0 0 40px rgba(255,140,0,0.3)`,
        }}>
          {heroText}
        </div>
        <div style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 32,
          color: "rgba(255,255,255,0.5)", marginTop: 8,
        }}>
          ימים ברצף
        </div>
      </div>

      {/* Weekly day dots */}
      <div style={{
        position: "absolute", top: "65%", left: 60, right: 60,
        display: "flex", justifyContent: "center", gap: 14,
      }}>
        {streakDays.map((day, i) => {
          const dotDelay = 20 + i * STAGGER;
          const dotProg = spring({ frame: Math.max(0, frame - dotDelay), fps, config: SPRING_PRESETS.pop });
          const isChecked = dotProg > 0.5;

          return (
            <div key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              opacity: dotProg * lifecycle,
              transform: `scale(${dotProg})`,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: isChecked ? brandColor : "rgba(255,255,255,0.06)",
                border: isChecked ? `2px solid ${brandColor}` : "2px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isChecked ? `0 0 16px rgba(${rgb},0.4)` : "none",
              }}>
                {isChecked && <span style={{ color: "#FFF", fontSize: 22, fontWeight: 900 }}></span>}
              </div>
              <span style={{
                fontFamily: "'Heebo', sans-serif", fontWeight: 600, fontSize: 16,
                color: isChecked ? "#FFF" : "rgba(255,255,255,0.3)",
              }}>
                {day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar at bottom */}
      <div style={{ position: "absolute", bottom: "12%", left: 60, right: 60 }}>
        <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min(countProg * 100, 100)}%`,
            background: `linear-gradient(90deg, ${brandColor}, #FF8C00)`,
            borderRadius: 4,
            boxShadow: `0 0 12px rgba(255,140,0,0.4)`,
          }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
