/**
 * SearchAutocomplete — visual metaphor for "find", "search", "discover".
 *
 * A search bar with a typing cursor — letters of the query type in one by
 * one. Once typing settles, a dropdown of suggestions cascades in beneath.
 * One suggestion can highlight at the end (the chosen result).
 *
 * Use cases:
 *   - "מחפשים פתרון?" → search bar typing "AI marketing"
 *   - "תוצאות מיידיות" → search + 3 suggestions appear
 *   - "Google זה" → search bar + result list
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

export interface SearchAutocompleteScene {
  type: "search_autocomplete";
  id: string;
  start: number;
  end: number;
  /** The query that gets typed in. e.g. "AI marketing", "פתרון אוטומטי". */
  query: string;
  /** Suggestions that appear under. */
  suggestions: string[];
  /** Optional index (0-based) of suggestion to highlight at end. */
  selected_index?: number;
  /** Eyebrow above. */
  eyebrow?: string;
  /** Tone — colors selected suggestion + cursor. */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: SearchAutocompleteScene;
}

export const SearchAutocomplete: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const isHeb = isHebrew(scene.query);

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Typing — 80ms per char from 0.50s
  const typeStart = Math.round(0.50 * fps);
  const charPerSec = 12;
  const typeFramesPerChar = Math.max(1, Math.round(fps / charPerSec));
  const charsTyped = Math.max(0, Math.min(scene.query.length, Math.floor((frame - typeStart) / typeFramesPerChar)));
  const typedText = scene.query.slice(0, charsTyped);
  const typingDone = charsTyped >= scene.query.length;
  const typingDoneFrame = typeStart + scene.query.length * typeFramesPerChar;

  // Cursor blink (always on while typing, blinks when done)
  const blinkPeriodFrames = Math.max(1, Math.round(fps * 0.5));
  const cursorVisible = typingDone
    ? Math.floor(frame / blinkPeriodFrames) % 2 === 0
    : true;

  // Suggestions cascade after typing done + 0.10s
  const suggestionStart = typingDoneFrame + Math.round(0.10 * fps);
  const suggestions = scene.suggestions.slice(0, 4);

  // Selection highlight (after all suggestions revealed)
  const selectStart =
    suggestionStart +
    suggestions.length * Math.round(0.10 * fps) +
    Math.round(0.20 * fps);
  const selectT = interpolate(
    frame,
    [selectStart, selectStart + Math.round(0.25 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard material="liquid" padding="22px 26px" rtl={isHeb} style={{ minWidth: 380 }}>
            {scene.eyebrow && (
              <Eyebrow tone={tone} script={isHeb ? "hebrew" : "latin"} style={{ fontSize: 18, marginBottom: 14 }}>
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Search input */}
            <div
              style={{
                padding: "14px 18px",
                borderRadius: RADIUS.pill,
                background: "rgba(0,0,0,0.30)",
                border: `1.5px solid ${accent}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 16px ${accentGlow}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                direction: isHeb ? "rtl" : "ltr",
              }}
            >
              {/* Search icon */}
              <svg width={20} height={20} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <circle cx={10} cy={10} r={6.5} fill="none" stroke={accent} strokeWidth={2.5} />
                <line x1={15} y1={15} x2={20} y2={20} stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
              </svg>

              {/* Typed text + cursor */}
              <div
                style={{
                  ...TYPE.body,
                  fontSize: 22,
                  fontWeight: 600,
                  color: COLORS.text,
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {typedText}
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 22,
                    marginLeft: 2,
                    background: accent,
                    verticalAlign: "middle",
                    opacity: cursorVisible ? 1 : 0,
                    boxShadow: `0 0 6px ${accentGlow}`,
                  }}
                />
              </div>
            </div>

            {/* Suggestions dropdown */}
            <div
              style={{
                marginTop: 8,
                borderRadius: RADIUS.md,
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              {suggestions.map((s, i) => {
                const sStart = suggestionStart + i * Math.round(0.10 * fps);
                const sT = interpolate(
                  frame,
                  [sStart, sStart + Math.round(0.20 * fps)],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
                );
                const isSelected = scene.selected_index === i;
                return (
                  <div
                    key={`sg-${i}`}
                    style={{
                      padding: "12px 18px",
                      borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      ...TYPE.body,
                      fontSize: 20,
                      fontWeight: isSelected && selectT > 0 ? 800 : 500,
                      color: isSelected && selectT > 0 ? "#FFFFFF" : COLORS.textSecondary,
                      background:
                        isSelected && selectT > 0
                          ? `linear-gradient(135deg, ${withAlpha(accent, 0.30)}, ${withAlpha(accent, 0.10)})`
                          : "transparent",
                      borderLeft:
                        isSelected && selectT > 0 ? `3px solid ${accent}` : "3px solid transparent",
                      opacity: sT,
                      transform: `translateY(${(1 - sT) * -8}px)`,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <SearchIconSmall accent={accent} />
                    <span style={{ flex: 1 }}>{s}</span>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }}>
            <HaloGlow tone={tone} size={520} intensity={0.4} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SearchIconSmall: React.FC<{ accent: string }> = ({ accent }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.6 }}>
    <circle cx={10} cy={10} r={6.5} fill="none" stroke={accent} strokeWidth={2} />
    <line x1={15} y1={15} x2={20} y2={20} stroke={accent} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
