/**
 * BadgeStack — pill cluster cascade.
 *
 * For "feature checklist" beats, "what we do" lists, capability summaries.
 * Pills cascade in with stack-cascade entrance, staggered tightly (60-90ms)
 * so the whole sequence completes in <500ms (Hyperframes rule).
 *
 * Each pill is a frosted-glass capsule with optional status dot. Tone
 * controls border + dot color.
 */
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { useEntrance, staggerOffset } from "../motion";
import { Eyebrow, resolveAnchor } from "../primitives";
import {
  COLORS,
  RADIUS,
  TYPE,
  glassStyle,
  toneColor,
  type Tone,
} from "../../../design/tokens";
import type { BadgeStackScene, BadgePillItem } from "../types";

interface Props {
  scene: BadgeStackScene;
}

export const BadgeStack: React.FC<Props> = ({ scene }) => {
  const layout = scene.layout ?? "wrap";
  // Badge stacks are wide and short — anchor top-center keeps them above
  // the speaker's head and out of the caption zone.
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const headlineEntrance = useEntrance({
    signature: "fade",
    durationSec: 0.30,
    offsetFrames: 0,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
          }}
        >
          {scene.headline && (
            <div style={headlineEntrance}>
              <Eyebrow
                tone="neutral"
                script={isHebrew(scene.headline) ? "hebrew" : "latin"}
                style={{ fontSize: 26 }}
              >
                {scene.headline}
              </Eyebrow>
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: layout === "vertical" ? "column" : "row",
              flexWrap: layout === "wrap" ? "wrap" : "nowrap",
              gap: 14,
              maxWidth: 920,
              justifyContent: "center",
            }}
          >
            {scene.items.map((item, i) => (
              <BadgePill key={`pill-${i}`} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Single pill ──────────────────────────────────────────────────────────────

const BadgePill: React.FC<{ item: BadgePillItem; index: number }> = ({
  item,
  index,
}) => {
  const { fps } = useVideoConfig();
  const offsetFrames = Math.round(0.20 * fps) + staggerOffset(index, fps, 70);

  const entrance = useEntrance({
    signature: "stack-cascade",
    ease: "bounce-soft",
    durationSec: 0.40,
    offsetFrames,
  });

  const tone: Tone = item.tone ?? "neutral";
  const accent = tone === "neutral" ? COLORS.borderGlass : toneColor(tone);

  return (
    <div
      style={{
        ...entrance,
        ...glassStyle("frosted"),
        // Law 1: chips read on any background — solid dark, never see-through.
        background: "linear-gradient(180deg, #23242C 0%, #17181E 100%)",
        borderRadius: RADIUS.pill,
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: `1.5px solid ${accent}`,
        boxShadow: "0 10px 26px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)",
      }}
    >
      {item.dot && (
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 8px ${accent}`,
          }}
        />
      )}
      <span
        style={{
          ...TYPE.body,
          fontSize: 24,
          fontWeight: 600,
          color: COLORS.text,
        }}
      >
        {item.text}
      </span>
    </div>
  );
};

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}
