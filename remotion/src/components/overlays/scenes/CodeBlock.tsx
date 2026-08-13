/**
 * CodeBlock — visual metaphor for "the command", "one line of code",
 * "this is what you do".
 *
 * A single line of code inside a small terminal-style glass card. Letters
 * type in left-to-right, syntax-colored (keyword / string / function /
 * default). Optional "copy" button in the corner that pulses on completion.
 *
 * Distinct from TerminalFeed (which is a multi-line transcript) — this is
 * one hero command, made to be read AND copied.
 *
 * Use cases:
 *   - "Just run: npm install dredit" → npm install dredit
 *   - "הפקודה היחידה שצריך" → single-line install
 *   - "the magic one-liner" → curl ... | sh
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
  glassStyle,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface CodeBlockScene {
  type: "code_block";
  id: string;
  start: number;
  end: number;
  /** The code line to type in. Single line. e.g. "npm install dredit". */
  code: string;
  /** Optional leading prompt. e.g. "$", "❯", ">". Default "$". */
  prompt?: string;
  /** Optional eyebrow. e.g. "INSTALL", "ONE COMMAND". */
  eyebrow?: string;
  /** Optional language label for the corner. e.g. "bash", "javascript". */
  language?: string;
  /** Tone. Default "brand". */
  tone?: Tone;
  /** Chars per second typing. Default 28. */
  cps?: number;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: CodeBlockScene;
}

// Tiny syntax tokenizer — covers the common cases (keywords, strings, numbers,
// flags). Not a real lexer; just enough to make the line look like code.
const KEYWORDS = new Set([
  "npm",
  "pnpm",
  "yarn",
  "bun",
  "install",
  "add",
  "run",
  "build",
  "test",
  "create",
  "init",
  "deploy",
  "git",
  "clone",
  "push",
  "pull",
  "curl",
  "wget",
  "pip",
  "python",
  "node",
  "bunx",
  "npx",
  "uvx",
  "sudo",
  "brew",
]);

interface Token {
  text: string;
  kind: "keyword" | "string" | "number" | "flag" | "default";
}

function tokenize(code: string): Token[] {
  const parts = code.split(/(\s+)/);
  return parts.map((p) => {
    if (!p.trim()) return { text: p, kind: "default" as const };
    if (KEYWORDS.has(p)) return { text: p, kind: "keyword" as const };
    if (p.startsWith("-")) return { text: p, kind: "flag" as const };
    if (p.startsWith('"') || p.startsWith("'")) return { text: p, kind: "string" as const };
    if (/^\d+$/.test(p)) return { text: p, kind: "number" as const };
    return { text: p, kind: "default" as const };
  });
}

function tokenColor(kind: Token["kind"], accent: string): string {
  switch (kind) {
    case "keyword": return accent;        // brand
    case "string":  return "#4ADE80";     // green
    case "number":  return "#FBBF24";     // amber
    case "flag":    return "#A78BFA";     // purple
    case "default": return "#E5E5E7";     // off-white
  }
}

export const CodeBlock: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const prompt = scene.prompt ?? "$";
  const cps = scene.cps ?? 28;
  const tokens = tokenize(scene.code);

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.45,
  });

  // Typing
  const typeStartFrame = Math.round(0.55 * fps);
  const framesPerChar = Math.max(1, Math.round(fps / cps));
  const charsTyped = Math.max(
    0,
    Math.min(scene.code.length, Math.floor((frame - typeStartFrame) / framesPerChar)),
  );
  const typingDoneFrame = typeStartFrame + scene.code.length * framesPerChar;
  const typingDone = frame >= typingDoneFrame;

  // Cursor blink
  const blinkPeriod = Math.max(1, Math.round(fps * 0.5));
  const cursorVisible = typingDone
    ? Math.floor(frame / blinkPeriod) % 2 === 0
    : true;

  // Copy button pulse after typing
  const copyPulse = interpolate(
    frame,
    [typingDoneFrame, typingDoneFrame + Math.round(0.35 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("bounce-soft"),
    },
  );

  // Render tokens up to charsTyped, splitting the partial last token mid-word
  let consumed = 0;
  const displayedTokens: Array<{ text: string; kind: Token["kind"]; complete: boolean }> = [];
  for (const tok of tokens) {
    if (consumed >= charsTyped) break;
    const take = Math.min(tok.text.length, charsTyped - consumed);
    displayedTokens.push({
      text: tok.text.slice(0, take),
      kind: tok.kind,
      complete: take === tok.text.length,
    });
    consumed += take;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <div
            style={{
              ...glassStyle("solid-dark"),
              borderRadius: RADIUS.lg,
              padding: 0,
              minWidth: 540,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {scene.eyebrow && (
              <div style={{ padding: "16px 22px 4px" }}>
                <Eyebrow
                  tone={tone}
                  script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                  style={{ fontSize: 12 }}
                >
                  {scene.eyebrow}
                </Eyebrow>
              </div>
            )}

            {/* Title bar */}
            <div
              style={{
                padding: "8px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.025)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Dot color="#FF5F56" />
              <Dot color="#FFBD2E" />
              <Dot color="#27C93F" />
              <div style={{ flex: 1, textAlign: "center" }}>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLORS.textTertiary,
                    letterSpacing: "0.06em",
                    textTransform: "lowercase",
                  }}
                >
                  {scene.language ?? "shell"}
                </span>
              </div>
            </div>

            {/* The code line */}
            <div
              style={{
                padding: "20px 22px",
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                fontSize: 22,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  color: accent,
                  marginRight: 12,
                  fontWeight: 700,
                  textShadow: `0 0 6px ${accentGlow}`,
                }}
              >
                {prompt}
              </span>
              {displayedTokens.map((tok, i) => (
                <span key={`tk-${i}`} style={{ color: tokenColor(tok.kind, accent) }}>
                  {tok.text}
                </span>
              ))}
              <span
                style={{
                  display: "inline-block",
                  width: 11,
                  height: 22,
                  marginLeft: 2,
                  background: accent,
                  verticalAlign: "middle",
                  opacity: cursorVisible ? 1 : 0,
                  boxShadow: `0 0 6px ${accentGlow}`,
                }}
              />
            </div>

            {/* Copy badge in corner — pulses on completion */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                padding: "5px 10px",
                borderRadius: RADIUS.pill,
                background: `${accent}33`,
                border: `1px solid ${accent}88`,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: FONTS.mono,
                fontSize: 10,
                fontWeight: 700,
                color: accent,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                opacity: copyPulse,
                transform: `scale(${0.7 + 0.3 * copyPulse})`,
                boxShadow: `0 0 ${10 * copyPulse}px ${accentGlow}`,
              }}
            >
              <ClipboardIcon color={accent} />
              copy
            </div>
          </div>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
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

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
);

const ClipboardIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width={11} height={11} viewBox="0 0 16 16">
    <rect
      x={4}
      y={2}
      width={8}
      height={3}
      rx={1}
      fill="none"
      stroke={color}
      strokeWidth={1.4}
    />
    <rect
      x={3}
      y={4}
      width={10}
      height={11}
      rx={1.5}
      fill="none"
      stroke={color}
      strokeWidth={1.4}
    />
  </svg>
);

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}
