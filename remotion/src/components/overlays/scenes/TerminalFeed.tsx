/**
 * TerminalFeed — visual metaphor for "command", "running automatically", "code".
 *
 * A terminal-style card with monospace text. Lines type out one after
 * another with a cursor. Final line shows a green ✓ status. Optional
 * top "title bar" with traffic-light dots (macOS-style).
 *
 * Use cases:
 *   - "המערכת רצה אוטומטית" → terminal commands appearing
 *   - "code-driven workflow" → cli-style demonstration
 *   - "engineered for scale" → status output with ✓ done
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

export interface TerminalLine {
  /** Line text. Use leading "$ " for commands, plain for output. */
  text: string;
  /** Optional status decoration appended after typing settles. */
  status?: "ok" | "warn" | "err" | "pending";
}

export interface TerminalFeedScene {
  type: "terminal_feed";
  id: string;
  start: number;
  end: number;
  /** Lines to type out, in order. */
  lines: TerminalLine[];
  /** Window title (optional). e.g. "omer.digital ~ deploy". */
  title?: string;
  /** Eyebrow above. */
  eyebrow?: string;
  /** Tone — colors prompt + status. Default "brand". */
  tone?: Tone;
  /** Chars per second typing rate. Default 32. */
  cps?: number;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: TerminalFeedScene;
}

export const TerminalFeed: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const cps = scene.cps ?? 32;
  const framesPerChar = Math.max(1, Math.round(fps / cps));
  const lines = scene.lines.slice(0, 6);

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Compute typed-out per-line state
  const typeStartFrame = Math.round(0.50 * fps);
  let cumulativeFrame = typeStartFrame;
  const lineStates = lines.map((line) => {
    const lineStart = cumulativeFrame;
    const charsTyped = Math.max(0, Math.min(line.text.length, Math.floor((frame - lineStart) / framesPerChar)));
    const lineDoneFrame = lineStart + line.text.length * framesPerChar;
    const isLineDone = frame >= lineDoneFrame;

    // Status appears 0.20s after line done
    const statusStartFrame = lineDoneFrame + Math.round(0.20 * fps);
    const statusVisible = line.status && frame >= statusStartFrame;

    cumulativeFrame = lineDoneFrame + Math.round(0.30 * fps); // 0.30s pause between lines

    return {
      typedText: line.text.slice(0, charsTyped),
      isLineDone,
      statusVisible: !!statusVisible,
      lineStartFrame: lineStart,
    };
  });

  // Cursor on the latest typing line
  const activeLineIdx = lineStates.findIndex((s) => !s.isLineDone);
  const lastIdx = activeLineIdx === -1 ? lines.length - 1 : activeLineIdx;

  // Cursor blink (only when typing or all done)
  const blinkPeriodFrames = Math.max(1, Math.round(fps * 0.5));
  const cursorVisible = Math.floor(frame / blinkPeriodFrames) % 2 === 0;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="solid-dark" padding={0} rtl={false} style={{ minWidth: 460, overflow: "hidden" }}>
            {scene.eyebrow && (
              <div style={{ padding: "16px 20px 0" }}>
                <Eyebrow tone={tone} script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"} style={{ fontSize: 16 }}>
                  {scene.eyebrow}
                </Eyebrow>
              </div>
            )}

            {/* Title bar */}
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <TrafficDot color="#FF5F56" />
              <TrafficDot color="#FFBD2E" />
              <TrafficDot color="#27C93F" />
              {scene.title && (
                <span
                  style={{
                    flex: 1,
                    textAlign: "center",
                    ...TYPE.meta,
                    fontSize: 12,
                    color: COLORS.textTertiary,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  {scene.title}
                </span>
              )}
            </div>

            {/* Body */}
            <div
              style={{
                padding: "16px 20px 20px",
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                fontSize: 16,
                lineHeight: 1.55,
                color: "#E5E5E5",
                minHeight: 140,
              }}
            >
              {lineStates.map((s, i) => {
                if (frame < s.lineStartFrame) return null; // line not yet started
                const isCmd = lines[i].text.startsWith("$");
                const isLast = i === lastIdx;
                return (
                  <div key={`tl-${i}`} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    {/* Prompt color for $ lines */}
                    <span style={{ flex: 1, color: isCmd ? accent : "#E5E5E5", whiteSpace: "pre" }}>
                      {s.typedText}
                      {isLast && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 9,
                            height: 16,
                            marginLeft: 2,
                            background: accent,
                            verticalAlign: "middle",
                            opacity: cursorVisible ? 1 : 0,
                            boxShadow: `0 0 4px ${accentGlow}`,
                          }}
                        />
                      )}
                    </span>
                    {/* Status badge */}
                    {s.statusVisible && lines[i].status && (
                      <StatusBadge kind={lines[i].status!} />
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
            <HaloGlow tone={tone} size={520} intensity={0.4} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TrafficDot: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
);

const StatusBadge: React.FC<{ kind: NonNullable<TerminalLine["status"]> }> = ({ kind }) => {
  const colors = {
    ok: { bg: "#1F3A2A", fg: "#4ADE80", label: "✓" },
    warn: { bg: "#3A2F1A", fg: "#FBBF24", label: "!" },
    err: { bg: "#3A1F1F", fg: "#EF4444", label: "✗" },
    pending: { bg: "#1F2A3A", fg: "#4FC3F7", label: "…" },
  } as const;
  const c = colors[kind];
  return (
    <span
      style={{
        ...TYPE.meta,
        fontSize: 12,
        fontWeight: 800,
        padding: "2px 8px",
        borderRadius: RADIUS.sm,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.fg}`,
        boxShadow: `0 0 6px ${c.fg}`,
      }}
    >
      {c.label}
    </span>
  );
};

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

// silence unused
export const _UNUSED: unknown = { easeFn };
