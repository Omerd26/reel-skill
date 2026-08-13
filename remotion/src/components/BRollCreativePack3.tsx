/**
 * BRollCreativePack3.tsx — Third pack of creative scenes.
 *
 * Scenes:
 *   - ui_voice_memo:     iPhone Voice Memo with live animated waveform
 *   - ui_email_inbox:    Gmail inbox flooding with new leads/messages
 *   - visual_rocket:     Rocket launching with exhaust particles (SVG)
 *   - visual_domino:     Chain reaction — dominoes falling in sequence
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
} from "./BRollMotion";

export interface Pack3Props {
  brandColor: string;
  durationFrames: number;
  primary?: string;
  secondary?: string;
  items?: { text: string; icon?: string; sub_text?: string; value?: string }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// UI VOICE MEMO — iPhone Voice Memo app with live waveform
// ══════════════════════════════════════════════════════════════════════════════

export const UIVoiceMemo: React.FC<Pack3Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  const memoTitle = primary || "רעיונות לסרטון";
  const dateLabel = secondary || "10 באפריל, 9:41";

  // Panel reveal
  const panelReveal = spring({
    frame: Math.max(0, frame - 3), fps, config: SPRING_PRESETS.snappy,
  });

  // Time counter (MM:SS from 0:00 to scene duration)
  const elapsedSecs = frame / fps;
  const mm = String(Math.floor(elapsedSecs / 60)).padStart(2, "0");
  const ss = String(Math.floor(elapsedSecs % 60)).padStart(2, "0");
  const ms = String(Math.floor((elapsedSecs * 100) % 100)).padStart(2, "0");

  // REC indicator blink
  const recBlink = Math.floor(frame / 15) % 2 === 0;

  // Waveform bars — animated based on frame (simulated audio levels)
  const BAR_COUNT = 60;
  const bars = useMemo(
    () => Array.from({ length: BAR_COUNT }, (_, i) => ({
      baseSeed: noise(i, 7),
      freqSeed: noise(i, 13),
    })),
    [],
  );

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* Subtle warm gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse 70% 50% at 50% 40%, rgba(255,60,60,0.05) 0%, transparent 70%)`,
      }} />

      {/* Voice memo panel */}
      <div style={{
        position: "absolute", top: "12%", left: 40, right: 40, bottom: "18%",
        background: "#1C1C1E",
        borderRadius: 24,
        overflow: "hidden",
        opacity: panelReveal,
        transform: `translateY(${interpolate(panelReveal, [0, 1], [40, 0])}px)`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Status bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 32px 8px",
          fontFamily: "-apple-system, sans-serif", fontWeight: 700,
          fontSize: 17, color: "rgba(255,255,255,0.95)",
        }}>
          <span>9:41</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* REC indicator */}
            <span style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "#FF3B30",
              opacity: recBlink ? 1 : 0.3,
              boxShadow: recBlink ? "0 0 10px rgba(255,59,48,0.6)" : "none",
            }} />
            <span style={{ fontSize: 13, color: "#FF3B30", fontWeight: 700 }}>REC</span>
          </span>
        </div>

        {/* Title bar */}
        <div style={{
          padding: "20px 32px 12px",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{
            fontFamily: "-apple-system, 'Heebo', sans-serif", fontWeight: 700,
            fontSize: 30, color: "#FFFFFF",
            direction: "rtl",
          }}>
            {memoTitle}
          </div>
          <div style={{
            fontFamily: "-apple-system, sans-serif", fontWeight: 400,
            fontSize: 14, color: "rgba(255,255,255,0.45)",
            direction: "rtl", marginTop: 4,
          }}>
            {dateLabel}
          </div>
        </div>

        {/* Waveform area */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 32px", position: "relative",
        }}>
          {/* Center playhead line */}
          <div style={{
            position: "absolute", left: "50%", top: "15%", bottom: "15%",
            width: 2, background: "#FF3B30",
            opacity: 0.8,
          }} />

          {/* Waveform bars */}
          <div style={{
            display: "flex", alignItems: "center", gap: 3,
            height: 180, width: "100%", justifyContent: "center",
          }}>
            {bars.map((b, i) => {
              // Wave that scrolls — position depends on frame
              const scrollOffset = frame * 0.3;
              const phase = (i + scrollOffset) * 0.35 + b.baseSeed * 10;
              // Amplitude — varies with frame to simulate live audio
              const amp = Math.abs(
                Math.sin(phase) * (0.3 + b.baseSeed * 0.5) +
                Math.sin(phase * 2.1 + b.freqSeed * 3) * 0.3
              );
              const barH = amp * 140 + 8;

              // Color — brighter near center (current playback)
              const distFromCenter = Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
              const color = distFromCenter < 0.1
                ? "#FF3B30"
                : distFromCenter < 0.4
                ? `rgba(${rgb},${1 - distFromCenter})`
                : `rgba(${rgb},${0.3 * (1 - distFromCenter)})`;

              return (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: barH,
                    background: color,
                    borderRadius: 1.5,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Time counter — huge */}
        <div style={{
          textAlign: "center", padding: "16px 0",
          fontFamily: "'SF Mono', Menlo, monospace", fontWeight: 300,
          fontSize: 52, color: "#FFFFFF",
          letterSpacing: "-1px",
        }}>
          {mm}:{ss}<span style={{ color: "rgba(255,255,255,0.4)", fontSize: 36 }}>.{ms}</span>
        </div>

        {/* Control bar */}
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: 32, padding: "20px 0 28px",
        }}>
          {/* Rewind 15s */}
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: "rgba(255,255,255,0.7)",
          }}>⟲15</div>

          {/* Record (big red) */}
          <div style={{
            width: 76, height: 76, borderRadius: "50%",
            background: "#FF3B30",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: recBlink ? "0 0 30px rgba(255,59,48,0.6)" : "0 0 15px rgba(255,59,48,0.3)",
            transform: recBlink ? "scale(1.02)" : "scale(1)",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, background: "#FFF",
            }} />
          </div>

          {/* Forward 15s */}
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: "rgba(255,255,255,0.7)",
          }}>15⟳</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI EMAIL INBOX — Gmail flooding with new leads / success messages
