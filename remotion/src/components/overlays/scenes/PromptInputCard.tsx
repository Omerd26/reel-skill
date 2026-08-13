/**
 * PromptInputCard — visual metaphor for "ask the AI", "send a prompt",
 * "the question you type".
 *
 * A chat-style input field inside a glass card: a textarea-like row with
 * the prompt typing in, then a send button on the side that pulses,
 * presses, and the prompt clears with an upward fade as if "sent". An
 * optional ✓ confirmation badge appears at the bottom.
 *
 * Use cases:
 *   - "פשוט תכתוב לו: סדר לי את הלו״ז" → prompt typing + send + ✓
 *   - "ask Claude: build me a landing page" → English prompt flow
 *   - "השאלה היחידה ששואלים" → single prompt without ✓
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
  FONTS,
  RADIUS,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface PromptInputCardScene {
  type: "prompt_input_card";
  id: string;
  start: number;
  end: number;
  /** The prompt that types in. */
  prompt: string;
  /** Optional eyebrow. e.g. "ASK CLAUDE", "שאל את ה-AI". */
  eyebrow?: string;
  /** Speaker/model label inside the bubble. Default "Claude". */
  speaker?: string;
  /** Show the "Sent ✓" confirmation after send? Default true. */
  show_sent?: boolean;
  /** Tone. Default "info" (cool — AI). */
  tone?: Tone;
  /** Chars per second typing. Default 22. */
  cps?: number;
  anchor?: OverlayAnchor;
  rtl?: boolean;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: PromptInputCardScene;
}

export const PromptInputCard: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "info";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const rtl = scene.rtl ?? isHebrew(scene.prompt);
  const cps = scene.cps ?? 22;
  const showSent = scene.show_sent ?? true;

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.45,
  });

  // Typing
  const typeStartFrame = Math.round(0.55 * fps);
  const framesPerChar = Math.max(1, Math.round(fps / cps));
  const charsTyped = Math.max(
    0,
    Math.min(scene.prompt.length, Math.floor((frame - typeStartFrame) / framesPerChar)),
  );
  const typedText = scene.prompt.slice(0, charsTyped);
  const typingDoneFrame = typeStartFrame + scene.prompt.length * framesPerChar;
  const typingDone = frame >= typingDoneFrame;

  // Cursor blink (only after typing done)
  const blinkPeriod = Math.max(1, Math.round(fps * 0.5));
  const cursorVisible = typingDone
    ? Math.floor(frame / blinkPeriod) % 2 === 0
    : true;

  // Send button press at typingDone + 0.20s
  const sendStart = typingDoneFrame + Math.round(0.20 * fps);
  const sendPress = interpolate(
    frame,
    [sendStart, sendStart + Math.round(0.07 * fps), sendStart + Math.round(0.20 * fps)],
    [1, 0.88, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const sendT = interpolate(
    frame,
    [sendStart, sendStart + Math.round(0.30 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
  );

  // After send, the prompt "flies up" as if sent into the void
  const flyT = interpolate(
    frame,
    [sendStart + Math.round(0.10 * fps), sendStart + Math.round(0.45 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("whip-out") },
  );
  const promptY = -30 * flyT;
  const promptOpacity = 1 - flyT * 0.5; // fade slightly, not fully

  // "Sent ✓" badge appears after fly
  const sentBadgeT = interpolate(
    frame,
    [sendStart + Math.round(0.30 * fps), sendStart + Math.round(0.55 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material="liquid"
            padding="22px 26px"
            rtl={rtl}
            style={{ minWidth: 480 }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 13, marginBottom: 14 }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {scene.speaker && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 10px",
                  borderRadius: RADIUS.pill,
                  background: `${accent}22`,
                  border: `1px solid ${accent}66`,
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: accent,
                    boxShadow: `0 0 6px ${accentGlow}`,
                  }}
                />
                <span
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 13,
                    fontWeight: 700,
                    color: accent,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {scene.speaker}
                </span>
              </div>
            )}

            {/* Input row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderRadius: RADIUS.lg,
                background: "rgba(0,0,0,0.30)",
                border: `1.5px solid ${typingDone ? accent : "rgba(255,255,255,0.18)"}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 ${(typingDone ? 14 : 0)}px ${accentGlow}`,
                direction: rtl ? "rtl" : "ltr",
              }}
            >
              <div
                style={{
                  flex: 1,
                  fontFamily: FONTS.body,
                  fontSize: 22,
                  fontWeight: 500,
                  color: COLORS.text,
                  letterSpacing: "-0.005em",
                  transform: `translateY(${promptY}px)`,
                  opacity: promptOpacity,
                  willChange: "transform, opacity",
                }}
              >
                {typedText}
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 22,
                    marginLeft: 2,
                    marginRight: 2,
                    background: accent,
                    verticalAlign: "middle",
                    opacity: cursorVisible && flyT < 0.3 ? 1 : 0,
                    boxShadow: `0 0 4px ${accentGlow}`,
                  }}
                />
              </div>

              {/* Send button */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: typingDone
                    ? `linear-gradient(135deg, ${accent}, ${darken(accent, 0.25)})`
                    : "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${sendPress})`,
                  boxShadow: typingDone
                    ? `0 0 ${10 + 12 * sendT}px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.30)`
                    : "none",
                  willChange: "transform, background",
                  flexShrink: 0,
                }}
              >
                <SendIcon color={typingDone ? "#FFFFFF" : COLORS.textTertiary} />
              </div>
            </div>

            {/* Sent confirmation */}
            {showSent && sentBadgeT > 0 && (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: rtl ? "flex-end" : "flex-start",
                  gap: 8,
                  opacity: sentBadgeT,
                  transform: `translateY(${(1 - sentBadgeT) * 6}px)`,
                }}
              >
                <CheckIcon color={toneColor("success")} />
                <span
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 16,
                    fontWeight: 600,
                    color: toneColor("success"),
                    letterSpacing: "0.04em",
                  }}
                >
                  Sent
                </span>
              </div>
            )}
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35 + sendT * 0.2, pointerEvents: "none" }}>
            <HaloGlow
              tone={tone}
              size={580}
              intensity={0.4}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SendIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width={18} height={18} viewBox="0 0 24 24">
    <path
      d="M 4 12 L 20 4 L 14 20 L 11 13 Z"
      fill={color}
      stroke={color}
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width={18} height={18} viewBox="0 0 24 24">
    <path
      d="M 5 13 L 10 18 L 20 7"
      fill="none"
      stroke={color}
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
