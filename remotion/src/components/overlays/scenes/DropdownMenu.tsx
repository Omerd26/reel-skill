/**
 * DropdownMenu — visual metaphor for "options", "menu", "many ways".
 *
 * A trigger button at the top, a dropdown panel that opens beneath with
 * cascading items revealing top-to-bottom. One item highlights at the end
 * to show the selection.
 *
 * Use cases:
 *   - "המון אפשרויות" → 4 items reveal, none selected
 *   - "תבחר את הסגנון" → items reveal, last one highlights
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

export interface DropdownMenuScene {
  type: "dropdown_menu";
  id: string;
  start: number;
  end: number;
  /** Trigger button label. e.g. "סגנון" / "STYLE". */
  trigger_label: string;
  /** Menu items. */
  items: string[];
  /** Optional index (0-based) of the item to highlight at end. */
  selected_index?: number;
  /** Tone — colors trigger + selected item. */
  tone?: Tone;
  /** Optional eyebrow above. */
  eyebrow?: string;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: DropdownMenuScene;
}

export const DropdownMenu: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const items = scene.items.slice(0, 5);
  const isHeb = isHebrew(scene.trigger_label);

  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Trigger button "press" at 0.55s, then dropdown opens
  const triggerPressFrame = Math.round(0.55 * fps);
  const triggerScale = interpolate(
    frame,
    [triggerPressFrame, triggerPressFrame + 3, triggerPressFrame + 8],
    [1, 0.95, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Dropdown opens at 0.65s
  const openStart = triggerPressFrame + 5;
  const openT = interpolate(
    frame,
    [openStart, openStart + Math.round(0.35 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
  );

  // Item stagger reveal
  const itemStartFrame = openStart + Math.round(0.20 * fps);
  const itemGapFrames = Math.round(0.08 * fps);

  // Selection highlight (after all items revealed)
  const selectStart = itemStartFrame + items.length * itemGapFrames + Math.round(0.20 * fps);
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
          <GlassCard material="liquid" padding="22px 26px" rtl={isHeb} style={{ minWidth: 320 }}>
            {scene.eyebrow && (
              <Eyebrow tone={tone} script={isHeb ? "hebrew" : "latin"} style={{ fontSize: 18, marginBottom: 14 }}>
                {scene.eyebrow}
              </Eyebrow>
            )}

            {/* Trigger button */}
            <div
              style={{
                padding: "12px 18px",
                borderRadius: RADIUS.md,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.16)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                transform: `scale(${triggerScale})`,
                willChange: "transform",
              }}
            >
              <span style={{ ...TYPE.body, fontSize: 22, fontWeight: 700, color: COLORS.text }}>
                {scene.trigger_label}
              </span>
              <ChevronDownIcon rotation={openT * 180} />
            </div>

            {/* Dropdown */}
            <div
              style={{
                marginTop: 6,
                borderRadius: RADIUS.md,
                background: "rgba(0,0,0,0.30)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.45)",
                overflow: "hidden",
                maxHeight: openT * (items.length * 52 + 12),
                opacity: openT,
                transformOrigin: "top center",
                transform: `scaleY(${0.6 + 0.4 * openT})`,
                willChange: "max-height, opacity, transform",
              }}
            >
              {items.map((item, i) => {
                const itemT = interpolate(
                  frame,
                  [itemStartFrame + i * itemGapFrames, itemStartFrame + i * itemGapFrames + Math.round(0.20 * fps)],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
                );
                const isSelected = scene.selected_index === i;

                return (
                  <div
                    key={`item-${i}`}
                    style={{
                      padding: "14px 18px",
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
                        isSelected && selectT > 0
                          ? `3px solid ${accent}`
                          : "3px solid transparent",
                      opacity: itemT,
                      transform: `translateY(${(1 - itemT) * -8}px)`,
                      willChange: "opacity, transform",
                      boxShadow: isSelected && selectT > 0 ? `inset 0 0 18px ${withAlpha(accent, 0.2)}` : "none",
                    }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <div style={{ position: "absolute", inset: 0, opacity: 0.35 + selectT * 0.2, pointerEvents: "none" }}>
            <HaloGlow tone={tone} size={500} intensity={0.4} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ChevronDownIcon: React.FC<{ rotation: number }> = ({ rotation }) => (
  <svg
    width={20}
    height={20}
    viewBox="0 0 20 20"
    style={{ transform: `rotate(${rotation}deg)`, willChange: "transform" }}
  >
    <path
      d="M 5 7 L 10 13 L 15 7"
      fill="none"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
