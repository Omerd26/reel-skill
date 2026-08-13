/**
 * BRollPack8_Education.tsx — Education & drama scenes.
 *
 * Scenes:
 *   - ui_whiteboard:        Whiteboard with handwriting + arrows
 *   - ui_keynote_slide:     Presentation slide with bullet points
 *   - visual_diagram_build: Connected nodes building a system diagram
 *   - visual_stop_sign:     Giant red STOP sign with shaking + sound waves
 *   - ui_system_alert:      iOS/Mac system alert popup
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

export interface Pack8Props {
  brandColor: string;
  durationFrames: number;
  primary?: string;
  secondary?: string;
  items?: { text: string; icon?: string; sub_text?: string; value?: string }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// UI WHITEBOARD — Handwritten explanation with arrows
// ══════════════════════════════════════════════════════════════════════════════

export const UIWhiteboard: React.FC<Pack8Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const title = primary || "המסע של הלקוח";
  const nodes = items?.map((i, idx) => ({
    text: i.text,
    color: i.icon || ["#FF6B6B", "#4ECDC4", "#FFD93D", "#A78BFA"][idx % 4],
  })) || [
    { text: "מודעות", color: "#FF6B6B" },
    { text: "עניין", color: "#FFD93D" },
    { text: "החלטה", color: "#4ECDC4" },
    { text: "פעולה", color: "#A78BFA" },
  ];

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  // Title types out
  const titleChars = Math.max(0, Math.min(title.length, Math.floor((frame - 8) * 0.4)));
  const visibleTitle = title.slice(0, titleChars);

  return (
    <AbsoluteFill style={{
      background: "#F0EBE0",
      opacity: lifecycle,
    }}>
      {/* Paper texture / cork board feel */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 30% 20%, rgba(0,0,0,0.05) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(0,0,0,0.05) 0%, transparent 50%)`,
      }} />

      {/* Whiteboard frame */}
      <div style={{
        position: "absolute", top: 40, left: 40, right: 40, bottom: 40,
        background: "#FFFEF7",
        borderRadius: 8,
        opacity: panelReveal,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15), inset 0 0 60px rgba(0,0,0,0.05)",
        border: "12px solid #5C3317",
        padding: "30px 40px",
        overflow: "hidden",
      }}>
        {/* Hand-drawn underline animation */}
        <svg width="100%" height="80" style={{ position: "absolute", top: 30, left: 0 }}>
          <path
            d="M 60 60 Q 200 50, 400 58 T 800 55"
            fill="none"
            stroke={brandColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="800"
            strokeDashoffset={interpolate(frame, [4, 30], [800, 0], { extrapolateRight: "clamp" })}
            style={{ filter: "url(#roughen)" }}
          />
        </svg>

        {/* Title — handwriting style */}
        <div style={{
          fontFamily: "'Caveat', 'Bradley Hand', cursive",
          fontWeight: 700, fontSize: 64,
          color: "#1A1A1A",
          textAlign: "center",
          paddingTop: 30,
          marginBottom: 36,
          direction: "rtl",
        }}>
          {visibleTitle}
          {titleChars < title.length && frame > 8 && (
            <span style={{
              display: "inline-block",
              width: 4, height: 50,
              background: "#1A1A1A",
              marginRight: 4,
              verticalAlign: "middle",
              opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
            }} />
          )}
        </div>

        {/* Flow nodes */}
        <div style={{
          display: "flex", flexDirection: "row-reverse",
          alignItems: "center", justifyContent: "center",
          gap: 20, marginTop: 80,
        }}>
          {nodes.map((node, i) => {
            const nodeDelay = 24 + i * 18;
            const nodeProg = spring({
              frame: Math.max(0, frame - nodeDelay), fps, config: SPRING_PRESETS.bouncy,
            });
            const arrowDelay = nodeDelay + 10;
            const arrowProg = spring({
              frame: Math.max(0, frame - arrowDelay), fps, config: SPRING_PRESETS.smooth,
            });

            return (
              <React.Fragment key={i}>
                {/* Node — rough circle */}
                <div style={{
                  width: 140, height: 140, borderRadius: "50%",
                  background: node.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Caveat', 'Bradley Hand', cursive",
                  fontWeight: 700, fontSize: 32,
                  color: "#FFF",
                  border: "5px solid #1A1A1A",
                  boxShadow: "4px 4px 0 #1A1A1A",
                  transform: `scale(${nodeProg}) rotate(${(i % 2) * 4 - 2}deg)`,
                  direction: "rtl",
                  position: "relative",
                }}>
                  {node.text}
                  {/* Number badge */}
                  <div style={{
                    position: "absolute", top: -12, right: -8,
                    background: "#1A1A1A",
                    color: "#FFF",
                    width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Caveat', cursive",
                    fontSize: 20, fontWeight: 700,
                    transform: "rotate(8deg)",
                  }}>
                    {i + 1}
                  </div>
                </div>

                {/* Arrow between nodes (not after last) */}
                {i < nodes.length - 1 && (
                  <svg width="60" height="50" viewBox="0 0 60 50" style={{ flexShrink: 0 }}>
                    <path
                      d="M 5 25 Q 30 10, 45 25"
                      fill="none"
                      stroke="#1A1A1A"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="50"
                      strokeDashoffset={(1 - arrowProg) * 50}
                    />
                    {arrowProg > 0.7 && (
                      <polygon points="45,25 38,18 38,32" fill="#1A1A1A" />
                    )}
                  </svg>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Hand-drawn highlights / squiggles */}
        {frame > 80 && (
          <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
            <path
              d="M 100 600 Q 200 580, 350 595 T 800 590"
              fill="none"
              stroke="#FFD600"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.4"
              strokeDasharray="700"
              strokeDashoffset={interpolate(frame, [80, 110], [700, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })}
            />
          </svg>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI KEYNOTE SLIDE — Presentation slide with bullets
// ══════════════════════════════════════════════════════════════════════════════

export const UIKeynoteSlide: React.FC<Pack8Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const title = primary || "3 כללי הזהב לוויראליות";
  const subtitle = secondary || "מה שלמדתי אחרי 500 סרטונים";
  const bullets = items?.map(i => ({
    title: i.text,
    sub: i.sub_text || "",
    icon: i.icon || "",
  })) || [
    { title: "תהיה אישי", sub: "אנשים לא מתחברים למוצרים, הם מתחברים לאנשים", icon: "1" },
    { title: "תהיה ספציפי", sub: "מספרים, שמות ודוגמאות בוערות", icon: "2" },
    { title: "תהיה שימושי", sub: "תן ערך לפני שאתה מבקש משהו", icon: "3" },
  ];

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });
  const STAGGER = 18;

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)",
      opacity: lifecycle,
    }}>
      {/* Slide */}
      <div style={{
        position: "absolute", top: 80, left: 80, right: 80, bottom: 80,
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 30px 80px rgba(0,0,0,0.15)",
        padding: "60px 70px",
        opacity: panelReveal,
        transform: `scale(${interpolate(panelReveal, [0, 1], [0.95, 1])})`,
        overflow: "hidden",
      }}>
        {/* Brand bar on left */}
        <div style={{
          position: "absolute", left: 0, top: 60, bottom: 60,
          width: 8,
          background: brandColor,
          borderRadius: "0 4px 4px 0",
        }} />

        {/* Title */}
        <div style={{
          fontFamily: "'Heebo', -apple-system, sans-serif",
          fontWeight: 900, fontSize: 56,
          color: "#1A1A1A",
          direction: "rtl",
          lineHeight: 1.1,
          marginBottom: 12,
          opacity: spring({ frame: Math.max(0, frame - 8), fps, config: SPRING_PRESETS.smooth }),
        }}>
          {title}
        </div>

        {/* Subtitle */}
        <div style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 500, fontSize: 26,
          color: "#666",
          direction: "rtl",
          marginBottom: 40,
          opacity: spring({ frame: Math.max(0, frame - 14), fps, config: SPRING_PRESETS.smooth }),
        }}>
          {subtitle}
        </div>

        {/* Bullets */}
        <div style={{
          display: "flex", flexDirection: "column",
          gap: 28,
        }}>
          {bullets.map((b, i) => {
            const bulletDelay = 22 + i * STAGGER;
            const bulletProg = spring({
              frame: Math.max(0, frame - bulletDelay), fps, config: SPRING_PRESETS.snappy,
            });
            return (
              <div key={i} style={{
                display: "flex", flexDirection: "row-reverse",
                alignItems: "flex-start", gap: 20,
                opacity: bulletProg,
                transform: `translateX(${interpolate(bulletProg, [0, 1], [40, 0])}px)`,
              }}>
                {/* Number/icon circle */}
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: brandColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 24,
                  color: "#FFF", flexShrink: 0,
                  boxShadow: `0 4px 16px rgba(${rgb},0.4)`,
                }}>
                  {b.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, direction: "rtl" }}>
                  <div style={{
                    fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 32,
                    color: "#1A1A1A",
                  }}>
                    {b.title}
                  </div>
                  <div style={{
                    fontFamily: "'Heebo', sans-serif", fontWeight: 400, fontSize: 20,
                    color: "#5F5F5F",
                    marginTop: 4,
                    lineHeight: 1.45,
                  }}>
                    {b.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Page indicator at bottom */}
        <div style={{
          position: "absolute", bottom: 24, right: 70,
          display: "flex", gap: 6,
        }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: i === 1 ? 24 : 8, height: 8, borderRadius: 4,
              background: i === 1 ? brandColor : "#DDD",
              transition: "width 0.3s",
            }} />
          ))}
        </div>

        {/* Logo bottom-left */}
        <div style={{
          position: "absolute", bottom: 24, left: 70,
          fontFamily: "-apple-system, sans-serif", fontWeight: 600, fontSize: 14,
          color: "#999",
        }}>
          omer.digital
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL DIAGRAM BUILD — Connected nodes building a system
// ══════════════════════════════════════════════════════════════════════════════

export const VisualDiagramBuild: React.FC<Pack8Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  // 5 nodes positioned in a flow pattern
  const nodes = items?.slice(0, 5).map((it, i) => ({
    text: it.text,
    icon: it.icon || ["", "", "", "", ""][i],
  })) || [
    { text: "רעיון", icon: "" },
    { text: "תוכן", icon: "" },
    { text: "פרסום", icon: "" },
    { text: "מעורבות", icon: "" },
    { text: "תוצאות", icon: "" },
  ];

  // Layout: positions for 5 nodes (works around 1080x1920)
  const positions = [
    { x: 250, y: 600 },   // top left
    { x: 540, y: 450 },   // center top
    { x: 830, y: 600 },   // top right
    { x: 380, y: 900 },   // bottom left-center
    { x: 700, y: 900 },   // bottom right-center
  ];

  // Connections between nodes (define edges)
  const edges = [
    [0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 4],
  ];

  const STAGGER = 10;

  return (
    <AbsoluteFill style={{
      background: "radial-gradient(ellipse 60% 50% at 50% 50%, #0A0A1F 0%, #000 80%)",
      opacity: lifecycle,
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(${rgb},0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(${rgb},0.05) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />

      {/* SVG for edges */}
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={brandColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={brandColor} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {edges.map(([from, to], i) => {
          const edgeDelay = 16 + Math.max(from, to) * STAGGER;
          const edgeProg = spring({
            frame: Math.max(0, frame - edgeDelay), fps, config: { damping: 30, stiffness: 30 },
          });
          if (frame < edgeDelay) return null;

          const p1 = positions[from];
          const p2 = positions[to];
          const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

          return (
            <g key={i}>
              <line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={`rgba(${rgb},0.6)`}
                strokeWidth="2"
                strokeDasharray={length}
                strokeDashoffset={length * (1 - edgeProg)}
                style={{ filter: `drop-shadow(0 0 4px rgba(${rgb},0.5))` }}
              />
              {/* Flowing dot */}
              {edgeProg > 0.9 && (() => {
                const flowPhase = ((frame - edgeDelay - 30) % 60) / 60;
                if (flowPhase < 0) return null;
                const fx = p1.x + (p2.x - p1.x) * flowPhase;
                const fy = p1.y + (p2.y - p1.y) * flowPhase;
                return (
                  <circle cx={fx} cy={fy} r="4" fill={brandColor}
                    style={{ filter: `drop-shadow(0 0 8px ${brandColor})` }} />
                );
              })()}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => {
        const nodeDelay = 8 + i * STAGGER;
        const nodeProg = spring({
          frame: Math.max(0, frame - nodeDelay), fps, config: SPRING_PRESETS.pop,
        });
        const p = positions[i];

        return (
          <div key={i} style={{
            position: "absolute",
            left: p.x, top: p.y,
            transform: `translate(-50%, -50%) scale(${nodeProg})`,
            opacity: nodeProg * lifecycle,
          }}>
            {/* Node circle */}
            <div style={{
              width: 130, height: 130, borderRadius: "50%",
              background: `rgba(${rgb},0.15)`,
              border: `3px solid ${brandColor}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 4,
              boxShadow: `0 0 40px rgba(${rgb},0.4)`,
              backdropFilter: "blur(8px)",
            }}>
              <span style={{ fontSize: 38 }}>{node.icon}</span>
            </div>

            {/* Label below */}
            <div style={{
              position: "absolute", top: 140, left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 22,
              color: "#FFF", direction: "rtl",
              whiteSpace: "nowrap",
              background: "rgba(0,0,0,0.6)",
              padding: "4px 12px", borderRadius: 8,
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}>
              {node.text}
            </div>
          </div>
        );
      })}

      {/* Title */}
      {primary && (
        <div style={{
          position: "absolute", top: "10%", left: 0, right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }) * lifecycle,
        }}>
          <div style={{
            display: "inline-block",
            background: `rgba(${rgb},0.2)`,
            border: `1px solid rgba(${rgb},0.5)`,
            padding: "10px 24px",
            borderRadius: 20,
            fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 26,
            color: "#FFF", direction: "rtl",
          }}>
            {primary}
          </div>
        </div>
      )}

      {/* Completion checkmark when all nodes done */}
      {frame > 16 + nodes.length * STAGGER + 30 && (
        <div style={{
          position: "absolute", bottom: "12%", left: 0, right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [16 + nodes.length * STAGGER + 30, 16 + nodes.length * STAGGER + 50], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          }),
        }}>
          <div style={{
            display: "inline-block",
            background: brandColor,
            padding: "12px 28px", borderRadius: 14,
            fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 26,
            color: "#FFF", direction: "rtl",
            boxShadow: `0 0 30px rgba(${rgb},0.5)`,
          }}>
             המערכת מוכנה
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL STOP SIGN — Giant red STOP with shake + sound waves
// ══════════════════════════════════════════════════════════════════════════════

