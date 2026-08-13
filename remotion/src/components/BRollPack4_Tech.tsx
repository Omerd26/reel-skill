/**
 * BRollPack4_Tech.tsx — AI & Tech UI mockups.
 *
 * Scenes:
 *   - ui_chatgpt_chat:     ChatGPT/Claude conversation typing in real time
 *   - ui_safari_url_bar:   Safari URL bar typing → page loads
 *   - ui_terminal_command: Terminal typing command → execution → success
 *   - ui_app_store_install: App Store GET → installing → OPEN
 *   - ui_settings_toggle:  iOS Settings panel with one toggle switching on
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
  parseSceneNumber,
} from "./BRollMotion";

export interface Pack4Props {
  brandColor: string;
  durationFrames: number;
  primary?: string;
  secondary?: string;
  items?: { text: string; icon?: string; sub_text?: string; value?: string }[];
}

// ── Reusable typewriter helper ────────────────────────────────────────────────

function useTypewriter(
  text: string,
  startFrame: number,
  charsPerFrame: number,
): { visible: string; isDone: boolean } {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const count = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  return { visible: text.slice(0, count), isDone: count >= text.length };
}

// ══════════════════════════════════════════════════════════════════════════════
// UI CHATGPT CHAT — Conversation with AI typing response in real time
// ══════════════════════════════════════════════════════════════════════════════

export const UIChatGPTChat: React.FC<Pack4Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  const userQuestion = primary || "איך לכתוב הוק ויראלי?";
  const aiAnswer = secondary || "בוא נחלק את זה ל-3 רכיבים:\n1. אישית — דבר מהחיים\n2. ספציפיות — מספר/שם\n3. הפתעה — תוצאה לא צפויה";

  // User question types first
  const userTyping = useTypewriter(userQuestion, 8, 0.6);

  // AI response after user done + thinking pause
  const aiStart = 8 + userQuestion.length / 0.6 + 30;
  const aiTyping = useTypewriter(aiAnswer, aiStart, 0.4);

  // Cursor blink
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;

  // Panel reveal
  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  // Show "thinking" dots before AI starts
  const isThinking = frame >= aiStart - 15 && frame < aiStart;

  return (
    <AbsoluteFill style={{ background: "#212121", opacity: lifecycle }}>
      {/* Window chrome */}
      <div style={{
        position: "absolute", top: "8%", left: 36, right: 36, bottom: "8%",
        background: "#2A2A2A",
        borderRadius: 18,
        overflow: "hidden",
        opacity: panelReveal,
        transform: `translateY(${interpolate(panelReveal, [0, 1], [40, 0])}px)`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Title bar */}
        <div style={{
          padding: "14px 20px",
          background: "#1A1A1A",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28CA42" }} />
          </div>
          <div style={{
            marginLeft: 16,
            display: "flex", alignItems: "center", gap: 10,
            fontFamily: "-apple-system, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.6)",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "#10A37F",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FFF", fontSize: 14, fontWeight: 700,
            }}></div>
            ChatGPT
          </div>
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1,
          padding: "32px 32px 20px",
          overflow: "hidden",
        }}>
          {/* User message */}
          {frame > 6 && (
            <div style={{
              display: "flex",
              flexDirection: "row-reverse",
              gap: 12,
              marginBottom: 28,
              alignItems: "flex-start",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: brandColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFF", fontWeight: 700, fontSize: 16,
                flexShrink: 0,
              }}>
                A
              </div>
              <div style={{
                flex: 1,
                fontFamily: "-apple-system, 'Heebo', sans-serif",
                fontWeight: 500,
                fontSize: 26,
                color: "#ECECF1",
                direction: "rtl",
                lineHeight: 1.5,
              }}>
                {userTyping.visible}
                {!userTyping.isDone && (
                  <span style={{
                    display: "inline-block",
                    width: 2, height: 26,
                    background: brandColor,
                    marginRight: 2,
                    verticalAlign: "middle",
                    opacity: cursorBlink ? 1 : 0,
                  }} />
                )}
              </div>
            </div>
          )}

          {/* AI message */}
          {(isThinking || frame >= aiStart) && (
            <div style={{
              display: "flex",
              flexDirection: "row-reverse",
              gap: 12,
              alignItems: "flex-start",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "#10A37F",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFF", fontSize: 18, fontWeight: 700,
                flexShrink: 0,
              }}></div>
              <div style={{
                flex: 1,
                fontFamily: "-apple-system, 'Heebo', sans-serif",
                fontWeight: 400,
                fontSize: 24,
                color: "#ECECF1",
                direction: "rtl",
                lineHeight: 1.6,
                whiteSpace: "pre-line",
              }}>
                {isThinking ? (
                  <div style={{ display: "flex", gap: 6, padding: "4px 0" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: "rgba(255,255,255,0.6)",
                        opacity: 0.3 + Math.sin(frame * 0.2 + i) * 0.4,
                      }} />
                    ))}
                  </div>
                ) : (
                  <>
                    {aiTyping.visible}
                    {!aiTyping.isDone && (
                      <span style={{
                        display: "inline-block",
                        width: 10, height: 18,
                        background: "#FFFFFF",
                        marginRight: 2,
                        verticalAlign: "middle",
                        opacity: cursorBlink ? 1 : 0,
                      }} />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input bar at bottom */}
        <div style={{
          padding: "16px 24px 24px",
        }}>
          <div style={{
            background: "#40414F",
            borderRadius: 14,
            padding: "14px 20px",
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            opacity: 0.6,
          }}>
            <span style={{
              flex: 1,
              fontFamily: "-apple-system, 'Heebo', sans-serif",
              fontSize: 17,
              color: "rgba(255,255,255,0.35)",
              direction: "rtl",
            }}>
              שאל כל שאלה...
            </span>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.5)", fontSize: 14,
            }}>↑</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI SAFARI URL BAR — Typing a URL → page loads
