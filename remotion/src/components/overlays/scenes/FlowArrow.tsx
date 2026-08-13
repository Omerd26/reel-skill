/**
 * FlowArrow — visual metaphor for "publish", "send", "automation", "chain".
 *
 * REBUILT 2026-08-09 to the overlay quality laws after the owner's
 * screenshot: the old version was a translucent white pill pinned to the
 * TOP of the frame (invisible over a bright ceiling), with ghost nodes and
 * labels hard-truncated to 8 chars ("זמן צפי'"). Now: chest anchor, dark
 * panel (the MetricLockup family the owner approved), nodes that auto-fit
 * their text (never truncate), inactive nodes clearly visible.
 *
 * Two variants:
 *   - send  — a single object (post / icon) flies upward and out, with a
 *             trailing path. Use for "publish", "upload", "send".
 *   - chain — N nodes connected by arrows that activate in sequence (energy
 *             pulse travels along each edge, node lights up on arrival).
 *             Use for "automation", "trigger to action", "chain reaction".
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance } from "../motion";
import {
  GlassCard,
  Eyebrow,
  HaloGlow,
  resolveAnchor,
  type OverlayAnchor,
} from "../primitives";
import {
  RADIUS,
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface FlowArrowScene {
  type: "flow_arrow";
  id: string;
  start: number;
  end: number;
  variant?: "send" | "chain";
  /** For send: short label inside the flying card. e.g. "POST", "REEL". */
  label?: string;
  /** For chain: 2-4 node labels (≤ 8 chars each). */
  nodes?: string[];
  /** Tone — accent on the flying object / chain pulse. Default "brand". */
  tone?: Tone;
  /** Optional eyebrow above the visual. */
  eyebrow?: string;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: FlowArrowScene;
}

// Law 1: text never sits on translucent glass — the approved dark panel.
const DARK_PANEL: React.CSSProperties = {
  background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.55)",
};

