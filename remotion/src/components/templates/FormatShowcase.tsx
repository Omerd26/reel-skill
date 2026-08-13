/**
 * FormatShowcase — "here are N viral formats" explainer overlay.
 *
 *   - Intro: a title + all format cards shown together in a row (montage).
 *   - Then, as the speaker names each format, that format's screenshot pops up
 *     LARGE above the speaker's head with a numbered orange label. Cards
 *     crossfade from one to the next.
 *
 * Built for a centered talking-head (1080×1920) with the head ~y=730+, so the
 * card sits in the clear upper area. Brand accent frames every card.
 */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { useEntrance } from "../overlays/motion";
import { FONTS, RADIUS, easeFn } from "../../design/tokens";
import type { FormatShowcaseTemplate, FormatCard } from "./types";

const FRAME_W = 1080;

// Big (active) card geometry — top-center, above the head.
const BIG_W = 360;
const BIG_H = 600;
const BIG_X = (FRAME_W - BIG_W) / 2;
const BIG_Y = 70;

interface Props {
  template: FormatShowcaseTemplate;
  total_duration_sec: number;
}

export const FormatShowcase: React.FC<Props> = ({ template }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentSec = frame / fps;
  const accent = template.accent_color;
  const rtl = template.rtl ?? true;

  const formats = [...template.formats].sort((a, b) => a.appear_at - b.appear_at);
  const firstAppear = formats[0]?.appear_at ?? 999;

  // Intro is visible until the first format takes over (short crossfade).
  const introFade = interpolate(currentSec, [firstAppear - 0.4, firstAppear], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {introFade > 0.01 && (
        <IntroMontage template={template} accent={accent} rtl={rtl} opacity={introFade} fps={fps} />
      )}

      {formats.map((fmt, i) => (
        <BigCard
          key={fmt.id}
          fmt={fmt}
          index={i}
          nextAppear={i + 1 < formats.length ? formats[i + 1].appear_at : Infinity}
          accent={accent}
          rtl={rtl}
          fps={fps}
          frame={frame}
        />
      ))}
    </AbsoluteFill>
  );
};

// ── Intro montage — title + row of all cards ─────────────────────────────────

const IntroMontage: React.FC<{
  template: FormatShowcaseTemplate;
  accent: string;
  rtl: boolean;
  opacity: number;
  fps: number;
}> = ({ template, accent, rtl, opacity, fps }) => {
  const frame = useCurrentFrame();
  const formats = template.formats;
  const n = formats.length;

  const titleEntrance = useEntrance({ signature: "stack-cascade", durationSec: 0.5, offsetFrames: 0 });

  // Row geometry
  const cardW = 150;
  const cardH = 270;
  const gap = 22;
  const rowW = n * cardW + (n - 1) * gap;
  const startX = (FRAME_W - rowW) / 2;
  const rowY = 300;

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {/* Title */}
      {template.title && (
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 0,
            right: 0,
            textAlign: "center",
            direction: rtl ? "rtl" : "ltr",
            ...titleEntrance,
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontFamily: FONTS.display,
              fontSize: 64,
              fontWeight: 900,
              color: "#FFFFFF",
              background: accent,
              padding: "14px 30px",
              borderRadius: RADIUS.md,
              letterSpacing: "-0.02em",
              boxShadow: `0 10px 30px ${accent}66, 0 6px 18px rgba(0,0,0,0.5)`,
            }}
          >
            {template.title}
          </span>
        </div>
      )}

      {/* Card row — staggered pop-in */}
      {formats.map((fmt, i) => {
        const inT = interpolate(frame, [i * 4, i * 4 + 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeFn("bounce-soft"),
        });
        const x = startX + i * (cardW + gap);
        return (
          <div
            key={fmt.id}
            style={{
              position: "absolute",
              top: rowY,
              left: x,
              width: cardW,
              height: cardH,
              opacity: inT,
              transform: `translateY(${(1 - inT) * 30}px) scale(${0.85 + 0.15 * inT}) rotate(${(i - (n - 1) / 2) * 3}deg)`,
              borderRadius: 16,
              overflow: "hidden",
              border: `3px solid ${accent}`,
              boxShadow: "0 12px 28px rgba(0,0,0,0.55)",
              background: "#000",
            }}
          >
            <Img
              src={resolveSrc(fmt.image)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* number badge */}
            <div
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: accent,
                color: "#fff",
                fontFamily: FONTS.display,
                fontSize: 24,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              {i + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Big active card ──────────────────────────────────────────────────────────

const BigCard: React.FC<{
  fmt: FormatCard;
  index: number;
  nextAppear: number;
  accent: string;
  rtl: boolean;
  fps: number;
  frame: number;
}> = ({ fmt, index, nextAppear, accent, rtl, fps, frame }) => {
  const appearF = Math.round(fmt.appear_at * fps);
  const nextF = nextAppear === Infinity ? Infinity : Math.round(nextAppear * fps);
  const fadeF = Math.round(0.35 * fps);

  const local = frame - appearF;
  if (local < -fadeF) return null;
  if (nextF !== Infinity && frame > nextF + fadeF) return null;

  const fadeIn = interpolate(local, [0, fadeF], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });
  const fadeOut =
    nextF === Infinity
      ? 1
      : interpolate(frame, [nextF - 2, nextF + fadeF], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeFn("glass-rise"),
        });
  const opacity = Math.min(fadeIn, fadeOut);
  const scale = 0.82 + 0.18 * fadeIn;
  // Subtle float
  const float = Math.sin(frame / 16) * 5;

  return (
    <div
      style={{
        position: "absolute",
        top: BIG_Y,
        left: BIG_X,
        width: BIG_W,
        height: BIG_H,
        opacity,
        transform: `translateY(${float.toFixed(1)}px) scale(${scale.toFixed(3)})`,
        willChange: "transform, opacity",
      }}
    >
      {/* Card image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 26,
          overflow: "hidden",
          border: `6px solid ${accent}`,
          boxShadow: `0 0 36px ${accent}66, 0 20px 50px rgba(0,0,0,0.6)`,
          background: "#000",
        }}
      >
        <Img src={resolveSrc(fmt.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Number badge */}
      <div
        style={{
          position: "absolute",
          top: -22,
          left: rtl ? undefined : -22,
          right: rtl ? -22 : undefined,
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: accent,
          color: "#fff",
          fontFamily: FONTS.display,
          fontSize: 42,
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "4px solid #fff",
          boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
        }}
      >
        {index + 1}
      </div>

      {/* Label pill — overlaps the card's bottom edge */}
      <div
        style={{
          position: "absolute",
          bottom: -28,
          left: -20,
          right: -20,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: FONTS.display,
            fontSize: 40,
            fontWeight: 900,
            color: "#fff",
            background: accent,
            padding: "12px 26px",
            borderRadius: RADIUS.md,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            direction: rtl ? "rtl" : "ltr",
            boxShadow: `0 8px 22px ${accent}77, 0 4px 14px rgba(0,0,0,0.55)`,
            border: "2px solid rgba(255,255,255,0.25)",
          }}
        >
          {fmt.label}
        </span>
      </div>
    </div>
  );
};

function resolveSrc(p: string): string {
  return p.startsWith("http") ? p : staticFile(p);
}