export const VisualStopSign: React.FC<Pack8Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 4, 10);

  const message = primary || "STOP";
  const subtitle = secondary || "תפסיק לעשות את הטעות הזו";

  // Sign slam in
  const slamProg = spring({ frame, fps, config: SPRING_PRESETS.slam });
  const slamScale = interpolate(slamProg, [0, 1], [2.5, 1]);

  // Continuous shake after landing
  const shake = slamProg > 0.8
    ? Math.sin(frame * 1.5) * 4 + Math.sin(frame * 2.7) * 3
    : 0;

  // Sound waves emanating
  const waves = useMemo(() => [0, 1, 2, 3, 4].map(i => ({
    startFrame: 10 + i * 14,
  })), []);

  // Flash effect on impact
  const flashOpacity = interpolate(slamProg, [0.3, 0.5, 0.7], [0, 0.6, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* Red impact flash */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at 50% 50%, rgba(220,30,30,${flashOpacity}) 0%, transparent 50%)`,
      }} />

      {/* Sound waves */}
      {waves.map((w, i) => {
        const localFrame = frame - w.startFrame;
        if (localFrame < 0) return null;
        const progress = Math.min(1, localFrame / 60);
        const size = progress * 1400;
        const opacity = (1 - progress) * 0.5;
        return (
          <div key={i} style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: size, height: size,
            borderRadius: "50%",
            border: `4px solid rgba(220,30,30,${opacity})`,
            transform: "translate(-50%, -50%)",
          }} />
        );
      })}

      {/* Glow behind sign */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 700, height: 700, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(220,30,30,0.3) 0%, transparent 60%)`,
        transform: "translate(-50%, -50%)",
        filter: "blur(40px)",
        opacity: lifecycle * (0.4 + Math.sin(frame * 0.15) * 0.2),
      }} />

      {/* STOP sign — octagon */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -50%) translate(${shake}px, 0) scale(${slamScale})`,
      }}>
        <svg width="600" height="600" viewBox="0 0 200 200" style={{
          filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.8))",
        }}>
          {/* Octagon */}
          <polygon
            points="60,15 140,15 185,60 185,140 140,185 60,185 15,140 15,60"
            fill="#DC1E1E"
            stroke="#FFF"
            strokeWidth="6"
          />
          {/* Inner border */}
          <polygon
            points="68,28 132,28 172,68 172,132 132,172 68,172 28,132 28,68"
            fill="none"
            stroke="#FFF"
            strokeWidth="2"
            opacity="0.6"
          />
          {/* STOP text */}
          <text x="100" y="118"
            textAnchor="middle"
            fontFamily="-apple-system, sans-serif"
            fontWeight="900"
            fontSize="60"
            fill="#FFF"
            style={{ letterSpacing: 2 }}
          >
            {message}
          </text>
        </svg>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{
          position: "absolute", bottom: "12%", left: 0, right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [14, 26], [0, 1], { extrapolateRight: "clamp" }) * lifecycle,
        }}>
          <div style={{
            display: "inline-block",
            background: "rgba(220,30,30,0.2)",
            border: "2px solid rgba(220,30,30,0.6)",
            padding: "14px 36px",
            borderRadius: 16,
            fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 32,
            color: "#FFF", direction: "rtl",
            backdropFilter: "blur(10px)",
          }}>
            {subtitle}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI SYSTEM ALERT — iOS/Mac system alert popup
// ══════════════════════════════════════════════════════════════════════════════

export const UISystemAlert: React.FC<Pack8Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const title = primary || "אזהרה ";
  const body = secondary || "אם לא תתחיל לפעול בשבועיים הקרובים, תפסיד את ההזדמנות הזו לתמיד";
  const cancelLabel = items?.[0]?.text || "ביטול";
  const confirmLabel = items?.[1]?.text || "כן, בוא נתחיל";

  // Modal slams in with overshoot
  const modalProg = spring({ frame: Math.max(0, frame - 4), fps, config: SPRING_PRESETS.slam });
  const modalScale = interpolate(modalProg, [0, 1], [0.5, 1]);

  // Backdrop fade
  const backdropOpacity = interpolate(frame, [0, 8], [0, 0.7], { extrapolateRight: "clamp" });

  // Icon pulse
  const iconPulse = 1 + Math.sin(frame * 0.15) * 0.05;

  // Confirm button glow pulse
  const btnGlow = 0.4 + Math.sin(frame * 0.1) * 0.2;

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(180deg, #1A1A2E 0%, #0A0A1A 100%)",
      opacity: lifecycle,
    }}>
      {/* Blurred backdrop */}
      <AbsoluteFill style={{
        background: "rgba(0,0,0,1)",
        opacity: backdropOpacity,
      }} />

      {/* Modal */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -50%) scale(${modalScale})`,
        background: "rgba(38,38,40,0.95)",
        backdropFilter: "blur(40px)",
        borderRadius: 20,
        padding: "32px 28px 0",
        width: 760,
        boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
        border: "0.5px solid rgba(255,255,255,0.15)",
        opacity: lifecycle,
      }}>
        {/* Warning icon */}
        <div style={{
          textAlign: "center",
          marginBottom: 20,
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 90, height: 90, borderRadius: "50%",
            background: "rgba(255,193,7,0.15)",
            border: "2px solid rgba(255,193,7,0.5)",
            transform: `scale(${iconPulse})`,
            boxShadow: `0 0 30px rgba(255,193,7,0.3)`,
          }}>
            <span style={{ fontSize: 50 }}>●</span>
          </div>
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "-apple-system, 'Heebo', sans-serif",
          fontWeight: 700, fontSize: 32,
          color: "#FFFFFF",
          textAlign: "center",
          direction: "rtl",
          marginBottom: 14,
        }}>
          {title}
        </div>

        {/* Body */}
        <div style={{
          fontFamily: "-apple-system, 'Heebo', sans-serif",
          fontWeight: 400, fontSize: 22,
          color: "rgba(255,255,255,0.75)",
          textAlign: "center",
          direction: "rtl",
          lineHeight: 1.45,
          padding: "0 28px",
          marginBottom: 28,
        }}>
          {body}
        </div>

        {/* Buttons row */}
        <div style={{
          display: "flex",
          borderTop: "0.5px solid rgba(255,255,255,0.15)",
        }}>
          <div style={{
            flex: 1,
            padding: "18px 0",
            textAlign: "center",
            fontFamily: "-apple-system, 'Heebo', sans-serif",
            fontWeight: 500, fontSize: 22,
            color: "rgba(255,255,255,0.6)",
            borderRight: "0.5px solid rgba(255,255,255,0.15)",
            direction: "rtl",
          }}>
            {cancelLabel}
          </div>
          <div style={{
            flex: 1,
            padding: "18px 0",
            textAlign: "center",
            fontFamily: "-apple-system, 'Heebo', sans-serif",
            fontWeight: 700, fontSize: 22,
            color: brandColor,
            direction: "rtl",
            position: "relative",
          }}>
            {confirmLabel}
            {/* Pulsing tap indicator */}
            <div style={{
              position: "absolute",
              top: 0, bottom: 0, left: 0, right: 0,
              borderRadius: "0 0 20px 0",
              background: `radial-gradient(circle at 50% 50%, rgba(${rgb},${btnGlow * 0.3}) 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />
          </div>
        </div>
      </div>

      {/* Fake cursor pointing to confirm button */}
      {frame > 30 && (
        <div style={{
          position: "absolute", top: "calc(50% + 130px)", left: "60%",
          transform: `translate(${Math.sin(frame * 0.15) * 3}px, 0)`,
          opacity: interpolate(frame, [30, 40], [0, 1], { extrapolateRight: "clamp" }) * lifecycle,
        }}>
          <svg width="40" height="50" viewBox="0 0 40 50">
            <path d="M 5 5 L 5 35 L 12 30 L 17 42 L 22 40 L 17 28 L 26 28 Z"
              fill="#FFF" stroke="#000" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};
