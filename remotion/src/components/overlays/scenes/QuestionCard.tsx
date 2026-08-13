/**
 * QuestionCard — the ~10s chapter-divider re-hook.
 *
 * JATHO_PLAYBOOK §1.4: "But why is this so good?" placed exactly at the
 * retention-dip point (~10s) and again at ~45%. §3.2: "Build `question_card`
 * — full-caption question".
 *
 * DESIGN — deliberately NOT a card, NOT a box (owner directive 2026-08-08:
 * "אני לא אוהב את הריבועים האלה"). Free typography in the de-boxed TitlePill
 * language from BRollOverlay.tsx: Heebo 900 white, ONE accent word in brand
 * color with a glow halo, dark text-shadow for legibility on any footage,
 * 3-frame directional blur-streak entrance. SHOUT register: heavy weight.
 * A large soft "?" glyph echoes behind the line at low opacity.
 *
 * Exit: short fade + scale-down (task-specified exception to the
 * "transitions own exits" rule — a chapter divider must clear the stage).
 *
 * Deterministic, frame-driven. No Math.random, no Date.now, no CSS
 * transitions/animations.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { FONTS, easeFn, toneColor, type Tone } from "../../../design/tokens";

export interface QuestionCardScene {
  type: "question_card";
  id: string;
  start: number;
  end: number;
  /** The question line, e.g. "אבל למה זה עובד?". */
  question: string;
  /** Word inside `question` rendered in brand color + glow. Optional —
   * falls back to the TitlePill heuristic (digit word, else longest). */
  accent_word?: string;
  /** Tone for the accent word. Default "brand". */
  tone?: Tone;
  /** Anchor. Default "top-center" — upper third, never over the face. */
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  /** Planner sync metadata (JATHO §2) — carried through, ignored here. */
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: QuestionCardScene;
}

export const QuestionCard: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentRgb = hexToRgb(accent);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const sceneFrames = Math.max(1, Math.round((scene.end - scene.start) * fps));

  // Blur-streak entrance — the TitlePill language: frames 0-8 blur out,
  // frames 0-12 rise + fade in.
  const progress = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeFn("confident"),
  });
  const entranceBlur = interpolate(frame, [0, 8], [14, 0], {
    extrapolateRight: "clamp",
  });

  // Short exit: fade + scale-down over the last ~10 frames.
  const exitStart = Math.max(14, sceneFrames - 10);
  const exitT = interpolate(
    frame,
    [exitStart, Math.max(exitStart + 1, sceneFrames - 2)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("whip-in") },
  );

  // The "?" glyph echo — delayed fade-in + slow deterministic breathing.
  const glyphIn = interpolate(frame, [4, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("glass-rise"),
  });
  const breath = 0.5 + 0.5 * Math.sin(((frame / fps) * Math.PI * 2) / 5.2);
  const glyphScale = 1 + 0.05 * breath;

  // Pick ONE accent word: explicit accent_word first, then a token with a
  // digit, then the longest word (same heuristic as BRollOverlay TitlePill).
  const words = scene.question.split(/\s+/).filter(Boolean);
  let accentIdx = scene.accent_word
    ? words.findIndex((w) => w.includes(scene.accent_word as string))
    : -1;
  if (accentIdx < 0) {
    accentIdx = words.findIndex((w) => /\d/.test(w));
  }
  if (accentIdx < 0 && words.length > 1) {
    accentIdx = words.reduce(
      (best, w, i) => (w.length > words[best].length ? i : best),
      0,
    );
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            position: "relative",
            opacity: progress * (1 - exitT),
            transform: `translateY(${interpolate(progress, [0, 1], [-24, 0])}px) scale(${1 - 0.06 * exitT})`,
            filter: entranceBlur > 0.5 ? `blur(${entranceBlur * 0.4}px)` : undefined,
          }}
        >
          {/* Large soft question-mark glyph echo — behind, low opacity */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -180,
              left: "50%",
              transform: `translateX(-50%) rotate(-8deg) scale(${glyphScale})`,
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 520,
              lineHeight: 1,
              color: "rgba(255,255,255,0.05)",
              textShadow: `0 0 90px rgba(${accentRgb},0.14)`,
              opacity: glyphIn,
              filter: "blur(2px)",
              pointerEvents: "none",
            }}
          >
            ?
          </div>

          {/* The question — big free typography, no box */}
          <div
            style={{
              position: "relative",
              direction: "rtl",
              textAlign: "center",
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 84,
              lineHeight: 1.18,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
              textShadow: "0 4px 30px rgba(0,0,0,0.85), 0 1px 6px rgba(0,0,0,0.6)",
              padding: "0 24px",
            }}
          >
            {words.map((w, i) => (
              <React.Fragment key={i}>
                {i > 0 ? " " : ""}
                {i === accentIdx ? (
                  <span
                    style={{
                      color: accent,
                      textShadow: `0 0 24px rgba(${accentRgb},0.55), 0 0 60px rgba(${accentRgb},0.25), 0 4px 30px rgba(0,0,0,0.85)`,
                    }}
                  >
                    {w}
                  </span>
                ) : (
                  w
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  if (!hex.startsWith("#") || hex.length !== 7) return "224,112,30";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
