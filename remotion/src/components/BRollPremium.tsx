/**
 * BRollPremium.tsx — Premium B-roll scene components.
 *
 * These scenes break out of the "dark card with icons" look.
 * They use cinematic composition, depth, environmental lighting,
 * spatial layouts, and visual metaphors.
 *
 * Each scene is designed to feel human-directed — like a motion designer
 * made it — not like a template stamped data onto a dark rectangle.
 *
 * Scene categories:
 *   CINEMATIC  — full-screen visual impact, metaphors, atmosphere
 *   DATA       — numbers/stats with cinematic treatment
 *   NARRATIVE  — process/story with spatial depth
 *   ACCENT     — quick 1-2s emphasis hits
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import { SceneStage, CameraRig, type CameraPose } from "./SceneStage";
import * as Icons from "lucide-react";
import { getBrandIcon } from "./BrandIcons";
import {
  SPRING_PRESETS,
  useSceneLifecycle,
  useStaggeredEntry,
  useBreathing,
  usePulseGlow,
  useDelayedSpring,
  hexToRgb,
  noise,
  getBgStyle,
  type BgPreset,
  parseSceneNumber,
} from "./BRollMotion";

// ── Icon helper (shared) ──────────────────────────────────────────────────────

function LucideIcon({
  name,
  size = 48,
  color = "#FFFFFF",
  strokeWidth = 2,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const BrandIcon = getBrandIcon(name);
  if (BrandIcon) return <BrandIcon size={size} color={color} />;
  const Icon = (Icons as Record<string, any>)[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

// ── Shared props interface ────────────────────────────────────────────────────

export interface PremiumSceneProps {
  brandColor: string;
  durationFrames: number;
  title?: string;
  primary?: string;
  secondary?: string;
  icon?: string;
  items?: { text: string; icon?: string; sub_text?: string; value?: string }[];
  accent_color?: string;
  bg?: BgPreset;
}

// ══════════════════════════════════════════════════════════════════════════════
// CINEMATIC 1: SPOTLIGHT REVEAL
// Full-screen text that materializes from darkness with a dramatic spotlight.
// Use for: punchlines, key statements, dramatic reveals.
// ══════════════════════════════════════════════════════════════════════════════

export const SpotlightReveal: React.FC<PremiumSceneProps> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
  icon,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 15, 12);

  // Spotlight beam expands from center
  const spotlightSize = spring({
    frame,
    fps,
    config: SPRING_PRESETS.heavy,
  });
  const spotRadius = interpolate(spotlightSize, [0, 1], [0, 65]);

  // Text emerges after spotlight establishes
  const textReveal = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: SPRING_PRESETS.smooth,
  });
  const textY = interpolate(textReveal, [0, 1], [30, 0]);

  // Secondary text delays further
  const subReveal = spring({
    frame: Math.max(0, frame - 22),
    fps,
    config: SPRING_PRESETS.smooth,
  });

  // Subtle scan line for cinematic feel
  const scanY = interpolate(frame, [0, durationFrames], [-10, 110]);

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* Spotlight gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse ${spotRadius}% ${spotRadius * 0.7}% at 50% 42%, rgba(${rgb},0.14) 0%, rgba(${rgb},0.04) 40%, transparent 70%)`,
        }}
      />

      {/* Subtle ambient grain texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)`,
          opacity: 0.5,
        }}
      />

      {/* Moving scan line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${scanY}%`,
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, rgba(${rgb},0.15) 30%, rgba(${rgb},0.15) 70%, transparent 100%)`,
        }}
      />

      {/* Icon (if provided) — appears first */}
      {icon && (
        <div
          style={{
            position: "absolute",
            top: "28%",
            left: "50%",
            transform: `translate(-50%, 0) scale(${spotlightSize})`,
            opacity: lifecycle * spotlightSize,
          }}
        >
          <LucideIcon name={icon} size={64} color={brandColor} strokeWidth={1.5} />
        </div>
      )}

      {/* Main text */}
      <div
        style={{
          position: "absolute",
          top: icon ? "42%" : "38%",
          left: 70,
          right: 70,
          textAlign: "center",
          transform: `translateY(${textY}px)`,
          opacity: textReveal * lifecycle,
        }}
      >
        <div
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 76,
            color: "#FFFFFF",
            direction: "rtl",
            lineHeight: 1.2,
            letterSpacing: "-1px",
            textShadow: `0 0 60px rgba(${rgb},0.3), 0 2px 4px rgba(0,0,0,0.8)`,
          }}
        >
          {primary}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: interpolate(textReveal, [0, 1], [0, 120]),
            height: 3,
            background: brandColor,
            margin: "24px auto 0",
            borderRadius: 2,
            boxShadow: `0 0 20px rgba(${rgb},0.6)`,
          }}
        />
      </div>

      {/* Secondary text */}
      {secondary && (
        <div
          style={{
            position: "absolute",
            top: icon ? "62%" : "58%",
            left: 80,
            right: 80,
            textAlign: "center",
            opacity: subReveal * lifecycle,
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 500,
            fontSize: 36,
            color: `rgba(${rgb},0.85)`,
            direction: "rtl",
            lineHeight: 1.4,
          }}
        >
          {secondary}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CINEMATIC 2: SHOCKWAVE COUNTER
// A large number that slams into frame with a shockwave ring effect.
// Use for: big stats, impressive numbers, proof moments.
// ══════════════════════════════════════════════════════════════════════════════

export const ShockwaveCounter: React.FC<
  PremiumSceneProps & { suffix?: string; label?: string; title?: string }
> = ({ brandColor, durationFrames, primary, suffix, label, icon, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  // ROBUST number extraction (2026-08-09, owner screenshot: "10,000"
  // rendered as "10" — parseFloat stops at the comma; "10K" lost its K).
  // Commas stripped, K/M multipliers honored, display comma-grouped.
  const numMatch = /([\d][\d,\.]*)\s*([KMkm])?/.exec(primary || "");
  const rawNum = numMatch ? parseFloat(numMatch[1].replace(/,/g, "")) : 0;
  const mult = numMatch && numMatch[2] ? (numMatch[2].toUpperCase() === "K" ? 1000 : 1000000) : 1;
  const targetNum = rawNum * mult;

  // Number counts up with dramatic timing — fast start, slow finish
  const countProgress = spring({
    frame,
    fps,
    config: { damping: 22, stiffness: 60, mass: 1.5 },
  });
  const currentNum = Math.round(targetNum * Math.min(countProgress, 1));

  // Shockwave ring expands outward from the number
  const shockwaveProgress = spring({
    frame: Math.max(0, frame - Math.round(fps * 0.3)),
    fps,
    config: { damping: 30, stiffness: 100 },
  });
  const ringSize = interpolate(shockwaveProgress, [0, 1], [100, 600]);
  const ringOpacity = interpolate(shockwaveProgress, [0, 0.3, 1], [0, 0.6, 0]);

  // Second shockwave delayed
  const shock2Progress = spring({
    frame: Math.max(0, frame - Math.round(fps * 0.5)),
    fps,
    config: { damping: 25, stiffness: 80 },
  });
  const ring2Size = interpolate(shock2Progress, [0, 1], [100, 500]);
  const ring2Opacity = interpolate(shock2Progress, [0, 0.3, 1], [0, 0.3, 0]);

  // Number slam — enters with overshoot
  const numberSlam = spring({
    frame,
    fps,
    config: SPRING_PRESETS.slam,
  });
  const numberScale = interpolate(numberSlam, [0, 1], [2.5, 1]);

  // Subtle breathing on the number during hold
  const breathe = useBreathing(2, 0.06);

  // Glow pulse
  const glowIntensity = usePulseGlow(0.1, 30, 60);

  return (
    <AbsoluteFill style={{ ...getBgStyle("spotlight", brandColor, lifecycle) }}>
      {/* Shockwave rings */}
      <div
        style={{
          position: "absolute",
          top: "46%",
          left: "50%",
          width: ringSize,
          height: ringSize,
          borderRadius: "50%",
          border: `2px solid rgba(${rgb},${ringOpacity})`,
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "46%",
          left: "50%",
          width: ring2Size,
          height: ring2Size,
          borderRadius: "50%",
          border: `1px solid rgba(${rgb},${ring2Opacity})`,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Ambient glow behind number */}
      <div
        style={{
          position: "absolute",
          top: "46%",
          left: "50%",
          width: 400,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${rgb},0.15) 0%, transparent 70%)`,
          transform: "translate(-50%, -50%)",
          filter: `blur(${glowIntensity}px)`,
          opacity: lifecycle,
        }}
      />

      {/* Icon above number */}
      {icon && (
        <div
          style={{
            position: "absolute",
            top: "28%",
            left: "50%",
            transform: `translate(-50%, 0) scale(${useDelayedSpring(4, "pop")})`,
            opacity: lifecycle,
          }}
        >
          <LucideIcon name={icon} size={56} color={brandColor} strokeWidth={1.6} />
        </div>
      )}

      {/* Giant number */}
      <div
        style={{
          position: "absolute",
          top: "46%",
          left: 0,
          right: 0,
          textAlign: "center",
          transform: `translateY(calc(-50% + ${breathe}px)) scale(${numberScale})`,
          transformOrigin: "center",
          opacity: lifecycle,
        }}
      >
        <span
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 220,
            color: "#FFFFFF",
            lineHeight: 1,
            direction: "ltr",
            textShadow: `0 0 ${glowIntensity}px rgba(${rgb},0.5), 0 4px 8px rgba(0,0,0,0.5)`,
          }}
        >
          {currentNum.toLocaleString("en-US")}
        </span>
        {suffix && (
          <span
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 110,
              color: brandColor,
              textShadow: `0 0 30px rgba(${rgb},0.6)`,
            }}
          >
            {suffix}
          </span>
        )}
      </div>

      {/* Title above — the CLAIM context (e.g. "מ-1,000 ל-10,000"); a bare
          number over darkness says nothing (owner 2026-08-09). */}
      {title && (
        <div
          style={{
            position: "absolute",
            top: "27%",
            left: 40,
            right: 40,
            textAlign: "center",
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 58,
            color: "#FFFFFF",
            direction: "rtl",
            opacity: lifecycle,
            textShadow: "0 3px 12px rgba(0,0,0,0.9)",
          }}
        >
          {title}
        </div>
      )}

      {/* Label below */}
      {label && (
        <div
          style={{
            position: "absolute",
            bottom: "30%",
            left: 60,
            right: 60,
            textAlign: "center",
            opacity:
              interpolate(frame, [20, 32], [0, 1], {
                extrapolateRight: "clamp",
                extrapolateLeft: "clamp",
              }) * lifecycle,
            transform: `translateY(${interpolate(frame, [20, 32], [15, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })}px)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 700,
              fontSize: 48,
              color: "rgba(255,255,255,0.85)",
              direction: "rtl",
              letterSpacing: "1px",
            }}
          >
            {label}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CINEMATIC 3: SPLIT TRANSFORM
// Left side shows "before" state, right side shows "after" — with a
// dramatic diagonal split and animated reveal.
// Use for: comparisons, transformations, before/after.
// ══════════════════════════════════════════════════════════════════════════════

export const SplitTransform: React.FC<
  PremiumSceneProps & { left_label?: string; right_label?: string }
> = ({
  brandColor,
  durationFrames,
  title,
  primary,
  secondary,
  left_label,
  right_label,
}) => {
  // REFERENCE GRADE (BROLL_STYLE_SPEC.md §2.3) — the old version was a static
  // diagonal split with "chaos rectangles", scribbles and / emoji: decorative
  // and illegible. The reference move (devinjatho red-room/green-room) sequences
  // the contrast in TIME: a full-frame "before" world, a hard whip, a full-frame
  // "after" world, then a composite. The room's COLOR carries the semantics.
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);

  const leftText = left_label || secondary || "לפני";
  const rightText = right_label || primary || "אחרי";

  const B1 = Math.round(durationFrames * 0.4); // end of "before" room
  const WHIP = 4;
  const B3 = Math.round(durationFrames * 0.85); // end of "after" room
  const inBefore = frame < B1;
  const inWhip = frame >= B1 && frame < B1 + WHIP;
  const inAfter = frame >= B1 + WHIP && frame < B3;
  const inSplit = frame >= B3;

  // Slow push-in on each room.
  const beforeScale = 1 + 0.12 * Math.min(1, frame / Math.max(1, B1));
  const afterT = Math.min(1, Math.max(0, (frame - B1 - WHIP) / Math.max(1, B3 - B1 - WHIP)));
  const afterPop = spring({ frame: Math.max(0, frame - B1 - WHIP), fps, config: { stiffness: 200, damping: 11 } });

  // Rising / falling graph strokes drawn inside each room.
  const LINE = 900;
  const beforeDraw = interpolate(frame, [8, B1], [LINE, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const afterDraw = interpolate(frame, [B1 + WHIP + 6, B3], [LINE, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const whipBlur = inWhip ? 22 : 0;

  const Room: React.FC<{
    bg: string;
    glow: string;
    label: string;
    labelColor: string;
    labelSize: number;
    graph: "down" | "up";
    draw: number;
    scale: number;
    accent: string;
  }> = ({ bg, glow, label, labelColor, labelSize, graph, draw, scale, accent }) => (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: glow }} />
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "50% 45%" }}>
        {/* graph stroke — faint backdrop in the UPPER band, never under the
            label (they used to stack: "עומד אחד על השני") */}
        <svg width={900} height={430} style={{ position: "absolute", top: 300, left: 90, overflow: "visible" }}>
          <polyline
            points={graph === "down" ? "0,60 220,130 420,160 640,300 900,410" : "0,400 240,330 460,270 680,130 900,30"}
            fill="none"
            stroke={accent}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={LINE * 1.4}
            strokeDashoffset={draw * 1.4}
            style={{ filter: `drop-shadow(0 0 18px ${accent})`, opacity: 0.5 }}
          />
        </svg>
        {/* label anchored in the lower band */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 880,
            direction: "rtl",
            textAlign: "center",
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: labelSize,
            lineHeight: 1.1,
            color: labelColor,
            padding: "0 70px",
            textShadow: `0 6px 60px rgba(0,0,0,0.55)`,
          }}
        >
          {label}
        </div>
      </AbsoluteFill>
      {/* heavy vignette */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ background: "#050608", filter: whipBlur ? `blur(${whipBlur}px)` : undefined }}>
      {(inBefore || inWhip) && (
        <Room
          bg="#220808"
          glow="radial-gradient(ellipse 80% 55% at 50% 42%, rgba(192,24,24,0.35) 0%, transparent 70%)"
          label={leftText}
          labelColor="rgba(255,255,255,0.6)"
          labelSize={116}
          graph="down"
          draw={beforeDraw}
          scale={beforeScale}
          accent="rgba(239,68,68,0.9)"
        />
      )}

      {(inAfter || inSplit) && !inSplit && (
        <Room
          bg="#1A0E04"
          glow={`radial-gradient(ellipse 80% 55% at 50% 42%, rgba(${rgb},0.4) 0%, transparent 70%)`}
          label={rightText}
          labelColor="#FFFFFF"
          labelSize={128}
          graph="up"
          draw={afterDraw}
          scale={0.9 + afterPop * 0.14 + afterT * 0.04}
          accent={brandColor}
        />
      )}

      {/* Final composite: both rooms side-by-side with a glowing divider */}
      {inSplit && (
        <AbsoluteFill>
          <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 0, 46% 0, 54% 100%, 0 100%)" }}>
            <Room
              bg="#220808"
              glow="radial-gradient(ellipse 80% 55% at 40% 42%, rgba(192,24,24,0.3) 0%, transparent 70%)"
              label={leftText}
              labelColor="rgba(255,255,255,0.55)"
              labelSize={52}
              graph="down"
              draw={0}
              scale={1}
              accent="rgba(239,68,68,0.8)"
            />
          </div>
          <div style={{ position: "absolute", inset: 0, clipPath: "polygon(46% 0, 100% 0, 100% 100%, 54% 100%)" }}>
            <Room
              bg="#1A0E04"
              glow={`radial-gradient(ellipse 80% 55% at 60% 42%, rgba(${rgb},0.38) 0%, transparent 70%)`}
              label={rightText}
              labelColor="#FFFFFF"
              labelSize={56}
              graph="up"
              draw={0}
              scale={1}
              accent={brandColor}
            />
          </div>
          {/* skewed glowing divider (kept from the old design — it was good) */}
          <div
            style={{
              position: "absolute",
              top: -60,
              bottom: -60,
              left: "50%",
              width: 8,
              transform: "translateX(-50%) rotate(4.5deg)",
              background: `linear-gradient(180deg, transparent, ${brandColor}, transparent)`,
              boxShadow: `0 0 32px rgba(${rgb},0.9), 0 0 90px rgba(${rgb},0.4)`,
            }}
          />
        </AbsoluteFill>
      )}

      {title && !inSplit && (
        <div
          style={{
            position: "absolute",
            top: 170,
            left: 60,
            right: 60,
            textAlign: "center",
            direction: "rtl",
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 800,
            fontSize: 46,
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 2px 20px rgba(0,0,0,0.8)",
          }}
        >
          {title}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// NARRATIVE 1: CARD STACK BUILD
// Cards stack up from bottom with depth and parallax,
// like building a tower of capabilities/features.
// Use for: feature lists, capability showcases, building arguments.
// ══════════════════════════════════════════════════════════════════════════════

export const CardStackBuild: React.FC<PremiumSceneProps> = ({
  brandColor,
  durationFrames,
  title,
  items = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 10, 10);

  const CARD_HEIGHT = 110;
  const CARD_GAP = 14;
  const STAGGER = 12;

  return (
    <AbsoluteFill style={{ ...getBgStyle("deep", brandColor, lifecycle) }}>
      {/* Subtle grid pattern for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(${rgb},0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(${rgb},0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.5,
        }}
      />

      {/* Title */}
      {title && (
        <div
          style={{
            position: "absolute",
            top: 120,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: interpolate(frame, [0, 12], [0, 1], {
              extrapolateRight: "clamp",
            }) * lifecycle,
          }}
        >
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 40,
              color: "#FFFFFF",
              direction: "rtl",
              letterSpacing: "0.5px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              width: 60,
              height: 3,
              background: brandColor,
              margin: "14px auto 0",
              borderRadius: 2,
            }}
          />
        </div>
      )}

      {/* Card stack */}
      <div
        style={{
          position: "absolute",
          top: title ? 240 : 160,
          bottom: 200,
          left: 48,
          right: 48,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: CARD_GAP,
          perspective: "800px",
        }}
      >
        {items.map((item, idx) => {
          const delay = 8 + idx * STAGGER;
          const cardProgress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: SPRING_PRESETS.snappy,
          });

          // Cards come from below with slight 3D rotation
          const translateY = interpolate(cardProgress, [0, 1], [60, 0]);
          const rotateX = interpolate(cardProgress, [0, 1], [15, 0]);
          const cardOpacity = interpolate(cardProgress, [0, 0.3], [0, 1], {
            extrapolateRight: "clamp",
          });

          // Depth: earlier cards slightly smaller and dimmer
          const depthScale = 1 - (items.length - 1 - idx) * 0.015;
          const depthOpacity = 0.7 + (idx / Math.max(1, items.length - 1)) * 0.3;

          return (
            <div
              key={idx}
              style={{
                transform: `translateY(${translateY}px) rotateX(${rotateX}deg) scale(${depthScale})`,
                opacity: cardOpacity * depthOpacity * lifecycle,
                transformOrigin: "center bottom",
                display: "flex",
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 20,
                padding: "20px 28px",
                background:
                  idx === items.length - 1
                    ? `linear-gradient(135deg, rgba(${rgb},0.2) 0%, rgba(${rgb},0.08) 100%)`
                    : "rgba(255,255,255,0.04)",
                border:
                  idx === items.length - 1
                    ? `1.5px solid rgba(${rgb},0.5)`
                    : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Number or icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background:
                    idx === items.length - 1
                      ? brandColor
                      : "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon ? (
                  <LucideIcon
                    name={item.icon}
                    size={28}
                    color={idx === items.length - 1 ? "#FFF" : brandColor}
                    strokeWidth={2}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: 900,
                      fontSize: 24,
                      color: idx === items.length - 1 ? "#FFF" : brandColor,
                    }}
                  >
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, direction: "rtl" }}>
                <div
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: idx === items.length - 1 ? 900 : 700,
                    fontSize: idx === items.length - 1 ? 38 : 34,
                    color:
                      idx === items.length - 1
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.8)",
                    lineHeight: 1.3,
                  }}
                >
                  {item.text}
                </div>
                {item.sub_text && (
                  <div
                    style={{
                      fontFamily: "'Heebo', sans-serif",
                      fontWeight: 400,
                      fontSize: 24,
                      color: `rgba(${rgb},0.7)`,
                      marginTop: 4,
                    }}
                  >
                    {item.sub_text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CINEMATIC 4: URGENCY CLOCK
// A ticking countdown that fills the screen, communicating time pressure.
// Use for: deadlines, limited offers, urgency messaging, FOMO.
// ══════════════════════════════════════════════════════════════════════════════

export const UrgencyClock: React.FC<
  PremiumSceneProps & { countdown_from?: number }
> = ({ brandColor, durationFrames, primary, secondary, countdown_from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 8);

  const startNum = countdown_from || 10;

  // Countdown ticks down
  const progress = interpolate(frame, [0, durationFrames * 0.8], [0, 1], {
    extrapolateRight: "clamp",
  });
  const currentNum = Math.max(0, Math.round(startNum * (1 - progress)));

  // Each tick gets a micro-slam
  const tickPhase = frame % Math.round(fps * 0.8);
  const tickSlam = tickPhase < 4
    ? spring({ frame: tickPhase, fps, config: SPRING_PRESETS.slam })
    : 1;
  const tickScale = interpolate(tickSlam, [0, 1], [1.08, 1]);

  // Red urgency builds as number gets lower
  const urgency = interpolate(progress, [0.3, 0.9], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const urgencyRed = Math.round(urgency * 80);

  // Rotating seconds ring
  const ringRotation = interpolate(frame, [0, durationFrames], [0, 360]);

  // Pulse speed increases with urgency
  const pulseSpeed = 0.08 + urgency * 0.15;
  const pulse = usePulseGlow(pulseSpeed, 0.3, 1.0);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, rgba(${urgencyRed},0,0,0.15) 0%, rgba(0,0,0,0.96) 50%, rgba(${urgencyRed},0,0,0.1) 100%)`,
        opacity: lifecycle,
      }}
    >
      {/* Rotating ring */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "50%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          border: `2px solid rgba(${rgb},${0.15 + urgency * 0.2})`,
          transform: `translate(-50%, -50%) rotate(${ringRotation}deg)`,
        }}
      >
        {/* Tick marks */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: 2,
              height: 16,
              background: `rgba(${rgb},${i % 3 === 0 ? 0.5 : 0.2})`,
              transformOrigin: `1px ${190}px`,
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </div>

      {/* Giant number */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: 0,
          right: 0,
          textAlign: "center",
          transform: `translateY(-50%) scale(${tickScale})`,
          opacity: lifecycle,
        }}
      >
        <div
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 260,
            color: urgency > 0.7 ? `rgba(255,${100 - urgencyRed},${80 - urgencyRed},1)` : "#FFFFFF",
            lineHeight: 1,
            direction: "ltr",
            textShadow: `0 0 ${40 * pulse}px rgba(${rgb},${0.3 + urgency * 0.4})`,
          }}
        >
          {currentNum}
        </div>
      </div>

      {/* Context label */}
      {(primary || secondary) && (
        <div
          style={{
            position: "absolute",
            bottom: "25%",
            left: 60,
            right: 60,
            textAlign: "center",
            opacity: interpolate(frame, [12, 22], [0, 1], {
              extrapolateRight: "clamp",
            }) * lifecycle,
          }}
        >
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 800,
              fontSize: 44,
              color: "rgba(255,255,255,0.9)",
              direction: "rtl",
            }}
          >
            {primary || secondary}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// DATA 1: ANALYTICS DASHBOARD
// Multi-metric dashboard that builds up piece by piece.
// Feels like a real analytics UI, not a PowerPoint chart.
// Use for: results, metrics, proof of performance.
// ══════════════════════════════════════════════════════════════════════════════

export const AnalyticsDashboard: React.FC<PremiumSceneProps> = ({
  brandColor,
  durationFrames,
  title,
  items = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 10, 10);

  return (
    <AbsoluteFill style={{ ...getBgStyle("cool", brandColor, lifecycle) }}>
      {/* Dot grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(rgba(${rgb},0.08) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Title bar */}
      {title && (
        <div
          style={{
            position: "absolute",
            top: 100,
            left: 48,
            right: 48,
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 16,
            opacity: interpolate(frame, [0, 10], [0, 1], {
              extrapolateRight: "clamp",
            }) * lifecycle,
          }}
        >
          <div
            style={{
              width: 6,
              height: 32,
              background: brandColor,
              borderRadius: 3,
            }}
          />
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 36,
              color: "#FFFFFF",
              direction: "rtl",
            }}
          >
            {title}
          </div>
        </div>
      )}

      {/* Metric cards grid */}
      <div
        style={{
          position: "absolute",
          top: title ? 200 : 140,
          bottom: 200,
          left: 36,
          right: 36,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          justifyContent: "center",
        }}
      >
        {items.map((item, idx) => {
          const delay = 6 + idx * 10;
          const cardProg = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: SPRING_PRESETS.snappy,
          });

          const value = item.value || item.sub_text || "";
          const numericVal = parseSceneNumber(value, 0);
          const isNumeric = !isNaN(numericVal);
          const countProg = spring({
            frame: Math.max(0, frame - delay - 4),
            fps,
            config: { damping: 25, stiffness: 60 },
          });
          const displayVal = isNumeric
            ? Math.round(numericVal * Math.min(countProg, 1))
            : value;

          // Mini progress bar per metric
          const barProg = spring({
            frame: Math.max(0, frame - delay - 8),
            fps,
            config: { damping: 20, stiffness: 80 },
          });
          const barWidth = isNumeric
            ? Math.min(100, Math.max(10, numericVal))
            : 65;

          return (
            <div
              key={idx}
              style={{
                opacity: cardProg * lifecycle,
                transform: `translateX(${interpolate(cardProg, [0, 1], [40, 0])}px)`,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: "18px 24px",
                display: "flex",
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 18,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `rgba(${rgb},0.12)`,
                  border: `1px solid rgba(${rgb},0.25)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <LucideIcon
                  name={item.icon || "TrendingUp"}
                  size={24}
                  color={brandColor}
                  strokeWidth={2}
                />
              </div>

              {/* Content */}
              <div style={{ flex: 1, direction: "rtl" }}>
                <div
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 700,
                    fontSize: 26,
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: 4,
                  }}
                >
                  {item.text}
                </div>

                {/* Value */}
                <div
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 900,
                    fontSize: 42,
                    color: "#FFFFFF",
                    direction: "ltr",
                    textAlign: "right",
                  }}
                >
                  {displayVal}
                  {isNumeric && value.includes("%") && (
                    <span style={{ color: brandColor, fontSize: 28 }}>%</span>
                  )}
                </div>

                {/* Mini bar */}
                <div
                  style={{
                    height: 4,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 2,
                    marginTop: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barWidth * Math.min(barProg, 1)}%`,
                      background: `linear-gradient(90deg, ${brandColor}, rgba(${rgb},0.4))`,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// NARRATIVE 2: WORKFLOW PIPELINE
// Connected nodes with animated data flowing between them.
// Feels like a real system visualization, not boxes with arrows.
// Use for: processes, funnels, workflows, systems.
// ══════════════════════════════════════════════════════════════════════════════

export const WorkflowPipeline: React.FC<
  PremiumSceneProps & { outcome?: string; outcome_icon?: string }
> = ({ brandColor, durationFrames, title, items = [], outcome, outcome_icon }) => {
  // REFERENCE GRADE (BROLL_STYLE_SPEC.md §2.2) — the old version stacked
  // translucent dark cards on a dark circuit background: dark-on-dark, tiny
  // dots, no camera. This is the devinjatho "whiteboard world": a LIGHT
  // oversized canvas of real white cards laid out like a flow editor, and
  // the CAMERA is the scene — it flies node to node along a glowing wire.
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);

  const nodes = items.slice(0, 5);
  const n = Math.max(1, nodes.length);

  // Oversized canvas (~1.6× frame height), nodes offset diagonally like a
  // real flow editor. Node k sits at (x_k, y_k) in canvas coordinates.
  const NODE_W = 620;
  const NODE_H = 240;
  const STEP_Y = 480;
  const nodePos = (k: number) => ({
    x: 230 + (k % 2 === 0 ? 0 : 240),
    y: 260 + k * STEP_Y,
  });

  // Camera: one sub-shot per node, then a final zoom-out to the whole flow.
  const HOLD = Math.max(24, Math.floor((durationFrames - 24) / (n + 1)));
  const WHIP = 10;
  const focusPose = (k: number): CameraPose => {
    const p = nodePos(k);
    // Center node k at optical center (540, 830), scaled so it fills ~42%.
    const scale = 1.35;
    return {
      frame: k * HOLD,
      x: 540 - (p.x + NODE_W / 2) * scale,
      y: 830 - (p.y + NODE_H / 2) * scale,
      scale,
    };
  };
  const poses: CameraPose[] = [];
  for (let k = 0; k < n; k++) {
    const pose = focusPose(k);
    poses.push({ ...pose, frame: k === 0 ? 0 : k * HOLD });
    if (k < n - 1) poses.push({ ...pose, frame: k * HOLD + HOLD - WHIP });
  }
  // Final beat: zoom out to the whole canvas for the outcome.
  const totalH = 260 + n * STEP_Y + (outcome ? 320 : 0);
  const outScale = Math.min(0.82, 1500 / totalH);
  poses.push({ frame: n * HOLD, x: 540 - 540 * outScale, y: 940 - (totalH / 2) * outScale, scale: outScale });

  const activeIdx = Math.min(n - 1, Math.floor(frame / HOLD));
  const outcomeBeat = frame >= n * HOLD;

  // The glowing dot that travels the wire during each whip.
  const whipT = interpolate(frame % HOLD, [HOLD - WHIP, HOLD], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneStage variant="light">
      <CameraRig poses={poses} settleDrift={false}>
        {title && (
          <div
            style={{
              position: "absolute",
              left: 120,
              top: 90,
              direction: "rtl",
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 64,
              color: "#111827",
            }}
          >
            {title}
          </div>
        )}

        {/* Wires between nodes — bezier, with a traveling glow dot */}
        <svg width={1080} height={totalH + 400} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {nodes.map((_, k) => {
            if (k >= n - 1) return null;
            const a = nodePos(k);
            const b = nodePos(k + 1);
            const x1 = a.x + NODE_W / 2;
            const y1 = a.y + NODE_H;
            const x2 = b.x + NODE_W / 2;
            const y2 = b.y;
            const path = `M ${x1} ${y1} C ${x1} ${y1 + 140}, ${x2} ${y2 - 140}, ${x2} ${y2}`;
            const drawn = k < activeIdx || (k === activeIdx && whipT > 0);
            return (
              <g key={k}>
                <path d={path} fill="none" stroke="#C7CBD2" strokeWidth={3} strokeLinecap="round" />
                {drawn && k === activeIdx && (
                  <circle
                    cx={x1 + (x2 - x1) * whipT}
                    cy={y1 + (y2 - y1) * whipT}
                    r={9}
                    fill={brandColor}
                    style={{ filter: `drop-shadow(0 0 16px rgba(${rgb},0.9))` }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes — real white cards with depth; the active one glows */}
        {nodes.map((item, k) => {
          const p = nodePos(k);
          const isActive = !outcomeBeat && k === activeIdx;
          const arrived = k <= activeIdx || outcomeBeat;
          const pop = spring({
            frame: Math.max(0, frame - k * HOLD),
            fps,
            config: { stiffness: 240, damping: 13 },
          });
          const focusBlur = isActive || outcomeBeat ? 0 : 6;
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: p.x,
                top: p.y,
                width: NODE_W,
                height: NODE_H,
                borderRadius: 20,
                background: "#FFFFFF",
                boxShadow: isActive
                  ? `0 0 0 3px rgba(${rgb},0.9), 0 0 30px rgba(${rgb},0.35), 0 24px 60px rgba(17,24,39,0.18)`
                  : "0 24px 60px rgba(17,24,39,0.18)",
                transform: `scale(${arrived ? (isActive ? 0.98 + pop * 0.08 : 1) : 0.9})`,
                opacity: arrived ? 1 : 0.35,
                filter: `blur(${focusBlur}px) brightness(${isActive || outcomeBeat ? 1 : 0.9})`,
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "0 36px",
                direction: "rtl",
              }}
            >
              {/* step chip */}
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 20,
                  background: `rgba(${rgb},0.12)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Heebo', sans-serif",
                  fontWeight: 900,
                  fontSize: 40,
                  color: brandColor,
                  flexShrink: 0,
                }}
              >
                {k + 1}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 800,
                    fontSize: 48,
                    color: "#111827",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.text}
                </div>
              </div>
            </div>
          );
        })}

        {/* Outcome card — final beat, green glow, everything else dims */}
        {outcome && (
          <div
            style={{
              position: "absolute",
              left: 180,
              top: 260 + n * STEP_Y + 40,
              width: 720,
              borderRadius: 24,
              background: "#FFFFFF",
              boxShadow: outcomeBeat
                ? "0 0 0 3px rgba(74,222,128,0.9), 0 0 40px rgba(74,222,128,0.4), 0 24px 60px rgba(17,24,39,0.18)"
                : "0 24px 60px rgba(17,24,39,0.14)",
              opacity: outcomeBeat ? 1 : 0,
              transform: `translateY(${outcomeBeat ? 0 : 30}px)`,
              transition: "none",
              padding: "36px 42px",
              direction: "rtl",
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(74,222,128,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 52,
                color: "#111827",
              }}
            >
              {outcome}
            </div>
          </div>
        )}
      </CameraRig>
    </SceneStage>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ACCENT 1: TEXT SLAM
// A single powerful word/phrase slams in at massive scale then settles.
// Use for: emphasis words, punch moments, one-word reveals.
// ══════════════════════════════════════════════════════════════════════════════

export const TextSlam: React.FC<PremiumSceneProps> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 8);

  // Slam entrance — starts huge and compressed, settles at readable size
  const slamProgress = spring({
    frame,
    fps,
    config: SPRING_PRESETS.slam,
  });
  const scale = interpolate(slamProgress, [0, 1], [3.0, 1]);
  const blur = interpolate(slamProgress, [0, 0.4, 1], [8, 2, 0]);
  const letterSpacing = interpolate(slamProgress, [0, 1], [30, 0]);

  // Flash on impact
  const flashOpacity = interpolate(slamProgress, [0.3, 0.5, 0.7], [0, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* Impact flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 45%, rgba(${rgb},${flashOpacity}) 0%, transparent 60%)`,
        }}
      />

      {/* Main word */}
      <div
        style={{
          position: "absolute",
          top: "44%",
          left: 0,
          right: 0,
          textAlign: "center",
          transform: `translateY(-50%) scale(${scale})`,
          filter: `blur(${blur}px)`,
          opacity: lifecycle,
        }}
      >
        <div
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 90,
            color: "#FFFFFF",
            direction: "rtl",
            lineHeight: 1.1,
            letterSpacing: `${letterSpacing}px`,
            textShadow: `0 0 40px rgba(${rgb},0.4)`,
          }}
        >
          {primary}
        </div>
      </div>

      {/* Subtitle fades in after slam */}
      {secondary && (
        <div
          style={{
            position: "absolute",
            top: "60%",
            left: 80,
            right: 80,
            textAlign: "center",
            opacity:
              interpolate(frame, [16, 26], [0, 1], {
                extrapolateRight: "clamp",
                extrapolateLeft: "clamp",
              }) * lifecycle,
          }}
        >
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 600,
              fontSize: 34,
              color: `rgba(${rgb},0.8)`,
              direction: "rtl",
            }}
          >
            {secondary}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
