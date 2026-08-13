/**
 * BRollPack9_Metaphors.tsx — Time & visual metaphor scenes.
 *
 * Scenes:
 *   - visual_hourglass:        Hourglass with sand draining
 *   - visual_spotlight_isolate: Spotlight isolates one item among many
 *   - visual_thumbs_up_burst:  Thumbs up emojis floating up (live reactions)
 *   - visual_puzzle_complete:  Puzzle pieces connecting
 *   - visual_door_open:        Door opening to light (opportunity)
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

export interface Pack9Props {
  brandColor: string;
  durationFrames: number;
  primary?: string;
  secondary?: string;
  items?: { text: string; icon?: string; sub_text?: string; value?: string }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL HOURGLASS — Sand draining from top to bottom
// ══════════════════════════════════════════════════════════════════════════════

export const VisualHourglass: React.FC<Pack9Props> = ({
  brandColor,
  durationFrames,
  primary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const label = primary || "הזמן אוזל";

  // Sand drain progress 0→1
  const drainProg = interpolate(frame, [12, durationFrames - 24], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Hourglass shape parameters
  const hourglassScale = spring({ frame: Math.max(0, frame - 4), fps, config: SPRING_PRESETS.snappy });

  // Falling sand particles
  const sandParticles = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    spawnDelay: i * 3,
    xOffset: (noise(i, 1) - 0.5) * 8,
    speed: 0.8 + noise(i, 2) * 0.4,
  })), []);

  return (
    <AbsoluteFill style={{
      background: "radial-gradient(ellipse 50% 40% at 50% 50%, #1A0E08 0%, #000 80%)",
      opacity: lifecycle,
    }}>
      {/* Warm glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 500, height: 700, borderRadius: "50%",
        background: `radial-gradient(ellipse, rgba(${rgb},0.1) 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)",
        filter: "blur(40px)",
      }} />

      {/* Hourglass SVG */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -50%) scale(${hourglassScale})`,
      }}>
        <svg width="400" height="600" viewBox="0 0 400 600">
          <defs>
            <linearGradient id="goldFrame" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F4C842" />
              <stop offset="50%" stopColor="#D4A017" />
              <stop offset="100%" stopColor="#8B6914" />
            </linearGradient>
            <linearGradient id="sandColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brandColor} />
              <stop offset="100%" stopColor={`rgba(${rgb},0.7)`} />
            </linearGradient>
            <clipPath id="topChamber">
              <polygon points="50,40 350,40 220,300 180,300" />
            </clipPath>
            <clipPath id="bottomChamber">
              <polygon points="180,300 220,300 350,560 50,560" />
            </clipPath>
          </defs>

          {/* Top frame bar */}
          <rect x="30" y="20" width="340" height="22" rx="6" fill="url(#goldFrame)" stroke="#5C4308" strokeWidth="2" />

          {/* Top chamber outline */}
          <polygon points="50,40 350,40 220,300 180,300"
            fill="rgba(255,255,255,0.04)"
            stroke="url(#goldFrame)" strokeWidth="6" />

          {/* Top sand — decreases */}
          <g clipPath="url(#topChamber)">
            <rect x="0"
              y={40 + drainProg * 200}
              width="400"
              height={260}
              fill="url(#sandColor)"
            />
          </g>

          {/* Middle constriction */}
          <rect x="178" y="290" width="44" height="20" fill="url(#goldFrame)" stroke="#5C4308" strokeWidth="1" />

          {/* Falling sand stream */}
          {drainProg > 0 && drainProg < 0.95 && (
            <rect x="196" y="310" width="8"
              height={interpolate(frame, [12, 20], [0, 250], { extrapolateRight: "clamp" })}
              fill={brandColor}
              style={{ filter: `drop-shadow(0 0 6px rgba(${rgb},0.6))` }} />
          )}

          {/* Bottom chamber outline */}
          <polygon points="180,300 220,300 350,560 50,560"
            fill="rgba(255,255,255,0.04)"
            stroke="url(#goldFrame)" strokeWidth="6" />

          {/* Bottom sand pile — grows */}
          <g clipPath="url(#bottomChamber)">
            <rect x="0"
              y={560 - drainProg * 230}
              width="400"
              height={250}
              fill="url(#sandColor)"
            />
          </g>

          {/* Bottom frame bar */}
          <rect x="30" y="560" width="340" height="22" rx="6" fill="url(#goldFrame)" stroke="#5C4308" strokeWidth="2" />
        </svg>
      </div>

      {/* Floating sand particles inside top chamber */}
      {sandParticles.map((p, i) => {
        const localFrame = frame - p.spawnDelay - 12;
        if (localFrame < 0) return null;
        const cyclePos = (localFrame * p.speed) % 30;
        const y = 400 + cyclePos * 5;
        if (cyclePos > 28) return null;
        return (
          <div key={i} style={{
            position: "absolute",
            top: y, left: `calc(50% + ${p.xOffset}px)`,
            width: 3, height: 3, borderRadius: "50%",
            background: brandColor,
            opacity: 0.6,
            transform: "translateX(-50%)",
          }} />
        );
      })}

      {/* Top label — countdown */}
      <div style={{
        position: "absolute", top: "10%", left: 0, right: 0,
        textAlign: "center",
        opacity: lifecycle,
      }}>
        <div style={{
          display: "inline-block",
          background: `rgba(${rgb},0.15)`,
          border: `1px solid rgba(${rgb},0.4)`,
          padding: "8px 22px",
          borderRadius: 16,
          fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 22,
          color: brandColor,
          direction: "rtl",
        }}>
          {Math.round((1 - drainProg) * 100)}% נותר
        </div>
      </div>

      {/* Bottom message */}
      {label && (
        <div style={{
          position: "absolute", bottom: "10%", left: 0, right: 0,
          textAlign: "center",
          opacity: lifecycle,
        }}>
          <div style={{
            fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 42,
            color: "#FFF", direction: "rtl",
            textShadow: `0 0 20px rgba(${rgb},0.4)`,
          }}>
            {label}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL SPOTLIGHT ISOLATE — One item lit among many in shadow
// ══════════════════════════════════════════════════════════════════════════════

export const VisualSpotlightIsolate: React.FC<Pack9Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const otherItems = items?.map(i => i.text) || [
    "תוכן רנדומלי", "פוסט סטנדרטי", "מאמר רגיל", "פוסט קצר",
    "מודעה גנרית", "תמונה רגילה", "טקסט פשוט", "פוסט יומי",
  ];
  const heroItem = primary || "הסרטון הזה";

  // Spotlight reveal — circle of light grows around hero
  const spotProg = spring({ frame: Math.max(0, frame - 14), fps, config: SPRING_PRESETS.smooth });
  const spotRadius = interpolate(spotProg, [0, 1], [50, 280]);

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  // Hero item pulse
  const heroPulse = spotProg > 0.5
    ? 1 + Math.sin(frame * 0.12) * 0.04
    : 1;

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* Dim items in background grid */}
      <div style={{
        position: "absolute", inset: 80,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 20,
        opacity: panelReveal,
      }}>
        {otherItems.slice(0, 9).map((item, i) => {
          const isHero = i === 4;
          return (
            <div key={i} style={{
              aspectRatio: "1 / 1",
              background: isHero ? `rgba(${rgb},0.15)` : "rgba(60,60,70,0.3)",
              borderRadius: 16,
              border: isHero ? `2px solid ${brandColor}` : "1px solid rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 12,
              opacity: isHero ? 1 : (1 - spotProg * 0.85),
              filter: isHero ? "none" : `grayscale(${spotProg}) blur(${spotProg * 1}px)`,
              transform: isHero ? `scale(${heroPulse})` : "scale(1)",
              transition: "all 0.4s",
              boxShadow: isHero ? `0 0 50px rgba(${rgb},${spotProg * 0.6})` : "none",
              fontFamily: "'Heebo', sans-serif", fontWeight: isHero ? 900 : 600,
              fontSize: isHero ? 26 : 18,
              color: isHero ? "#FFF" : "rgba(255,255,255,0.5)",
              textAlign: "center", direction: "rtl",
              position: "relative",
            }}>
              {isHero ? heroItem : item}

              {/* Star burst on hero */}
              {isHero && spotProg > 0.7 && (
                <div style={{
                  position: "absolute", top: -16, right: -16,
                  background: brandColor,
                  borderRadius: "50%",
                  width: 44, height: 44,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                  boxShadow: `0 0 20px rgba(${rgb},0.6)`,
                  transform: `scale(${spotProg})`,
                }}>
                  
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Spotlight cone from top */}
      <div style={{
        position: "absolute",
        top: 0, left: "50%",
        transform: "translateX(-50%)",
        width: 0, height: 0,
        borderLeft: `${spotRadius}px solid transparent`,
        borderRight: `${spotRadius}px solid transparent`,
        borderTop: `1100px solid rgba(${rgb},${spotProg * 0.08})`,
        pointerEvents: "none",
        filter: "blur(20px)",
      }} />

      {/* Top label */}
      <div style={{
        position: "absolute", top: 30, left: 0, right: 0,
        textAlign: "center",
        opacity: lifecycle,
      }}>
        <div style={{
          display: "inline-block",
          background: `rgba(${rgb},0.15)`,
          border: `1px solid rgba(${rgb},0.4)`,
          padding: "8px 22px",
          borderRadius: 16,
          fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 20,
          color: brandColor,
          direction: "rtl",
        }}>
          מה שונה?
        </div>
      </div>

      {/* Bottom label */}
      {spotProg > 0.8 && (
        <div style={{
          position: "absolute", bottom: 40, left: 0, right: 0,
          textAlign: "center",
          opacity: interpolate(spotProg, [0.8, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * lifecycle,
        }}>
          <div style={{
            display: "inline-block",
            background: brandColor,
            color: "#FFF",
            padding: "12px 28px", borderRadius: 14,
            fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 26,
            direction: "rtl",
            boxShadow: `0 0 30px rgba(${rgb},0.5)`,
          }}>
             זה מה שעובד
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL THUMBS UP BURST — Live reactions floating up
// ══════════════════════════════════════════════════════════════════════════════

export const VisualThumbsUpBurst: React.FC<Pack9Props> = ({
  brandColor,
  durationFrames,
  primary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const label = primary || "תגובות שלא מפסיקות";

  // Generate 40 reactions
  const reactions = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    spawnFrame: i * 3,
    emoji: ["", "", "", "", "", "", "", ""][i % 8],
    xStart: 5 + noise(i, 1) * 90,
    sway: noise(i, 2),
    speed: 1 + noise(i, 3) * 0.8,
    size: 32 + noise(i, 4) * 24,
    rotation: (noise(i, 5) - 0.5) * 30,
  })), []);

  // Counter at top
  const targetCount = 1247;
  const countProg = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 22, stiffness: 40 } });
  const currentCount = Math.round(targetCount * Math.min(countProg, 1));

  return (
    <AbsoluteFill style={{
      background: "radial-gradient(ellipse 60% 50% at 50% 60%, #1A0F2A 0%, #000 80%)",
      opacity: lifecycle,
    }}>
      {/* Live indicator */}
      <div style={{
        position: "absolute", top: 50, left: "50%",
        transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(255,59,48,0.2)",
        border: "1px solid rgba(255,59,48,0.6)",
        padding: "8px 22px",
        borderRadius: 16,
        opacity: lifecycle,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: "#FF3B30",
          opacity: 0.5 + Math.sin(frame * 0.2) * 0.5,
          boxShadow: "0 0 12px #FF3B30",
        }} />
        <span style={{
          fontFamily: "-apple-system, sans-serif", fontWeight: 700, fontSize: 18,
          color: "#FF3B30", letterSpacing: 1,
        }}>
          LIVE
        </span>
      </div>

      {/* Big counter */}
      <div style={{
        position: "absolute", top: 130, left: 0, right: 0,
        textAlign: "center",
        opacity: lifecycle,
      }}>
        <div style={{
          fontFamily: "-apple-system, sans-serif", fontWeight: 900, fontSize: 140,
          color: brandColor,
          textShadow: `0 0 40px rgba(${rgb},0.5)`,
          lineHeight: 1,
        }}>
          {currentCount.toLocaleString()}
        </div>
        <div style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 26,
          color: "rgba(255,255,255,0.6)",
          marginTop: 8,
          direction: "rtl",
        }}>
           תגובות בזמן אמת
        </div>
      </div>

      {/* Floating reactions */}
      {reactions.map((r, i) => {
        const localFrame = frame - r.spawnFrame;
        if (localFrame < 0) return null;
        const yProgress = (localFrame * r.speed) / 100;
        if (yProgress > 1) return null;
        const y = 95 - yProgress * 100;
        const x = r.xStart + Math.sin(localFrame * 0.06 + r.sway * 10) * 6;
        const opacity = interpolate(yProgress, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
        const scale = interpolate(yProgress, [0, 0.2, 1], [0.4, 1, 0.7]);
        const rotation = r.rotation + Math.sin(localFrame * 0.08) * 8;

        return (
          <div key={i} style={{
            position: "absolute",
            left: `${x}%`, top: `${y}%`,
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
            opacity,
            fontSize: r.size,
            filter: `drop-shadow(0 0 10px rgba(${rgb},0.4))`,
            pointerEvents: "none",
          }}>
            {r.emoji}
          </div>
        );
      })}

      {/* Bottom label */}
      {label && (
        <div style={{
          position: "absolute", bottom: "8%", left: 0, right: 0,
          textAlign: "center",
          opacity: countProg * lifecycle,
        }}>
          <div style={{
            display: "inline-block",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            padding: "12px 28px", borderRadius: 14,
            border: `1px solid rgba(${rgb},0.4)`,
            fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 22,
            color: "#FFF", direction: "rtl",
          }}>
            {label}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL PUZZLE COMPLETE — Pieces connecting
// ══════════════════════════════════════════════════════════════════════════════

export const VisualPuzzleComplete: React.FC<Pack9Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  // 6 puzzle pieces (2x3 grid)
  const pieces = items?.slice(0, 6).map((it, i) => ({
    label: it.text,
    icon: it.icon || ["", "", "", "", "", ""][i],
  })) || [
    { label: "אסטרטגיה", icon: "" },
    { label: "תוכן", icon: "" },
    { label: "נתונים", icon: "" },
    { label: "סרטונים", icon: "" },
    { label: "יצירתיות", icon: "" },
    { label: "השקה", icon: "" },
  ];

  // Position grid (2 cols × 3 rows centered)
  const positions = [
    { x: 360, y: 480, sX: -300, sY: -300 },
    { x: 720, y: 480, sX: 300, sY: -300 },
    { x: 360, y: 740, sX: -300, sY: 300 },
    { x: 720, y: 740, sX: 300, sY: 300 },
    { x: 360, y: 1000, sX: -300, sY: 300 },
    { x: 720, y: 1000, sX: 300, sY: 300 },
  ];

  const STAGGER = 10;

  // Final glow when all pieces connected
  const allDone = frame > 8 + pieces.length * STAGGER + 20;
  const completePulse = allDone ? 1 + Math.sin(frame * 0.1) * 0.03 : 1;

  return (
    <AbsoluteFill style={{
      background: "radial-gradient(ellipse 60% 50% at 50% 50%, #0F0A1F 0%, #000 80%)",
      opacity: lifecycle,
    }}>
      {/* Ambient glow when complete */}
      {allDone && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 800, height: 800, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${rgb},0.15) 0%, transparent 70%)`,
          transform: `translate(-50%, -50%) scale(${completePulse})`,
          filter: "blur(40px)",
        }} />
      )}

      {/* Puzzle pieces */}
      {pieces.map((piece, i) => {
        const pieceDelay = 8 + i * STAGGER;
        const pieceProg = spring({
          frame: Math.max(0, frame - pieceDelay), fps, config: SPRING_PRESETS.snappy,
        });
        const p = positions[i];
        const currentX = p.x + p.sX * (1 - pieceProg);
        const currentY = p.y + p.sY * (1 - pieceProg);
        const currentRot = (1 - pieceProg) * (p.sX < 0 ? -15 : 15);

        const isConnected = pieceProg > 0.9;

        // Puzzle piece shape via SVG
        return (
          <div key={i} style={{
            position: "absolute",
            left: currentX, top: currentY,
            transform: `translate(-50%, -50%) rotate(${currentRot}deg) scale(${pieceProg * (isConnected ? completePulse : 1)})`,
            opacity: pieceProg,
            width: 280, height: 200,
          }}>
            <svg width="280" height="200" viewBox="0 0 280 200" style={{
              filter: isConnected ? `drop-shadow(0 0 20px rgba(${rgb},0.5))` : "none",
            }}>
              <defs>
                <linearGradient id={`pieceGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={brandColor} />
                  <stop offset="100%" stopColor={`rgba(${rgb},0.6)`} />
                </linearGradient>
              </defs>
              {/* Puzzle piece path — rough simplified rectangle with knobs */}
              <path
                d={`M 20 20
                    L ${20 + 100} 20
                    Q ${20 + 100 + 15} 5, ${20 + 100 + 30} 20
                    L ${20 + 220} 20
                    L 260 ${20 + 60}
                    Q 280 ${20 + 75}, 260 ${20 + 90}
                    L 260 ${20 + 160}
                    L ${260 - 80} ${180}
                    Q ${260 - 95} ${195}, ${260 - 110} 180
                    L 20 180
                    L 20 ${20 + 120}
                    Q 5 ${20 + 105}, 20 ${20 + 90}
                    Z`}
                fill={`url(#pieceGrad${i})`}
                stroke={isConnected ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
                strokeWidth="2"
              />
            </svg>

            {/* Content */}
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 6,
            }}>
              <span style={{ fontSize: 50 }}>{piece.icon}</span>
              <span style={{
                fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 22,
                color: "#FFF", direction: "rtl",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              }}>
                {piece.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Top label */}
      <div style={{
        position: "absolute", top: "8%", left: 0, right: 0,
        textAlign: "center",
        opacity: lifecycle,
      }}>
        <div style={{
          display: "inline-block",
          background: `rgba(${rgb},0.15)`,
          border: `1px solid rgba(${rgb},0.4)`,
          padding: "10px 24px",
          borderRadius: 18,
          fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 24,
          color: brandColor,
          direction: "rtl",
        }}>
          המערכת המלאה
        </div>
      </div>

      {/* Bottom message */}
      {allDone && primary && (
        <div style={{
          position: "absolute", bottom: "5%", left: 0, right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [8 + pieces.length * STAGGER + 20, 8 + pieces.length * STAGGER + 35], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          }) * lifecycle,
        }}>
          <div style={{
            display: "inline-block",
            background: brandColor,
            color: "#FFF",
            padding: "14px 32px", borderRadius: 16,
            fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 28,
            direction: "rtl",
            boxShadow: `0 0 40px rgba(${rgb},0.5)`,
          }}>
             {primary}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL DOOR OPEN — Door opening to bright light
// ══════════════════════════════════════════════════════════════════════════════

export const VisualDoorOpen: React.FC<Pack9Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const message = primary || "ההזדמנות שלך";
  const subtitle = secondary || "אם תיכנס עכשיו, החיים שלך משתנים";

  // Door open progress
  const doorOpenProg = spring({ frame: Math.max(0, frame - 14), fps, config: { damping: 22, stiffness: 30, mass: 1.5 } });

  // Light rays intensify as door opens
  const lightIntensity = doorOpenProg;

  // Doorframe reveal
  const frameReveal = spring({ frame: Math.max(0, frame - 4), fps, config: SPRING_PRESETS.snappy });

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* Light explosion behind door (revealed as door opens) */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 1600, height: 1600, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255,255,255,${lightIntensity * 0.8}) 0%, rgba(${rgb},${lightIntensity * 0.6}) 30%, transparent 70%)`,
        transform: `translate(-50%, -50%) scale(${0.3 + lightIntensity * 0.7})`,
        filter: `blur(${20 + lightIntensity * 40}px)`,
      }} />

      {/* Light rays */}
      {lightIntensity > 0.2 && [0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <div key={i} style={{
          position: "absolute", top: "50%", left: "50%",
          width: 4 + lightIntensity * 20,
          height: 1100 * lightIntensity,
          background: `linear-gradient(180deg, rgba(255,255,255,${lightIntensity * 0.6}) 0%, transparent 100%)`,
          transformOrigin: "center bottom",
          transform: `translate(-50%, -100%) rotate(${angle + frame * 0.3}deg)`,
          filter: "blur(8px)",
        }} />
      ))}

      {/* Doorframe */}
      <div style={{
        position: "absolute", top: "12%", left: "50%",
        transform: `translate(-50%, 0) scale(${frameReveal})`,
        width: 500, height: 800,
        opacity: frameReveal,
      }}>
        {/* Frame outline */}
        <div style={{
          position: "absolute", inset: 0,
          border: `16px solid #5C3317`,
          borderRadius: "8px 8px 0 0",
          background: "rgba(0,0,0,0.4)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.8), inset 0 0 0 4px rgba(212,160,23,0.3)",
        }} />

        {/* Inside: door opening to light */}
        <div style={{
          position: "absolute", inset: 16,
          overflow: "hidden",
          background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${lightIntensity}) 0%, rgba(${rgb},${lightIntensity * 0.6}) 40%, rgba(0,0,0,0.9) 100%)`,
        }}>
          {/* Left door panel */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: 0, width: "50%",
            background: `linear-gradient(90deg, #4A2A1A 0%, #2A1810 100%)`,
            borderRight: "2px solid #1A0F08",
            transformOrigin: "left center",
            transform: `perspective(800px) rotateY(${-doorOpenProg * 75}deg)`,
            boxShadow: `inset -10px 0 30px rgba(0,0,0,0.5)`,
          }}>
            {/* Door panel details */}
            <div style={{
              position: "absolute", top: "20%", bottom: "55%", left: "10%", right: "10%",
              border: "2px solid #5C3317",
              borderRadius: 4,
            }} />
            <div style={{
              position: "absolute", top: "55%", bottom: "10%", left: "10%", right: "10%",
              border: "2px solid #5C3317",
              borderRadius: 4,
            }} />
            {/* Handle */}
            <div style={{
              position: "absolute", top: "50%", right: 12,
              width: 14, height: 14, borderRadius: "50%",
              background: "linear-gradient(135deg, #FFD700 0%, #B8860B 100%)",
              boxShadow: "0 0 8px rgba(212,160,23,0.6)",
            }} />
          </div>

          {/* Right door panel */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, right: 0, width: "50%",
            background: `linear-gradient(270deg, #4A2A1A 0%, #2A1810 100%)`,
            borderLeft: "2px solid #1A0F08",
            transformOrigin: "right center",
            transform: `perspective(800px) rotateY(${doorOpenProg * 75}deg)`,
            boxShadow: `inset 10px 0 30px rgba(0,0,0,0.5)`,
          }}>
            <div style={{
              position: "absolute", top: "20%", bottom: "55%", left: "10%", right: "10%",
              border: "2px solid #5C3317",
              borderRadius: 4,
            }} />
            <div style={{
              position: "absolute", top: "55%", bottom: "10%", left: "10%", right: "10%",
              border: "2px solid #5C3317",
              borderRadius: 4,
            }} />
            <div style={{
              position: "absolute", top: "50%", left: 12,
              width: 14, height: 14, borderRadius: "50%",
              background: "linear-gradient(135deg, #FFD700 0%, #B8860B 100%)",
              boxShadow: "0 0 8px rgba(212,160,23,0.6)",
            }} />
          </div>

          {/* Silhouette / icon in the light */}
          {doorOpenProg > 0.6 && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: `translate(-50%, -50%) scale(${interpolate(doorOpenProg, [0.6, 1], [0.5, 1])})`,
              fontSize: 100,
              opacity: interpolate(doorOpenProg, [0.6, 1], [0, 1]),
              filter: `drop-shadow(0 0 30px rgba(${rgb},0.8))`,
            }}>
              
            </div>
          )}
        </div>
      </div>

      {/* Bottom message */}
      {doorOpenProg > 0.5 && (
        <div style={{
          position: "absolute", bottom: "8%", left: 0, right: 0,
          textAlign: "center",
          opacity: interpolate(doorOpenProg, [0.5, 0.9], [0, 1]) * lifecycle,
        }}>
          <div style={{
            display: "inline-block",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            padding: "16px 36px",
            borderRadius: 16,
            border: `2px solid rgba(${rgb},0.5)`,
            boxShadow: `0 0 40px rgba(${rgb},0.4)`,
          }}>
            <div style={{
              fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 38,
              color: "#FFF", direction: "rtl",
            }}>
              {message}
            </div>
            {subtitle && (
              <div style={{
                fontFamily: "'Heebo', sans-serif", fontWeight: 500, fontSize: 20,
                color: `rgba(${rgb},0.9)`, direction: "rtl", marginTop: 6,
              }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
