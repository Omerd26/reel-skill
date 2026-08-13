/**
 * ContentFunnel — a 3-stage marketing funnel that lives on screen the whole
 * video. The funnel sits on the LEFT (clear of a centered talking head). As
 * the speaker discusses each stage, that band enlarges + brightens to the
 * brand color + pulls forward (drop shadow), while the others recede/dim.
 * At `combine_at` all three light up together.
 *
 * Built for 1080×1920 with the speaker centered (face ~x=400-700).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { useEntrance } from "../overlays/motion";
import { FONTS, RADIUS, easeFn } from "../../design/tokens";
import { TemplateIcon } from "./icons";
import type { TemplateIconId } from "./icons";
import type { ContentFunnelTemplate, FunnelSection } from "./types";

const FRAME_W = 1080;

// Funnel geometry (left side, narrows downward) — compact so the active
// stage's text can live above the speaker's head instead of inside the band.
const CX = 185;
const Y_TOP = 560;
const Y_BOT = 1480;
const W_TOP = 300;
const W_BOT = 120;

const widthAt = (y: number) =>
  W_TOP + ((y - Y_TOP) / (Y_BOT - Y_TOP)) * (W_BOT - W_TOP);

interface Props {
  template: ContentFunnelTemplate;
  total_duration_sec: number;
}

export const ContentFunnel: React.FC<Props> = ({ template }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentSec = frame / fps;
  const accent = template.accent_color;
  const rtl = template.rtl ?? true;
  const sections = template.sections;
  const n = sections.length;

  // Which stage is active? The latest section whose active_at has passed.
  // After combine_at, every stage is "active".
  const combineActive = template.combine_at != null && currentSec >= template.combine_at;
  let activeIdx = -1;
  sections.forEach((s, i) => {
    if (currentSec >= s.active_at) activeIdx = i;
  });

  const bandH = (Y_BOT - Y_TOP) / n;

  // ── Intro "journey" orb ────────────────────────────────────────────────────
  // Before the first stage activates, an orb travels DOWN the funnel through
  // all three bands, lighting each as it passes — illustrating the whole
  // process viewers go through. Runs from ORB_START until just before the
  // first stage takes over.
  const firstActiveAt = sections.length ? sections[0].active_at : Infinity;
  const ORB_START = 1.4;
  const ORB_END = Math.max(ORB_START + 1.5, firstActiveAt - 0.5);
  const orbProgress = interpolate(currentSec, [ORB_START, ORB_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const orbing = currentSec >= ORB_START && currentSec <= ORB_END + 0.25;
  const orbY = Y_TOP + orbProgress * (Y_BOT - Y_TOP);

  // Per-band emphasis (0-1) and active color flag.
  const bandState = sections.map((s, i) => {
    const yA = Y_TOP + i * bandH;
    const center = yA + bandH / 2;
    if (combineActive) return { emph: 1, active: true };
    if (i === activeIdx) {
      const e = interpolate(frame - Math.round(s.active_at * fps), [0, Math.round(0.4 * fps)], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easeFn("bounce-soft"),
      });
      return { emph: e, active: true };
    }
    if (orbing && activeIdx < 0) {
      // Traveling pulse — peaks when the orb is centered in this band.
      const e = Math.max(0, 1 - Math.abs(orbY - center) / (bandH * 0.7));
      return { emph: e, active: e > 0.45 };
    }
    return { emph: 0, active: false };
  });

  const funnelEntrance = useEntrance({ signature: "glass-rise", durationSec: 0.6, offsetFrames: Math.round(0.2 * fps) });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Callout above the head — shows the active stage's label + explanation
          (or the title during the intro). Crossfades on change. */}
      <ActiveCallout
        template={template}
        activeIdx={activeIdx}
        combineActive={combineActive}
        accent={accent}
        rtl={rtl}
        fps={fps}
        frame={frame}
      />

      <div style={{ position: "absolute", inset: 0, ...funnelEntrance }}>
        {sections.map((sec, i) => {
          const yA = Y_TOP + i * bandH;
          const yB = yA + bandH;
          return (
            <FunnelBand
              key={sec.id}
              sec={sec}
              yA={yA}
              yB={yB}
              isActive={bandState[i].active}
              emph={bandState[i].emph}
              accent={accent}
              rtl={rtl}
            />
          );
        })}

        {/* Reward bursts — as the orb passes each band in the intro, small
            icons of what you GAIN at that stage pop out (followers → trust →
            money). */}
        {activeIdx < 0 &&
          sections.map((sec, i) => {
            const passSec = ORB_START + ((i + 0.5) / n) * (ORB_END - ORB_START);
            const centerY = Y_TOP + (i + 0.5) * bandH;
            return (
              <RewardBurst
                key={`burst-${sec.id}`}
                icon={sec.icon}
                text={sec.reward_text}
                count={sec.reward_count}
                originX={CX + widthAt(centerY) / 2 - 10}
                originY={centerY}
                startSec={passSec}
                accent={accent}
                fps={fps}
                frame={frame}
              />
            );
          })}

        {/* Persistent glowing trail the orb leaves down the funnel center */}
        <TrailLine
          orbY={orbY}
          orbing={orbing}
          orbDone={currentSec > ORB_END}
          fadeStart={firstActiveAt}
          currentSec={currentSec}
          accent={accent}
        />

        {/* Journey orb — descends through all three stages in the intro */}
        {orbing && <JourneyOrb cx={CX} y={orbY} accent={accent} />}

        {/* Outro burst — all three rewards explode up together on "combine all" */}
        {combineActive && template.combine_at != null && (
          <OutroBurst
            icons={sections.map((s) => s.icon).filter(Boolean) as TemplateIconId[]}
            startSec={template.combine_at}
            accent={accent}
            fps={fps}
            frame={frame}
          />
        )}

        {/* Flow arrows between bands */}
        {sections.slice(0, -1).map((_, i) => {
          const y = Y_TOP + (i + 1) * bandH;
          return <FlowArrow key={`arr-${i}`} cx={CX} y={y} accent={accent} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Active-stage callout (above the head) ────────────────────────────────────

const ActiveCallout: React.FC<{
  template: ContentFunnelTemplate;
  activeIdx: number;
  combineActive: boolean;
  accent: string;
  rtl: boolean;
  fps: number;
  frame: number;
}> = ({ template, activeIdx, combineActive, accent, rtl, fps, frame }) => {
  // What to show: combine outro > active stage > intro title.
  let label = template.title ?? "";
  let sub = "";
  let keyFrame = 0; // frame the current content "appeared" — drives the pop-in
  if (combineActive && template.combine_at != null) {
    label = "תשלבו את כל השלושה";
    sub = "";
    keyFrame = Math.round(template.combine_at * fps);
  } else if (activeIdx >= 0) {
    const sec = template.sections[activeIdx];
    label = sec.label;
    sub = sec.sub ?? "";
    keyFrame = Math.round(sec.active_at * fps);
  }
  if (!label) return null;

  const local = frame - keyFrame;
  const t = interpolate(local, [0, Math.round(0.32 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("bounce-soft"),
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 165,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        direction: rtl ? "rtl" : "ltr",
        opacity: t,
        transform: `translateY(${((1 - t) * -22).toFixed(1)}px)`,
        willChange: "transform, opacity",
      }}
    >
      <span
        style={{
          fontFamily: FONTS.display,
          fontSize: 66,
          fontWeight: 900,
          color: "#fff",
          background: accent,
          padding: "12px 34px",
          borderRadius: RADIUS.md,
          letterSpacing: "-0.02em",
          boxShadow: `0 12px 32px ${accent}77, 0 6px 18px rgba(0,0,0,0.55)`,
          border: "2px solid rgba(255,255,255,0.28)",
        }}
      >
        {label}
      </span>
      {sub && (
        <span
          style={{
            fontFamily: FONTS.display,
            fontSize: 36,
            fontWeight: 800,
            color: "#fff",
            background: "rgba(14,15,20,0.82)",
            padding: "8px 22px",
            borderRadius: RADIUS.sm,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            boxShadow: "0 6px 16px rgba(0,0,0,0.5)",
            border: `2px solid ${accent}`,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
};

// ── A single funnel band ─────────────────────────────────────────────────────

const FunnelBand: React.FC<{
  sec: FunnelSection;
  yA: number;
  yB: number;
  isActive: boolean;
  emph: number;
  accent: string;
  rtl: boolean;
}> = ({ sec, yA, yB, isActive, emph, accent, rtl }) => {
  const wA = widthAt(yA);
  const wB = widthAt(yB);
  const boxW = wA; // top edge is the widest part of a downward-narrowing band
  const boxH = yB - yA;
  const left = CX - wA / 2;

  const scale = 1 + 0.12 * emph;

  // Trapezoid path inside the band box (top full width, bottom narrower).
  const inset = (wA - wB) / 2;
  const path = `M 0 0 L ${wA} 0 L ${wA - inset} ${boxH} L ${inset} ${boxH} Z`;

  // Orange highlight rides on top of the dark base at opacity = emph, so the
  // intro orb's traveling pulse glides smoothly across bands.
  const stroke = isActive ? "#FFFFFF" : "rgba(255,255,255,0.18)";
  const textColor = isActive ? "#FFFFFF" : `rgba(255,255,255,${(0.55 + 0.45 * emph).toFixed(2)})`;

  return (
    <div
      style={{
        position: "absolute",
        top: yA,
        left,
        width: boxW,
        height: boxH,
        transform: `scale(${scale.toFixed(3)})`,
        transformOrigin: "center center",
        filter:
          emph > 0.05
            ? `drop-shadow(0 18px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 ${(26 * emph).toFixed(0)}px ${accent}aa)`
            : "drop-shadow(0 6px 14px rgba(0,0,0,0.4))",
        willChange: "transform, filter",
        zIndex: isActive ? 5 : 1,
      }}
    >
      <svg viewBox={`0 0 ${boxW} ${boxH}`} width={boxW} height={boxH} style={{ position: "absolute", inset: 0 }}>
        {/* dark base */}
        <path d={path} fill="#3A2A1E" stroke={stroke} strokeWidth={isActive ? 4 : 2} strokeLinejoin="round" />
        {/* orange highlight (opacity = emph) */}
        <path d={path} fill={accent} opacity={emph} stroke="none" />
      </svg>

      {/* Band content — icon + short label only (full explanation lives in the
          callout above the head). */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "0 20px",
          direction: rtl ? "rtl" : "ltr",
        }}
      >
        {sec.icon && (
          <TemplateIcon
            id={sec.icon}
            size={isActive ? 48 : 38}
            color={textColor}
            strokeWidth={2.6}
            mode="stroke"
          />
        )}
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: isActive ? 40 : 32,
            fontWeight: 900,
            color: textColor,
            letterSpacing: "-0.01em",
            lineHeight: 1.0,
            textShadow: isActive ? "0 3px 12px rgba(0,0,0,0.6)" : "none",
          }}
        >
          {sec.label}
        </div>
      </div>
    </div>
  );
};

// ── Reward burst — icons of what you gain, popping out as the orb passes ─────

const RewardBurst: React.FC<{
  icon: TemplateIconId | undefined;
  text?: string;
  count?: number;
  originX: number;
  originY: number;
  startSec: number;
  accent: string;
  fps: number;
  frame: number;
}> = ({ icon, text, count, originX, originY, startSec, accent, fps, frame }) => {
  if (!icon) return null;
  const n = 6;
  const dur = 1.25;
  const nowSec = frame / fps;
  if (nowSec < startSec - 0.05 || nowSec > startSec + dur + 0.7) return null;
  const baseLocal = nowSec - startSec;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 8 }}>
      {Array.from({ length: n }).map((_, k) => {
        const delay = k * 0.05;
        const local = baseLocal - delay;
        if (local < 0 || local > dur) return null;
        const t = local / dur;
        const angleDeg = -82 + k * (94 / (n - 1)); // -82° (up) → +12° (down-right)
        const a = (angleDeg * Math.PI) / 180;
        const dist = t * (90 + k * 14);
        const x = originX + Math.cos(a) * dist;
        const y = originY + Math.sin(a) * dist;
        const opacity = t < 0.18 ? t / 0.18 : 1 - (t - 0.18) / 0.82;
        const size = 26 + t * 16;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: Math.max(0, opacity),
              boxShadow: `0 2px 10px rgba(0,0,0,0.5), 0 0 12px ${accent}88`,
              willChange: "transform, opacity",
            }}
          >
            <TemplateIcon id={icon} size={size * 0.62} color="#FFFFFF" strokeWidth={2.6} mode="stroke" />
          </div>
        );
      })}

      {/* Count-up / reward label — pops to the right of the band */}
      {text && (() => {
        const lt = interpolate(baseLocal, [0, 0.3], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeFn("bounce-soft"),
        });
        const out = interpolate(baseLocal, [dur + 0.1, dur + 0.6], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const op = Math.min(lt, out);
        if (op <= 0.01) return null;
        const num =
          count != null
            ? Math.round(interpolate(baseLocal, [0, dur], [0, count], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))
            : null;
        const display = num != null ? `+${num.toLocaleString("en-US")} ${text}` : `+ ${text}`;
        return (
          <div
            style={{
              position: "absolute",
              left: originX + 70,
              top: originY - 26,
              opacity: op,
              transform: `scale(${0.7 + 0.3 * lt})`,
              transformOrigin: "left center",
            }}
          >
            <span
              style={{
                fontFamily: FONTS.display,
                fontSize: 34,
                fontWeight: 900,
                color: "#fff",
                background: accent,
                padding: "6px 16px",
                borderRadius: RADIUS.sm,
                whiteSpace: "nowrap",
                direction: "rtl",
                boxShadow: `0 6px 16px ${accent}77, 0 3px 10px rgba(0,0,0,0.5)`,
              }}
            >
              {display}
            </span>
          </div>
        );
      })()}
    </div>
  );
};