export const FlowArrow: React.FC<Props> = ({ scene }) => {
  const variant = scene.variant ?? "send";
  const tone: Tone = scene.tone ?? "brand";
  // Law 4: chest level by default — the old top anchors put the panel on
  // the bright ceiling where it vanished.
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");

  const cardEntrance = useEntrance({
    signature: variant === "send" ? "side-slide" : "stack-cascade",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material="frosted"
            padding="24px 30px"
            rtl={false}
            style={{
              minWidth: variant === "chain" ? 620 : 300,
              maxWidth: 780,
              ...DARK_PANEL,
            }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 24, marginBottom: 16 }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {variant === "send" ? (
              <SendVariant label={scene.label ?? "POST"} tone={tone} />
            ) : (
              <ChainVariant nodes={scene.nodes ?? ["TRIGGER", "ACT", "DONE"]} tone={tone} />
            )}
          </GlassCard>

          {/* Halo behind the panel */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }}>
            <HaloGlow
              tone={tone}
              size={520}
              intensity={0.4}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Send variant ─────────────────────────────────────────────────────────────

const SendVariant: React.FC<{ label: string; tone: Tone }> = ({ label, tone }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);

  // The card flies upward and slightly out, leaving a trail
  const launchStart = Math.round(0.55 * fps);
  const launchDuration = Math.round(0.85 * fps);
  const t = interpolate(
    frame,
    [launchStart, launchStart + launchDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("whip-out") },
  );
  const yShift = -130 * t;
  const opacity = t < 0.85 ? 1 : interpolate(t, [0.85, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = 1 - 0.15 * t;

  // Trail dots — 5 dots cascading behind the card
  const trailDots = [0, 1, 2, 3, 4].map((i) => {
    const dotDelay = i * 0.06;
    const dotT = Math.max(0, Math.min(1, t - dotDelay));
    return { offset: -100 * dotT + (-16 * i), opacity: (1 - dotT) * 0.6 };
  });

  return (
    <div
      style={{
        position: "relative",
        height: 220,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      {/* Trail */}
      {trailDots.map((d, i) => (
        <div
          key={`trail-${i}`}
          style={{
            position: "absolute",
            bottom: 76 + Math.abs(d.offset),
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: accent,
            opacity: d.opacity,
            filter: `blur(${1 + i * 0.5}px)`,
            boxShadow: `0 0 10px ${accentGlow}`,
          }}
        />
      ))}

      {/* Flying card */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          padding: "16px 30px",
          borderRadius: RADIUS.md,
          background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.25)})`,
          boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 28px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.30)`,
          transform: `translateY(${yShift}px) scale(${scale})`,
          opacity,
          willChange: "transform, opacity",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Send icon */}
        <svg viewBox="0 0 24 24" width={30} height={30}>
          <path
            d="M 4 12 L 20 4 L 14 20 L 11 13 Z"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            ...TYPE.eyebrow,
            fontSize: 28,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: isHebrew(label) ? "0" : "0.08em",
            direction: isHebrew(label) ? "rtl" : "ltr",
          }}
        >
          {isHebrew(label) ? label : label.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

// ── Chain variant ────────────────────────────────────────────────────────────

/** Auto-fit: the whole label always renders — the font shrinks, the text
 * wraps up to 2 lines, and NOTHING is ever sliced off (the "זמן צפי'"
 * truncation was the owner's exact complaint). */
const nodeFontSize = (label: string): number => {
  const n = label.length;
  if (n <= 5) return 24;
  if (n <= 8) return 21;
  if (n <= 12) return 18;
  return 16;
};

const ChainVariant: React.FC<{ nodes: string[]; tone: Tone }> = ({ nodes, tone }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);

  const safeNodes = nodes.slice(0, 4);
  const N = safeNodes.length;

  // Sequence: each node activates 0.30s after the previous, energy pulse
  // traverses the edge before the next node lights up.
  const nodeStartFrames = safeNodes.map((_, i) => Math.round((0.55 + i * 0.30) * fps));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "12px 0",
        direction: "rtl", // Hebrew chains read right-to-left
      }}
    >
      {safeNodes.map((label, i) => {
        const nodeT = interpolate(
          frame,
          [nodeStartFrames[i], nodeStartFrames[i] + Math.round(0.20 * fps)],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
        );
        const isActive = nodeT > 0.4;
        const hebrew = isHebrew(label);

        return (
          <React.Fragment key={`chain-${i}`}>
            {/* Node — big, and CLEARLY visible even before activation
                (the old inactive fill was a 6%-white ghost). */}
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: "50%",
                background: isActive
                  ? `linear-gradient(135deg, ${accent}, ${darken(accent, 0.25)})`
                  : "linear-gradient(180deg, #23242C 0%, #191A20 100%)",
                border: `2px solid ${isActive ? accent : "rgba(255,255,255,0.28)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 10,
                boxShadow: isActive
                  ? `0 0 ${28 * nodeT}px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.25)`
                  : "inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 20px rgba(0,0,0,0.4)",
                transform: `scale(${0.85 + 0.15 * Math.min(1, nodeT * 1.2)})`,
                willChange: "transform, background",
              }}
            >
              <span
                style={{
                  fontFamily: "'Heebo', sans-serif",
                  fontSize: nodeFontSize(label),
                  fontWeight: 800,
                  lineHeight: 1.12,
                  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.72)",
                  letterSpacing: hebrew ? "0" : "0.04em",
                  textAlign: "center",
                  direction: hebrew ? "rtl" : "ltr",
                  overflowWrap: "break-word",
                  maxWidth: 104,
                }}
              >
                {hebrew ? label : label.toUpperCase()}
              </span>
            </div>

            {/* Arrow + pulse — only between nodes */}
            {i < N - 1 && (
              <ChainEdge
                startFrame={nodeStartFrames[i] + Math.round(0.18 * fps)}
                durationFrames={Math.round(0.22 * fps)}
                accent={accent}
                accentGlow={accentGlow}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const ChainEdge: React.FC<{
  startFrame: number;
  durationFrames: number;
  accent: string;
  accentGlow: string;
}> = ({ startFrame, durationFrames, accent, accentGlow }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("glide"),
  });

  const edgeWidth = 64;
  return (
    <div
      style={{
        position: "relative",
        width: edgeWidth,
        height: 5,
        borderRadius: 3,
        background: "rgba(255,255,255,0.14)",
        // Flex container is RTL — the pulse still travels visually toward
        // the NEXT node (leftwards), so anchor fill to the right edge.
        transform: "scaleX(-1)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${t * 100}%`,
          background: `linear-gradient(90deg, transparent, ${accent})`,
          borderRadius: 3,
          boxShadow: `0 0 8px ${accentGlow}`,
        }}
      />
      {/* Arrow head */}
      <div
        style={{
          position: "absolute",
          right: -13,
          top: -6.5,
          width: 0,
          height: 0,
          borderLeft: `13px solid ${t > 0.6 ? accent : "rgba(255,255,255,0.14)"}`,
          borderTop: "9px solid transparent",
          borderBottom: "9px solid transparent",
          filter: t > 0.6 ? `drop-shadow(0 0 4px ${accentGlow})` : "none",
        }}
      />
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}

function darken(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