// ══════════════════════════════════════════════════════════════════════════════

export const UIEmailInbox: React.FC<Pack3Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  const emails = items?.map(i => ({
    from: i.sub_text || "לקוח חדש",
    subject: i.text,
    preview: i.value || "שלום, ראיתי את הפוסט שלך ורציתי לדעת...",
  })) || [
    { from: "דנה לוי", subject: "רוצה לקבוע פגישה", preview: "שלום, ראיתי את הסרטון שלך..." },
    { from: "יוסי כהן", subject: "מעוניין בשירותים שלך", preview: "היי, יש לך זמינות השבוע?" },
    { from: "מיכל אברהם", subject: "יכולה לשלוח כתובת?", preview: "ראיתי את הפוסט ואני רוצה..." },
    { from: "אורי שמיר", subject: "כמה זה עולה?", preview: "היי, ראיתי את הסרטון שלך..." },
    { from: "תמר ברק", subject: "זמינות לפגישת אפיון", preview: "אשמח להתקדם במה שהצגת..." },
    { from: "רון פלד", subject: "מעניין מה שהצעת", preview: "שלום, יש לי מספר שאלות..." },
  ];

  // Panel reveal
  const panelReveal = spring({
    frame: Math.max(0, frame - 3), fps, config: SPRING_PRESETS.snappy,
  });

  // Unread count animates
  const unreadTarget = emails.length;
  const unreadProg = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 25, stiffness: 50 } });
  const unreadCount = Math.round(unreadTarget * Math.min(unreadProg, 1));

  const STAGGER = 10;

  return (
    <AbsoluteFill style={{ background: "#F6F8FC", opacity: lifecycle }}>
      {/* Gmail header bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        background: "#FFFFFF",
        padding: "18px 32px",
        borderBottom: "1px solid #E8EAED",
        display: "flex", alignItems: "center", gap: 16,
        opacity: panelReveal,
      }}>
        {/* Hamburger */}
        <div style={{ fontSize: 24, color: "#5F6368" }}>●</div>

        {/* Gmail logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <svg width="32" height="24" viewBox="0 0 32 24">
            <path d="M2 4 L16 14 L30 4 L30 22 L2 22 Z" fill="#EA4335" />
            <path d="M2 4 L16 14 L30 4 L30 6 L16 16 L2 6 Z" fill="#C5221F" />
          </svg>
          <span style={{
            fontFamily: "-apple-system, sans-serif", fontWeight: 500, fontSize: 18,
            color: "#5F6368",
          }}>Gmail</span>
        </div>

        {/* Search bar */}
        <div style={{
          flex: 1, maxWidth: 600, marginLeft: 20,
          background: "#F1F3F4", borderRadius: 8,
          padding: "10px 18px",
          fontSize: 14, color: "#80868B", direction: "rtl",
        }}>
           חיפוש במייל
        </div>
      </div>

      {/* Inbox title + counter */}
      <div style={{
        position: "absolute", top: 80, left: 32, right: 32,
        padding: "20px 0 16px",
        display: "flex", alignItems: "center", gap: 20,
        opacity: panelReveal,
      }}>
        <div style={{
          fontFamily: "-apple-system, 'Heebo', sans-serif", fontWeight: 500,
          fontSize: 26, color: "#202124", direction: "rtl",
        }}>
          נכנס
        </div>
        {/* Unread badge — animated */}
        <div style={{
          background: "#D93025", color: "#FFF",
          borderRadius: 12,
          padding: "4px 14px",
          fontFamily: "-apple-system, sans-serif", fontWeight: 700, fontSize: 16,
          display: "flex", alignItems: "center", gap: 6,
          boxShadow: `0 2px 8px rgba(217,48,37,0.4)`,
          transform: `scale(${1 + Math.sin(frame * 0.15) * 0.04})`,
        }}>
          {unreadCount} חדשים
        </div>
      </div>

      {/* Email list */}
      <div style={{
        position: "absolute", top: 155, left: 32, right: 32, bottom: 40,
        background: "#FFFFFF",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #E8EAED",
        opacity: panelReveal,
      }}>
        {emails.map((email, i) => {
          const emailDelay = 10 + i * STAGGER;
          const slideProg = spring({
            frame: Math.max(0, frame - emailDelay), fps, config: SPRING_PRESETS.snappy,
          });

          // Yellow/unread highlight flash
          const highlightPulse = frame >= emailDelay && frame < emailDelay + 20
            ? Math.max(0, 1 - (frame - emailDelay) / 20)
            : 0;

          // Avatar color
          const avatarColors = ["#1A73E8", "#D93025", "#F9AB00", "#188038", "#7B1FA2", "#D2691E"];
          const avatarColor = avatarColors[i % avatarColors.length];
          const avatarLetter = email.from.charAt(0);

          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 20px",
              borderBottom: "1px solid #F1F3F4",
              background: `rgba(255, 245, 200, ${highlightPulse * 0.5})`,
              opacity: slideProg,
              transform: `translateX(${interpolate(slideProg, [0, 1], [-30, 0])}px)`,
              flexDirection: "row-reverse",
            }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: avatarColor,
                color: "#FFF", fontWeight: 600, fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                fontFamily: "'Heebo', sans-serif",
              }}>
                {avatarLetter}
              </div>

              {/* Content */}
              <div style={{ flex: 1, direction: "rtl", minWidth: 0 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", marginBottom: 2,
                }}>
                  <span style={{
                    fontFamily: "-apple-system, 'Heebo', sans-serif",
                    fontWeight: 700, fontSize: 16, color: "#202124",
                  }}>
                    {email.from}
                  </span>
                  <span style={{
                    fontFamily: "-apple-system, sans-serif",
                    fontSize: 13, color: "#5F6368",
                  }}>
                    {i === 0 ? "עכשיו" : i === 1 ? "לפני 2 דק'" : `לפני ${i * 4} דק'`}
                  </span>
                </div>
                <div style={{
                  fontFamily: "-apple-system, 'Heebo', sans-serif", fontWeight: 600,
                  fontSize: 15, color: "#202124", direction: "rtl",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {email.subject}
                </div>
                <div style={{
                  fontFamily: "-apple-system, 'Heebo', sans-serif",
                  fontSize: 14, color: "#5F6368", direction: "rtl",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  marginTop: 2,
                }}>
                  {email.preview}
                </div>
              </div>

              {/* Star */}
              <div style={{ color: "#F9AB00", fontSize: 18 }}></div>
            </div>
          );
        })}
      </div>

      {/* Bottom label */}
      {primary && (
        <div style={{
          position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center",
          opacity: interpolate(frame, [durationFrames * 0.6, durationFrames * 0.75], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          }) * lifecycle,
        }}>
          <div style={{
            display: "inline-block",
            background: "#202124", color: "#FFF",
            padding: "8px 20px", borderRadius: 20,
            fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 16,
          }}>
            {primary}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL ROCKET — Rocket launching with exhaust particles (SVG)
// ══════════════════════════════════════════════════════════════════════════════

export const VisualRocket: React.FC<Pack3Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  // Countdown: 3, 2, 1, LIFTOFF
  const countdownPhase = Math.floor(frame / fps);
  const showCountdown = frame < fps * 3;
  const countdownText = showCountdown ? ["3", "2", "1"][countdownPhase] || "" : "";
  const countdownScale = 1 - ((frame % fps) / fps) * 0.3;

  // Launch progress starts at t=3s
  const launchStart = fps * 3;
  const launchProg = spring({
    frame: Math.max(0, frame - launchStart), fps,
    config: { damping: 18, stiffness: 30, mass: 2 },
  });

  // Rocket position: starts at bottom, launches up
  const rocketY = interpolate(launchProg, [0, 1], [0.85, 0.1]); // percent from top
  const rocketShake = showCountdown
    ? Math.sin(frame * 1.5) * 3 * (countdownPhase / 3)
    : 0;

  // Exhaust particles
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      offset: noise(i, 9) * 30 - 15,
      speed: 0.5 + noise(i, 17) * 1.5,
      size: 6 + noise(i, 23) * 14,
      phase: noise(i, 31) * Math.PI * 2,
    })), []);

  // Stars in background
  const stars = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      x: noise(i, 3) * 100,
      y: noise(i, 7) * 100,
      size: 1 + noise(i, 11) * 2,
      twinkle: noise(i, 19),
    })), []);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(180deg, #000010 0%, #0a0520 50%, #1a0a30 100%)",
      opacity: lifecycle,
    }}>
      {/* Stars */}
      {stars.map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          borderRadius: "50%", background: "#FFF",
          opacity: 0.3 + Math.sin(frame * 0.05 + s.twinkle * 10) * 0.3,
        }} />
      ))}

      {/* Ground / horizon */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 120,
        background: "linear-gradient(180deg, transparent 0%, rgba(40,20,80,0.4) 100%)",
      }} />

      {/* Countdown */}
      {countdownText && (
        <div style={{
          position: "absolute", top: "30%", left: 0, right: 0,
          textAlign: "center",
          fontFamily: "'Heebo', sans-serif", fontWeight: 900,
          fontSize: 200, color: brandColor,
          transform: `scale(${countdownScale})`,
          textShadow: `0 0 60px rgba(${rgb},0.8)`,
        }}>
          {countdownText}
        </div>
      )}

      {/* LIFTOFF text when launch starts */}
      {!showCountdown && launchProg < 0.3 && (
        <div style={{
          position: "absolute", top: "30%", left: 0, right: 0,
          textAlign: "center",
          fontFamily: "'Heebo', sans-serif", fontWeight: 900,
          fontSize: 80, color: brandColor,
          opacity: interpolate(launchProg, [0, 0.3], [1, 0], { extrapolateRight: "clamp" }),
          textShadow: `0 0 40px rgba(${rgb},0.9)`,
          letterSpacing: 6,
        }}>
          LIFTOFF 
        </div>
      )}

      {/* Exhaust particles — only while launching */}
      {launchProg > 0 && particles.map((p, i) => {
        const localFrame = frame - launchStart;
        const pY = (rocketY * 100) + 8 + (localFrame * p.speed * 0.8) % 30;
        const pX = 50 + p.offset * (1 + p.phase * 0.1) + Math.sin(localFrame * 0.1 + p.phase) * 8;
        const fadeDown = interpolate(((localFrame * p.speed) % 30) / 30, [0, 0.5, 1], [1, 0.5, 0]);

        return (
          <div key={i} style={{
            position: "absolute",
            left: `${pX}%`, top: `${pY}%`,
            width: p.size, height: p.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255,200,${Math.round(p.phase * 100)},${fadeDown}) 0%, rgba(${rgb},${fadeDown * 0.5}) 50%, transparent 100%)`,
            transform: "translate(-50%, -50%)",
            filter: "blur(2px)",
          }} />
        );
      })}

      {/* Rocket SVG */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: `${rocketY * 100}%`,
        transform: `translate(-50%, -50%) translateX(${rocketShake}px)`,
      }}>
        <svg width="200" height="320" viewBox="0 0 200 320" style={{
          filter: `drop-shadow(0 0 30px rgba(${rgb},0.5))`,
        }}>
          {/* Rocket body */}
          <path d="M100 10 L130 80 L130 220 L100 240 L70 220 L70 80 Z"
            fill={brandColor} stroke="#FFF" strokeWidth="2" />

          {/* Nose cone tip highlight */}
          <path d="M100 10 L115 50 L100 50 Z" fill="#FFF" opacity="0.3" />

          {/* Window */}
          <circle cx="100" cy="110" r="22" fill="#1a1a2e" stroke="#FFF" strokeWidth="2" />
          <circle cx="100" cy="110" r="18" fill="#4a9eff" opacity="0.7" />
          <circle cx="94" cy="104" r="6" fill="#FFF" opacity="0.5" />

          {/* Body stripe */}
          <rect x="70" y="150" width="60" height="12" fill="#FFF" opacity="0.8" />

          {/* Left fin */}
          <path d="M70 180 L40 240 L70 220 Z" fill={brandColor} stroke="#FFF" strokeWidth="2" />

          {/* Right fin */}
          <path d="M130 180 L160 240 L130 220 Z" fill={brandColor} stroke="#FFF" strokeWidth="2" />

          {/* Center back fin */}
          <rect x="90" y="220" width="20" height="30" fill={brandColor} stroke="#FFF" strokeWidth="2" />

          {/* Engine flame — only while launching */}
          {launchProg > 0 && (
            <g>
              <path d="M75 240 L100 320 L125 240 Z"
                fill="url(#flameGrad)"
                opacity={0.9 + Math.sin(frame * 0.3) * 0.1} />
              <path d="M85 240 L100 290 L115 240 Z"
                fill="#FFF"
                opacity={0.8 + Math.sin(frame * 0.4) * 0.2} />
              <defs>
                <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFF" />
                  <stop offset="40%" stopColor="#FFE600" />
                  <stop offset="100%" stopColor="#FF3B30" />
                </linearGradient>
              </defs>
            </g>
          )}
        </svg>
      </div>

      {/* Bottom text */}
      {primary && launchProg > 0.5 && (
        <div style={{
          position: "absolute", bottom: "10%", left: 0, right: 0, textAlign: "center",
          opacity: interpolate(launchProg, [0.5, 0.9], [0, 1]) * lifecycle,
        }}>
          <div style={{
            display: "inline-block",
            background: "rgba(0,0,0,0.7)",
            padding: "14px 32px", borderRadius: 14,
            border: `1px solid rgba(${rgb},0.4)`,
            fontFamily: "'Heebo', sans-serif", fontWeight: 900,
            fontSize: 36, color: "#FFF", direction: "rtl",
          }}>
            {primary}
          </div>
          {secondary && (
            <div style={{
              fontFamily: "'Heebo', sans-serif", fontWeight: 500,
              fontSize: 22, color: `rgba(${rgb},0.9)`,
              direction: "rtl", marginTop: 10,
            }}>
              {secondary}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL DOMINO — Chain reaction of falling dominoes
// ══════════════════════════════════════════════════════════════════════════════

export const VisualDomino: React.FC<Pack3Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  const dominoLabels = items?.map(i => i.text) || [
    "1 פוסט טוב", "10 לייקים", "שיתופים", "100 עוקבים", "לידים", "לקוחות",
  ];

  // Each domino starts falling at staggered time
  const FALL_STAGGER = 8;
  const FALL_DURATION = 14;
  const FALL_START_FRAME = 20;

  // Arc path: dominoes along a curve
  const dominoCount = dominoLabels.length;

  return (
    <AbsoluteFill style={{ background: "#0A0A0F", opacity: lifecycle }}>
      {/* Subtle floor / ground plane */}
      <div style={{
        position: "absolute", top: "55%", left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 0%, rgba(${rgb},0.3) 50%, transparent 100%)`,
      }} />

      {/* Shadow on floor */}
      <div style={{
        position: "absolute", top: "57%", left: 0, right: 0, height: 100,
        background: `radial-gradient(ellipse 50% 100% at 50% 0%, rgba(${rgb},0.08) 0%, transparent 70%)`,
      }} />

      {/* Dominoes */}
      {dominoLabels.map((label, i) => {
        const fallStartFrame = FALL_START_FRAME + i * FALL_STAGGER;
        const fallProg = Math.max(
          0,
          Math.min(1, (frame - fallStartFrame) / FALL_DURATION),
        );
        // Ease-in (gravity)
        const eased = fallProg * fallProg;
        const rotation = eased * 90; // 0 → 90deg

        // Horizontal spacing — evenly distributed
        const xPercent = 10 + (i / (dominoCount - 1)) * 80;

        // Entry animation — domino appears before the chain starts
        const entryProg = spring({
          frame: Math.max(0, frame - 4 - i * 3), fps,
          config: SPRING_PRESETS.snappy,
        });

        // Domino color — grayscale until falls, then brand
        const hasFallen = fallProg > 0.1;

        return (
          <div key={i} style={{
            position: "absolute",
            left: `${xPercent}%`, top: "55%",
            transform: `translate(-50%, -100%) scale(${entryProg})`,
            opacity: entryProg * lifecycle,
            transformOrigin: "center bottom",
          }}>
            {/* Label above */}
            <div style={{
              position: "absolute",
              bottom: `${270 - eased * 80}px`,
              left: "50%", transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              opacity: hasFallen ? 1 - fallProg * 0.5 : 0.8,
              fontFamily: "'Heebo', sans-serif", fontWeight: 700,
              fontSize: 20, color: "#FFF",
              direction: "rtl",
              background: hasFallen ? `rgba(${rgb},0.25)` : "rgba(255,255,255,0.05)",
              padding: "5px 12px", borderRadius: 8,
              border: hasFallen ? `1px solid rgba(${rgb},0.4)` : "1px solid rgba(255,255,255,0.1)",
            }}>
              {label}
            </div>

            {/* Domino piece */}
            <div style={{
              width: 40, height: 180,
              background: hasFallen
                ? `linear-gradient(180deg, ${brandColor} 0%, rgba(${rgb},0.7) 100%)`
                : "linear-gradient(180deg, #e0e0e0 0%, #888 100%)",
              borderRadius: 4,
              border: "2px solid rgba(0,0,0,0.3)",
              boxShadow: hasFallen
                ? `0 0 20px rgba(${rgb},0.5), inset 0 0 10px rgba(255,255,255,0.2)`
                : "0 4px 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(0,0,0,0.2)",
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "50% 100%",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Dots on face */}
              {[30, 60, 90, 120, 150].map((top) => (
                <div key={top} style={{
                  position: "absolute",
                  top: `${top}px`, left: "50%",
                  transform: "translateX(-50%)",
                  width: 6, height: 6, borderRadius: "50%",
                  background: hasFallen ? "#FFF" : "#333",
                  opacity: 0.6,
                }} />
              ))}
              {/* Dividing line */}
              <div style={{
                position: "absolute",
                top: "50%", left: 4, right: 4, height: 1,
                background: "rgba(0,0,0,0.3)",
              }} />
            </div>
          </div>
        );
      })}

      {/* Final result label */}
      {primary && (
        <div style={{
          position: "absolute", bottom: "15%", left: 0, right: 0,
          textAlign: "center",
          opacity: interpolate(frame,
            [FALL_START_FRAME + dominoCount * FALL_STAGGER, FALL_START_FRAME + dominoCount * FALL_STAGGER + 20],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ) * lifecycle,
        }}>
          <div style={{
            display: "inline-block",
            background: brandColor,
            padding: "14px 36px", borderRadius: 14,
            fontFamily: "'Heebo', sans-serif", fontWeight: 900,
            fontSize: 36, color: "#FFF", direction: "rtl",
            boxShadow: `0 0 40px rgba(${rgb},0.5)`,
          }}>
            {primary}
          </div>
        </div>
      )}

      {/* Title */}
      <div style={{
        position: "absolute", top: "12%", left: 0, right: 0, textAlign: "center",
        opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }) * lifecycle,
      }}>
        <div style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 800,
          fontSize: 28, color: "rgba(255,255,255,0.5)",
          direction: "rtl",
        }}>
          תגובת שרשרת
        </div>
      </div>
    </AbsoluteFill>
  );
};