// ── Outro burst — all rewards explode up together ───────────────────────────

const OutroBurst: React.FC<{
  icons: TemplateIconId[];
  startSec: number;
  accent: string;
  fps: number;
  frame: number;
}> = ({ icons, startSec, accent, fps, frame }) => {
  const dur = 1.6;
  const nowSec = frame / fps;
  const baseLocal = nowSec - startSec;
  if (baseLocal < 0 || baseLocal > dur + 0.5 || icons.length === 0) return null;

  const total = 15;
  const originX = CX + 30;
  const originY = Y_BOT - 120; // erupts up out of the bottom ("money") of the funnel

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
      {Array.from({ length: total }).map((_, k) => {
        const delay = (k % 6) * 0.04;
        const local = baseLocal - delay;
        if (local < 0 || local > dur) return null;
        const t = local / dur;
        // Fan widely up and out (both sides), biased upward.
        const angleDeg = -150 + (k / (total - 1)) * 120; // -150° → -30° (the whole upper arc)
        const a = (angleDeg * Math.PI) / 180;
        const dist = t * (260 + (k % 4) * 60);
        const x = originX + Math.cos(a) * dist;
        const y = originY + Math.sin(a) * dist;
        const opacity = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;
        const size = 40 + t * 22;
        const icon = icons[k % icons.length];
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: Math.max(0, opacity),
              transform: `rotate(${t * 90}deg)`,
              boxShadow: `0 3px 14px rgba(0,0,0,0.55), 0 0 16px ${accent}aa`,
            }}
          >
            <TemplateIcon id={icon} size={size * 0.6} color="#FFFFFF" strokeWidth={2.6} mode="stroke" />
          </div>
        );
      })}
    </div>
  );
};

