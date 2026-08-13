/**
 * ConceptCallouts — lightweight overlay for a single talking head. As the
 * speaker introduces each item in a list ("4 reasons that...", "3 things you
 * should..."), a numbered card pops above their head with an icon + label,
 * crossfading from one concept to the next. An optional intro title sits in
 * the same spot until the first concept lands.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { FONTS, RADIUS, easeFn } from "../../design/tokens";
import { TemplateIcon } from "./icons";
import type { ConceptCalloutsTemplate, ConceptCallout } from "./types";

const FRAME_W = 1080;

interface Props {
  template: ConceptCalloutsTemplate;
  total_duration_sec: number;
}

export const ConceptCallouts: React.FC<Props> = ({ template }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentSec = frame / fps;
  const accent = template.accent_color;
  const rtl = template.rtl ?? true;
  const numbered = template.numbered ?? true;
  const cardY = template.card_y ?? 80;
  const cardCx = template.card_center_x ?? FRAME_W / 2;

  const callouts = [...template.callouts].sort((a, b) => a.appear_at - b.appear_at);
  const firstAppear = callouts[0]?.appear_at ?? Infinity;

  // Title window — default: from title_at (or 0.5) until the first card lands.
  const tStart = template.title_at ?? 0.5;
  const tEnd = template.title_until ?? firstAppear;
  const returnAt = template.title_return_at;
  const inIntroTitle = currentSec >= tStart - 0.2 && currentSec <= tEnd;
  const inReturnTitle = returnAt != null && currentSec >= returnAt - 0.2;
  const titleVisible = template.title && (inIntroTitle || inReturnTitle);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {inIntroTitle && template.title && (
        <TitlePill
          text={template.title}
          accent={accent}
          rtl={rtl}
          centerX={cardCx}
          y={cardY + 60}
          startSec={tStart}
          endSec={tEnd}
          fps={fps}
          frame={frame}
        />
      )}
      {inReturnTitle && template.title && (
        <TitlePill
          text={template.title}
          accent={accent}
          rtl={rtl}
          centerX={cardCx}
          y={cardY + 60}
          startSec={returnAt!}
          endSec={Infinity}
          fps={fps}
          frame={frame}
        />
      )}

      {callouts.map((c, i) => {
        const isLast = i + 1 === callouts.length;
        const defaultNext = isLast ? returnAt ?? Infinity : callouts[i + 1].appear_at;
        // Per-card `until` overrides the default fade-out time (lets each card
        // fade out individually instead of waiting for the next one).
        const nextAppear = c.until != null ? c.until : defaultNext;
        return (
          <Card
            key={c.id}
            callout={c}
            index={i}
            number={numbered ? c.number ?? i + 1 : undefined}
            nextAppear={nextAppear}
            accent={accent}
            rtl={rtl}
            centerX={cardCx}
            y={cardY}
            fps={fps}
            frame={frame}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ── Intro title pill (lives where the cards will appear) ─────────────────────

const TitlePill: React.FC<{
  text: string;
  accent: string;
  rtl: boolean;
  centerX: number;
  y: number;
  startSec: number;
  endSec: number;
  fps: number;
  frame: number;
}> = ({ text, accent, rtl, centerX, y, startSec, endSec, fps, frame }) => {
  const startF = Math.round(startSec * fps);
  const inT = interpolate(frame, [startF, startF + Math.round(0.35 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });
  const outT = !Number.isFinite(endSec)
    ? 1
    : interpolate(
        frame,
        [Math.round(endSec * fps) - Math.round(0.3 * fps), Math.round(endSec * fps)],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );
  const op = Math.min(inT, outT);
  if (op <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        textAlign: "center",
        direction: rtl ? "rtl" : "ltr",
        opacity: op,
        transform: `translateY(${((1 - inT) * -20).toFixed(1)}px)`,
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontFamily: FONTS.display,
          fontSize: text.length > 22 ? 46 : 64,
          fontWeight: 900,
          color: "#fff",
          background: accent,
          padding: "14px 32px",
          borderRadius: RADIUS.md,
          letterSpacing: "-0.02em",
          boxShadow: `0 10px 30px ${accent}77, 0 6px 18px rgba(0,0,0,0.55)`,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ── Concept card ─────────────────────────────────────────────────────────────

const Card: React.FC<{
  callout: ConceptCallout;
  index: number;
  number?: number;
  nextAppear: number;
  accent: string;
  rtl: boolean;
  centerX: number;
  y: number;
  fps: number;
  frame: number;
}> = ({ callout, number, nextAppear, accent, rtl, centerX, y, fps, frame }) => {
  const appearF = Math.round(callout.appear_at * fps);
  const nextF = nextAppear === Infinity ? Infinity : Math.round(nextAppear * fps);
  const fadeF = Math.round(0.32 * fps);

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
      : interpolate(frame, [nextF - 4, nextF + fadeF], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const opacity = Math.min(fadeIn, fadeOut);
  const scale = 0.78 + 0.22 * fadeIn;
  const float = Math.sin(frame / 18) * 4;

  // Dispatch to the variant renderer. Default / comparison stay in this
  // component; the more animated variants live in dedicated subcomponents.
  const variant = callout.variant ?? (callout.icon2 ? "comparison" : "default");
  const animProps = { callout, accent, rtl, centerX, y, fps, frame, opacity, scale, float, number };
  if (variant === "growth") return <GrowthCard {...animProps} />;
  if (variant === "strikethrough") return <StrikethroughCard {...animProps} />;
  if (variant === "dm") return <DmCard {...animProps} />;

  const isContrast = variant === "comparison" || callout.icon2 != null;
  const CARD_W = isContrast ? 760 : 560;
  const CARD_H = 200;

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: centerX - CARD_W / 2,
        width: CARD_W,
        height: CARD_H,
        opacity,
        transform: `translateY(${float.toFixed(1)}px) scale(${scale.toFixed(3)})`,
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(11,12,16,0.92)",
          border: `4px solid ${accent}`,
          borderRadius: RADIUS.lg,
          boxShadow: `0 0 36px ${accent}77, 0 18px 40px rgba(0,0,0,0.6)`,
          display: "flex",
          flexDirection: rtl ? "row-reverse" : "row",
          alignItems: "center",
          gap: isContrast ? 16 : 28,
          padding: "0 28px",
        }}
      >
        {/* First (or only) icon */}
        <IconCircle icon={callout.icon} size={isContrast ? 78 : 110} iconSize={isContrast ? 46 : 64} accent={accent} />
        <div
          style={{
            flex: 1,
            fontFamily: FONTS.display,
            fontSize: isContrast ? 38 : 64,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            textAlign: rtl ? "right" : "left",
            textShadow: "0 3px 12px rgba(0,0,0,0.6)",
          }}
        >
          {callout.label}
        </div>

        {isContrast && (
          <>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 64,
                fontWeight: 900,
                color: accent,
                lineHeight: 1,
                textShadow: `0 0 14px ${accent}aa`,
                flexShrink: 0,
                padding: "0 4px",
              }}
            >
              {callout.separator ?? "≠"}
            </div>
            <div
              style={{
                flex: 1,
                fontFamily: FONTS.display,
                fontSize: 38,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                textAlign: rtl ? "right" : "left",
                textShadow: "0 3px 12px rgba(0,0,0,0.6)",
              }}
            >
              {callout.label2}
            </div>
            <IconCircle icon={callout.icon2!} size={78} iconSize={46} accent={accent} />
          </>
        )}
      </div>

      {/* Number badge — top corner (outer-facing) */}
      {number != null && (
        <div
          style={{
            position: "absolute",
            top: -22,
            [rtl ? "right" : "left"]: -22,
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: accent,
            color: "#fff",
            border: "4px solid #fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.display,
            fontSize: 40,
            fontWeight: 900,
            boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
          }}
        >
          {number}
        </div>
      )}
    </div>
  );
};

