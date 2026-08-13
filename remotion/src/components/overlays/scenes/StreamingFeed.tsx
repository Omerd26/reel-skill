/**
 * StreamingFeed — visual metaphor for "constant activity", "comments flowing", "feed".
 *
 * Vertical stack of 3-4 events that scroll up continuously. New items slide
 * in from the top, old ones fade out at the bottom. Each event has an
 * avatar (letter-as-avatar fallback), a username, and a short message.
 *
 * Use cases:
 *   - "תגובות זורמות" → comments feed
 *   - "פעילות בלתי פוסקת" → activity stream
 *   - "live engagement" → reactions feed
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
  COLORS,
  RADIUS,
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface FeedEvent {
  user: string;
  message: string;
  /** Avatar background hex; if omitted, derived from tone. */
  avatar_color?: string;
  /** Optional avatar letter; defaults to first char of user. */
  avatar_letter?: string;
}

export interface StreamingFeedScene {
  type: "streaming_feed";
  id: string;
  start: number;
  end: number;
  /** Events to cycle through. 4-8 work well; we show 3 at a time. */
  events: FeedEvent[];
  /** Tone — colors avatars + glow. Default "brand". */
  tone?: Tone;
  /** Eyebrow above. */
  eyebrow?: string;
  /** Time per event in seconds (how long it stays in the visible window). Default 1.0. */
  per_event_sec?: number;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: StreamingFeedScene;
}

const VISIBLE_COUNT = 3;
const ROW_HEIGHT = 64;
const ROW_GAP = 8;

export const StreamingFeed: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const events = scene.events;
  const perEventFrames = Math.max(1, Math.round((scene.per_event_sec ?? 1.0) * fps));

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Time-based offset → which events are currently in the visible window.
  // We show events[i..i+VISIBLE_COUNT-1] and compute a continuous y-shift.
  const startFrame = Math.round(0.50 * fps);
  const elapsedFrames = Math.max(0, frame - startFrame);
  const continuousIdx = elapsedFrames / perEventFrames;
  const baseIdx = Math.floor(continuousIdx);
  const phase = continuousIdx - baseIdx; // 0..1 within current row

  const visibleEvents: Array<{ ev: FeedEvent; pos: number }> = [];
  for (let i = -1; i < VISIBLE_COUNT + 1; i++) {
    const evIdx = (baseIdx + i) % events.length;
    if (evIdx < 0) continue;
    visibleEvents.push({ ev: events[evIdx], pos: i });
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="22px 26px" rtl={false} style={{ minWidth: 360 }}>
            {scene.eyebrow && (
              <Eyebrow tone={tone} script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"} style={{ fontSize: 18, marginBottom: 14 }}>
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Feed window */}
            <div
              style={{
                position: "relative",
                height: VISIBLE_COUNT * (ROW_HEIGHT + ROW_GAP) - ROW_GAP,
                overflow: "hidden",
                borderRadius: RADIUS.md,
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
              }}
            >
              {visibleEvents.map(({ ev, pos }, idx) => {
                const yOffset = (pos - phase) * (ROW_HEIGHT + ROW_GAP);
                // Fade in/out based on position within the visible window
                const visiblePos = pos - phase;
                const fade =
                  visiblePos < 0
                    ? Math.max(0, 1 + visiblePos * 1.5)
                    : visiblePos > VISIBLE_COUNT - 1
                      ? Math.max(0, 1 - (visiblePos - (VISIBLE_COUNT - 1)) * 1.5)
                      : 1;
                return (
                  <FeedRow
                    key={`fr-${idx}-${pos}`}
                    ev={ev}
                    yOffset={yOffset}
                    opacity={fade}
                    accent={accent}
                    accentGlow={accentGlow}
                  />
                );
              })}
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
            <HaloGlow tone={tone} size={500} intensity={0.4} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FeedRow: React.FC<{
  ev: FeedEvent;
  yOffset: number;
  opacity: number;
  accent: string;
  accentGlow: string;
}> = ({ ev, yOffset, opacity, accent, accentGlow }) => {
  const avatarBg = ev.avatar_color ?? accent;
  const letter = ev.avatar_letter ?? ev.user.slice(0, 1).toUpperCase();

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: ROW_HEIGHT,
        transform: `translateY(${yOffset}px)`,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",
        background: "rgba(255,255,255,0.04)",
        borderRadius: RADIUS.sm,
        border: "1px solid rgba(255,255,255,0.06)",
        willChange: "transform, opacity",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${avatarBg}, ${darken(avatarBg, 0.30)})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 10px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.20)`,
        }}
      >
        <span style={{ ...TYPE.eyebrow, fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>
          {letter}
        </span>
      </div>

      {/* User + message */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
        <span style={{ ...TYPE.body, fontSize: 16, fontWeight: 700, color: COLORS.text }}>
          {ev.user}
        </span>
        <span
          style={{
            ...TYPE.body,
            fontSize: 14,
            color: COLORS.textSecondary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {ev.message}
        </span>
      </div>
    </div>
  );
};

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

function darken(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// silence unused
export const _UNUSED: unknown = { easeFn };