// ── Trail line — glowing path the orb leaves down the funnel center ──────────

const TrailLine: React.FC<{
  orbY: number;
  orbing: boolean;
  orbDone: boolean;
  fadeStart: number;
  currentSec: number;
  accent: string;
}> = ({ orbY, orbing, orbDone, fadeStart, currentSec, accent }) => {
  if (currentSec < 1.4) return null;
  const bottom = orbDone ? Y_BOT : orbY;
  const height = Math.max(0, bottom - Y_TOP);
  // Fade out as the first stage takes over.
  const fade = interpolate(currentSec, [fadeStart - 0.6, fadeStart], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (fade <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: CX - 3,
        top: Y_TOP,
        width: 6,
        height,
        borderRadius: 3,
        background: `linear-gradient(to bottom, ${accent}00 0%, ${accent} 25%, ${accent} 100%)`,
        opacity: 0.7 * fade,
        boxShadow: `0 0 16px ${accent}aa`,
        zIndex: 7,
      }}
    />
  );
};

// ── Journey orb — the intro element that descends through the funnel ─────────

const JourneyOrb: React.FC<{ cx: number; y: number; accent: string }> = ({ cx, y, accent }) => {
  // A glowing core + a comet trail of fading dots above it (it moves downward).
  const trail = [0, 1, 2, 3, 4];
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 9 }}>
      {trail.map((k) => {
        const dy = k * 26;
        const op = 1 - k * 0.19;
        const r = 22 - k * 3;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: cx - r,
              top: y - dy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background:
                k === 0
                  ? `radial-gradient(circle at 38% 35%, #fff 0%, ${accent} 55%, ${accent} 100%)`
                  : accent,
              opacity: op * (k === 0 ? 1 : 0.5),
              boxShadow: k === 0 ? `0 0 26px ${accent}, 0 0 12px #fff` : "none",
            }}
          />
        );
      })}
    </div>
  );
};

const FlowArrow: React.FC<{ cx: number; y: number; accent: string }> = ({ cx, y }) => (
  <svg
    width={40}
    height={28}
    viewBox="0 0 40 28"
    style={{
      position: "absolute",
      top: y - 14,
      left: cx - 20,
      zIndex: 6,
      filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.6))",
    }}
  >
    <path d="M 6 6 L 20 20 L 34 6" fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