// ══════════════════════════════════════════════════════════════════════════════

export const UISafariURL: React.FC<Pack4Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const url = primary || "omer.digital/seo";
  const pageTitle = secondary || "המדריך החינמי שלך — Omer Digital";

  // Window reveal
  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  // URL types
  const urlTyping = useTypewriter(url, 8, 0.5);

  // After URL done — loading bar for ~30 frames
  const urlDoneFrame = 8 + url.length / 0.5;
  const loadStart = urlDoneFrame + 8;
  const loadDuration = 28;
  const loadProgress = Math.max(0, Math.min(1, (frame - loadStart) / loadDuration));

  // Page reveal after loading done
  const pageReveal = spring({
    frame: Math.max(0, frame - loadStart - loadDuration),
    fps, config: SPRING_PRESETS.snappy,
  });

  return (
    <AbsoluteFill style={{ background: "#F5F5F7", opacity: lifecycle }}>
      {/* Safari window */}
      <div style={{
        position: "absolute", top: "8%", left: 36, right: 36, bottom: "8%",
        background: "#FFFFFF",
        borderRadius: 18,
        overflow: "hidden",
        opacity: panelReveal,
        transform: `translateY(${interpolate(panelReveal, [0, 1], [40, 0])}px)`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Title bar */}
        <div style={{
          padding: "14px 20px",
          background: "#F6F6F6",
          borderBottom: "1px solid #E0E0E0",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          {/* Traffic lights */}
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28CA42" }} />
          </div>

          {/* Nav arrows */}
          <div style={{ display: "flex", gap: 8, marginLeft: 4, color: "#A0A0A0" }}>
            <span style={{ fontSize: 18 }}>‹</span>
            <span style={{ fontSize: 18 }}>›</span>
          </div>

          {/* URL bar */}
          <div style={{
            flex: 1,
            background: "#FFFFFF",
            borderRadius: 8,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid #DADCE0",
            position: "relative",
          }}>
            <span style={{ fontSize: 14, color: "#5F6368" }}>●</span>
            <span style={{
              fontFamily: "-apple-system, 'SF Mono', monospace",
              fontSize: 16,
              color: "#202124",
              flex: 1,
              textAlign: "left",
            }}>
              {urlTyping.visible}
              {!urlTyping.isDone && (
                <span style={{
                  display: "inline-block",
                  width: 2, height: 16,
                  background: "#1A73E8",
                  verticalAlign: "middle",
                  marginLeft: 2,
                  animation: `blink 1s infinite`,
                }} />
              )}
            </span>
            {/* Reload spinner during loading */}
            {frame >= loadStart && loadProgress < 1 && (
              <div style={{
                width: 14, height: 14,
                border: "2px solid #1A73E8",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                transform: `rotate(${frame * 24}deg)`,
              }} />
            )}
          </div>
        </div>

        {/* Loading progress bar */}
        {frame >= loadStart && loadProgress < 1 && (
          <div style={{
            height: 3,
            background: "#1A73E8",
            width: `${loadProgress * 100}%`,
            transition: "width 0.1s",
          }} />
        )}

        {/* Page content */}
        <div style={{
          flex: 1,
          padding: "60px 50px",
          opacity: pageReveal,
          transform: `translateY(${interpolate(pageReveal, [0, 1], [20, 0])}px)`,
        }}>
          {/* Header logo area */}
          <div style={{
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 16,
            marginBottom: 50,
            paddingBottom: 24,
            borderBottom: "2px solid #F0F0F0",
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: 12,
              background: brandColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FFF", fontWeight: 900, fontSize: 24,
            }}>O</div>
            <div style={{
              fontFamily: "-apple-system, 'Heebo', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: "#202124",
              direction: "rtl",
            }}>
              Omer Digital
            </div>
          </div>

          {/* Hero title */}
          <div style={{
            fontFamily: "-apple-system, 'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 50,
            color: "#202124",
            direction: "rtl",
            lineHeight: 1.2,
            marginBottom: 24,
          }}>
            {pageTitle}
          </div>

          {/* CTA button */}
          <div style={{
            display: "inline-block",
            background: brandColor,
            color: "#FFF",
            padding: "16px 40px",
            borderRadius: 30,
            fontFamily: "-apple-system, 'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            boxShadow: `0 6px 20px rgba(${rgb},0.4)`,
            direction: "rtl",
          }}>
            הורד עכשיו ←
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI TERMINAL COMMAND — Typing command → output → success
// ══════════════════════════════════════════════════════════════════════════════

export const UITerminalCommand: React.FC<Pack4Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const command = primary || "deploy production";
  const lines = items?.map(i => ({
    text: i.text,
    type: i.icon || "info",
  })) || [
    { text: "→ Connecting to server...", type: "info" },
    { text: "→ Uploading files (47 changed)", type: "info" },
    { text: "→ Running build process...", type: "info" },
    { text: " Build successful (24.3s)", type: "success" },
    { text: " Deploy complete!", type: "success" },
  ];

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  // Command typing
  const cmdTyping = useTypewriter(command, 8, 0.5);
  const cmdDone = cmdTyping.isDone;
  const cmdDoneFrame = 8 + command.length / 0.5;

  // Output lines appear after command done
  const STAGGER = 14;

  // Cursor
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      <div style={{
        position: "absolute", top: "10%", left: 36, right: 36, bottom: "10%",
        background: "#0D1117",
        borderRadius: 14,
        overflow: "hidden",
        opacity: panelReveal,
        transform: `translateY(${interpolate(panelReveal, [0, 1], [30, 0])}px)`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(${rgb},0.2)`,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'SF Mono', Menlo, monospace",
      }}>
        {/* Title bar */}
        <div style={{
          padding: "12px 16px",
          background: "#161B22",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28CA42" }} />
          </div>
          <span style={{
            marginLeft: "auto", marginRight: "auto",
            fontSize: 13, color: "rgba(255,255,255,0.4)",
          }}>
            ~/projects/omer-digital — zsh
          </span>
        </div>

        {/* Terminal content */}
        <div style={{
          flex: 1,
          padding: "20px 24px",
          color: "rgba(255,255,255,0.85)",
          fontSize: 22,
          lineHeight: 1.7,
        }}>
          {/* Welcome line */}
          <div style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 18,
            marginBottom: 12,
          }}>
            Last login: Thu Apr 10 09:41:23
          </div>

          {/* Command prompt + typed command */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
            <span style={{ color: brandColor }}>omerd@mac</span>
            <span style={{ color: "#666" }}>:</span>
            <span style={{ color: "#4A90E2" }}>~/projects</span>
            <span style={{ color: "#666", marginRight: 6 }}>$</span>
            <span style={{ color: "#FFF" }}>
              {cmdTyping.visible}
              {!cmdTyping.isDone && (
                <span style={{
                  display: "inline-block",
                  width: 10, height: 22,
                  background: "#FFF",
                  marginLeft: 2,
                  verticalAlign: "middle",
                  opacity: cursorBlink ? 1 : 0,
                }} />
              )}
            </span>
          </div>

          {/* Output lines */}
          {cmdDone && lines.map((line, i) => {
            const lineDelay = cmdDoneFrame + 8 + i * STAGGER;
            const lineProg = spring({
              frame: Math.max(0, frame - lineDelay), fps, config: SPRING_PRESETS.smooth,
            });
            if (frame < lineDelay) return null;

            const color = line.type === "success" ? "#3FB950"
              : line.type === "error" ? "#F85149"
              : "rgba(255,255,255,0.7)";

            return (
              <div key={i} style={{
                color, marginTop: 4,
                opacity: lineProg,
                transform: `translateX(${interpolate(lineProg, [0, 1], [-10, 0])}px)`,
              }}>
                {line.text}
              </div>
            );
          })}

          {/* Final cursor */}
          {cmdDone && (
            <div style={{ display: "flex", alignItems: "center", marginTop: 16, gap: 4 }}>
              <span style={{ color: brandColor }}>omerd@mac</span>
              <span style={{ color: "#666" }}>:</span>
              <span style={{ color: "#4A90E2" }}>~/projects</span>
              <span style={{ color: "#666", marginRight: 6 }}>$</span>
              <span style={{
                display: "inline-block",
                width: 10, height: 22,
                background: "#FFF",
                marginLeft: 2,
                opacity: cursorBlink ? 1 : 0,
              }} />
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI APP STORE INSTALL — GET → Installing → OPEN
// ══════════════════════════════════════════════════════════════════════════════

export const UIAppStoreInstall: React.FC<Pack4Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const appName = primary || "Omer Digital — Reels Pro";
  const appCategory = secondary || "Productivity";

  // Phases: 0-30: GET button. 30-90: Installing with progress. 90+: OPEN.
  const TAP_FRAME = 30;
  const INSTALL_DURATION = 60;
  const INSTALL_DONE = TAP_FRAME + INSTALL_DURATION;

  const installProg = Math.max(0, Math.min(1, (frame - TAP_FRAME) / INSTALL_DURATION));
  const isInstalling = frame >= TAP_FRAME && frame < INSTALL_DONE;
  const isDone = frame >= INSTALL_DONE;

  // Tap effect on GET button
  const tapScale = frame >= TAP_FRAME - 4 && frame < TAP_FRAME + 4
    ? 0.92 + Math.sin((frame - TAP_FRAME) * 0.5) * 0.04
    : 1;

  // Pulse on OPEN button when done
  const openPulse = isDone ? 1 + Math.sin(frame * 0.15) * 0.05 : 1;

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  return (
    <AbsoluteFill style={{ background: "#F2F2F7", opacity: lifecycle }}>
      {/* App Store card */}
      <div style={{
        position: "absolute", top: "20%", left: 50, right: 50,
        background: "#FFFFFF",
        borderRadius: 22,
        overflow: "hidden",
        opacity: panelReveal,
        transform: `translateY(${interpolate(panelReveal, [0, 1], [40, 0])}px)`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.15)",
      }}>
        {/* Top — app banner */}
        <div style={{
          height: 200,
          background: `linear-gradient(135deg, ${brandColor} 0%, rgba(${rgb},0.7) 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          {/* App icon centered */}
          <div style={{
            width: 100, height: 100, borderRadius: 24,
            background: "#FFFFFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            fontSize: 56,
          }}>
            
          </div>
        </div>

        {/* App info */}
        <div style={{ padding: "24px 28px" }}>
          {/* Name + category + button row */}
          <div style={{
            display: "flex", flexDirection: "row-reverse",
            alignItems: "center", gap: 16,
            marginBottom: 20,
          }}>
            <div style={{
              width: 76, height: 76, borderRadius: 18,
              background: `linear-gradient(135deg, ${brandColor} 0%, rgba(${rgb},0.7) 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 38, flexShrink: 0,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}>
              
            </div>

            <div style={{ flex: 1, direction: "rtl", minWidth: 0 }}>
              <div style={{
                fontFamily: "-apple-system, 'Heebo', sans-serif",
                fontWeight: 700, fontSize: 22, color: "#000",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {appName}
              </div>
              <div style={{
                fontFamily: "-apple-system, sans-serif",
                fontSize: 14, color: "#8E8E93",
                marginTop: 2,
              }}>
                {appCategory}
              </div>
              {/* Rating row */}
              <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#8E8E93" }}> 4.9</span>
                <span style={{ fontSize: 13, color: "#8E8E93" }}>2.4K ratings</span>
              </div>
            </div>

            {/* Install button — changes state */}
            <div style={{
              transform: `scale(${tapScale * (isDone ? openPulse : 1)})`,
              transition: "background 0.2s",
            }}>
              {!isInstalling && !isDone && (
                <div style={{
                  background: "#007AFF",
                  color: "#FFF",
                  padding: "8px 24px",
                  borderRadius: 18,
                  fontFamily: "-apple-system, sans-serif",
                  fontWeight: 700, fontSize: 16,
                  letterSpacing: 1,
                  boxShadow: "0 2px 8px rgba(0,122,255,0.3)",
                }}>
                  GET
                </div>
              )}

              {isInstalling && (
                <div style={{
                  position: "relative",
                  width: 60, height: 60,
                }}>
                  <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="30" cy="30" r="25" fill="none"
                      stroke="rgba(0,122,255,0.15)" strokeWidth="3" />
                    <circle cx="30" cy="30" r="25" fill="none"
                      stroke="#007AFF" strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 25}`}
                      strokeDashoffset={`${2 * Math.PI * 25 * (1 - installProg)}`}
                      strokeLinecap="round" />
                  </svg>
                  {/* Pause icon in center */}
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex", gap: 2,
                  }}>
                    <div style={{ width: 4, height: 12, background: "#007AFF" }} />
                    <div style={{ width: 4, height: 12, background: "#007AFF" }} />
                  </div>
                </div>
              )}

              {isDone && (
                <div style={{
                  background: "#007AFF",
                  color: "#FFF",
                  padding: "8px 28px",
                  borderRadius: 18,
                  fontFamily: "-apple-system, sans-serif",
                  fontWeight: 700, fontSize: 16,
                  letterSpacing: 0.5,
                  boxShadow: `0 4px 16px rgba(0,122,255,0.5)`,
                }}>
                  OPEN
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div style={{
            fontFamily: "-apple-system, 'Heebo', sans-serif",
            fontSize: 16,
            color: "#3C3C43",
            direction: "rtl",
            lineHeight: 1.5,
            paddingTop: 14,
            borderTop: "1px solid #E5E5EA",
          }}>
            הפוך את הסרטונים שלך לפרימיום עם תסריטים מובנים, B-Roll חכם וכל המבנה שצריך לוויראליות.
          </div>
        </div>
      </div>

      {/* Status hint at bottom */}
      <div style={{
        position: "absolute", bottom: "12%", left: 0, right: 0,
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-block",
          background: isDone ? "#34C759" : isInstalling ? "#FF9500" : "#8E8E93",
          color: "#FFF",
          padding: "10px 28px",
          borderRadius: 22,
          fontFamily: "-apple-system, 'Heebo', sans-serif",
          fontWeight: 700, fontSize: 18,
          direction: "rtl",
        }}>
          {isDone ? " מותקן · מוכן לשימוש" : isInstalling ? `מתקין... ${Math.round(installProg * 100)}%` : "לחץ GET להתחיל"}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI SETTINGS TOGGLE — iOS Settings with one toggle switching ON
// ══════════════════════════════════════════════════════════════════════════════

export const UISettingsToggle: React.FC<Pack4Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const sectionTitle = primary || "אוטומציה";
  const settings = items?.map(i => ({
    name: i.text,
    icon: i.icon || "",
    activatedAt: parseSceneNumber(i.value, 0),
  })) || [
    { name: "פרסום אוטומטי", icon: "", activatedAt: 1 }, // toggles on at this index
    { name: "תזמון חכם", icon: "⏰", activatedAt: 0 },
    { name: "תגובות אוטומטיות", icon: "", activatedAt: 0 },
    { name: "ניתוח ביצועים", icon: "", activatedAt: 1 },
  ];

  // Toggle animation timing
  const TOGGLE_START = 24;
  const TOGGLE_DURATION = 14;

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* iOS Settings panel */}
      <div style={{
        position: "absolute", top: "10%", left: 40, right: 40, bottom: "10%",
        background: "#1C1C1E",
        borderRadius: 20,
        overflow: "hidden",
        opacity: panelReveal,
        transform: `translateY(${interpolate(panelReveal, [0, 1], [40, 0])}px)`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
      }}>
        {/* Status bar */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          padding: "16px 28px 8px",
          fontFamily: "-apple-system, sans-serif",
          fontWeight: 700, fontSize: 17, color: "#FFF",
        }}>
          <span>9:41</span>
          <span>  100%</span>
        </div>

        {/* Header */}
        <div style={{
          padding: "20px 28px 12px",
          display: "flex",
          flexDirection: "row-reverse",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{
            fontFamily: "-apple-system, sans-serif",
            color: "#0A84FF", fontSize: 18, fontWeight: 400,
          }}>‹ הגדרות</span>
        </div>

        {/* Section title */}
        <div style={{ padding: "0 28px 12px" }}>
          <div style={{
            fontFamily: "-apple-system, 'Heebo', sans-serif",
            fontWeight: 700, fontSize: 32, color: "#FFF",
            direction: "rtl",
          }}>
            {sectionTitle}
          </div>
        </div>

        {/* Settings list */}
        <div style={{ padding: "0 16px" }}>
          {settings.map((setting, i) => {
            const willToggle = setting.activatedAt === 1;
            const toggleProg = willToggle
              ? Math.max(0, Math.min(1, (frame - TOGGLE_START - i * 8) / TOGGLE_DURATION))
              : 0;
            const isOn = toggleProg > 0.5;

            return (
              <div key={i} style={{
                background: "#2C2C2E",
                borderRadius: 12,
                marginBottom: 10,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 16,
                border: willToggle && isOn ? `1.5px solid rgba(${rgb},0.3)` : "1.5px solid transparent",
                boxShadow: willToggle && isOn ? `0 0 20px rgba(${rgb},0.15)` : "none",
                transition: "all 0.3s",
              }}>
                {/* Icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: willToggle && isOn ? brandColor : "rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}>
                  {setting.icon}
                </div>

                {/* Name */}
                <div style={{
                  flex: 1,
                  fontFamily: "-apple-system, 'Heebo', sans-serif",
                  fontWeight: 500, fontSize: 22,
                  color: "#FFF",
                  direction: "rtl",
                }}>
                  {setting.name}
                </div>

                {/* Toggle switch */}
                <div style={{
                  width: 60, height: 36, borderRadius: 18,
                  background: isOn ? "#34C759" : "rgba(120,120,128,0.32)",
                  position: "relative",
                  transition: "background 0.3s",
                  flexShrink: 0,
                  boxShadow: isOn ? "0 2px 8px rgba(52,199,89,0.4)" : "none",
                }}>
                  <div style={{
                    position: "absolute",
                    top: 3, left: isOn ? 28 : 3,
                    width: 30, height: 30, borderRadius: "50%",
                    background: "#FFF",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Success indicator at bottom */}
        {frame > TOGGLE_START + TOGGLE_DURATION + 20 && (
          <div style={{
            position: "absolute", bottom: 32, left: 0, right: 0,
            textAlign: "center",
          }}>
            <div style={{
              display: "inline-block",
              background: `rgba(52,199,89,0.2)`,
              border: "1px solid rgba(52,199,89,0.5)",
              color: "#34C759",
              padding: "10px 24px",
              borderRadius: 14,
              fontFamily: "-apple-system, 'Heebo', sans-serif",
              fontWeight: 700, fontSize: 18,
              direction: "rtl",
            }}>
               הפעלת אוטומציה — סיימת
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
