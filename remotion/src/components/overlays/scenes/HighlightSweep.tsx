/**
 * HighlightSweep — visual metaphor for "this is the important part",
 * "annotation", "marker emphasis".
 *
 * A short phrase displayed in a glass card; the operative word (or
 * substring) gets a soft marker-highlight sweep that scales-out from
 * left to right and stays. Like grabbing a yellow highlighter to mark
 * the keyword. The marker is brand-tinted by default.
 *
 * Use cases:
 *   - "החלק החשוב פה הוא ה-X" → "...the important part is X" with X highlighted
 *   - "the magic is in the consistency" → "consistency" highlighted
 *   - "תזכרו רק את זה" → 1-word emphasis
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
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface HighlightSweepScene {
  type: "highlight_sweep";
  id: string;
  start: number;
  end: number;
  /** Full sentence (or short phrase). */
  text: string;
  /** Substring inside `text` to highlight. Must appear in `text`. */
  highlight: string;
  /** Optional eyebrow. e.g. "REMEMBER THIS", "תזכרו". */
  eyebrow?: string;
  /** Tone — marker color. Default "brand". */
  tone?: Tone;
  /** RTL? Auto-detected from Hebrew chars. */
  rtl?: boolean;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: HighlightSweepScene;
}

export const HighlightSweep: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const rtl = scene.rtl ?? isHebrew(scene.text);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });

  // Marker sweep starts at 0.65s, takes 0.55s
  const sweepT = interpolate(
    frame,
    [Math.round(0.65 * fps), Math.round(1.20 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("glide"),
    },
  );

  // Split the text into [before, highlight, after] for inline marker
  const idx = scene.text.indexOf(scene.highlight);
  const before = idx >= 0 ? scene.text.slice(0, idx) : scene.text;
  const hl = idx >= 0 ? scene.highlight : "";
  const after = idx >= 0 ? scene.text.slice(idx + scene.highlight.length) : "";

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          {/* DE-BOXED (law 2, owner directive): the punchline is FREE
              typography — no glass card. The heavy dark text-shadow (law 1)
              carries contrast on any background; the marker sweep is a
              highlight, not a box. */}
          {scene.eyebrow && (
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 28,
                marginBottom: 12,
                color: accent,
                textAlign: "center",
                direction: isHebrew(scene.eyebrow) ? "rtl" : "ltr",
                textShadow: `0 0 20px ${accentGlow}, 0 2px 10px rgba(0,0,0,0.85)`,
                letterSpacing: isHebrew(scene.eyebrow) ? "0" : "0.1em",
              }}
            >
              {scene.eyebrow}
            </div>
          )}

          <div
            style={{
              ...TYPE.sectionTitle,
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.28,
              color: COLORS.text,
              fontFamily: FONTS.display,
              letterSpacing: "-0.01em",
              textAlign: "center",
              direction: rtl ? "rtl" : "ltr",
              maxWidth: 780,
              textShadow:
                "0 2px 6px rgba(0,0,0,0.9), 0 6px 24px rgba(0,0,0,0.7), 0 0 40px rgba(0,0,0,0.5)",
            }}
          >
            {before}
            <span
              style={{
                position: "relative",
                display: "inline-block",
                padding: "0 6px",
                zIndex: 1,
              }}
            >
              {/* The marker swipe (sits behind the text) */}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  inset: "8% -6px",
                  background: `linear-gradient(180deg, ${accent}88 0%, ${accent}CC 70%, ${accent}88 100%)`,
                  borderRadius: 5,
                  transformOrigin: rtl ? "right center" : "left center",
                  transform: `scaleX(${sweepT})`,
                  zIndex: -1,
                  filter: `blur(0.6px) drop-shadow(0 0 14px ${accentGlow})`,
                  willChange: "transform",
                }}
              />
              <span style={{ position: "relative", zIndex: 2 }}>{hl}</span>
            </span>
            {after}
          </div>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
            <HaloGlow
              tone={tone}
              size={680}
              intensity={0.4}
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
