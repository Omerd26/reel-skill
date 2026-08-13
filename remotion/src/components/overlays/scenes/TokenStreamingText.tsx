/**
 * TokenStreamingText — visual metaphor for "AI streaming a response",
 * "natural-language output", "the model is replying".
 *
 * Body text inside a glass card that appears word-by-word as if streamed
 * from an LLM (token-by-token in real LLM terms — but here word-by-word
 * for visual clarity). A subtle cursor block sits at the end while
 * streaming, then blinks once typing finishes. Soft, rounded, no monospace
 * — distinct from CodeBlock / TerminalFeed.
 *
 * Use cases:
 *   - "ה-AI עונה לך כך" → streaming Hebrew response
 *   - "look at what Claude generates" → English answer streaming
 *   - "this is the prompt response" → editorial-style streaming text
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

export interface TokenStreamingTextScene {
  type: "token_streaming_text";
  id: string;
  start: number;
  end: number;
  /** The full response text to stream. */
  text: string;
  /** Optional eyebrow. e.g. "AI RESPONSE", "תשובת ה-AI". */
  eyebrow?: string;
  /** Optional speaker/model label above text. e.g. "Claude", "GPT". */
  speaker?: string;
  /** Tone — colors the cursor + glow. Default "info". */
  tone?: Tone;
  /** Words per second streaming rate. Default 6. */
  wps?: number;
  anchor?: OverlayAnchor;
  rtl?: boolean;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: TokenStreamingTextScene;
}

export const TokenStreamingText: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "info";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const rtl = scene.rtl ?? isHebrew(scene.text);
  const wps = scene.wps ?? 6;
  const words = scene.text.split(/\s+/);
  const framesPerWord = Math.max(1, Math.round(fps / wps));

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.45,
  });

  // Streaming starts at 0.50s
  const streamStartFrame = Math.round(0.50 * fps);
  const wordsRevealed = Math.max(
    0,
    Math.min(words.length, Math.floor((frame - streamStartFrame) / framesPerWord)),
  );
  const streamDoneFrame = streamStartFrame + words.length * framesPerWord;
  const streamDone = frame >= streamDoneFrame;

  // Cursor blinks after stream done
  const blinkPeriod = Math.max(1, Math.round(fps * 0.5));
  const cursorVisible = streamDone
    ? Math.floor(frame / blinkPeriod) % 2 === 0
    : true;

  // Each just-arrived word has a brief opacity ramp for a soft "settle"
  const wordOpacity = (idx: number): number => {
    if (idx > wordsRevealed) return 0;
    if (idx === wordsRevealed) {
      // currently arriving — partial
      const sub = ((frame - streamStartFrame) % framesPerWord) / framesPerWord;
      return Math.max(0, sub);
    }
    return interpolate(
      frame,
      [
        streamStartFrame + idx * framesPerWord,
        streamStartFrame + idx * framesPerWord + Math.round(0.15 * fps),
      ],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
    );
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material="liquid"
            padding="26px 32px"
            rtl={rtl}
            style={{ maxWidth: 760 }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 13, marginBottom: 12, textAlign: rtl ? "right" : "left" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Speaker badge */}
            {scene.speaker && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 10px",
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

            {/* Streamed text */}
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 28,
                fontWeight: 500,
                lineHeight: 1.5,
                color: COLORS.text,
                direction: rtl ? "rtl" : "ltr",
                textAlign: rtl ? "right" : "left",
                letterSpacing: "-0.005em",
              }}
            >
              {words.map((w, i) => (
                <React.Fragment key={`w-${i}`}>
                  <span
                    style={{
                      opacity: wordOpacity(i),
                      transition: "none",
                      display: "inline-block",
                    }}
                  >
                    {w}
                  </span>
                  {i < words.length - 1 && " "}
                </React.Fragment>
              ))}
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 22,
                  marginLeft: 2,
                  marginRight: 2,
                  background: accent,
                  verticalAlign: "middle",
                  opacity: cursorVisible ? 0.85 : 0,
                  borderRadius: 2,
                  boxShadow: `0 0 6px ${accentGlow}`,
                }}
              />
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
            <HaloGlow
              tone={tone}
              size={620}
              intensity={0.35}
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}