// ── Icon circle helper ──────────────────────────────────────────────────────

const IconCircle: React.FC<{
  icon: import("./icons").TemplateIconId;
  size: number;
  iconSize: number;
  accent: string;
}> = ({ icon, size, iconSize, accent }) => (
  <div
    style={{
      flexShrink: 0,
      width: size,
      height: size,
      borderRadius: "50%",
      background: accent,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 0 24px ${accent}aa`,
    }}
  >
    <TemplateIcon id={icon} size={iconSize} color="#fff" strokeWidth={2.6} mode="stroke" />
  </div>
);

// ── Shared anim props for variant cards ──────────────────────────────────────

interface VariantProps {
  callout: ConceptCallout;
  accent: string;
  rtl: boolean;
  centerX: number;
  y: number;
  fps: number;
  frame: number;
  opacity: number;
  scale: number;
  float: number;
  number?: number;
}

// ── Growth — store icon + people floating in + awareness count-up ───────────

const GrowthCard: React.FC<VariantProps> = ({ callout, accent, rtl, centerX, y, fps, frame, opacity, scale, float }) => {
  const CARD_W = 580;
  const CARD_H = 240;
  const appearF = Math.round(callout.appear_at * fps);
  const local = Math.max(0, frame - appearF);
  const tSec = local / fps;

  // Center hub icon. Around it, small user dots arrive from random angles.
  const HUB_X = CARD_W / 2;
  const HUB_Y = CARD_H / 2 + 8;
  const HUB_R = 50;

  const users = Array.from({ length: 8 }).map((_, k) => {
    const angle = (k / 8) * Math.PI * 2 - Math.PI / 2;
    const delay = 0.18 + k * 0.12;
    const localK = Math.max(0, tSec - delay);
    const t = Math.min(1, localK / 0.45);
    const distFrom = 220; // start far out
    const distTo = 90;    // settle close to hub
    const r = distFrom + (distTo - distFrom) * t;
    const x = HUB_X + Math.cos(angle) * r;
    const yu = HUB_Y + Math.sin(angle) * r;
    const op = t;
    return { x, yu, op, k };
  });

  // Radiating rings — pulses outward.
  const ringDelay = 0.4;
  const rings = [0, 1, 2].map((k) => {
    const localK = Math.max(0, tSec - ringDelay - k * 0.45);
    const t = (localK % 1.4) / 1.4;
    const r = HUB_R + 14 + t * 110;
    const op = (1 - t) * 0.6;
    return { r, op, k };
  });

  // Awareness counter.
  const count = Math.round(interpolate(tSec, [0.2, 2.0], [0, 1240], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <div
      style={{
        position: "absolute", top: y, left: centerX - CARD_W / 2, width: CARD_W, height: CARD_H,
        opacity, transform: `translateY(${float.toFixed(1)}px) scale(${scale.toFixed(3)})`, willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0,
          background: "rgba(11,12,16,0.92)",
          border: `4px solid ${accent}`, borderRadius: RADIUS.lg,
          boxShadow: `0 0 36px ${accent}77, 0 18px 40px rgba(0,0,0,0.6)`,
          overflow: "hidden",
        }}
      >
        <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} width={CARD_W} height={CARD_H} style={{ position: "absolute", inset: 0 }}>
          {rings.map((r) => (
            <circle key={r.k} cx={HUB_X} cy={HUB_Y} r={r.r} stroke={accent} strokeWidth={3} fill="none" opacity={r.op} />
          ))}
        </svg>

        {users.map((u) => (
          <div
            key={u.k}
            style={{
              position: "absolute", left: u.x - 14, top: u.yu - 14, width: 28, height: 28, borderRadius: "50%",
              background: "#fff", border: `3px solid ${accent}`, opacity: u.op,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 2px 8px rgba(0,0,0,0.5)`,
            }}
          >
            <TemplateIcon id="user" size={16} color={accent} strokeWidth={3} mode="stroke" />
          </div>
        ))}

        {/* Center hub */}
        <div
          style={{
            position: "absolute", left: HUB_X - HUB_R, top: HUB_Y - HUB_R,
            width: HUB_R * 2, height: HUB_R * 2, borderRadius: "50%",
            background: accent, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 30px ${accent}`,
          }}
        >
          <TemplateIcon id={callout.icon} size={56} color="#fff" strokeWidth={2.6} mode="stroke" />
        </div>

        {/* Top label */}
        <div
          style={{
            position: "absolute", top: 14, left: 0, right: 0, textAlign: "center",
            fontFamily: FONTS.display, fontSize: 28, fontWeight: 900, color: "#fff",
            direction: rtl ? "rtl" : "ltr", textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          {callout.label}
        </div>

        {/* Counter — bottom-right */}
        <div
          style={{
            position: "absolute", bottom: 14, [rtl ? "left" : "right"]: 18,
            fontFamily: FONTS.display, fontSize: 30, fontWeight: 900,
            color: "#fff", background: accent, padding: "4px 12px", borderRadius: 10,
            boxShadow: `0 4px 12px ${accent}aa`,
          }}
        >
          +{count.toLocaleString("en-US")}
        </div>
      </div>
    </div>
  );
};

// ── Strikethrough — icon + label that gets struck through with a red ✗ ──────

const StrikethroughCard: React.FC<VariantProps> = ({ callout, accent, rtl, centerX, y, fps, frame, opacity, scale, float }) => {
  const CARD_W = 620;
  const CARD_H = 200;
  const appearF = Math.round(callout.appear_at * fps);
  const local = Math.max(0, frame - appearF);

  // Strike grows over 0.5s starting at 0.45s.
  const strikeT = interpolate(local, [Math.round(0.45 * fps), Math.round(0.95 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glass-rise"),
  });
  // Big X stamp comes in at 0.9s.
  const xT = interpolate(local, [Math.round(0.85 * fps), Math.round(1.15 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft"),
  });

  const RED = "#FF3B30";

  return (
    <div
      style={{
        position: "absolute", top: y, left: centerX - CARD_W / 2, width: CARD_W, height: CARD_H,
        opacity, transform: `translateY(${float.toFixed(1)}px) scale(${scale.toFixed(3)})`, willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0,
          background: "rgba(11,12,16,0.92)",
          border: `4px solid ${accent}`, borderRadius: RADIUS.lg,
          boxShadow: `0 0 36px ${accent}77, 0 18px 40px rgba(0,0,0,0.6)`,
          display: "flex", flexDirection: rtl ? "row-reverse" : "row",
          alignItems: "center", gap: 24, padding: "0 32px",
        }}
      >
        <IconCircle icon={callout.icon} size={100} iconSize={58} accent={accent} />
        <div
          style={{
            flex: 1, position: "relative",
            fontFamily: FONTS.display, fontSize: 52, fontWeight: 900, color: "#fff",
            textAlign: rtl ? "right" : "left", direction: rtl ? "rtl" : "ltr",
            textShadow: "0 3px 12px rgba(0,0,0,0.6)",
          }}
        >
          <span style={{ display: "inline-block", position: "relative" }}>
            {callout.label}
            <div
              style={{
                position: "absolute", top: "50%", left: 0,
                width: `${(strikeT * 100).toFixed(0)}%`,
                height: 6, background: RED, transform: "translateY(-50%)",
                borderRadius: 4, boxShadow: `0 0 10px ${RED}`,
              }}
            />
          </span>
        </div>

        {/* Big X stamp on the outer edge */}
        <div
          style={{
            position: "absolute",
            top: -22,
            [rtl ? "left" : "right"]: -22,
            width: 88, height: 88, borderRadius: "50%",
            background: RED, display: "flex", alignItems: "center", justifyContent: "center",
            opacity: xT, transform: `scale(${(0.6 + 0.6 * xT).toFixed(2)}) rotate(${(xT * 20 - 10).toFixed(1)}deg)`,
            border: "5px solid #fff",
            boxShadow: `0 8px 22px rgba(0,0,0,0.55), 0 0 22px ${RED}aa`,
          }}
        >
          <TemplateIcon id="cross" size={50} color="#fff" strokeWidth={4} mode="stroke" />
        </div>
      </div>
    </div>
  );
};

// ── DM — Instagram-style chat bubble mockup with the label as the message ───

const DmCard: React.FC<VariantProps> = ({ callout, accent, rtl, centerX, y, fps, frame, opacity, scale, float }) => {
  const CARD_W = 540;
  const CARD_H = 260;
  const appearF = Math.round(callout.appear_at * fps);
  const local = Math.max(0, frame - appearF);
  const tSec = local / fps;

  // Typing dots → message bubble pops in at 1.2s.
  const sendF = Math.round(1.0 * fps);
  const showBubble = frame >= appearF + sendF;
  const bubbleT = interpolate(local, [sendF, sendF + Math.round(0.3 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft"),
  });

  // Typing dot animation (looped) before bubble shows.
  const dotPhase = (n: number) => Math.max(0, Math.sin((tSec * 5 - n * 0.4)) * 0.5 + 0.5);

  return (
    <div
      style={{
        position: "absolute", top: y, left: centerX - CARD_W / 2, width: CARD_W, height: CARD_H,
        opacity, transform: `translateY(${float.toFixed(1)}px) scale(${scale.toFixed(3)})`, willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0,
          background: "#0E0F14",
          border: `4px solid ${accent}`, borderRadius: 32,
          boxShadow: `0 0 36px ${accent}77, 0 18px 40px rgba(0,0,0,0.65)`,
          overflow: "hidden",
        }}
      >
        {/* Phone-style header bar */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.08)", direction: rtl ? "rtl" : "ltr",
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: accent }} />
          <div style={{ fontFamily: FONTS.display, fontSize: 20, color: "#fff", fontWeight: 800 }}>
            Direct Message
          </div>
        </div>

        {/* Chat area */}
        <div
          style={{
            padding: "20px 18px", display: "flex", flexDirection: "column",
            alignItems: rtl ? "flex-end" : "flex-start", gap: 12, direction: rtl ? "rtl" : "ltr",
          }}
        >
          {!showBubble && (
            <div
              style={{
                background: "#2A2C34", padding: "14px 18px", borderRadius: 22,
                display: "flex", gap: 6,
              }}
            >
              {[0, 1, 2].map((n) => (
                <div
                  key={n}
                  style={{
                    width: 10, height: 10, borderRadius: "50%", background: "#fff",
                    opacity: 0.4 + dotPhase(n) * 0.6,
                  }}
                />
              ))}
            </div>
          )}
          {showBubble && (
            <div
              style={{
                background: accent, color: "#fff",
                padding: "14px 22px", borderRadius: 24,
                fontFamily: FONTS.display, fontSize: 44, fontWeight: 900,
                opacity: bubbleT, transform: `scale(${(0.7 + 0.3 * bubbleT).toFixed(2)})`,
                boxShadow: `0 8px 22px ${accent}77, 0 4px 12px rgba(0,0,0,0.5)`,
              }}
            >
              {callout.label}
            </div>
          )}
        </div>

        {/* Send hint at bottom */}
        <div
          style={{
            position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center",
            fontFamily: FONTS.display, fontSize: 18, fontWeight: 800,
            color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em",
          }}
        >
          DM ME → SEND
        </div>
      </div>
    </div>
  );
};
