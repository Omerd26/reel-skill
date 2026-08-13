/**
 * BRollCreativeUI.tsx — Creative UI mockup scenes for B-roll.
 *
 * These scenes use recognizable real-world UI elements (iOS, macOS, Chrome, etc.)
 * as storytelling devices. The UI IS the message — not decoration.
 *
 * Philosophy: A viewer instantly recognizes a Safari search bar or an iMessage.
 * That recognition creates instant understanding. Use it.
 *
 * Scenes:
 *   - ui_search_bar:     macOS/iOS Spotlight-style search with typed query
 *   - ui_notification_stack: iOS notification center flooding with alerts
 *   - ui_browser_tabs:   Chrome tabs multiplying and overflowing (chaos)
 *   - ui_imessage:       iMessage conversation with typed messages
 *   - ui_checklist_app:  Clean todo/reminders app with items checking off
 *   - ui_screen_time:    iOS screen time / analytics with animated charts
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { SceneStage, CameraRig, type CameraPose } from "./SceneStage";
import {
  SPRING_PRESETS,
  useSceneLifecycle,
  hexToRgb,
  noise,
} from "./BRollMotion";

// ── Shared types ──────────────────────────────────────────────────────────────

export interface CreativeUIProps {
  brandColor: string;
  durationFrames: number;
  primary?: string;
  secondary?: string;
  items?: { text: string; icon?: string; sub_text?: string }[];
}

// ── UI Primitive: Frosted Glass Panel ─────────────────────────────────────────

const FrostedPanel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(30,30,35,0.85)",
      backdropFilter: "blur(40px)",
      borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.05) inset",
      ...style,
    }}
  >
    {children}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// SCENE: UI SEARCH BAR
// macOS Spotlight / iOS search — types out a query character by character.
// Feels like the viewer's own thought process.
// ══════════════════════════════════════════════════════════════════════════════

export const UISearchBar: React.FC<CreativeUIProps> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 10, 12);

  const query = primary || "למה אני שורף את כל הזמן שלי?";

  // Panel drops in
  const panelDrop = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: SPRING_PRESETS.snappy,
  });
  const panelY = interpolate(panelDrop, [0, 1], [-80, 0]);

  // Typewriter effect — characters appear one by one
  const typingStart = 14; // frames before typing begins
  const charsPerFrame = query.length / (durationFrames * 0.5);
  const visibleChars = Math.min(
    query.length,
    Math.max(0, Math.floor((frame - typingStart) * charsPerFrame)),
  );
  const typedText = query.slice(0, visibleChars);
  const isTyping = visibleChars < query.length && frame > typingStart;

  // Cursor blink
  const cursorVisible = isTyping || Math.floor(frame / 16) % 2 === 0;

  // Search results appear after typing finishes
  const typingDone = visibleChars >= query.length;
  const resultsDelay = typingDone ? frame - (typingStart + query.length / charsPerFrame) : -999;
  const resultsReveal = spring({
    frame: Math.max(0, resultsDelay - 4),
    fps,
    config: SPRING_PRESETS.smooth,
  });

  // Subtle result items
  const resultItems = secondary
    ? secondary.split("|").map((s) => s.trim())
    : ["חפש ביוטיוב...", "שאל את ChatGPT", "מדריך לכתיבת תסריט"];

  return (
    <AbsoluteFill style={{ background: "#0A0A0F", opacity: lifecycle }}>
      {/* Subtle ambient gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 80% 50% at 50% 40%, rgba(${rgb},0.04) 0%, transparent 70%)`,
        }}
      />

      {/* Spotlight search panel */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: 60,
          right: 60,
          transform: `translateY(${panelY}px)`,
          opacity: panelDrop * lifecycle,
        }}
      >
        <FrostedPanel style={{ padding: 0, overflow: "hidden" }}>
          {/* Search input row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row-reverse",
              alignItems: "center",
              padding: "22px 28px",
              gap: 16,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Search icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
              <line
                x1="16.5"
                y1="16.5"
                x2="21"
                y2="21"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            {/* Typed text */}
            <div
              style={{
                flex: 1,
                fontFamily: "'Heebo', -apple-system, sans-serif",
                fontWeight: 500,
                fontSize: 32,
                color: "#FFFFFF",
                direction: "rtl",
                minHeight: 40,
                display: "flex",
                alignItems: "center",
              }}
            >
              {typedText}
              {/* Cursor */}
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 32,
                  background: brandColor,
                  marginRight: 2,
                  opacity: cursorVisible ? 1 : 0,
                  boxShadow: `0 0 8px rgba(${rgb},0.5)`,
                }}
              />
            </div>
          </div>

          {/* Search results */}
          {typingDone && (
            <div style={{ padding: "8px 0" }}>
              {resultItems.map((item, i) => {
                const itemProg = spring({
                  frame: Math.max(0, resultsDelay - 4 - i * 3),
                  fps,
                  config: SPRING_PRESETS.smooth,
                });
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      padding: "14px 28px",
                      gap: 14,
                      opacity: itemProg,
                      transform: `translateY(${interpolate(itemProg, [0, 1], [10, 0])}px)`,
                      background:
                        i === 0 ? `rgba(${rgb},0.1)` : "transparent",
                      borderRadius: i === 0 ? 10 : 0,
                      margin: i === 0 ? "0 8px" : 0,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background:
                          i === 0
                            ? brandColor
                            : "rgba(255,255,255,0.15)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Heebo', sans-serif",
                        fontWeight: i === 0 ? 700 : 400,
                        fontSize: 24,
                        color:
                          i === 0
                            ? "#FFFFFF"
                            : "rgba(255,255,255,0.4)",
                        direction: "rtl",
                      }}
                    >
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </FrostedPanel>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE: UI BROWSER TABS
// Chrome-style tabs multiplying and overflowing — visual chaos of open tabs.
// Conveys overwhelm, disorganization, scattered attention.
// ══════════════════════════════════════════════════════════════════════════════

export const UIBrowserTabs: React.FC<CreativeUIProps> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  const tabLabels = items?.map((i) => i.text) || [
    "איך לכתוב תסריט...",
    "YouTube — טיפים ל...",
    "ChatGPT",
    "Google Docs — טיוטה 3",
    "אינסטגרם — ריסרץ'",
    "Canva — עריכה",
    "WhatsApp Web",
    "Gmail — 47 הודעות",
    "טיימר — 00:00",
    "Notion — רעיונות",
    "Calendar — היום",
    "Slack — 12 הודעות",
  ];

  // Tabs appear one by one, increasingly fast
  const STAGGER_START = 10;
  const STAGGER_ACCEL = 0.7; // each tab comes faster

  // Browser chrome
  const chromeDrop = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: SPRING_PRESETS.snappy,
  });

  return (
    <AbsoluteFill style={{ background: "#0D0D12", opacity: lifecycle }}>
      {/* Browser window */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: 30,
          right: 30,
          bottom: "15%",
          opacity: chromeDrop * lifecycle,
          transform: `translateY(${interpolate(chromeDrop, [0, 1], [30, 0])}px)`,
        }}
      >
        {/* Title bar with traffic lights */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 20px",
            background: "rgba(40,40,48,0.95)",
            borderRadius: "16px 16px 0 0",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#FF5F57" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#28CA42" }} />
          <div
            style={{
              marginRight: "auto",
              marginLeft: 20,
              fontFamily: "monospace",
              fontSize: 13,
              color: "rgba(255,255,255,0.25)",
            }}
          >
            {tabLabels.length} tabs
          </div>
        </div>

        {/* Tab bar — overflowing */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            padding: "8px 8px",
            background: "rgba(30,30,38,0.95)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            maxHeight: 280,
            overflow: "hidden",
          }}
        >
          {tabLabels.map((label, i) => {
            const staggerDelay =
              STAGGER_START + i * Math.max(2, 8 - i * STAGGER_ACCEL);
            const tabProg = spring({
              frame: Math.max(0, frame - staggerDelay),
              fps,
              config: SPRING_PRESETS.pop,
            });
            const isActive = i === tabLabels.length - 1 && tabProg > 0.5;

            return (
              <div
                key={i}
                style={{
                  flex: "0 0 auto",
                  maxWidth: 200,
                  padding: "8px 14px",
                  background: isActive
                    ? `rgba(${rgb},0.2)`
                    : "rgba(255,255,255,0.04)",
                  borderRadius: "8px 8px 0 0",
                  border: isActive
                    ? `1px solid rgba(${rgb},0.3)`
                    : "1px solid rgba(255,255,255,0.04)",
                  borderBottom: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: tabProg,
                  transform: `scale(${interpolate(tabProg, [0, 1], [0.8, 1])})`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isActive
                      ? brandColor
                      : `hsl(${(i * 47) % 360}, 50%, 50%)`,
                    flexShrink: 0,
                    opacity: 0.6,
                  }}
                />
                <span
                  style={{
                    fontFamily: "-apple-system, sans-serif",
                    fontSize: 13,
                    color: isActive ? "#FFF" : "rgba(255,255,255,0.4)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    direction: "rtl",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.2)",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  ×
                </span>
              </div>
            );
          })}
        </div>

        {/* Page content area — mostly empty/dark */}
        <div
          style={{
            flex: 1,
            background: "rgba(20,20,28,0.95)",
            borderRadius: "0 0 16px 16px",
            padding: "40px 30px",
            minHeight: 600,
          }}
        >
          {/* Fake page content — loading lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 14,
                width: `${50 + noise(i, 99) * 40}%`,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 7,
                marginBottom: 16,
              }}
            />
          ))}
          {/* Empty state text */}
          <div
            style={{
              position: "absolute",
              top: "55%",
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: 0.15,
              fontFamily: "'Heebo', sans-serif",
              fontSize: 20,
              color: "#FFF",
            }}
          >
            ...
          </div>
        </div>
      </div>

      {/* Label at bottom */}
      {primary && (
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            left: 0,
            right: 0,
            textAlign: "center",
            opacity:
              interpolate(frame, [durationFrames * 0.4, durationFrames * 0.55], [0, 1], {
                extrapolateRight: "clamp",
                extrapolateLeft: "clamp",
              }) * lifecycle,
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(0,0,0,0.5)",
              padding: "10px 28px",
              borderRadius: 12,
            }}
          >
            <span
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 800,
                fontSize: 30,
                color: "#FFF",
                direction: "rtl",
              }}
            >
              {primary}
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE: UI IMESSAGE
// iMessage-style conversation that types itself out.
// Powerful for internal monologue, Q&A, objection handling.
// ══════════════════════════════════════════════════════════════════════════════

export const UIiMessage: React.FC<CreativeUIProps> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  // Messages — alternate left (gray) and right (blue/brand)
  const messages = items?.map((i) => i.text) || [
    primary || "למה הסרטונים שלי לא עובדים?",
    "כי אתה מצלם בלי תסריט",
    "אבל תסריט הורג אותנטיות...",
    "לא. תסריט נותן שליטה.",
  ];

  const STAGGER = Math.floor(durationFrames / (messages.length + 1));

  return (
    <AbsoluteFill style={{ background: "#0A0A0F", opacity: lifecycle }}>
      {/* iMessage header */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: 50,
          right: 50,
          textAlign: "center",
        }}
      >
        {/* Contact avatar */}
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${brandColor}, rgba(${rgb},0.6))`,
            margin: "0 auto 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: lifecycle,
          }}
        >
          <span style={{ fontSize: 30, color: "#FFF" }}>●</span>
        </div>
        <div
          style={{
            fontFamily: "-apple-system, 'Heebo', sans-serif",
            fontWeight: 600,
            fontSize: 22,
            color: "rgba(255,255,255,0.6)",
            opacity: lifecycle,
          }}
        >
          המוח שלך
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: 40,
          right: 40,
          bottom: "18%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 16,
        }}
      >
        {messages.map((msg, i) => {
          const isRight = i % 2 === 1; // odd = right (answer)
          const delay = 6 + i * STAGGER;

          const bubbleProg = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: SPRING_PRESETS.snappy,
          });

          // Typing indicator before bubble appears
          const showTyping =
            frame >= delay - 12 && frame < delay && i > 0;

          // Typewriter within bubble
          const typeStart = delay + 4;
          const charProg = Math.min(
            msg.length,
            Math.max(0, Math.floor((frame - typeStart) * (msg.length / (STAGGER * 0.6)))),
          );
          const visibleText = bubbleProg > 0.3 ? msg.slice(0, charProg) : "";

          return (
            <div key={i}>
              {/* Typing indicator */}
              {showTyping && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: isRight ? "flex-left" : "flex-end",
                    marginBottom: 8,
                    direction: "rtl",
                  }}
                >
                  <div
                    style={{
                      background: isRight
                        ? brandColor
                        : "rgba(255,255,255,0.1)",
                      borderRadius: 18,
                      padding: "10px 18px",
                      display: "flex",
                      gap: 5,
                    }}
                  >
                    {[0, 1, 2].map((d) => (
                      <div
                        key={d}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.5)",
                          opacity:
                            0.3 +
                            Math.sin(frame * 0.15 + d * 1.2) * 0.4,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Message bubble */}
              <div
                style={{
                  display: "flex",
                  justifyContent: isRight ? "flex-start" : "flex-end",
                  opacity: bubbleProg,
                  transform: `translateY(${interpolate(bubbleProg, [0, 1], [20, 0])}px) scale(${interpolate(bubbleProg, [0, 1], [0.9, 1])})`,
                  direction: "rtl",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    background: isRight
                      ? brandColor
                      : "rgba(255,255,255,0.1)",
                    borderRadius: isRight
                      ? "20px 20px 4px 20px"
                      : "20px 20px 20px 4px",
                    padding: "14px 22px",
                    boxShadow: isRight
                      ? `0 4px 20px rgba(${rgb},0.3)`
                      : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Heebo', -apple-system, sans-serif",
                      fontWeight: isRight ? 600 : 400,
                      fontSize: 26,
                      color: "#FFFFFF",
                      lineHeight: 1.4,
                      direction: "rtl",
                    }}
                  >
                    {visibleText || "\u00A0"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* iMessage input bar */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          left: 40,
          right: 40,
          opacity: 0.4 * lifecycle,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 22,
            padding: "14px 24px",
            border: "1px solid rgba(255,255,255,0.08)",
            fontFamily: "'Heebo', sans-serif",
            fontSize: 18,
            color: "rgba(255,255,255,0.25)",
            direction: "rtl",
          }}
        >
          iMessage
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE: UI CHECKLIST APP
// Clean Reminders/Todo app where items check themselves off.
// Conveys: completion, control, having a plan.
// ══════════════════════════════════════════════════════════════════════════════

export const UIChecklistApp: React.FC<CreativeUIProps> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  // REFERENCE GRADE (BROLL_STYLE_SPEC.md §2.4) — the old version was a distant
  // frosted panel with 26px rows: a screenshot at arm's length. This is the
  // 1.8× physical-surface treatment: ONE oversized iOS-style card, tilted,
  // cropped at the edges, and a camera that PANS DOWN the list so the active
  // row always sits at optical center. Checks land with a spring pop, an
  // expanding ripple and a 1-frame card jolt (the haptic).
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);

  const checkItems = items?.map((i) => i.text) || [
    "כתוב הוק חזק",
    "הוסף דוגמה אישית",
    "סגור עם CTA",
    "בדוק אורך 30-60 שניות",
    "צלם!",
  ];
  const n = checkItems.length;

  // Check schedule: item k checks at checkAt(k); entrance takes the first 15f.
  const first = 18;
  const per = Math.max(16, Math.floor((durationFrames - first - 12) / n));
  const checkAt = (k: number) => first + k * per;
  const checkedCount = checkItems.reduce((acc, _, k) => acc + (frame >= checkAt(k) ? 1 : 0), 0);
  const activeIdx = Math.min(n - 1, Math.max(0, checkedCount - (frame >= checkAt(checkedCount - 1) + 8 ? 0 : 1)));

  // Card geometry: 115% frame width, tilted -2°, rows 150px tall.
  const CARD_W = 1242;
  const ROW_H = 150;
  const HEADER_H = 250;

  // Camera pans down so the active row sits at optical center (~y830).
  // WORLD coordinates: card top (260) + status bar (64) + header block
  // (~150) + k rows. The first version measured from the card's inside and
  // ignored the 260px card offset — the owner saw the composition "קטוע".
  const CARD_TOP = 260;
  const HEADER_OFFSET = 64 + 150;
  const rowCenterY = (k: number) => CARD_TOP + HEADER_OFFSET + k * ROW_H + ROW_H / 2;
  const CAM_SCALE = 1.04;
  const poses: CameraPose[] = checkItems.map((_, k) => ({
    frame: checkAt(k) - 6,
    x: (1080 - 1080 * CAM_SCALE) / 2,
    y: 830 - rowCenterY(k) * CAM_SCALE,
    scale: CAM_SCALE,
  }));
  poses.unshift({ frame: 0, x: (1080 - 1080 * CAM_SCALE) / 2, y: 830 - rowCenterY(0) * CAM_SCALE, scale: CAM_SCALE });

  // Haptic jolt: 1-frame 4px drop when a check lands.
  const justChecked = checkItems.some((_, k) => frame >= checkAt(k) && frame < checkAt(k) + 2);
  // Progress ring in the header.
  const ringP = checkedCount / n;
  const RING_R = 44;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <SceneStage accent={brandColor} seed={7} floorShadowAt={0.82}>
      <CameraRig poses={poses} settleDrift={false}>
        <div
          style={{
            position: "absolute",
            left: (1080 - CARD_W) / 2,
            top: 260,
            width: CARD_W,
            borderRadius: 44,
            transform: `rotate(-2deg) translateY(${justChecked ? 4 : 0}px)`,
            background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.14), 0 60px 120px -30px rgba(0,0,0,0.7)" +
              (justChecked ? `, 0 60px 120px -30px rgba(${rgb},0.25)` : ""),
            overflow: "hidden",
            direction: "rtl",
          }}
        >
          {/* iOS chrome: status bar */}
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 44px",
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 700,
              fontSize: 26,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            <span style={{ letterSpacing: 1 }}>9:41</span>
            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ width: 34, height: 14, borderRadius: 4, border: "2px solid rgba(255,255,255,0.7)", position: "relative" }}>
                <span style={{ position: "absolute", inset: 2, right: 8, background: "rgba(255,255,255,0.85)", borderRadius: 1 }} />
              </span>
            </span>
          </div>

          {/* Big-title header + progress ring */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 44px 26px",
            }}
          >
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 64,
                color: "#FFFFFF",
                lineHeight: 1.1,
              }}
            >
              {primary || "רשימת היום"}
            </div>
            <svg width={104} height={104} viewBox="0 0 104 104">
              <circle cx={52} cy={52} r={RING_R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={9} />
              <circle
                cx={52}
                cy={52}
                r={RING_R}
                fill="none"
                stroke={brandColor}
                strokeWidth={9}
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - ringP)}
                transform="rotate(-90 52 52)"
                style={{ filter: `drop-shadow(0 0 10px rgba(${rgb},0.7))` }}
              />
              <text
                x={52}
                y={60}
                textAnchor="middle"
                fontFamily="'Heebo', sans-serif"
                fontWeight={900}
                fontSize={28}
                fill="#FFFFFF"
              >
                {checkedCount}/{n}
              </text>
            </svg>
          </div>

          {/* Rows */}
          {checkItems.map((text, k) => {
            const done = frame >= checkAt(k);
            const isActive = k === activeIdx && !done;
            const pop = spring({ frame: Math.max(0, frame - checkAt(k)), fps, config: { stiffness: 300, damping: 12 } });
            const rippleT = interpolate(frame, [checkAt(k), checkAt(k) + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const strike = interpolate(frame, [checkAt(k) + 3, checkAt(k) + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div
                key={k}
                style={{
                  height: ROW_H,
                  display: "flex",
                  alignItems: "center",
                  gap: 30,
                  padding: "0 44px",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  background: done ? `rgba(${rgb},0.08)` : "transparent",
                  boxShadow: done ? `inset -6px 0 0 ${brandColor}` : undefined,
                }}
              >
                {/* checkbox */}
                <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
                  {done && rippleT < 1 && (
                    <div
                      style={{
                        position: "absolute",
                        inset: -28 * rippleT,
                        borderRadius: "50%",
                        border: `3px solid rgba(${rgb},${0.7 * (1 - rippleT)})`,
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      border: done ? "none" : "3px solid rgba(255,255,255,0.35)",
                      background: done ? brandColor : "transparent",
                      transform: `scale(${done ? 0.9 + pop * 0.2 : 1})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: done ? `0 0 24px rgba(${rgb},0.5)` : undefined,
                    }}
                  >
                    {done && (
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
                {/* text + animated strikethrough */}
                <div style={{ position: "relative", minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: 600,
                      fontSize: 48,
                      lineHeight: 1.2,
                      color: done ? "rgba(255,255,255,0.35)" : isActive ? "#FFFFFF" : "rgba(255,255,255,0.8)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {text}
                  </div>
                  {done && (
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: 0,
                        width: `${strike * 100}%`,
                        height: 4,
                        borderRadius: 2,
                        background: "rgba(255,255,255,0.45)",
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <div style={{ height: 34 }} />
        </div>
      </CameraRig>
    </SceneStage>
  );
};
