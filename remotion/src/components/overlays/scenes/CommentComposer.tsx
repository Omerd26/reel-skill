/**
 * CommentComposer — CTA pre-visualization (JATHO_PLAYBOOK §5.7).
 *
 * Reference: DUDyNkajSDl t029-t030 — "the transaction is PRE-VISUALIZED so
 * the viewer watches it succeed before doing it": an iOS-style composer bar
 * live-types the exact Hebrew ManyChat keyword letter-by-letter, then the
 * send arrow gets a press state + brief ripple. Pair with a follow-up
 * `notification_card` ("הנה ה־___ שלך") in the plan.
 *
 * Skeuomorphic UI is explicitly allowed here (BROLL_STYLE_SPEC law 6 —
 * press states on real-looking UI). Chest-level anchor ("above-captions")
 * so it sits between the face and the caption zone, where a real composer
 * would be framed between the speaker's hands.
 *
 * Deterministic, frame-driven. Typewriter uses string slicing per the
 * remotion-best-practices text-animations rule (never per-char opacity).
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance } from "../motion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
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

export interface CommentComposerScene {
  type: "comment_composer";
  id: string;
  start: number;
  end: number;
  /** The Hebrew ManyChat comment keyword — types on letter-by-letter. */
  keyword: string;
  /** Dim placeholder shown before typing. Default "הוספת תגובה...". */
  prompt_text?: string;
  /** Tone — send button + caret accent. Default "brand". */
  tone?: Tone;
  /** Field material. Default "solid-dark": the light "liquid" glass put white text on a
   *  bright wall and the keyword was unreadable (real take, 13.9.2026). */
  material?: "liquid" | "frosted" | "solid-dark";
  /** Anchor. Default "above-captions" — chest level, below the chin. */
  anchor?: OverlayAnchor;
  /** RTL. Default true (Hebrew keywords). */
  rtl?: boolean;
  transcript_phrase?: string;
  rationale?: string;
  /** Planner sync metadata (JATHO §2) — carried through, ignored here. */
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: CommentComposerScene;
}

/** Frames per typed character (~3 = confident human-fast typing at 30fps). */
const CHAR_FRAMES = 3;

export const CommentComposer: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const rtl = scene.rtl ?? true;
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const placeholder = scene.prompt_text ?? "הוספת תגובה...";
  const keyword = scene.keyword;

  const entrance = useEntrance({ signature: "glass-rise", durationSec: 0.45 });

  // ── Type-on: starts at 0.8s, string slicing, ~3 frames per char ────────────
  const typeStart = Math.round(0.8 * fps);
  const typedCount = Math.min(
    keyword.length,
    Math.max(0, Math.floor((frame - typeStart) / CHAR_FRAMES)),
  );
  const typed = keyword.slice(0, typedCount);
  const typingDone = typedCount >= keyword.length && keyword.length > 0;

  // ── Send press: a beat after typing lands ──────────────────────────────────
  const typeEnd = typeStart + keyword.length * CHAR_FRAMES;
  const pressStart = typeEnd + Math.round(0.35 * fps);
  const pressIn = interpolate(frame, [pressStart, pressStart + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("whip-out"),
  });
  const pressOut = interpolate(frame, [pressStart + 4, pressStart + 11], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("confident"),
  });
  const pressPulse = pressIn * pressOut; // 0 → 1 → 0

  // Ripple expands from the send button right as the press lands.
  const rippleStart = pressStart + 3;
  const rippleT = interpolate(
    frame,
    [rippleStart, rippleStart + Math.round(0.5 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
  );

  // ── Caret: solid while typing, blinking while idle, gone after send ────────
  const caretAlive = frame < pressStart + 2;
  const idle = frame < typeStart || typingDone;
  const caretVisible = caretAlive && (!idle || Math.floor(frame / 8) % 2 === 0);

  // Send button activates on the first typed character (state change).
  const active = typedCount > 0;

  const caret = (
    <span
      aria-hidden
      style={{
        width: 3,
        height: 36,
        borderRadius: 2,
        background: accent,
        boxShadow: `0 0 8px ${accentGlow}`,
        opacity: caretVisible ? 1 : 0,
        flexShrink: 0,
      }}
    />
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={entrance}>
          <div
            style={{
              ...glassStyle(scene.material ?? "solid-dark"),
              width: 660,
              borderRadius: RADIUS.pill,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              direction: rtl ? "rtl" : "ltr",
            }}
          >
            {/* Text field area */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 12px",
                overflow: "hidden",
              }}
            >
              {typedCount === 0 ? (
                <>
                  {caret}
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 30,
                      fontWeight: 500,
                      color: COLORS.textTertiary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {placeholder}
                  </span>
                </>
              ) : (
                <>
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 32,
                      fontWeight: 700,
                      color: COLORS.text,
                      letterSpacing: "0.01em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {typed}
                  </span>
                  {caret}
                </>
              )}
            </div>

            {/* Send button + press ripple */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              {rippleT > 0 && rippleT < 1 && (
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 60 + 92 * rippleT,
                    height: 60 + 92 * rippleT,
                    transform: "translate(-50%, -50%)",
                    borderRadius: "50%",
                    border: `2px solid ${accent}`,
                    opacity: 0.55 * (1 - rippleT),
                    pointerEvents: "none",
                  }}
                />
              )}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: active
                    ? `linear-gradient(135deg, ${accent}, ${darken(accent, 0.2)})`
                    : "rgba(255,255,255,0.10)",
                  border: active ? "none" : `1px solid ${COLORS.borderHairline}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${1 - 0.16 * pressPulse})`,
                  filter:
                    pressPulse > 0.01
                      ? `brightness(${1 - 0.2 * pressPulse})`
                      : undefined,
                  boxShadow: active
                    ? `0 0 ${14 + 12 * pressPulse}px ${accentGlow}`
                    : "none",
                }}
              >
                <svg viewBox="0 0 24 24" width={30} height={30}>
                  <path
                    d="M12 19 L12 6 M6 11.5 L12 5.5 L18 11.5"
                    stroke={active ? "#FFFFFF" : "rgba(255,255,255,0.45)"}
                    strokeWidth={2.6}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function darken(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
